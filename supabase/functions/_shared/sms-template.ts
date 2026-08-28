import { createClient } from 'supabase';
import { renderTemplate } from './email-template.ts';

export interface SMSTemplate {
  body: string;
}

export async function loadSMSTemplate(templateKey: string): Promise<SMSTemplate | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from('sms_templates')
    .select('body')
    .eq('template_key', templateKey)
    .single();

  if (error || !data) return null;
  return { body: data.body };
}

export { renderTemplate };
