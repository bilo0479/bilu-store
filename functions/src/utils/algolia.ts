import { algoliasearch } from "algoliasearch";

const ALGOLIA_INDEX_NAME = "ads";

function getAlgoliaClient() {
  const appId = process.env.ALGOLIA_APP_ID || "";
  const writeApiKey = process.env.ALGOLIA_WRITE_API_KEY || "";

  if (!appId || !writeApiKey) {
    console.warn(
      "[Algolia] Missing credentials. Set ALGOLIA_APP_ID and ALGOLIA_WRITE_API_KEY in functions/.env"
    );
    return null;
  }

  return algoliasearch(appId, writeApiKey);
}

export { getAlgoliaClient, ALGOLIA_INDEX_NAME };
