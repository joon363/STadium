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
  YouTubeLiveItem,
  ContactItem,
  ContactLinkItem,
  ContactConfig,
  ContactLeader,
} from '../types/stadium';

// Re-export Domain Services
export {
  getSupabaseMatches,
  updateSupabaseMatch,
  syncSupabaseSportMatches,
  deleteSupabaseMatch,
} from '../services/matchesService';
export {
  getSupabaseStagePerformances,
} from '../services/stageService';
export {
  getSupabaseMapData,
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
  getSupabaseYoutubeLiveList,
  getSupabaseYoutubeLiveByKey,
  upsertSupabaseYoutubeLive,
  deleteSupabaseYoutubeLive,
  getSupabaseAllTournamentTrees,
  getSupabaseTournamentTree,
  updateSupabaseTournamentTree,
  getSupabaseStageDelay,
  updateSupabaseStageDelay,
} from '../services/settingsService';
export {
  getSupabaseContactConfig,
} from '../services/contactService';
export { uploadImageToSupabase } from '../services/storageService';
export { subscribeToRealtimeTables } from '../services/realtimeService';

// Frozen no-op stubs for Admin tabs
export const saveAllSupabaseStagePerformances = async (_items: any[]) => true;
export const upsertMapVenue = async (_v: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
export const deleteMapVenue = async (_id: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
export const upsertMapRoad = async (_r: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
export const deleteMapRoad = async (_id: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
export const resetMapToDefaults = async (_v?: any, _r?: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
export const getSupabaseContacts = async (_forceRefresh = false) => [];
export const upsertSupabaseContact = async (_c: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
export const deleteSupabaseContact = async (_id: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
export const getSupabaseContactLinks = async (_forceRefresh = false) => [];
export const upsertSupabaseContactLink = async (_l: any): Promise<{ success: boolean; error?: string }> => ({ success: true });
