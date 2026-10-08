import { sendPureSMS, getPureSMSUsage } from './puresms.ts';

export type SMSProvider = 'twilio' | 'puresms' | 'none';

export async function getConfiguredSMSProvider(
  // deno-lint-ignore no-explicit-any
  supabase: any,
): Promise<SMSProvider> {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'sms_provider')
    .single();
  if (data?.value === 'twilio' || data?.value === 'puresms') {
    return data.value as SMSProvider;
  }
  // Fallback to env detection when no explicit setting exists.
  if (Deno.env.get('PURESMS_API_KEY')) return 'puresms';
  if (Deno.env.get('TWILIO_ACCOUNT_SID') && Deno.env.get('TWILIO_AUTH_TOKEN')) return 'twilio';
  return 'none';
}

export async function getTwilioBalance(): Promise<{ balance: string; currency: string } | { error: string }> {
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

export async function getTwilioUsage(
  days: number = 30,
): Promise<{ count: number; totalCost: string; currency: string; recent: any[] } | { error: string }> {
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
      { headers: { 'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}` } },
    );
    if (!response.ok) return { error: 'Failed to fetch usage' };
    const data = await response.json();
    const records = data.usage_records || [];
    const total = records.reduce((sum: number, r: any) => sum + parseFloat(r.price || '0'), 0);
    const count = records.reduce((sum: number, r: any) => sum + (r.count || 0), 0);

    const msgParams = new URLSearchParams({ 'PageSize': '20' });
    const msgResponse = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json?${msgParams}`,
      { headers: { 'Authorization': `Basic ${btoa(`${accountSid}:${authToken}`)}` } },
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

export interface SendSMSOptions {
  to: string;
  body: string;
  senderId?: string;
  statusCallback?: string;
}

export async function sendSMS(
  provider: SMSProvider,
  options: SendSMSOptions,
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (provider === 'puresms') {
    return await sendPureSMS(options.to, options.body, options.senderId);
  }

  if (provider === 'twilio') {
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    if (!accountSid || !authToken) {
      return { success: false, error: 'Twilio not configured' };
    }
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams();
      params.append('From', options.senderId || Deno.env.get('TWILIO_PHONE_NUMBER') || 'PitterPotter');
      params.append('To', options.to);
      params.append('Body', options.body);
      if (options.statusCallback) {
        params.append('StatusCallback', options.statusCallback);
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
      return { success: true, id: data.sid };
    } catch {
      return { success: false, error: 'Failed to send SMS' };
    }
  }

  return { success: false, error: 'No SMS provider configured' };
}
