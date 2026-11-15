import { ContactConfig } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseContactConfig(_forceRefresh = false): Promise<ContactConfig> {
  return ARCHIVED_SNAPSHOT.contactConfig;
}

export async function updateSupabaseContactConfig(_config: ContactConfig): Promise<boolean> {
  return true;
}
