import { createClient } from 'supabase';

export interface EmailTemplate {
  subject: string;
  html_content: string;
}

export async function loadEmailTemplate(templateKey: string): Promise<EmailTemplate | null> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data, error } = await supabase
    .from('email_templates')
    .select('subject, html_content')
    .eq('template_key', templateKey)
    .single();

  if (error || !data) return null;
  return { subject: data.subject, html_content: data.html_content };
}

export function renderTemplate(template: string, variables: Record<string, string | number | undefined>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}
