import { createClient } from 'supabase';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body = await req.text();
    const event = JSON.parse(body);

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const resendId = event.data?.id || event.id;
    const eventType = event.type || event.event_type;
    const to = event.data?.to || event.to || '';
    const subject = event.data?.subject || event.subject || '';
    const error = event.data?.error || event.error || null;

    const statusMap: Record<string, string> = {
      'email.sent': 'sent',
      'email.delivered': 'delivered',
      'email.bounced': 'bounced',
      'email.complained': 'complained',
      'email.opened': 'opened',
      'email.clicked': 'clicked',
      'email.failed': 'failed',
    };

    const status = statusMap[eventType] || 'sent';

    const { data: existing } = await supabase
      .from('email_logs')
      .select('id')
      .eq('resend_id', resendId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('email_logs')
        .update({ status, error, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('email_logs')
        .insert({
          resend_id: resendId,
          recipient: to,
          subject,
          status,
          error,
          email_type: 'general',
        });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error('Resend webhook error:', err);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), { status: 400 });
  }
});
