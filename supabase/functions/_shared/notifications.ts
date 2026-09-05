import type { AdminSupabaseClient } from './types.ts';

export type NotificationType =
  | 'booking_new'
  | 'booking_cancelled'
  | 'booking_status_changed'
  | 'booking_walk_in'
  | 'gift_card_purchased'
  | 'gift_card_redeemed'
  | 'collection_ready'
  | 'staff_action';

export async function createNotification(
  supabase: AdminSupabaseClient,
  params: {
    type: NotificationType;
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    studio?: string;
  },
): Promise<void> {
  try {
    await supabase.from('notifications').insert({
      type: params.type,
      title: params.title,
      message: params.message,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      studio: params.studio || null,
    });
  } catch (err) {
    console.error('createNotification error:', err);
  }
}
