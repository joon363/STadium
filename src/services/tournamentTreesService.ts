import { TournamentTreeData, propagateTournamentTreeWinners } from '../types/tournamentTree';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseAllTournamentTrees(
  _forceRefresh = false
): Promise<Record<string, TournamentTreeData> | null> {
  const result: Record<string, TournamentTreeData> = {};
  for (const [sportKey, rawTree] of Object.entries(ARCHIVED_SNAPSHOT.tournamentTrees)) {
    result[sportKey] = propagateTournamentTreeWinners(rawTree);
  }
  return result;
}

export async function getSupabaseTournamentTree(
  sportKey: string,
  _forceRefresh = false
): Promise<TournamentTreeData | null> {
  const rawTree = ARCHIVED_SNAPSHOT.tournamentTrees[sportKey];
  return rawTree ? propagateTournamentTreeWinners(rawTree) : null;
}

export async function updateSupabaseTournamentTree(
  _sportKey: string,
  _treeData: TournamentTreeData
): Promise<boolean> {
  return true;
}
