import { SponsorItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

export async function getSupabaseSponsors(forceRefresh: boolean = false): Promise<SponsorItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<SponsorItem[]>('sponsors');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase Sponsors Fetch Error]', error);
      return [];
    }

    const formatted: SponsorItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      tier: r.tier || 'gold',
      logoUrl: r.logo_url || '',
      description: r.description || '',
      websiteUrl: r.website_url || '',
      isActive: r.is_active ?? true,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('sponsors', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Sponsors Exception]', err);
    return [];
  }
}

export async function upsertSupabaseSponsor(
  item: SponsorItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('sponsors').upsert({
      id: item.id,
      name: item.name,
      tier: item.tier,
      logo_url: item.logoUrl || '',
      description: item.description || '',
      website_url: item.websiteUrl || '',
      is_active: item.isActive,
      display_order: item.displayOrder,
    });
    if (error) return { success: false, error: error.message };
    invalidateAppCache('sponsors');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseSponsor(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('sponsors');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
