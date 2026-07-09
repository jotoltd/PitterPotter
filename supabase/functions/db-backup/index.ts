import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { logAudit } from '../_shared/audit.ts';
import type { AdminSupabaseClient, StaffRecord } from '../_shared/types.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyStaff(supabase: AdminSupabaseClient, username: string, sessionToken: string): Promise<StaffRecord | null> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('username', username)
    .eq('session_token', sessionToken)
    .single();
  if (error || !data) return null;
  return data;
}

const BACKUP_TABLES = ['staff', 'bookings', 'gift_cards', 'settings', 'content', 'capacity', 'audit_logs', 'page_settings'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed. Use POST.' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch (parseErr) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    if (!isObject(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { action, username, sessionToken, backupId } = body;

    if (!isNonEmptyString(action) || !isNonEmptyString(username) || !isNonEmptyString(sessionToken)) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staff = await verifyStaff(supabase, username, sessionToken);
    if (!staff || staff.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      const tables = Array.isArray(body.tables) && body.tables.length > 0
        ? (body.tables as string[]).filter((t) => BACKUP_TABLES.includes(t))
        : BACKUP_TABLES;
      if (tables.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid tables selected for backup' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const backupData: Record<string, unknown[]> = {};
      for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*');
        if (error) {
          console.error(`Backup failed for ${table}:`, error);
          backupData[table] = [];
        } else {
          backupData[table] = data || [];
        }
      }

      const backup = {
        version: 1,
        created_at: new Date().toISOString(),
        created_by: staff.username,
        tables,
        data: backupData,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('db_backups')
        .insert({
          name: `Backup ${new Date().toLocaleString('en-GB')}`,
          data: backup,
          created_by: staff.id,
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      await logAudit(supabase, staff, 'create', 'db_backup', inserted?.id || 'unknown', { name: backup.name });

      return new Response(JSON.stringify({ success: true, backupId: inserted?.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      const { data, error } = await supabase
        .from('db_backups')
        .select('id, name, created_at, created_by(username, name), data')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const backups = (data || []).map((record) => {
        const backupData = (record.data as { tables?: string[]; data?: Record<string, unknown[]> }) || {};
        const tables = Array.isArray(backupData.tables) && backupData.tables.length > 0
          ? backupData.tables.filter((t) => BACKUP_TABLES.includes(t))
          : Object.keys(backupData.data || {}).filter((t) => BACKUP_TABLES.includes(t));
        return { ...record, tables };
      });
      return new Response(JSON.stringify({ backups }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'download') {
      if (!isNonEmptyString(backupId)) {
        return new Response(JSON.stringify({ error: 'Missing backupId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error } = await supabase
        .from('db_backups')
        .select('name, data')
        .eq('id', backupId)
        .single();
      if (error || !data) throw error || new Error('Backup not found');
      return new Response(JSON.stringify(data.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!isNonEmptyString(backupId)) {
        return new Response(JSON.stringify({ error: 'Missing backupId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('db_backups').delete().eq('id', backupId);
      if (error) throw error;
      await logAudit(supabase, staff, 'delete', 'db_backup', backupId, {});
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'restore') {
      if (!isNonEmptyString(backupId)) {
        return new Response(JSON.stringify({ error: 'Missing backupId' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data: backupRecord, error: backupError } = await supabase
        .from('db_backups')
        .select('name, data')
        .eq('id', backupId)
        .single();
      if (backupError || !backupRecord) {
        return new Response(JSON.stringify({ error: 'Backup not found', details: backupError?.message }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const backup = backupRecord.data as { tables?: string[]; data?: Record<string, unknown[]> };
      const backupData = backup.data || {};
      const availableTables = Array.isArray(backup.tables) && backup.tables.length > 0
        ? backup.tables.filter((t) => BACKUP_TABLES.includes(t))
        : Object.keys(backupData).filter((t) => BACKUP_TABLES.includes(t));

      const requestedTables = Array.isArray(body.tables) && body.tables.length > 0
        ? (body.tables as string[]).filter((t) => availableTables.includes(t))
        : availableTables;
      if (requestedTables.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid tables selected for restore' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const deleteTable = async (table: string) => {
        if (table === 'capacity') {
          const { error } = await supabase.from('capacity').delete().not('studio', 'is', null);
          if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
        } else if (table === 'settings') {
          const { error } = await supabase.from('settings').delete().not('key', 'is', null);
          if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
        } else if (table === 'staff') {
          const { error } = await supabase.from('staff').delete().not('id', 'is', null).neq('id', staff.id);
          if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
        } else {
          const { error } = await supabase.from(table).delete().not('id', 'is', null);
          if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
        }
      };

      // If restoring staff, clear page_settings.updated_by first to avoid FK violations when old staff are deleted.
      if (requestedTables.includes('staff')) {
        const { error: clearError } = await supabase.from('page_settings').update({ updated_by: null }).not('updated_by', 'is', null);
        if (clearError) throw new Error(`Failed to clear page_settings updated_by: ${clearError.message}`);
      }

      // Delete selected tables in parallel.
      await Promise.all(requestedTables.map(deleteTable));

      // Prepare rows, clearing FK references to staff when staff is not being restored.
      const prepareRows = (table: string, rows: Record<string, unknown>[]): Record<string, unknown>[] => {
        if (table === 'audit_logs' && !requestedTables.includes('staff')) {
          return rows.map((r) => ({ ...r, staff_id: null }));
        }
        if (table === 'page_settings' && !requestedTables.includes('staff')) {
          return rows.map((r) => ({ ...r, updated_by: null }));
        }
        return rows;
      };

      // Insert staff first because child tables reference it.
      if (requestedTables.includes('staff')) {
        const staffRows = (backupData['staff'] || []) as Record<string, unknown>[];
        const staffRowsToInsert = staffRows.filter((r) => r.id !== staff.id && r.username !== staff.username);
        if (staffRowsToInsert.length > 0) {
          const { error } = await supabase.from('staff').insert(staffRowsToInsert);
          if (error) throw new Error(`Failed to restore staff: ${error.message}`);
        }
      }

      // Insert remaining selected tables in parallel.
      await Promise.all(
        requestedTables.filter((t) => t !== 'staff').map(async (table) => {
          const rows = (backupData[table] || []) as Record<string, unknown>[];
          if (rows.length === 0) return;
          const { error } = await supabase.from(table).insert(prepareRows(table, rows));
          if (error) throw new Error(`Failed to restore ${table}: ${error.message}`);
        })
      );

      await logAudit(supabase, staff, 'restore', 'db_backup', backupId, { name: backupRecord.name, tables: requestedTables });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB backup error:', err);
    const details = err instanceof Error ? err.message : JSON.stringify(err);
    const isMissingTable = typeof details === 'string' && /relation "db_backups" does not exist|\.db_backups/.test(details);
    if (isMissingTable) {
      return new Response(JSON.stringify({ error: 'Backups table not found. Run the db_backups migration first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify({ error: 'Failed to process request', details }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
