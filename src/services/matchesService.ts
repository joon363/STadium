import { MatchResultType, RawScheduledMatch } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

function rawString(val: any): string {
  return typeof val === 'string' ? val : String(val || '');
}

/**
 * Fetch all scheduled matches
 * Uses standard cache TTL and only refreshes on initial load or explicit refresh
 */
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
      .order('start_hour', { ascending: true })
      .order('start_minute', { ascending: true })
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      if (error) console.warn('Supabase matches query error:', error);
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
      isConfirmed: Boolean(row.is_confirmed),
      resultType: (row.result_type as MatchResultType) || 'normal',
    }));

    saveToCache('matches', formatted);
    return formatted;
  } catch (err) {
    console.error('Supabase matches fetch error:', err);
    return null;
  }
}

/**
 * Upsert a match in Supabase
 */
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
      is_confirmed: Boolean(match.isConfirmed),
      result_type: match.resultType || 'normal',
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

/**
 * Synchronize all matches for a sportKey in a single bulk operation (deleting orphaned match IDs)
 */
export async function syncSupabaseSportMatches(
  sportKey: string,
  matches: RawScheduledMatch[]
): Promise<boolean> {
  if (!supabase) return true;

  try {
    const { data: existingRows } = await supabase
      .from('matches')
      .select('id')
      .eq('sport_key', sportKey);

    const nextIds = new Set(matches.map((m) => m.id));
    const orphanIds = (existingRows || [])
      .map((r: { id: string }) => r.id)
      .filter((id: string) => !nextIds.has(id));

    if (orphanIds.length > 0) {
      await supabase.from('matches').delete().in('id', orphanIds);
    }

    if (matches.length > 0) {
      const payload = matches.map((match) => ({
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
        winning_team_final: match.winningTeamFinal ?? null,
        subtitle: match.subtitle || null,
        is_confirmed: Boolean(match.isConfirmed),
        result_type: match.resultType || 'normal',
      }));

      const { error } = await supabase.from('matches').upsert(payload);
      if (error) {
        console.error(`Failed to bulk sync matches for ${sportKey}:`, error);
        return false;
      }
    }

    invalidateAppCache('matches');
    return true;
  } catch (err) {
    console.error(`Supabase bulk match sync error (${sportKey}):`, err);
    return false;
  }
}

/**
 * Delete a match in Supabase
 */
export async function deleteSupabaseMatch(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    invalidateAppCache('matches');
    return { success: true };
  }

  try {
    const { error } = await supabase.from('matches').delete().eq('id', id);
    if (error) throw error;
    invalidateAppCache('matches');
    return { success: true };
  } catch (err: any) {
    console.error('Failed to delete match in Supabase:', err);
    return { success: false, error: err.message };
  }
}

