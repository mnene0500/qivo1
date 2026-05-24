
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Optimized Supabase Client.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co', 
  supabaseAnonKey || 'placeholder-anon-key', 
  {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' },
    global: { headers: { 'x-application-name': 'qivo' } },
    db: { schema: 'public' }
  }
);

export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') throw new Error("Admin client restricted to server");
  const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!adminUrl || !serviceKey) throw new Error("Missing Admin Credentials");
  return createClient(adminUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
};

export function base64ToBlob(base64: string): { blob: Blob, contentType: string } {
  const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!matches || matches.length !== 3) throw new Error("Invalid format");
  const contentType = matches[1];
  const byteCharacters = atob(matches[2]);
  const byteArrays = [];
  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return { blob: new Blob(byteArrays, { type: contentType }), contentType };
}

export async function uploadProfilePhoto(file: File | Blob, userId: string) {
  const filePath = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from('photos').upload(filePath, file, { cacheControl: '0', upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from('photos').getPublicUrl(filePath).data.publicUrl;
}

export async function uploadPostPhoto(file: File | Blob, userId: string, bucket = 'photos') {
  const filePath = `${userId}/post-${crypto.randomUUID()}.jpg`;
  const { error } = await supabase.storage.from(bucket).upload(filePath, file, { cacheControl: '0', upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(filePath).data.publicUrl;
}
