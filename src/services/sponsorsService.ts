import { SponsorItem } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export const DEFAULT_FIXED_SPONSORS: SponsorItem[] = ARCHIVED_SNAPSHOT.sponsors;

export async function getSupabaseSponsors(_forceRefresh = false): Promise<SponsorItem[]> {
  return ARCHIVED_SNAPSHOT.sponsors;
}

export async function upsertSupabaseSponsor(
  _sponsor: Partial<SponsorItem>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteSupabaseSponsor(
  _id: number | string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
