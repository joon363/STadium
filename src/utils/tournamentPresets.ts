import { SportKey, RawScheduledMatch } from '../types/stadium';
import { TournamentTreeData, TournamentGameNode } from '../types/tournamentTree';

/**
 * Creates default tree preset matching Photo 1 (5-Team Asymmetric Tournament)
 */
export function createPhoto1Preset(sportKey: SportKey): TournamentTreeData {
  return {
    sportKey,
    nodes: {
      [`${sportKey}-team-1`]: { id: `${sportKey}-team-1`, type: 'team', teamName: 'KAIST', colIndex: 0, level: 0 },
      [`${sportKey}-team-2`]: { id: `${sportKey}-team-2`, type: 'team', teamName: 'POSTECH', colIndex: 1, level: 0 },
      [`${sportKey}-team-3`]: { id: `${sportKey}-team-3`, type: 'team', teamName: 'GIST', colIndex: 2, level: 0 },
      [`${sportKey}-team-4`]: { id: `${sportKey}-team-4`, type: 'team', teamName: 'DGIST', colIndex: 3, level: 0 },
      [`${sportKey}-team-5`]: { id: `${sportKey}-team-5`, type: 'team', teamName: 'UNIST', colIndex: 4, level: 0 },

      [`${sportKey}-game-1`]: {
        id: `${sportKey}-game-1`,
        type: 'game',
        roundName: '예선 1경기',
        child1Id: `${sportKey}-team-1`,
        child2Id: `${sportKey}-team-2`,
        team1: 'KAIST',
        team2: 'POSTECH',
        score1: 0,
        score2: 0,
        startHour: 10,
        startMinute: 0,
        endHour: 11,
        endMinute: 30,
        venue: '대운동장',
        level: 1,
      },
      [`${sportKey}-game-2`]: {
        id: `${sportKey}-game-2`,
        type: 'game',
        roundName: '예선 2경기',
        child1Id: `${sportKey}-team-3`,
        child2Id: `${sportKey}-team-4`,
        team1: 'GIST',
        team2: 'DGIST',
        score1: 0,
        score2: 0,
        startHour: 12,
        startMinute: 0,
        endHour: 13,
        endMinute: 30,
        venue: '대운동장',
        level: 1,
      },
      [`${sportKey}-game-3`]: {
        id: `${sportKey}-game-3`,
        type: 'game',
        roundName: '준결선',
        child1Id: `${sportKey}-game-2`,
        child2Id: `${sportKey}-team-5`,
        team1: '예선2 승자',
        team2: 'UNIST',
        score1: 0,
        score2: 0,
        startHour: 15,
        startMinute: 0,
        endHour: 16,
        endMinute: 30,
        venue: '대운동장',
        level: 2,
      },
      [`${sportKey}-game-4`]: {
        id: `${sportKey}-game-4`,
        type: 'game',
        roundName: '결선',
        child1Id: `${sportKey}-game-1`,
        child2Id: `${sportKey}-game-3`,
        team1: '예선1 승자',
        team2: '준결승 승자',
        score1: 0,
        score2: 0,
        startHour: 18,
        startMinute: 0,
        endHour: 19,
        endMinute: 30,
        venue: '대운동장',
        level: 3,
      },
    },
  };
}

/**
 * Creates default tree preset matching Photo 2 (6-Team Standard Tournament)
 */
export function createPhoto2Preset(sportKey: SportKey): TournamentTreeData {
  return {
    sportKey,
    nodes: {
      [`${sportKey}-team-1`]: { id: `${sportKey}-team-1`, type: 'team', teamName: 'KENTECH', colIndex: 0, level: 0 },
      [`${sportKey}-team-2`]: { id: `${sportKey}-team-2`, type: 'team', teamName: 'GIST', colIndex: 1, level: 0 },
      [`${sportKey}-team-3`]: { id: `${sportKey}-team-3`, type: 'team', teamName: 'POSTECH', colIndex: 2, level: 0 },
      [`${sportKey}-team-4`]: { id: `${sportKey}-team-4`, type: 'team', teamName: 'UNIST', colIndex: 3, level: 0 },
      [`${sportKey}-team-5`]: { id: `${sportKey}-team-5`, type: 'team', teamName: 'KAIST', colIndex: 4, level: 0 },
      [`${sportKey}-team-6`]: { id: `${sportKey}-team-6`, type: 'team', teamName: 'DGIST', colIndex: 5, level: 0 },

      [`${sportKey}-game-1`]: {
        id: `${sportKey}-game-1`,
        type: 'game',
        roundName: '예선1',
        child1Id: `${sportKey}-team-1`,
        child2Id: `${sportKey}-team-2`,
        team1: 'KENTECH',
        team2: 'GIST',
        score1: 0,
        score2: 0,
        startHour: 10,
        startMinute: 0,
        endHour: 11,
        endMinute: 30,
        venue: '체육관',
        level: 1,
      },
      [`${sportKey}-game-2`]: {
        id: `${sportKey}-game-2`,
        type: 'game',
        roundName: '예선2',
        child1Id: `${sportKey}-team-4`,
        child2Id: `${sportKey}-team-5`,
        team1: 'UNIST',
        team2: 'KAIST',
        score1: 0,
        score2: 0,
        startHour: 12,
        startMinute: 0,
        endHour: 13,
        endMinute: 30,
        venue: '체육관',
        level: 1,
      },
      [`${sportKey}-game-3`]: {
        id: `${sportKey}-game-3`,
        type: 'game',
        roundName: '본선1',
        child1Id: `${sportKey}-game-1`,
        child2Id: `${sportKey}-team-3`,
        team1: '6강 1 승자',
        team2: 'POSTECH',
        score1: 0,
        score2: 0,
        startHour: 15,
        startMinute: 0,
        endHour: 16,
        endMinute: 30,
        venue: '체육관',
        level: 2,
      },
      [`${sportKey}-game-4`]: {
        id: `${sportKey}-game-4`,
        type: 'game',
        roundName: '본선2',
        child1Id: `${sportKey}-game-2`,
        child2Id: `${sportKey}-team-6`,
        team1: '6강 2 승자',
        team2: 'DGIST',
        score1: 0,
        score2: 0,
        startHour: 17,
        startMinute: 0,
        endHour: 18,
        endMinute: 30,
        venue: '체육관',
        level: 2,
      },
      [`${sportKey}-game-5`]: {
        id: `${sportKey}-game-5`,
        type: 'game',
        roundName: '결선',
        child1Id: `${sportKey}-game-3`,
        child2Id: `${sportKey}-game-4`,
        team1: '준결승 1 승자',
        team2: '준결승 2 승자',
        score1: 0,
        score2: 0,
        startHour: 19,
        startMinute: 30,
        endHour: 21,
        endMinute: 0,
        venue: '체육관',
        level: 3,
      },
    },
  };
}

