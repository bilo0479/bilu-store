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
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  } catch (error) {
    // Compression failure is non-fatal: upload original instead
    console.warn('[MediaService] Compression failed, using original:', error);
    return uri;
  }
}

async function uploadOnce(compressedUri: string, folder?: string): Promise<string> {
  const formData = new FormData();
  const filename = compressedUri.split('/').pop() ?? 'image.jpg';

  formData.append('file', {
    uri: compressedUri,
    type: 'image/jpeg',
    name: filename,
  } as unknown as Blob);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  if (folder) formData.append('folder', folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) throw new Error(`Cloudinary upload failed with status ${response.status}`);

  const data = await response.json();
  if (!data.secure_url) throw new Error('Cloudinary response missing secure_url');
  return data.secure_url as string;
}

// Compresses + uploads with one automatic retry
export async function uploadToCloudinary(localUri: string, folder?: string): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) return localUri;

  const compressed = await compressImage(localUri);

  try {
    return await uploadOnce(compressed, folder);
  } catch (firstError) {
    console.warn('[MediaService] Upload failed, retrying:', firstError);
    try {
      return await uploadOnce(compressed, folder);
    } catch {
      throw new Error('Image upload failed after retry. Please try again.');
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

// Cloudinary URL transformations
export function getThumbnailUrl(url: string, width = 400, height = 400): string {
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${width},h_${height},q_auto,f_auto/`);
}

export function getFullSizeUrl(url: string): string {
  if (!url.includes('res.cloudinary.com')) return url;
  return url.replace('/upload/', '/upload/w_1200,q_auto,f_auto/');
}
