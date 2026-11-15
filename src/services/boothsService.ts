import { BoothItem } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseBooths(_forceRefresh = false): Promise<BoothItem[]> {
  return ARCHIVED_SNAPSHOT.booths;
}

export async function upsertSupabaseBooth(
  _booth: Partial<BoothItem>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteSupabaseBooth(
  _id: number | string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
