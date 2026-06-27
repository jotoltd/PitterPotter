import { createClient } from 'npm:@supabase/supabase-js@^2.0.0';
import { hash, genSalt } from 'bcrypt';

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

async function hashPassword(password: string): Promise<string> {
  const salt = await genSalt(10);
  return hash(password, salt);
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
    const { action, username, sessionToken, staff: staffData } = await req.json();

    const staff = await verifyStaff(supabase, username, sessionToken);
    if (!staff || staff.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'list') {
      const { data, error: listError } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
      if (listError) throw listError;
      return new Response(JSON.stringify({ staff: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      if (!staffData.name || !staffData.username || !staffData.password) {
        return new Response(JSON.stringify({ error: 'Missing fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const passwordHash = await hashPassword(staffData.password);
      const { error } = await supabase.from('staff').insert({
        name: staffData.name,
        username: staffData.username,
        password_hash: passwordHash,
        role: staffData.role,
        can_update_status: staffData.canUpdateStatus,
        can_edit_bookings: staffData.canEditBookings,
        can_add_walk_ins: staffData.canAddWalkIns,
        can_delete_bookings: staffData.canDeleteBookings,
      });
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const updateData: any = {
        name: staffData.name,
        role: staffData.role,
        can_update_status: staffData.canUpdateStatus,
        can_edit_bookings: staffData.canEditBookings,
        can_add_walk_ins: staffData.canAddWalkIns,
        can_delete_bookings: staffData.canDeleteBookings,
      };
      if (staffData.password) {
        updateData.password_hash = await hashPassword(staffData.password);
      }
      const { error } = await supabase.from('staff').update(updateData).eq('id', staffData.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const { error } = await supabase.from('staff').delete().eq('id', staffData.id);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Staff management error:', err);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
