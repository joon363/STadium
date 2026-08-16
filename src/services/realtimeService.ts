import { supabase } from './supabase/client';
import { invalidateAppCache } from './supabase/cache';

/**
 * Subscribe to Supabase Postgres Changes WebSocket for zero-polling instant push
 */
export function subscribeToRealtimeTables(
  tables: string[],
  onUpdate: (table: string, payload: any) => void
): () => void {
  if (!supabase) return () => {};

  const client = supabase;
  const channelId = `rt-${tables.join('_')}-${Math.random().toString(36).substring(2, 9)}`;
  const channel = client
    .channel(channelId)
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (tables.includes(payload.table)) {
        invalidateAppCache(payload.table);
        onUpdate(payload.table, payload);
      }
    })
    .subscribe();

  return () => {
    try {
      client.removeChannel(channel);
    } catch (e) {
      console.warn('Error removing realtime channel:', e);
    }
  };
}
