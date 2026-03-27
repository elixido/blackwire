import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

export const supabaseAdmin = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function getStorageObjectUrl(objectPath: string) {
  const signed = await supabaseAdmin.storage
    .from(config.supabaseStorageBucket)
    .createSignedUrl(objectPath, 60 * 60 * 24 * 7);

  if (!signed.error && signed.data?.signedUrl) {
    return signed.data.signedUrl;
  }

  const { data } = supabaseAdmin.storage
    .from(config.supabaseStorageBucket)
    .getPublicUrl(objectPath);

  return data.publicUrl;
}

export function extractStoragePath(value: string | null | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith('data:image/')) {
    return null;
  }

  const publicPrefix = `${config.supabaseUrl}/storage/v1/object/public/${config.supabaseStorageBucket}/`;
  if (trimmed.startsWith(publicPrefix)) {
    return decodeURIComponent(trimmed.slice(publicPrefix.length));
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return null;
  }

  return trimmed;
}
