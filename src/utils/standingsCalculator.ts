import {
  RawScheduledMatch,
  SchoolStanding,
  SportKey,
  SportScoreBreakdown,
} from '../types/stadium';
import { SCHOOLS } from '../constants/schools';
import { evaluateMatchItem } from './matchEvaluator';

export function calculateOverallStandings(
  customMatches?: RawScheduledMatch[] | null,
  now: Date = new Date()
): SchoolStanding[] {
  const allRawMatches = customMatches || [];

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
    soccer: '축구',
    baseball: '야구',
    lol: 'LoL',
    badminton: '배드민턴',
    badminton_men: '배드민턴 (남복)',
    badminton_women: '배드민턴 (여복)',
    badminton_mixed: '배드민턴 (혼복)',
    basketball: '농구',
  };

  const schoolBreakdown: Record<string, Record<SportKey, SportScoreBreakdown>> = {};
  const totalStats: Record<string, { totalWins: number; totalScoreDiff: number; totalPoints: number }> = {};

  schoolIds.forEach((sid) => {
    schoolBreakdown[sid] = {} as Record<SportKey, SportScoreBreakdown>;
    totalStats[sid] = { totalWins: 0, totalScoreDiff: 0, totalPoints: 0 };
    sportKeys.forEach((sport) => {
      schoolBreakdown[sid][sport] = {
        sportKey: sport,
        sportName: sportNames[sport],
        rank: 0,
        points: 0,
      };
    });
  });

  for (const sport of sportKeys) {
    const rawSportMatches = allRawMatches.filter((m) => m.sportKey === sport);

    const teamStats: Record<string, { wins: number; scoreDiff: number; points: number; matchesPlayed: number }> = {};
    schoolIds.forEach((sid) => {
      teamStats[sid] = { wins: 0, scoreDiff: 0, points: 0, matchesPlayed: 0 };
    });

    let sportHasFinishedMatches = false;

    rawSportMatches.forEach((m) => {
      const evalMatch = evaluateMatchItem(m, now);
      const isEnded = evalMatch.statusText === '종료' || evalMatch.winningTeam !== null || (evalMatch.score1 > 0 || evalMatch.score2 > 0);

      if (isEnded) {
        sportHasFinishedMatches = true;
        if (teamStats[evalMatch.team1]) teamStats[evalMatch.team1].matchesPlayed += 1;
        if (teamStats[evalMatch.team2]) teamStats[evalMatch.team2].matchesPlayed += 1;

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

    if (sportHasFinishedMatches) {
      // Sort teams in this sport by points desc, then scoreDiff desc, then wins desc
      const sortedSportTeams = [...schoolIds].sort((a, b) => {
        if (teamStats[b].points !== teamStats[a].points) {
          return teamStats[b].points - teamStats[a].points;
        }
        if (teamStats[b].scoreDiff !== teamStats[a].scoreDiff) {
          return teamStats[b].scoreDiff - teamStats[a].scoreDiff;
        }
        return teamStats[b].wins - teamStats[a].wins;
      });

      sortedSportTeams.forEach((sid, idx) => {
        const rank = idx + 1;
        const sportPts = teamStats[sid].points;
        schoolBreakdown[sid][sport] = {
          sportKey: sport,
          sportName: sportNames[sport],
          rank,
          points: sportPts,
        };
        totalStats[sid].totalPoints += sportPts;
        totalStats[sid].totalWins += teamStats[sid].wins;
        totalStats[sid].totalScoreDiff += teamStats[sid].scoreDiff;
      });
    } else {
      // Sport not played yet - all 0 pts
      schoolIds.forEach((sid) => {
        schoolBreakdown[sid][sport] = {
          sportKey: sport,
          sportName: sportNames[sport],
          rank: 0,
          points: 0,
        };
      });
    }
  }

  // Build overall school standings
  const overallList = schoolIds.map((sid) => {
    const schoolObj = SCHOOLS[sid] || SCHOOLS.POSTECH;
    return {
      schoolId: sid,
      schoolName: schoolObj.name,
      shortName: schoolObj.shortName,
      logoText: schoolObj.logoText,
      logoUrl: schoolObj.logoUrl,
      color: schoolObj.color,
      bgLight: schoolObj.bgLight,
      textColor: schoolObj.textColor,
      totalPoints: totalStats[sid].totalPoints,
      totalWins: totalStats[sid].totalWins,
      totalScoreDiff: totalStats[sid].totalScoreDiff,
      breakdown: schoolBreakdown[sid],
      rank: 1,
    };
  });

  // Sort overall standings: points desc, then scoreDiff desc, then wins desc
  overallList.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    if (b.totalScoreDiff !== a.totalScoreDiff) {
      return b.totalScoreDiff - a.totalScoreDiff;
    }
    return b.totalWins - a.totalWins;
  });

  // Calculate tie-aware ranks
  let currentRank = 1;
  for (let i = 0; i < overallList.length; i++) {
    if (
      i > 0 &&
      overallList[i].totalPoints === overallList[i - 1].totalPoints &&
      overallList[i].totalScoreDiff === overallList[i - 1].totalScoreDiff &&
      overallList[i].totalWins === overallList[i - 1].totalWins
    ) {
      overallList[i].rank = overallList[i - 1].rank;
    } else {
      overallList[i].rank = currentRank;
    }
    currentRank++;
  }

  return overallList;
}
