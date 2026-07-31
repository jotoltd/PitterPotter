import { AuditLog } from '../../types';
import { AUDIT_ACTION_LABEL, AUDIT_ENTITY_LABEL, AUDIT_ACTION_COLOR, formatAuditDetails } from './adminUtils';
import Skeleton from '../Skeleton';

interface AuditLogsTabProps {
  auditLogs: AuditLog[];
  auditLogsLoading: boolean;
}

export default function AuditLogsTab({ auditLogs, auditLogsLoading }: AuditLogsTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-8 space-y-6">
      <div>
        <h2 className="font-heading text-xl font-black text-[#1B2D3C]">Staff Activity Audit Log</h2>
        <p className="text-xs text-[#1B2D3C]/70 mt-1">Track all staff actions and system changes.</p>
      </div>

      <div className="bg-white border border-[#1B2D3C]/20 shadow-sm rounded-xl overflow-hidden">
        {auditLogsLoading ? (
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-12 gap-3">
              <Skeleton className="col-span-3 h-8" />
              <Skeleton className="col-span-2 h-8" />
              <Skeleton className="col-span-2 h-8" />
              <Skeleton className="col-span-5 h-8" />
            </div>
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : auditLogs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-stone-500 font-semibold">No audit logs found</p>
            <p className="text-xs text-stone-400 mt-1">Activity will appear here as staff perform actions</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-[#D6E2E9] border-b border-[#1B2D3C]/20">
                <tr>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">When</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Staff</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">What happened</th>
                  <th className="text-[9px] font-bold uppercase tracking-wider text-[#1B2D3C] py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="text-xs text-[#1B2D3C]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="border-b border-[#1B2D3C]/5 hover:bg-stone-50">
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <p className="font-bold">{new Date(log.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      <p className="text-[10px] text-[#1B2D3C]/50 font-semibold">{new Date(log.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="py-3 px-4 align-top whitespace-nowrap">
                      <span className="font-bold">{log.username || 'Unknown'}</span>
                    </td>
                    <td className="py-3 px-4 align-top">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${AUDIT_ACTION_COLOR[log.action] || 'bg-stone-100 text-stone-600'}`}>
                          {AUDIT_ACTION_LABEL[log.action] || log.action}
                        </span>
                        <span className="font-semibold text-[#1B2D3C]/80">
                          {AUDIT_ENTITY_LABEL[log.entity] || log.entity}
                          {log.entity_id && <span className="text-[#1B2D3C]/40 font-normal ml-1">#{log.entity_id.slice(0, 8)}</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 align-top text-[#1B2D3C]/70 font-medium">
                      {formatAuditDetails(log)}
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
