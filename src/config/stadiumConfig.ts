

export interface School {
  id: string;
  name: string;
  shortName: string;
  logoText: string;
  color: string;
  bgLight: string;
  textColor: string;
}

export const SCHOOLS: Record<string, School> = {
  POSTECH: {
    id: 'POSTECH',
    name: '포항공과대학교',
    shortName: 'POSTECH',
    logoText: 'P',
    color: '#C80036',
    bgLight: '#FFF0F3',
    textColor: '#ffffff',
  },
  KAIST: {
    id: 'KAIST',
    name: '한국과학기술원',
    shortName: 'KAIST',
    logoText: 'K',
    color: '#004182',
    bgLight: '#E6F0FA',
    textColor: '#ffffff',
  },
  GIST: {
    id: 'GIST',
    name: '광주과학기술원',
    shortName: 'GIST',
    logoText: 'G',
    color: '#F37023',
    bgLight: '#FFF3EB',
    textColor: '#ffffff',
  },
  DGIST: {
    id: 'DGIST',
    name: '대구경북과학기술원',
    shortName: 'DGIST',
    logoText: 'D',
    color: '#0088CC',
    bgLight: '#E6F5FC',
    textColor: '#ffffff',
  },
  UNIST: {
    id: 'UNIST',
    name: '울산과학기술원',
    shortName: 'UNIST',
    logoText: 'U',
    color: '#002855',
    bgLight: '#E6ECF5',
    textColor: '#ffffff',
  },
  KENTECH: {
    id: 'KENTECH',
    name: '한국에너지공과대학교',
    shortName: 'KENTECH',
    logoText: 'KE',
    color: '#1D6740',
    bgLight: '#EAF3ED',
    textColor: '#ffffff',
  },
};

export type SportKey = 'soccer' | 'baseball' | 'lol' | 'badminton' | 'basketball';

export interface RawScheduledMatch {
  id: string;
  sportKey: SportKey;
  sportName: string;
  icon: string;
  team1: string;
  team2: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  venue: string;
  round: string;
  score1Final: number;
  score2Final: number;
  winningTeamFinal: string | null;
  subtitle?: string;
}

export interface MatchItem {
  id: string;
  sportKey: SportKey;
  sportName: string;
  icon: string;
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  isLive: boolean;
  statusText: string;
  venue: string;
  winningTeam: string | null;
  startTimeObj: Date;
  endTimeObj: Date;
  timeRangeText: string;
  round: string;
  subtitle?: string;
  countdownText?: string;
}

export interface SportConfig {
  key: SportKey;
  name: string;
  icon: string;
  path: string;
  liveMatch: MatchItem;
  schedule: MatchItem[];
}

// Overall Leaderboard Interfaces
export interface SportScoreBreakdown {
  sportKey: SportKey;
  sportName: string;
  rank: number;
  points: number;
}

export interface SchoolStanding {
  schoolId: string;
  schoolName: string;
  shortName: string;
  logoText: string;
  color: string;
  bgLight: string;
  textColor: string;
  rank: number;
  totalPoints: number;
  breakdown: Record<SportKey, SportScoreBreakdown>;
}

