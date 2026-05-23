
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Private Supabase Client.
 * All NEXT_PUBLIC_ prefixes removed. 
 * This client is designed for use in Server Actions and Route Handlers.
 */

const getSupabaseConfig = () => {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Fallback for build time safety
  return {
    url: url || 'https://placeholder.supabase.co',
    anonKey: anonKey || 'placeholder',
    serviceKey: serviceKey || 'placeholder'
  };
};

// Standard client using private env vars
export const supabase = createClient(
  getSupabaseConfig().url, 
  getSupabaseConfig().anonKey,
  {
    auth: {
      persistSession: false // Server-side environment
    }
  }
);

// Admin Client for critical financial/admin tasks
export const getSupabaseAdmin = () => {
  const config = getSupabaseConfig();
  return createClient(config.url, config.serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};

export function base64ToBlob(base64: string): { blob: Blob, contentType: string } {
  const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image string format.");
  }

  const contentType = matches[1];
  const b64Data = matches[2];
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return { 
    blob: new Blob(byteArrays, { type: contentType }),
    contentType 
  };
}

export async function uploadProfilePhoto(file: File | Blob, userId: string) {
  const admin = getSupabaseAdmin();
  const timestamp = Date.now();
  const filePath = `${userId}/${timestamp}.jpg`;
  const { error } = await admin.storage.from('photos').upload(filePath, file, { cacheControl: '0', upsert: true });
  if (error) throw error;
  const { data } = admin.storage.from('photos').getPublicUrl(filePath);
  return data.publicUrl;
}

export async function uploadPostPhoto(file: File | Blob, userId: string, bucket = 'photos') {
  const admin = getSupabaseAdmin();
  const timestamp = Date.now();
  const uuid = crypto.randomUUID();
  const filePath = `${userId}/gallery-${timestamp}-${uuid}.jpg`;
  const { error } = await admin.storage.from(bucket).upload(filePath, file, { cacheControl: '0', upsert: true });
  if (error) throw error;
  const { data } = admin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
