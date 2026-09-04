import { createClient } from 'supabase';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';

const TABLES = [
  'bookings',
  'gift_cards',
  'staff',
  'settings',
  'capacity',
  'audit_logs',
  'email_logs',
  'email_templates',
  'sms_templates',
  'short_urls',
  'content',
];

function toCSV(rows: any[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(','));
  }
  return lines.join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req, true);
  const corsHeaders = makeCorsHeaders(req, true);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const dateStr = new Date().toISOString().split('T')[0];
  const results: { table: string; rows: number; success: boolean; error?: string }[] = [];

  for (const table of TABLES) {
    try {
      const { data, error } = await supabase.from(table).select('*');
      if (error) {
        results.push({ table, rows: 0, success: false, error: error.message });
        continue;
      }

      const csv = toCSV(data || []);
      const fileName = `${table}_${dateStr}.csv`;
      const filePath = `backups/${dateStr}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('backups')
        .upload(filePath, csv, {
          contentType: 'text/csv',
          upsert: true,
        });

      if (uploadError) {
        results.push({ table, rows: data?.length || 0, success: false, error: uploadError.message });
      } else {
        results.push({ table, rows: data?.length || 0, success: true });
      }
    } catch (err) {
      results.push({ table, rows: 0, success: false, error: String(err) });
    }
  }

  const successCount = results.filter(r => r.success).length;
  console.log(`Backup complete: ${successCount}/${TABLES.length} tables exported`);

  return new Response(JSON.stringify({
    success: true,
    date: dateStr,
    timestamp,
    results,
    summary: `${successCount}/${TABLES.length} tables backed up`,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
