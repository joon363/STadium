import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RawScheduledMatch, StageItem, VenueNode, MapEdge } from '../config/stadiumConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

let localAdminPasswordMemory: string = 'stadium2026!';

function rawString(val: any): string {
  return typeof val === 'string' ? val : String(val || '');
}

// Fetch all matches from Supabase
export async function getSupabaseMatches(): Promise<RawScheduledMatch[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('matches').select('*').order('id', { ascending: true });
    if (error || !data || data.length === 0) {
      console.warn('Supabase matches query warning/error:', error);
      return null;
    }

    return data.map((row) => ({
      id: row.id,
      sportKey: row.sport_key,
      sportName: row.sport_name,
      icon: row.icon,
      team1: rawString(row.team1),
      team2: rawString(row.team2),
      startHour: Number(row.start_hour),
      startMinute: Number(row.start_minute),
      endHour: Number(row.end_hour),
      endMinute: Number(row.end_minute),
      venue: row.venue,
      round: row.round,
      score1Final: Number(row.score1_final),
      score2Final: Number(row.score2_final),
      winningTeamFinal: row.winning_team_final,
      subtitle: row.subtitle || undefined,
    }));
  } catch (err) {
    console.error('Supabase matches fetch error:', err);
    return null;
  }
}

// Update single match in Supabase
export async function updateSupabaseMatch(match: RawScheduledMatch): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('matches')
      .upsert({
        id: match.id,
        sport_key: match.sportKey,
        sport_name: match.sportName,
        icon: match.icon,
        team1: match.team1,
        team2: match.team2,
        start_hour: match.startHour,
        start_minute: match.startMinute,
        end_hour: match.endHour,
        end_minute: match.endMinute,
        venue: match.venue,
        round: match.round,
        score1_final: match.score1Final,
        score2_final: match.score2Final,
        winning_team_final: match.winningTeamFinal,
        subtitle: match.subtitle || null,
      });

    if (error) {
      console.error('Failed to update match in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase match update error:', err);
    return false;
  }
}

// Fetch Stage Performances from Supabase
export async function getSupabaseStagePerformances(): Promise<StageItem[] | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('stage_performances')
      .select('*')
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('Supabase stage performances fetch warning:', error);
      return null;
    }

    return data.map((row) => ({
      school: row.school,
      clubName: row.club_name,
      genre: row.genre,
      songTitle: row.song_title,
      startHour: Number(row.start_hour),
      startMinute: Number(row.start_minute),
      endHour: Number(row.end_hour),
      endMinute: Number(row.end_minute),
    }));
  } catch (err) {
    console.error('Supabase stage fetch error:', err);
    return null;
  }
}

// Update Stage Performance in Supabase
export async function updateSupabaseStagePerformance(index: number, item: StageItem): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase
      .from('stage_performances')
      .upsert({
        id: index + 1,
        school: item.school,
        club_name: item.clubName,
        genre: item.genre,
        song_title: item.songTitle,
        start_hour: item.startHour,
        start_minute: item.startMinute,
        end_hour: item.endHour,
        end_minute: item.endMinute,
      });

    if (error) {
      console.error('Failed to update stage performance in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase stage update error:', err);
    return false;
  }
}

// Get Admin Password from Supabase
export async function getSupabaseAdminPassword(): Promise<string> {
  if (!supabase) return localAdminPasswordMemory;

  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'admin_password')
      .maybeSingle();

    if (error || !data) return localAdminPasswordMemory;
    return data.value || localAdminPasswordMemory;
  } catch (err) {
    return localAdminPasswordMemory;
  }
}

// Update Admin Password in Supabase
export async function updateSupabaseAdminPassword(newPassword: string): Promise<boolean> {
  localAdminPasswordMemory = newPassword;

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: 'admin_password', value: newPassword });

    if (error) {
      console.error('Failed to update admin password in Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Supabase password update error:', err);
    return false;
  }
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const current = await getSupabaseAdminPassword();
  return password === current;
}

export async function updateAdminPasswordInSupabase(newPassword: string): Promise<boolean> {
  return updateSupabaseAdminPassword(newPassword);
}

// ========== Map Venues & Roads (dedicated tables) ==========

// Fetch all venues from map_venues table
export async function getSupabaseMapVenues(): Promise<VenueNode[]> {
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

    return data.map((row: any) => ({
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
  } catch (err) {
    console.error('[Supabase Map Venues] Exception:', err);
    return [];
  }
}

// Fetch all roads from map_roads table
export async function getSupabaseMapRoads(): Promise<MapEdge[]> {
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

    return data.map((row: any) => ({
      id: row.id,
      fromNodeId: row.from_node_id,
      toNodeId: row.to_node_id,
      weightMinutes: Number(row.weight_minutes),
      waypoints: row.waypoints || [],
    }));
  } catch (err) {
    console.error('[Supabase Map Roads] Exception:', err);
    return [];
  }
}

// Combined fetch for convenience
export async function getSupabaseMapData(): Promise<{ nodes: VenueNode[]; edges: MapEdge[] } | null> {
  const [nodes, edges] = await Promise.all([
    getSupabaseMapVenues(),
    getSupabaseMapRoads(),
  ]);

  if (nodes.length === 0 && edges.length === 0) return null;
  return { nodes, edges };
}

// Upsert a single venue
export async function upsertMapVenue(node: VenueNode): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase
      .from('map_venues')
      .upsert({
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
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Delete a venue
export async function deleteMapVenue(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase
      .from('map_venues')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase Venue Delete]', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Upsert a single road
export async function upsertMapRoad(edge: MapEdge): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase
      .from('map_roads')
      .upsert({
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
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Delete a road
export async function deleteMapRoad(id: string): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    const { error } = await supabase
      .from('map_roads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase Road Delete]', error);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// Bulk reset: delete all & re-insert defaults
export async function resetMapToDefaults(
  defaultNodes: VenueNode[],
  defaultEdges: MapEdge[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };

  try {
    // Delete all roads first (FK constraint)
    const { error: delRoads } = await supabase.from('map_roads').delete().neq('id', '');
    if (delRoads) return { success: false, error: delRoads.message };

    // Delete all venues
    const { error: delVenues } = await supabase.from('map_venues').delete().neq('id', '');
    if (delVenues) return { success: false, error: delVenues.message };

    // Re-insert default venues
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

    // Re-insert default roads
    const roadRows = defaultEdges.map((e) => ({
      id: e.id,
      from_node_id: e.fromNodeId,
      to_node_id: e.toNodeId,
      weight_minutes: e.weightMinutes,
      waypoints: e.waypoints || [],
    }));
    const { error: insRoads } = await supabase.from('map_roads').insert(roadRows);
    if (insRoads) return { success: false, error: insRoads.message };

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
