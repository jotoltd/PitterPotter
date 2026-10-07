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

  const defaultSender = Deno.env.get('PURESMS_SENDER') || 'PitterPotter';
  const from = sender?.trim() || defaultSender;

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
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error('PureSMS error:', data);
      return { success: false, error: data.message || `HTTP ${response.status}` };
    }

    return { success: true, id: data.id || data.batchId };
  } catch (err) {
    console.error('PureSMS send error:', err);
    return { success: false, error: 'Failed to send SMS via PureSMS' };
  }
}
