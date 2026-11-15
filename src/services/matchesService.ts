import { RawScheduledMatch } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseMatches(_forceRefresh = false): Promise<RawScheduledMatch[] | null> {
  return ARCHIVED_SNAPSHOT.matches;
}

export async function updateSupabaseMatch(
  _matchId: string,
  _updates: Partial<RawScheduledMatch>
): Promise<boolean> {
  return true;
}

export async function syncSupabaseSportMatches(
  _sportKey: string,
  _matchesList: RawScheduledMatch[]
): Promise<boolean> {
  return true;
}

export async function createSupabaseMatch(_match: RawScheduledMatch): Promise<boolean> {
  return true;
}

export async function deleteSupabaseMatch(_matchId: string): Promise<boolean> {
  return true;
}
