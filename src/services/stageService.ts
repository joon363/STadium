import { StageItem } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseStagePerformances(
  _forceRefresh = false
): Promise<StageItem[] | null> {
  return ARCHIVED_SNAPSHOT.stagePerformances;
}

export async function updateSupabaseStagePerformances(_items: StageItem[]): Promise<boolean> {
  return true;
}
