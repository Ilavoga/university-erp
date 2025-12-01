import { supabase as defaultSupabase } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const STORAGE_BUCKET = 'housing-images';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file to upload (File object or Blob)
 * @param path The path within the bucket (e.g., 'hostels/block-a/room-101.jpg')
 * @param bucket The storage bucket name (default: 'housing')
 * @param client Optional Supabase client to use (e.g., for server-side admin uploads)
 * @returns The public URL of the uploaded file, or null if upload failed.
 */
export async function uploadImage(
  file: File | Blob,
  path: string,
  bucket: string = STORAGE_BUCKET,
  client?: SupabaseClient
): Promise<string | null> {
  const supabase = client || defaultSupabase;
  try {
    console.log(`[uploadImage] Uploading to bucket: ${bucket}, path: ${path}`);
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error('[uploadImage] Error uploading image:', error);
      throw error; // Throw so we can catch it in the API route
    }

    console.log(`[uploadImage] Upload success, data.path: ${data.path}`);

    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    console.log(`[uploadImage] Public URL: ${publicUrlData.publicUrl}`);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('[uploadImage] Unexpected error uploading image:', error);
    throw error;
  }
}

/**
 * Deletes a file from Supabase Storage.
 * @param path The path within the bucket
 * @param bucket The storage bucket name (default: 'housing')
 */
export async function deleteImage(
  path: string,
  bucket: string = STORAGE_BUCKET
): Promise<boolean> {
  try {
    const { error } = await defaultSupabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Unexpected error deleting image:', error);
    return false;
  }
}

/**
 * Gets the public URL for a file.
 * @param path The path within the bucket
 * @param bucket The storage bucket name (default: 'housing')
 */
export function getImageUrl(path: string, bucket: string = STORAGE_BUCKET): string {
  const { data } = defaultSupabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
