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

      // Delete child tables first (in parallel) to avoid FK violations, then clear non-backed-up tables with staff references.
      await Promise.all([
        deleteAll('audit_logs', 'id'),
        deleteAll('page_settings', 'id'),
        deleteAll('pos_transactions', 'id'),
        deleteAll('content', 'id'),
        deleteAll('capacity', 'studio'),
        deleteAll('bookings', 'id'),
        deleteAll('gift_cards', 'id'),
        deleteAll('settings', 'key'),
      ]);
      const { error: deleteStaffError } = await supabase.from('staff').delete().not('id', 'is', null).neq('id', staff.id);
      if (deleteStaffError) throw new Error(`Failed to delete staff: ${deleteStaffError.message}`);

      // Insert staff first because child tables reference it.
      const staffRows = (backupData['staff'] || []) as Record<string, unknown>[];
      const staffRowsToInsert = staffRows.filter((r) => r.id !== staff.id && r.username !== staff.username);
      if (staffRowsToInsert.length > 0) {
        const { error } = await supabase.from('staff').insert(staffRowsToInsert);
        if (error) throw new Error(`Failed to restore staff: ${error.message}`);
      }

      // Insert remaining tables in parallel (no FK dependencies between them).
      await Promise.all(
        BACKUP_TABLES.filter((t) => t !== 'staff').map(async (table) => {
          const rows = backupData[table] || [];
          if (rows.length === 0) return;
          const { error } = await supabase.from(table).insert(rows);
          if (error) throw new Error(`Failed to restore ${table}: ${error.message}`);
        })
      );

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
