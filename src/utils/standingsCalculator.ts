import {
  MatchResultType,
  RawScheduledMatch,
  SchoolStanding,
  SportKey,
  SportScoreBreakdown,
} from '../types/stadium';
import { TournamentGameNode, TournamentTreeData } from '../types/tournamentTree';
import { SCHOOLS } from '../constants/schools';
import {
  getConfirmedGameLoser,
  getConfirmedGameWinner,
  isGameNodeConfirmed,
  isThirdPlaceGameNode,
} from './tournamentLayout';
import type { Language } from '../context/LanguageContext';
import { ko } from '../locales/ko';
import { en } from '../locales/en';
import { parseBilingual } from './bilingual';

export const SPORT_POINTS_TABLE: Record<SportKey, Record<number, number>> = {
  soccer: { 1: 9, 2: 6, 3: 3 },
  basketball: { 1: 9, 2: 6, 3: 3 },
  baseball: { 1: 9, 2: 6, 3: 3 },
  lol: { 1: 9, 2: 6, 3: 3 },
  badminton: { 1: 3, 2: 2, 3: 1 },
  badminton_men: { 1: 3, 2: 2, 3: 1 },
  badminton_women: { 1: 3, 2: 2, 3: 1 },
  badminton_mixed: { 1: 3, 2: 2, 3: 1 },
};

const VALID_SCHOOL_IDS = new Set(['POSTECH', 'KAIST', 'GIST', 'DGIST', 'UNIST', 'KENTECH']);

function isValidSchool(name?: string | null): name is string {
  return Boolean(name && VALID_SCHOOL_IDS.has(name));
}

export function getPointsForSportRank(sportKey: SportKey, rank: number): number {
  if (rank <= 0) return 0;
  return SPORT_POINTS_TABLE[sportKey]?.[rank] ?? 0;
}

interface NormalizedMatchOutcome {
  roundName: string;
  level: number;
  isThirdPlace: boolean;
  team1: string;
  team2: string;
  isConfirmed: boolean;
  resultType: MatchResultType;
  winner: string | null;
  loser: string | null;
}

function classifyRoundType(
  roundName: string,
  isThirdPlace: boolean,
  level: number,
  maxLevel: number
): 'final' | 'third_place' | 'semifinal' | 'preliminary' {
  const r = parseBilingual(roundName).ko.trim();
  if (isThirdPlace || /3.*4위|34위|3,4위/.test(r)) return 'third_place';
  if (/결선|결승/.test(r) && !/준결/.test(r)) return 'final';
  if (/본선|준결|4강/.test(r)) return 'semifinal';
  if (/예선|6강/.test(r)) return 'preliminary';
  if (maxLevel >= 3) {
    if (level >= maxLevel) return 'final';
    if (level === maxLevel - 1) return 'semifinal';
    return 'preliminary';
  }
  if (maxLevel === 2) {
    return level >= 2 ? 'final' : 'semifinal';
  }
  return 'final';
}

