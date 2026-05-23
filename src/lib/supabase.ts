
import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Secure Supabase Client with Zero NEXT_PUBLIC requirement.
 * On the server: Uses real environment variables.
 * On the client: Routes requests through a secure local API proxy.
 */

const isServer = typeof window === 'undefined';

const getSupabaseConfig = () => {
  if (isServer) {
    // SERVER SIDE: Access real secrets
    return {
      url: process.env.SUPABASE_URL || 'https://placeholder.supabase.co',
      anonKey: process.env.SUPABASE_ANON_KEY || 'placeholder',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder'
    };
  } else {
    // CLIENT SIDE: Use the secure local proxy
    // This hides your real Supabase URL and Key from the browser
    return {
      url: `${window.location.origin}/api/supabase`,
      anonKey: 'proxy-auth-active', // The proxy will inject the real key on the server
      serviceKey: 'proxy-auth-active'
    };
  }
};

const config = getSupabaseConfig();

// Main Client
export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: !isServer ? window.localStorage : undefined
  }
});

// Admin Client (Server Only)
export const getSupabaseAdmin = () => {
  if (!isServer) throw new Error("Admin client can only be used on the server.");
  const cfg = getSupabaseConfig();
  return createClient(cfg.url, cfg.serviceKey, {
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
