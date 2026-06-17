---
name: Subletair
description: A warm, photo-first two-sided sublet marketplace, out-polishing the category leader.
colors:
  primary: "#ff385c"
  primary-active: "#e00b41"
  primary-disabled: "#ffd1da"
  luxe: "#460479"
  plus: "#92174d"
  canvas: "#ffffff"
  surface-soft: "#f7f7f7"
  surface-strong: "#f2f2f2"
  hairline: "#dddddd"
  hairline-soft: "#ebebeb"
  border-strong: "#c1c1c1"
  ink: "#222222"
  body: "#3f3f3f"
  muted: "#6a6a6a"
  muted-soft: "#929292"
  on-primary: "#ffffff"
  error-text: "#c13515"
  legal-link: "#428bff"
typography:
  rating-display:
    fontFamily: "Subletair Cereal VF, Circular, Inter, system-ui, sans-serif"
    fontSize: "64px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-1px"
  display-xl:
    fontFamily: "Subletair Cereal VF, Circular, Inter, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: "0"
  display-md:
    fontFamily: "Subletair Cereal VF, Circular, Inter, system-ui, sans-serif"
    fontSize: "21px"
    fontWeight: 700
    lineHeight: 1.43
    letterSpacing: "0"
  title-md:
    fontFamily: "Subletair Cereal VF, Circular, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0"
  body-md:
    fontFamily: "Subletair Cereal VF, Circular, Inter, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  body-sm:
    fontFamily: "Subletair Cereal VF, Circular, Inter, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
    letterSpacing: "0"
  uppercase-tag:
    fontFamily: "Subletair Cereal VF, Circular, Inter, system-ui, sans-serif"
    fontSize: "8px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "0.32px"
rounded:
  xs: "4px"
  sm: "8px"
  md: "14px"
  lg: "20px"
  xl: "32px"
  full: "9999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  base: "16px"
  lg: "24px"
  xl: "32px"
  xxl: "48px"
  section: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    padding: "14px 24px"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
  search-orb:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.full}"
    size: "48px"
  card-listing:
    backgroundColor: "{colors.surface-card}"
    rounded: "{rounded.md}"
  chip-category:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted}"
    rounded: "{rounded.full}"
  chip-category-active:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
---

# Design System: Subletair

## 1. Overview

**Creative North Star: "The Open Hero, Dense Below"**

Subletair is a two-sided sublet marketplace that earns trust the way a good host
does: by getting the details right and then getting out of the way. The page breathes
at the top (a tall pill search bar floating over a white canvas) and tightens into a
calm, photo-led grid below. That rhythm, open hero giving way to dense marketplace, is
the identity. Chrome recedes; the listing photography is the loudest thing on almost
every screen. The single brand voltage, a Rausch-style coral, appears rarely and
deliberately, so that when it does it reads as a warm gesture, not decoration.

The system runs on one typeface across the entire scale and exactly one elevation tier
plus flat. This restraint is the point: heft comes from photography and spacing, not
from heavy weights, shadows, or color. The one genuinely loud moment in the whole
system is the 64px rating number on a listing page; everywhere else, type stays modest
(weights 400 to 700, sizes clustered 14 to 28px).

What this system rejects: generic AI/SaaS slop (identical icon-card grids, gradient
text, hero-metric templates, purple-gradient startup chrome), and being a literal
Airbnb clone. We borrow the proven information architecture (pill search, category
strip, photo-first card grid) but win on craft, warmth, and motion rather than copying
the incumbent's exact palette and chrome.

**Key Characteristics:**
- White canvas, photography-led, coral as a rare accent
- One typeface, one shadow tier, soft radii everywhere except the body grid
- Open editorial top, dense calm marketplace below
- Tactile and confident controls: things feel pressable and responsive
- Trust signals over flash: honest hairlines, ink ratings (never gold), no tricks

## 2. Colors

A near-monochrome ink-on-white system carrying a single saturated coral, with two
deep sub-brand hues held in reserve. Strategy: **Restrained** (tinted neutrals plus one
accent kept under ~10% of any surface).

