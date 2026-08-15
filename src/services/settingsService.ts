import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

let localAdminPasswordMemory: string = 'stadium2026!';
let localYoutubeLiveUrlMemory = 'https://www.youtube.com/@stadium_official';

// ----- Admin Password -----
export async function getSupabaseAdminPassword(): Promise<string> {
  if (!supabase) return localAdminPasswordMemory;

  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password')
      .maybeSingle();

    if (error || !data) return localAdminPasswordMemory;
    return data.value || localAdminPasswordMemory;
  } catch (err) {
    return localAdminPasswordMemory;
  }
}

export async function updateSupabaseAdminPassword(newPassword: string): Promise<boolean> {
  localAdminPasswordMemory = newPassword;

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: 'admin_password', value: newPassword });

    if (error) {
      console.error('Failed to update admin password in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase password update error:', err);
    return false;
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const current = await getSupabaseAdminPassword();
  return password === current;
}

export async function updateAdminPasswordInSupabase(newPassword: string): Promise<boolean> {
  return updateSupabaseAdminPassword(newPassword);
}

// ----- YouTube Live URL -----
export async function getSupabaseYoutubeLiveUrl(forceRefresh = false): Promise<string> {
  if (!forceRefresh) {
    const cached = getFromCache<string>('youtube_live_url');
    if (cached) return cached;
  }

  if (!supabase) return localYoutubeLiveUrlMemory;

  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'youtube_live_url')
      .maybeSingle();

    if (error || !data || !data.value) {
      return localYoutubeLiveUrlMemory;
    }
    localYoutubeLiveUrlMemory = data.value;
    saveToCache('youtube_live_url', data.value);
    return data.value;
  } catch (err) {
    return localYoutubeLiveUrlMemory;
  }
}

export async function updateSupabaseYoutubeLiveUrl(newUrl: string): Promise<boolean> {
  localYoutubeLiveUrlMemory = newUrl;
  saveToCache('youtube_live_url', newUrl);

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: 'youtube_live_url', value: newUrl });

    if (error) {
      console.error('Failed to update youtube live url in Supabase:', error);
      return false;
    }
    invalidateAppCache('youtube_live_url');
    return true;
  } catch (err) {
    console.error('Supabase youtube live url update error:', err);
    return false;
  }
}

// ----- Tournament Tree Data in Admin Settings -----
export async function getSupabaseTournamentTree(
  sportKey: string,
  forceRefresh = false
): Promise<any | null> {
  const cacheKey = `tournament_tree_${sportKey}`;
  if (!forceRefresh) {
    const cached = getFromCache<any>(cacheKey);
    if (cached) return cached;
  }

  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', cacheKey)
      .maybeSingle();

    if (error || !data || !data.value) {
      return null;
    }
    const parsed = JSON.parse(data.value);
    saveToCache(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.error(`Supabase fetch error for ${cacheKey}:`, err);
    return null;
  }
}

export async function updateSupabaseTournamentTree(
  sportKey: string,
  treeData: any
): Promise<boolean> {
  const cacheKey = `tournament_tree_${sportKey}`;
  saveToCache(cacheKey, treeData);

  if (!supabase) return true;

  try {
    const { error } = await supabase.from('admin_settings').upsert({
      key: cacheKey,
      value: JSON.stringify(treeData),
    });

    if (error) {
      console.error(`Failed to update ${cacheKey} in Supabase:`, error);
      return false;
    }
    invalidateAppCache(cacheKey);
    return true;
  } catch (err) {
    console.error(`Supabase update exception for ${cacheKey}:`, err);
    return false;
  }
}
