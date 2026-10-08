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

export async function sendSMS(options: SendSMSOptions): Promise<{ success: boolean; error?: string; id?: string }> {
  return await sendPureSMS(options.to, options.body, options.senderId);
}
