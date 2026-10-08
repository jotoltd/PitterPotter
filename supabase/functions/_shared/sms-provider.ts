import { sendPureSMS } from './puresms.ts';

export type SMSProvider = 'puresms' | 'none';

export function getConfiguredSMSProvider(): SMSProvider {
  return Deno.env.get('PURESMS_API_KEY') ? 'puresms' : 'none';
}

export interface SendSMSOptions {
  to: string;
  body: string;
  senderId?: string;
}

/** Normalise a phone number to E.164. UK local numbers get +44. */
export function normalizeUKPhone(phone: string): string {
  let to = phone.trim().replace(/[\s()-]/g, '');
  if (to.startsWith('07')) return '+44' + to.substring(1);
  if (to.startsWith('7') && !to.startsWith('+')) return '+44' + to;
  if (!to.startsWith('+')) return '+' + to;
  return to;
}

export async function sendSMS(options: SendSMSOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  return await sendPureSMS(normalizeUKPhone(options.to), options.body, options.senderId);
}
