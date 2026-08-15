import { supabase } from './supabase/client';

/**
 * Upload image file to Supabase Storage and return public URL
 */
export async function uploadImageToSupabase(
  file: File,
  bucket: string = 'images'
): Promise<{ url?: string; error?: string }> {
  if (!supabase) return { error: 'Supabase 미설정' };
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      return { error: uploadError.message };
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return { url: data.publicUrl };
  } catch (err: any) {
    return { error: err?.message || String(err) };
  }
}
