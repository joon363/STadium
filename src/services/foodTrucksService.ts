import { FoodTruckItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

export async function getSupabaseFoodTrucks(
  forceRefresh: boolean = false
): Promise<FoodTruckItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<FoodTruckItem[]>('food_trucks');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('food_trucks')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase FoodTrucks Fetch Error]', error);
      return [];
    }

    const formatted: FoodTruckItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      menuSummary: r.menu_summary || '',
      location: r.location || '',
      operatingHours: r.operating_hours || '',
      icon: r.icon || '🚚',
      imageUrl: r.image_url || '',
      isActive: r.is_active ?? true,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('food_trucks', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase FoodTrucks Exception]', err);
    return [];
  }
}

export async function upsertSupabaseFoodTruck(
  item: FoodTruckItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('food_trucks').upsert({
      id: item.id,
      name: item.name,
      menu_summary: item.menuSummary,
      location: item.location,
      operating_hours: item.operatingHours,
      icon: item.icon,
      image_url: item.imageUrl || '',
      is_active: item.isActive,
      display_order: item.displayOrder,
    });
    if (error) return { success: false, error: error.message };
    invalidateAppCache('food_trucks');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseFoodTruck(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('food_trucks').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('food_trucks');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
