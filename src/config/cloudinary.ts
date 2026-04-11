/**
 * Cloudinary Configuration
 * 
 * SECURITY NOTE:
 * - Cloud name and upload preset are safe to expose client-side
 * - API Key and Secret should ONLY be used server-side (Cloud Functions)
 */

export const CLOUDINARY_CONFIG = {
  cloudName: process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? 'dp3p3jdqk',
  uploadPreset: process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? 'bilu_store_unsigned',
};

export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

export const CLOUDINARY_FOLDERS = {
  ADS: 'bilu-store/ads',
  PROFILES: 'bilu-store/profiles',
  CHAT: 'bilu-store/chat',
} as const;

export const CLOUDINARY_TRANSFORMATIONS = {
  THUMBNAIL: 'c_fill,w_200,h_200,q_auto,f_auto',
  MEDIUM: 'c_limit,w_800,h_800,q_auto,f_auto',
  LARGE: 'c_limit,w_1200,h_1200,q_auto,f_auto',
} as const;

/**
 * Generate Cloudinary URL with transformations
 */
export function getCloudinaryUrl(
  publicId: string,
  transformation: keyof typeof CLOUDINARY_TRANSFORMATIONS = 'MEDIUM'
): string {
  const transform = CLOUDINARY_TRANSFORMATIONS[transformation];
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transform}/${publicId}`;
}
