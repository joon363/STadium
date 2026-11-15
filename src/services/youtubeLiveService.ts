import { YouTubeLiveItem } from '../types/stadium';
import { parseBilingual } from '../utils/bilingual';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

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


export async function getSupabaseYoutubeLiveList(_forceRefresh = false): Promise<YouTubeLiveItem[]> { return ARCHIVED_SNAPSHOT.youtubeLiveList; }
export async function getSupabaseYoutubeLiveByKey(sportKey: string): Promise<string> { const item = ARCHIVED_SNAPSHOT.youtubeLiveList.find((i) => i.sportKey === sportKey); return item?.url || ''; }
export async function upsertSupabaseYoutubeLive(_item: YouTubeLiveItem): Promise<boolean> { return true; }
export async function getSupabaseYoutubeLiveUrl(_forceRefresh = false): Promise<string> { const main = ARCHIVED_SNAPSHOT.youtubeLiveList.find((i) => i.sportKey === 'main'); return main?.url || 'https://www.youtube.com/@pbs1606'; }
export async function updateSupabaseYoutubeLiveUrl(_newUrl: string): Promise<boolean> { return true; }
export async function deleteSupabaseYoutubeLive(_sportKey: string): Promise<boolean> { return true; }