### Primary
- **Subletair Coral** (`#ff385c`): The one brand voltage. Search orb, primary CTAs,
  saved-heart fill, focus moments. Its rarity is what makes it read as warm rather than
  loud. Press state deepens to **Coral Press** (`#e00b41`); disabled CTAs fade to
  **Coral Tint** (`#ffd1da`).

### Secondary
- **Luxe Violet** (`#460479`): Sub-brand marker for "Subletair Luxe". Reserved; never a
  general-purpose accent.
- **Plus Magenta** (`#92174d`): Sub-brand marker for "Subletair Plus". Equally reserved.

### Neutral
- **Ink** (`#222222`): Dominant text. Never pure black, deliberately.
- **Body** (`#3f3f3f`): Secondary running text.
- **Muted** (`#6a6a6a`): Sub-titles, inactive tabs, "View all", inactive categories.
- **Muted Soft** (`#929292`): Disabled link text.
- **Canvas** (`#ffffff`): The default page floor and card surface.
- **Surface Soft** (`#f7f7f7`) / **Surface Strong** (`#f2f2f2`): Filter bands, sub-nav
  hover, circular icon-button fills.
- **Hairline** (`#dddddd`) / **Hairline Soft** (`#ebebeb`): The 1px borders and editorial
  dividers that do most of the structural work in place of shadows.

### Named Rules
**The One Voice Rule.** Coral covers under ~10% of any screen. It is the search orb, the
active CTA, and the saved heart. It is never a background, never a divider, never a
decorative fill. Its scarcity is the brand.

**The Ink-Not-Gold Rule.** Star ratings render in Ink (`#222222`), never gold or yellow.
Ratings are information, not ornament. This is a deliberate departure from the category.

## 3. Typography

**Display Font:** Subletair Cereal VF (the licensed brand face)
**Body Font:** same family; Circular, then Inter, then the system stack as fallbacks
**Label/Mono Font:** none, the system is single-family by design

**Character:** One humanist sans carries the entire scale. The pairing is the absence
of a pairing: warmth and consistency come from a single friendly geometric-humanist
face, not from contrast between families. Display weights stay modest because
photography, not type, provides the visual heft.

### Hierarchy
- **Rating Display** (700, 64px, 1.1, -1px): The single loudest element in the system.
  Listing-detail rating number only. Nothing else competes at this size.
- **Display XL** (700, 28px, 1.43): Homepage H1 ("Inspiration for your next trip").
- **Display MD** (700, 21px, 1.43): Section heads ("What this place offers").
- **Title MD** (600, 16px, 1.25): Listing card titles, city-link block titles.
- **Body MD** (400, 16px, 1.5): Default running text. Cap measure at 65–75ch.
- **Body SM** (400, 14px, 1.43): Card meta, dates, prices, secondary lines.
- **Uppercase Tag** (700, 8px, 0.32px tracking, uppercase): The tiny "NEW" marker on
  product-nav tabs. The only uppercase, only tracked element in the system.

### Named Rules
**The Modest Display Rule.** Outside the 64px rating number, display type never exceeds
28px and never gets bolder than 700. If a headline is fighting the photo for attention,
the headline is wrong.

## 4. Elevation

Near-flat by intent. The system defines **exactly one shadow tier plus flat**, and most
surfaces are flat at rest, separated by 1px hairlines rather than depth. Shadows are
structural (they lift a floating control off the photography), not ambient decoration.

### Shadow Vocabulary
- **Card Lift** (`box-shadow: rgba(0,0,0,0.02) 0 0 0 1px, rgba(0,0,0,0.04) 0 2px 6px 0, rgba(0,0,0,0.1) 0 4px 8px 0`):
  The one elevation. A crisp hairline ring plus a soft two-layer drop. Used on the
  floating search bar and as the target for card hover lift.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest and divided by hairlines. The one
shadow tier appears only on genuinely floating elements (the search pill) or as a
*response to state* (card hover). If two stacked elements both have shadows, one is wrong.

## 5. Components

### Buttons
- **Shape:** Soft rounded (8px, `rounded.sm`) for rectangular buttons; fully round
  (`rounded.full`) for icon buttons and pills.
