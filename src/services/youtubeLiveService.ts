import { YouTubeLiveItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';
import { parseBilingual } from '../utils/bilingual';

export const DEFAULT_YOUTUBE_LIVE_LIST: YouTubeLiveItem[] = [
  {
    sportKey: 'main',
    name: '통합 메인 중계 ||| Main Broadcast',
    icon: '👑',
    url: 'https://www.youtube.com/@pbs1606',
    isActive: true,
  },
  {
    sportKey: 'soccer_prelim',
    name: '축구 · 예선 ||| Soccer · Preliminaries',
    icon: '⚽',
    url: 'https://youtube.com/live/03jq8FNaxcM?feature=share',
    isActive: true,
  },
  {
    sportKey: 'soccer_finals',
    name: '축구 · 본/결선 ||| Soccer · Semis & Final',
    icon: '⚽',
    url: 'https://youtube.com/live/cOEy64iWOQo?feature=share',
    isActive: true,
  },
  {
    sportKey: 'basketball_prelim',
    name: '농구 · 예선 ||| Basketball · Preliminaries',
    icon: '🏀',
    url: 'https://youtube.com/live/zNODgXZPwZE?feature=share',
    isActive: true,
  },
  {
    sportKey: 'basketball_finals',
    name: '농구 · 본/결선 ||| Basketball · Semis & Final',
    icon: '🏀',
    url: 'https://youtube.com/live/UecpecndOSM?feature=share',
    isActive: true,
  },
  {
    sportKey: 'baseball_prelim',
    name: '야구 · 예선 ||| Baseball · Preliminaries',
    icon: '⚾',
    url: 'https://youtube.com/live/bYTqLNtqohU?feature=share',
    isActive: true,
  },
  {
    sportKey: 'baseball_finals',
    name: '야구 · 본/결선 ||| Baseball · Semis & Final',
    icon: '⚾',
    url: 'https://youtube.com/live/JgtfcLLOE84?feature=share',
    isActive: true,
  },
  {
    sportKey: 'lol_prelim_1',
    name: 'LoL (E-Sports) · 예선 1 ||| LoL (E-Sports) · Qualifier 1',
    icon: '🎮',
    url: 'https://youtube.com/live/oKLuvXBHGWg?feature=share',
    isActive: true,
  },
  {
    sportKey: 'lol_prelim_2',
    name: 'LoL (E-Sports) · 예선 2 ||| LoL (E-Sports) · Qualifier 2',
    icon: '🎮',
    url: 'https://youtube.com/live/TAcAS58Rn5A?feature=share',
    isActive: true,
  },
  {
    sportKey: 'lol_prelim_3',
    name: 'LoL (E-Sports) · 예선 3 ||| LoL (E-Sports) · Qualifier 3',
    icon: '🎮',
    url: 'https://youtube.com/live/jUDMWqcQyXE?feature=share',
    isActive: true,
  },
  {
    sportKey: 'lol_finals',
    name: 'LoL (E-Sports) · 본/결선 ||| LoL (E-Sports) · Semis & Final',
    icon: '🎮',
    url: 'https://youtube.com/live/RSeHDRgqnko?feature=share',
    isActive: true,
  },
  {
    sportKey: 'badminton',
    name: '배드민턴 실시간 중계 ||| Badminton Live',
    icon: '🏸',
    url: 'https://www.youtube.com/@pbs1606',
    isActive: true,
  },
  {
    sportKey: 'badminton_men',
    name: "배드민턴 남자복식 ||| Badminton Men's Doubles",
    icon: '🏸',
    url: 'https://youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'badminton_women',
    name: "배드민턴 여자복식 ||| Badminton Women's Doubles",
    icon: '🏸',
    url: 'https://youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'badminton_mixed',
    name: '배드민턴 혼성복식 ||| Badminton Mixed Doubles',
    icon: '🏸',
    url: 'https://youtube.com/@stadium_official',
    isActive: true,
  },
  {
    sportKey: 'stage',
    name: '문화공연 메인 무대 중계 ||| Main Stage Live',
    icon: '🎤',
    url: 'https://www.youtube.com/@pbs1606',
    isActive: true,
  },
];

function getRoundSpecificStreamKey(sportKey: string, round?: string): string | null {
  const { ko, en } = parseBilingual(round || '');
  const text = `${ko} ${en}`.trim();
  if (!text) return null;

  if (sportKey === 'lol') {
    if (/예선\s*1|qualifier\s*1|prelim.*1|qf.*1|game\s*1\b/i.test(text)) return 'lol_prelim_1';
    if (/예선\s*2|qualifier\s*2|prelim.*2|qf.*2|game\s*2\b/i.test(text)) return 'lol_prelim_2';
    if (/예선\s*3|qualifier\s*3|prelim.*3|qf.*3|game\s*3\b/i.test(text)) return 'lol_prelim_3';
    if (/본선|준결|결선|결승|semi|\bsf\b|final|4경기|game\s*4\b/i.test(text)) return 'lol_finals';
    return null;
  }

  if (sportKey === 'soccer' || sportKey === 'basketball' || sportKey === 'baseball') {
    if (/예선|prelim|qualifier|quarterfinal|\bqf\b/i.test(text)) {
      return `${sportKey}_prelim`;
    }
    if (/본선|준결|결선|결승|3.*4위|semi|\bsf\b|final|3rd/i.test(text)) {
      return `${sportKey}_finals`;
    }
  }

  return null;
}

/**
 * Resolve the active YouTube Live URL by checking exact key, round-specific stream key,
 * sport fallback, and main broadcast channel.
 */
export function resolveYoutubeLiveUrl(
  list: YouTubeLiveItem[],
  targetKey: string = 'main',
  round?: string,
  fallbackSportKey?: string,
  fallbackMainUrl?: string
): string {
  const findActive = (key?: string) => {
    if (!key) return undefined;
    const item = list.find((it) => it.sportKey === key);
    return item && item.url && item.isActive ? item.url : undefined;
  };

  // 1. Exact key lookup (direct channel key or match-level key if registered)
  const direct = findActive(targetKey);
  if (direct) return direct;

  // 2. Round-specific key lookup for sports with split prelim/finals streams
  const effectiveSport = fallbackSportKey || targetKey;
  const roundKey = getRoundSpecificStreamKey(effectiveSport, round);
  const byRound = findActive(roundKey || undefined);
  if (byRound) return byRound;

  // 3. Fallback by sport key or prelim stream if round didn't specify
  const bySport =
    findActive(effectiveSport) ||
    (effectiveSport.startsWith('badminton_') ? findActive('badminton') : undefined) ||
    findActive(`${effectiveSport}_prelim`) ||
    findActive(`${effectiveSport}_finals`) ||
    findActive(`${effectiveSport}_prelim_1`);
  if (bySport) return bySport;

  // 4. Global main channel fallback
  return (
    findActive('main') || fallbackMainUrl || 'https://www.youtube.com/@stadium_official'
  );
}

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
  forceRefresh = false,
  round?: string
): Promise<string> {
  const list = await getSupabaseYoutubeLiveList(forceRefresh);
  return resolveYoutubeLiveUrl(list, sportKey, round);
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
    const { error } = await supabase.from('youtube_live').upsert(
      {
        sport_key: item.sportKey,
        name: item.name,
        icon: item.icon,
        url: item.url,
        is_active: item.isActive,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'sport_key' }
    );

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

