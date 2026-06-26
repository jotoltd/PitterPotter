import { createClient } from 'npm:@supabase/supabase-js@^2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function generateToken(): string {
  return crypto.randomUUID();
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
    const { username, passwordHash } = await req.json();
    if (!username || !passwordHash) {
      return new Response(JSON.stringify({ error: 'Missing credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('username', username)
      .eq('password_hash', passwordHash)
      .single();

    if (error || !staff) {
      return new Response(JSON.stringify({ error: 'Invalid credentials' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);

    const { error: updateError } = await supabase
      .from('staff')
      .update({ session_token: token, session_expires_at: expiresAt.toISOString() })
      .eq('id', staff.id);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      id: staff.id,
      name: staff.name,
      username: staff.username,
      role: staff.role,
      canUpdateStatus: staff.can_update_status,
      canEditBookings: staff.can_edit_bookings,
      canAddWalkIns: staff.can_add_walk_ins,
      canDeleteBookings: staff.can_delete_bookings,
      sessionToken: token,
      sessionExpiresAt: expiresAt.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Staff login error:', err);
    return new Response(JSON.stringify({ error: 'Failed to login' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
