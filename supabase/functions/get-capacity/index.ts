import { createClient } from 'supabase';
import { isObject, isNonEmptyString } from '../_shared/validate.ts';
import { isRateLimited, rateLimitResponse, getClientIp } from '../_shared/rate-limit.ts';
import { computeCapacity, StudioName } from '../_shared/capacity.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  if (isRateLimited(`capacity:${clientIp}`, 30, 60_000)) {
    return rateLimitResponse();
  }

  try {
    const body = await req.json();
    if (!isObject(body) || !isNonEmptyString(body.studio) || !isNonEmptyString(body.date) || !isNonEmptyString(body.time)) {
      return new Response(JSON.stringify({ error: 'Missing studio, date or time' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { studio, date, time, sessionType } = body;

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const result = await computeCapacity(supabase, studio as StudioName, date, time, sessionType);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Get capacity error:', err);
    return new Response(JSON.stringify({ error: 'Failed to get capacity' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
