import { VenueNode, MapEdge } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseMapData(
  _forceRefresh = false
): Promise<{ nodes: VenueNode[]; edges: MapEdge[] } | null> {
  return ARCHIVED_SNAPSHOT.mapData;
}

export async function upsertSupabaseMapVenue(_venue: VenueNode): Promise<boolean> {
  return true;
}

export async function deleteSupabaseMapVenue(_id: string): Promise<boolean> {
  return true;
}

export async function upsertSupabaseMapEdge(_edge: MapEdge): Promise<boolean> {
  return true;
}

export async function deleteSupabaseMapEdge(_id: string): Promise<boolean> {
  return true;
}

export async function updateSupabaseMapData(
  _nodes: VenueNode[],
  _edges: MapEdge[]
): Promise<boolean> {
  return true;
}
