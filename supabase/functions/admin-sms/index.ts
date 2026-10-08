import { createClient } from 'supabase';
import { isObject, isNonEmptyString, isString } from '../_shared/validate.ts';
import { verifyStaff } from '../_shared/auth.ts';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';
import { getConfiguredSMSProvider, sendSMS } from '../_shared/sms-provider.ts';
import { getPureSMSUsage } from '../_shared/puresms.ts';

interface StaffPayload {
  username: string;
  sessionToken: string;
  role: string;
}

async function sendTestSMS(
  to: string,
  body: string,
  studio?: string,
): Promise<{ success: boolean; error?: string; sid?: string; id?: string }> {
  if (getConfiguredSMSProvider() === 'none') {
    return { success: false, error: 'SMS provider not configured' };
  }

  const senderId = studio
    ? (studio.toLowerCase().includes('wimbledon') ? 'PitterPotW' : 'PitterPotP')
    : (Deno.env.get('PURESMS_SENDER') || 'PitterPotP');

  const result = await sendSMS({ to, body, senderId });
  return { success: result.success, error: result.error, sid: result.id, id: result.id };
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

    if (action === 'provider') {
      return new Response(JSON.stringify({ provider: getConfiguredSMSProvider() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'balance') {
      return new Response(JSON.stringify({ error: 'Balance not available for PureSMS' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'usage') {
      const days = typeof body.days === 'number' ? body.days : 30;
      const result = await getPureSMSUsage(days);
      return new Response(JSON.stringify({ provider: 'puresms', ...result }), {
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
          body: message,
          resend_id: result.sid || result.id || null,
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

    if (action === 'resendSMS') {
      const { logId } = body as { logId: string };
      if (!isNonEmptyString(logId)) {
        return new Response(JSON.stringify({ error: 'Missing log ID' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: logEntry } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', logId)
        .single();
      if (!logEntry) {
        return new Response(JSON.stringify({ error: 'Log entry not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const messageBody = logEntry.body || logEntry.subject || '';
      if (!messageBody) {
        return new Response(JSON.stringify({ error: 'No message content to resend' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const result = await sendTestSMS(logEntry.recipient, messageBody);
      try {
        await supabase.from('email_logs').insert({
          email_type: logEntry.email_type,
          recipient: logEntry.recipient,
          subject: logEntry.subject || 'Resent SMS',
          body: messageBody,
          resend_id: result.sid || result.id || null,
          status: result.success ? 'sent' : 'failed',
          booking_id: logEntry.booking_id || null,
        });
      } catch (logErr) {
        console.error('Failed to log resent SMS:', logErr);
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'resendEmail') {
      const { logId } = body as { logId: string };
      if (!isNonEmptyString(logId)) {
        return new Response(JSON.stringify({ error: 'Missing log ID' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { data: logEntry } = await supabase
        .from('email_logs')
        .select('*')
        .eq('id', logId)
        .single();
      if (!logEntry) {
        return new Response(JSON.stringify({ error: 'Log entry not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const emailBody = logEntry.body || '';
      if (!emailBody) {
        return new Response(JSON.stringify({ error: 'No email content to resend' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const resendApiKey = Deno.env.get('RESEND_API_KEY');
      if (!resendApiKey) {
        return new Response(JSON.stringify({ error: 'Resend not configured' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'Pitter Potter <noreply@pitterpotter.co.uk>';
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: logEntry.recipient,
            subject: logEntry.subject || 'Resent email',
            html: emailBody,
          }),
        });
        if (!response.ok) {
          const errData = await response.json().catch(() => ({ message: 'Unknown error' }));
          return new Response(JSON.stringify({ success: false, error: errData.message || 'Failed to resend email' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const resendData = await response.json().catch(() => ({}));
        try {
          await supabase.from('email_logs').insert({
            email_type: logEntry.email_type,
            recipient: logEntry.recipient,
            subject: logEntry.subject || 'Resent email',
            body: emailBody,
            resend_id: resendData.id || null,
            status: 'sent',
            booking_id: logEntry.booking_id || null,
          });
        } catch (logErr) {
          console.error('Failed to log resent email:', logErr);
        }
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: 'Failed to resend email' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    if (action === 'webhookHealth') {
      const hours = typeof body.hours === 'number' ? body.hours : 24;
      const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
      const { data: recent } = await supabase.from('webhook_health')
        .select('*').gte('received_at', since).order('received_at', { ascending: false });
      const resendLast = recent?.find(r => r.source === 'resend');
      const { data: smsRecent } = await supabase.from('email_logs')
        .select('created_at, status').gte('created_at', since).or('email_type.like.%sms%')
        .order('created_at', { ascending: false });
      const smsLast = smsRecent?.[0]?.created_at || null;
      const smsFailed = (smsRecent || []).filter(l => l.status === 'failed').length;
      const now = Date.now();
      const alerts: string[] = [];
      if (resendLast) {
        const ageHours = (now - new Date(resendLast.received_at).getTime()) / 3600000;
        if (ageHours > 6) alerts.push(`Resend webhook silent for ${Math.round(ageHours)}h`);
      }
      if (smsFailed > 0) alerts.push(`${smsFailed} SMS failed in the last ${hours}h`);
      return new Response(JSON.stringify({
        resendLast: resendLast?.received_at || null,
        smsLast,
        smsFailed,
        totalEvents: (recent?.length || 0) + (smsRecent?.length || 0),
        alerts,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'commAlerts') {
      const { data: alerts, error: alertsError } = await supabase.from('comm_alerts').select('*');
      if (alertsError) {
        return new Response(JSON.stringify({ error: 'Failed to load alerts' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ alerts }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'updateCommAlert') {
      const { alertType, threshold, enabled } = body as { alertType: string; threshold: number; enabled: boolean };
      if (!isNonEmptyString(alertType)) {
        return new Response(JSON.stringify({ error: 'Missing alert type' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error: updateError } = await supabase.from('comm_alerts')
        .update({ threshold, enabled, updated_at: new Date().toISOString() })
        .eq('alert_type', alertType);
      if (updateError) {
        return new Response(JSON.stringify({ error: 'Failed to update alert' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
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
