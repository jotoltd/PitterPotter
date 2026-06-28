export async function logAudit(
  supabase: any,
  staff: { id?: string; username?: string } | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from('audit_logs').insert({
      staff_id: staff?.id || null,
      username: staff?.username || null,
      action,
      entity,
      entity_id: entityId || null,
      details: details || null,
    });
  } catch (err) {
    console.error('Audit log error:', err);
  }
}