// Master Schedule Default Data
export const DEFAULT_RAW_SCHEDULE_FLAT: RawScheduledMatch[] = [
  // Soccer
  {
    id: 'soc-1',
    sportKey: 'soccer',
    sportName: '축구',
    icon: '⚽',
    team1: 'GIST',
    team2: 'UNIST',
    startHour: 10,
    startMinute: 0,
    endHour: 11,
    endMinute: 30,
    venue: '대운동장',
    round: '8강 1경기',
    score1Final: 2,
    score2Final: 1,
    winningTeamFinal: 'GIST',
  },
  {
    id: 'soc-2',
    sportKey: 'soccer',
    sportName: '축구',
    icon: '⚽',
    team1: 'KAIST',
    team2: 'DGIST',
    startHour: 12,
    startMinute: 0,
    endHour: 13,
    endMinute: 30,
    venue: '대운동장',
    round: '준결승 1경기',
    score1Final: 3,
    score2Final: 1,
    winningTeamFinal: 'KAIST',
  },
  {
    id: 'soc-3',
    sportKey: 'soccer',
    sportName: '축구',
    icon: '⚽',
    team1: 'POSTECH',
    team2: 'KAIST',
    startHour: 17,
    startMinute: 0,
    endHour: 18,
    endMinute: 30,
    venue: '대운동장',
    round: '준결승 2경기 (라이벌전)',
    score1Final: 2,
    score2Final: 1,
    winningTeamFinal: 'POSTECH',
  },
  {
    id: 'soc-4',
    sportKey: 'soccer',
    sportName: '축구',
    icon: '⚽',
    team1: 'POSTECH',
    team2: 'GIST',
    startHour: 19,
    startMinute: 0,
    endHour: 20,
    endMinute: 30,
    venue: '대운동장',
    round: '결승전',
    score1Final: 3,
    score2Final: 2,
    winningTeamFinal: 'POSTECH',
  },

  // Baseball
  {
    id: 'bb-1',
    sportKey: 'baseball',
    sportName: '야구',
    icon: '⚾',
    team1: 'DGIST',
    team2: 'GIST',
    startHour: 9,
    startMinute: 30,
    endHour: 12,
    endMinute: 0,
    venue: '곡강 야구장',
    round: '예선 1경기',
    score1Final: 4,
    score2Final: 2,
    winningTeamFinal: 'DGIST',
  },
  {
    id: 'bb-2',
    sportKey: 'baseball',
    sportName: '야구',
    icon: '⚾',
    team1: 'POSTECH',
    team2: 'KAIST',
    startHour: 16,
    startMinute: 30,
    endHour: 18,
    endMinute: 30,
    venue: '포항야구장',
    round: '본선 메인 매치',
    score1Final: 5,
    score2Final: 3,
    winningTeamFinal: 'POSTECH',
  },
  {
    id: 'bb-3',
    sportKey: 'baseball',
    sportName: '야구',
    icon: '⚾',
    team1: 'UNIST',
    team2: 'KENTECH',
    startHour: 19,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
    venue: '포항야구장',
    round: '순위 결정전',
    score1Final: 2,
    score2Final: 1,
    winningTeamFinal: 'UNIST',
  },

  // LoL
  {
    id: 'lol-1',
    sportKey: 'lol',
    sportName: 'LoL',
    icon: '🎮',
    team1: 'POSTECH',
    team2: 'GIST',
    startHour: 11,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
    venue: '콜로세움',
    round: '8강 BO3',
    score1Final: 2,
    score2Final: 0,
    winningTeamFinal: 'POSTECH',
  },
  {
    id: 'lol-2',
    sportKey: 'lol',
    sportName: 'LoL',
    icon: '🎮',
    team1: 'KAIST',
    team2: 'UNIST',
    startHour: 17,
    startMinute: 15,
    endHour: 18,
    endMinute: 45,
    venue: '콜로세움',
    round: '4강 BO3',
    score1Final: 2,
    score2Final: 1,
    winningTeamFinal: 'KAIST',
  },
  {
    id: 'lol-3',
    sportKey: 'lol',
    sportName: 'LoL',
    icon: '🎮',
    team1: 'POSTECH',
    team2: 'KAIST',
    startHour: 19,
    startMinute: 15,
    endHour: 21,
    endMinute: 45,
    venue: '콜로세움',
    round: '결승 BO5',
    score1Final: 3,
    score2Final: 1,
    winningTeamFinal: 'POSTECH',
  },

  // Badminton (배드민턴)
  {
    id: 'bad-1',
    sportKey: 'badminton',
    sportName: '배드민턴',
    icon: '🏸',
    team1: 'GIST',
    team2: 'UNIST',
    startHour: 11,
    startMinute: 0,
    endHour: 13,
    endMinute: 0,
    venue: '체육관 B코트',
    round: '배드민턴 예선 1경기',
    score1Final: 3,
    score2Final: 1,
    winningTeamFinal: 'GIST',
  },
  {
    id: 'bad-2',
    sportKey: 'badminton',
    sportName: '배드민턴',
    icon: '🏸',
    team1: 'POSTECH',
    team2: 'KAIST',
    startHour: 17,
    startMinute: 0,
    endHour: 18,
    endMinute: 30,
    venue: '체육관 B코트',
    round: '배드민턴 라이벌전',
    score1Final: 3,
    score2Final: 2,
    winningTeamFinal: 'POSTECH',
  },

  // Basketball (농구)
  {
    id: 'bk-1',
    sportKey: 'basketball',
    sportName: '농구',
    icon: '🏀',
    team1: 'POSTECH',
    team2: 'KAIST',
    startHour: 13,
    startMinute: 30,
    endHour: 15,
    endMinute: 30,
    venue: '체육관 A코트',
    round: '농구 본선 1경기',
    score1Final: 68,
    score2Final: 62,
    winningTeamFinal: 'POSTECH',
  },
  {
    id: 'bk-2',
    sportKey: 'basketball',
    sportName: '농구',
    icon: '🏀',
    team1: 'KAIST',
    team2: 'UNIST',
    startHour: 17,
    startMinute: 0,
    endHour: 19,
    endMinute: 0,
    venue: '체육관 A코트',
    round: '농구 준결승전',
    score1Final: 58,
    score2Final: 52,
    winningTeamFinal: 'KAIST',
  },
  {
    id: 'bk-3',
    sportKey: 'basketball',
    sportName: '농구',
    icon: '🏀',
    team1: 'DGIST',
    team2: 'KENTECH',
    startHour: 19,
    startMinute: 30,
    endHour: 21,
    endMinute: 0,
    venue: '체육관 A코트',
    round: '농구 순위결정전',
    score1Final: 55,
    score2Final: 49,
    winningTeamFinal: 'DGIST',
  },
];

