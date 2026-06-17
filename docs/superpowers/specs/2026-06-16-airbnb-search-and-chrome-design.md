# Airbnb-style Search & Header Chrome — Design

_Date: 2026-06-16_

## Goal

Make the Subletair header behave like Airbnb's: a working **Where / When / Who**
search with real filtering, product **tabs** (Stays / Experiences / Services) that
reshape the search and the feed, a real **account menu**, and a **language &
currency** modal. Filtering uses a **full availability model** — dates and guest
count truly narrow results.

## Decisions (locked, from user)

- Implement all four feature groups: search flyouts, account menu, product tabs,
  language/currency modal.
- **Full availability model:** listings gain a guest capacity, a location, and
  availability date ranges; the API filters by location, date range, and guests.
- Currency switching live-converts displayed prices. Language is a persisted
  preference (sets `<html lang>` + remembered selection); full copy translation is
  out of scope and noted in the UI.

## Architecture

### Backend (`server/`)

**Schema additions** (`db.js`, migrating the existing tables):
- `listings` gains: `location TEXT NOT NULL` (the destination, e.g. "Tahoe"),
  `guests INTEGER NOT NULL DEFAULT 2` (max capacity), `kind TEXT NOT NULL DEFAULT 'stay'`
  (reserved for future experiences/services; all seed rows are `stay`).
- New `availability(id INTEGER PK, listing_id INTEGER FK, start_date TEXT, end_date TEXT)`
  — one or more bookable date ranges per listing (`end_date` exclusive of checkout is
  fine; we treat ranges as inclusive calendar spans and require `start<=checkIn` and
  `end>=checkOut`). Cascade-deletes with the listing.

**Seeding:** each demo listing gets a `location` (derived from its existing
subtitle), a `guests` value (2–8), and one availability range spanning a wide window
(so date filters are meaningful), with a couple of listings given a narrower window
to make filtering visible.

**Migration approach:** the DB file already exists for users; add columns with
`ALTER TABLE ... ADD COLUMN` guarded by a `PRAGMA table_info` check, create the
`availability` table `IF NOT EXISTS`, and backfill `location`/`guests`/availability
for any pre-existing rows that lack them. New/empty DBs go through the normal seed.

**`GET /api/listings` new query params** (all optional, AND-combined):
- `q` / `location` — destination match (`location` or title/subtitle LIKE).
- `checkIn`, `checkOut` (ISO `YYYY-MM-DD`) — listing must have an availability range
  with `start_date <= checkIn` and `end_date >= checkOut`.
- `guests` — `listings.guests >= guests`.
- `kind` — `stay` (default) returns listings; `experience`/`service` return `[]`
  (drives the "coming soon" empty states). `category` still filters by `cat`.

**Host CRUD:** create/edit accept `location`, `guests`, and an availability range
(`availStart`, `availEnd`); the server writes/replaces the listing's availability row.
`destinations` helper: `GET /api/destinations` returns the distinct locations (for the
Where autocomplete).

### Frontend (`client/`)

**New shared state**
- `CurrencyContext` — `{ currency, setCurrency, format(amountUSD) }`. Prices are stored
  in USD; a static rates table (USD, EUR, GBP, JPY, CAD, AUD) converts for display.
  Persisted to `localStorage`. `format` returns a localized currency string.
- `SearchContext` (or lifted state in `App`) — the active `tab`, and the committed
  search `{ location, checkIn, checkOut, guests }`, shared by `SearchBar` and
  `Marketplace`.

**New components**
- `SearchBar` (rewrite) — segmented pill; clicking a segment opens a single flyout at
  a time (click-outside closes). Segments reshape per tab: Stays = Where / Check in /
  Check out / Who; Experiences & Services = Where / Date / Who (single date). The
  magnifier composes params and commits the search.
- `WhereFlyout` — destination autocomplete from `GET /api/destinations` + "I'm
  flexible" (clears location). Recent searches persisted to `localStorage`.
- `DateRangeFlyout` — dual-month calendar, range selection (check-in then check-out),
  ± flexible-days chips (visual). Single-date mode for Experiences/Services.
- `GuestsFlyout` — steppers for Adults (≥1), Children, Infants, Pets; composes a guest
  count (adults + children) used for the `guests` filter; infants/pets don't count.
- `AccountMenu` — dropdown popover. Logged out: Log in, Sign up, divider, Help Center,
  Become a host. Logged in: Wishlists, Trips, Messages, divider, Switch to hosting /
  Manage listings, Account settings, divider, Log out. Items with no destination yet
  open a small "coming soon" toast/route stub; real ones (hosting, log out, auth) work.
- `LanguageCurrencyModal` — tabs for Language and Currency; currency selection updates
  `CurrencyContext` live; language selection is persisted and sets `<html lang>` with a
  note that full translation is forthcoming.
- `BecomeAHostMenu` (lightweight) — "What would you like to host?" choice (Home /
  Experience / Service); Home → `/hosting`, others → coming-soon.

**TopNav** — tabs become real: clicking sets the active product `tab`; Stays shows the
marketplace, Experiences/Services reshape the search bar and render a branded
"coming soon" state in the feed. Wires `AccountMenu`, the globe (`LanguageCurrencyModal`),
and `BecomeAHostMenu`.

**Marketplace** — reads the committed search + tab; calls `/api/listings` with the
filter params; renders results, the empty/coming-soon states per tab, and prices via
`CurrencyContext.format`. PropertyCard and ListingForm use `format` for prices; the
host form gains location, guests, and an availability range.

## Data flow

1. User picks tab → search bar reshapes; user fills Where/When/Who via flyouts →
   presses search → committed search lands in shared state.
2. `Marketplace` requests `/api/listings?kind=&location=&checkIn=&checkOut=&guests=&category=`
   → server filters by capacity + availability range + destination → feed updates.
3. Currency switch updates `CurrencyContext` → every displayed price re-renders.

## Error handling

- Invalid date ranges (checkout ≤ checkin) are prevented in the picker and rejected
  `400` server-side.
- Unknown `kind` → treated as `stay`.
- Host create/edit validates `guests >= 1`, `availEnd > availStart`, non-empty
  `location` → `400 {error}` (joins the existing global JSON error handler).

## Testing

- Backend (`node:test`): availability filtering (range covers / doesn't cover),
  guests filtering, location filtering, `kind=experience` → empty, destinations
  endpoint, host create with availability, validation 400s. Existing suite stays green.
- Frontend: `vite build` passes; manual click-through of each flyout, tab switch,
  account menu states, and currency conversion.

## Out of scope (YAGNI)

Real Experiences/Services inventory + booking; multi-range host calendars (one range
per listing in the host form, though the schema allows many); live FX rates; full UI
translation; payments. These are stubbed with honest "coming soon" states.
