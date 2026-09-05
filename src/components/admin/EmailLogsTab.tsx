import { useState } from 'react';
import { RefreshCw, Eye, Send, X } from 'lucide-react';
import Skeleton from '../Skeleton';
import { EmailLog } from '../../types';

interface EmailLogsTabProps {
  emailLogs: EmailLog[];
  emailLogsLoading: boolean;
  onRefresh: () => void;
  onResendEmail?: (logId: string) => Promise<{ success: boolean; error?: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  bounced: 'bg-red-100 text-red-700',
  complained: 'bg-amber-100 text-amber-700',
  opened: 'bg-purple-100 text-purple-700',
  clicked: 'bg-indigo-100 text-indigo-700',
  failed: 'bg-red-100 text-red-700',
  queued: 'bg-amber-100 text-amber-700',
  undelivered: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
  admin_booking_notification: 'Admin Notify',
  booking_confirmation: 'Confirmation',
  party_final_reminder: 'Party Reminder',
  party_final_reminder_sms: 'Party SMS',
  collection_ready: 'Collection Ready',
  collection_ready_sms: 'Collection SMS',
  gift_card_recipient: 'Gift Card',
  gift_card_sender: 'Gift Card Sender',
  admin_test_sms: 'Test SMS',
  general: 'General',
};

export default function EmailLogsTab({ emailLogs, emailLogsLoading, onRefresh, onResendEmail }: EmailLogsTabProps) {
  const [previewLog, setPreviewLog] = useState<EmailLog | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{ id: string; success: boolean; message: string } | null>(null);

  const handleResend = async (log: EmailLog) => {
    if (!onResendEmail) return;
    setResendingId(log.id);
    setResendResult(null);
    try {
      const result = await onResendEmail(log.id);
      setResendResult({ id: log.id, success: result.success, message: result.success ? 'Email resent successfully' : (result.error || 'Failed to resend') });
      if (result.success) onRefresh();
    } catch {
      setResendResult({ id: log.id, success: false, message: 'Failed to resend' });
    } finally {
      setResendingId(null);
    }
  };

  const isSMS = (type: string) => type.includes('sms');
  const canResend = (log: EmailLog) => log.status === 'failed' || log.status === 'bounced' || log.status === 'undelivered';

  const stats = {
    total: emailLogs.length,
    delivered: emailLogs.filter(l => l.status === 'delivered' || l.status === 'opened' || l.status === 'clicked').length,
    failed: emailLogs.filter(l => l.status === 'failed' || l.status === 'bounced' || l.status === 'undelivered').length,
    opened: emailLogs.filter(l => l.status === 'opened' || l.status === 'clicked').length,
  };
  const deliveryRate = stats.total > 0 ? Math.round((stats.delivered / Math.max(1, stats.total - stats.failed)) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Communication Logs</h2>
          <p className="text-xs text-[#1B2D3C]/70 mt-1">Track all emails and SMS sent from the system and their delivery status.</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-stone-50 transition-all cursor-pointer"
        >
          Refresh
        </button>
      </div>

      {/* Aggregate Analytics */}
      {!emailLogsLoading && emailLogs.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-[#1B2D3C]/10 rounded-xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Total Sent</p>
            <p className="text-2xl font-black text-[#1B2D3C]">{stats.total}</p>
          </div>
          <div className="bg-white border border-[#1B2D3C]/10 rounded-xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Delivery Rate</p>
            <p className="text-2xl font-black text-emerald-600">{deliveryRate}%</p>
          </div>
          <div className="bg-white border border-[#1B2D3C]/10 rounded-xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Opened</p>
            <p className="text-2xl font-black text-purple-600">{stats.opened}</p>
          </div>
          <div className="bg-white border border-[#1B2D3C]/10 rounded-xl p-4">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C]/50">Failed/Bounced</p>
            <p className="text-2xl font-black text-red-600">{stats.failed}</p>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl overflow-hidden">
        {emailLogsLoading ? (
          <div className="p-4 space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : emailLogs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-stone-500 font-semibold">No communications sent yet</p>
            <p className="text-xs text-stone-400 mt-1">Emails and SMS will appear here once bookings are made and confirmed</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-[#D6E2E9] border-b border-[#1B2D3C]/20">
                <tr>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">When</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Type</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Recipient</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Subject</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Status</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Booking</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#1B2D3C]">
                {emailLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1B2D3C]/5 hover:bg-stone-50">
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <p className="font-bold">{new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold">{TYPE_LABELS[log.email_type] || log.email_type}</span>
                        {isSMS(log.email_type) && (
                          <span className="text-[8px] font-black uppercase bg-[#1B2D3C]/10 text-[#1B2D3C]/60 px-1 py-0.5 rounded">SMS</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className="text-xs">{log.recipient}</span>
                    </td>
                    <td className="py-3 px-4 align-top max-w-[200px]">
                      <span className="text-xs truncate block">{log.subject}</span>
                      {log.error && (
                        <p className="text-[10px] text-red-600 mt-1">{log.error}</p>
                      )}
                      {log.error_message && (
                        <p className="text-[10px] text-red-600 mt-1">{log.error_message}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[log.status] || 'bg-stone-100 text-stone-700'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      {log.booking_id ? (
                        <span className="text-xs font-mono">{log.booking_id}</span>
                      ) : (
                        <span className="text-xs text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-1.5">
                        {log.body && (
                          <button
                            onClick={() => setPreviewLog(log)}
                            className="p-1.5 rounded-lg hover:bg-[#DBE7E4] transition-all cursor-pointer"
                            title="View content"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#1B2D3C]/60" />
                          </button>
                        )}
                        {canResend(log) && onResendEmail && !isSMS(log.email_type) && (
                          <button
                            onClick={() => handleResend(log)}
                            disabled={resendingId === log.id}
                            className="p-1.5 rounded-lg hover:bg-emerald-50 transition-all cursor-pointer disabled:opacity-40"
                            title="Resend email"
                          >
                            {resendingId === log.id ? (
                              <RefreshCw className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                            ) : (
                              <Send className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </button>
                        )}
                      </div>
                      {resendResult?.id === log.id && (
                        <p className={`text-[9px] font-bold mt-1 ${resendResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                          {resendResult.message}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Body Preview Modal */}
      {previewLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setPreviewLog(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1B2D3C]/10">
              <div>
                <h3 className="font-heading font-black text-sm text-[#1B2D3C]">{previewLog.subject}</h3>
                <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">To: {previewLog.recipient} · {TYPE_LABELS[previewLog.email_type] || previewLog.email_type}</p>
              </div>
              <button onClick={() => setPreviewLog(null)} className="p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer">
                <X className="w-4 h-4 text-[#1B2D3C]/60" />
              </button>
            </div>
            <div className="overflow-y-auto p-5 flex-1">
              {isSMS(previewLog.email_type) ? (
                <pre className="text-xs text-[#1B2D3C] whitespace-pre-wrap font-sans">{previewLog.body}</pre>
              ) : (
                <div className="text-xs text-[#1B2D3C]" dangerouslySetInnerHTML={{ __html: previewLog.body }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
