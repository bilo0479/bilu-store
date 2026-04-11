"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALGOLIA_INDEX_NAME = void 0;
exports.getAlgoliaClient = getAlgoliaClient;
const algoliasearch_1 = require("algoliasearch");
const ALGOLIA_INDEX_NAME = "bilu_store_ads";
exports.ALGOLIA_INDEX_NAME = ALGOLIA_INDEX_NAME;
function getAlgoliaClient() {
    const appId = process.env.ALGOLIA_APP_ID || "";
    const writeApiKey = process.env.ALGOLIA_WRITE_API_KEY || "";
    if (!appId || !writeApiKey) {
        console.warn("[Algolia] Missing credentials. Set ALGOLIA_APP_ID and ALGOLIA_WRITE_API_KEY in functions/.env");
        return null;
    }
    return (0, algoliasearch_1.algoliasearch)(appId, writeApiKey);
}
//# sourceMappingURL=algolia.js.map