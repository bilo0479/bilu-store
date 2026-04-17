"""Build IMPLEMENTATION_PLAN.docx — 10/10 standard."""
from helpers import (
    new_doc, cover, h1, h2, h3, para, bullets, numbered, table, kv_table,
    code_block, callout, page_break, rule, BRAND_PRIMARY, DANGER, SUCCESS, WARNING
)


def phase_block(d, phase_id, title, duration, firebase_dep, goal):
    h2(d, f"{phase_id} — {title}")
    kv_table(d, [
        ["Duration", duration],
        ["Firebase dep replaced", firebase_dep],
        ["Goal", goal],
    ], label_width=1.8, value_width=4.7)


def build(out_path):
    d = new_doc()

    cover(
        d,
        title="Implementation Plan",
        subtitle="Atomic phase-by-phase migration from Firebase → Convex + Turso + Clerk. "
                 "Every phase ships a working product. Zero broken intermediate states.",
        version="2.0",
        status="Pending Approval"
    )

    # ── OVERVIEW ────────────────────────────────────────────────────────────
    h1(d, "Overview")
    para(d, "This plan covers 12 phases (P0 – P12) to migrate Bilu Store v1 (Firebase-based MVP) "
            "to a production-grade v2 stack. Each phase is atomic: it can be shipped as a working "
            "release without breaking the previous phase. Firebase dependencies are eliminated "
            "incrementally so there is no big-bang cutover risk.")
    callout(d, "Execution rule",
            "Ship at the end of any phase and nothing regresses. No half-finished migrations "
            "are acceptable. main is always releasable.")
    callout(d, "Cost rule",
            "Stay inside free tiers throughout. Each phase calls out the relevant ceiling "
            "and how we stay under it.", color=SUCCESS)

    # Phase legend
    h3(d, "Phase legend")
    table(d,
          ["Field", "Meaning"],
          [
              ["Duration", "Focused engineering days (1 engineer)"],
              ["Firebase-dep replaced", "What we remove in this phase"],
              ["Free-tier guardrail", "The free-tier ceiling and how we stay under it"],
              ["Acceptance", "Verifiable exit criteria — all boxes must be checked before merging"],
          ],
          col_widths=[1.6, 4.9])

    page_break(d)

    # ── P0 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P0", "Docs & Environment (YOU ARE HERE)",
                duration="1 day",
                firebase_dep="None",
                goal="PRD / SYSTEM / DESIGN / IMPLEMENTATION_PLAN approved; tooling installed.")
    h3(d, "Acceptance checklist")
    bullets(d, [
        "docs/PRD.md, docs/SYSTEM.md, docs/DESIGN.md, docs/IMPLEMENTATION_PLAN.md committed and reviewed.",
        "VS Code extensions present: Markdown All in One, Mermaid Editor, Draw.io.",
        "MCP server sequentialthinking reachable.",
        "security-audit-skill + database-schema-designer skills registered.",
        "Open PRD Questions (PRD §15) answered or explicitly deferred.",
    ])

    page_break(d)

    # ── P1 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P1", "Workspace & Token Foundation",
                duration="1 day",
                firebase_dep="None",
                goal="pnpm workspace ready for Clerk + Convex + Turso + shared types.")
    h3(d, "Steps")
    numbered(d, [
        "Introduce packages/shared/ with types.ts + tokens.ts (design tokens from DESIGN.md §2).",
        "Update mobile tsconfig.json + web/tsconfig.json with path aliases to packages/shared/*.",
        "Add @shopify/flash-list and nativewind + tailwind config.",
        "Replace any FlatList/ScrollView used for data lists with FlashList — leave layout scrolls alone.",
        "Wire Sentry (@sentry/react-native + @sentry/node for Convex adapter later).",
    ])
    callout(d, "Free-tier guardrail", "Sentry 5k events/mo — set sample rate 0.2 on non-error traces.")
    h3(d, "Acceptance")
    bullets(d, [
        "Mobile + web both build against the shared tokens module.",
        "Sentry init captures a test exception on both platforms.",
        "pnpm typecheck green.",
    ])

    page_break(d)

    # ── P2 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P2", "Clerk Auth Migration",
                duration="4 days",
                firebase_dep="firebase/auth, src/services/AuthService.ts, phone-verify screens, Google/Facebook SDKs.",
                goal="All sign-in, signup, phone OTP flows run through Clerk.")
    h3(d, "Steps")
    numbered(d, [
        "Create Clerk project; configure Google + Email OTP + Phone OTP providers.",
        "Install @clerk/clerk-expo (mobile) and @clerk/nextjs (admin web).",
        "Set up Clerk custom SMS provider webhook pointing to a placeholder Convex HTTP action (real in P3).",
        "Wrap app/_layout.tsx with <ClerkProvider>; wrap web root similarly.",
        "Rewrite app/auth/login.tsx, register.tsx, phone-verify.tsx using Clerk useSignIn / useSignUp.",
        "Replace AuthService with Clerk-backed version exposing the same function names — minimises call-site churn.",
        "Gate screens via useAuth(); redirect to /auth/login when unauthenticated.",
        "Keep existing Firestore users doc temporarily — AuthService continues to read/write until P4.",
        "Delete react-native-fbsdk-next and @react-native-google-signin/google-signin (Clerk handles Google natively).",
    ])
    callout(d, "Free-tier guardrail", "Clerk 10k MAU free. Disable unused providers to reduce spam signups.")
    h3(d, "Acceptance")
    bullets(d, [
        "Every auth screen works end-to-end with Clerk on a real device.",
        "Existing user list still loads (Firestore still the data source).",
        "Old Firebase Auth sign-in paths removed from code (no imports of firebase/auth).",
        "Security: ctx.auth equivalent enforced on the one temporary Convex stub action.",
    ])

    page_break(d)

    # ── P3 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P3", "Convex Backbone",
                duration="5 days",
                firebase_dep="firebase-functions, trigger scaffolding. Chapa/Telebirr services ported as pure modules.",
                goal="Convex deployed; one working chat + activity feed end-to-end.")
    h3(d, "Steps")
    numbered(d, [
        "pnpm create convex in the repo root; commit convex/ dir.",
        "Migrate functions/src/services/ChapaService.ts + TelebirrService.ts to convex/external/ (no Firestore deps).",
        "Define convex/schema.ts matching SYSTEM.md §3 (Convex tables only, no Turso yet).",
        "Implement convex/chat.ts mutations + reactive queries.",
        "Swap mobile src/services/ChatService.ts to use useMutation / useQuery from Convex. Firestore chats/messages dead.",
        "Implement convex/activity.ts (logActivity mutation, streamActivity admin query).",
        "Implement convex/clerkWebhook.ts handling user.created, user.updated, session.ended. User row creation still writes Firestore temporarily.",
        "Set up sendSmsOtp HTTP action calling AfricasTalking — wire to the Clerk custom SMS webhook from P2.",
        "Add convex/helpers/assertAuth.ts, assertAdmin.ts, withRateLimit.ts, requireReauth.ts.",
    ])
    callout(d, "Free-tier guardrail",
            "Convex 1M function calls + 8GB bandwidth / mo. Debounce activity logs client-side "
            "(flush every 10s, max 20 events/batch).")
    h3(d, "Acceptance")
    bullets(d, [
        "Chat fully functional via Convex; Firestore chat listeners removed.",
        "Admin web shows a live activity feed.",
        "functions/ directory is in 'maintenance only' — no new code lands there.",
        "All Convex mutations include assertAuth(ctx) helper (grep-verified).",
    ])

    page_break(d)

    # ── P4 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P4", "Turso Migration (Firestore → Turso)",
                duration="6 days",
                firebase_dep="Firestore — everything except chat (already moved in P3).",
                goal="All durable data in Turso. Firestore archived read-only.")
    h3(d, "Steps")
    numbered(d, [
        "Provision Turso DB (primary + one replica in eu-west); store URL + auth token in Convex env.",
        "Run all CREATE TABLE + CREATE INDEX statements from SYSTEM.md §2. Commit as convex/migrations/001_initial.sql.",
        "Build convex/turso.ts — the typed data-access layer (parametrized queries only — no interpolation).",
        "Write one-shot migration script scripts/migrate/firestoreToTurso.ts: paginate Firestore → transform → Turso in batches of 500 → print reconciliation report.",
        "Rewrite all mobile services (AdService, FavoriteService, ReviewService, UserService, ModerationService, SearchService) to call Convex actions. Delete Firestore imports from src/.",
        "Flip firestore.rules to deny-all on migrated collections. Keep chats/messages rules as rollback safety (remove in P5).",
        "Port onAdWrite, onReviewCreate, onPremiumExpiry, onAdExpiry triggers to Convex cron/mutation equivalents.",
    ])
    h3(d, "Policy decisions surfaced")
    bullets(d, [
        "Reviews without an associated deal are DISCARDED in migration. New rule: reviews must reference a completed deal.",
        "Existing escrow transactions at cutover → status='disputed', require admin manual finalization (OTP hash format change).",
    ])
    callout(d, "Free-tier guardrail",
            "Turso free: 9 GB storage, 1B row reads/mo, 25M writes/mo. Expect ~50 MB at current data size — comfortable.")
    h3(d, "Acceptance")
    bullets(d, [
        "Every service in src/services/ (excluding MediaService) has zero firebase/firestore imports.",
        "Mobile browse + favorites + post flow works against Turso end-to-end.",
        "Admin web user table loads from Turso.",
        "Reconciliation report shows 100% row count parity (or documented approved discrepancies).",
    ])

    page_break(d)

    # ── P5 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P5", "Unified Search Core",
                duration="3 days",
                firebase_dep="Firestore-fallback search path in SearchService.ts.",
                goal="Single convex/search.ts entry; Convex FTS powering it; Algolia adapter behind flag.")
    h3(d, "Steps")
    numbered(d, [
        "Implement convex/search.ts with a single exported search({ query, filters }) action using Convex withSearchIndex.",
        "Replace mobile SearchService with a thin wrapper that calls the Convex action.",
        "Implement Algolia adapter convex/search_algolia.ts behind process.env.SEARCH_ENGINE === 'algolia'. Syncing in listing mutations.",
        "Keyword debounce = 200 ms (existing — verify remains in place).",
        "Add location autocomplete via Google Places session tokens: src/hooks/usePlaces.ts.",
    ])
    callout(d, "Free-tier guardrail",
            "Convex FTS has no separate quota. Algolia free: 10k records + 10k ops/mo — index only ACTIVE listings; skip archived.")
    h3(d, "Acceptance")
    bullets(d, [
        "Search works without Algolia env set (pure Convex FTS).",
        "Toggling the env flag routes traffic to Algolia with no client change.",
        "Places autocomplete renders suggestions within 300 ms.",
    ])

    page_break(d)

    # ── P6 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P6", "Escrow Rewrite",
                duration="6 days",
                firebase_dep="functions/src/triggers/ (onInitiate*, onVerifyDelivery, onEscrowPayout, onRequestRefund), escrow_transactions + escrow_otps collections.",
                goal="Bcrypt-hashed 6-digit code, server countdown, auto-refund via scheduler.")
    h3(d, "Steps")
    numbered(d, [
        "Build convex/escrow.ts: initiate → creates Turso row, returns checkout URL; onPaymentConfirmed (HTTP action) → generates code, bcrypt-hashes, stores token_hash in Turso + plain code in Convex escrowCodes (TTL 10 min); verify → bcrypt.compare, rate-limited, 5-fail lockout; dispute; onCountdownExpiry (scheduled); releasePayout (scheduled).",
        "Build convex/payout.ts: send({ method, account, amount }) wrapping Chapa Transfer / Telebirr B2C.",
        "Build convex/crons.ts with escrowCodes.prune every 5 min.",
        "Wire mobile screens: Buy button on ad/[adId].tsx; buyer view escrow/[txId].tsx (countdown + QR + code); new seller code-entry screen escrow/[txId]/verify.tsx.",
        "Add reCAPTCHA v3 token collection on initiate and verify (server-side verify in P11).",
        "Delete src/services/EscrowService.ts Firebase callable wrappers; rewrite against Convex.",
    ])
    callout(d, "Security invariant",
            "token_hash is bcrypt(code, cost=10). Plain code lives only in Convex escrowCodes ≤ 10 min. "
            "Never stored in Turso as plaintext.", color=DANGER)
    callout(d, "Free-tier guardrail",
            "Bcrypt cost 10 ≈ 60 ms CPU — fine for < 20 verify/sec. Prune cron every 5 min is safe on Convex scheduler.")
    h3(d, "Acceptance")
    bullets(d, [
        "End-to-end: buyer pays → receives code → seller verifies → payout scheduled → payout sent (sandbox creds).",
        "Countdown expiry: pay → do nothing → refund fires at T + window.",
        "Brute-force: 6 wrong attempts → lockout; 7th rejected.",
        "DB inspection confirms token_hash stored, code only in Convex ≤ 10 min.",
        "Commission amounts match the rate table in PRD §4.4.",
    ])

    page_break(d)

    # ── P7 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P7", "Intelligence Layer",
                duration="4 days",
                firebase_dep="None directly — retires client-side sort hacks.",
                goal="Viral score live; nightly trust-score cron; soft-suppression after 3 partial views.")
    h3(d, "Steps")
    numbered(d, [
        "Implement convex/intel.ts: recordInteraction({ listingId, verb }) — throttled writeback to Turso (max 1/60s per listing); partialView({ listingId }) mutation + client-side batching helper src/hooks/usePartialViewTracker.ts.",
        "SQL view seller_trust_view that feeds the nightly cron.",
        "Cron intel.rebuildTrustScores → computes per seller, UPSERTs into seller_trust, pushes trust_score to Clerk metadata (batch API, respect 1000 calls/min).",
        "Update feed + search ranking to apply the combined score formula (PRD §5.4).",
        "Mobile: add Pro-multiplier read-time adjustment (1.5× viral score for pro sellers).",
    ])
    callout(d, "Viral score formula",
            "score = (views × 1 + clicks × 5 + saves × 8 + sales × 20) / (hoursPosted + 2)^1.5  "
            "Recalculated on every interaction via Convex mutation.")
    callout(d, "Free-tier guardrail",
            "Nightly cron batches 500 sellers to keep runtime < 30 s. "
            "Clerk metadata updates free-tier unlimited but rate-capped.")
    h3(d, "Acceptance")
    bullets(d, [
        "Feed ordering visibly reflects viral score within 1 min of 20 interactions on one listing.",
        "Nightly cron runs green; seller_trust populated for all sellers.",
        "Clerk publicMetadata.sellerTrustScore updated for at least one test user.",
    ])

    page_break(d)

    # ── P8 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P8", "Admin Control Plane",
                duration="5 days",
                firebase_dep="web/ dashboard's Firebase client.",
                goal="Full admin surface: activity feed, ban/shadow/impersonate, freeze, verification review, audit log.")
    h3(d, "Steps")
    numbered(d, [
        "Next.js 14 App Router scaffolding: sidebar per DESIGN.md §6.1; route guard requireAdmin().",
        "Replace web/src/services/* with Convex queries/mutations.",
        "Pages: /admin (Pulse/Ghost/Seller Health — Tremor charts), /admin/activity (live feed), /admin/users/[id] (ban/shadow/impersonate/set-tier), /admin/disputes (frozen deals), /admin/verification (Fayda review queue), /admin/audit (filterable log).",
        "Every admin mutation wrapped in assertAdmin(ctx) + audit(ctx, action, meta).",
        "Clerk User Impersonation (15-min limit) wired through @clerk/nextjs.",
        "Strip Fayda image URLs on approval/rejection (Cloudinary signed delete).",
    ])
    callout(d, "Free-tier guardrail", "Vercel free hobby tier OK for admin traffic. Clerk impersonation free.")
    h3(d, "Acceptance")
    bullets(d, [
        "Non-admin user hitting /admin is redirected to /.",
        "Ban user: target's session dies within 60 s; listings hidden.",
        "Impersonation auto-expires and logs both start and end audit events.",
        "Every admin action produces an audit_logs row.",
    ])

    page_break(d)

    # ── P9 ───────────────────────────────────────────────────────────────────
    phase_block(d, "P9", "Pro Tier & Subscriptions",
                duration="4 days",
                firebase_dep="None — greenfield.",
                goal="Pro subscription flow via Chapa; UI theme swap; feature gates across the app.")
    h3(d, "Steps")
    numbered(d, [
        "Chapa recurring-billing integration (or scheduled renewal via our own cron if Chapa lacks recurring — per PRD open question #3).",
        "convex/pro.ts: startCheckout, onChapaProPayment webhook, expireIfDue cron.",
        "Mobile: app/settings/pro.tsx upgrade screen + trial eligibility check.",
        "ThemeProvider reading Clerk metadata; crossfade on plan change (Deep Obsidian / Gold Pro theme).",
        "Gate all Pro features behind usePlan() === 'pro': ghost mode, first-look queue, ad-free UI (P10), unlimited listings, one-click re-list.",
        "TikTok referral deep link handler → 7-day trial activation (sets pro_trial_used = 1).",
    ])
    para(d, "First-look implementation: WHERE created_at < now - 30min OR user.plan = 'pro' — pure SQL, no queue table.", size=10, italic=True)
    callout(d, "Free-tier guardrail", "No external cost. First-look via SQL predicate only.")
    h3(d, "Acceptance")
    bullets(d, [
        "Pay for Pro sandbox → plan flips → theme swaps → features unlock.",
        "Expiry cron downgrades test user on schedule; listings beyond 5 archived.",
        "Deep link trial path grants 7 days and sets pro_trial_used = 1.",
    ])

    page_break(d)

    # ── P10 ──────────────────────────────────────────────────────────────────
    phase_block(d, "P10", "AdMob Integration & Ad-Free Gate",
                duration="2 days",
                firebase_dep="None.",
                goal="Ads shown to free users only.")
    h3(d, "Steps")
    numbered(d, [
        "Install react-native-google-mobile-ads; configure in app.json with the AdMob app ID.",
        "Create <FeedAdSlot /> — renders <BannerAd /> every 8th feed card, only when plan !== 'pro'.",
        "Interstitial between category switches, gated by a 3-min cooldown stored in Zustand uiStore.",
        "Verify GDPR-style consent flow (AdMob requires it even in Ethiopia for some APIs).",
    ])
    callout(d, "Free-tier guardrail", "AdMob is revenue-based; no cost.")
    h3(d, "Acceptance")
    bullets(d, [
        "Pro account sees zero ads.",
        "Free account sees banner every 8th card and interstitial at most every 3 min.",
        "AdMob test ads render in dev; prod IDs used in release builds only.",
    ])

    page_break(d)

    # ── P11 ──────────────────────────────────────────────────────────────────
    phase_block(d, "P11", "Security Hardening",
                duration="3 days",
                firebase_dep="None.",
                goal="reCAPTCHA v3 server-verified; rate limits in place; Sentry fully wired; secrets audited.")
    h3(d, "Steps")
    numbered(d, [
        "Server-side reCAPTCHA verification in convex/helpers/assertCaptcha.ts; score < 0.5 → throw captcha_failed.",
        "Apply withRateLimit() wrapper to all mutations per PRD §8.2.",
        "Configure Sentry with PII scrubbing: beforeSend strips email/phone/address from event payloads.",
        "Audit .env and Convex env vars: move any leaked secret into Clerk/Convex env; delete bilu-store-e1a06-firebase-adminsdk-fbsvc-73410c5a23.json from repo (committed key at repo root!).",
        "Rotate all keys ever touched by the leaked admin-SDK file.",
        "Add docs/SECURITY.md: what's stored where, key rotation cadence, incident response runbook.",
        "Run security-audit-skill on convex/escrow.ts + convex/payout.ts + Clerk webhook handler.",
    ])
    callout(d, "CRITICAL — leaked key",
            "bilu-store-e1a06-firebase-adminsdk-fbsvc-73410c5a23.json is committed to repo root. "
            "Purge with BFG / git filter-repo AND rotate the key before this phase closes.",
            color=DANGER)
    callout(d, "Free-tier guardrail", "reCAPTCHA free for up to 1M assessments/mo.")
    h3(d, "Acceptance")
    bullets(d, [
        "git log --all --full-history -- 'bilu-store-e1a06-firebase-adminsdk-fbsvc-*.json' shows file purged.",
        "Firebase service account key rotated.",
        "reCAPTCHA blocks a scripted curl hitting escrow.initiate.",
        "Rate limit test: 11 rapid mutations → 11th rejected.",
        "Sentry events visibly have no PII on sample capture.",
    ])

    page_break(d)

    # ── P12 ──────────────────────────────────────────────────────────────────
    phase_block(d, "P12", "Load Test & Launch Prep",
                duration="3 days",
                firebase_dep="Remaining Firebase scaffolding — functions/, firebase.json, firestore.rules, firestore.indexes.json, google-services.json, adminsdk json.",
                goal="Production-ready release; load tested; store listing assets finalized.")
    h3(d, "Steps")
    numbered(d, [
        "Load test with k6 or autocannon: feed read (200 rps / 2 min), escrow.verify (20 rps / 30 s — bcrypt pressure), intel.recordInteraction (100 rps batched).",
        "Verify Turso row-count / Convex function metrics are inside free tier at projected 1k DAU.",
        "Remove all remaining Firebase: functions/ deleted, imports scrubbed, firebase and @react-native-firebase/* removed from package.json.",
        "Finalize app-store assets: icon, screenshots, privacy policy + terms reflecting new stack.",
        "Run Android release build on 3 devices (Pixel 6a, Samsung A15, Tecno Camon 20). Capture TTI + frame drops.",
        "Sentry release tagging wired; source maps uploaded in CI.",
        "Write docs/RUNBOOK.md: common failures (Clerk webhook lag, Chapa webhook retries, Turso replica lag) and fixes.",
    ])
    callout(d, "Free-tier guardrail", "Load test uses dev Convex project — prod stays untouched by the spike.")
    h3(d, "Acceptance")
    bullets(d, [
        "Release APK built, signed, ≥ 99.5% crash-free on canary rollout (10% users, 48h).",
        "All Firebase references purged (grep -r 'firebase' --include='*.ts' returns only comments).",
        "docs/RUNBOOK.md present and reviewed by one other engineer.",
        "Store listing live.",
    ])

    page_break(d)

    # ── CROSS-PHASE CONVENTIONS ──────────────────────────────────────────────
    h1(d, "Cross-Phase Conventions")

    h3(d, "Branching strategy")
    bullets(d, [
        "main is always releasable.",
        "Each phase is a branch phase/Pn-<slug> merged via PR with: typecheck green, Jest + RN Testing Library green, at least one end-to-end happy path manually tested, no firebase/* imports added (CI rule from P4 onward).",
    ])

    h3(d, "Convex function template")
    code_block(d,
"""export const x = mutation({
  args: { /* v-validated */ },
  handler: async (ctx, args) => {
    const userId = await assertAuth(ctx);
    await assertCaptcha(ctx, args.captchaToken);
    await withRateLimit(ctx, `x:${userId}`, 10);
    // … business logic
    await audit(ctx, "x", { /* metadata */ });
  },
});""")

    h3(d, "Don't-do-this list")
    bullets(d, [
        "Do not add unused dependencies.",
        "Do not keep dead Firebase code 'for reference' — git history is the reference.",
        "Do not skip ops: cron jobs must be registered in convex/crons.ts, not kicked off ad-hoc.",
        "Do not write new Firestore code in any phase. Even for a 'quick fix'.",
        "Do not commit credentials. Ever. (See P11 for the one already committed that must be rotated.)",
    ])

    h3(d, "Rollback strategy")
    para(d, "Each phase branch is kept alive for 14 days post-merge. Rollback = revert the merge commit. "
            "Because Turso migration (P4) is destructive on Firestore (writes stop), we keep a Firestore export "
            "(NDJSON, encrypted) for 30 days. After 30 days the Firestore project can be deleted.")

    page_break(d)

    # ── DECISION BLOCKERS ───────────────────────────────────────────────────
    h1(d, "Decision Points That Block Phase-Start")
    table(d,
          ["Blocker", "Needed before", "Owner"],
          [
              ["AfricasTalking API key", "P3", "Founder"],
              ["Fayda interim plan", "P8", "Founder (manual review is the default)"],
              ["Chapa recurring-billing confirmed", "P9", "Founder"],
              ["Algolia free-tier confirmed", "P5", "Engineering"],
              ["Vercel domain for admin", "P8", "Founder"],
              ["App Store policy review (TikTok deep link)", "P9", "Founder"],
          ],
          col_widths=[3.5, 1.5, 1.5])
    callout(d, "All resolved →", "Green light to execute P1.", color=SUCCESS)

    # ── TIMELINE SUMMARY ────────────────────────────────────────────────────
    h1(d, "Timeline Summary")
    table(d,
          ["Phase", "Focus", "Days", "Running total"],
          [
              ["P0", "Docs & environment", "1", "1"],
              ["P1", "Workspace & tokens", "1", "2"],
              ["P2", "Clerk auth migration", "4", "6"],
              ["P3", "Convex backbone", "5", "11"],
              ["P4", "Turso migration", "6", "17"],
              ["P5", "Unified search", "3", "20"],
              ["P6", "Escrow rewrite", "6", "26"],
              ["P7", "Intelligence layer", "4", "30"],
              ["P8", "Admin control plane", "5", "35"],
              ["P9", "Pro tier", "4", "39"],
              ["P10", "AdMob", "2", "41"],
              ["P11", "Security hardening", "3", "44"],
              ["P12", "Load test & launch", "3", "47"],
          ],
          col_widths=[0.7, 3.0, 0.8, 1.5])
    callout(d, "Note",
            "47 engineering days = ~10 calendar weeks for one engineer. "
            "Phases 3–6 can be parallelized with a second engineer to compress to ~7 weeks.")

    # ── DOCUMENT CONTROL ────────────────────────────────────────────────────
    h1(d, "Document Control")
    kv_table(d, [
        ["Document ID", "BS-IMPL-004"],
        ["Authors", "Engineering"],
        ["Approvers", "Eng Lead, Founder"],
        ["Review cadence", "Updated after each phase retrospective"],
        ["Companion docs", "PRD.docx, SYSTEM.docx, DESIGN.docx"],
        ["Last updated", "2026-04-17"],
    ])

    d.save(out_path)
    print(f"IMPLEMENTATION_PLAN.docx written: {out_path}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "IMPLEMENTATION_PLAN.docx"
    build(out)
