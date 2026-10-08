export interface PureSMSResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendPureSMS(
  to: string,
  content: string,
  sender?: string,
): Promise<PureSMSResult> {
  const apiKey = Deno.env.get('PURESMS_API_KEY');
  if (!apiKey) {
    return { success: false, error: 'PureSMS API key not configured' };
  }

  const defaultSender = Deno.env.get('PURESMS_SENDER') || 'PitterPotP';
  const from = (sender?.trim() || defaultSender).slice(0, 11);

  try {
    const response = await fetch('https://connect-api.divergent.cloud/sms/send', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: from,
        recipient: to,
        content,
        clientTag: 'pitter-potter',
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('PureSMS error:', data);
      const detail =
        data.errors?.generalErrors?.join(', ') ||
        (data.errors ? Object.values(data.errors).flat().join(', ') : '') ||
        data.message;
      return { success: false, error: detail || `HTTP ${response.status}` };
    }

    return { success: true, id: data.id || data.batchId };
  } catch (err) {
    console.error('PureSMS send error:', err);
    return { success: false, error: 'Failed to send SMS via PureSMS' };
  }
}

export async function getPureSMSUsage(
  days: number = 30,
): Promise<{ count: number; totalCost: string; currency: string; recent: any[] } | { error: string }> {
  const apiKey = Deno.env.get('PURESMS_API_KEY');
  if (!apiKey) {
    return { error: 'PureSMS API key not configured' };
  }

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const dateStart = startDate.toISOString().split('T')[0];
  const dateEnd = endDate.toISOString().split('T')[0];

  try {
    const response = await fetch(
      `https://connect-api.divergent.cloud/reporting/client-tag-report?dateStart=${dateStart}&dateEnd=${dateEnd}&clientTag=pitter-potter`,
      {
        headers: {
          'X-Api-Key': apiKey,
          'Accept': 'application/json',
        },
      },
    );
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('PureSMS usage error:', data);
      return { error: data.message || `HTTP ${response.status}` };
    }

    const summaries = data.summaries || [];
    const count = summaries.reduce((sum: number, s: any) => sum + (s.sentCount || 0), 0);
    const total = summaries.reduce((sum: number, s: any) => sum + (s.totalCostGbp || 0), 0);
    return { count, totalCost: total.toFixed(4), currency: 'GBP', recent: [] };
  } catch (err) {
    console.error('PureSMS usage fetch error:', err);
    return { error: 'Failed to fetch PureSMS usage' };
  }
}
