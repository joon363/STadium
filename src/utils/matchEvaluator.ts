import {
  RawScheduledMatch,
  MatchItem,
  SportKey,
  SportConfig,
  StageItem,
  EvaluatedStagePerformance,
} from '../types/stadium';
import { DEFAULT_RAW_SCHEDULE_FLAT } from '../constants/defaultSchedule';
import { STAGE_TIMETABLE } from '../constants/defaultStage';

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function evaluateMatchItem(raw: RawScheduledMatch, now: Date = new Date()): MatchItem {
  const start = new Date(now);
  start.setHours(raw.startHour, raw.startMinute, 0, 0);

  const end = new Date(now);
  end.setHours(raw.endHour, raw.endMinute, 0, 0);

  const nowMs = now.getTime();
  const isLive = nowMs >= start.getTime() && nowMs <= end.getTime();
  const isEnded = nowMs > end.getTime();

  let score1 = 0;
  let score2 = 0;
  let winningTeam: string | null = null;
  let statusText = '';
  let countdownText: string | undefined = undefined;

  if (isEnded) {
    score1 = raw.score1Final;
    score2 = raw.score2Final;
    winningTeam = raw.winningTeamFinal || (score1 > score2 ? raw.team1 : score2 > score1 ? raw.team2 : null);
    statusText = '종료';
  } else if (isLive) {
    const elapsedMinutes = Math.max(0, Math.floor((nowMs - start.getTime()) / 60000));
    score1 = raw.score1Final;
    score2 = raw.score2Final;
    winningTeam = score1 > score2 ? raw.team1 : score2 > score1 ? raw.team2 : null;
    statusText = `${elapsedMinutes}분 진행중`;
    countdownText = undefined;
  } else {
    const remainingMs = start.getTime() - nowMs;
    countdownText = formatCountdown(remainingMs);

    if (remainingMs < 7200000) {
      statusText = `시작까지 ${formatCountdown(remainingMs)}`;
    } else {
      statusText = `${formatTime(start)} 예정`;
    }
  }

  return {
    id: raw.id,
    sportKey: raw.sportKey,
    sportName: raw.sportName,
    icon: raw.icon,
    team1: raw.team1,
    team2: raw.team2,
    score1,
    score2,
    isLive,
    statusText,
    venue: raw.venue,
    winningTeam,
    startTimeObj: start,
    endTimeObj: end,
    timeRangeText: `${formatTime(start)} - ${formatTime(end)}`,
    round: raw.round,
    subtitle: raw.subtitle,
    countdownText,
  };
}

export function getRealtimeSportsConfig(
  now: Date = new Date(),
  customMatches?: RawScheduledMatch[] | null,
  selectedSchool: string = 'ALL'
): Record<string, SportConfig> {
  const result: Record<string, SportConfig> = {};
  const allRawMatches = customMatches || DEFAULT_RAW_SCHEDULE_FLAT;
  const sportKeys: SportKey[] = ['soccer', 'baseball', 'lol', 'badminton', 'basketball'];

  const names: Record<SportKey, string> = {
    soccer: '축구',
    baseball: '야구',
    lol: 'LoL',
    badminton: '배드민턴',
    basketball: '농구',
  };

  const icons: Record<SportKey, string> = {
    soccer: '⚽',
    baseball: '⚾',
    lol: '🎮',
    badminton: '🏸',
    basketball: '🏀',
  };

  for (const key of sportKeys) {
    const rawMatches = allRawMatches.filter((m: RawScheduledMatch) => m.sportKey === key);
    const evaluatedSchedule = rawMatches.map((m: RawScheduledMatch) => evaluateMatchItem(m, now));

    let liveMatch: MatchItem;

    if (selectedSchool && selectedSchool !== 'ALL') {
      const schoolMatches = evaluatedSchedule.filter(
        (m: MatchItem) => m.team1 === selectedSchool || m.team2 === selectedSchool
      );

      if (schoolMatches.length > 0) {
        const live = schoolMatches.find((m: MatchItem) => m.isLive);
        const upcoming = schoolMatches.find(
          (m: MatchItem) => m.startTimeObj.getTime() > now.getTime()
        );
        const finished = schoolMatches[schoolMatches.length - 1];
        liveMatch = live || upcoming || finished;
      } else {
        liveMatch =
          evaluatedSchedule.find((m: MatchItem) => m.isLive) ||
          evaluatedSchedule.find((m: MatchItem) => m.startTimeObj.getTime() > now.getTime()) ||
          evaluatedSchedule[evaluatedSchedule.length - 1] ||
          evaluateMatchItem(DEFAULT_RAW_SCHEDULE_FLAT[0], now);
      }
    } else {
      liveMatch =
        evaluatedSchedule.find((m: MatchItem) => m.isLive) ||
        evaluatedSchedule.find((m: MatchItem) => m.startTimeObj.getTime() > now.getTime()) ||
        evaluatedSchedule[evaluatedSchedule.length - 1] ||
        evaluateMatchItem(DEFAULT_RAW_SCHEDULE_FLAT[0], now);
    }

    result[key] = {
      key,
      name: names[key],
      icon: icons[key],
      path: `/${key}`,
      liveMatch,
      schedule: evaluatedSchedule,
    };
  }

  return result;
}

export function getRealtimeStageConfig(
  now: Date = new Date(),
  customStage?: StageItem[] | null
): EvaluatedStagePerformance {
  const timetable = customStage || STAGE_TIMETABLE;
  const nowMs = now.getTime();

  let currentIndex = -1;
  for (let i = 0; i < timetable.length; i++) {
    const item = timetable[i];
    const s = new Date(now);
    s.setHours(item.startHour, item.startMinute, 0, 0);
    const e = new Date(now);
    e.setHours(item.endHour, item.endMinute, 0, 0);

    if (nowMs >= s.getTime() && nowMs <= e.getTime()) {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex === -1) {
    for (let i = 0; i < timetable.length; i++) {
      const item = timetable[i];
      const s = new Date(now);
      s.setHours(item.startHour, item.startMinute, 0, 0);
      if (s.getTime() > nowMs) {
        currentIndex = i;
        break;
      }
    }
    if (currentIndex === -1) currentIndex = timetable.length - 1;
  }

  const currentItem = timetable[currentIndex] || STAGE_TIMETABLE[0];
  const start = new Date(now);
  start.setHours(currentItem.startHour, currentItem.startMinute, 0, 0);
  const end = new Date(now);
  end.setHours(currentItem.endHour, currentItem.endMinute, 0, 0);

  const isLive = nowMs >= start.getTime() && nowMs <= end.getTime();
  const elapsedMin = Math.max(0, Math.floor((nowMs - start.getTime()) / 60000));

  const nextItem = timetable[currentIndex + 1] || timetable[0];
  const nextStart = new Date(now);
  nextStart.setHours(nextItem.startHour, nextItem.startMinute, 0, 0);
  if (nextStart.getTime() <= nowMs) {
    nextStart.setDate(nextStart.getDate() + 1);
  }

  const remainingToNextMs = nextStart.getTime() - nowMs;

  return {
    school: currentItem.school,
    clubName: currentItem.clubName,
    category: currentItem.category || currentItem.genre || '기타',
    genre: currentItem.genre || '',
    songTitle: currentItem.songTitle,
    statusText: isLive ? `${elapsedMin}분 경과` : `${formatTime(start)} 시작 예정`,
    nextClubName: nextItem.clubName,
    nextRemainingText: `약 ${Math.max(1, Math.ceil(remainingToNextMs / 60000))}분 후 `,
    isLive,
  };
}
