/**
 * Cloudinary Test Utility
 * Use this to verify your Cloudinary setup is working
 */

import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL } from '@/config/cloudinary';

export async function testCloudinaryConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check if config is set
    if (!CLOUDINARY_CONFIG.cloudName) {
      return {
        success: false,
        message: 'Cloudinary cloud name not configured',
      };
    }

    if (!CLOUDINARY_CONFIG.uploadPreset) {
      return {
        success: false,
        message: 'Cloudinary upload preset not configured',
      };
    }

    // Test with a tiny 1x1 transparent PNG (base64)
    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    const formData = new FormData();
    formData.append('file', testImage);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    formData.append('folder', 'bilu-store/test');

    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: `Upload failed: ${response.status}`,
        details: errorData,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Cloudinary connection successful!',
      details: {
        publicId: data.public_id,
        url: data.secure_url,
        format: data.format,
        width: data.width,
        height: data.height,
      },
    };
  } catch (error) {
    return {
      success: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Validate Cloudinary URL
 */
export function isValidCloudinaryUrl(url: string): boolean {
  return url.includes('res.cloudinary.com') && url.includes(CLOUDINARY_CONFIG.cloudName);
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  if (!isValidCloudinaryUrl(url)) return null;

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]+)?$/);
  return match ? match[1] : null;
}
