import Skeleton from '../Skeleton';

interface EmailLog {
  id: string;
  created_at: string;
  email_type: string;
  recipient: string;
  subject: string;
  status: string;
  booking_id: string | null;
  error: string | null;
}

interface EmailLogsTabProps {
  emailLogs: EmailLog[];
  emailLogsLoading: boolean;
  onRefresh: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  sent: 'bg-blue-100 text-blue-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  bounced: 'bg-red-100 text-red-700',
  complained: 'bg-amber-100 text-amber-700',
  opened: 'bg-purple-100 text-purple-700',
  clicked: 'bg-indigo-100 text-indigo-700',
  failed: 'bg-red-100 text-red-700',
};

const TYPE_LABELS: Record<string, string> = {
  admin_booking_notification: 'Admin Notify',
  booking_confirmation: 'Confirmation',
  party_final_reminder: 'Party Reminder',
  general: 'General',
};

export default function EmailLogsTab({ emailLogs, emailLogsLoading, onRefresh }: EmailLogsTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Email Logs</h2>
          <p className="text-xs text-[#1B2D3C]/70 mt-1">Track all emails sent from the system and their delivery status.</p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#1B2D3C]/20 hover:bg-stone-50 transition-all cursor-pointer"
        >
          Refresh
        </button>
      </div>

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
            <p className="text-sm text-stone-500 font-semibold">No emails sent yet</p>
            <p className="text-xs text-stone-400 mt-1">Emails will appear here once bookings are made and confirmed</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left min-w-[700px]">
              <thead className="bg-[#D6E2E9] border-b border-[#1B2D3C]/20">
                <tr>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">When</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Type</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Recipient</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Subject</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Status</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Booking</th>
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
                      <span className="font-bold">{TYPE_LABELS[log.email_type] || log.email_type}</span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className="text-xs">{log.recipient}</span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <span className="text-xs">{log.subject}</span>
                      {log.error && (
                        <p className="text-[10px] text-red-600 mt-1">{log.error}</p>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
