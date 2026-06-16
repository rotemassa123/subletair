# Subletair — Top-5 Feature UI/UX Test Plan

Target: `http://localhost:5174` (Marketplace). QA focus is **UI/UX level**: hover
animations, transitions, transform/motion, CSS layout, sizing, responsive behavior,
focus/keyboard, and visual state changes — not just functional pass/fail.

Tooling: Playwright MCP. Computed styles & geometry asserted via `browser_evaluate`
(`getComputedStyle`, `getBoundingClientRect`), motion via before/after transform reads,
visual diffs via screenshots, responsiveness via `browser_resize`.

---

## Feature 1 — Global Search Bar
- **1.1 Layout & sizing** — pill container has rounded corners, single row, segments
  (Where / Check in / Who / Search) align on one baseline; search orb is circular
  (width == height, border-radius ~50%).
- **1.2 "Where" input** — focusable, accepts text, placeholder "Search destinations",
  caret appears, typing updates value.
- **1.3 Hover affordance** — hovering Check in / Who segments changes background
  (transition present, non-zero transition-duration).
- **1.4 Search orb hover** — background-color / scale transition on hover; cursor pointer.
- **1.5 Commit search** — typing a destination + clicking Search updates the H1 heading
  and triggers a listings fetch (network/result change).
- **1.6 Keyboard** — Enter in "Where" commits search; Tab order reaches all segments.

## Feature 2 — Category Strip
- **2.1 Layout** — horizontal row, items evenly spaced, "All" present and default-active.
- **2.2 Active state styling** — selected category visually distinct (color/underline/
  weight/border differs from inactive).
- **2.3 Hover** — hovering an inactive category produces a transition (opacity/color/bg).
- **2.4 Click filters grid** — clicking a category changes the rendered card set
  (count or titles differ) and updates active styling.
- **2.5 Overflow behavior** — on narrow viewport, strip scrolls horizontally rather
  than wrapping/clipping (check scrollWidth > clientWidth or wrap rule).

## Feature 3 — Listing (Property Card) Grid
- **3.1 Grid responsiveness** — columns adapt: ~4-up desktop (≥1200), fewer at tablet
  (~768) and 1–2 at mobile (~390). Assert column count via card bounding boxes per row.
- **3.2 Card anatomy** — each card has image, optional badge, title, rating w/ star,
  location·dates line, price strong + "night".
- **3.3 Card hover motion** — hover triggers transform (lift/scale) and/or shadow
  transition; assert transform or box-shadow changes on hover.
- **3.4 Image aspect ratio** — card photos share a consistent aspect ratio (e.g. ~1:1
  or 20:19); border-radius applied; no distortion (naturalWidth present).
- **3.5 Image load** — all card images resolve (naturalWidth > 0), no broken images.

## Feature 4 — Wishlist / Save
- **4.1 Heart presence & sizing** — every card has a Save button, top-right of image,
  adequate hit area (≥24px).
- **4.2 Toggle visual** — clicking flips the heart fill (filled vs outline / color
  change); clicking again reverts.
- **4.3 Animation** — fill change has a transition or transform pulse (non-zero
  transition or scale on click).
- **4.4 Hover** — hover scales/darkens the heart (transition present).
- **4.5 Optimistic + persistence** — state flips immediately on click (optimistic);
  remains after a short wait (server reconcile doesn't revert on success).

## Feature 5 — Top Navigation
- **5.1 Layout** — logo left, product tabs centered, utilities (host/language/account)
  right; single row, vertically centered.
- **5.2 Product tabs** — Stays / Experiences / Services present; active tab visually
  distinct; clicking changes active state.
- **5.3 Hover** — nav buttons + utility icons show hover transition (bg/color).
- **5.4 Account menu** — account button has visible affordance (border/shadow), pointer.
- **5.5 Sticky / position** — header stays at top on scroll (position fixed/sticky) or
  documented otherwise.

---

## Pass/Fail Recording
Each test: PASS / FAIL / WARN with the measured evidence (computed value, px, before→after).
WARN = works but deviates from Airbnb-grade polish (e.g. missing transition, weak active state).
