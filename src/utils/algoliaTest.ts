/**
 * Algolia Test Utility
 * Use this to verify your Algolia setup is working
 */

import { ALGOLIA_CONFIG, ALGOLIA_INDEX_NAME, isAlgoliaConfigured } from '@/config/algolia';

export async function testAlgoliaConnection(): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> {
  try {
    // Check if config is set
    if (!isAlgoliaConfigured) {
      return {
        success: false,
        message: 'Algolia not configured. Check environment variables.',
      };
    }

    // Test search with empty query
    const response = await fetch(
      `https://${ALGOLIA_CONFIG.appId}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX_NAME}/query`,
      {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': ALGOLIA_CONFIG.appId,
          'X-Algolia-API-Key': ALGOLIA_CONFIG.searchApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '',
          hitsPerPage: 1,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        message: `Algolia API error: ${response.status}`,
        details: errorData,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: 'Algolia connection successful!',
      details: {
        indexName: ALGOLIA_INDEX_NAME,
        totalRecords: data.nbHits || 0,
        processingTimeMs: data.processingTimeMS || 0,
        hasRecords: (data.nbHits || 0) > 0,
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
 * Test search with a query
 */
export async function testAlgoliaSearch(query: string): Promise<{
  success: boolean;
  message: string;
  results?: any[];
}> {
  try {
    if (!isAlgoliaConfigured) {
      return {
        success: false,
        message: 'Algolia not configured',
      };
    }

    const response = await fetch(
      `https://${ALGOLIA_CONFIG.appId}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX_NAME}/query`,
      {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': ALGOLIA_CONFIG.appId,
          'X-Algolia-API-Key': ALGOLIA_CONFIG.searchApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          hitsPerPage: 5,
        }),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `Search failed: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      message: `Found ${data.nbHits || 0} results`,
      results: data.hits || [],
    };
  } catch (error) {
    return {
      success: false,
      message: `Search error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get Algolia index stats
 */
export async function getAlgoliaStats(): Promise<{
  success: boolean;
  stats?: {
    totalRecords: number;
    indexName: string;
    appId: string;
  };
  message: string;
}> {
  try {
    if (!isAlgoliaConfigured) {
      return {
        success: false,
        message: 'Algolia not configured',
      };
    }

    const response = await fetch(
      `https://${ALGOLIA_CONFIG.appId}-dsn.algolia.net/1/indexes/${ALGOLIA_INDEX_NAME}/query`,
      {
        method: 'POST',
        headers: {
          'X-Algolia-Application-Id': ALGOLIA_CONFIG.appId,
          'X-Algolia-API-Key': ALGOLIA_CONFIG.searchApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: '',
          hitsPerPage: 0,
        }),
      }
    );

    if (!response.ok) {
      return {
        success: false,
        message: `Failed to get stats: ${response.status}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      stats: {
        totalRecords: data.nbHits || 0,
        indexName: ALGOLIA_INDEX_NAME,
        appId: ALGOLIA_CONFIG.appId,
      },
      message: 'Stats retrieved successfully',
    };
  } catch (error) {
    return {
      success: false,
      message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
