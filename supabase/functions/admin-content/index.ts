import { createClient } from 'npm:@supabase/supabase-js@^2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyStaff(supabase: any, username: string, sessionToken: string): Promise<any> {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('username', username)
    .eq('session_token', sessionToken)
    .gt('session_expires_at', new Date().toISOString())
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
    const { action, username, sessionToken, key, page, value, type } = await req.json();

    if (action === 'load') {
      const { data, error: loadError } = await supabase.from('content').select('value').eq('key', key).eq('page', page).single();
      if (loadError && loadError.code !== 'PGRST116') throw loadError;
      return new Response(JSON.stringify({ value: data?.value }), {
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
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'upload') {
      if (staff.role !== 'super_admin') {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { fileData, fileName } = await req.json();
      if (!fileData || !fileName) {
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

      const { data: publicUrlData } = supabase.storage.from('content').getPublicUrl(filePath);
      return new Response(JSON.stringify({ url: publicUrlData.publicUrl }), {
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
