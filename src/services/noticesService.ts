import { NoticeItem } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseNotices(_forceRefresh = false): Promise<NoticeItem[]> {
  return ARCHIVED_SNAPSHOT.notices;
}

export async function upsertSupabaseNotice(
  _notice: Partial<NoticeItem>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteSupabaseNotice(
  _id: number | string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