// Helper: Format Date HH:MM
function formatTime(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// Helper: Format countdown string (HH:MM:SS)
function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

// Dynamic Evaluator for Individual Match based on Real Time (now)
export function evaluateMatchItem(raw: RawScheduledMatch, now: Date): MatchItem {
  const start = new Date(now);
  start.setHours(raw.startHour, raw.startMinute, 0, 0);

  const end = new Date(now);
  end.setHours(raw.endHour, raw.endMinute, 0, 0);

  const nowMs = now.getTime();
  const startMs = start.getTime();
  const endMs = end.getTime();

  const isLive = nowMs >= startMs && nowMs <= endMs;
  const isFinished = nowMs > endMs;

  let score1 = 0;
  let score2 = 0;
  let winningTeam: string | null = null;
  let statusText = '';
  let countdownText: string | undefined = undefined;

  const totalDurationMin = Math.max(1, Math.floor((endMs - startMs) / 60000));
  const elapsedMin = Math.floor((nowMs - startMs) / 60000);

  if (isFinished) {
    score1 = raw.score1Final;
    score2 = raw.score2Final;
    winningTeam = raw.winningTeamFinal;
    statusText = '경기 종료';
  } else if (isLive) {
    const progressRatio = Math.min(1, Math.max(0.05, elapsedMin / totalDurationMin));
    score1 = Math.floor(raw.score1Final * progressRatio);
    score2 = Math.floor(raw.score2Final * progressRatio);

    if (score1 > score2) winningTeam = raw.team1;
    else if (score2 > score1) winningTeam = raw.team2;
    else winningTeam = null;

    if (raw.sportKey === 'soccer') {
      if (elapsedMin <= 45) {
        statusText = `전반 ${elapsedMin}분`;
      } else if (elapsedMin <= 60) {
        statusText = '하프타임';
      } else {
        statusText = `후반 ${Math.min(90, elapsedMin - 15)}분`;
      }
    } else if (raw.sportKey === 'baseball') {
      const currentInning = Math.min(9, Math.floor((elapsedMin / totalDurationMin) * 9) + 1);
      const half = elapsedMin % 10 < 5 ? '초' : '말';
      statusText = `${currentInning}회${half} (${elapsedMin}분)`;
    } else if (raw.sportKey === 'lol') {
      const currentSet = Math.min(3, Math.floor(elapsedMin / 30) + 1);
      const setElapsed = elapsedMin % 30;
      statusText = `${currentSet}세트 ${setElapsed}분`;
    } else if (raw.sportKey === 'badminton') {
      statusText = `배드민턴 (${elapsedMin}분)`;
    } else if (raw.sportKey === 'basketball') {
      const quarter = Math.min(4, Math.floor(elapsedMin / 15) + 1);
      statusText = `농구 ${quarter}쿼터 (${elapsedMin}분)`;
    } else {
      statusText = `진행중 (${elapsedMin}분)`;
    }
  } else {
    score1 = 0;
    score2 = 0;
    winningTeam = null;
    const remainingMs = startMs - nowMs;
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

// Get Evaluated Sports Config Object for Current Time & School Filter
export function getRealtimeSportsConfig(
  now: Date = new Date(),
  customMatches?: RawScheduledMatch[] | null,
  selectedSchool: string = 'ALL'
): Record<string, SportConfig> {
  const result: Record<string, SportConfig> = {};

  const allRawMatches = customMatches || DEFAULT_RAW_SCHEDULE_FLAT;

  const sportKeys: SportKey[] = [
    'soccer',
    'baseball',
    'lol',
    'badminton',
    'basketball',
  ];

  for (const key of sportKeys) {
    const rawMatches = allRawMatches.filter((m: RawScheduledMatch) => m.sportKey === key);
    const evaluatedSchedule = rawMatches.map((m: RawScheduledMatch) => evaluateMatchItem(m, now));

    let liveMatch: MatchItem;

    if (selectedSchool && selectedSchool !== 'ALL') {
      const schoolMatches = evaluatedSchedule.filter(
        (m: MatchItem) => m.team1 === selectedSchool || m.team2 === selectedSchool
      );

      if (schoolMatches.length > 0) {
        // Priority 1: Currently LIVE match involving selected school
        const live = schoolMatches.find((m: MatchItem) => m.isLive);
        // Priority 2: UPCOMING match involving selected school
        const upcoming = schoolMatches.find((m: MatchItem) => m.startTimeObj.getTime() > now.getTime());
        // Priority 3: FINISHED match involving selected school
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

// Calculate Overall Standings (종합 순위표) from Match Results
export function calculateOverallStandings(
  customMatches?: RawScheduledMatch[] | null,
  now: Date = new Date()
): SchoolStanding[] {
  const allRawMatches = customMatches || DEFAULT_RAW_SCHEDULE_FLAT;

  const schoolIds = ['POSTECH', 'KAIST', 'GIST', 'DGIST', 'UNIST', 'KENTECH'];
  const sportKeys: SportKey[] = ['soccer', 'baseball', 'lol', 'badminton', 'basketball'];

  const sportNames: Record<SportKey, string> = {
    soccer: '축구',
    baseball: '야구',
    lol: 'LoL',
    badminton: '배드민턴',
    basketball: '농구',
  };

  // Base ranking map per sport if matches tie or are default
  const defaultSportRanks: Record<SportKey, Record<string, number>> = {
    soccer: { POSTECH: 1, GIST: 2, KAIST: 3, UNIST: 4, DGIST: 5, KENTECH: 6 },
    baseball: { POSTECH: 1, KAIST: 2, DGIST: 3, UNIST: 4, GIST: 5, KENTECH: 6 },
    lol: { POSTECH: 1, KAIST: 2, UNIST: 3, GIST: 4, DGIST: 5, KENTECH: 6 },
    badminton: { POSTECH: 1, KAIST: 2, GIST: 3, UNIST: 4, DGIST: 5, KENTECH: 6 },
    basketball: { POSTECH: 1, KAIST: 2, DGIST: 3, UNIST: 4, KENTECH: 5, GIST: 6 },
  };

  const schoolBreakdown: Record<string, Record<SportKey, SportScoreBreakdown>> = {};
  schoolIds.forEach((sid) => {
    schoolBreakdown[sid] = {} as Record<SportKey, SportScoreBreakdown>;
  });

  // Calculate per-sport standings
  for (const sport of sportKeys) {
    const rawSportMatches = allRawMatches.filter((m) => m.sportKey === sport);

    // Track match points per team
    const teamStats: Record<string, { wins: number; scoreDiff: number; points: number }> = {};
    schoolIds.forEach((sid) => {
      teamStats[sid] = { wins: 0, scoreDiff: 0, points: 0 };
    });

    rawSportMatches.forEach((m) => {
      const evalMatch = evaluateMatchItem(m, now);
      const isEndedOrLive = evalMatch.isLive || now.getTime() > evalMatch.endTimeObj.getTime();

      if (isEndedOrLive) {
        if (evalMatch.winningTeam && teamStats[evalMatch.winningTeam]) {
          teamStats[evalMatch.winningTeam].wins += 1;
          teamStats[evalMatch.winningTeam].points += 3;
        } else if (evalMatch.score1 === evalMatch.score2 && evalMatch.score1 > 0) {
          if (teamStats[evalMatch.team1]) teamStats[evalMatch.team1].points += 1;
          if (teamStats[evalMatch.team2]) teamStats[evalMatch.team2].points += 1;
        }

        if (teamStats[evalMatch.team1]) {
          teamStats[evalMatch.team1].scoreDiff += evalMatch.score1 - evalMatch.score2;
        }
        if (teamStats[evalMatch.team2]) {
          teamStats[evalMatch.team2].scoreDiff += evalMatch.score2 - evalMatch.score1;
        }
      }
    });

    // Rank 6 schools in this sport
    const sortedSportTeams = [...schoolIds].sort((a, b) => {
      if (teamStats[b].points !== teamStats[a].points) {
        return teamStats[b].points - teamStats[a].points;
      }
      if (teamStats[b].scoreDiff !== teamStats[a].scoreDiff) {
        return teamStats[b].scoreDiff - teamStats[a].scoreDiff;
      }
      // Fallback to default seeding
      const defaultRankA = defaultSportRanks[sport][a] || 6;
      const defaultRankB = defaultSportRanks[sport][b] || 6;
      return defaultRankA - defaultRankB;
    });

    // Award 6, 5, 4, 3, 2, 1 points based on sport rank (1st to 6th)
    sortedSportTeams.forEach((sid, idx) => {
      const rank = idx + 1;
      const points = 7 - rank; // 1st=6pt, 2nd=5pt, 3rd=4pt, 4th=3pt, 5th=2pt, 6th=1pt
      schoolBreakdown[sid][sport] = {
        sportKey: sport,
        sportName: sportNames[sport],
        rank,
        points,
      };
    });
  }

  // Calculate Overall Standings (Total Points)
  const result: SchoolStanding[] = schoolIds.map((sid) => {
    const schoolObj = SCHOOLS[sid] || SCHOOLS.POSTECH;
    let totalPoints = 0;
    sportKeys.forEach((sport) => {
      totalPoints += schoolBreakdown[sid][sport].points;
    });

    return {
      schoolId: sid,
      schoolName: schoolObj.name,
      shortName: schoolObj.shortName,
      logoText: schoolObj.logoText,
      color: schoolObj.color,
      bgLight: schoolObj.bgLight,
      textColor: schoolObj.textColor,
      rank: 0, // Assigned after sorting
      totalPoints,
      breakdown: schoolBreakdown[sid],
    };
  });

  // Sort overall standings by total points
  result.sort((a, b) => b.totalPoints - a.totalPoints);

  // Assign overall ranks
  result.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return result;
}

// Stage Performances Timetable Data
export interface StageItem {
  school: string;
  clubName: string;
  genre: string;
  songTitle: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export const STAGE_TIMETABLE: StageItem[] = [
  {
    school: 'GIST',
    clubName: 'PULSE (댄스동아리)',
    genre: 'K-POP & 힙합 댄스',
    songTitle: 'Supernova - aespa (Cover)',
    startHour: 14,
    startMinute: 0,
    endHour: 15,
    endMinute: 0,
  },
  {
    school: 'UNIST',
    clubName: 'MELODY (밴드)',
    genre: '모던 록',
    songTitle: '한 페이지가 될 수 있게 - DAY6',
    startHour: 15,
    startMinute: 0,
    endHour: 16,
    endMinute: 0,
  },
  {
    school: 'DGIST',
    clubName: 'BEAT (힙합)',
    genre: '스트릿 힙합',
    songTitle: '자작곡 & 사이퍼 쇼케이스',
    startHour: 16,
    startMinute: 0,
    endHour: 17,
    endMinute: 15,
  },
  {
    school: 'POSTECH',
    clubName: '스틸러 (Steeler)',
    genre: '락 밴드',
    songTitle: '사건의 지평선 - 윤하 (Cover)',
    startHour: 17,
    startMinute: 15,
    endHour: 18,
    endMinute: 0,
  },
  {
    school: 'KAIST',
    clubName: 'CHORUS (보컬동아리)',
    genre: '아카펠라 & 발라드',
    songTitle: 'STadium 축하합창 메들리',
    startHour: 18,
    startMinute: 0,
    endHour: 19,
    endMinute: 0,
  },
  {
    school: 'POSTECH',
    clubName: 'STadium 초청가수 특별공연',
    genre: '메인 축하공연',
    songTitle: '2026 STadium 피날레 콘서트',
    startHour: 20,
    startMinute: 0,
    endHour: 21,
    endMinute: 0,
  },
];

export interface EvaluatedStagePerformance {
  school: string;
  clubName: string;
  genre: string;
  songTitle: string;
  statusText: string;
  nextClubName: string;
  nextRemainingText: string;
  isLive: boolean;
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
    genre: currentItem.genre,
    songTitle: currentItem.songTitle,
    statusText: isLive ? `${elapsedMin}분 경과` : `${formatTime(start)} 시작 예정`,
    nextClubName: nextItem.clubName,
    nextRemainingText: `약 ${Math.max(1, Math.ceil(remainingToNextMs / 60000))}분 후 `,
    isLive,
  };
}

export interface VenueNode {
  id: string;
  name: string;
  category: 'sports' | 'food' | 'rest' | 'facility';
  x: number;
  y: number;
  lat: number;
  lng: number;
  description: string;
  icon: string;
  isEatingZone?: boolean;
  isRestArea?: boolean;
}

export const VENUE_NODES: VenueNode[] = [];

export interface MapWaypoint {
  x: number;
  y: number;
}

export interface MapEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  weightMinutes: number; // e.g. 2, 3, 4 minutes
  waypoints?: MapWaypoint[]; // Intermediate connected polyline vertices
}

export const DEFAULT_MAP_EDGES: MapEdge[] = [];



export interface NavigationResult {
  totalMinutes: number;
  pathWaypoints: MapWaypoint[];
  edgeIds: string[];
}

// Shortest Path Solver using Dijkstra's Algorithm
export function findShortestPath(
  startNodeId: string,
  destNodeId: string,
  nodes: VenueNode[],
  edges: MapEdge[]
): NavigationResult | null {
  if (startNodeId === destNodeId) {
    const node = nodes.find((n) => n.id === startNodeId);
    if (!node) return null;
    return { totalMinutes: 0, pathWaypoints: [{ x: node.x, y: node.y }], edgeIds: [] };
  }

  const nodeMap = new Map<string, VenueNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const adj = new Map<string, Array<{ to: string; weight: number; edge: MapEdge; isForward: boolean }>>();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((edge) => {
    if (adj.has(edge.fromNodeId) && adj.has(edge.toNodeId)) {
      adj.get(edge.fromNodeId)!.push({ to: edge.toNodeId, weight: edge.weightMinutes, edge, isForward: true });
      adj.get(edge.toNodeId)!.push({ to: edge.fromNodeId, weight: edge.weightMinutes, edge, isForward: false });
    }
  });

  const dist = new Map<string, number>();
  const prev = new Map<string, { from: string; edge: MapEdge; isForward: boolean }>();
  nodes.forEach((n) => dist.set(n.id, Infinity));
  dist.set(startNodeId, 0);

  const unvisited = new Set<string>(nodes.map((n) => n.id));

  while (unvisited.size > 0) {
    let u: string | null = null;
    let minDist = Infinity;
    unvisited.forEach((id) => {
      const d = dist.get(id)!;
      if (d < minDist) {
        minDist = d;
        u = id;
      }
    });

    if (!u || minDist === Infinity) break;
    if (u === destNodeId) break;

    unvisited.delete(u);

    const neighbors = adj.get(u) || [];
    for (const neighbor of neighbors) {
      if (unvisited.has(neighbor.to)) {
        const alt = dist.get(u)! + neighbor.weight;
        if (alt < dist.get(neighbor.to)!) {
          dist.set(neighbor.to, alt);
          prev.set(neighbor.to, { from: u, edge: neighbor.edge, isForward: neighbor.isForward });
        }
      }
    }
  }

  const totalMinutes = dist.get(destNodeId)!;
  if (totalMinutes === Infinity) return null;

  const edgeList: Array<{ edge: MapEdge; isForward: boolean }> = [];
  let curr = destNodeId;
  while (prev.has(curr)) {
    const p = prev.get(curr)!;
    edgeList.unshift({ edge: p.edge, isForward: p.isForward });
    curr = p.from;
  }

  const points: MapWaypoint[] = [];
  const startNode = nodeMap.get(startNodeId)!;
  if (startNode) {
    points.push({ x: startNode.x, y: startNode.y });
  }

  edgeList.forEach(({ edge, isForward }) => {
    const waypoints = edge.waypoints || [];
    if (isForward) {
      waypoints.forEach((wp) => points.push({ x: wp.x, y: wp.y }));
    } else {
      [...waypoints].reverse().forEach((wp) => points.push({ x: wp.x, y: wp.y }));
    }
    const endNode = nodeMap.get(isForward ? edge.toNodeId : edge.fromNodeId)!;
    if (endNode) {
      points.push({ x: endNode.x, y: endNode.y });
    }
  });

  return {
    totalMinutes,
    pathWaypoints: points,
    edgeIds: edgeList.map((e) => e.edge.id),
  };
}

export const CONTACT_CONFIG = {
  generalLeaders: [
    { role: '포준위 위원장', name: '윤석영 (POSTECH)', phone: '010-1234-5678', dept: '총괄본부' },
    { role: '실무협의체 의장', name: '홍준우 (POSTECH 대외협력국장)', phone: '010-9876-5432', dept: '대외협력' },
  ],
  deptLeads: [
    { role: '매뉴얼 / 수송 TF', name: '양광모', phone: '010-2222-3333', dept: '운영기획' },
    { role: '공연 / 무대 TF', name: '이희재', phone: '010-4444-5555', dept: '무대연출' },
    { role: '종목 / e스포츠 TF', name: '김태승', phone: '010-7777-8888', dept: '경기운영' },
    { role: '디자인 / 홍보 TF', name: '박지은', phone: '010-9999-0000', dept: '디자인' },
  ],
  links: {
    kakaoOpenChat: 'https://open.kakao.com/o/stadium2026',
    instagram: 'https://instagram.com/postech_stadium',
    youtube: 'https://youtube.com/@stadium_official',
  },
};
