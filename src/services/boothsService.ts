import { BoothItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

export async function getSupabaseBooths(forceRefresh: boolean = false): Promise<BoothItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<BoothItem[]>('booths');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase Booths Fetch Error]', error);
      return [];
    }

    const formatted: BoothItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      operator: r.operator || '',
      location: r.location || '',
      category: r.category || 'experience',
      description: r.description || '',
      operatingHours: r.operating_hours || '',
      icon: r.icon || '🎪',
      imageUrl: r.image_url || '',
      isActive: r.is_active ?? true,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('booths', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Booths Exception]', err);
    return [];
  }
}

export async function upsertSupabaseBooth(
  item: BoothItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('booths').upsert({
      id: item.id,
      name: item.name,
      operator: item.operator,
      location: item.location,
      category: item.category,
      description: item.description,
      operating_hours: item.operatingHours,
      icon: item.icon,
      image_url: item.imageUrl || '',
      is_active: item.isActive,
      display_order: item.displayOrder,
    });
    if (error) return { success: false, error: error.message };
    invalidateAppCache('booths');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseBooth(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('booths').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('booths');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
