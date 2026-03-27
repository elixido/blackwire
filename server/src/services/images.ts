import { randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { config } from '../config';
import { fail } from '../lib/errors';
import { extractStoragePath, supabaseAdmin } from '../lib/supabase';

interface DataUrlPayload {
  buffer: Buffer;
}

function decodeDataUrl(value: string): DataUrlPayload {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+)(?:;charset=[^;]+)?(?:;(base64))?,(.*)$/s.exec(
    value
  );

  if (!match) {
    fail(400, 'INVALID_AVATAR', 'Runner avatar must be a valid image upload.');
  }

  const [, , base64Flag, payload] = match;
  const buffer = base64Flag
    ? Buffer.from(payload, 'base64')
    : Buffer.from(decodeURIComponent(payload), 'utf8');

  return { buffer };
}

export async function deleteManagedUpload(value: string | null | undefined) {
  const objectPath = extractStoragePath(value);
  if (!objectPath) {
    return;
  }

  await supabaseAdmin.storage.from(config.supabaseStorageBucket).remove([objectPath]);
}

export async function processAvatarInput(
  value: string,
  previousValue?: string | null
): Promise<string> {
  const trimmed = value.trim();

  if (!trimmed) {
    await deleteManagedUpload(previousValue);
    return '';
  }

  const existingObjectPath = extractStoragePath(trimmed);
  if (existingObjectPath) {
    return existingObjectPath;
  }

  if (!trimmed.startsWith('data:image/')) {
    fail(400, 'INVALID_AVATAR', 'Runner avatar must be a supported image.');
  }

  const { buffer } = decodeDataUrl(trimmed);

  if (buffer.byteLength > config.allowedImageBytes) {
    fail(400, 'AVATAR_TOO_LARGE', 'Runner avatar is too large.');
  }

  const image = sharp(buffer, { limitInputPixels: 12000 * 12000 });
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    fail(400, 'INVALID_AVATAR', 'Runner avatar could not be decoded.');
  }

  const outputBuffer = await image
    .rotate()
    .resize(512, 512, {
      fit: 'cover',
      position: 'attention'
    })
    .webp({ quality: 86 })
    .toBuffer();

  const objectPath = `runner-${randomUUID()}.webp`;
  const { error } = await supabaseAdmin.storage
    .from(config.supabaseStorageBucket)
    .upload(objectPath, outputBuffer, {
      contentType: 'image/webp',
      upsert: false
    });

  if (error) {
    fail(500, 'AVATAR_UPLOAD_FAILED', 'Runner avatar upload failed.');
  }

  await deleteManagedUpload(previousValue);
  return objectPath;
}
