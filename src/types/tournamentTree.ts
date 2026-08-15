import { SportKey, RawScheduledMatch, MatchItem, SCHOOLS } from '../config/stadiumConfig';

export interface TournamentLeafNode {
  id: string; // e.g. "team-1"
  type: 'team';
  teamName: string; // e.g. "POSTECH", "KAIST", "GIST", "UNIST", "DGIST", "KENTECH"
  colIndex: number; // 0, 1, 2, 3, 4, 5... (horizontal order along bottom baseline)
  level: 0; // always 0 for baseline leaf teams
}

export interface TournamentGameNode {
  id: string; // e.g. "game-1", "match-123"
  type: 'game';
  roundName: string; // e.g. "예선 1경기", "준결승 1경기", "결승전"
  child1Id: string; // left child node id (can be team or game)
  child2Id: string; // right child node id (can be team or game)
  team1: string; // display team1 or "[Child 1 승자]"
  team2: string; // display team2 or "[Child 2 승자]"
  score1: number;
  score2: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  venue: string;
  isLive?: boolean;
  level: number; // max(child1.level, child2.level) + 1
}

export type TournamentNode = TournamentLeafNode | TournamentGameNode;

export interface TournamentTreeData {
  sportKey: SportKey;
  nodes: Record<string, TournamentNode>;
  updatedAt?: number;
}

export interface ComputedPositionNode {
  node: TournamentNode;
  x: number; // center X
  y: number; // top Y
  width: number;
  height: number;
  level: number;
}

export interface ComputedSvgLine {
  id: string;
  path: string;
  isLive: boolean;
  strokeColor: string;
}

/**
 * Calculates absolute (X, Y) coordinates and upward SVG connecting lines for any custom tournament tree
 */
export function computeTournamentTreeLayout(
  tree: TournamentTreeData,
  options: {
    cardWidth?: number;
    cardHeight?: number;
    teamPillWidth?: number;
    teamPillHeight?: number;
    colGap?: number;
    levelHeight?: number;
    paddingX?: number;
    paddingY?: number;
  } = {}
): {
  nodesWithPos: ComputedPositionNode[];
  svgLines: ComputedSvgLine[];
  totalWidth: number;
  totalHeight: number;
} {
  const cardWidth = options.cardWidth ?? 170;
  const cardHeight = options.cardHeight ?? 58;
  const teamPillWidth = options.teamPillWidth ?? 96;
  const teamPillHeight = options.teamPillHeight ?? 32;
  const colGap = options.colGap ?? 28;
  const levelHeight = options.levelHeight ?? 90;
  const paddingX = options.paddingX ?? 24;
  const paddingY = options.paddingY ?? 32;

  const nodeMap = tree.nodes || {};
  const allNodes = Object.values(nodeMap);

  if (allNodes.length === 0) {
    return { nodesWithPos: [], svgLines: [], totalWidth: 320, totalHeight: 200 };
  }

  // 1. Get leaf team nodes and sort by colIndex
  const leafNodes = allNodes
    .filter((n): n is TournamentLeafNode => n.type === 'team')
    .sort((a, b) => a.colIndex - b.colIndex);

  const totalCols = Math.max(leafNodes.length, 1);
  const slotWidth = Math.max(cardWidth, teamPillWidth) + colGap;

  // 2. Position leaf nodes at level 0 (baseline)
  const posMap = new Map<
    string,
    { x: number; y: number; width: number; height: number; level: number }
  >();

  // Determine max level in tree
  let maxLevel = 0;
  allNodes.forEach((n) => {
    if (n.level > maxLevel) maxLevel = n.level;
  });

  const baselineY = paddingY + maxLevel * levelHeight;

  leafNodes.forEach((leaf, idx) => {
    const x = paddingX + idx * slotWidth + (slotWidth - teamPillWidth) / 2;
    const y = baselineY + (cardHeight - teamPillHeight) / 2;
    posMap.set(leaf.id, {
      x: x + teamPillWidth / 2, // store center X
      y,
      width: teamPillWidth,
      height: teamPillHeight,
      level: 0,
    });
  });

  // 3. Compute game node positions from level 1 upwards
  const gameNodes = allNodes.filter((n): n is TournamentGameNode => n.type === 'game');

  // Topological / Level-based evaluation
  const sortedGames = [...gameNodes].sort((a, b) => a.level - b.level);

  sortedGames.forEach((game) => {
    const c1Pos = posMap.get(game.child1Id);
    const c2Pos = posMap.get(game.child2Id);

    let centerX = paddingX + slotWidth / 2;
    if (c1Pos && c2Pos) {
      centerX = (c1Pos.x + c2Pos.x) / 2;
    } else if (c1Pos) {
      centerX = c1Pos.x;
    } else if (c2Pos) {
      centerX = c2Pos.x;
    }

    const y = baselineY - game.level * levelHeight;

    posMap.set(game.id, {
      x: centerX,
      y,
      width: cardWidth,
      height: cardHeight,
      level: game.level,
    });
  });

  // 4. Generate upward inverted-U SVG lines
  const svgLines: ComputedSvgLine[] = [];

  sortedGames.forEach((game) => {
    const gPos = posMap.get(game.id);
    const c1Pos = posMap.get(game.child1Id);
    const c2Pos = posMap.get(game.child2Id);

    if (!gPos) return;

    const targetBottomY = gPos.y + gPos.height;
    const junctionY = targetBottomY + (levelHeight - gPos.height) / 2;

    if (c1Pos && c2Pos) {
      const x1 = c1Pos.x;
      const y1 = c1Pos.y; // top edge of child 1
      const x2 = c2Pos.x;
      const y2 = c2Pos.y; // top edge of child 2
      const targetX = gPos.x;

      // Inverted-U path: UP from child1 to junction, UP from child2 to junction, horizontal bar, and UP to game box
      const pathD = `M ${x1} ${y1} V ${junctionY} H ${x2} V ${y2} M ${targetX} ${junctionY} V ${targetBottomY}`;

      svgLines.push({
        id: `line-${game.id}`,
        path: pathD,
        isLive: Boolean(game.isLive),
        strokeColor: game.isLive ? '#f43f5e' : '#94a3b8',
      });
    } else if (c1Pos) {
      const x1 = c1Pos.x;
      const y1 = c1Pos.y;
      const targetX = gPos.x;

      const pathD = `M ${x1} ${y1} V ${junctionY} H ${targetX} V ${targetBottomY}`;
      svgLines.push({
        id: `line-${game.id}`,
        path: pathD,
        isLive: Boolean(game.isLive),
        strokeColor: game.isLive ? '#f43f5e' : '#94a3b8',
      });
    }
  });

  const nodesWithPos: ComputedPositionNode[] = allNodes.map((node) => {
    const pos = posMap.get(node.id) || {
      x: paddingX,
      y: baselineY,
      width: cardWidth,
      height: cardHeight,
      level: node.level,
    };
    return {
      node,
      x: pos.x - pos.width / 2, // top-left X for DOM rendering
      y: pos.y,
      width: pos.width,
      height: pos.height,
      level: pos.level,
    };
  });

  const totalWidth = paddingX * 2 + totalCols * slotWidth;
  const totalHeight = baselineY + cardHeight + paddingY;

  return {
    nodesWithPos,
    svgLines,
    totalWidth: Math.max(totalWidth, 340),
    totalHeight: Math.max(totalHeight, 260),
  };
}

