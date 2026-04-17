"""Build DESIGN.docx — 10/10 standard."""
from helpers import (
    new_doc, cover, h1, h2, h3, para, bullets, numbered, table, kv_table,
    code_block, callout, page_break, BRAND_PRIMARY, WARNING
)


def build(out_path):
    d = new_doc()

    cover(
        d,
        title="Design System & Interface Specification",
        subtitle="Tokens, components, role-based views, and the rules that keep the UI quiet by default — "
                 "loud only on action.",
        version="2.0",
        status="Pending Approval"
    )

    # ── 1. PURPOSE ──────────────────────────────────────────────────────────
    h1(d, "1. Purpose")
    para(d,
         "This document defines the visual and interaction system for Bilu Store v2 across the mobile app "
         "(React Native + NativeWind) and the admin web dashboard (Next.js + Tailwind + Shadcn/ui). It is "
         "the single source of truth for tokens, components, role-based views, motion, and accessibility. "
         "Any UI claim not consistent with this document is a bug — fix the doc or fix the UI, but never "
         "let them drift.")

    callout(d, "Audience", "Designers, mobile engineers, web engineers, QA. PMs read sections 1, 4, 8.")

    # ── 2. DESIGN PRINCIPLES ────────────────────────────────────────────────
    h1(d, "2. Design Principles")
    table(d,
          ["#", "Principle", "What it means in practice"],
          [
              ["1", "Quiet by default, loud on action",
               "White / dark surfaces. Orange (or Pro gold) only on the thing the user is about to do."],
              ["2", "Weightless motion",
               "All transitions 160–200 ms. One-shot celebrations only on completed actions (escrow verified, Pro unlocked)."],
              ["3", "Trust signals are first-class",
               "Verified badges, escrow status, countdown timers always visible — never tucked behind taps."],
              ["4", "Pro earns its gold",
               "Pro skin is not cosmetic. It crossfades only after a real plan upgrade. Free users never glimpse it."],
              ["5", "Accessibility is not a mode",
               "WCAG AA contrast. 44px tap targets. Reduce-motion respected. Dynamic type capped at 1.3×."],
          ],
          col_widths=[0.4, 2.0, 4.1])

    page_break(d)

    # ── 3. DESIGN TOKENS ────────────────────────────────────────────────────
    h1(d, "3. Tokens (single source of truth)")
    para(d, "All tokens live in packages/shared/tokens.ts. Mobile imports via NativeWind theme; "
            "web via tailwind.config.ts. No hex anywhere else in the codebase.", italic=True, size=10)

    h3(d, "3.1 Color — Free theme (default)")
    table(d,
          ["Token", "Hex", "Usage"],
          [
              ["brand.primary", "#FF6B35", "CTAs, active tab, FAB, primary buttons"],
              ["brand.primaryPressed", "#E4561E", "pressed state"],
              ["surface.background", "#FFFFFF", "screen background"],
              ["surface.raised", "#F7F8F9", "cards, sheets, chips"],
              ["surface.line", "#E6E8EB", "1px borders, dividers"],
              ["text.primary", "#0F172A", "headings, body"],
              ["text.secondary", "#475569", "captions, helper text"],
              ["text.muted", "#94A3B8", "timestamps, placeholders"],
              ["semantic.success", "#12B76A", "verified, completed deals"],
              ["semantic.warning", "#F59E0B", "pending, countdown < 2h"],
              ["semantic.danger", "#EF4444", "refund, error, remove"],
              ["semantic.info", "#2563EB", "neutral status, links"],
              ["overlay.scrim", "rgba(15,23,42,0.56)", "modal backdrops"],
          ],
          col_widths=[2.0, 1.6, 2.9])

    h3(d, "3.2 Color — Pro theme (plan = pro)")
    table(d,
          ["Token", "Hex", "Usage"],
          [
              ["pro.background", "#1A1A2E", "screen background"],
              ["pro.surface", "#21213A", "cards"],
              ["pro.accent", "#D4AF37", "all CTAs, badges, shimmer"],
              ["pro.accentSoft", "#E8C76A", "hover/focus"],
              ["pro.textPrimary", "#F5F6FA", "headings, body"],
              ["pro.textSecondary", "#A5A9BE", "captions"],
              ["pro.line", "#2F2F52", "1px borders"],
          ],
          col_widths=[2.0, 1.6, 2.9])

    h3(d, "3.3 Spacing (strict 8-pt grid)")
    para(d, "Allowed values: 0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Anything else is a bug. "
            "Lint rule blocks PRs that introduce arbitrary numbers.", size=10)

    h3(d, "3.4 Radius")
    table(d,
          ["Token", "Value", "Applies to"],
          [
              ["radius.button", "8", "buttons"],
              ["radius.chip", "10", "chips, filter pills"],
              ["radius.card", "12", "listing cards, sheets"],
              ["radius.sheet", "16", "bottom sheet top corners"],
              ["radius.fab", "9999", "perfect circle FAB"],
          ],
          col_widths=[1.6, 0.8, 4.1])

    h3(d, "3.5 Typography (Inter only, weights 400/600)")
    table(d,
          ["Token", "Size / Line", "Use"],
          [
              ["display", "28 / 34", "hero headings"],
              ["h1", "22 / 28", "screen titles"],
              ["h2", "18 / 24", "section headings"],
              ["body", "15 / 22", "default body"],
              ["caption", "13 / 18", "metadata"],
              ["micro", "11 / 16", "badges, pills"],
          ],
          col_widths=[1.4, 1.2, 3.9])

    h3(d, "3.6 Elevation")
    table(d,
          ["Token", "Spec"],
          [
              ["elev.1", "shadowOpacity: 0.05, shadowRadius: 4, offset: (0,2)"],
              ["elev.2", "shadowOpacity: 0.08, shadowRadius: 10, offset: (0,4)"],
              ["elev.proGold", "shadowColor: #D4AF37, shadowOpacity: 0.35, shadowRadius: 14, offset: (0,6)"],
          ],
          col_widths=[1.6, 4.9])

    h3(d, "3.7 Iconography")
    para(d, "Phosphor only. Weight = regular by default; fill only when a control is active (tab bar). "
            "No mixing icon families in a single screen.", size=10)

    h3(d, "3.8 Motion catalog")
    table(d,
          ["Event", "Animation", "Haptic", "Duration"],
          [
              ["Button press", "scale 0.98", "light", "80 ms"],
              ["Tab change", "fade", "—", "120 ms"],
              ["Sheet open", "slide-up spring (damping 18)", "—", "240 ms"],
              ["Favorite toggle", "heart bounce", "light", "300 ms"],
              ["Payment success", "Lottie check", "success notif", "900 ms"],
              ["Escrow verified", "Lottie gold burst", "medium", "1.2 s"],
              ["Pro unlocked", "theme crossfade + gold shimmer", "medium", "240 ms + 4s shimmer loop"],
              ["Error shake", "horizontal 6px", "error notif", "120 ms"],
          ],
          col_widths=[1.6, 1.9, 1.0, 1.0])

    callout(d, "Rule", "Never stack one celebratory animation on top of another. One per action.")

    page_break(d)

    # ── 4. ADMIN INTERFACE OVERVIEW ─────────────────────────────────────────
    h1(d, "4. Admin Interface (Next.js dashboard)")

    h3(d, "4.1 Layout model")
    para(d, "Two-pane shell: persistent sidebar (240 px), top bar (64 px), main scroll area. Dark theme "
            "by default. Sidebar collapses to 64 px icons-only on viewports < 1100 px.")

    code_block(d,
"""┌─────────────────────────────────────────────────────────┐
│ Sidebar (240 px)       │ Topbar (search · actor chip)   │
│                        ├────────────────────────────────│
│ ▸ Pulse                │                                │
│ ▸ Ghost                │   Main content                 │
│ ▸ Seller Health        │   · Live activity feed         │
│ ▸ Disputes             │   · Tables + Tremor charts     │
│ ▸ Verification queue   │   · Action drawers             │
│ ▸ Users                │                                │
│ ▸ Audit log            │                                │
│ ▸ Settings             │                                │
└─────────────────────────────────────────────────────────┘""")

    h3(d, "4.2 Navigation model")
    bullets(d, [
        "Sidebar = primary navigation. Reflects nine top-level views.",
        "Top bar = global search (users / listings / deals by ID), notification bell, current admin chip "
        "(name + role + impersonation indicator).",
        "Action drawers slide from the right (480 px) for: Ban user, Freeze deal, Edit verification, View audit.",
        "Breadcrumbs render only inside Users → user detail (otherwise: page title).",
    ])

    h3(d, "4.3 Surface inventory")
    table(d,
          ["Surface", "Component (Shadcn)", "Density"],
          [
              ["Sidebar", "NavigationMenu vertical", "Medium"],
              ["Activity feed", "ScrollArea + custom row", "High"],
              ["User table", "DataTable + Pagination", "High"],
              ["Charts", "Tremor BarList / AreaChart / DonutChart", "Medium"],
              ["Action drawer", "Sheet (right)", "Low (one form)"],
              ["Confirmation dialog", "AlertDialog", "Low"],
              ["Toast", "Sonner", "Low"],
          ],
          col_widths=[1.7, 2.4, 2.4])

    page_break(d)

    # ── 5. ROLE-BASED VIEW MATRIX ───────────────────────────────────────────
    h1(d, "5. Role-Based View Matrix")
    para(d, "Authoritative — UI behavior must match this table. Engineers verify with the perms-snapshot "
            "test suite per role.", italic=True, color=BRAND_PRIMARY, size=10)

    table(d,
          ["Surface / Capability", "Buyer", "Seller (Tier 2)", "Seller Pro", "Admin (web)"],
          [
              ["Bottom tabs", "Home, Search, Post (CTA), Chat, Profile",
               "Home, Search, Post, Chat, Profile",
               "Home, Search, Post, Chat, Profile",
               "n/a (web)"],
              ["Post FAB", "Tap → verify prompt", "Tap → form", "Tap → form", "n/a"],
              ["Listing card — viral score", "Hidden", "Own only", "Own + 1.5× preview", "All listings"],
              ["Listing card — premium gold border", "Visible", "Visible", "Visible (own)", "Visible + admin badge"],
              ["Ad banner in feed (every 8th)", "Visible", "Visible", "Hidden", "Hidden"],
              ["Search filters — Verified Sellers Only", "Hidden (Pro)", "Hidden", "Visible", "Visible"],
              ["Pricing/upgrade CTA", "Visible", "Visible (commission savings)", "Hidden", "Hidden"],
              ["Profile screen — Ghost Mode toggle", "Hidden", "Hidden", "Visible", "Hidden"],
              ["Profile screen — Heatmap analytics", "Hidden", "Hidden", "Visible", "Visible (any seller)"],
              ["Listing detail — Phone reveal", "Visible (button)", "n/a (own)", "Hidden until buyer reveals", "Always visible"],
              ["Escrow code QR", "Visible (own deal)", "Hidden", "Hidden", "Read-only view"],
              ["Escrow code entry", "Hidden", "Visible (own deal)", "Visible (own deal)", "Hidden"],
              ["Dispute button", "Visible until verified", "Hidden", "Hidden", "Visible (freeze action)"],
              ["My Deals tab", "Buyer side only", "Seller side only", "Seller side only", "All deals"],
              ["Audit log — own actions", "Last 7d", "Last 30d", "Last 30d", "All time"],
              ["Web /admin", "Redirect to /", "Redirect", "Redirect", "Render dashboard"],
          ],
          col_widths=[2.2, 1.0, 1.2, 1.2, 1.2])

    callout(d, "Test gate", "Snapshot test suite renders each surface as each role and asserts visibility "
            "+ enabled state. PR fails if matrix and tests disagree.")

    page_break(d)

    # ── 6. COMPONENT INVENTORY ──────────────────────────────────────────────
    h1(d, "6. Component Inventory")

    h3(d, "6.1 Mobile components (must exist in src/components/)")
    table(d,
          ["Component", "Props (essentials)", "Notes"],
          [
              ["AdCard", "ad: Ad, density: 'compact'|'hero', isPro: boolean", "Hero variant only on Pro skin"],
              ["AdImageCarousel", "urls: string[], onIndexChange?", "Reanimated FlatList; cap aspect 16:10"],
              ["PriceDisplay", "amount: number, currency, negotiable", "Strikes through if discounted"],
              ["ConditionBadge", "condition: enum", "5 fixed conditions; line-art icon"],
              ["PremiumBadge", "tier: PremiumTierId", "Gold border; Pro variant glows"],
              ["StatusBadge", "status: AdStatus", "Color-coded; admins see all states"],
              ["FavoriteButton", "adId, optimistic: true", "Heart bounce 300ms; light haptic"],
              ["RatingStars", "value: number, size", "Half-star supported; readonly + editable variants"],
              ["FilterSheet", "filters: SearchFilters, onChange", "Bottom sheet; sticky Apply CTA"],
              ["LocationPicker", "value, onChange", "Google Places autocomplete with session token"],
              ["ImagePicker", "max: number, onChange", "Compresses before passing back"],
              ["SearchBar", "value, onChange, debounceMs=200", "Pro skin: glassmorphism"],
              ["EmptyState", "icon, title, body, primaryAction?", "Lottie variant available"],
              ["Toast", "message, kind: 'success'|'error'|'info'", "Auto-dismiss 3s; queueable"],
              ["Skeleton", "shape: 'card'|'line'|'avatar', count?", "Shimmer animation"],
              ["AnimatedStateIcon", "state, size", "Used for escrow status timeline"],
              ["AppIcon", "name, size, weight, color", "Phosphor wrapper — only icon import allowed"],
              ["OnboardingOverlay", "steps: Step[]", "Used for first-run + Pro unlock celebration"],
              ["ChatBubble / ChatListItem", "message, isOwn", "Reactive via Convex"],
              ["DrawerContent", "items, footer", "Right-side drawer for profile/settings"],
              ["ErrorBoundary", "fallback?, sentryTags?", "Wraps every screen root"],
              ["EscrowCountdown", "deal: EscrowDeal", "Server-time aware; warning ≤ 2h"],
              ["EscrowCodeInput", "onSubmit, locked: boolean", "5-attempt counter visible"],
          ],
          col_widths=[1.7, 2.4, 2.4])

    h3(d, "6.2 Web components (web/src/components/)")
    table(d,
          ["Component", "Purpose"],
          [
              ["AdminShell", "Sidebar + topbar layout"],
              ["ActivityFeed", "Live Convex subscription, virtualized list"],
              ["UserTable", "Sortable, filterable, RBAC-aware actions"],
              ["DealRow", "Inline status + freeze action"],
              ["VerificationCard", "Image preview + approve/reject form"],
              ["AuditTimeline", "Vertical timeline with diff payloads"],
              ["StatChart", "Tremor wrapper with theme tokens"],
              ["ImpersonateBanner", "Persistent banner during 15-min impersonation"],
          ],
          col_widths=[2.0, 4.5])

    page_break(d)

    # ── 7. STATE & ERROR PATTERNS ───────────────────────────────────────────
    h1(d, "7. State & Error Handling Patterns")

    h3(d, "7.1 Loading states")
    bullets(d, [
        "First load: Skeleton shimmer in the shape of the destination content (cards, rows, avatars).",
        "Subsequent / refresh: Inline 16px spinner anchored to the action that triggered it.",
        "Background refetch: No spinner; results swap with 120 ms crossfade.",
    ])

    h3(d, "7.2 Empty states")
    bullets(d, [
        "Lottie 160 px (empty_cart_particles).",
        "Heading: human, not technical (\"We looked everywhere…\" not \"No results\").",
        "One primary action only (\"Reset filters\" / \"Post the first listing\").",
    ])

    h3(d, "7.3 Error states")
    table(d,
          ["Class", "Pattern", "Example"],
          [
              ["Recoverable network", "Toast + Retry CTA", "\"Couldn't reach server. Tap to retry.\""],
              ["Auth required", "Redirect to /auth/login with redirect_after_auth", "Tap-to-buy when signed out"],
              ["Validation", "Inline below the offending field, red, 13px", "\"Code must be 6 digits\""],
              ["Permission denied", "Modal with action explanation + Close", "\"Only the seller can verify the delivery code.\""],
              ["Rate-limited", "Toast + countdown till retry", "\"Too many attempts. Try again in 4:38\""],
              ["Catastrophic / boundary", "Full-screen ErrorBoundary; logs to Sentry; Reload button", "Unhandled exception"],
              ["Payment failed", "Modal with provider-specific copy + alt-method CTA", "\"Chapa declined the card. Try Telebirr?\""],
          ],
          col_widths=[1.4, 2.5, 2.6])

    h3(d, "7.4 Optimistic updates")
    bullets(d, [
        "Allowed for: favorites toggle, follow seller, mark message read.",
        "Forbidden for: escrow verify, payment, ban, plan change. These must reflect server state only.",
        "On rollback: animated reversal + Toast (\"Couldn't save — try again\").",
    ])

    page_break(d)

    # ── 8. RESPONSIVE & ACCESSIBILITY ───────────────────────────────────────
    h1(d, "8. Responsive & Accessibility")

    h3(d, "8.1 Mobile responsive")
    bullets(d, [
        "Designed for 360–430 px wide viewport (Android phone median).",
        "Tablet (≥ 600 px): two-column listing grid; FAB stays bottom-right.",
        "Landscape: same as portrait, no special layout — content reflows.",
        "Notches / display cutouts: respect SafeAreaView on all root screens.",
    ])

    h3(d, "8.2 Web admin responsive (Next.js)")
    table(d,
          ["Breakpoint", "Layout"],
          [
              ["≥ 1280 px", "Full sidebar 240, content 1040 max"],
              ["1100–1279 px", "Full sidebar; content fluid"],
              ["768–1099 px", "Icons-only sidebar (64 px)"],
              ["< 768 px", "Sidebar becomes top hamburger drawer; tables horizontally scrollable"],
          ],
          col_widths=[2.0, 4.5])

    h3(d, "8.3 Accessibility (WCAG 2.1 AA)")
    bullets(d, [
        "Color contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text. Automated check in CI.",
        "Tap targets ≥ 44 × 44 px; nothing smaller, ever.",
        "Every input has a visible label or aria-label; placeholder is never the only label.",
        "Dynamic type cap: 1.3× of base; QA on extra-large device font setting.",
        "Reduce-motion respected via AccessibilityInfo / prefers-reduced-motion: disable all loops, replace "
        "celebrations with static success state.",
        "Screen reader: TalkBack tested on Pixel 6a per major release; VoiceOver pass deferred to iOS milestone.",
        "Keyboard nav (web): every action reachable via Tab; focus ring uses brand.primary outline 2px.",
        "Forms: errors announced via aria-live=\"polite\" on submit.",
    ])

    h3(d, "8.4 Internationalization readiness")
    bullets(d, [
        "Strings extracted to packages/shared/i18n/en.json (Amharic file scaffolded but empty for v2).",
        "No hard-coded strings in components.",
        "Date/number formatting via Intl APIs — ETB locale.",
        "RTL-safe: no left/right hard-coding; use start/end Tailwind utilities.",
    ])

    page_break(d)

    # ── 9. SCREEN FLOWS (DIAGRAMS) ──────────────────────────────────────────
    h1(d, "9. Screen Flow Diagrams")
    para(d, "Diagrams kept as Mermaid in the markdown companions; rendered into the design board (Figma/Penpot). "
            "The list below is exhaustive — any new flow added to the product must add an entry here.", size=10)

    table(d,
          ["Flow", "Owning screen", "Status"],
          [
              ["Auth (Google / Email OTP / Phone OTP)", "app/auth/*", "Approved"],
              ["Buy-flow (escrow happy path)", "app/ad/[adId] → app/escrow/[txId]", "Approved"],
              ["Seller verify code", "app/escrow/[txId]/verify", "Approved"],
              ["Post a listing", "app/post/create", "Approved"],
              ["Edit a listing", "app/post/edit/[adId]", "Approved"],
              ["Search + filters", "app/(tabs)/search → search-results", "Approved"],
              ["Pro upgrade", "app/settings/pro", "Pending"],
              ["Verification (Tier 1→2, 2→3)", "app/verification/*", "Pending"],
              ["Admin activity feed → action", "web/admin/activity → user/[id]", "Approved"],
              ["Dispute resolution (admin)", "web/admin/disputes/[id]", "Pending"],
          ],
          col_widths=[2.4, 2.6, 1.5])

    # ── 10. DESIGN DECISIONS LOG ────────────────────────────────────────────
    h1(d, "10. Design Decisions Log")
    table(d,
          ["#", "Decision", "Rejected alternative", "Rationale"],
          [
              ["DD-1", "Inter only, weights 400 + 600", "Multi-weight (300/400/500/600/700)",
               "Simplicity + bundle size. Two weights are enough for hierarchy."],
              ["DD-2", "Phosphor icons", "Material Icons; Heroicons",
               "Phosphor pairs better with Inter; line-art consistency; one weight per active state."],
              ["DD-3", "NativeWind over StyleSheet", "Plain RN StyleSheet",
               "Shared tokens with web; cleaner than two parallel theme systems."],
              ["DD-4", "Pro = full theme swap (not just accent recolor)", "Subtle pro accent only",
               "Subscribers must feel an upgrade — accent-only changes tested poorly in dogfood."],
              ["DD-5", "Admin web only", "Mobile admin tab",
               "Reduces attack surface; admin actions need notes/keyboard."],
              ["DD-6", "Bottom sheet for filters (not modal)", "Full-screen modal",
               "Keeps results visible while filtering — feels lighter."],
              ["DD-7", "FAB for Post (not tab)", "Tab item",
               "FAB is iconic for marketplace post action; tabs reserved for navigation."],
              ["DD-8", "FlashList for all data lists", "FlatList",
               "Large memory wins; near drop-in replacement."],
              ["DD-9", "Lottie for celebrations only", "Lottie for empty states + celebrations",
               "Lottie in empty state was distracting; static illustration replaced it."],
              ["DD-10", "Two-pane admin shell, not three-pane", "VS Code style left/center/right",
               "Three panes too dense for our six top-level views."],
          ],
          col_widths=[0.5, 1.7, 1.8, 2.5])

    # ── 11. OPEN QUESTIONS ──────────────────────────────────────────────────
    h1(d, "11. Open Questions Log (design)")
    table(d,
          ["ID", "Question", "Owner", "Due"],
          [
              ["DQ-1", "Is the Pro gold accessible at WCAG AA on dark surface?", "Design", "2026-04-22"],
              ["DQ-2", "Can the Lottie escrow_gold_burst run under reduce-motion as a static image?", "Design", "2026-04-23"],
              ["DQ-3", "Heatmap analytics city granularity — 7 cities or full kebele?", "PM + Design", "2026-04-30"],
              ["DQ-4", "Web public-browse mode — same component library or marketing site?", "Founder", "2026-05-05"],
              ["DQ-5", "Amharic typography — does Inter render Ge'ez script acceptably or do we need Noto Sans Ethiopic?", "Design", "2026-05-15"],
              ["DQ-6", "Phone OTP screen — show country picker or hardcode +251?", "PM", "2026-04-22"],
          ],
          col_widths=[0.5, 4.0, 1.2, 0.8])

    # ── 12. DELIVERABLES CHECKLIST ──────────────────────────────────────────
    h1(d, "12. Pre-build Deliverables Checklist")
    bullets(d, [
        "packages/shared/tokens.ts exporting all tokens in §3",
        "Figma (or Penpot) design board with all flows in §9 as high-fi frames",
        "Lottie files: success_check.json, empty_cart_particles.json, escrow_gold_burst.json, avatar_shimmer.json",
        "Phosphor icon list (name + weight) per screen",
        "Theme swap verified on Pixel 6a, Samsung A15, Tecno Camon 20",
        "WCAG contrast checker run; failures fixed before P1 begins",
    ])

    h3(d, "Document control")
    kv_table(d, [
        ["Document ID", "BS-DESIGN-002"],
        ["Authors", "Design + Engineering"],
        ["Approvers", "Founder, PM, Eng Lead"],
        ["Companion docs", "PRD.docx, SYSTEM.docx, IMPLEMENTATION_PLAN.docx"],
        ["Next review", "2026-04-24"],
    ])

    d.save(out_path)
    print(f"DESIGN.docx written: {out_path}")


if __name__ == "__main__":
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "DESIGN.docx"
    build(out)
