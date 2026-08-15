import { NoticeItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

export async function getSupabaseNotices(forceRefresh: boolean = false): Promise<NoticeItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<NoticeItem[]>('notices');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('id', { ascending: false });

    if (error || !data) {
      console.warn('[Supabase Notices Fetch Error]', error);
      return [];
    }

    const formatted: NoticeItem[] = data.map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      isPinned: r.is_pinned ?? false,
      createdAt: r.created_at,
    }));

    saveToCache('notices', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Notices Exception]', err);
    return [];
  }
}

export async function upsertSupabaseNotice(
  item: NoticeItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const row: any = {
      title: item.title,
      content: item.content,
      is_pinned: item.isPinned,
    };
    if (item.id) row.id = item.id;

    const { error } = await supabase.from('notices').upsert(row);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('notices');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseNotice(
  id: number
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('notices');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
