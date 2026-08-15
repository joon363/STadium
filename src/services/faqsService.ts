import { FAQItem } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

export async function getSupabaseFAQs(forceRefresh: boolean = false): Promise<FAQItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<FAQItem[]>('faqs');
    if (cached) return cached;
  }

  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('display_order', { ascending: true })
      .order('id', { ascending: true });

    if (error || !data) {
      console.warn('[Supabase FAQs Fetch Error]', error);
      return [];
    }

    const formatted: FAQItem[] = data.map((r: any) => ({
      id: r.id,
      category: r.category || '일반',
      question: r.question,
      answer: r.answer,
      displayOrder: Number(r.display_order || 0),
    }));

    saveToCache('faqs', formatted);
    return formatted;
  } catch (err) {
    console.error('[Supabase FAQs Exception]', err);
    return [];
  }
}

export async function upsertSupabaseFAQ(
  item: FAQItem
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const row: any = {
      category: item.category,
      question: item.question,
      answer: item.answer,
      display_order: item.displayOrder,
    };
    if (item.id) row.id = item.id;

    const { error } = await supabase.from('faqs').upsert(row);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('faqs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteSupabaseFAQ(id: number): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase 미설정' };
  try {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) return { success: false, error: error.message };
    invalidateAppCache('faqs');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}