/**
 * Creates 4-team simple semifinal-to-final preset
 */
export function create4TeamPreset(sportKey: SportKey): TournamentTreeData {
  return {
    sportKey,
    nodes: {
      [`${sportKey}-team-1`]: { id: `${sportKey}-team-1`, type: 'team', teamName: 'POSTECH', colIndex: 0, level: 0 },
      [`${sportKey}-team-2`]: { id: `${sportKey}-team-2`, type: 'team', teamName: 'UNIST', colIndex: 1, level: 0 },
      [`${sportKey}-team-3`]: { id: `${sportKey}-team-3`, type: 'team', teamName: 'KAIST', colIndex: 2, level: 0 },
      [`${sportKey}-team-4`]: { id: `${sportKey}-team-4`, type: 'team', teamName: 'GIST', colIndex: 3, level: 0 },

      [`${sportKey}-game-1`]: {
        id: `${sportKey}-game-1`,
        type: 'game',
        roundName: '본선1',
        child1Id: `${sportKey}-team-1`,
        child2Id: `${sportKey}-team-2`,
        team1: 'POSTECH',
        team2: 'UNIST',
        score1: 0,
        score2: 0,
        startHour: 14,
        startMinute: 0,
        endHour: 15,
        endMinute: 30,
        venue: '대운동장',
        level: 1,
      },
      [`${sportKey}-game-2`]: {
        id: `${sportKey}-game-2`,
        type: 'game',
        roundName: '본선2',
        child1Id: `${sportKey}-team-3`,
        child2Id: `${sportKey}-team-4`,
        team1: 'KAIST',
        team2: 'GIST',
        score1: 0,
        score2: 0,
        startHour: 16,
        startMinute: 0,
        endHour: 17,
        endMinute: 30,
        venue: '대운동장',
        level: 1,
      },
      [`${sportKey}-game-3`]: {
        id: `${sportKey}-game-3`,
        type: 'game',
        roundName: '결선',
        child1Id: `${sportKey}-game-1`,
        child2Id: `${sportKey}-game-2`,
        team1: '준결승 1 승자',
        team2: '준결승 2 승자',
        score1: 0,
        score2: 0,
        startHour: 19,
        startMinute: 0,
        endHour: 20,
        endMinute: 30,
        venue: '대운동장',
        level: 2,
      },
    },
  };
}

/**
 * Converts tournament tree game nodes into flat RawScheduledMatch items for schedule table synchronization
 */
export function convertTreeToMatches(
  tree: TournamentTreeData,
  sportName: string,
  icon: string
): RawScheduledMatch[] {
  const games = Object.values(tree.nodes).filter((n): n is TournamentGameNode => n.type === 'game');

  return games.map((g) => {
    // Ensure match ID is uniquely prefixed with sportKey
    const matchId = g.id.startsWith(`${tree.sportKey}-`) ? g.id : `${tree.sportKey}-${g.id}`;
    return {
      id: matchId,
      sportKey: tree.sportKey,
      sportName,
      icon,
      team1: g.team1,
      team2: g.team2,
      startHour: g.startHour,
      startMinute: g.startMinute,
      endHour: g.endHour,
      endMinute: g.endMinute,
      venue: g.venue,
      round: g.roundName,
      score1Final: g.score1,
      score2Final: g.score2,
      winningTeamFinal: g.score1 > g.score2 ? g.team1 : g.score2 > g.score1 ? g.team2 : null,
      isLive: g.status === 'live' || g.isLive,
    };
  });
}
