declare const ALGOLIA_INDEX_NAME = "bilu_store_ads";
declare function getAlgoliaClient(): import("algoliasearch").Algoliasearch | null;
export { getAlgoliaClient, ALGOLIA_INDEX_NAME };
