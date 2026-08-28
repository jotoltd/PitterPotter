import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isString } from '../_shared/validate.ts';
import { verifyStaff } from '../_shared/auth.ts';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';

interface StaffPayload {
  username: string;
  sessionToken: string;
  role: string;
}

async function getTwilioBalance(): Promise<{ balance: string; currency: string } | { error: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!accountSid || !authToken) return { error: 'Twilio not configured' };

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Balance.json`, {
      headers: { 'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}` },
    });
    if (!response.ok) return { error: 'Failed to fetch balance' };
    const data = await response.json();
    return { balance: data.balance, currency: data.currency };
  } catch {
    return { error: 'Failed to fetch balance' };
  }
}

async function getTwilioUsage(days: number = 30): Promise<{ count: number; totalCost: string; currency: string; recent: any[] } | { error: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  if (!accountSid || !authToken) return { error: 'Twilio not configured' };

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const params = new URLSearchParams({
      'Category': 'sms',
      'StartDate': startDate.toISOString().split('T')[0],
      'EndDate': endDate.toISOString().split('T')[0],
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Usage/Records.json?${params}`,
      { headers: { 'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}` } }
    );
    if (!response.ok) return { error: 'Failed to fetch usage' };
    const data = await response.json();
    const records = data.usage_records || [];
    const total = records.reduce((sum: number, r: any) => sum + parseFloat(r.price || '0'), 0);
    const count = records.reduce((sum: number, r: any) => sum + (r.count || 0), 0);

    const msgParams = new URLSearchParams({
      'PageSize': '20',
      'From': Deno.env.get('TWILIO_PHONE_NUMBER') || '',
    });
    const msgResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?${msgParams}`,
      { headers: { 'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}` } }
    );
    let recent: any[] = [];
    if (msgResponse.ok) {
      const msgData = await msgResponse.json();
      recent = (msgData.messages || []).map((m: any) => ({
        to: m.to,
        body: m.body,
        status: m.status,
        direction: m.direction,
        dateSent: m.date_sent,
        price: m.price,
        errorCode: m.error_code,
        errorMessage: m.error_message,
      }));
    }

    return {
      count,
      totalCost: total.toFixed(4),
      currency: records[0]?.price_unit || 'USD',
      recent,
    };
  } catch {
    return { error: 'Failed to fetch usage' };
  }
}

async function sendTestSMS(to: string, body: string, studio?: string): Promise<{ success: boolean; error?: string; sid?: string }> {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');
  if (!accountSid || !authToken || !fromNumber) return { success: false, error: 'Twilio not configured' };

  const senderId = studio
    ? (studio.toLowerCase().includes('wimbledon') ? 'PitterPotW' : 'PitterPotP')
    : fromNumber;

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const params = new URLSearchParams();
    params.append('From', senderId);
    params.append('To', to);
    params.append('Body', body);
    const projectUrl = Deno.env.get('SUPABASE_URL');
    if (projectUrl) {
      params.append('StatusCallback', `${projectUrl}/functions/v1/twilio-webhook`);
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
      return { success: false, error: errorData.message || 'Failed to send SMS' };
    }

    const data = await response.json();
    return { success: true, sid: data.sid };
  } catch (err) {
    return { success: false, error: 'Failed to send SMS' };
  }
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

  try {
    const body = await req.json();
    if (!isObject(body)) {
      return new Response(JSON.stringify({ error: 'Invalid request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, staff: staffData } = body as { action: string; staff: StaffPayload };
    if (!staffData || !isNonEmptyString(staffData.username) || !isNonEmptyString(staffData.sessionToken)) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const staff = await verifyStaff(supabase as any, staffData.username, staffData.sessionToken);
    if (!staff) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (staff.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: 'Super admin only' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'balance') {
      const result = await getTwilioBalance();
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'usage') {
      const days = typeof body.days === 'number' ? body.days : 30;
      const result = await getTwilioUsage(days);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'send') {
      const { to, message, studio } = body as { to: string; message: string; studio?: string };
      if (!isNonEmptyString(to) || !isNonEmptyString(message)) {
        return new Response(JSON.stringify({ error: 'Missing phone number or message' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const result = await sendTestSMS(to, message, studio);

      try {
        await supabase.from('email_logs').insert({
          email_type: 'admin_test_sms',
          recipient: to,
          subject: 'Admin Test SMS',
          resend_id: result.sid || null,
          status: result.success ? 'sent' : 'failed',
        });
      } catch (logErr) {
        console.error('Failed to log SMS:', logErr);
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'listTemplates') {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('*')
        .order('name', { ascending: true });
      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to load templates' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ templates: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'updateTemplate') {
      const { templateKey, body: templateBody } = body as { templateKey: string; body: string };
      if (!isNonEmptyString(templateKey) || !isString(templateBody)) {
        return new Response(JSON.stringify({ error: 'Missing template key or body' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error } = await supabase
        .from('sms_templates')
        .update({ body: templateBody, updated_at: new Date().toISOString() })
        .eq('template_key', templateKey);
      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to update template' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'smsLogs') {
      const { data, error } = await supabase
        .from('email_logs')
        .select('*')
        .or('email_type.like.%sms%')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        return new Response(JSON.stringify({ error: 'Failed to load SMS logs' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ logs: data }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('admin-sms error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
