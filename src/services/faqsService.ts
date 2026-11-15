import { FAQItem } from '../types/stadium';
import { ARCHIVED_SNAPSHOT } from '../data/archivedSnapshot';

export async function getSupabaseFAQs(_forceRefresh = false): Promise<FAQItem[]> {
  return ARCHIVED_SNAPSHOT.faqs;
}

export async function upsertSupabaseFAQ(
  _faq: Partial<FAQItem>
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}

export async function deleteSupabaseFAQ(
  _id: number | string
): Promise<{ success: boolean; error?: string }> {
  return { success: true };
}
