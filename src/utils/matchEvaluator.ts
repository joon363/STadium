import {
  RawScheduledMatch,
  MatchItem,
  SportKey,
  SportConfig,
  StageItem,
  EvaluatedStagePerformance,
} from '../types/stadium';
import type { Language } from '../context/LanguageContext';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import {
  getLocalizedValue,
  localizeRoundName,
  localizeStageCategory,
  localizeTeamPlaceholder,
  localizeVenueName,
} from './bilingual';

function fmt(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  let out = template;
  for (const [k, v] of Object.entries(params)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
  }
  return out;
}

function getSportNamesMap(language: Language): Record<SportKey, string> {
  const dict = language === 'en' ? en : ko;
  return {
    soccer: dict['sports.soccer'],
    baseball: dict['sports.baseball'],
    lol: 'LoL',
    badminton: dict['sports.badminton'],
    badminton_men: `${dict['sports.badminton']} (${dict['sports.badmintonMenTag']})`,
    badminton_women: `${dict['sports.badminton']} (${dict['sports.badmintonWomenTag']})`,
    badminton_mixed: `${dict['sports.badminton']} (${dict['sports.badmintonMixedTag']})`,
    basketball: dict['sports.basketball'],
  };
}

export const EVENT_MONTH = 10; // November (0-indexed)
export const EVENT_DAY = 14; // 11/14

export function getEventDate(baseNow: Date, hour: number, minute: number): Date {
  return new Date(
    baseNow.getFullYear(),
    EVENT_MONTH,
    EVENT_DAY,
    0,
    hour * 60 + minute,
    0,
    0
  );
}

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatCountdown(ms: number, language: Language = 'ko'): string {
  const dict = language === 'en' ? en : ko;
  if (ms <= 60000) return dict['match.startingSoon'];
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) {
    return minutes > 0
      ? fmt(dict['common.hoursMinutes'], { hours, minutes })
      : fmt(dict['common.hours'], { hours });
  }
  return fmt(dict['common.minutes'], { min: minutes });
}

export function evaluateMatchItem(
  raw: RawScheduledMatch,
  now: Date = new Date(),
  language: Language = 'ko'
): MatchItem {
  const dict = language === 'en' ? en : ko;
  const sportNames = getSportNamesMap(language);
  const start = getEventDate(now, raw.startHour, raw.startMinute);
  const end = getEventDate(now, raw.endHour, raw.endMinute);

  const nowMs = now.getTime();
  const isScoreConfirmed = Boolean(raw.isConfirmed);
  const resultType = raw.resultType || 'normal';

  let isLive = !isScoreConfirmed && nowMs >= start.getTime() && nowMs <= end.getTime();
  let isEnded = isScoreConfirmed || nowMs > end.getTime();

  let score1 = 0;
  let score2 = 0;
  let winningTeam: string | null = null;
  let statusText = '';
  let countdownText: string | undefined = undefined;

  const localizedTeam1 = getLocalizedValue(raw.team1, language, (s) =>
    localizeTeamPlaceholder(s, language)
  );
  const localizedTeam2 = getLocalizedValue(raw.team2, language, (s) =>
    localizeTeamPlaceholder(s, language)
  );

  if (isScoreConfirmed) {
    isLive = false;
    isEnded = true;
    if (resultType === 'cancelled') {
      score1 = 0;
      score2 = 0;
      winningTeam = null;
      statusText = dict['match.cancelled'];
    } else if (resultType === 'team1_forfeit_win') {
      score1 = raw.score1Final;
      score2 = raw.score2Final;
      winningTeam = localizedTeam1;
      statusText = dict['match.forfeitWin'];
    } else if (resultType === 'team2_forfeit_win') {
      score1 = raw.score1Final;
      score2 = raw.score2Final;
      winningTeam = localizedTeam2;
      statusText = dict['match.forfeitWin'];
    } else {
      score1 = raw.score1Final;
      score2 = raw.score2Final;
      const rawWinner =
        raw.winningTeamFinal || (score1 > score2 ? raw.team1 : score2 > score1 ? raw.team2 : null);
      winningTeam = rawWinner
        ? getLocalizedValue(rawWinner, language, (s) => localizeTeamPlaceholder(s, language))
        : null;
      statusText = dict['match.ended'];
    }
  } else if (isEnded) {
    score1 = 0;
    score2 = 0;
    winningTeam = null;
    statusText = dict['match.ended'];
  } else if (isLive) {
    const elapsedMinutes = Math.max(0, Math.floor((nowMs - start.getTime()) / 60000));
    score1 = 0;
    score2 = 0;
    winningTeam = null;
    statusText = fmt(dict['match.elapsedMin'], { min: elapsedMinutes });
    countdownText = undefined;
  } else {
    const remainingMs = start.getTime() - nowMs;
    if (remainingMs <= 60000) {
      statusText = dict['match.startingSoon'];
      countdownText = dict['match.startingSoon'];
    } else if (remainingMs < 7200000) {
      const cd = formatCountdown(remainingMs, language);
      statusText = fmt(dict['match.countdownPrefix'], { time: cd });
      countdownText = cd;
    } else {
      statusText = fmt(dict['match.scheduledAt'], { time: formatTime(start) });
      countdownText = undefined;
    }
  }

  return {
    id: raw.id,
    sportKey: raw.sportKey,
    sportName: sportNames[raw.sportKey] || getLocalizedValue(raw.sportName, language),
    icon: raw.icon,
    team1: localizedTeam1,
    team2: localizedTeam2,
    score1,
    score2,
    isLive,
    isEnded,
    isScoreConfirmed,
    resultType,
    statusText,
    venue: getLocalizedValue(raw.venue, language, (s) => localizeVenueName(s, language)),
    winningTeam,
    startTimeObj: start,
    endTimeObj: end,
    timeRangeText: `${formatTime(start)} - ${formatTime(end)}`,
    round: getLocalizedValue(raw.round, language, (s) => localizeRoundName(s, language)),
    subtitle: raw.subtitle ? getLocalizedValue(raw.subtitle, language) : undefined,
    countdownText,
  };
}

