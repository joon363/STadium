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
  const channel = client
    .channel('public-schedule-realtime')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (tables.includes(payload.table)) {
        invalidateAppCache(payload.table);
        onUpdate(payload.table, payload);
      }
    })
    .subscribe();

  return () => {
    client.removeChannel(channel);
  };
}
