import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export {
  getSupabaseAllTournamentTrees,
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

export async function getSupabaseAdminPassword(): Promise<string> {
  return import.meta.env.VITE_ADMIN_PASSWORD || '';
}

export async function updateSupabaseAdminPassword(_newPassword: string): Promise<boolean> {
  return true;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const envPass = import.meta.env.VITE_ADMIN_PASSWORD;
  if (!envPass) {
    return false;
  }
  return password === envPass;
}

export async function updateAdminPasswordInSupabase(_newPassword: string): Promise<boolean> {
  return true;
}

export async function getSupabaseStageDelay(_forceRefresh = false): Promise<number> {
  return ARCHIVED_SNAPSHOT.stageDelayMinutes ?? 0;
}

export async function updateSupabaseStageDelay(_delayMinutes: number): Promise<boolean> {
  return true;
}
