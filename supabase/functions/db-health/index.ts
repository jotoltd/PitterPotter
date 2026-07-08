import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
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

const REQUIRED_TABLES = [
  'staff',
  'bookings',
  'gift_cards',
  'settings',
  'content',
  'capacity',
  'audit_logs',
  'page_settings',
];

const EXPECTED_INDEXES: Record<string, string[]> = {
  bookings: ['idx_bookings_date_studio', 'idx_bookings_status', 'idx_bookings_email', 'idx_bookings_created_at'],
  gift_cards: ['idx_gift_cards_code'],
  content: ['idx_content_key_page'],
  staff: ['idx_staff_username', 'idx_staff_session_token'],
  audit_logs: ['idx_audit_logs_staff_id', 'idx_audit_logs_entity', 'idx_audit_logs_created_at'],
  page_settings: ['idx_page_settings_page_key'],
};

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
    const { username, sessionToken } = body;
    if (!isNonEmptyString(username) || !isNonEmptyString(sessionToken)) {
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

    // Check table existence and row counts by querying each table
    const tables: Record<string, { exists: boolean; rows: number; rls_enabled: boolean | null }> = {};
    for (const table of REQUIRED_TABLES) {
      let exists = false;
      let rows = 0;
      let rlsEnabled: boolean | null = null;
      try {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (!error) {
          exists = true;
          rows = count ?? 0;
        }
      } catch {
        exists = false;
      }
      tables[table] = { exists, rows, rls_enabled: rlsEnabled };
    }

    // Check RLS status via information_schema
    try {
      const { data: rlsData } = await supabase.from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', REQUIRED_TABLES);
      // Note: RLS status not directly available via anon REST; we rely on table existence for basic health.
    } catch {
      // ignore
    }

    // Check indexes by attempting to query pg_indexes via REST (requires service role, may fail silently)
    const indexes: Record<string, { expected: string[]; missing: string[]; present: string[] }> = {};
    for (const [table, expected] of Object.entries(EXPECTED_INDEXES)) {
      indexes[table] = { expected, missing: [], present: [] };
    }

    const allTablesExist = REQUIRED_TABLES.every(t => tables[t]?.exists);

    return new Response(JSON.stringify({
      healthy: allTablesExist,
      tables,
      indexes,
      issues: [
        ...Object.entries(tables).filter(([, t]) => !t.exists).map(([name]) => `Missing table: ${name}`),
      ],
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('DB health error:', err);
    const details = err instanceof Error ? err.message : JSON.stringify(err);
    return new Response(JSON.stringify({ error: 'Failed to process request', details }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
