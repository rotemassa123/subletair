# Product

## Register

product

## Users

Two-sided, served equally:

- **Guests** browsing for a sublet. Context: planning a trip or a temporary stay,
  often on mobile, scanning many listings quickly. Job to be done: find a place they
  trust, in the right location and dates, and save candidates to compare later.
- **Hosts** listing their own space. Context: signed-in, managing a small set of
  their own listings from the `/hosting` dashboard. Job to be done: publish an
  attractive listing (photo, price, location) and edit/remove it with confidence
  that only they can change it.

The primary task on any given screen is discovery (guest) or listing management
(host). Auth is the bridge: saving and hosting are login-gated.

## Product Purpose

Subletair is an Airbnb-style two-sided sublet marketplace. Guests browse, search,
filter by category, and save listings; hosts create and manage their own. It exists
to make short-term subletting feel as trustworthy and effortless as the category
leader. Success is measured against Airbnb itself: the experience should feel more
polished, more responsive, and more considered than the incumbent, not merely at
parity with it.

## Brand Personality

Warm and trustworthy. Three words: **inviting, reassuring, effortless.** The voice is
human and plain, never corporate or salesy. Photography leads; chrome recedes. The
interface should make a stranger's spare room feel safe to book. Emotional goal:
quiet confidence, the feeling of a host who has thought of everything.

## Anti-references

- **Generic AI/SaaS slop.** No identical icon-card grids, no gradient text, no
  hero-metric template, no purple-gradient "modern startup" look. If it reads as
  "an AI made this," it has failed.
- **A literal Airbnb clone.** We out-polish Airbnb without becoming visually
  indistinguishable from it. Borrow the proven IA (pill search, category strip,
  photo-first card grid), but establish Subletair's own warmth in color, type, and
  motion rather than copying Airbnb's exact palette and chrome.
- Not cheap classifieds (Craigslist density), not overstimulating (loud color,
  aggressive motion, urgency dark-patterns).

## Design Principles

1. **Out-polish, don't out-shout.** We win on craft: real easing on every state
   change, hover affordances, sticky chrome, flawless responsive behavior. Polish is
   the product differentiator, not novelty.
2. **Photography is the hero.** Listings sell on the image. Chrome, labels, and
   controls stay quiet so the photo carries the card.
3. **Trust is built in the details.** Consistent ratios, honest pricing, clear
   ownership and auth states. Nothing that feels like a trick.
4. **Both sides, one system.** Guest discovery and host management share one visual
   language; the host dashboard is not a second-class admin skin.
5. **Motion with intent.** Every transition has a purpose and an ease-out curve;
   none is decorative or bouncy. Respect reduced-motion.

## Accessibility & Inclusion

No formal WCAG target; best-effort sensible defaults. In practice: maintain readable
contrast on text over photos and on muted secondary text, keep keyboard navigation
working (search commits on Enter, focusable controls, visible focus), provide
meaningful `aria-label`s on icon-only controls (wishlist, search), and honor
`prefers-reduced-motion` for the motion added during polish.