export function calculateOverallStandings(
  customMatches?: RawScheduledMatch[] | null,
  _now: Date = new Date(),
  tournamentTrees?: Record<string, TournamentTreeData> | null,
  language: Language = 'ko'
): SchoolStanding[] {
  const allRawMatches = customMatches || [];
  const dict = language === 'en' ? en : ko;

  const schoolIds = ['POSTECH', 'KAIST', 'GIST', 'DGIST', 'UNIST', 'KENTECH'];
  const sportKeys: SportKey[] = [
    'soccer',
    'baseball',
    'lol',
    'badminton_men',
    'badminton_women',
    'badminton_mixed',
    'basketball',
  ];

  const sportNames: Record<SportKey, string> = {
    soccer: dict['sports.soccer'],
    baseball: dict['sports.baseball'],
    lol: 'LoL',
    badminton: dict['sports.badminton'],
    badminton_men: `${dict['sports.badminton']} (${dict['sports.badmintonMenTag']})`,
    badminton_women: `${dict['sports.badminton']} (${dict['sports.badmintonWomenTag']})`,
    badminton_mixed: `${dict['sports.badminton']} (${dict['sports.badmintonMixedTag']})`,
    basketball: dict['sports.basketball'],
  };

  const schoolBreakdown: Record<string, Record<SportKey, SportScoreBreakdown>> = {};
  const totalPointsBySchool: Record<string, number> = {};

  schoolIds.forEach((sid) => {
    schoolBreakdown[sid] = {} as Record<SportKey, SportScoreBreakdown>;
    totalPointsBySchool[sid] = 0;
    sportKeys.forEach((sport) => {
      schoolBreakdown[sid][sport] = {
        sportKey: sport,
        sportName: sportNames[sport],
        rank: 0,
        points: 0,
        isTied: false,
      };
    });
  });

  for (const sport of sportKeys) {
    const tree = tournamentTrees?.[sport];
    const outcomes: NormalizedMatchOutcome[] = [];

    if (tree && tree.nodes && Object.keys(tree.nodes).length > 0) {
      const gameNodes = Object.values(tree.nodes).filter(
        (n): n is TournamentGameNode => n.type === 'game'
      );
      for (const g of gameNodes) {
        const isConfirmed = isGameNodeConfirmed(g);
        const resultType = g.resultType || 'normal';
        outcomes.push({
          roundName: g.roundName,
          level: g.level || 1,
          isThirdPlace: isThirdPlaceGameNode(g),
          team1: g.team1,
          team2: g.team2,
          isConfirmed,
          resultType,
          winner: getConfirmedGameWinner(g),
          loser: getConfirmedGameLoser(g),
        });
      }
    } else {
      const rawSportMatches = allRawMatches.filter((m) => m.sportKey === sport);
      for (const m of rawSportMatches) {
        const isConfirmed = Boolean(m.isConfirmed);
        const resultType = m.resultType || 'normal';
        let winner: string | null = null;
        let loser: string | null = null;
        if (isConfirmed && resultType !== 'cancelled') {
          if (resultType === 'team1_forfeit_win') {
            winner = m.team1;
            loser = m.team2;
          } else if (resultType === 'team2_forfeit_win') {
            winner = m.team2;
            loser = m.team1;
          } else if (m.score1Final !== m.score2Final) {
            winner = m.score1Final > m.score2Final ? m.team1 : m.team2;
            loser = m.score1Final > m.score2Final ? m.team2 : m.team1;
          } else if (m.winningTeamFinal) {
            winner = m.winningTeamFinal;
            loser = m.winningTeamFinal === m.team1 ? m.team2 : m.team1;
          }
        }
        const r = parseBilingual(m.round).ko;
        const isThirdPlace = /3.*4위|34위|3,4위/.test(r);
        const level = /결선|결승/.test(r) && !/준결/.test(r) ? 3 : isThirdPlace ? 3 : /본선|준결|4강/.test(r) ? 2 : 1;
        outcomes.push({
          roundName: r,
          level,
          isThirdPlace,
          team1: m.team1,
          team2: m.team2,
          isConfirmed,
          resultType,
          winner,
          loser,
        });
      }
    }

    const maxLevel = outcomes.reduce((acc, o) => Math.max(acc, o.level), 1);
    const hasThirdPlaceMatch = outcomes.some((o) => o.isThirdPlace);
    const sportRanks: Record<string, number> = {};

    // Sort outcomes from preliminary -> semifinal -> third_place -> final
    const roundOrder = { preliminary: 1, semifinal: 2, third_place: 3, final: 4 };
    const sortedOutcomes = [...outcomes].sort((a, b) => {
      const ta = classifyRoundType(a.roundName, a.isThirdPlace, a.level, maxLevel);
      const tb = classifyRoundType(b.roundName, b.isThirdPlace, b.level, maxLevel);
      return roundOrder[ta] - roundOrder[tb];
    });

    for (const o of sortedOutcomes) {
      if (!o.isConfirmed) continue;
      const rType = classifyRoundType(o.roundName, o.isThirdPlace, o.level, maxLevel);

      if (rType === 'preliminary') {
        const prelimLoserRank = sport === 'lol' ? 4 : 5;
        if (o.resultType === 'cancelled') {
          if (isValidSchool(o.team1)) sportRanks[o.team1] = prelimLoserRank;
          if (isValidSchool(o.team2)) sportRanks[o.team2] = prelimLoserRank;
        } else if (isValidSchool(o.loser)) {
          sportRanks[o.loser] = prelimLoserRank;
        }
      } else if (rType === 'semifinal') {
        if (o.resultType === 'cancelled') {
          // 취소된 본선 경기의 양 팀은 공동 3위 부여 (단, 결선 진출 시 결선 순위로 덮어써짐)
          if (isValidSchool(o.team1)) sportRanks[o.team1] = 3;
          if (isValidSchool(o.team2)) sportRanks[o.team2] = 3;
        } else if (isValidSchool(o.loser)) {
          if (sport === 'lol') {
            // LoL은 본선(4경기) 패자가 즉시 3위
            sportRanks[o.loser] = 3;
          } else if (!hasThirdPlaceMatch) {
            // 3·4위전이 없는 종목(농구, 야구, 배드민턴)은 기본적으로 사용자(관리자) 입력(manualRanks)으로 3위를 지정하되,
            // 아직 3위 지정 전에는 4위(0pt)로 기록해 두고 manualRanks에서 3위를 덮어씀
            sportRanks[o.loser] = 4;
          }
        }
      } else if (rType === 'third_place') {
        if (o.resultType === 'cancelled') {
          if (isValidSchool(o.team1)) sportRanks[o.team1] = 3;
          if (isValidSchool(o.team2)) sportRanks[o.team2] = 3;
        } else {
          if (isValidSchool(o.winner)) sportRanks[o.winner] = 3;
          if (isValidSchool(o.loser)) sportRanks[o.loser] = 4;
        }
      } else if (rType === 'final') {
        if (o.resultType === 'cancelled') {
          if (isValidSchool(o.team1)) sportRanks[o.team1] = 1;
          if (isValidSchool(o.team2)) sportRanks[o.team2] = 1;
        } else {
          if (isValidSchool(o.winner)) sportRanks[o.winner] = 1;
          if (isValidSchool(o.loser)) sportRanks[o.loser] = 2;
        }
      }
    }

    // Apply manual ranks from Admin (e.g. 3rd place selection for basketball, baseball, badminton, or any custom override)
    if (tree?.manualRanks) {
      for (const [sid, manualRank] of Object.entries(tree.manualRanks)) {
        if (!isValidSchool(sid)) continue;
        const parsedRank = Number(manualRank);
        if (parsedRank > 0) {
          sportRanks[sid] = parsedRank;
        } else if (parsedRank === 0) {
          delete sportRanks[sid];
        }
      }
    }

    // Count how many schools share each rank in this sport for tie display (공동 N위)
    const rankCounts: Record<number, number> = {};
    for (const sid of schoolIds) {
      const r = sportRanks[sid] || 0;
      if (r > 0) {
        rankCounts[r] = (rankCounts[r] || 0) + 1;
      }
    }

    for (const sid of schoolIds) {
      const rank = sportRanks[sid] || 0;
      const points = getPointsForSportRank(sport, rank);
      const isTied = rank > 0 && (rankCounts[rank] || 0) > 1;

      schoolBreakdown[sid][sport] = {
        sportKey: sport,
        sportName: sportNames[sport],
        rank,
        points,
        isTied,
      };
      totalPointsBySchool[sid] += points;
    }
  }

  // Build overall school standings
  const overallList: SchoolStanding[] = schoolIds.map((sid) => {
    const schoolObj = SCHOOLS[sid] || SCHOOLS.POSTECH;
    const schoolKey = `school.${sid}` as keyof typeof dict;
    return {
      schoolId: sid,
      schoolName: dict[schoolKey] || schoolObj.name,
      shortName: schoolObj.shortName,
      logoText: schoolObj.logoText,
      logoUrl: schoolObj.logoUrl,
      color: schoolObj.color,
      bgLight: schoolObj.bgLight,
      textColor: schoolObj.textColor,
      totalPoints: totalPointsBySchool[sid],
      breakdown: schoolBreakdown[sid],
      rank: 1,
      isTied: false,
    };
  });

  // Sort overall standings strictly by totalPoints descending
  overallList.sort((a, b) => b.totalPoints - a.totalPoints);

  // Calculate tie-aware ranks based solely on totalPoints
  const pointsCount: Record<number, number> = {};
  for (const item of overallList) {
    pointsCount[item.totalPoints] = (pointsCount[item.totalPoints] || 0) + 1;
  }

  for (let i = 0; i < overallList.length; i++) {
    if (i > 0 && overallList[i].totalPoints === overallList[i - 1].totalPoints) {
      overallList[i].rank = overallList[i - 1].rank;
    } else {
      overallList[i].rank = i + 1;
    }
    overallList[i].isTied =
      overallList[i].totalPoints > 0 && (pointsCount[overallList[i].totalPoints] || 0) > 1;
  }

  return overallList;
}
