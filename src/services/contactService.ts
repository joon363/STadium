import { ContactItem, ContactLinkItem, ContactConfig } from '../types/stadium';
import { supabase } from './supabase/client';
import { getFromCache, saveToCache, invalidateAppCache } from './supabase/cache';

const CACHE_KEY_CONTACTS = 'contacts';
const CACHE_KEY_LINKS = 'contact_links';

/**
 * Fetch all normalized Contacts from Supabase
 */
export async function getSupabaseContacts(forceRefresh = false): Promise<ContactItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<ContactItem[]>(CACHE_KEY_CONTACTS);
    if (cached) return cached;
  }

  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('category', { ascending: true })
      .order('display_order', { ascending: true });

    if (error || !data) {
      console.warn('getSupabaseContacts error:', error);
      return [];
    }

    const items: ContactItem[] = data.map((row) => ({
      id: row.id,
      category: row.category,
      role: row.role,
      name: row.name,
      phone: row.phone,
      dept: row.dept,
      displayOrder: row.display_order ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    saveToCache(CACHE_KEY_CONTACTS, items);
    return items;
  } catch (err) {
    console.warn('getSupabaseContacts error:', err);
    return [];
  }
}

/**
 * Insert or Update Contact in Supabase
 */
export async function upsertSupabaseContact(contact: Partial<ContactItem>): Promise<ContactItem | null> {
  if (!supabase) return null;

  try {
    const payload = {
      category: contact.category || 'general',
      role: contact.role || '',
      name: contact.name || '',
      phone: contact.phone || '',
      dept: contact.dept || '',
      display_order: contact.displayOrder ?? 0,
      updated_at: new Date().toISOString(),
    };

    let res;
    if (contact.id) {
      res = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', contact.id)
        .select()
        .single();
    } else {
      res = await supabase
        .from('contacts')
        .insert(payload)
        .select()
        .single();
    }

    if (res.error || !res.data) {
      console.error('upsertSupabaseContact error:', res.error);
      return null;
    }

    invalidateAppCache(CACHE_KEY_CONTACTS);
    return {
      id: res.data.id,
      category: res.data.category,
      role: res.data.role,
      name: res.data.name,
      phone: res.data.phone,
      dept: res.data.dept,
      displayOrder: res.data.display_order,
      createdAt: res.data.created_at,
      updatedAt: res.data.updated_at,
    };
  } catch (err) {
    console.error('upsertSupabaseContact error:', err);
    return null;
  }
}

/**
 * Delete Contact from Supabase
 */
export async function deleteSupabaseContact(id: number): Promise<boolean> {
  if (!supabase) return true;

  try {
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) {
      console.error('deleteSupabaseContact error:', error);
      return false;
    }
    invalidateAppCache(CACHE_KEY_CONTACTS);
    return true;
  } catch (err) {
    console.error('deleteSupabaseContact error:', err);
    return false;
  }
}

/**
 * Fetch all normalized Contact Links from Supabase
 */
export async function getSupabaseContactLinks(forceRefresh = false): Promise<ContactLinkItem[]> {
  if (!forceRefresh) {
    const cached = getFromCache<ContactLinkItem[]>(CACHE_KEY_LINKS);
    if (cached) return cached;
  }

  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('contact_links')
      .select('*')
      .order('display_order', { ascending: true });

    if (error || !data) {
      console.warn('getSupabaseContactLinks error:', error);
      return [];
    }

    const items: ContactLinkItem[] = data.map((row) => ({
      id: row.id,
      title: row.title,
      url: row.url,
      icon: row.icon || 'link',
      displayOrder: row.display_order ?? 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    saveToCache(CACHE_KEY_LINKS, items);
    return items;
  } catch (err) {
    console.warn('getSupabaseContactLinks error:', err);
    return [];
  }
}

/**
 * Insert or Update Contact Link in Supabase
 */
export async function upsertSupabaseContactLink(link: ContactLinkItem): Promise<boolean> {
  if (!supabase) return true;

  try {
    const { error } = await supabase.from('contact_links').upsert({
      id: link.id,
      title: link.title,
      url: link.url,
      icon: link.icon || 'link',
      display_order: link.displayOrder ?? 0,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error('upsertSupabaseContactLink error:', error);
      return false;
    }

    invalidateAppCache(CACHE_KEY_LINKS);
    return true;
  } catch (err) {
    console.error('upsertSupabaseContactLink error:', err);
    return false;
  }
}

/**
 * Helper to fetch aggregated ContactConfig for UI views
 */
export async function getSupabaseContactConfig(forceRefresh = false): Promise<ContactConfig> {
  const [contacts, links] = await Promise.all([
    getSupabaseContacts(forceRefresh),
    getSupabaseContactLinks(forceRefresh),
  ]);

  const generalLeaders = contacts
    .filter((c) => c.category === 'general')
    .map((c) => ({ role: c.role, name: c.name, phone: c.phone, dept: c.dept }));

  const deptLeads = contacts
    .filter((c) => c.category === 'dept')
    .map((c) => ({ role: c.role, name: c.name, phone: c.phone, dept: c.dept }));

  const kakaoLink = links.find((l) => l.id === 'kakao')?.url || 'https://open.kakao.com/o/stadium2026';
  const instaLink = links.find((l) => l.id === 'instagram')?.url || 'https://instagram.com/postech_stadium';
  const ytLink = links.find((l) => l.id === 'youtube')?.url || 'https://youtube.com/@stadium_official';

  return {
    generalLeaders,
    deptLeads,
    links: {
      kakaoOpenChat: kakaoLink,
      instagram: instaLink,
      youtube: ytLink,
    },
  };
}
