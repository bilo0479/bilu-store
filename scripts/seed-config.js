/**
 * Seed Firestore config/premiumTiers document with initial premium tier pricing.
 * Run once after Firebase setup: node scripts/seed-config.js
 *
 * Prerequisites:
 *   - Copy .env to scripts/.env or set FIREBASE_PROJECT_ID in environment
 *   - Run: npm install firebase-admin (in root or use functions node_modules)
 *   - Download service account key from Firebase Console → Project Settings → Service Accounts
 *     and save as scripts/service-account.json (never commit this file)
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'service-account.json');
if (!fs.existsSync(serviceAccountPath)) {
  console.error('ERROR: scripts/service-account.json not found.');
  console.error('Download your service account key from Firebase Console →');
  console.error('Project Settings → Service Accounts → Generate New Private Key');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const PREMIUM_TIERS = {
  tiers: [
    {
      id: 'BASIC',
      name: 'Basic Boost',
      description: 'Highlighted listing in category results',
      price: 50,
      currency: 'ETB',
      durationDays: 7,
      features: ['Highlighted border', 'Category boost'],
    },
    {
      id: 'STANDARD',
      name: 'Standard Boost',
      description: 'Top placement in category + home feed',
      price: 150,
      currency: 'ETB',
      durationDays: 14,
      features: ['Top category placement', 'Home feed feature', 'Highlighted border'],
    },
    {
      id: 'PREMIUM',
      name: 'Premium Boost',
      description: 'Spotlight placement across all feeds',
      price: 300,
      currency: 'ETB',
      durationDays: 30,
      features: ['Spotlight placement', 'All feeds feature', 'Premium badge', 'Priority search'],
    },
    {
      id: 'FEATURED',
      name: 'Featured Listing',
      description: 'Top banner placement on home screen',
      price: 500,
      currency: 'ETB',
      durationDays: 30,
      features: ['Home screen banner', 'All premium features', 'Dedicated promotion'],
    },
  ],
  updatedAt: admin.firestore.FieldValue.serverTimestamp(),
};

async function seedPremiumTiers() {
  console.log('Seeding config/premiumTiers...');
  await db.collection('config').doc('premiumTiers').set(PREMIUM_TIERS, { merge: true });
  console.log('Done. Premium tiers configured:');
  PREMIUM_TIERS.tiers.forEach((t) => {
    console.log(`  ${t.id}: ${t.price} ${t.currency} / ${t.durationDays} days`);
  });
}

seedPremiumTiers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });
