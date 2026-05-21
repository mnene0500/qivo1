import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * @fileOverview Supabase Client for Auth and Storage.
 * Configured using environment variables from Vercel.
 * Uses a resilient initialization pattern to prevent app crashes if variables are missing.
 */

// Validate configuration before attempting to create the client
const isSupabaseConfigured = !!(supabaseUrl && supabaseUrl.startsWith('https://') && supabaseAnonKey);

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    "⚠️ [QIVO Configuration]: Supabase environment variables are missing or invalid. " +
    "Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in Vercel."
  );
}

// Create the client with placeholders if necessary to prevent the "supabaseUrl is required" crash
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : 'https://placeholder-project.supabase.co',
  isSupabaseConfigured ? supabaseAnonKey : 'placeholder-key'
);

/**
 * Helper to upload a base64 image to Supabase Storage.
 * Supports image/jpeg, image/png, etc.
 */
export async function uploadBase64Image(base64: string, bucket: string, path: string): Promise<string> {
  // If not configured, we can't upload. Return the base64 or a local placeholder.
  if (!isSupabaseConfigured) {
    console.error("[Supabase Storage]: Cannot upload. Supabase is not configured.");
    return base64;
  }

  try {
    const matches = base64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
    
    if (!matches || matches.length !== 3) {
      if (base64.startsWith('http')) return base64;
      throw new Error("Invalid base64 format");
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    let finalPath = path;
    if (!path.includes('.')) {
      const ext = mimeType.includes('png') ? 'png' : 'jpg';
      finalPath = `${path}.${ext}`;
    }

    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const { error } = await supabase.storage
      .from(bucket)
      .upload(finalPath, blob, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error("[Supabase Storage Error]:", error.message);
      throw error;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(finalPath);

    return publicUrl;
  } catch (err: any) {
    console.error("Upload process failed:", err.message);
    throw err;
  }
}
