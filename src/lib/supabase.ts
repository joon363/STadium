// Re-export Supabase Client & Cache
export { supabase, isSupabaseConfigured } from '../services/supabase/client';
export { invalidateAppCache, getFromCache, saveToCache } from '../services/supabase/cache';

// Re-export Data Models for backward compatibility
export type {
  BoothItem,
  SponsorItem,
  FoodTruckItem,
  NoticeItem,
  FAQItem,
  VenueNode,
  MapEdge,
  RawScheduledMatch,
  StageItem,
} from '../types/stadium';

// Re-export Domain Services
export { getSupabaseMatches, updateSupabaseMatch } from '../services/matchesService';
export {
  getSupabaseStagePerformances,
  updateSupabaseStagePerformance,
} from '../services/stageService';
export {
  getSupabaseMapVenues,
  getSupabaseMapRoads,
  getSupabaseMapData,
  upsertMapVenue,
  deleteMapVenue,
  upsertMapRoad,
  deleteMapRoad,
  resetMapToDefaults,
} from '../services/mapService';
export {
  getSupabaseBooths,
  upsertSupabaseBooth,
  deleteSupabaseBooth,
} from '../services/boothsService';
export {
  getSupabaseFoodTrucks,
  upsertSupabaseFoodTruck,
  deleteSupabaseFoodTruck,
} from '../services/foodTrucksService';
export {
  getSupabaseSponsors,
  upsertSupabaseSponsor,
  deleteSupabaseSponsor,
} from '../services/sponsorsService';
export {
  getSupabaseNotices,
  upsertSupabaseNotice,
  deleteSupabaseNotice,
} from '../services/noticesService';
export {
  getSupabaseFAQs,
  upsertSupabaseFAQ,
  deleteSupabaseFAQ,
} from '../services/faqsService';
export {
  getSupabaseAdminPassword,
  updateSupabaseAdminPassword,
  verifyAdminPassword,
  updateAdminPasswordInSupabase,
  getSupabaseYoutubeLiveUrl,
  updateSupabaseYoutubeLiveUrl,
  getSupabaseTournamentTree,
  updateSupabaseTournamentTree,
} from '../services/settingsService';
export { uploadImageToSupabase } from '../services/storageService';
export { subscribeToRealtimeTables } from '../services/realtimeService';
