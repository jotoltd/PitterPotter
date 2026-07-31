import { Plus, Trash2 } from 'lucide-react';
import Skeleton from '../Skeleton';
import { BACKUP_TABLE_OPTIONS } from './adminUtils';

interface DbBackup {
  id: string;
  name: string;
  created_at: string;
  created_by?: { name?: string; username?: string };
  tables?: string[];
}

interface DbHealth {
  healthy: boolean;
  tables: Record<string, { exists: boolean; rows: number }>;
  issues: string[];
}

interface SampleDataStatus {
  sampleBookings: number;
  sampleGiftCards: number;
}

interface WebmasterTabProps {
  dbHealth: DbHealth | null;
  dbHealthLoading: boolean;
  onLoadDbHealth: () => void;
  dbBackups: DbBackup[];
  dbBackupLoading: boolean;
  onCreateBackup: () => void;
  onDownloadBackup: (id: string, name: string) => void;
  onDeleteBackup: (id: string) => void;
  onRestoreBackup: (backupId: string, name: string, tables: string[]) => void;
  selectedBackupTables: string[];
  onSelectBackupTables: (tables: string[]) => void;
  sampleDataStatus: SampleDataStatus | null;
  sampleDataLoading: boolean;
  onLoadSampleData: () => void;
  onAddSampleData: () => void;
  onRemoveSampleData: () => void;
}

export default function WebmasterTab({
  dbHealth,
  dbHealthLoading,
  onLoadDbHealth,
  dbBackups,
  dbBackupLoading,
  onCreateBackup,
  onDownloadBackup,
  onDeleteBackup,
  onRestoreBackup,
  selectedBackupTables,
  onSelectBackupTables,
  sampleDataStatus,
  sampleDataLoading,
  onLoadSampleData,
  onAddSampleData,
  onRemoveSampleData,
}: WebmasterTabProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 pb-8 space-y-6">

      {/* Database Health */}
      <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C]">Database Health</h2>
            <p className="text-xs text-[#1B2D3C]/70 mt-1">Check all required tables exist and have data.</p>
          </div>
          <button
            onClick={onLoadDbHealth}
            disabled={dbHealthLoading}
            className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Refresh
          </button>
        </div>
        {dbHealthLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : dbHealth ? (
          <div className="space-y-3">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${dbHealth.healthy ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${dbHealth.healthy ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="text-xs font-bold">{dbHealth.healthy ? 'All required tables healthy' : 'Database issues detected'}</span>
            </div>
            {dbHealth.issues.length > 0 && (
              <ul className="space-y-1">
                {dbHealth.issues.map((issue, idx) => (
                  <li key={idx} className="text-xs text-red-600 font-medium">• {issue}</li>
                ))}
              </ul>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(dbHealth.tables).map(([name, info]) => (
                <div key={name} className={`p-2 rounded-lg border ${info.exists ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-[#1B2D3C]/70">{name}</p>
                  <p className={`text-sm font-black ${info.exists ? 'text-emerald-700' : 'text-red-700'}`}>{info.exists ? info.rows : 'Missing'}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#1B2D3C]/50">Click Refresh to check database health.</p>
        )}
      </div>

      {/* Database Backup */}
      <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C]">Database Backup</h2>
            <p className="text-xs text-[#1B2D3C]/70 mt-1">Choose which tables to include, then create a backup.</p>
          </div>
          <button
            onClick={onCreateBackup}
            disabled={dbBackupLoading || selectedBackupTables.length === 0}
            className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create Backup
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C]/70">Tables to backup</span>
            <div className="flex gap-2">
              <button
                onClick={() => onSelectBackupTables(BACKUP_TABLE_OPTIONS.map((t) => t.value))}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] bg-[#DBE7E4]/50 rounded hover:bg-[#D6E2E9] transition-colors cursor-pointer"
              >
                Select All
              </button>
              <button
                onClick={() => onSelectBackupTables([])}
                className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#1B2D3C] bg-[#DBE7E4]/50 rounded hover:bg-[#D6E2E9] transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {BACKUP_TABLE_OPTIONS.map((table) => (
              <label key={table.value} className="flex items-center gap-2 p-2 rounded-lg border border-[#1B2D3C]/10 cursor-pointer hover:bg-[#DBE7E4]/30 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedBackupTables.includes(table.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onSelectBackupTables([...selectedBackupTables, table.value]);
                    } else {
                      onSelectBackupTables(selectedBackupTables.filter((t) => t !== table.value));
                    }
                  }}
                  className="w-4 h-4 accent-[#1B2D3C] cursor-pointer"
                />
                <span className="text-xs font-semibold text-[#1B2D3C]">{table.label}</span>
              </label>
            ))}
          </div>
        </div>
        {dbBackupLoading && dbBackups.length === 0 ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : dbBackups.length > 0 ? (
          <div className="space-y-2">
            {dbBackups.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-[#DBE7E4]/30 rounded-lg">
                <div>
                  <p className="text-sm font-bold text-[#1B2D3C]">{backup.name}</p>
                  <p className="text-[10px] text-[#1B2D3C]/50">
                    {new Date(backup.created_at).toLocaleString('en-GB')}
                    {backup.created_by ? ` · ${backup.created_by.name || backup.created_by.username}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDownloadBackup(backup.id, backup.name)}
                    className="px-3 py-1.5 bg-white text-[#1B2D3C] text-[10px] font-bold uppercase tracking-wider rounded border border-[#1B2D3C]/20 hover:bg-[#D6E2E9] transition-colors cursor-pointer"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => {
                      const availableTables = backup.tables?.length ? backup.tables : BACKUP_TABLE_OPTIONS.map((t) => t.value);
                      onRestoreBackup(backup.id, backup.name, availableTables);
                    }}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded border border-amber-200 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => onDeleteBackup(backup.id)}
                    className="px-3 py-1.5 bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider rounded border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#1B2D3C]/50">No backups yet. Create one to get started.</p>
        )}
      </div>

      {/* Sample Data */}
      <div className="bg-white border border-[#1B2D3C]/10 p-6 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-lg font-black text-[#1B2D3C]">Sample Data</h2>
            <p className="text-xs text-[#1B2D3C]/70 mt-1">Add or remove sample bookings and gift cards for testing.</p>
          </div>
          <button
            onClick={onLoadSampleData}
            disabled={sampleDataLoading}
            className="px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors disabled:opacity-50 cursor-pointer"
          >
            Refresh
          </button>
        </div>
        {sampleDataLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12" />
          </div>
        ) : sampleDataStatus ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#DBE7E4]/30 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#1B2D3C]/70">Sample Bookings</p>
                <p className="text-2xl font-black text-[#1B2D3C]">{sampleDataStatus.sampleBookings}</p>
              </div>
              <div className="p-3 bg-[#DBE7E4]/30 rounded-lg">
                <p className="text-[10px] uppercase tracking-wider font-bold text-[#1B2D3C]/70">Sample Gift Cards</p>
                <p className="text-2xl font-black text-[#1B2D3C]">{sampleDataStatus.sampleGiftCards}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onAddSampleData}
                disabled={sampleDataLoading}
                className="flex-1 px-4 py-2 bg-[#DBE7E4] text-[#1B2D3C] text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-[#D6E2E9] transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Sample Data
              </button>
              <button
                onClick={onRemoveSampleData}
                disabled={sampleDataLoading || (sampleDataStatus.sampleBookings === 0 && sampleDataStatus.sampleGiftCards === 0)}
                className="flex-1 px-4 py-2 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Remove Sample Data
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#1B2D3C]/50">Click Refresh to load sample data status.</p>
        )}
      </div>
    </div>
  );
}
