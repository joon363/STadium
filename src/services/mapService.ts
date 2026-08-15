import { VenueNode, MapEdge } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

/**
 * Fetch all venues from map_venues table (Cached)
 */
export async function getSupabaseMapVenues(forceRefresh: boolean = false): Promise<VenueNode[]> {
  if (!forceRefresh) {
    const cached = getFromCache<VenueNode[]>('map_venues');
    if (cached) return cached;
  }

  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('map_venues')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase Map Venues] Fetch error:', error);
      return [];
    }

    const formatted: VenueNode[] = data.map((row: any) => ({
      id: row.id,
      name: row.name,
      category: row.category,
      x: Number(row.x),
      y: Number(row.y),
      lat: Number(row.lat),
      lng: Number(row.lng),
      description: row.description || '',
      icon: row.icon || '📍',
      isEatingZone: row.is_eating_zone || false,
      isRestArea: row.is_rest_area || false,
    }));

    saveToCache('map_venues', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Map Venues] Exception:', err);
    return [];
  }
}

/**
 * Fetch all roads from map_roads table (Cached)
 */
export async function getSupabaseMapRoads(forceRefresh: boolean = false): Promise<MapEdge[]> {
  if (!forceRefresh) {
    const cached = getFromCache<MapEdge[]>('map_roads');
    if (cached) return cached;
  }

  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('map_roads')
      .select('*')
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase Map Roads] Fetch error:', error);
      return [];
    }

    const formatted: MapEdge[] = data.map((row: any) => ({
      id: row.id,
      fromNodeId: row.from_node_id,
      toNodeId: row.to_node_id,
      weightMinutes: Number(row.weight_minutes),
      waypoints: row.waypoints || [],
    }));

    saveToCache('map_roads', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Map Roads] Exception:', err);
    return [];
  }
}

/**
 * Combined fetch for convenience
 */
export async function getSupabaseMapData(
  forceRefresh: boolean = false
): Promise<{ nodes: VenueNode[]; edges: MapEdge[] } | null> {
  const [nodes, edges] = await Promise.all([
    getSupabaseMapVenues(forceRefresh),
    getSupabaseMapRoads(forceRefresh),
  ]);

  if (nodes.length === 0 && edges.length === 0) return null;
  return { nodes, edges };
}

/**
 * Upsert a single venue
 */
export async function upsertMapVenue(
  node: VenueNode
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase.from('map_venues').upsert({
      id: node.id,
      name: node.name,
      category: node.category,
      x: node.x,
      y: node.y,
      lat: node.lat,
      lng: node.lng,
      description: node.description,
      icon: node.icon,
      is_eating_zone: node.isEatingZone || false,
      is_rest_area: node.isRestArea || false,
    });

    if (error) {
      console.error('[Supabase Venue Upsert]', error);
      return { success: false, error: error.message };
    }
    invalidateAppCache('map_venues');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Delete a venue
 */
export async function deleteMapVenue(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase.from('map_venues').delete().eq('id', id);

    if (error) {
      console.error('[Supabase Venue Delete]', error);
      return { success: false, error: error.message };
    }
    invalidateAppCache('map_venues');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Upsert a single road
 */
export async function upsertMapRoad(edge: MapEdge): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase.from('map_roads').upsert({
      id: edge.id,
      from_node_id: edge.fromNodeId,
      to_node_id: edge.toNodeId,
      weight_minutes: edge.weightMinutes,
      waypoints: edge.waypoints || [],
    });

    if (error) {
      console.error('[Supabase Road Upsert]', error);
      return { success: false, error: error.message };
    }
    invalidateAppCache('map_roads');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Delete a road
 */
export async function deleteMapRoad(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase.from('map_roads').delete().eq('id', id);

    if (error) {
      console.error('[Supabase Road Delete]', error);
      return { success: false, error: error.message };
    }
    invalidateAppCache('map_roads');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Bulk reset: delete all & re-insert defaults
 */
export async function resetMapToDefaults(
  defaultNodes: VenueNode[],
  defaultEdges: MapEdge[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error: delRoads } = await supabase.from('map_roads').delete().neq('id', '');
    if (delRoads) return { success: false, error: delRoads.message };

    const { error: delVenues } = await supabase.from('map_venues').delete().neq('id', '');
    if (delVenues) return { success: false, error: delVenues.message };

    const venueRows = defaultNodes.map((n) => ({
      id: n.id,
      name: n.name,
      category: n.category,
      x: n.x,
      y: n.y,
      lat: n.lat,
      lng: n.lng,
      description: n.description,
      icon: n.icon,
      is_eating_zone: n.isEatingZone || false,
      is_rest_area: n.isRestArea || false,
    }));
    const { error: insVenues } = await supabase.from('map_venues').insert(venueRows);
    if (insVenues) return { success: false, error: insVenues.message };

    const roadRows = defaultEdges.map((e) => ({
      id: e.id,
      from_node_id: e.fromNodeId,
      to_node_id: e.toNodeId,
      weight_minutes: e.weightMinutes,
      waypoints: e.waypoints || [],
    }));
    const { error: insRoads } = await supabase.from('map_roads').insert(roadRows);
    if (insRoads) return { success: false, error: insRoads.message };

    invalidateAppCache('map_venues');
    invalidateAppCache('map_roads');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
