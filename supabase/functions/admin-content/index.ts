import { createClient } from 'supabase';
import { isNonEmptyString, isString, isObject } from '../_shared/validate.ts';
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
    const { action, username, sessionToken, key, page, value, type, metadata } = body;

    if (!isNonEmptyString(action)) {
      return new Response(JSON.stringify({ error: 'Missing or invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'load') {
      if (!isNonEmptyString(key) || !isNonEmptyString(page)) {
        return new Response(JSON.stringify({ error: 'Missing key or page' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data, error: loadError } = await supabase.from('content').select('value').eq('key', key).eq('page', page).single();
      if (loadError && loadError.code !== 'PGRST116') throw loadError;
      return new Response(JSON.stringify({ value: data?.value }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!isNonEmptyString(username) || !isNonEmptyString(sessionToken)) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staff = await verifyStaff(supabase, username, sessionToken);
    if (!staff) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'save') {
      if (!isNonEmptyString(key) || !isNonEmptyString(page) || !isString(value)) {
        return new Response(JSON.stringify({ error: 'Missing key, page, or value' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (staff.role !== 'super_admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('content').upsert({
        key,
        page,
        value,
        type: type || 'text',
        metadata: metadata || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
      if (error) throw error;
      await logAudit(supabase, staff, 'save', 'content', `${page}:${key}`, { type: type || 'text' });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'upload') {
      if (!isNonEmptyString(key) || !isNonEmptyString(page)) {
        return new Response(JSON.stringify({ error: 'Missing key or page' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (staff.role !== 'super_admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { fileData, fileName } = body;
      if (!isString(fileData) || !isNonEmptyString(fileName)) {
        return new Response(JSON.stringify({ error: 'Missing file data or name' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const base64Match = fileData.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.*)$/i);
      if (!base64Match) {
        return new Response(JSON.stringify({ error: 'Invalid base64 image data' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const ext = base64Match[1].toLowerCase().replace('jpeg', 'jpg');
      const mimeType = `image/${base64Match[1].toLowerCase()}`;
      const binary = Uint8Array.from(atob(base64Match[2]), (c) => c.charCodeAt(0));
      const filePath = `${page}/${key}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('content')
        .upload(filePath, binary, { contentType: mimeType, upsert: true });
      if (uploadError) throw uploadError;

      await logAudit(supabase, staff, 'upload', 'storage', filePath, { page, key });
      const { data: publicUrlData } = supabase.storage.from('content').getPublicUrl(filePath);
      return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!isNonEmptyString(key) || !isNonEmptyString(page)) {
        return new Response(JSON.stringify({ error: 'Missing key or page' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (staff.role !== 'super_admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('content').delete().eq('key', key).eq('page', page);
      if (error) throw error;
      await logAudit(supabase, staff, 'delete', 'content', `${page}:${key}`);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Admin content error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
