import { StageItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

/**
 * Fetch Stage Performances from Supabase (Cached)
 */
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

/**
 * Save all Stage Performances to Supabase (Sync whole list)
 */
export async function saveAllSupabaseStagePerformances(
  items: StageItem[]
): Promise<boolean> {
  if (!supabase) return false;

  try {
    // 1. Delete all existing rows
    const { error: delError } = await supabase
      .from('stage_performances')
      .delete()
      .neq('id', 0);

    if (delError) {
      console.warn('Supabase stage delete warning before bulk insert:', delError);
    }

    // 2. Insert all items with ordered IDs
    if (items.length > 0) {
      const rows = items.map((item, idx) => ({
        id: idx + 1,
        school: item.school,
        club_name: item.clubName,
        category: item.category || '기타',
        genre: item.genre || '',
        song_title: item.songTitle || '',
        start_hour: item.startHour,
        start_minute: item.startMinute,
        end_hour: item.endHour,
        end_minute: item.endMinute,
      }));

      const { error: insertError } = await supabase
        .from('stage_performances')
        .insert(rows);

      if (insertError) {
        console.error('Failed to bulk insert stage performances in Supabase:', insertError);
        return false;
      }
    }

    invalidateAppCache('stage_performances');
    return true;
  } catch (err) {
    console.error('Supabase stage save all error:', err);
    return false;
  }
}

