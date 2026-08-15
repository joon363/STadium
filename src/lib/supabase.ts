import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RawScheduledMatch, StageItem, VenueNode, MapEdge } from '../config/stadiumConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// ========== App-Wide In-Memory & LocalStorage Caching System ==========
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheMemoryStore: Record<string, CacheEntry<any>> = {};
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000; // 5 Minutes TTL (Fast Instant Cache)

/**
 * 앱 전역 데이터 캐시 파기 함수 (특정 키 또는 전체)
 */
export function invalidateAppCache(key?: string) {
  if (key) {
    delete cacheMemoryStore[key];
    try {
      localStorage.removeItem(`stadium_cache_${key}`);
    } catch {}
  } else {
    Object.keys(cacheMemoryStore).forEach((k) => delete cacheMemoryStore[k]);
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('stadium_cache_')) {
          localStorage.removeItem(k);
        }
      });
    } catch {}
  }
}

function getFromCache<T>(key: string, ttlMs: number = DEFAULT_CACHE_TTL_MS): T | null {
  const now = Date.now();

  // 1. 메모리 캐시 확인
  if (cacheMemoryStore[key]) {
    const entry = cacheMemoryStore[key];
    if (now - entry.timestamp < ttlMs) {
      return entry.data as T;
    }
  }

  // 2. LocalStorage 스토리지 캐시 확인 (새로고침/탭 재진입 시에도 0ms 렌더링)
  try {
    const raw = localStorage.getItem(`stadium_cache_${key}`);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (now - entry.timestamp < ttlMs) {
        cacheMemoryStore[key] = entry;
        return entry.data;
      }
    }
  } catch {}

  return null;
}

function saveToCache<T>(key: string, data: T) {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  cacheMemoryStore[key] = entry;
  try {
    localStorage.setItem(`stadium_cache_${key}`, JSON.stringify(entry));
  } catch {}
}

