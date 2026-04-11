/**
 * Algolia Configuration
 * 
 * SECURITY NOTE:
 * - App ID and Search API Key are safe to expose client-side
 * - Write API Key should ONLY be used server-side (Cloud Functions)
 */

export const ALGOLIA_CONFIG = {
  appId: process.env.EXPO_PUBLIC_ALGOLIA_APP_ID ?? 'Y7LXEFHXMI',
  searchApiKey: process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_API_KEY ?? 'ca5a76760da8fe09e32b433c88f1fd96',
};

export const ALGOLIA_INDEX_NAME = 'ads';

/**
 * Check if Algolia is configured
 */
export const isAlgoliaConfigured = !!ALGOLIA_CONFIG.appId && !!ALGOLIA_CONFIG.searchApiKey;
