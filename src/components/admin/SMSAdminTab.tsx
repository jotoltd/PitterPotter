import { useState, useEffect, useCallback } from 'react';
import { Send, DollarSign, BarChart3, Phone, RefreshCw, Check, X, AlertCircle, MessageSquare, Activity, Bell } from 'lucide-react';
import { Staff, SMSTemplate } from '../../types';
import { isSupabaseEnabled } from '../../lib/supabase';
import Skeleton from '../Skeleton';

interface SMSAdminTabProps {
  staff: Staff;
}

interface BalanceData {
  balance: string;
  currency: string;
}

interface UsageData {
  count: number;
  totalCost: string;
  currency: string;
  recent: {
    to: string;
    body: string;
    status: string;
    direction: string;
    dateSent: string | null;
    price: string | null;
    errorCode: number | null;
    errorMessage: string | null;
  }[];
}

interface SMSLog {
  id: string;
  email_type: string;
  recipient: string;
  subject: string | null;
  body: string | null;
  resend_id: string | null;
  status: string;
  booking_id: string | null;
  error_code: number | null;
  error_message: string | null;
  created_at: string;
}

export default function SMSAdminTab({ staff }: SMSAdminTabProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [usageError, setUsageError] = useState<string | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [usageDays, setUsageDays] = useState(30);

  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Test from Pitter Potter admin — your SMS is working!');
  const [testStudio, setTestStudio] = useState<'Putney' | 'Wimbledon'>('Putney');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [smsLogsLoading, setSmsLogsLoading] = useState(true);
  const [resendingSmsId, setResendingSmsId] = useState<string | null>(null);
  const [smsResendResult, setSmsResendResult] = useState<{ id: string; success: boolean; message: string } | null>(null);
  const [lowBalanceAlert, setLowBalanceAlert] = useState<string | null>(null);
  const [webhookHealth, setWebhookHealth] = useState<{ resendLast: string | null; twilioLast: string | null; totalEvents: number; alerts: string[] } | null>(null);
  const [webhookHealthLoading, setWebhookHealthLoading] = useState(false);

  const fetchSmsLogs = useCallback(async () => {
    setSmsLogsLoading(true);
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'smsLogs', staff: { username: staff.username, sessionToken: staff.sessionToken } }),
      });
      const data = await res.json();
      if (data.logs) setSmsLogs(data.logs);
    } catch { /* ignore */ } finally { setSmsLogsLoading(false); }
  }, [staff]);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    setBalanceError(null);
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) {
        setBalanceError('Supabase not configured');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'balance', staff: { username: staff.username, sessionToken: staff.sessionToken } }),
      });
      const data = await res.json();
      if (data.error) {
        setBalanceError(data.error);
      } else {
        setBalance(data);
      }
    } catch {
      setBalanceError('Failed to fetch balance');
    } finally {
      setBalanceLoading(false);
    }
  }, [staff]);

  const fetchUsage = useCallback(async (days: number) => {
    setUsageLoading(true);
    setUsageError(null);
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) {
        setUsageError('Supabase not configured');
        return;
      }
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'usage', days, staff: { username: staff.username, sessionToken: staff.sessionToken } }),
      });
      const data = await res.json();
      if (data.error) {
        setUsageError(data.error);
      } else {
        setUsage(data);
      }
    } catch {
      setUsageError('Failed to fetch usage');
    } finally {
      setUsageLoading(false);
    }
  }, [staff]);

  useEffect(() => {
    fetchBalance();
    fetchUsage(usageDays);
    fetchSmsLogs();
  }, [fetchBalance, fetchUsage, fetchSmsLogs, usageDays]);

  useEffect(() => {
    if (balance && parseFloat(balance.balance) < 10) {
      setLowBalanceAlert(`Twilio balance is low: ${balance.currency === 'USD' ? '$' : balance.currency + ' '}${balance.balance}`);
    } else {
      setLowBalanceAlert(null);
    }
  }, [balance]);

  const fetchWebhookHealth = useCallback(async () => {
    setWebhookHealthLoading(true);
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) return;
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'webhookHealth', hours: 24, staff: { username: staff.username, sessionToken: staff.sessionToken } }),
      });
      const data = await res.json();
      if (!data.error) setWebhookHealth(data);
    } catch { /* ignore */ } finally { setWebhookHealthLoading(false); }
  }, [staff]);

  useEffect(() => {
    fetchWebhookHealth();
  }, [fetchWebhookHealth]);

  const handleResendSms = async (log: SMSLog) => {
    setResendingSmsId(log.id);
    setSmsResendResult(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ action: 'resendSMS', logId: log.id, staff: { username: staff.username, sessionToken: staff.sessionToken } }),
      });
      const data = await res.json();
      setSmsResendResult({ id: log.id, success: data.success !== false, message: data.success !== false ? 'SMS resent successfully' : (data.error || 'Failed to resend') });
      if (data.success !== false) { fetchSmsLogs(); fetchBalance(); }
    } catch {
      setSmsResendResult({ id: log.id, success: false, message: 'Failed to resend' });
    } finally {
      setResendingSmsId(null);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim() || !testMessage.trim()) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          action: 'send',
          to: testPhone.trim(),
          message: testMessage.trim(),
          studio: testStudio,
          staff: { username: staff.username, sessionToken: staff.sessionToken },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ success: true, message: 'SMS sent successfully!' });
        fetchUsage(usageDays);
        fetchBalance();
      } else {
        setSendResult({ success: false, message: data.error || 'Failed to send SMS' });
      }
    } catch {
      setSendResult({ success: false, message: 'Failed to send SMS' });
    } finally {
      setSending(false);
    }
  };

  const twilioNumber = import.meta.env.VITE_TWILIO_PHONE_NUMBER;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-black text-[#1B2D3C] flex items-center gap-2">
          <MessageSquare className="w-5 h-5" /> SMS Management
        </h2>
        <p className="text-xs text-[#1B2D3C]/60 mt-1">
          Send test SMS, check balance, and view usage via Twilio.
        </p>
      </div>

      {/* Balance card */}
      <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5">
            <DollarSign className="w-4 h-4" /> Twilio Balance
          </h3>
          <button
            onClick={fetchBalance}
            className="p-1.5 rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer"
            disabled={balanceLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1B2D3C]/50 ${balanceLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {balanceLoading ? (
          <Skeleton className="h-12" />
        ) : balanceError ? (
          <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
            <AlertCircle className="w-4 h-4" /> {balanceError}
          </div>
        ) : balance ? (
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1B2D3C]">{balance.currency === 'USD' ? '$' : balance.currency + ' '}{balance.balance}</span>
            <span className="text-xs font-semibold text-[#1B2D3C]/40">current balance</span>
          </div>
        ) : null}
      </div>

      {/* Send test SMS */}
      <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
        <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5 mb-3">
          <Send className="w-4 h-4" /> Send Test SMS
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50 mb-1 block">Phone number</label>
            <div className="relative">
              <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1B2D3C]/40" />
              <input
                type="tel"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+44xxxxxxxxxx"
                className="w-full pl-8 pr-3 py-2 text-xs font-semibold text-[#1B2D3C] bg-white border border-[#1B2D3C]/15 rounded-lg focus:outline-none focus:border-[#1B2D3C]/40"
              />
            </div>
            <p className="text-[10px] text-[#1B2D3C]/40 mt-1">Include country code (e.g. +44 for UK)</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50 mb-1 block">Send from</label>
            <div className="flex rounded-lg border border-[#1B2D3C]/15 overflow-hidden">
              {(['Putney', 'Wimbledon'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setTestStudio(s)}
                  className={`px-3 py-2 text-[10px] font-bold transition-all cursor-pointer ${
                    testStudio === s ? 'bg-[#DBE7E4] text-[#1B2D3C]' : 'bg-white text-[#1B2D3C]/50 hover:text-[#1B2D3C]'
                  }`}
                >
                  {s === 'Putney' ? 'PitterPotP' : 'PitterPotW'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#1B2D3C]/40 mt-1">Alphanumeric sender ID shown on recipient's phone</p>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50 mb-1 block">Message</label>
            <textarea
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full px-3 py-2 text-xs font-semibold text-[#1B2D3C] bg-white border border-[#1B2D3C]/15 rounded-lg focus:outline-none focus:border-[#1B2D3C]/40 resize-none"
            />
            <p className="text-[10px] text-[#1B2D3C]/40 mt-1">{testMessage.length}/160 characters</p>
          </div>
          {sendResult && (
            <div className={`flex items-center gap-2 text-xs font-semibold ${sendResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
              {sendResult.success ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
              {sendResult.message}
            </div>
          )}
          <button
            onClick={handleSendTest}
            disabled={sending || !testPhone.trim() || !testMessage.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#1B2D3C] text-white text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-[#243B53] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5" />
            {sending ? 'Sending…' : 'Send SMS'}
          </button>
        </div>
      </div>

      {/* Low balance alert */}
      {lowBalanceAlert && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-bold text-amber-700">{lowBalanceAlert}</p>
        </div>
      )}

      {/* Webhook Health */}
      <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4" /> Webhook Health
          </h3>
          <button
            onClick={fetchWebhookHealth}
            className="p-1.5 rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer"
            disabled={webhookHealthLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1B2D3C]/50 ${webhookHealthLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {webhookHealthLoading ? (
          <Skeleton className="h-16" />
        ) : webhookHealth ? (
          <div className="space-y-2">
            {webhookHealth.alerts.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                {webhookHealth.alerts.map((alert, i) => (
                  <p key={i} className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> {alert}
                  </p>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Resend (Email)</p>
                <p className="text-xs font-bold text-[#1B2D3C] mt-1">
                  {webhookHealth.resendLast ? new Date(webhookHealth.resendLast).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </p>
              </div>
              <div className="bg-stone-50 rounded-lg p-3">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Twilio (SMS)</p>
                <p className="text-xs font-bold text-[#1B2D3C] mt-1">
                  {webhookHealth.twilioLast ? new Date(webhookHealth.twilioLast).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-[#1B2D3C]/40 font-semibold">Total webhook events (24h): {webhookHealth.totalEvents}</p>
          </div>
        ) : (
          <p className="text-xs text-[#1B2D3C]/40">Unable to load webhook health</p>
        )}
      </div>

      {/* Delivery Logs */}
      <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5">
            <Check className="w-4 h-4" /> Delivery Logs
          </h3>
          <button
            onClick={fetchSmsLogs}
            className="p-1.5 rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer"
            disabled={smsLogsLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#1B2D3C]/50 ${smsLogsLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {smsLogsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : smsLogs.length === 0 ? (
          <p className="text-xs text-[#1B2D3C]/40 font-semibold py-4 text-center">No SMS logs yet</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {smsLogs.map(log => (
              <div key={log.id} className="border border-[#1B2D3C]/10 rounded-lg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3 h-3 text-[#1B2D3C]/40" />
                    <span className="text-xs font-bold text-[#1B2D3C]">{log.recipient}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                      log.status === 'delivered' ? 'bg-emerald-100 text-emerald-800'
                      : log.status === 'sent' ? 'bg-blue-100 text-blue-800'
                      : log.status === 'queued' ? 'bg-amber-100 text-amber-800'
                      : log.status === 'failed' || log.status === 'undelivered' ? 'bg-red-100 text-red-700'
                      : 'bg-stone-100 text-stone-600'
                    }`}>
                      {log.status}
                    </span>
                    {(log.status === 'failed' || log.status === 'undelivered') && (
                      <button
                        onClick={() => handleResendSms(log)}
                        disabled={resendingSmsId === log.id}
                        className="p-1 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer disabled:opacity-40"
                        title="Resend SMS"
                      >
                        {resendingSmsId === log.id ? (
                          <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin" />
                        ) : (
                          <Send className="w-3 h-3 text-emerald-600" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-[#1B2D3C]/40 font-semibold">
                  <span>{log.email_type.replace(/_/g, ' ')}</span>
                  <span>{new Date(log.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                  {log.booking_id && <span>Ref: {log.booking_id}</span>}
                </div>
                {log.body && (
                  <p className="text-[10px] text-[#1B2D3C]/60 font-medium bg-stone-50 rounded p-2 mt-1">{log.body}</p>
                )}
                {log.error_message && (
                  <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {log.error_message}
                  </p>
                )}
                {smsResendResult?.id === log.id && (
                  <p className={`text-[9px] font-bold ${smsResendResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                    {smsResendResult.message}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Usage */}
      <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4" /> SMS Usage
          </h3>
          <div className="flex rounded-lg border border-[#1B2D3C]/15 overflow-hidden">
            {[7, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setUsageDays(d)}
                className={`px-2.5 py-1 text-[10px] font-bold transition-all cursor-pointer ${
                  usageDays === d ? 'bg-[#DBE7E4] text-[#1B2D3C]' : 'bg-white text-[#1B2D3C]/50 hover:text-[#1B2D3C]'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
        </div>

        {usageLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
            <Skeleton className="h-8" />
          </div>
        ) : usageError ? (
          <div className="flex items-center gap-2 text-sm text-red-600 font-semibold">
            <AlertCircle className="w-4 h-4" /> {usageError}
          </div>
        ) : usage ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-[#D6E2E9]/30 p-3 rounded-lg">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/60">SMS Sent ({usageDays}d)</p>
                <p className="text-2xl font-black text-[#1B2D3C]">{usage.count}</p>
              </div>
              <div className="bg-[#D6E2E9]/30 p-3 rounded-lg">
                <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/60">Total Cost</p>
                <p className="text-2xl font-black text-[#1B2D3C]">{usage.currency === 'USD' ? '$' : usage.currency + ' '}{usage.totalCost}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/50 mb-2">Recent Messages</h4>
              {usage.recent.length === 0 ? (
                <p className="text-xs text-[#1B2D3C]/40 font-semibold py-4 text-center">No messages sent yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {usage.recent.map((msg, i) => (
                    <div key={i} className="border border-[#1B2D3C]/10 rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 h-3 text-[#1B2D3C]/40" />
                          <span className="text-xs font-bold text-[#1B2D3C]">{msg.to}</span>
                        </div>
                        <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
                          msg.status === 'delivered' ? 'bg-emerald-100 text-emerald-800'
                          : msg.status === 'sent' ? 'bg-blue-100 text-blue-800'
                          : msg.status === 'queued' ? 'bg-amber-100 text-amber-800'
                          : msg.status === 'failed' || msg.status === 'undelivered' ? 'bg-red-100 text-red-700'
                          : 'bg-stone-100 text-stone-600'
                        }`}>
                          {msg.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#1B2D3C]/70 line-clamp-2">{msg.body}</p>
                      <div className="flex items-center gap-3 text-[10px] text-[#1B2D3C]/40 font-semibold">
                        <span>{msg.dateSent ? new Date(msg.dateSent).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Pending'}</span>
                        {msg.price && <span>Cost: {msg.price}</span>}
                        {msg.direction && <span className="uppercase">{msg.direction}</span>}
                      </div>
                      {msg.errorMessage && (
                        <p className="text-[10px] text-red-600 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> {msg.errorMessage}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
