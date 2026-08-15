import { VenueNode, MapEdge, NavigationResult, MapWaypoint } from '../types/stadium';

/**
 * Shortest Path Solver using Dijkstra's Algorithm on campus map graph
 */
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

  const adj = new Map<
    string,
    Array<{ to: string; weight: number; edge: MapEdge; isForward: boolean }>
  >();
  nodes.forEach((n) => adj.set(n.id, []));

  edges.forEach((edge) => {
    if (adj.has(edge.fromNodeId) && adj.has(edge.toNodeId)) {
      adj
        .get(edge.fromNodeId)!
        .push({ to: edge.toNodeId, weight: edge.weightMinutes, edge, isForward: true });
      adj
        .get(edge.toNodeId)!
        .push({ to: edge.fromNodeId, weight: edge.weightMinutes, edge, isForward: false });
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
