export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;

  if (!cronSecret || !supabaseUrl) {
    return res.status(500).json({ error: 'Missing CRON_SECRET or SUPABASE_URL' });
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-party-reminders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || ''}`,
      },
      body: JSON.stringify({ cronSecret }),
    });

    const data = await response.json().catch(() => ({ error: 'Failed to parse response' }));
    return res.status(response.ok ? 200 : 502).json(data);
  } catch (err) {
    console.error('Cron error:', err);
    return res.status(500).json({ error: 'Failed to run party reminder cron' });
  }
}