export function getRealtimeSportsConfig(
  now: Date = new Date(),
  customMatches?: RawScheduledMatch[] | null,
  selectedSchool: string = 'ALL',
  language: Language = 'ko'
): Record<string, SportConfig> {
  const dict = language === 'en' ? en : ko;
  const result: Record<string, SportConfig> = {};
  const allRawMatches = customMatches || [];
  const sportKeys: SportKey[] = [
    'soccer',
    'baseball',
    'lol',
    'badminton_men',
    'badminton_women',
    'badminton_mixed',
    'basketball',
  ];

  const names = getSportNamesMap(language);

  const icons: Record<SportKey, string> = {
    soccer: '⚽',
    baseball: '⚾',
    lol: '🎮',
    badminton: '🏸',
    badminton_men: '🏸',
    badminton_women: '🏸',
    badminton_mixed: '🏸',
    basketball: '🏀',
  };

  for (const key of sportKeys) {
    const rawMatches = allRawMatches.filter((m: RawScheduledMatch) => m.sportKey === key);
    const evaluatedSchedule = rawMatches
      .map((m: RawScheduledMatch) => evaluateMatchItem(m, now, language))
      .sort((a, b) => a.startTimeObj.getTime() - b.startTimeObj.getTime());

    const defaultEmptyMatch: MatchItem = {
      id: `${key}-empty`,
      sportKey: key,
      sportName: names[key],
      icon: icons[key],
      team1: 'POSTECH',
      team2: 'KAIST',
      score1: 0,
      score2: 0,
      isLive: false,
      isEnded: false,
      isScoreConfirmed: false,
      resultType: 'normal',
      statusText: dict['match.scheduleTbd'],
      venue: dict['match.venueDefault'],
      winningTeam: null,
      startTimeObj: getEventDate(now, 10, 0),
      endTimeObj: getEventDate(now, 11, 0),
      timeRangeText: '',
      round: dict['match.roundTbd'],
    };

    let liveMatch: MatchItem = defaultEmptyMatch;

    if (evaluatedSchedule.length > 0) {
      if (selectedSchool && selectedSchool !== 'ALL') {
        const schoolMatches = evaluatedSchedule.filter(
          (m: MatchItem) => m.team1 === selectedSchool || m.team2 === selectedSchool
        );

        if (schoolMatches.length > 0) {
          const live = schoolMatches.find((m: MatchItem) => m.isLive);
          const upcoming = schoolMatches.find(
            (m: MatchItem) => !m.isEnded && m.startTimeObj.getTime() > now.getTime()
          );
          const finished = schoolMatches[schoolMatches.length - 1];
          liveMatch = live || upcoming || finished;
        } else {
          liveMatch =
            evaluatedSchedule.find((m: MatchItem) => m.isLive) ||
            evaluatedSchedule.find((m: MatchItem) => !m.isEnded && m.startTimeObj.getTime() > now.getTime()) ||
            evaluatedSchedule[evaluatedSchedule.length - 1] ||
            defaultEmptyMatch;
        }
      } else {
        liveMatch =
          evaluatedSchedule.find((m: MatchItem) => m.isLive) ||
          evaluatedSchedule.find((m: MatchItem) => !m.isEnded && m.startTimeObj.getTime() > now.getTime()) ||
          evaluatedSchedule[evaluatedSchedule.length - 1] ||
          defaultEmptyMatch;
      }
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

  // Synthesize aggregate 'badminton' container for /badminton page and Gym home card
  const allBadmintonMatches = [
    ...(result['badminton_men']?.schedule || []),
    ...(result['badminton_women']?.schedule || []),
    ...(result['badminton_mixed']?.schedule || []),
  ].sort((a, b) => a.startTimeObj.getTime() - b.startTimeObj.getTime());

  const liveBadmintonMatch =
    allBadmintonMatches.find((m) => m.isLive) ||
    allBadmintonMatches.find((m) => !m.isEnded && m.startTimeObj.getTime() > now.getTime()) ||
    allBadmintonMatches[allBadmintonMatches.length - 1] || {
      id: 'badminton-empty',
      sportKey: 'badminton',
      sportName: names.badminton,
      icon: '🏸',
      team1: 'POSTECH',
      team2: 'KAIST',
      score1: 0,
      score2: 0,
      isLive: false,
      isEnded: false,
      isScoreConfirmed: false,
      resultType: 'normal',
      statusText: dict['match.scheduleTbd'],
      venue: dict['match.gymDefault'],
      winningTeam: null,
      startTimeObj: getEventDate(now, 10, 0),
      endTimeObj: getEventDate(now, 11, 0),
      timeRangeText: '',
      round: dict['match.roundTbd'],
    };

  result['badminton'] = {
    key: 'badminton',
    name: names.badminton,
    icon: '🏸',
    path: '/badminton',
    liveMatch: liveBadmintonMatch,
    schedule: allBadmintonMatches,
  };

  return result;
}

export function getDelayedTime(
  hour: number,
  minute: number,
  delayMinutes: number = 0
): { hour: number; minute: number; timeText: string } {
  const totalMinutes = hour * 60 + minute + delayMinutes;
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const newHour = Math.floor(normalized / 60);
  const newMinute = normalized % 60;
  const timeText = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
  return { hour: newHour, minute: newMinute, timeText };
}

export function getRealtimeStageConfig(
  now: Date = new Date(),
  customStage?: StageItem[] | null,
  stageDelayMinutes: number = 0,
  language: Language = 'ko'
): EvaluatedStagePerformance {
  const dict = language === 'en' ? en : ko;
  const timetable = customStage || [];
  const nowMs = now.getTime();

  if (!timetable || timetable.length === 0) {
    return {
      school: 'POSTECH',
      clubName: dict['stage.defaultTitle'],
      category: dict['stage.defaultCategory'],
      genre: '',
      songTitle: dict['stage.defaultNoInfo'],
      statusText: dict['common.waiting'],
      nextClubName: '',
      nextRemainingText: '',
      isLive: false,
    };
  }

  let currentIndex = -1;
  for (let i = 0; i < timetable.length; i++) {
    const item = timetable[i];
    const sTime = getDelayedTime(item.startHour, item.startMinute, stageDelayMinutes);
    const eTime = getDelayedTime(item.endHour, item.endMinute, stageDelayMinutes);

    const s = getEventDate(now, sTime.hour, sTime.minute);
    const e = getEventDate(now, eTime.hour, eTime.minute);

    if (nowMs >= s.getTime() && nowMs <= e.getTime()) {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex === -1) {
    for (let i = 0; i < timetable.length; i++) {
      const item = timetable[i];
      const sTime = getDelayedTime(item.startHour, item.startMinute, stageDelayMinutes);
      const s = getEventDate(now, sTime.hour, sTime.minute);
      if (s.getTime() > nowMs) {
        currentIndex = i;
        break;
      }
    }
    if (currentIndex === -1) currentIndex = timetable.length - 1;
  }

  const currentItem = timetable[currentIndex] || timetable[0];
  const currSTime = getDelayedTime(currentItem.startHour, currentItem.startMinute, stageDelayMinutes);
  const currETime = getDelayedTime(currentItem.endHour, currentItem.endMinute, stageDelayMinutes);

  const start = getEventDate(now, currSTime.hour, currSTime.minute);
  const end = getEventDate(now, currETime.hour, currETime.minute);

  const isLive = nowMs >= start.getTime() && nowMs <= end.getTime();
  const isEnded = nowMs > end.getTime();
  const elapsedMin = Math.max(0, Math.floor((nowMs - start.getTime()) / 60000));

  const nextItem = timetable[currentIndex + 1] || timetable[0];
  const nextSTime = getDelayedTime(nextItem.startHour, nextItem.startMinute, stageDelayMinutes);
  const nextStart = getEventDate(now, nextSTime.hour, nextSTime.minute);

  const remainingToNextMs = nextStart.getTime() - nowMs;
  const nextRemainingText =
    remainingToNextMs <= 0
      ? ''
      : remainingToNextMs < 7200000
        ? fmt(dict['stage.nextInMinutes'], {
            minutes: Math.max(1, Math.ceil(remainingToNextMs / 60000)),
          })
        : fmt(dict['stage.nextAtTime'], { time: nextSTime.timeText });

  const rawCategory = currentItem.category || currentItem.genre || '기타';

  return {
    school: currentItem.school,
    clubName: getLocalizedValue(currentItem.clubName, language),
    category: localizeStageCategory(rawCategory, language),
    genre: currentItem.genre ? getLocalizedValue(currentItem.genre, language) : '',
    songTitle: getLocalizedValue(currentItem.songTitle, language),
    statusText: isLive
      ? fmt(dict['stage.elapsedMin'], { min: elapsedMin })
      : isEnded
        ? dict['stage.ended']
        : fmt(dict['stage.scheduledAt'], { time: formatTime(start) }),
    nextClubName: getLocalizedValue(nextItem.clubName, language),
    nextRemainingText,
    isLive,
  };
}
