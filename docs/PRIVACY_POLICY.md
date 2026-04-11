# Privacy Policy — Bilu Store

> **Plain-Language Summary:** Bilu Store is a local classified marketplace app that lets buyers and sellers connect in Ethiopia. We collect your name, contact details, and ad content so you can post and find listings. We use Firebase (by Google), Algolia, and Cloudinary to run the service. We do not sell your personal information. You can delete your account and data at any time by emailing us at support@bilustore.com.

**Estimated Word Count:** ~5,800 words
**Version:** 1.0 | **Effective Date:** <!-- TODO: Replace with actual launch date --> | **Last Reviewed:** <!-- TODO: Replace with actual review date -->

---

## Table of Contents

1. [Introduction & Identity](#1-introduction--identity)
2. [Information We Collect](#2-information-we-collect)
3. [How We Use Your Information](#3-how-we-use-your-information)
4. [Data Sharing & Disclosure](#4-data-sharing--disclosure)
5. [Data Storage & Security](#5-data-storage--security)
6. [User Rights & Choices](#6-user-rights--choices)
7. [Cookies & Tracking Technologies](#7-cookies--tracking-technologies)
8. [Children's Privacy](#8-childrens-privacy)
9. [International Data Transfers](#9-international-data-transfers)
10. [Ethiopia-Specific Disclosures](#10-ethiopia-specific-disclosures)
11. [Regional Addenda](#11-regional-addenda)
12. [Third-Party Links & Services](#12-third-party-links--services)
13. [Changes to This Policy](#13-changes-to-this-policy)
14. [Contact Information](#14-contact-information)
15. [Compliance Checklist](#compliance-checklist)

---

## 1. Introduction & Identity

**Bilu Store** is a local classified marketplace application available on Android. It lets people in Ethiopia post items for sale, find goods nearby, and chat directly with buyers and sellers.

**Developer/Operator:**
- **Legal name:** <!-- TODO: Replace with registered legal entity name (e.g., "Bilu Store PLC" or sole trader full name) -->
- **Trading as:** Bilu Store Team
- **Registered address:** <!-- TODO: Replace with physical registered address in Ethiopia -->
- **City/Region:** <!-- TODO: e.g., Addis Ababa, Ethiopia -->
- **Privacy contact email:** support@bilustore.com
- **Website:** https://bilustore.com
- **App bundle ID:** com.bilustore.app

This Privacy Policy explains what information we collect, how we use it, and what choices you have. It applies to the Bilu Store Android app (version 1.0.0 and later) and the web dashboard at https://bilustore.com.

By creating an account or using the app, you agree to this Privacy Policy. If you do not agree, please do not use the app.

> ⚠️ **LEGAL REVIEW REQUIRED:** The registered legal entity name and address in Ethiopia must be confirmed by legal counsel before publishing. Operating without a registered legal entity may expose the developer to personal liability under Ethiopian commercial law.

---

## 2. Information We Collect

### 2.1 Information You Give Us Directly

When you register and use Bilu Store, you give us the following information:

**Account Registration (Email/Password):**
- Full name
- Email address
- Password (we never store your password in readable form — it is secured by Firebase Authentication)

**Account Registration (Phone):**
- Mobile phone number (used for one-time password verification via Firebase)

**Account Registration (Google Sign-In):**
- Name, email address, and profile photo from your Google account (provided by Google OAuth)

**Profile Information:**
- Display name
- Phone number (optional, after registration)
- Profile photo (uploaded from your camera or photo library)
- Location (city or neighborhood text you type, e.g., "Addis Ababa, Bole")

**Ad Listings (when you post an item for sale):**
- Title (up to 80 characters)
- Description (up to 2,000 characters)
- Price and currency (Ethiopian Birr or US Dollar)
- Category (chosen from 10 fixed categories)
- Subcategory (optional text)
- Item condition (New, Like New, Used Good, Used Fair)
- Up to 5 photos (taken from your camera or photo library)
- Location text (e.g., "Addis Ababa, Kirkos")
- GPS coordinates (optional — only if you tap the "Use My Location" button)
- Contact preference (chat only, or chat and phone)
- Whether the price is negotiable

**Chat Messages:**
- Text messages you send to buyers or sellers
- Images you send in chat (uploaded from your camera or photo library)

**Reviews:**
- Star rating (1–5) you give to a seller
- Written comment you submit with your review

**Reports:**
- The reason you select when reporting an ad or user (e.g., spam, scam)
- Optional details you write in the report

**Search:**
- Keywords and filters you type in the search bar (processed in memory; not permanently stored to your profile)

---

### 2.2 Information Collected Automatically

When you use the app, we automatically collect:

- **Device push token:** A unique token from Firebase Cloud Messaging (FCM) and Expo that lets us send you push notifications. Stored in your user profile.
- **Login timestamp:** The date and time you last signed in (`lastLoginAt`), stored in your profile.
- **Ad view counts:** How many times each ad has been viewed by users (an aggregate counter on each ad, not linked to individual viewer identities).
- **App session state:** Temporary data stored on your device (via AsyncStorage) to keep you logged in and to remember where to send you after login. This is not sent to our servers independently.
- **Network connectivity status:** Checked locally on your device to show offline messages. Not transmitted.

**What we do NOT collect automatically:**
- We do not use advertising IDs (Google Advertising ID / GAID)
- We do not use third-party analytics SDKs (no Google Analytics, Firebase Analytics, Mixpanel, Amplitude, or similar)
- We do not collect browser cookies in the mobile app (the web dashboard may use session cookies for authentication — see Section 7)
- We do not collect device model, OS version, or IP address directly (Firebase may collect this as part of its standard service operation — see Section 4)

---

### 2.3 Information from Third-Party Sources

- **Google Sign-In:** If you choose to sign in with Google, we receive your name, email address, and profile photo from Google. We do not receive your Google password.
- **Firebase Authentication:** Firebase confirms your identity and sends us a verified user ID. Firebase may collect additional technical data as part of its operation (see their privacy policy).

---

### 2.4 Inferred or Derived Data

- **Seller reputation score:** We calculate your average star rating and total review count from reviews other users submit about you. This is displayed on your seller profile.
- **Trusted seller status:** The app automatically checks if your average rating is 4.0 or above with 3 or more reviews. If so, your new ad listings may go live without manual admin review. This is a simple rule-based calculation — no machine learning or profiling is used.

---

### 2.5 Sensitive Data

The following data categories are considered **sensitive** and receive heightened protection:

| Sensitive Data Type | How We Handle It |
|---------------------|-----------------|
| Phone number | Stored encrypted at rest in Firebase (Google's infrastructure); never shown publicly in ad listings; only shared if you set your contact preference to "Chat and Phone" and a buyer requests it via chat |
| GPS coordinates (precise location) | Optional; only collected if you tap "Use My Location"; stored with your ad; never used for continuous tracking |
| Profile photo | Stored on Cloudinary with access controls; never sold |

---

## 3. How We Use Your Information

We use your information only for the specific purposes listed below. For each purpose, we explain the legal reason we are allowed to use it.

| Purpose | Data Used | Legal Basis |
|---------|-----------|-------------|
| Create and manage your account | Name, email, phone, password hash | **Contract** — necessary to provide the service you signed up for |
| Display your profile to other users | Name, avatar, location, rating, total reviews | **Contract** — necessary so buyers and sellers can identify each other |
| Publish your ad listings on the marketplace | All ad fields (title, description, price, photos, location, etc.) | **Contract** — necessary to provide the core listing service |
| Enable real-time chat between buyers and sellers | Chat messages (text and images), sender/recipient IDs | **Contract** — necessary to connect buyers and sellers |
| Send push notifications (new messages, ad approvals, etc.) | Push token, notification content | **Contract / Legitimate Interest** — necessary for the core messaging feature; you can turn this off in your device settings |
| Moderate content and enforce our rules | Reports, ad content, user status | **Legitimate Interest** — to keep the platform safe and lawful |
| Index your ad in our search engine (Algolia) | Ad title, description, price, category, location, status | **Contract** — necessary so buyers can find your listings |
| Store your ad photos and profile photo | Image files | **Contract** — necessary to display your listings and profile |
| Calculate and display seller reputation | Reviews (rating + comment) | **Contract / Legitimate Interest** — to build trust in the marketplace |
| Auto-approve trusted sellers' ads | Average rating, review count | **Legitimate Interest** — to speed up the listing process for verified sellers |
| Respond to your support requests | Name, email, message content | **Contract / Legitimate Interest** — to provide customer support |
| Comply with legal obligations | Any data required by law | **Legal Obligation** — to comply with Ethiopian law and any valid legal order |
| Send you account-related notifications (ad approved, ad rejected, premium expiring) | Email/push token | **Contract** — so you know the status of your listings |

**What we do NOT do with your data:**
- We do not sell your personal information to anyone
- We do not use your data for targeted advertising
- We do not use automated decision-making that produces legal effects on you (the trusted-seller rule is a simple eligibility check, not a legal determination)
- We do not build behavioral profiles for advertising purposes

---

## 4. Data Sharing & Disclosure

### 4.1 Third-Party Services We Use

The following services receive your data as part of running the app:

| SDK / Service | Provider | Data Shared | Purpose | Their Privacy Policy |
|---|---|---|---|---|
| **Firebase Authentication** | Google LLC (USA) | Email, phone number, name, OAuth tokens, IP address (by Firebase) | User login and identity verification | https://firebase.google.com/support/privacy |
| **Cloud Firestore** | Google LLC (USA) | All user profile data, ad listings, chat messages, reviews, reports, favorites | Primary app database | https://firebase.google.com/support/privacy |
| **Firebase Cloud Messaging (FCM)** | Google LLC (USA) | Device push token, notification title/body, custom data (ad ID, chat ID) | Push notifications | https://firebase.google.com/support/privacy |
| **Firebase Cloud Functions** | Google LLC (USA) | Ad content (for Algolia sync), FCM tokens (for notification delivery) | Backend processing, search indexing, notification dispatch | https://firebase.google.com/support/privacy |
| **Algolia** | Algolia SAS (France) | Ad title, description, price, category, location text, status, seller ID | Full-text search of ad listings | https://www.algolia.com/policies/privacy |
| **Cloudinary** | Cloudinary Ltd. (Israel/USA) | Image files (ad photos, chat images, profile avatars) | Image hosting and delivery | https://cloudinary.com/privacy |
| **Expo / EAS** | Expo Inc. (USA) | Device push token, app build metadata | Push notification infrastructure, app distribution | https://expo.dev/privacy |

> ⚠️ **LEGAL REVIEW REQUIRED:** Firebase, Algolia, Cloudinary, and Expo are all non-Ethiopian providers. Cross-border data transfer safeguards (SCCs or equivalent) should be documented before launching. See Section 9 and Section 11.

### 4.2 Public Information

The following information is **visible to all users** of the app (including non-logged-in visitors to the web dashboard):

- Your display name (as shown on your ad listings and seller profile)
- Your profile photo
- Your ad listings (title, description, price, photos, location text, category, condition)
- Your average star rating and total review count
- Reviews that other users have written about you

Your **email address**, **phone number**, and **GPS coordinates** are never shown publicly.

### 4.3 Admin Access

Our admin team can access:
- All ad listings (including drafts and rejected ads) for moderation
- Reports submitted against ads or users
- Premium boost records
- User account status (banned/active)

Admins do **not** have access to the content of private chat messages through the standard admin panel. Chat messages are stored in Firestore and are accessible only to participants and, in the case of a valid legal order, to Firebase's infrastructure.

### 4.4 Government & Law Enforcement

We will share your information with Ethiopian government authorities or law enforcement if:
- We receive a valid court order, subpoena, or other legal process under Ethiopian law
- We believe disclosure is necessary to prevent fraud, cybercrime, or imminent harm
- We are required to comply with the Ethiopian Computer Crime Proclamation No. 958/2016 or other applicable law

We will attempt to notify you of such requests unless prohibited by law or court order.

### 4.5 Business Transfer

If Bilu Store is acquired by, merged with, or sold to another company, your information may be transferred as part of that transaction. We will notify you via in-app notice or email at least 30 days before such a transfer takes effect, and the new owner will be required to honor this Privacy Policy or obtain your fresh consent.

### 4.6 No Sale of Personal Data

**We do not sell, rent, or trade your personal information to third parties for their own marketing or advertising purposes.** This includes the right to "opt out of sale" under CCPA — there is nothing to opt out of.

---

## 5. Data Storage & Security

### 5.1 Where Your Data Is Stored

| Data Type | Storage Location | Provider | Region |
|-----------|-----------------|----------|--------|
| User profiles, ad listings, chats, reviews, reports, favorites | Cloud Firestore | Google LLC | Primary: `us-central1` (Iowa, USA) — Firebase default; <!-- TODO: Confirm actual Firebase project region — consider `europe-west` or a closer region for GDPR compliance --> |
| Authentication credentials | Firebase Authentication | Google LLC | Global (Google-managed) |
| Ad photos, chat images, profile avatars | Cloudinary CDN | Cloudinary Ltd. | <!-- TODO: Confirm Cloudinary account region in your Cloudinary dashboard --> |
| Search index (ad title, description, metadata) | Algolia | Algolia SAS | <!-- TODO: Confirm Algolia index region in your Algolia dashboard --> |
| Device session token | AsyncStorage (on your device) | None (local only) | Your device |

> ⚠️ **LEGAL REVIEW REQUIRED:** Firebase Firestore defaults to `us-central1`. If Ethiopian data protection rules require or recommend data localization, you should either (a) confirm the region is acceptable, (b) switch to a closer Firebase region (e.g., `europe-west3`), or (c) document the legal basis for international transfer. This affects your GDPR and Ethiopia compliance.

### 5.2 Encryption

- **In transit:** All communication between the app and Firebase, Algolia, and Cloudinary uses HTTPS/TLS 1.2 or higher. This is enforced by the Firebase SDK, Algolia SDK, and Cloudinary API.
- **At rest:** Firebase (Google) encrypts all data stored in Firestore and Firebase Authentication at rest using AES-256 by default. Cloudinary encrypts stored files at rest.
- **Passwords:** Passwords are never stored by us. Firebase Authentication handles password hashing using industry-standard methods (we never see your password in plaintext).
- **Local storage:** Your login session token stored in AsyncStorage on your device is not encrypted at the application layer. Device-level encryption (Android full-disk encryption, available on Android 8.0+, our minimum supported version) provides the primary protection for this data.

### 5.3 Access Controls

- Firestore security rules enforce user isolation: you can only read and write your own profile, your own ads, and chats you are a participant in
- Admin-only operations (resolving reports, banning users, updating config) require an `ADMIN` role stored in your user document
- Cloud Functions operate with a Firebase Admin SDK credential that is never exposed client-side
- Cloudinary uses unsigned upload presets scoped to specific folders — uploaded files cannot overwrite other users' files

### 5.4 Data Breach Notification

If we discover a data breach that affects your personal information, we will:
1. Contain the breach and investigate within **72 hours** of discovery
2. Notify affected users via in-app notification and/or email within **72 hours** of confirming the breach
3. Report to the relevant Ethiopian authority (and, for EU users, the relevant Data Protection Authority) within the legally required timeframe
4. Provide you with information about what data was affected, what we are doing about it, and what steps you can take to protect yourself

### 5.5 Retention Periods

| Data Type | Retention Period | What Happens After |
|-----------|-----------------|-------------------|
| Account profile (name, email, phone, avatar, location) | Until you delete your account | Permanently deleted within 30 days of deletion request |
| Ad listings | 30 days from creation (then auto-expires); or until you manually delete | Status set to EXPIRED; permanently deleted within 30 days of account deletion |
| Chat messages | Until you delete your account | Permanently deleted within 30 days of account deletion |
| Reviews | Until the reviewer or the reviewed seller deletes their account | Permanently deleted within 30 days of account deletion |
| Reports | Until resolved by an admin, then 90 days for audit purposes | Deleted 90 days after resolution |
| Favorites | Until you remove the favorite or delete your account | Deleted immediately on removal; or within 30 days of account deletion |
| Push tokens | Until you log out or delete your account | Deleted within 30 days of account deletion |
| Firebase Authentication credentials | Until you delete your account | Deleted from Firebase Auth within 30 days of account deletion |

### 5.6 Account Deletion

You can delete your account at any time. When you delete your account:
- Your profile, ad listings (in all statuses), chat history, favorites, and push token will be permanently deleted from Firestore within **30 days**
- Your images will be deleted from Cloudinary within **30 days**
- Your search records will be deleted from Algolia within **30 days**
- Your Firebase Authentication credentials will be deleted within **30 days**
- Reviews you have written about others will be deleted
- Reviews others have written about you will be deleted
- After deletion, your data cannot be recovered

To delete your account, email us at support@bilustore.com with the subject "Account Deletion Request" from your registered email address, or use the in-app settings menu (<!-- TODO: Confirm in-app deletion flow is built and the menu path -->).

---

## 6. User Rights & Choices

You have the following rights regarding your personal information. These rights apply to all users. Additional rights for EU, California, and other regional users are listed in Section 11.

| Right | What It Means | How to Exercise It | Response Time |
|-------|--------------|-------------------|---------------|
| **Right to Access** | Get a copy of the personal data we hold about you | Email support@bilustore.com with subject "Data Access Request" | 30 days |
| **Right to Correct** | Fix inaccurate or incomplete data | Edit your profile in-app (Settings → Edit Profile), or email us | 30 days (in-app: immediate) |
| **Right to Delete** | Have your account and data permanently deleted | Email support@bilustore.com with subject "Account Deletion Request" | 30 days |
| **Right to Data Portability** | Receive a copy of your data in a machine-readable format (JSON) | Email support@bilustore.com with subject "Data Portability Request" | 30 days |
| **Right to Withdraw Consent** | Stop processing based on your consent (e.g., location access, push notifications) | Turn off Location or Notification permissions in your Android device Settings at any time | Immediate |
| **Right to Object** | Object to processing for legitimate interest purposes | Email support@bilustore.com explaining your objection | 30 days |
| **Right to Restrict Processing** | Ask us to limit processing while a dispute is resolved | Email support@bilustore.com with subject "Restrict Processing Request" | 30 days |

**Push Notifications:** You can turn off push notifications at any time in your Android device Settings → Apps → Bilu Store → Notifications. You will still receive important service messages if you have an email address on your account.

**Location Access:** You can turn off location permission in your Android device Settings → Apps → Bilu Store → Permissions → Location. The app will still work without location permission; GPS coordinates will not be attached to your ads.

**Camera / Photo Library Access:** You can turn off camera or storage permissions in your Android device Settings → Apps → Bilu Store → Permissions. You will not be able to upload photos without these permissions.

### How to Lodge a Complaint

If you are not satisfied with how we handle your personal data:
- Email us first at support@bilustore.com — we aim to resolve all complaints within 30 days
- You may also lodge a complaint with the **Ethiopian Information Network Security Administration (INSA)** or the relevant authority under Ethiopia's emerging data protection framework
- EU/EEA users may lodge a complaint with their local Data Protection Authority (see Section 11)
- UK users may contact the Information Commissioner's Office (ICO)

---

## 7. Cookies & Tracking Technologies

### 7.1 Mobile App (Android)

The Bilu Store Android app does **not** use cookies. The app uses the following local storage and identifiers:

| Technology | What Is Stored | Purpose | How to Opt Out |
|------------|---------------|---------|----------------|
| **AsyncStorage** (device-local) | Firebase authentication session token, post-login redirect intent, cached favorite ad IDs | Keep you logged in between app sessions; remember navigation state | Clear app data in Android Settings → Apps → Bilu Store → Storage → Clear Data (this will log you out) |
| **Firebase Cloud Messaging token** | A unique device push token | Deliver push notifications to your device | Turn off Notification permission in Android Settings → Apps → Bilu Store → Notifications |
| **Firestore offline cache** | Cached copies of recently viewed ads and your chat messages | Allow the app to work offline | Clear app data in Android Settings (as above) |

### 7.2 Web Dashboard (https://bilustore.com)

<!-- TODO: Confirm what cookies/storage the web dashboard uses. The current Next.js web app is a stub. Update this section when the web dashboard is fully built. -->

The web dashboard may use session cookies set by Firebase Authentication to keep you logged in. These are first-party, session-only cookies. No third-party advertising cookies are used.

### 7.3 Advertising ID

**We do not use the Google Advertising ID (GAID) or any advertising identifier.** No advertising SDK is integrated in the current version of Bilu Store.

### 7.4 Analytics

**We do not use any third-party analytics SDK** in the current version (no Firebase Analytics, Google Analytics, Mixpanel, Amplitude, or similar). We do count aggregate ad view counts per listing, which is not linked to individual user identities.

---

## 8. Children's Privacy

### 8.1 Minimum Age

Bilu Store is **not directed at children**. The app is a marketplace for buying and selling goods and services, intended for adults and responsible older teenagers. The minimum age to use Bilu Store is:

- **13 years old** (global minimum)
- **16 years old** for users in the European Economic Area (EEA) — in line with GDPR Article 8

### 8.2 No Knowing Collection from Children Under 13

We do not knowingly collect personal information from children under 13. If we learn that we have collected personal data from a child under 13 without verifiable parental consent, we will:
1. Delete that data from our systems within 30 days
2. Terminate the associated account

### 8.3 If You Believe a Child Has Registered

If you are a parent or guardian and believe your child under 13 has created a Bilu Store account, please contact us immediately at support@bilustore.com with the subject "Child Account Deletion." We will delete the account and all associated data within 30 days.

### 8.4 No Parental Consent Mechanism

The current version of Bilu Store does not include a parental consent flow. If your jurisdiction requires verified parental consent for users under a specific age (e.g., COPPA for US users under 13), you should not use this app until such a mechanism is in place.

> ⚠️ **LEGAL REVIEW REQUIRED:** If the app is made available on the Google Play Store globally, COPPA (US) applies to users under 13. The current app has no age-gate or parental consent mechanism. If analytics or advertising SDKs are added in the future, COPPA compliance will become more critical.

---

## 9. International Data Transfers

### 9.1 Context

Bilu Store is built for users primarily in Ethiopia. However, the services we use (Firebase by Google, Algolia, Cloudinary, and Expo) are operated by companies in the United States, France, and other countries. This means your personal data may be transferred to and stored in countries outside Ethiopia.

### 9.2 Transfer Mechanism

For transfers of personal data from Ethiopia to other countries, we rely on:
- The standard data protection obligations included in the terms of service of each third-party provider (Firebase, Algolia, Cloudinary, Expo)
- <!-- TODO: Once Ethiopia enacts a formal Personal Data Protection Law and establishes a Data Protection Authority, review whether Standard Contractual Clauses (SCCs) or other adequacy mechanisms are required for Ethiopian data subjects -->

### 9.3 EU/EEA Users — GDPR Transfers

For users in the EU or EEA, personal data is transferred to the USA and other countries under:
- **Firebase (Google):** Google's Standard Contractual Clauses (SCCs) and its participation in approved transfer frameworks. See https://firebase.google.com/support/privacy
- **Algolia:** Algolia's SCCs and Data Processing Agreement. See https://www.algolia.com/policies/privacy
- **Cloudinary:** Cloudinary's SCCs and Data Processing Agreement. See https://cloudinary.com/privacy
- **Expo:** Expo's privacy policy and data processing terms. See https://expo.dev/privacy

> ⚠️ **LEGAL REVIEW REQUIRED:** Before launching to EU users, execute Data Processing Agreements (DPAs) with Firebase (Google), Algolia, and Cloudinary. Confirm SCCs are in place. Review the Schrems II requirements.

### 9.4 Your Consent

By using the app, you acknowledge that your data will be processed in countries outside Ethiopia as described in this section. If you do not agree, please do not use the app.

---

## 10. Ethiopia-Specific Disclosures

### 10.1 Computer Crime Proclamation No. 958/2016

Bilu Store complies with the **Ethiopian Computer Crime Proclamation No. 958/2016**. We prohibit and actively moderate content that constitutes:
- Unauthorized access to computer systems
- Distribution of illegal content
- Fraud or identity deception through our platform
- Any use of Bilu Store to commit cybercrimes as defined in this Proclamation

Users who violate this Proclamation through the platform may be banned, and their activity may be reported to the relevant Ethiopian authority.

### 10.2 Communications Service Proclamation No. 1148/2019

To the extent applicable, Bilu Store complies with relevant provisions of the **Ethiopian Communications Service Proclamation No. 1148/2019**, including lawful interception requirements applicable to communications service providers.

### 10.3 Ethiopia's Emerging Personal Data Protection Framework

Ethiopia is in the process of enacting a formal Personal Data Protection Law. Bilu Store is designed with data minimization and security principles that align with international best practices (including GDPR principles) in anticipation of this legislation. We will update this Privacy Policy promptly once such legislation is enacted.

### 10.4 Data Localization

At this time, Ethiopia does not have a formal data localization requirement that mandates storing all Ethiopian user data within Ethiopia. Bilu Store stores data on Firebase (Google) servers. We will monitor legislative developments and adjust our data storage arrangements if required by Ethiopian law.

### 10.5 Ethiopian Birr

Bilu Store supports transactions in **Ethiopian Birr (ETB)** as the primary currency. No actual payment processing occurs through the app — Bilu Store connects buyers and sellers who then arrange payment independently.

---

## 11. Regional Addenda

---

### 11A. For Users in the EU and EEA — GDPR Addendum

This section applies to you if you are located in a European Union member state or the European Economic Area.

**Data Controller:** The data controller is <!-- TODO: Insert registered legal entity name --> operating as Bilu Store, contactable at support@bilustore.com.

**EU Representative:** <!-- TODO: If your company is not established in the EU/EEA and you have users in the EU, you are required under GDPR Article 27 to appoint an EU representative. Insert representative details here or confirm this requirement does not apply. -->

**Data Protection Officer (DPO):** <!-- TODO: Assess whether you are required to appoint a DPO under GDPR Article 37 (required for large-scale systematic monitoring of individuals or large-scale processing of special category data). If required, insert DPO contact details. If not required, state "We have determined that we are not required to appoint a Data Protection Officer at this stage." -->

**Lawful Basis for Each Processing Activity:**

| Processing Activity | Lawful Basis | GDPR Article |
|---------------------|--------------|--------------|
| Account creation and management | Contract (Art. 6(1)(b)) | You must have an account to use the service |
| Publishing ad listings | Contract (Art. 6(1)(b)) | Core service delivery |
| Real-time chat | Contract (Art. 6(1)(b)) | Core service delivery |
| Push notifications | Legitimate Interest (Art. 6(1)(f)) | Necessary for service communication; can be withdrawn |
| Search indexing via Algolia | Contract (Art. 6(1)(b)) | Necessary to make ads findable |
| Image storage via Cloudinary | Contract (Art. 6(1)(b)) | Necessary to display listings |
| Content moderation | Legitimate Interest (Art. 6(1)(f)) | Platform safety and legal compliance |
| Seller reputation calculation | Legitimate Interest (Art. 6(1)(f)) | Trust and safety of marketplace |
| Legal compliance | Legal Obligation (Art. 6(1)(c)) | Court orders, regulatory requirements |

**Your GDPR Rights:**
You have the right to: access your data (Art. 15), rectify inaccurate data (Art. 16), erase your data ("right to be forgotten," Art. 17), restrict processing (Art. 18), receive your data in a portable format (Art. 20), object to processing (Art. 21), and withdraw consent at any time (Art. 7(3)).

To exercise any of these rights, email support@bilustore.com. We will respond within **30 days** (extendable by a further 60 days for complex requests, with notice).

**Automated Decision-Making:** The "trusted seller" auto-approval rule (avg rating ≥ 4.0 AND ≥ 3 reviews → ads go live without manual review) is a simple rule-based eligibility check. It does not produce legal effects on you. You may ask us to apply manual review to your ads regardless by contacting support@bilustore.com.

**Right to Lodge a Complaint with a DPA:** You have the right to lodge a complaint with the supervisory authority in your EU member state. A list of EU DPAs is available at: https://edpb.europa.eu/about-edpb/about-edpb/members_en

---

### 11B. For California Residents — CCPA/CPRA Addendum

This section applies to you if you are a resident of California, USA.

**Categories of Personal Information Collected (Last 12 Months):**

| Category | Specific Information | Collected? |
|----------|---------------------|-----------|
| Identifiers | Name, email, phone, user ID | Yes |
| Personal records | Profile photo, location text | Yes |
| Protected characteristics | None | No |
| Commercial information | Ad listings (price, category, items offered) | Yes |
| Biometric data | None | No |
| Internet/network activity | None (no analytics SDK) | No |
| Geolocation | GPS coordinates (optional, only if user enables it) | Yes (optional) |
| Sensory data | Photos uploaded by user | Yes |
| Professional information | Job listings (if user posts in Jobs category) | Yes (user-provided) |
| Inferences | Seller reputation score (calculated from reviews) | Yes |

**Categories of Sources:** Directly from you (registration, ad posting, chat), Firebase Authentication (for Google Sign-In), your device (push token, optional GPS).

**Business/Commercial Purposes:** Operating the marketplace, connecting buyers and sellers, providing customer support, content moderation, and improving service reliability.

**"Do Not Sell or Share My Personal Information":** We do not sell or share your personal information with third parties for cross-context behavioral advertising. There is nothing to opt out of. If this changes, we will update this section and provide an opt-out mechanism.

**Right to Limit Use of Sensitive Personal Information:** We do not use sensitive personal information (as defined by CPRA) for any purpose other than providing the core service. You do not need to exercise this right.

**Non-Discrimination:** We will not discriminate against you for exercising your California privacy rights. We will not deny you service, charge higher prices, or provide a lower quality of service because you exercised your rights under CCPA/CPRA.

**To Exercise Your California Rights:** Email support@bilustore.com with your full name and registered email address. We will respond within **45 days** (extendable by a further 45 days with notice).

---

### 11C. For Canadian Users — PIPEDA

Bilu Store operates in compliance with Canada's **Personal Information Protection and Electronic Documents Act (PIPEDA)** for Canadian users. We collect personal information with your knowledge and consent, use it only for the purposes described in this Policy, and allow you to withdraw consent and access or correct your information at any time. Contact our privacy officer at support@bilustore.com.

---

### 11D. For UK Users — UK GDPR

Following the UK's exit from the EU, the **UK GDPR** (as retained in UK law) applies to UK users. Your rights and protections are equivalent to those described in Section 11A. You may lodge a complaint with the **Information Commissioner's Office (ICO)**: https://ico.org.uk/

---

### 11E. For Australian Users — Privacy Act 1988

For Australian users, Bilu Store handles personal information in accordance with the **Australian Privacy Act 1988** and the **Australian Privacy Principles (APPs)**. You have the right to access and correct your personal information by contacting us at support@bilustore.com.

---

### 11F. For Gulf and MENA Region Users

If you access Bilu Store from Gulf Cooperation Council (GCC) countries or other MENA jurisdictions with applicable data protection laws (e.g., UAE Federal Decree-Law No. 45 of 2021 on Personal Data Protection, Saudi Arabia PDPL), we aim to comply with applicable requirements in those jurisdictions. Contact us at support@bilustore.com for jurisdiction-specific inquiries.

---

## 12. Third-Party Links & Services

The Bilu Store app and website may contain links to or integrations with third-party websites or services (for example, when you view a seller's external profile or click a link shared in chat). **We are not responsible for the privacy practices of third-party websites or services.** Each third-party service has its own privacy policy. We encourage you to read the privacy policies of any third-party service you use.

The third-party services we integrate with are listed in Section 4.1. Their privacy policies are linked in that table.

---

## 13. Changes to This Policy

We may update this Privacy Policy from time to time to reflect changes in our app, services, or applicable law.

**How we will notify you:**
- **Material changes** (changes that affect how we use your data or reduce your rights): We will give you at least **30 days' notice** via in-app notification and/or email before the change takes effect.
- **Minor changes** (corrections, clarifications, addition of new rights): We will update the "Last Reviewed" date at the top of this document and post an in-app notice.

**Continued use** of the app after the effective date of a material change constitutes your acceptance of the updated policy. If you do not accept the changes, you may delete your account before the effective date.

Previous versions of this Privacy Policy are available upon request by emailing support@bilustore.com.

---

## 14. Contact Information

For all privacy-related questions, requests, and complaints:

**Email:** support@bilustore.com
**Subject line:** Use "Privacy Request — [Your Name]" for faster routing
**Mailing address:** <!-- TODO: Insert physical mailing address in Ethiopia -->
**Response commitment:** We will acknowledge your request within **5 business days** and provide a full response within **30 days**.

For urgent matters (suspected data breach, account compromise), email support@bilustore.com with the subject "URGENT: [Description]."

---

## Compliance Checklist

### Google Play Store Submission Requirements
- [ ] Privacy Policy URL is publicly accessible (not behind a login)
- [ ] Privacy Policy URL is listed in app's Play Store listing
- [ ] Privacy Policy URL is linked within the app (e.g., in Settings or About screen)
- [ ] App requests only the permissions it actually uses (Camera, Storage, Location, Notifications)
- [ ] Each permission request includes a rationale shown to the user before requesting
- [ ] Data Safety form in Play Console is completed (categories: Location, Personal info, Photos & videos, Messages, App activity)
- [ ] Data Safety form correctly marks which data is shared with third parties
- [ ] App does not collect data from children under 13 without parental consent
- [ ] Sensitive permissions (Location, Camera) are requested at the point of use, not at startup

### GDPR Checklist
- [ ] Lawful basis documented for each processing activity (see Section 3 table)
- [ ] Data Processing Agreements (DPAs) executed with: Firebase/Google, Algolia, Cloudinary, Expo
- [ ] Standard Contractual Clauses (SCCs) confirmed with each processor for EU-to-non-EU transfers
- [ ] EU Representative appointed (or confirmed not required) — see Section 11A
- [ ] DPO appointed (or confirmed not required) — see Section 11A
- [ ] Privacy Policy accessible in English (consider adding Amharic version for Ethiopian users)
- [ ] 72-hour breach notification process documented internally
- [ ] Records of Processing Activities (ROPA) document maintained internally
- [ ] GDPR-compliant data deletion process implemented (30-day deletion SLA)
- [ ] Automated decision-making disclosure reviewed (trusted seller rule — see Section 11A)

### CCPA/CPRA Checklist
- [ ] "Do Not Sell or Share" confirmed as N/A (no data sale) — document this decision
- [ ] Categories of personal information table updated annually (last 12 months)
- [ ] 45-day response SLA for California rights requests noted in support procedures
- [ ] Non-discrimination policy documented

### Ethiopian Law Checklist
- [ ] Legal entity registered in Ethiopia — <!-- TODO: Confirm registration status -->
- [ ] Compliance with Computer Crime Proclamation No. 958/2016 confirmed
- [ ] Compliance with Communications Service Proclamation No. 1148/2019 reviewed
- [ ] Monitoring Ethiopia's Personal Data Protection Bill for enactment
- [ ] Physical address in Ethiopia documented for legal notices
- [ ] Amharic version of Privacy Policy considered for local user accessibility

### Technical Implementation Checklist
- [ ] HTTPS/TLS enforced for all API calls (Firebase, Algolia, Cloudinary) — confirmed from code review
- [ ] Firestore security rules enforce user isolation — confirmed from code review
- [ ] No plaintext passwords stored — confirmed (Firebase Auth handles hashing)
- [ ] No advertising IDs (GAID) collected — confirmed from code review
- [ ] Image compression before upload implemented (JPEG 70%, max 1200px) — confirmed from MediaService.ts
- [ ] Account deletion flow implemented in-app or via email process — <!-- TODO: Confirm in-app deletion is built -->
- [ ] Push token deleted on account deletion — confirm in deletion flow
- [ ] Algolia index records deleted on account deletion — confirm in deletion flow
- [ ] Cloudinary assets deleted on account deletion — confirm in deletion flow
- [ ] Data retention policy enforced (30-day ad expiry implemented via Cloud Function) — confirmed
- [ ] FCM rate limiting implemented (max 5 notifications/user/hour) — confirmed from fcm.ts

---

*Version 1.0 | Effective: <!-- TODO: Insert effective date --> | Last Reviewed: <!-- TODO: Insert review date -->*

*Generated for Bilu Store (com.bilustore.app) based on codebase review as of March 2026.*
