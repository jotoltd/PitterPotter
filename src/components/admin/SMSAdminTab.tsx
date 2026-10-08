import { useState, useEffect, useCallback } from 'react';
import { Send, BarChart3, Phone, RefreshCw, Check, X, AlertCircle, MessageSquare, Activity } from 'lucide-react';
import { Staff } from '../../types';
import { isSupabaseEnabled } from '../../lib/supabase';
import Skeleton from '../Skeleton';

interface SMSAdminTabProps {
  staff: Staff;
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
  const [health, setHealth] = useState<{ resendLast: string | null; smsLast: string | null; smsFailed: number; totalEvents: number; alerts: string[] } | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [provider, setProvider] = useState<'puresms' | 'none' | null>(null);

  const callApi = useCallback(async (payload: Record<string, unknown>) => {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ ...payload, staff: { username: staff.username, sessionToken: staff.sessionToken } }),
    });
    return res.json();
  }, [staff.username, staff.sessionToken]);

  const fetchSmsLogs = useCallback(async () => {
    setSmsLogsLoading(true);
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) return;
      const data = await callApi({ action: 'smsLogs' });
      if (data.logs) setSmsLogs(data.logs);
    } catch { /* ignore */ } finally { setSmsLogsLoading(false); }
  }, [callApi, staff.sessionToken]);

  const fetchProvider = useCallback(async () => {
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) {
        setProvider('none');
        return;
      }
      const data = await callApi({ action: 'provider' });
      setProvider(data.provider || 'none');
    } catch {
      setProvider('none');
    }
  }, [callApi, staff.sessionToken]);

  const fetchUsage = useCallback(async (days: number) => {
    setUsageLoading(true);
    setUsageError(null);
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) {
        setUsageError('Supabase not configured');
        return;
      }
      const data = await callApi({ action: 'usage', days });
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
  }, [callApi, staff.sessionToken]);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      if (!isSupabaseEnabled() || !staff.sessionToken) return;
      const data = await callApi({ action: 'webhookHealth', hours: 24 });
      if (!data.error) setHealth(data);
    } catch { /* ignore */ } finally { setHealthLoading(false); }
  }, [callApi, staff.sessionToken]);

  useEffect(() => {
    fetchProvider();
    fetchSmsLogs();
    fetchHealth();
  }, [fetchProvider, fetchSmsLogs, fetchHealth]);

  useEffect(() => {
    fetchUsage(usageDays);
  }, [fetchUsage, usageDays]);

  const handleResendSms = async (log: SMSLog) => {
    setResendingSmsId(log.id);
    setSmsResendResult(null);
    try {
      const data = await callApi({ action: 'resendSMS', logId: log.id });
      setSmsResendResult({ id: log.id, success: data.success !== false, message: data.success !== false ? 'SMS resent successfully' : (data.error || 'Failed to resend') });
      if (data.success !== false) { fetchSmsLogs(); fetchUsage(usageDays); }
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
      const data = await callApi({
        action: 'send',
        to: testPhone.trim(),
        message: testMessage.trim(),
        studio: testStudio,
      });
      if (data.success) {
        setSendResult({ success: true, message: 'SMS sent successfully!' });
        fetchUsage(usageDays);
        fetchSmsLogs();
      } else {
        setSendResult({ success: false, message: data.error || 'Failed to send SMS' });
      }
    } catch {
      setSendResult({ success: false, message: 'Failed to send SMS' });
    } finally {
      setSending(false);
    }
  };

  const statusBadge = (status: string) => (
    <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-full ${
      status === 'delivered' ? 'bg-emerald-100 text-emerald-800'
      : status === 'sent' ? 'bg-blue-100 text-blue-800'
      : status === 'queued' ? 'bg-amber-100 text-amber-800'
      : status === 'failed' || status === 'undelivered' ? 'bg-red-100 text-red-700'
      : 'bg-stone-100 text-stone-600'
    }`}>
      {status}
    </span>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="font-heading text-xl font-black text-[#1B2D3C] flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> SMS Dashboard
            </h2>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
              provider === 'puresms' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-600'
            }`}>
              {provider === 'puresms' ? 'PureSMS' : provider === null ? '…' : 'Not configured'}
            </span>
          </div>
          <p className="text-xs text-[#1B2D3C]/60 mt-1">
            All SMS messages are sent via PureSMS. Send tests, view usage and check delivery logs.
          </p>
        </div>
        <div className="flex rounded-lg border border-[#1B2D3C]/15 overflow-hidden">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setUsageDays(d)}
              className={`px-3 py-1.5 text-[10px] font-bold transition-all cursor-pointer ${
                usageDays === d ? 'bg-[#DBE7E4] text-[#1B2D3C]' : 'bg-white text-[#1B2D3C]/50 hover:text-[#1B2D3C]'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Usage stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> SMS Sent ({usageDays}d)
          </p>
          {usageLoading ? (
            <Skeleton className="h-9 w-20 mt-2" />
          ) : usageError ? (
            <p className="text-xs text-red-600 font-semibold mt-2 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" />{usageError}</p>
          ) : (
            <p className="text-3xl font-black text-[#1B2D3C] mt-2">{usage?.count ?? 0}</p>
          )}
        </div>
        <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
          <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" /> Total Cost
          </p>
          {usageLoading ? (
            <Skeleton className="h-9 w-24 mt-2" />
          ) : usage ? (
            <p className="text-3xl font-black text-[#1B2D3C] mt-2">{usage.currency === 'GBP' ? '£' : usage.currency === 'USD' ? '$' : usage.currency + ' '}{usage.totalCost}</p>
          ) : (
            <p className="text-3xl font-black text-[#1B2D3C] mt-2">—</p>
          )}
        </div>
      </div>

      {/* Health alerts */}
      {health && health.alerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1">
          {health.alerts.map((alert, i) => (
            <p key={i} className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" /> {alert}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

        {/* Health */}
        <div className="bg-white border border-[#1B2D3C]/15 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-black text-[#1B2D3C] uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-4 h-4" /> Delivery Health
            </h3>
            <button
              onClick={fetchHealth}
              className="p-1.5 rounded-lg hover:bg-[#D6E2E9] transition-colors cursor-pointer"
              disabled={healthLoading}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#1B2D3C]/50 ${healthLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {healthLoading ? (
            <Skeleton className="h-16" />
          ) : health ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Resend (Email)</p>
                  <p className="text-xs font-bold text-[#1B2D3C] mt-1">
                    {health.resendLast ? new Date(health.resendLast).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </p>
                </div>
                <div className="bg-stone-50 rounded-lg p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">PureSMS (SMS)</p>
                  <p className="text-xs font-bold text-[#1B2D3C] mt-1">
                    {health.smsLast ? new Date(health.smsLast).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Never'}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-[#1B2D3C]/40 font-semibold">Events in last 24h: {health.totalEvents} · SMS failures: {health.smsFailed}</p>
            </div>
          ) : (
            <p className="text-xs text-[#1B2D3C]/40">Unable to load health</p>
          )}
        </div>
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
                    {statusBadge(log.status)}
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
    </div>
  );
}