/**
 * Supabase Storage에 이미지 파일 업로드 후 Public URL 반환
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: string = 'images'
): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase 미설정' };
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err?.message || String(err) };
  }
}

let localAdminPasswordMemory: string = 'stadium2026!';

function rawString(val: any): string {
  return typeof val === 'string' ? val : String(val || '');
}

// Fetch all matches from Supabase (Cached)
export async function getSupabaseMatches(
  forceRefresh: boolean = false
): Promise<RawScheduledMatch[] | null> {
  if (!forceRefresh) {
    const cached = getFromCache<RawScheduledMatch[]>('matches');
    if (cached) return cached;
  }

  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .order('id', { ascending: true });
    if (error || !data || data.length === 0) {
      console.warn('Supabase matches query warning/error:', error);
      return null;
    }

    const formatted: RawScheduledMatch[] = data.map((row) => ({
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

    saveToCache('matches', formatted);
    return formatted;
  } catch (err) {
    console.error('Supabase matches fetch error:', err);
    return null;
  }
}

// Update single match in Supabase
export async function updateSupabaseMatch(match: RawScheduledMatch): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('matches').upsert({
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
    invalidateAppCache('matches');
    return true;
  } catch (err) {
    console.error('Supabase match update error:', err);
    return false;
  }
}

// Fetch Stage Performances from Supabase (Cached)
export async function getSupabaseStagePerformances(
  forceRefresh: boolean = false
): Promise<StageItem[] | null> {
  if (!forceRefresh) {
    const cached = getFromCache<StageItem[]>('stage_performances');
    if (cached) return cached;
  }

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

    const formatted: StageItem[] = data.map((row) => ({
      school: row.school,
      clubName: row.club_name,
      category: row.category || row.genre || '기타',
      genre: row.genre || '',
      songTitle: row.song_title,
      startHour: Number(row.start_hour),
      startMinute: Number(row.start_minute),
      endHour: Number(row.end_hour),
      endMinute: Number(row.end_minute),
    }));

    saveToCache('stage_performances', formatted);
    return formatted;
  } catch (err) {
    console.error('Supabase stage fetch error:', err);
    return null;
  }
}

// Update Stage Performance in Supabase
export async function updateSupabaseStagePerformance(
  index: number,
  item: StageItem
): Promise<boolean> {
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('stage_performances').upsert({
      id: index + 1,
      school: item.school,
      club_name: item.clubName,
      category: item.category || '기타',
      genre: item.genre || '',
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
    invalidateAppCache('stage_performances');
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

// ========== Map Venues & Roads (Cached) ==========

// Fetch all venues from map_venues table
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

// Fetch all roads from map_roads table
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

// Combined fetch for convenience
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

// Upsert a single venue
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

// Delete a venue
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

// Upsert a single road
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

// Delete a road
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

    invalidateAppCache('map_venues');
    invalidateAppCache('map_roads');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ========== Booth, Sponsor, Food Truck Interfaces & Supabase API ==========

export interface BoothItem {
  id: string;
  name: string;
  operator: string;
  location: string;
  category: string;
  description: string;
  operatingHours: string;
  icon: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

export interface SponsorItem {
  id: string;
  name: string;
  tier: 'main' | 'platinum' | 'gold' | 'silver' | 'bronze' | string;
  logoUrl: string;
  description: string;
  websiteUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export interface FoodTruckItem {
  id: string;
  name: string;
  menuSummary: string;
  location: string;
  operatingHours: string;
  icon: string;
  imageUrl?: string;
  isActive: boolean;
  displayOrder: number;
}

// ----- Booths API (Cached) -----
export async function getSupabaseBooths(forceRefresh: boolean = false): Promise<BoothItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<BoothItem[]>('booths');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('booths')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase Booths Fetch Error]', error);
      return [];
    }

    const formatted: BoothItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      operator: r.operator || '',
      location: r.location || '',
      category: r.category || 'experience',
      description: r.description || '',
      operatingHours: r.operating_hours || '',
      icon: r.icon || '🎪',
      imageUrl: r.image_url || '',
      isActive: r.is_active ?? true,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('booths', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Booths Exception]', err);
    return [];
  }
}

export async function upsertSupabaseBooth(
  item: BoothItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('booths').upsert({
      id: item.id,
      name: item.name,
      operator: item.operator,
      location: item.location,
      category: item.category,
      description: item.description,
      operating_hours: item.operatingHours,
      icon: item.icon,
      image_url: item.imageUrl || '',
      is_active: item.isActive,
      display_order: item.displayOrder,
    });
    if (error) return { success: false, error: error.message };
    invalidateAppCache('booths');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseBooth(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('booths').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('booths');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ----- Sponsors API (Cached) -----
export async function getSupabaseSponsors(forceRefresh: boolean = false): Promise<SponsorItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<SponsorItem[]>('sponsors');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('sponsors')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase Sponsors Fetch Error]', error);
      return [];
    }

    const formatted: SponsorItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      tier: r.tier || 'gold',
      logoUrl: r.logo_url || '',
      description: r.description || '',
      websiteUrl: r.website_url || '',
      isActive: r.is_active ?? true,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('sponsors', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Sponsors Exception]', err);
    return [];
  }
}

export async function upsertSupabaseSponsor(
  item: SponsorItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('sponsors').upsert({
      id: item.id,
      name: item.name,
      tier: item.tier,
      logo_url: item.logoUrl || '',
      description: item.description || '',
      website_url: item.websiteUrl || '',
      is_active: item.isActive,
      display_order: item.displayOrder,
    });
    if (error) return { success: false, error: error.message };
    invalidateAppCache('sponsors');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseSponsor(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('sponsors').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('sponsors');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ----- Food Trucks API (Cached) -----
export async function getSupabaseFoodTrucks(
  forceRefresh: boolean = false
): Promise<FoodTruckItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<FoodTruckItem[]>('food_trucks');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('food_trucks')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase FoodTrucks Fetch Error]', error);
      return [];
    }

    const formatted: FoodTruckItem[] = data.map((r: any) => ({
      id: r.id,
      name: r.name,
      menuSummary: r.menu_summary || '',
      location: r.location || '',
      operatingHours: r.operating_hours || '',
      icon: r.icon || '🚚',
      imageUrl: r.image_url || '',
      isActive: r.is_active ?? true,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('food_trucks', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase FoodTrucks Exception]', err);
    return [];
  }
}

export async function upsertSupabaseFoodTruck(
  item: FoodTruckItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('food_trucks').upsert({
      id: item.id,
      name: item.name,
      menu_summary: item.menuSummary,
      location: item.location,
      operating_hours: item.operatingHours,
      icon: item.icon,
      image_url: item.imageUrl || '',
      is_active: item.isActive,
      display_order: item.displayOrder,
    });
    if (error) return { success: false, error: error.message };
    invalidateAppCache('food_trucks');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseFoodTruck(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('food_trucks').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('food_trucks');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ========== Notices & FAQs Interfaces & Supabase API (Cached) ==========

export interface NoticeItem {
  id?: number;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt?: string;
}

export interface FAQItem {
  id?: number;
  category: string;
  question: string;
  answer: string;
  displayOrder: number;
}

// ----- Notices API (Cached) -----
export async function getSupabaseNotices(forceRefresh: boolean = false): Promise<NoticeItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<NoticeItem[]>('notices');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('id', { ascending: false });

    if (error || !data) {
      console.warn('[Supabase Notices Fetch Error]', error);
      return [];
    }

    const formatted: NoticeItem[] = data.map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      isPinned: r.is_pinned ?? false,
      createdAt: r.created_at,
    }));

    saveToCache('notices', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase Notices Exception]', err);
    return [];
  }
}

export async function upsertSupabaseNotice(
  item: NoticeItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const row: any = {
      title: item.title,
      content: item.content,
      is_pinned: item.isPinned,
    };
    if (item.id) row.id = item.id;

    const { error } = await supabase.from('notices').upsert(row);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('notices');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseNotice(
  id: number
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('notices');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// ----- FAQs API (Cached) -----
export async function getSupabaseFAQs(forceRefresh: boolean = false): Promise<FAQItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<FAQItem[]>('faqs');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('display_order', { ascending: true })
      .order('id', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase FAQs Fetch Error]', error);
      return [];
    }

    const formatted: FAQItem[] = data.map((r: any) => ({
      id: r.id,
      category: r.category || '일반',
      question: r.question,
      answer: r.answer,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('faqs', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase FAQs Exception]', err);
    return [];
  }
}

export async function upsertSupabaseFAQ(
  item: FAQItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const row: any = {
      category: item.category,
      question: item.question,
      answer: item.answer,
      display_order: item.displayOrder,
    };
    if (item.id) row.id = item.id;

    const { error } = await supabase.from('faqs').upsert(row);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('faqs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseFAQ(id: number): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('faqs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Supabase Postgres Changes Realtime WebSocket 구독 (폴링 부하 0화)
 */
export function subscribeToRealtimeTables(
  tables: string[],
  onUpdate: (table: string, payload: any) => void
): () => void {
  if (!supabase) return () => {};

  const channel = supabase
    .channel('public-schedule-realtime')
    .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
      if (tables.includes(payload.table)) {
        invalidateAppCache(payload.table);
        onUpdate(payload.table, payload);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
