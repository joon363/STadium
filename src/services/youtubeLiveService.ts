import { YouTubeLiveItem, LiveStreamKey } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

export const DEFAULT_YOUTUBE_LIVE_LIST: YouTubeLiveItem[] = [
  {
    sportKey: 'main',
    name: '통합 메인 중계',
    icon: '👑',
    url: 'https://www.youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'soccer',
    name: '축구 실시간 중계',
    icon: '⚽',
    url: 'https://www.youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'baseball',
    name: '야구 실시간 중계',
    icon: '⚾',
    url: 'https://www.youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'lol',
    name: 'LoL 실시간 중계',
    icon: '🎮',
    url: 'https://www.youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'badminton',
    name: '배드민턴 실시간 중계',
    icon: '🏸',
    url: 'https://www.youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'basketball',
    name: '농구 실시간 중계',
    icon: '🏀',
    url: 'https://www.youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'stage',
    name: '문화공연 메인 무대 중계',
    icon: '🎤',
    url: 'https://www.youtube.com/@stadium_official',
    isActive: true,
  },
];

const CACHE_KEY = 'youtube_live_list';

/**
 * Fetch all YouTube Live channels/links
 */
export async function getSupabaseYoutubeLiveList(
  forceRefresh = false
): Promise<YouTubeLiveItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<YouTubeLiveItem[]>(CACHE_KEY);
    if (cached && cached.length > 0) return cached;
  }

  if (!supabase) return DEFAULT_YOUTUBE_LIVE_LIST;

  try {
    // 1. Try dedicated youtube_live table
    const { data, error } = await supabase
      .from('youtube_live')
      .select('*')
      .order('sport_key', { ascending: true });

    if (!error && data && data.length > 0) {
      const items: YouTubeLiveItem[] = data.map((row: any) => {
        const fallback = DEFAULT_YOUTUBE_LIVE_LIST.find((d) => d.sportKey === (row.sport_key || row.key));
        return {
          sportKey: row.sport_key || row.key,
          name: row.name || fallback?.name || row.sport_key || row.key,
          icon: row.icon || fallback?.icon || '🏆',
          url: row.url || 'https://www.youtube.com/@stadium_official',
          isActive: row.is_active ?? true,
          updatedAt: row.updated_at,
        };
      });

      // Merge with any missing defaults
      const merged = DEFAULT_YOUTUBE_LIVE_LIST.map((def) => {
        const found = items.find((it) => it.sportKey === def.sportKey);
        return found || def;
      });

      saveToCache(CACHE_KEY, merged);
      return merged;
    }

    // 2. Fallback to admin_settings json or single url
    const { data: adminSettings, error: adminErr } = await supabase
      .from('admin_settings')
      .select('key, value')
      .in('key', ['youtube_live_urls', 'youtube_live_url']);

    if (!adminErr && adminSettings && adminSettings.length > 0) {
      const listSetting = adminSettings.find((s) => s.key === 'youtube_live_urls');
      if (listSetting && listSetting.value) {
        try {
          const parsed = JSON.parse(listSetting.value);
          if (Array.isArray(parsed) && parsed.length > 0) {
            saveToCache(CACHE_KEY, parsed);
            return parsed;
          }
        } catch {}
      }

      const singleSetting = adminSettings.find((s) => s.key === 'youtube_live_url');
      if (singleSetting && singleSetting.value) {
        const merged = DEFAULT_YOUTUBE_LIVE_LIST.map((item) => ({
          ...item,
          url: singleSetting.value,
        }));
        saveToCache(CACHE_KEY, merged);
        return merged;
      }
    }

    saveToCache(CACHE_KEY, DEFAULT_YOUTUBE_LIVE_LIST);
    return DEFAULT_YOUTUBE_LIVE_LIST;
  } catch (err) {
    console.warn('getSupabaseYoutubeLiveList fallback notice:', err);
    return DEFAULT_YOUTUBE_LIVE_LIST;
  }
}

/**
 * Get YouTube Live URL for a specific sport / stage
 */
export async function getSupabaseYoutubeLiveByKey(
  sportKey: string = 'main',
  forceRefresh = false
): Promise<string> {
  const list = await getSupabaseYoutubeLiveList(forceRefresh);
  const found = list.find((item) => item.sportKey === sportKey);
  if (found && found.url && found.isActive) {
    return found.url;
  }
  const main = list.find((item) => item.sportKey === 'main');
  return main?.url || 'https://www.youtube.com/@stadium_official';
}

/**
 * Upsert a YouTube live channel in Supabase
 */
export async function upsertSupabaseYoutubeLive(item: YouTubeLiveItem): Promise<boolean> {
  const currentList = await getSupabaseYoutubeLiveList(false);
  const updatedList = [
    ...currentList.filter((x) => x.sportKey !== item.sportKey),
    { ...item, updatedAt: new Date().toISOString() },
  ];
  saveToCache(CACHE_KEY, updatedList);

  if (!supabase) return true;

  try {
    // 1. Try upserting into youtube_live table
    const { error } = await supabase.from('youtube_live').upsert({
      sport_key: item.sportKey,
      name: item.name,
      icon: item.icon,
      url: item.url,
      is_active: item.isActive,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      // 2. Fallback to admin_settings table
      console.warn('Upsert to youtube_live table failed, saving to admin_settings:', error);
      await supabase.from('admin_settings').upsert({
        key: 'youtube_live_urls',
        value: JSON.stringify(updatedList),
      });
      if (item.sportKey === 'main') {
        await supabase.from('admin_settings').upsert({
          key: 'youtube_live_url',
          value: item.url,
        });
      }
    }

    invalidateAppCache(CACHE_KEY);
    return true;
  } catch (err) {
    console.error('upsertSupabaseYoutubeLive error:', err);
    return false;
  }
}

/**
 * Single URL helper for backward compatibility
 */
export async function getSupabaseYoutubeLiveUrl(forceRefresh = false): Promise<string> {
  return getSupabaseYoutubeLiveByKey('main', forceRefresh);
}

export async function updateSupabaseYoutubeLiveUrl(newUrl: string): Promise<boolean> {
  const mainItem = DEFAULT_YOUTUBE_LIVE_LIST[0];
  return upsertSupabaseYoutubeLive({ ...mainItem, url: newUrl });
}

export async function deleteSupabaseYoutubeLive(sportKey: string): Promise<boolean> {
  if (!supabase) return true;
  try {
    await supabase.from('youtube_live').delete().eq('sport_key', sportKey);
    invalidateAppCache(CACHE_KEY);
    return true;
  } catch {
    return false;
  }
}

