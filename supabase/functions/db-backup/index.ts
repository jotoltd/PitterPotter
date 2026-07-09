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

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
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
      const backupData: Record<string, unknown[]> = {};
      for (const table of BACKUP_TABLES) {
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
        .select('id, name, created_at, created_by(username, name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return new Response(JSON.stringify({ backups: data || [] }), {
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

      const backupData = (backupRecord.data as { data?: Record<string, unknown[]> }).data || {};

      const deleteAll = async (table: string, column: string) => {
        const { error } = await supabase.from(table).delete().not(column, 'is', null);
        if (error) throw new Error(`Failed to delete ${table}: ${error.message}`);
      };

      // Delete child tables first to avoid FK violations, then clear non-backed-up tables with staff references.
      await deleteAll('audit_logs', 'id');
      await deleteAll('page_settings', 'id');
      await deleteAll('pos_transactions', 'id');
      await deleteAll('content', 'id');
      await deleteAll('capacity', 'studio');
      await deleteAll('bookings', 'id');
      await deleteAll('gift_cards', 'id');
      await deleteAll('settings', 'id');
      const { error: deleteStaffError } = await supabase.from('staff').delete().not('id', 'is', null).neq('id', staff.id);
      if (deleteStaffError) throw new Error(`Failed to delete staff: ${deleteStaffError.message}`);

      // Insert parent tables first, then children.
      for (const table of BACKUP_TABLES) {
        const rows = backupData[table] || [];
        if (rows.length === 0) continue;
        if (table === 'staff') {
          const rowsToInsert = (rows as Record<string, unknown>[]).filter((r) => r.id !== staff.id && r.username !== staff.username);
          if (rowsToInsert.length > 0) {
            const { error } = await supabase.from('staff').insert(rowsToInsert);
            if (error) throw new Error(`Failed to restore staff: ${error.message}`);
          }
        } else {
          const { error } = await supabase.from(table).insert(rows);
          if (error) throw new Error(`Failed to restore ${table}: ${error.message}`);
        }
      }

      await logAudit(supabase, staff, 'restore', 'db_backup', backupId, { name: backupRecord.name });
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
