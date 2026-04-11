#!/usr/bin/env node
/**
 * make-admin.js
 * Promotes a Firebase Auth user to ADMIN role in Firestore.
 *
 * Usage:
 *   node scripts/make-admin.js --email <email>
 *
 * Requires a service account JSON.
 * Set one of:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json  (env var)
 *   or place the file at ./service-account.json next to this repo root.
 */

const path = require('path');
const { execSync } = require('child_process');

// ── Parse args ───────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const emailIdx = args.indexOf('--email');
const email = emailIdx !== -1 ? args[emailIdx + 1] : null;

if (!email) {
  console.error('Usage: node scripts/make-admin.js --email <email>');
  process.exit(1);
}

// ── Resolve service account ──────────────────────────────────────────────────
const SA_ENV = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const SA_DEFAULT = path.resolve(__dirname, '..', 'service-account.json');

let serviceAccountPath;
if (SA_ENV) {
  serviceAccountPath = path.resolve(SA_ENV);
} else {
  const fs = require('fs');
  if (!fs.existsSync(SA_DEFAULT)) {
    console.error(
      '\nService account not found.\n' +
      'Either:\n' +
      '  1. Place service-account.json in the project root, OR\n' +
      '  2. Set GOOGLE_APPLICATION_CREDENTIALS=<path-to-json>\n\n' +
      'Download from: Firebase Console → Project Settings → Service Accounts → Generate New Private Key'
    );
    process.exit(1);
  }
  serviceAccountPath = SA_DEFAULT;
}

// ── Install firebase-admin if missing ───────────────────────────────────────
try {
  require.resolve('firebase-admin');
} catch {
  console.log('Installing firebase-admin...');
  execSync('npm install firebase-admin --no-save', { stdio: 'inherit' });
}

// ── Main ─────────────────────────────────────────────────────────────────────
const admin = require('firebase-admin');

const serviceAccount = require(serviceAccountPath);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = admin.auth();
const db   = admin.firestore();

async function run() {
  console.log(`\nLooking up user: ${email}`);

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
  } catch (err) {
    console.error(`\nUser not found in Firebase Auth: ${email}`);
    console.error('Make sure the account exists (sign up first).');
    process.exit(1);
  }

  const { uid, displayName } = userRecord;
  console.log(`Found UID: ${uid}  (display name: ${displayName ?? '—'})`);

  const ref = db.collection('users').doc(uid);
  const snap = await ref.get();

  const update = {
    role: 'ADMIN',
    banned: false,
    lastLoginAt: Date.now(),
  };

  if (snap.exists()) {
    await ref.update(update);
    console.log('Updated existing Firestore document.');
  } else {
    // Create a minimal profile so the app can read it
    await ref.set({
      name: displayName ?? email.split('@')[0],
      email,
      phone: null,
      avatar: null,
      location: null,
      averageRating: 0,
      totalReviews: 0,
      totalAds: 0,
      pushToken: null,
      createdAt: Date.now(),
      ...update,
    });
    console.log('Created new Firestore document.');
  }

  // Verify
  const verify = (await ref.get()).data();
  console.log(`\n✓ Done. users/${uid}.role = "${verify.role}"`);
  console.log(`  banned = ${verify.banned}`);
  console.log(`\nYou can now sign in at /auth/login with ${email} and you will be redirected to /admin.\n`);
}

run().catch((err) => {
  console.error('\nUnexpected error:', err.message);
  process.exit(1);
});
