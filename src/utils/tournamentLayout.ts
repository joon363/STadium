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
