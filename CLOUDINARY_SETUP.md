# Cloudinary Setup Guide

## ✅ Configuration Added

Your Cloudinary credentials have been added to:

- `.env` (React Native/Expo)
- `web/.env.local` (Next.js)
- `functions/.env` (Cloud Functions - server-side only)

## 🔐 Security Configuration

### Client-Side (Safe to Expose)

```
Cloud Name: dp3p3jdqk
Upload Preset: bilu_store_unsigned
```

### Server-Side (NEVER expose!)

```
API Key: 916323689378839
API Secret: NmygO50_Mcz73MPvWZE9RBtBCss
```

## ⚙️ Required: Create Unsigned Upload Preset

You need to create an unsigned upload preset in Cloudinary to allow client-side uploads:

### Step 1: Go to Cloudinary Settings

1. Open: https://console.cloudinary.com/settings/upload
2. Scroll down to "Upload presets" section
3. Click "Add upload preset"

### Step 2: Configure the Preset

```
Upload preset name: bilu_store_unsigned
Signing Mode: Unsigned
Folder: bilu-store
```

### Step 3: Optional Settings (Recommended)

```
✅ Unique filename: ON (prevents overwrites)
✅ Use filename: OFF (use Cloudinary-generated names)
✅ Overwrite: OFF
✅ Resource type: Image
✅ Access mode: Public
```

### Step 4: Transformations (Optional but Recommended)

Add incoming transformation to optimize uploads:

```
Quality: auto
Format: auto
Max width: 2000
Max height: 2000
```

### Step 5: Save

Click "Save" at the bottom

## 📁 Folder Structure

Your images will be organized as:

```
bilu-store/
├── ads/
│   ├── {adId}/
│   │   ├── image1.jpg
│   │   └── image2.jpg
├── profiles/
│   └── {userId}/
│       └── avatar.jpg
└── chat/
    └── {chatId}/
        └── image.jpg
```

## 🖼️ Image Transformations

Your app automatically applies these transformations:

### Thumbnail (200x200)

```
c_fill,w_200,h_200,q_auto,f_auto
```

### Medium (800x800 max)

```
c_limit,w_800,h_800,q_auto,f_auto
```

### Large (1200x1200 max)

```
c_limit,w_1200,h_1200,q_auto,f_auto
```

## 📊 Free Tier Limits

Cloudinary Free Plan includes:

- ✅ 25 GB storage
- ✅ 25 GB bandwidth/month
- ✅ 25,000 transformations/month
- ✅ Perfect for MVP!

## 🔗 Usage in Your App

### Upload Ad Images

```typescript
import { uploadAdImages } from "@/services/MediaService";

const imageUrls = await uploadAdImages(adId, localImageUris);
```

### Upload Profile Avatar

```typescript
import { uploadAvatar } from "@/services/MediaService";

const avatarUrl = await uploadAvatar(userId, localUri);
```

### Upload Chat Image

```typescript
import { uploadChatImage } from "@/services/MediaService";

const imageUrl = await uploadChatImage(chatId, localUri);
```

### Get Optimized URLs

```typescript
import { getThumbnailUrl, getFullSizeUrl } from "@/services/MediaService";

// For list views (small thumbnails)
const thumb = getThumbnailUrl(originalUrl);

// For detail views (full size)
const full = getFullSizeUrl(originalUrl);
```

## 🧪 Testing

After creating the upload preset, test it:

```bash
# Install dependencies
npm install

# Run the app
npx expo start
```

Try uploading an image in the app. Check your Cloudinary Media Library:
https://console.cloudinary.com/console/media_library

## 🚨 Troubleshooting

### Error: "Upload preset not found"

- Make sure you created the preset named exactly: `bilu_store_unsigned`
- Ensure "Signing Mode" is set to "Unsigned"

### Error: "Upload failed"

- Check your internet connection
- Verify the cloud name is correct: `dp3p3jdqk`
- Check Cloudinary dashboard for quota limits

### Images not showing

- Verify the URL format: `https://res.cloudinary.com/dp3p3jdqk/...`
- Check browser console for CORS errors
- Ensure images are set to "Public" access mode

## 🔗 Useful Links

- Cloudinary Console: https://console.cloudinary.com
- Upload Settings: https://console.cloudinary.com/settings/upload
- Media Library: https://console.cloudinary.com/console/media_library
- Usage Dashboard: https://console.cloudinary.com/console/usage
- Documentation: https://cloudinary.com/documentation

## 📝 Next Steps

1. ✅ Create the unsigned upload preset (see Step 1-5 above)
2. ✅ Test image upload in your app
3. ✅ Monitor usage in Cloudinary dashboard
4. ✅ Set up webhooks (optional, for advanced features)
