import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';
export {
  getSupabaseTournamentTree,
  updateSupabaseTournamentTree,
} from './tournamentTreesService';
export {
  getSupabaseYoutubeLiveList,
  getSupabaseYoutubeLiveByKey,
  upsertSupabaseYoutubeLive,
  deleteSupabaseYoutubeLive,
  getSupabaseYoutubeLiveUrl,
  updateSupabaseYoutubeLiveUrl,
} from './youtubeLiveService';

let localStageDelayMemory = 0;

// ----- Admin Password (Strictly from Vercel Environment Variable) -----
export async function getSupabaseAdminPassword(): Promise<string> {
  return import.meta.env.VITE_ADMIN_PASSWORD || '';
}

export async function updateSupabaseAdminPassword(_newPassword: string): Promise<boolean> {
  return true;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const envPass = import.meta.env.VITE_ADMIN_PASSWORD;
  if (!envPass) {
    console.error('VITE_ADMIN_PASSWORD is not defined in environment variables.');
    return false;
  }
  return password === envPass;
}

export async function updateAdminPasswordInSupabase(_newPassword: string): Promise<boolean> {
  return true;
}

// ----- Stage Performance Delay (Minutes, Positive / Negative) -----
export async function getSupabaseStageDelay(forceRefresh = false): Promise<number> {
  if (!forceRefresh) {
    const cached = getFromCache<number>('stage_delay_minutes');
    if (cached !== null && cached !== undefined) return cached;
  }

  if (!supabase) return localStageDelayMemory;

  try {
    const { data, error } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'stage_delay_minutes')
      .maybeSingle();

    if (error || !data || data.value === null || data.value === undefined) {
      return localStageDelayMemory;
    }
    const delay = Number(data.value) || 0;
    localStageDelayMemory = delay;
    saveToCache('stage_delay_minutes', delay);
    return delay;
  } catch (err) {
    return localStageDelayMemory;
  }
}

export async function updateSupabaseStageDelay(delayMinutes: number): Promise<boolean> {
  localStageDelayMemory = delayMinutes;
  saveToCache('stage_delay_minutes', delayMinutes);

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key: 'stage_delay_minutes', value: String(delayMinutes) });

    if (error) {
      console.error('Failed to update stage delay in Supabase:', error);
      return false;
    }
    invalidateAppCache('stage_delay_minutes');
    return true;
  } catch (err) {
    console.error('Supabase stage delay update error:', err);
    return false;
  }
}