- **Primary:** Coral fill (`#ff385c`), white text, ~14px/24px padding. The committing
  action: Search, Reserve, Save changes.
- **Hover / Focus:** Tactile and confident, lift slightly and deepen on press to
  Coral Press (`#e00b41`). Every state change must ease (see The Easing Rule below).
- **Ghost / Utility:** Transparent fill, Ink text, full-radius pill ("Become a host",
  language, account). On hover they should pick up a Surface Soft (`#f7f7f7`) pill.

### Chips (Category Strip)
- **Style:** Borderless text pills on the canvas, full radius. The strip container uses
  the 32px (`rounded.xl`) corner.
- **State:** Active = Ink (`#222222`) text; inactive = Muted (`#6a6a6a`). Color alone is
  too weak an indicator: active chips should also carry a weight bump or underline.

### Cards / Containers
- **Corner Style:** 14px (`rounded.md`) on the photo (clipped via `overflow:hidden`).
- **Background:** Card surface white; the photo is the card.
- **Shadow Strategy:** Flat at rest. On hover, apply Card Lift and a subtle image
  `scale(1.03–1.05)` with an ease-out curve. Cursor is pointer.
- **Border:** None; spacing and the photo edge do the separating.
- **Internal Padding:** Tight, meta sits directly under the photo with ~8px rhythm.

### Inputs / Fields
- **Style:** Sit inside the search pill or on Surface Soft; hairline (`#dddddd`) borders,
  8px radius on standalone fields.
- **Focus:** Border shifts to Border Strong (`#c1c1c1`); keep a visible focus ring for
  keyboard users.
- **Error:** Error Text (`#c13515`) inline message; never rely on color alone.

### Navigation (Top Nav)
- **Style:** Logo left, product tabs (Stays / Experiences / Services) center, utilities
  right, single row, vertically centered, divided from content by a hairline.
- **States:** Active tab = Ink; inactive = Muted. Hover should add a Surface Soft pill.
- **Mobile:** Must collapse below ~744px. Tabs and utilities cannot stay in a desktop
  row, that overflows the viewport. Collapse to a compact bar or menu.

### Signature Component: The Pill Search Bar
The floating hero control. Full-radius (`9999px`), 64px tall, Card Lift shadow, hairline
border, segmented into Where / Check in / Who and terminated by the 48px coral Search
orb. Segments must show a Surface Soft hover highlight; the orb deepens to Coral Press
on click. This is the most identity-bearing element on the homepage.

## 6. Do's and Don'ts

### Do:
- **Do** keep coral under ~10% of any screen (The One Voice Rule): orb, primary CTA,
  saved heart, focus. Nothing else.
- **Do** let listing photography carry the visual weight; keep chrome quiet.
- **Do** render star ratings in Ink (`#222222`), never gold (The Ink-Not-Gold Rule).
- **Do** ease every state change with an ease-out curve (~0.15–0.25s). Buttons, cards,
  chips, hovers. This is the single biggest polish lever.
- **Do** give cards a hover lift + subtle image scale and a pointer cursor.
- **Do** keep the top nav and search reachable: a sticky header is expected.
- **Do** collapse the top nav below ~744px so the page never scrolls horizontally on
  mobile.
- **Do** make active states unambiguous: color plus weight or underline, not color alone.

### Don't:
- **Don't** ship `transition-duration: 0s`. Instant state snaps are the current
  weakness; the brand is "tactile and confident", which requires real motion.
- **Don't** produce generic AI/SaaS slop: identical icon-card grids, gradient text
  (`background-clip:text`), the hero-metric template, or purple-gradient startup chrome.
- **Don't** make Subletair a literal Airbnb clone. Borrow the IA, not the exact palette
  and chrome.
- **Don't** use `#000` or `#fff` as text or ink: Ink is `#222222`, deliberately.
- **Don't** stack shadows. One tier, on floating or hover-state elements only.
- **Don't** use side-stripe borders, decorative glassmorphism, or bouncy/elastic easing.
- **Don't** rely on color alone to signal active tabs or categories.
