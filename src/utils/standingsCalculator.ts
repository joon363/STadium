import {
  RawScheduledMatch,
  SchoolStanding,
  SportKey,
  SportScoreBreakdown,
} from '../types/stadium';
import { SCHOOLS } from '../constants/schools';
import { DEFAULT_RAW_SCHEDULE_FLAT } from '../constants/defaultSchedule';
import { evaluateMatchItem } from './matchEvaluator';

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

  for (const sport of sportKeys) {
    const rawSportMatches = allRawMatches.filter((m) => m.sportKey === sport);

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

    const sortedSportTeams = [...schoolIds].sort((a, b) => {
      if (teamStats[b].points !== teamStats[a].points) {
        return teamStats[b].points - teamStats[a].points;
      }
      if (teamStats[b].scoreDiff !== teamStats[a].scoreDiff) {
        return teamStats[b].scoreDiff - teamStats[a].scoreDiff;
      }
      const defaultRankA = defaultSportRanks[sport][a] || 6;
      const defaultRankB = defaultSportRanks[sport][b] || 6;
      return defaultRankA - defaultRankB;
    });

    sortedSportTeams.forEach((sid, idx) => {
      const rank = idx + 1;
      const points = 7 - rank;
      schoolBreakdown[sid][sport] = {
        sportKey: sport,
        sportName: sportNames[sport],
        rank,
        points,
      };
    });
  }

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
      logoUrl: schoolObj.logoUrl,
      color: schoolObj.color,
      bgLight: schoolObj.bgLight,
      textColor: schoolObj.textColor,
      rank: 0,
      totalPoints,
      breakdown: schoolBreakdown[sid],
    };
  });

  result.sort((a, b) => b.totalPoints - a.totalPoints);

  result.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  return result;
}