/**
 * Creates default tree preset matching Photo 1 (5-Team Asymmetric Tournament)
 */
export function createPhoto1Preset(sportKey: SportKey): TournamentTreeData {
  return {
    sportKey,
    nodes: {
      'team-1': { id: 'team-1', type: 'team', teamName: 'KAIST', colIndex: 0, level: 0 },
      'team-2': { id: 'team-2', type: 'team', teamName: 'POSTECH', colIndex: 1, level: 0 },
      'team-3': { id: 'team-3', type: 'team', teamName: 'GIST', colIndex: 2, level: 0 },
      'team-4': { id: 'team-4', type: 'team', teamName: 'DGIST', colIndex: 3, level: 0 },
      'team-5': { id: 'team-5', type: 'team', teamName: 'UNIST', colIndex: 4, level: 0 },

      'game-1': {
        id: 'game-1',
        type: 'game',
        roundName: '예선 1경기',
        child1Id: 'team-1',
        child2Id: 'team-2',
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
      'game-2': {
        id: 'game-2',
        type: 'game',
        roundName: '예선 2경기',
        child1Id: 'team-3',
        child2Id: 'team-4',
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
      'game-3': {
        id: 'game-3',
        type: 'game',
        roundName: '준결승전',
        child1Id: 'game-2',
        child2Id: 'team-5',
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
      'game-4': {
        id: 'game-4',
        type: 'game',
        roundName: '결승전',
        child1Id: 'game-1',
        child2Id: 'game-3',
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
      'team-1': { id: 'team-1', type: 'team', teamName: 'KENTECH', colIndex: 0, level: 0 },
      'team-2': { id: 'team-2', type: 'team', teamName: 'GIST', colIndex: 1, level: 0 },
      'team-3': { id: 'team-3', type: 'team', teamName: 'POSTECH', colIndex: 2, level: 0 },
      'team-4': { id: 'team-4', type: 'team', teamName: 'UNIST', colIndex: 3, level: 0 },
      'team-5': { id: 'team-5', type: 'team', teamName: 'KAIST', colIndex: 4, level: 0 },
      'team-6': { id: 'team-6', type: 'team', teamName: 'DGIST', colIndex: 5, level: 0 },

      'game-1': {
        id: 'game-1',
        type: 'game',
        roundName: '6강 1경기',
        child1Id: 'team-1',
        child2Id: 'team-2',
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
      'game-2': {
        id: 'game-2',
        type: 'game',
        roundName: '6강 2경기',
        child1Id: 'team-4',
        child2Id: 'team-5',
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
      'game-3': {
        id: 'game-3',
        type: 'game',
        roundName: '준결승 1경기',
        child1Id: 'game-1',
        child2Id: 'team-3',
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
      'game-4': {
        id: 'game-4',
        type: 'game',
        roundName: '준결승 2경기',
        child1Id: 'game-2',
        child2Id: 'team-6',
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
      'game-5': {
        id: 'game-5',
        type: 'game',
        roundName: '결승전',
        child1Id: 'game-3',
        child2Id: 'game-4',
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
      'team-1': { id: 'team-1', type: 'team', teamName: 'POSTECH', colIndex: 0, level: 0 },
      'team-2': { id: 'team-2', type: 'team', teamName: 'UNIST', colIndex: 1, level: 0 },
      'team-3': { id: 'team-3', type: 'team', teamName: 'KAIST', colIndex: 2, level: 0 },
      'team-4': { id: 'team-4', type: 'team', teamName: 'GIST', colIndex: 3, level: 0 },

      'game-1': {
        id: 'game-1',
        type: 'game',
        roundName: '준결승 1경기',
        child1Id: 'team-1',
        child2Id: 'team-2',
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
      'game-2': {
        id: 'game-2',
        type: 'game',
        roundName: '준결승 2경기',
        child1Id: 'team-3',
        child2Id: 'team-4',
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
      'game-3': {
        id: 'game-3',
        type: 'game',
        roundName: '결승전',
        child1Id: 'game-1',
        child2Id: 'game-2',
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

  return games.map((g) => ({
    id: g.id,
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
  }));
}
