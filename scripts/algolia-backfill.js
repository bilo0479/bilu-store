/**
 * Backfill all ACTIVE ads from Firestore into the Algolia search index.
 * Run once after initial Cloud Functions deployment (or when Algolia index is reset).
 * Run: node scripts/algolia-backfill.js
 *
 * Prerequisites:
 *   - scripts/service-account.json (Firebase service account key)
 *   - ALGOLIA_APP_ID and ALGOLIA_WRITE_API_KEY set in environment or .env file
 *   - npm install firebase-admin algoliasearch dotenv (in scripts or root)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../functions/.env') });
const admin = require('firebase-admin');
const { algoliasearch } = require('algoliasearch');
const path = require('path');
const fs = require('fs');

// Firebase init
const serviceAccountPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS
    ? path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS)
    : path.join(__dirname, 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('ERROR: service account not found at', serviceAccountPath);
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS=<path> or place service-account.json in scripts/');
  process.exit(1);
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(require(serviceAccountPath)) });
}

// Algolia init
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID;
const ALGOLIA_WRITE_API_KEY = process.env.ALGOLIA_WRITE_API_KEY;
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || 'ads';

if (!ALGOLIA_APP_ID || !ALGOLIA_WRITE_API_KEY) {
  console.error('ERROR: ALGOLIA_APP_ID and ALGOLIA_WRITE_API_KEY must be set.');
  console.error('Copy functions/.env.example to functions/.env and fill in your Algolia credentials.');
  process.exit(1);
}

const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_WRITE_API_KEY);
const db = admin.firestore();

const BATCH_SIZE = 100;

function toAlgoliaRecord(id, data) {
  return {
    objectID: id,
    title: data.title ?? '',
    description: data.description ?? '',
    price: data.price ?? 0,
    currency: data.currency ?? 'ETB',
    category: data.category ?? '',
    subcategory: data.subcategory ?? null,
    condition: data.condition ?? null,
    location: data.location ?? '',
    sellerId: data.sellerId ?? '',
    sellerName: data.sellerName ?? '',
    status: data.status ?? 'ACTIVE',
    isPremium: data.isPremium ?? false,
    premiumTier: data.premiumTier ?? null,
    thumbnails: data.thumbnails ?? [],
    createdAt: data.createdAt ?? 0,
    updatedAt: data.updatedAt ?? 0,
    _geoloc: data.coordinates
      ? { lat: data.coordinates.lat, lng: data.coordinates.lng }
      : undefined,
  };
}

async function backfill() {
  console.log(`Fetching ACTIVE ads from Firestore...`);

  const snapshot = await db
    .collection('ads')
    .where('status', '==', 'ACTIVE')
    .get();

  if (snapshot.empty) {
    console.log('No ACTIVE ads found. Nothing to backfill.');
    return;
  }

  console.log(`Found ${snapshot.size} ACTIVE ads. Uploading to Algolia index "${ALGOLIA_INDEX_NAME}"...`);

  const records = snapshot.docs.map((doc) => toAlgoliaRecord(doc.id, doc.data()));

  // Upload in batches
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await algoliaClient.saveObjects({ indexName: ALGOLIA_INDEX_NAME, objects: batch });
    console.log(`  Uploaded batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} records)`);
  }

  console.log(`Done. ${records.length} ads indexed in Algolia.`);
}

backfill()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Backfill failed:', err.message ?? err);
    process.exit(1);
  });
