import {
  TournamentTreeData,
  TournamentLeafNode,
  TournamentGameNode,
  ComputedPositionNode,
  ComputedSvgLine,
} from '../types/tournamentTree';

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
  const cardWidth = options.cardWidth ?? 90;
  const cardHeight = options.cardHeight ?? 42;
  const teamPillWidth = options.teamPillWidth ?? 90;
  const teamPillHeight = options.teamPillHeight ?? 24;
  const colGap = options.colGap ?? 4;
  const levelHeight = options.levelHeight ?? 62;
  const paddingX = options.paddingX ?? 6;
  const paddingY = options.paddingY ?? 20;

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
      const y1 = c1Pos.y;
      const x2 = c2Pos.x;
      const y2 = c2Pos.y;
      const targetX = gPos.x;

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
 * Universally evaluates winners and propagates them upward to parent game nodes
 * based on children match outcomes (scores, live status, final state).
 */
export function propagateTournamentTreeWinners(
  tree: TournamentTreeData
): TournamentTreeData {
  if (!tree || !tree.nodes || Object.keys(tree.nodes).length === 0) {
    return tree;
  }

  const updatedNodes = { ...tree.nodes };
  const allNodes = Object.values(updatedNodes);

  // Helper to determine if a game node has completed and who won
  const getGameWinner = (game: TournamentGameNode): string | null => {
    // 1. Explicitly marked as after (finished)
    const isAfter = game.status === 'after';
    // 2. Or has final scores and not live
    const hasScores = !game.isLive && (game.score1 > 0 || game.score2 > 0);

    if ((isAfter || hasScores) && game.score1 !== game.score2) {
      return game.score1 > game.score2 ? game.team1 : game.team2;
    }
    return null;
  };

  // Sort game nodes by level ascending (Level 1 -> Level 2 -> Level 3 ...)
  const gameNodes = allNodes
    .filter((n): n is TournamentGameNode => n.type === 'game')
    .sort((a, b) => (a.level || 1) - (b.level || 1));

  let changed = true;
  let iterations = 0;

  while (changed && iterations < 10) {
    changed = false;
    iterations++;

    for (const game of gameNodes) {
      const c1 = updatedNodes[game.child1Id];
      const c2 = updatedNodes[game.child2Id];

      let nextTeam1 = game.team1;
      let nextTeam2 = game.team2;

      // 1. Resolve Team 1 from Child 1
      if (c1) {
        if (c1.type === 'team') {
          if (c1.teamName && nextTeam1 !== c1.teamName) {
            nextTeam1 = c1.teamName;
          }
        } else if (c1.type === 'game') {
          const winner = getGameWinner(c1);
          if (winner && !winner.includes('승자')) {
            if (nextTeam1 !== winner) {
              nextTeam1 = winner;
            }
          } else {
            const placeholder = `${c1.roundName} 승자`;
            // If child hasn't ended and current team is either a placeholder or outdated winner
            if (c1.status !== 'after' && (!c1.score1 && !c1.score2)) {
              if (nextTeam1 !== placeholder) {
                nextTeam1 = placeholder;
              }
            }
          }
        }
      }

      // 2. Resolve Team 2 from Child 2
      if (c2) {
        if (c2.type === 'team') {
          if (c2.teamName && nextTeam2 !== c2.teamName) {
            nextTeam2 = c2.teamName;
          }
        } else if (c2.type === 'game') {
          const winner = getGameWinner(c2);
          if (winner && !winner.includes('승자')) {
            if (nextTeam2 !== winner) {
              nextTeam2 = winner;
            }
          } else {
            const placeholder = `${c2.roundName} 승자`;
            if (c2.status !== 'after' && (!c2.score1 && !c2.score2)) {
              if (nextTeam2 !== placeholder) {
                nextTeam2 = placeholder;
              }
            }
          }
        }
      }

      if (nextTeam1 !== game.team1 || nextTeam2 !== game.team2) {
        const updatedGame: TournamentGameNode = {
          ...game,
          team1: nextTeam1,
          team2: nextTeam2,
        };
        updatedNodes[game.id] = updatedGame;
        const idx = gameNodes.findIndex((g) => g.id === game.id);
        if (idx !== -1) {
          gameNodes[idx] = updatedGame;
        }
        changed = true;
      }
    }
  }

  return {
    ...tree,
    nodes: updatedNodes,
  };
}

