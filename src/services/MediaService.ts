import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? '';
const CLOUDINARY_UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? '';

export async function pickImages(maxCount: number = 5): Promise<string[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: maxCount,
    quality: 0.8,
  });
  if (result.canceled) return [];
  return result.assets.map(a => a.uri);
}

export async function takePhoto(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}

export async function compressImage(uri: string): Promise<string> {
  try {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  } catch (error) {
    console.warn('[MediaService] Compression failed, using original:', error);
    return uri;
  }
}

/**
 * Derives a safe filename + MIME type from a URI.
 * After ImageManipulator the URI is always a file:// .jpg path.
 * If compression was skipped (content:// or exotic URI), we still produce a valid name.
 */
function fileMetaFromUri(uri: string): { name: string; type: string } {
  // Strip query-string / fragment that content:// URIs sometimes carry
  const clean = uri.split('?')[0].split('#')[0];
  const raw = clean.split('/').pop() ?? 'image';

  const ext = raw.includes('.') ? raw.split('.').pop()!.toLowerCase() : 'jpg';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    heic: 'image/heic',
    heif: 'image/heif',
  };

  const mime = mimeMap[ext] ?? 'image/jpeg';
  // Always give it a proper extension so Cloudinary recognises the format
  const name = raw.includes('.') ? raw : `image.jpg`;

  return { name, type: mime };
}

async function uploadOnce(uri: string, folder?: string): Promise<string> {
  const { name, type } = fileMetaFromUri(uri);

  const formData = new FormData();
  formData.append('file', { uri, type, name } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) formData.append('folder', folder);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const response = await fetch(endpoint, { method: 'POST', body: formData });

  if (!response.ok) {
    // Read the body so we surface Cloudinary's actual error message in logs
    let body = '';
    try { body = await response.text(); } catch { /* ignore */ }

    let hint = '';
    if (response.status === 400) {
      if (body.includes('upload_preset')) {
        hint = ' — upload preset not found or not set to "Unsigned". Check Cloudinary Console → Settings → Upload Presets.';
      } else if (body.includes('cloud_name') || body.includes('Invalid')) {
        hint = ` — invalid cloud_name "${CLOUDINARY_CLOUD_NAME}". Verify EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME.`;
      }
    }

    console.error(`[MediaService] Cloudinary ${response.status}${hint}\nBody: ${body.slice(0, 400)}`);
    throw new Error(`Cloudinary upload failed (${response.status})${hint}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (typeof data.secure_url !== 'string') {
    throw new Error('Cloudinary response missing secure_url');
  }
  return data.secure_url;
}

/**
 * Compresses and uploads with one automatic retry.
 * Returns the original local URI if Cloudinary is not configured (dev fallback).
 */
export async function uploadToCloudinary(localUri: string, folder?: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    console.warn(
      '[MediaService] Cloudinary not configured — returning local URI.\n' +
      'Set EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME and EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env'
    );
    return localUri;
  }

  const compressed = await compressImage(localUri);

  try {
    return await uploadOnce(compressed, folder);
  } catch (firstError) {
    console.warn('[MediaService] Upload failed, retrying once:', (firstError as Error).message);
    try {
      return await uploadOnce(compressed, folder);
    } catch (secondError) {
      const msg = (secondError as Error).message;
      console.error('[MediaService] Upload failed after retry:', msg);
      throw new Error(`Image upload failed: ${msg}`);
    }
  }
}

export function uploadImages(uris: string[]): Promise<string[]> {
  return Promise.all(uris.map((uri) => uploadToCloudinary(uri)));
}

export function uploadAdImages(adId: string, localUris: string[]): Promise<string[]> {
  return Promise.all(localUris.map((uri) => uploadToCloudinary(uri, `bilu-store/ads/${adId}`)));
}

export function uploadChatImage(chatId: string, localUri: string): Promise<string> {
  return uploadToCloudinary(localUri, `bilu-store/chats/${chatId}`);
}

export function uploadAvatar(userId: string, localUri: string): Promise<string> {
  return uploadToCloudinary(localUri, `bilu-store/avatars/${userId}`);
}

// ── Cloudinary URL transformations ────────────────────────────────────────────

export function getThumbnailUrl(url: string, width = 400, height = 400): string {
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`);
}

export function getFullSizeUrl(url: string): string {
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_1200,q_auto,f_auto/');
}
