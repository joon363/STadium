import {
  RawScheduledMatch,
  MatchItem,
  SportKey,
  SportConfig,
  StageItem,
  EvaluatedStagePerformance,
} from '../types/stadium';

export function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function formatCountdown(ms: number): string {
  if (ms <= 60000) return '곧 시작';
  const totalMin = Math.floor(ms / 60000);
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours > 0) {
    return minutes > 0 ? `${hours}시간 ${minutes}분` : `${hours}시간`;
  }
  return `${minutes}분`;
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
    if (remainingMs <= 60000) {
      statusText = '곧 시작';
      countdownText = '곧 시작';
    } else if (remainingMs < 7200000) {
      // 2시간 이내
      statusText = `시작까지 ${formatCountdown(remainingMs)}`;
      countdownText = formatCountdown(remainingMs);
    } else {
      statusText = `${formatTime(start)} 예정`;
      countdownText = formatCountdown(remainingMs);
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

  const names: Record<SportKey, string> = {
    soccer: '축구',
    baseball: '야구',
    lol: 'LoL',
    badminton: '배드민턴',
    badminton_men: '배드민턴 (남복)',
    badminton_women: '배드민턴 (여복)',
    badminton_mixed: '배드민턴 (혼복)',
    basketball: '농구',
  };

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
    const evaluatedSchedule = rawMatches.map((m: RawScheduledMatch) => evaluateMatchItem(m, now));

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
      statusText: '일정 준비중',
      venue: '경기장',
      winningTeam: null,
      startTimeObj: new Date(now),
      endTimeObj: new Date(now),
      timeRangeText: '',
      round: '경기 일정 준비중',
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
            (m: MatchItem) => m.startTimeObj.getTime() > now.getTime()
          );
          const finished = schoolMatches[schoolMatches.length - 1];
          liveMatch = live || upcoming || finished;
        } else {
          liveMatch =
            evaluatedSchedule.find((m: MatchItem) => m.isLive) ||
            evaluatedSchedule.find((m: MatchItem) => m.startTimeObj.getTime() > now.getTime()) ||
            evaluatedSchedule[evaluatedSchedule.length - 1] ||
            defaultEmptyMatch;
        }
      } else {
        liveMatch =
          evaluatedSchedule.find((m: MatchItem) => m.isLive) ||
          evaluatedSchedule.find((m: MatchItem) => m.startTimeObj.getTime() > now.getTime()) ||
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
    allBadmintonMatches.find((m) => m.startTimeObj.getTime() > now.getTime()) ||
    allBadmintonMatches[allBadmintonMatches.length - 1] || {
      id: 'badminton-empty',
      sportKey: 'badminton',
      sportName: '배드민턴',
      icon: '🏸',
      team1: 'POSTECH',
      team2: 'KAIST',
      score1: 0,
      score2: 0,
      isLive: false,
      statusText: '일정 준비중',
      venue: '체육관',
      winningTeam: null,
      startTimeObj: new Date(now),
      endTimeObj: new Date(now),
      timeRangeText: '',
      round: '경기 일정 준비중',
    };

  result['badminton'] = {
    key: 'badminton',
    name: '배드민턴',
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
  stageDelayMinutes: number = 0
): EvaluatedStagePerformance {
  const timetable = customStage || [];
  const nowMs = now.getTime();

  if (!timetable || timetable.length === 0) {
    return {
      school: 'POSTECH',
      clubName: '공연 준비중',
      category: '문화공연',
      genre: '',
      songTitle: '등록된 공연 정보가 없습니다',
      statusText: '공연 대기중',
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

    const s = new Date(now);
    s.setHours(sTime.hour, sTime.minute, 0, 0);
    const e = new Date(now);
    e.setHours(eTime.hour, eTime.minute, 0, 0);

    if (nowMs >= s.getTime() && nowMs <= e.getTime()) {
      currentIndex = i;
      break;
    }
  }

  if (currentIndex === -1) {
    for (let i = 0; i < timetable.length; i++) {
      const item = timetable[i];
      const sTime = getDelayedTime(item.startHour, item.startMinute, stageDelayMinutes);
      const s = new Date(now);
      s.setHours(sTime.hour, sTime.minute, 0, 0);
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

  const start = new Date(now);
  start.setHours(currSTime.hour, currSTime.minute, 0, 0);
  const end = new Date(now);
  end.setHours(currETime.hour, currETime.minute, 0, 0);

  const isLive = nowMs >= start.getTime() && nowMs <= end.getTime();
  const elapsedMin = Math.max(0, Math.floor((nowMs - start.getTime()) / 60000));

  const nextItem = timetable[currentIndex + 1] || timetable[0];
  const nextSTime = getDelayedTime(nextItem.startHour, nextItem.startMinute, stageDelayMinutes);
  const nextStart = new Date(now);
  nextStart.setHours(nextSTime.hour, nextSTime.minute, 0, 0);
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
