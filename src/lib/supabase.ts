import { createClient } from '@supabase/supabase-js';

/**
 * @fileOverview Central Supabase Client for the browser.
 * Uses placeholders to prevent initialization crashes if environment variables 
 * are not yet set in Vercel/Local environment.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn("⚠️ Supabase credentials missing! The app will not function correctly until NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel Environment Variables.");
}

// Browser Client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * SERVER-SIDE ONLY: Admin client that bypasses RLS.
 * Requires SUPABASE_SERVICE_ROLE_KEY environment variable.
 */
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

/**
 * Helper to upload a base64 image to Supabase Storage.
 */
export async function uploadBase64Image(base64: string, bucket: string, path: string): Promise<string> {
  try {
    const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    if (!matches || matches.length !== 3) {
      if (base64.startsWith('http')) return base64;
      throw new Error("Invalid base64 format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const { error } = await supabase.storage.from(bucket).upload(path, blob, { contentType: mimeType, upsert: true });
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path);
    return publicUrl;
  } catch (err: any) {
    console.error("Upload failed:", err.message);
    throw err;
  }
}
