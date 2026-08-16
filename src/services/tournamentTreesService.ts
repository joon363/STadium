import { SportKey } from '../types/stadium';
import { TournamentTreeData, propagateTournamentTreeWinners } from '../types/tournamentTree';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

/**
 * Fetch Tournament Tree for a specific sport from Supabase `tournament_trees` table
 */
export async function getSupabaseTournamentTree(
  sportKey: string,
  forceRefresh = false
): Promise<TournamentTreeData | null> {
  const cacheKey = `tournament_tree_${sportKey}`;
  if (!forceRefresh) {
    const cached = getFromCache<TournamentTreeData>(cacheKey);
    if (cached) return cached;
  }

  if (!supabase) return null;

  try {
    // 1. Try dedicated `tournament_trees` table first
    const { data, error } = await supabase
      .from('tournament_trees')
      .select('sport_key, nodes, updated_at')
      .eq('sport_key', sportKey)
      .maybeSingle();

    if (!error && data && data.nodes && Object.keys(data.nodes).length > 0) {
      const rawTree: TournamentTreeData = {
        sportKey: data.sport_key as SportKey,
        nodes: data.nodes,
      };
      const tree = propagateTournamentTreeWinners(rawTree);
      saveToCache(cacheKey, tree);
      return tree;
    }

    // 2. Fallback to `admin_settings` if table is during migration
    const { data: legacyData, error: legacyError } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', cacheKey)
      .maybeSingle();

    if (!legacyError && legacyData && legacyData.value) {
      try {
        const parsed = JSON.parse(legacyData.value);
        if (parsed && parsed.nodes && Object.keys(parsed.nodes).length > 0) {
          const tree = propagateTournamentTreeWinners(parsed);
          saveToCache(cacheKey, tree);
          return tree;
        }
      } catch {}
    }

    invalidateAppCache(cacheKey);
    try {
      localStorage.removeItem(cacheKey);
    } catch {}
    return null;
  } catch (err) {
    console.error(`Supabase fetch error for tournament tree (${sportKey}):`, err);
    return null;
  }
}

/**
 * Update Tournament Tree in Supabase `tournament_trees` table
 */
export async function updateSupabaseTournamentTree(
  sportKey: string,
  treeData: TournamentTreeData
): Promise<boolean> {
  const cacheKey = `tournament_tree_${sportKey}`;
  const propagatedTree = propagateTournamentTreeWinners(treeData);
  saveToCache(cacheKey, propagatedTree);
  try {
    localStorage.setItem(cacheKey, JSON.stringify(propagatedTree));
  } catch {}

  if (!supabase) return true;

  try {
    // 1. Upsert into dedicated `tournament_trees` table
    const { error } = await supabase.from('tournament_trees').upsert({
      sport_key: sportKey,
      nodes: propagatedTree.nodes || {},
      updated_at: new Date().toISOString(),
    });

    if (error) {
      // If table doesn't exist yet, fallback to admin_settings
      console.warn('Upsert to tournament_trees failed, trying admin_settings fallback:', error);
      const { error: legacyError } = await supabase.from('admin_settings').upsert({
        key: cacheKey,
        value: JSON.stringify(treeData),
      });
      if (legacyError) {
        console.error('Failed to update tournament tree in admin_settings:', legacyError);
        return false;
      }
    }

    invalidateAppCache(cacheKey);
    return true;
  } catch (err) {
    console.error(`Supabase update error for tournament tree (${sportKey}):`, err);
    return false;
  }
}
