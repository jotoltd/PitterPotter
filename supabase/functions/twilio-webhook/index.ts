import { createClient } from 'supabase';
import { corsHeaders as makeCorsHeaders, optionsResponse } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return optionsResponse(req, true);
  const corsHeaders = makeCorsHeaders(req, true);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    let formData: FormData;
    if (req.headers.get('content-type')?.includes('application/x-www-form-urlencoded')) {
      formData = await req.formData();
    } else {
      const text = await req.text();
      formData = new URLSearchParams(text) as unknown as FormData;
    }

    const messageSid = formData.get('MessageSid') as string;
    const messageStatus = formData.get('MessageStatus') as string;
    const to = formData.get('To') as string;
    const from = formData.get('From') as string;
    const body = formData.get('Body') as string;
    const errorCode = formData.get('ErrorCode') as string | null;
    const errorMessage = formData.get('ErrorMessage') as string | null;

    // Handle inbound STOP/UNSTOP for SMS compliance
    if (body && from) {
      const upperBody = body.trim().toUpperCase();
      if (upperBody === 'STOP' || upperBody === 'STOPALL' || upperBody === 'CANCEL' || upperBody === 'END' || upperBody === 'QUIT') {
        try {
          await supabase.from('sms_opt_outs').upsert({
            phone: from,
            opted_out_at: new Date().toISOString(),
            reason: 'STOP keyword',
          }, { onConflict: 'phone' });
          console.log(`SMS opt-out recorded for ${from}`);
        } catch (e) { console.error('Failed to record opt-out:', e); }
        return new Response('ok', { headers: corsHeaders });
      }
      if (upperBody === 'UNSTOP' || upperBody === 'START' || upperBody === 'YES') {
        try {
          await supabase.from('sms_opt_outs').upsert({
            phone: from,
            opted_out_at: new Date().toISOString(),
            opted_in_at: new Date().toISOString(),
            reason: 'UNSTOP keyword',
          }, { onConflict: 'phone' });
          console.log(`SMS opt-in recorded for ${from}`);
        } catch (e) { console.error('Failed to record opt-in:', e); }
        return new Response('ok', { headers: corsHeaders });
      }
    }

    if (!messageSid || !messageStatus) {
      return new Response('ok', { headers: corsHeaders });
    }

    console.log(`Twilio webhook: SID=${messageSid}, Status=${messageStatus}, To=${to}, ErrorCode=${errorCode}`);

    // Log webhook health
    try {
      await supabase.from('webhook_health').insert({
        source: 'twilio',
        event_type: messageStatus,
      });
    } catch { /* ignore */ }

    const updateData: Record<string, any> = {
      status: messageStatus,
    };
    if (errorCode) updateData.error_code = parseInt(errorCode, 10) || null;
    if (errorMessage) updateData.error_message = errorMessage;

    const { error } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('resend_id', messageSid)
      .in('email_type', ['collection_ready_sms', 'admin_test_sms']);

    if (error) {
      console.error('Failed to update SMS log:', error);
    }

    return new Response('ok', { headers: corsHeaders });
  } catch (err) {
    console.error('Twilio webhook error:', err);
    return new Response('ok', { headers: corsHeaders });
  }
});
