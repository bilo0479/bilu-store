# Firebase Setup Status - FREE SPARK PLAN

## ✅ Completed Steps

### Platform 1 — Google Account

- ✅ Account created: bilustore.dev@gmail.com
- ✅ Authenticated with Firebase CLI

### Platform 2A — Firebase Project

- ✅ Project created: bilu-store
- ✅ Project ID: bilu-store-e1a06
- ✅ Project Number: 1036141535984
- ✅ Plan: **Spark (FREE)**

### Platform 2G — Android App Registration

- ✅ App created: Bilu Store Android
- ✅ Package name: com.bilustore.app
- ✅ App ID: 1:1036141535984:android:1e7a8e6998e5f631149835
- ✅ Configuration saved to: `google-services.json`

### Platform 2H — Web App Registration

- ✅ App created: Bilu Store Web Dashboard
- ✅ App ID: 1:1036141535984:web:b29d0efdbf00a91f149835
- ✅ Configuration saved to: `.env` and `web/.env.local`

## ⚠️ Manual Steps Required (All FREE on Spark Plan!)

### Platform 2C — Enable Firebase Authentication ✅ FREE

1. Go to: https://console.firebase.google.com/project/bilu-store-e1a06/authentication/providers
2. Click "Get started" (if needed)
3. Enable the following sign-in methods:
   - ✅ **Email/Password** → Toggle ON → Save
   - ✅ **Google** → Toggle ON → Enter support email → Save
   - ⚠️ **Phone** (optional, requires Blaze for SMS costs)

### Platform 2D — Create Firestore Database ✅ FREE

**This works on FREE Spark Plan!**

1. Go to: https://console.firebase.google.com/project/bilu-store-e1a06/firestore
2. Click "Create database"
3. Select "Production mode" → Next
4. Location: **europe-west1** (Belgium) → Enable
5. Wait ~1 minute for provisioning

**Or tell me when ready and I'll create it for you!**

## 📊 What Works on FREE Spark Plan

### ✅ Included FREE:

- **Authentication**: Email/Password, Google, Anonymous, etc. - UNLIMITED
- **Firestore**: 1GB storage, 50K reads/day, 20K writes/day
- **Hosting**: 10GB storage, 360MB/day transfer
- **Storage**: 5GB storage, 1GB/day downloads
- **Perfect for MVP and testing!**

### ❌ Requires Blaze Plan (Upgrade Later):

- **Cloud Functions** - For backend automation
- **Phone Authentication SMS** - Costs per SMS
- **FCM Push Notifications** - Requires Cloud Functions
- **Scheduled Tasks** - Requires Cloud Functions

## 🔧 MVP Workarounds (No Blaze Needed)

### 1. Search (Instead of Algolia + Cloud Functions)

Use Firestore queries:

```typescript
// Simple category + location filtering
const adsQuery = query(
  collection(db, "ads"),
  where("category", "==", selectedCategory),
  where("status", "==", "ACTIVE"),
  orderBy("createdAt", "desc"),
  limit(20),
);
```

### 2. Push Notifications (Instead of FCM + Cloud Functions)

Use Expo Push Notifications (FREE, no Cloud Functions needed):

```bash
npx expo install expo-notifications
```

### 3. Review Ratings (Instead of Cloud Function calculation)

Calculate client-side when displaying:

```typescript
const reviews = await getDocs(
  query(collection(db, "reviews"), where("sellerId", "==", sellerId)),
);
const avgRating =
  reviews.docs.reduce((sum, doc) => sum + doc.data().rating, 0) / reviews.size;
```

### 4. Premium Expiry (Instead of scheduled Cloud Function)

Check in app when loading ads:

```typescript
if (ad.premiumEndDate && ad.premiumEndDate < new Date()) {
  // Show as expired, don't boost in results
}
```

## 📝 Configuration Files Created

1. **google-services.json** - Android app configuration (root directory)
2. **.env** - React Native/Expo environment variables
3. **web/.env.local** - Next.js web dashboard environment variables

## 🔑 Firebase Web Config

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD3nV_R8J-3zuFdagWruH1FiJOm6Agli9I",
  authDomain: "bilu-store-e1a06.firebaseapp.com",
  projectId: "bilu-store-e1a06",
  storageBucket: "bilu-store-e1a06.firebasestorage.app",
  messagingSenderId: "1036141535984",
  appId: "1:1036141535984:web:b29d0efdbf00a91f149835",
  measurementId: "G-J2LBKZS0DG",
};
```

## 🚀 Next Steps (All FREE!)

1. ✅ **Enable Email + Google Authentication** in Firebase Console
2. ✅ **Create Firestore Database** (tell me when ready!)
3. ✅ **Deploy Security Rules**: `firebase deploy --only firestore:rules`
4. ✅ **Test your app** with authentication and database
5. ⏭️ **Upgrade to Blaze later** when you need Cloud Functions

## 💰 When to Upgrade to Blaze

Consider upgrading when you need:

- Advanced search with Algolia
- Automated push notifications
- Scheduled background tasks
- More than 50K Firestore reads/day

**Good news**: Blaze has a generous free tier, and you can set budget alerts!

## 📚 Useful Links

- Firebase Console: https://console.firebase.google.com/project/bilu-store-e1a06
- Authentication: https://console.firebase.google.com/project/bilu-store-e1a06/authentication
- Firestore: https://console.firebase.google.com/project/bilu-store-e1a06/firestore
- Pricing: https://firebase.google.com/pricing
