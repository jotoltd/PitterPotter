import { createClient } from 'supabase';
import { hash, genSalt } from 'bcrypt';
import { isObject, isNonEmptyString, isOneOf, isBoolean } from '../_shared/validate.ts';
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
    const body = await req.json();
    if (!isObject(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { action, username, sessionToken, staff: staffData } = body;

    if (!isNonEmptyString(action) || !isNonEmptyString(username) || !isNonEmptyString(sessionToken)) {
      return new Response(JSON.stringify({ error: 'Missing action, username, or sessionToken' }), {
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

    if (action === 'list') {
      const { data, error: listError } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
      if (listError) throw listError;
      return new Response(JSON.stringify({ staff: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'create') {
      if (!isObject(staffData) || !isNonEmptyString(staffData.name) || !isNonEmptyString(staffData.username) || !isNonEmptyString(staffData.password)) {
        return new Response(JSON.stringify({ error: 'Missing fields' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const role = isOneOf(staffData.role, ['super_admin', 'admin'] as const) ? staffData.role : 'admin';
      const permissions = {
        can_update_status: isBoolean(staffData.canUpdateStatus) ? staffData.canUpdateStatus : false,
        can_edit_bookings: isBoolean(staffData.canEditBookings) ? staffData.canEditBookings : false,
        can_add_walk_ins: isBoolean(staffData.canAddWalkIns) ? staffData.canAddWalkIns : false,
        can_delete_bookings: isBoolean(staffData.canDeleteBookings) ? staffData.canDeleteBookings : false,
      };
      const passwordHash = await hashPassword(staffData.password);
      const { error } = await supabase.from('staff').insert({
        name: staffData.name,
        username: staffData.username,
        password_hash: passwordHash,
        role,
        ...permissions,
      });
      if (error) throw error;
      await logAudit(supabase, staff, 'create', 'staff', staffData.username, { name: staffData.name, role });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      if (!isObject(staffData) || !isNonEmptyString(staffData.id) || !isNonEmptyString(staffData.name)) {
        return new Response(JSON.stringify({ error: 'Missing staff id or name' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const updateData: Record<string, string | boolean> = {
        name: staffData.name,
        role: isOneOf(staffData.role, ['super_admin', 'admin'] as const) ? staffData.role : 'admin',
        can_update_status: isBoolean(staffData.canUpdateStatus) ? staffData.canUpdateStatus : false,
        can_edit_bookings: isBoolean(staffData.canEditBookings) ? staffData.canEditBookings : false,
        can_add_walk_ins: isBoolean(staffData.canAddWalkIns) ? staffData.canAddWalkIns : false,
        can_delete_bookings: isBoolean(staffData.canDeleteBookings) ? staffData.canDeleteBookings : false,
      };
      if (isNonEmptyString(staffData.password)) {
        updateData.password_hash = await hashPassword(staffData.password);
      }
      const { error } = await supabase.from('staff').update(updateData).eq('id', staffData.id);
      if (error) throw error;
      await logAudit(supabase, staff, 'update', 'staff', staffData.id, { name: staffData.name, role: updateData.role, passwordChanged: !!updateData.password_hash });
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      if (!isObject(staffData) || !isNonEmptyString(staffData.id)) {
        return new Response(JSON.stringify({ error: 'Missing staff id' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase.from('staff').delete().eq('id', staffData.id);
      if (error) throw error;
      await logAudit(supabase, staff, 'delete', 'staff', staffData.id);
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
