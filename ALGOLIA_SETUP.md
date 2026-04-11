# Algolia Setup Guide

## ✅ Configuration Added

Your Algolia credentials have been added to:

- `.env` (React Native/Expo - client-side)
- `web/.env.local` (Next.js - client-side)
- `functions/.env` (Cloud Functions - server-side)

## 🔐 Security Configuration

### Client-Side (Safe to Expose)

```
Application ID: Y7LXEFHXMI
Search API Key: ca5a76760da8fe09e32b433c88f1fd96
```

These are read-only keys for searching.

### Server-Side (NEVER expose!)

```
Write API Key: e69d4ef1244ec8587a2c56be18976dbd
```

This key can modify your index - only use in Cloud Functions!

## 📊 Index Configuration

### Index Name

```
bilu_store_ads
```

## ⚙️ Required: Configure Algolia Index

You need to create and configure the index in Algolia:

### Step 1: Create Index

1. Go to: https://www.algolia.com/apps/Y7LXEFHXMI/explorer
2. Click "Create Index"
3. Name: `bilu_store_ads`
4. Click "Create"

### Step 2: Configure Searchable Attributes

1. Go to: https://www.algolia.com/apps/Y7LXEFHXMI/configuration
2. Click on `bilu_store_ads` index
3. Go to "Configuration" tab → "Searchable attributes"
4. Add these attributes in order:
   ```
   1. title
   2. description
   3. category
   4. location
   ```
5. Click "Save"

### Step 3: Configure Facets (Filters)

1. In the same Configuration tab → "Facets"
2. Add these attributes for filtering:
   ```
   - status
   - category
   - condition
   - location
   ```
3. Click "Save"

### Step 4: Configure Custom Ranking (Optional but Recommended)

1. Configuration tab → "Ranking and Sorting"
2. Add custom ranking attributes:
   ```
   1. desc(isPremium)      # Premium ads first
   2. desc(createdAt)      # Newest first
   3. desc(updatedAt)      # Recently updated
   ```
3. Click "Save"

### Step 5: Configure Geo Search (Optional)

If you want location-based search:

1. Configuration tab → "Geo Search"
2. Set `_geoloc` as the geo attribute
3. Click "Save"

## 🔄 How It Works

### Automatic Indexing (Cloud Functions)

When you deploy Cloud Functions, ads are automatically synced to Algolia:

```typescript
// When an ad is created/updated
onAdWrite → Syncs to Algolia

// When an ad is deleted
onAdWrite → Removes from Algolia

// Only ACTIVE ads are indexed
```

### Client-Side Search

Your app searches Algolia for instant results:

```typescript
import { searchByKeyword } from "@/services/SearchService";

const results = await searchByKeyword("laptop", {
  categoryId: "electronics",
  minPrice: 100,
  maxPrice: 1000,
});
```

### Fallback to Firestore

If Algolia is unavailable, the app automatically falls back to Firestore queries.

## 📦 What's Indexed

Each ad document in Algolia contains:

```json
{
  "objectID": "ad_id_here",
  "title": "iPhone 13 Pro",
  "description": "Excellent condition...",
  "category": "electronics",
  "location": "Addis Ababa",
  "price": 45000,
  "condition": "LIKE_NEW",
  "_geoloc": {
    "lat": 9.032,
    "lng": 38.7469
  },
  "updatedAt": 1234567890,
  "status": "ACTIVE"
}
```

## 🚀 Deployment

### Option 1: With Cloud Functions (Requires Blaze Plan)

```bash
cd functions
npm install
firebase deploy --only functions
```

This enables automatic syncing of ads to Algolia.

### Option 2: Without Cloud Functions (FREE Spark Plan)

The app will use Firestore queries as fallback. You can:

- Manually sync ads to Algolia using the Algolia dashboard
- Use the Algolia API directly from your Next.js admin panel
- Wait until you upgrade to Blaze plan

## 📊 Free Tier Limits

Algolia Free Plan includes:

- ✅ 10,000 search requests/month
- ✅ 10,000 records (ads)
- ✅ 100,000 operations/month
- ✅ Perfect for MVP!

## 🧪 Testing Search

### Test in Algolia Dashboard

1. Go to: https://www.algolia.com/apps/Y7LXEFHXMI/explorer
2. Select `bilu_store_ads` index
3. Try searching for test data

### Test in Your App

```typescript
// In your app
import { searchByKeyword } from "@/services/SearchService";

// Simple search
const results = await searchByKeyword("laptop");

// Search with filters
const filtered = await searchByKeyword("phone", {
  categoryId: "electronics",
  minPrice: 5000,
  maxPrice: 50000,
  condition: "LIKE_NEW",
});
```

## 🔍 Search Features

### Typo Tolerance

Algolia automatically handles typos:

- "iphone" → finds "iPhone"
- "labtop" → finds "laptop"

### Prefix Matching

Searches as you type:

- "lap" → finds "laptop"
- "sam" → finds "Samsung"

### Faceted Search

Filter by multiple criteria:

- Category + Price range
- Location + Condition
- Any combination

### Geo Search

Find ads near a location:

```typescript
const nearby = await searchByKeyword("", {
  lat: 9.032,
  lng: 38.7469,
  radius: 10000, // 10km
});
```

## 🚨 Troubleshooting

### Error: "Index does not exist"

- Create the index in Algolia dashboard
- Name must be exactly: `bilu_store_ads`

### Error: "Invalid API key"

- Check that Search API Key is correct in `.env`
- Verify Application ID matches

### No search results

- Check if index has data (Algolia dashboard)
- Verify ads have `status: "ACTIVE"`
- Check if Cloud Functions are deployed

### Search is slow

- You're likely using Firestore fallback
- Deploy Cloud Functions to enable Algolia
- Or manually sync data to Algolia

## 📈 Monitoring

Monitor your Algolia usage:

- Dashboard: https://www.algolia.com/apps/Y7LXEFHXMI/dashboard
- Analytics: https://www.algolia.com/apps/Y7LXEFHXMI/analytics
- Logs: https://www.algolia.com/apps/Y7LXEFHXMI/logs

## 🔗 Useful Links

- Algolia Dashboard: https://www.algolia.com/apps/Y7LXEFHXMI
- Index Explorer: https://www.algolia.com/apps/Y7LXEFHXMI/explorer
- Configuration: https://www.algolia.com/apps/Y7LXEFHXMI/configuration
- API Keys: https://www.algolia.com/apps/Y7LXEFHXMI/api-keys
- Documentation: https://www.algolia.com/doc/

## 📝 Next Steps

1. ✅ Create the `bilu_store_ads` index
2. ✅ Configure searchable attributes
3. ✅ Configure facets for filtering
4. ✅ (Optional) Deploy Cloud Functions for auto-sync
5. ✅ Test search in your app

---

**Note**: Algolia works great on the FREE plan for MVP. You can upgrade later when you need more searches or records.
