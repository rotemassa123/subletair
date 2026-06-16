# Airbnb-style Search & Header Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Subletair a working Airbnb-style header: Where/When/Who search with real filtering (location, availability dates, guest capacity), product tabs that reshape search and feed, an account-menu dropdown, and a language/currency modal with live currency conversion.

**Architecture:** The backend adds `location`, `guests`, and a `availability` date-range table to listings (migrated onto the existing SQLite file), and filters `GET /api/listings` by destination, date range, guests, and `kind`. The React client lifts the active tab + committed search into `App`, adds a `CurrencyContext`, rewrites `SearchBar` with three flyout panels, and adds `AccountMenu` + `LanguageCurrencyModal`.

**Tech Stack:** Node + Express + better-sqlite3 + node:test; React + Vite + react-router-dom.

---

## Data contracts (consistent across all tasks)

- **listing object** (returned by the API):
  `{ id, title, subtitle, price, rating, badge, image, cat, owner_id, created_at, location, guests, kind, saved, availability }`
  where `availability` is `{ start, end } | null` (ISO `YYYY-MM-DD`, the listing's first range).
- **db.getListings(opts)** opts: `{ category="all", q="", location="", checkIn="", checkOut="", guests=0, kind="stay", user=null, ownerId=null }`.
- **db.createListing(data)** data: `{ title, subtitle, price, rating, badge, image, cat, owner_id, location, guests, kind }` → returns listing (no availability yet).
- **db.setAvailability(listingId, start, end)** replaces the listing's single range (no-op if start/end falsy).
- **db.getDestinations()** → `string[]` of distinct locations, alphabetical.
- **API `GET /api/listings`** query: `category, q, location, checkIn, checkOut, guests, kind`.
- **API `GET /api/destinations`** → `string[]`.
- **Host create/edit** multipart/JSON fields add: `location`, `guests`, `availStart`, `availEnd`.
- **Currency:** prices stored in USD; client `CurrencyContext.format(usd)` renders the active currency.

---

## File Structure

**Backend**
- `server/src/db.js` — migration, new columns/table, filters, helpers (modify)
- `server/src/seed.js` — add `location`/`guests` to demo listings + demo availability (modify)
- `server/src/app.js` — new query params, `/api/destinations`, host fields + validation (modify)
- `server/test/db.test.js`, `server/test/api.listings.test.js` — new tests (modify)

**Frontend**
- `client/src/currency/CurrencyContext.jsx` — currency state + `format` (new)
- `client/src/main.jsx` — wrap in `CurrencyProvider` (modify)
- `client/src/components/search/WhereFlyout.jsx` (new)
- `client/src/components/search/DateRangeFlyout.jsx` (new)
- `client/src/components/search/GuestsFlyout.jsx` (new)
- `client/src/components/SearchBar.jsx` — rewrite with flyouts + per-tab reshape (modify)
- `client/src/components/AccountMenu.jsx` (new)
- `client/src/components/LanguageCurrencyModal.jsx` (new)
- `client/src/components/TopNav.jsx` — tabs drive product, wire menu/globe/host (modify)
- `client/src/App.jsx` — lift `tab` + committed `search`, render modals (modify)
- `client/src/pages/Marketplace.jsx` — consume search/tab, empty states, currency (modify)
- `client/src/components/PropertyCard.jsx` — price via `format` (modify)
- `client/src/components/ListingForm.jsx` — location/guests/availability fields (modify)
- `client/src/pages/Hosting.jsx` — send new fields (modify)
- `client/src/api.js` — pass new params; `fetchDestinations` (modify)

---

## Task 1: DB — migration, columns, availability table, helpers, filters

**Files:**
- Modify: `server/src/seed.js`, `server/src/db.js`
- Test: `server/test/db.test.js`

- [ ] **Step 1: Add location/guests to seed listings + a demo-availability helper**

In `server/src/seed.js`, add `location` and `guests` to every listing object. Use these
values keyed by `id` (edit each listing inline):

```
id1 Cozy loft in Mission District   → location:"San Francisco", guests:3
id2 Garden studio with morning light→ location:"Lisbon",        guests:2
id3 Pine cabin near the trailhead   → location:"Tahoe",         guests:6
id4 Bright flat off the harbour     → location:"Lisbon",        guests:4
id5 Beach bungalow, steps to sand   → location:"Tofino",        guests:5
id6 Minimalist concrete house       → location:"Mexico City",   guests:4
id7 A-frame tiny home in the woods  → location:"Catskills",     guests:2
id8 Stone cottage with a view       → location:"Cotswolds",     guests:6
id9 Sunlit lakefront A-frame        → location:"Lake Tahoe",    guests:8
id10 Designer loft above the market → location:"Kyoto",         guests:3
id11 Quiet countryside farmhouse    → location:"Oaxaca",        guests:5
id12 Glass cabin in the pines       → location:"Catskills",     guests:4
```

Then append a demo availability map (used by the seeder). Most listings are wide open;
two are deliberately narrow so date filters visibly change results:

```js
// Availability windows for the demo data (ISO dates). Wide-open unless noted.
export const demoAvailability = {
  default: { start: "2026-01-01", end: "2026-12-31" },
  // narrower windows to make date filtering observable
  3: { start: "2026-07-01", end: "2026-07-31" }, // Pine cabin — July only
  5: { start: "2026-08-01", end: "2026-08-31" }, // Beach bungalow — August only
};
```

- [ ] **Step 2: Write the failing tests**

Replace the body of `server/test/db.test.js` with (keeps the original 3 tests, adds new ones):

```js
import { test } from "node:test";
import assert from "node:assert/strict";

process.env.SUBLETAIR_DB = ":memory:";
const db = await import("../src/db.js");

test("seeds categories and demo listings owned by the demo host", () => {
  const cats = db.getCategories();
  assert.ok(cats.length >= 8);
  const host = db.getUserByEmail("demo@subletair.test");
  assert.ok(host, "demo host exists");
  const all = db.getListings({ user: null });
  assert.ok(all.length >= 8);
  assert.equal(all[0].owner_id, host.id);
});

test("listings carry location, guests, kind and an availability range", () => {
  const l = db.getListing(1);
  assert.equal(typeof l.location, "string");
  assert.ok(l.guests >= 1);
  assert.equal(l.kind, "stay");
  assert.ok(l.availability && l.availability.start && l.availability.end);
});

test("filters by guests capacity", () => {
  const big = db.getListings({ guests: 6 });
  assert.ok(big.length > 0);
  assert.ok(big.every((l) => l.guests >= 6));
});

test("filters by location (destination match)", () => {
  const tahoe = db.getListings({ location: "Tahoe" });
  assert.ok(tahoe.length > 0);
  assert.ok(tahoe.every((l) => /tahoe/i.test(l.location)));
});

test("filters by availability date range (range must cover the stay)", () => {
  // Pine cabin (id 3) is July-only.
  const julyHit = db.getListings({ checkIn: "2026-07-04", checkOut: "2026-07-08" });
  assert.ok(julyHit.some((l) => l.id === 3), "July stay includes the July-only cabin");
  const marchMiss = db.getListings({ checkIn: "2026-03-04", checkOut: "2026-03-08" });
  assert.ok(!marchMiss.some((l) => l.id === 3), "March stay excludes the July-only cabin");
});

test("kind filter returns empty for non-stay products", () => {
  assert.equal(db.getListings({ kind: "experience" }).length, 0);
  assert.ok(db.getListings({ kind: "stay" }).length > 0);
});

test("getDestinations returns distinct sorted locations", () => {
  const dests = db.getDestinations();
  assert.ok(dests.includes("Lisbon"));
  assert.deepEqual([...dests].sort(), dests); // already sorted
});

test("createListing + setAvailability round-trips", () => {
  const u = db.createUser({ name: "A", email: "a@test", password_hash: "x" });
  const made = db.createListing({
    title: "Test stay", subtitle: null, price: 100, rating: null, badge: null,
    image: null, cat: "loft", owner_id: u.id, location: "Berlin", guests: 4, kind: "stay",
  });
  db.setAvailability(made.id, "2026-05-01", "2026-05-20");
  const read = db.getListing(made.id);
  assert.equal(read.location, "Berlin");
  assert.equal(read.guests, 4);
  assert.deepEqual(read.availability, { start: "2026-05-01", end: "2026-05-20" });
});

test("saved is per-user via saved_listings", () => {
  const u = db.createUser({ name: "B", email: "b@test", password_hash: "x" });
  db.toggleSaved({ userId: u.id, listingId: 1 });
  const after = db.getListings({ user: u }).find((l) => l.id === 1);
  assert.equal(after.saved, true);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm --prefix server test`
Expected: FAIL (new columns/helpers/filters not implemented).

- [ ] **Step 4: Implement the migration, table, helpers, and filters in db.js**

In `server/src/db.js`:

(a) After the existing `db.exec(\`...CREATE TABLE IF NOT EXISTS saved_listings...\`)` block, add the availability table and a column migration:

```js
db.exec(`
  CREATE TABLE IF NOT EXISTS availability (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date   TEXT NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
  );
`);

// Add columns to a pre-existing listings table if they're missing.
const listingCols = db.prepare("PRAGMA table_info(listings)").all().map((c) => c.name);
if (!listingCols.includes("location")) db.exec("ALTER TABLE listings ADD COLUMN location TEXT NOT NULL DEFAULT ''");
if (!listingCols.includes("guests")) db.exec("ALTER TABLE listings ADD COLUMN guests INTEGER NOT NULL DEFAULT 2");
if (!listingCols.includes("kind")) db.exec("ALTER TABLE listings ADD COLUMN kind TEXT NOT NULL DEFAULT 'stay'");
```

(b) Update the import at the top to pull the new seed data:

```js
import { categories, listings, demoHost, demoAvailability } from "./seed.js";
```

(c) Replace the `insertListing` loop inside `seedIfEmpty()` with one that writes the new
columns and seeds availability:

```js
  const insertListing = db.prepare(`
    INSERT INTO listings (id,title,subtitle,price,rating,badge,image,cat,owner_id,location,guests,kind)
    VALUES (@id,@title,@subtitle,@price,@rating,@badge,@image,@cat,@owner_id,@location,@guests,'stay')
  `);
  for (const l of listings) {
    insertListing.run({ ...l, owner_id: host.id });
    const win = demoAvailability[l.id] || demoAvailability.default;
    setAvailability(l.id, win.start, win.end);
  }
```

(d) Replace `getListings` and `getListing` and add the new helpers (`toListing` now
includes `availability`):

```js
export function getListings({
  category = "all", q = "", location = "", checkIn = "", checkOut = "",
  guests = 0, kind = "stay", user = null, ownerId = null,
} = {}) {
  const clauses = ["kind = @kind"];
  const params = { kind: kind || "stay" };
  if (category && category !== "all") { clauses.push("cat = @category"); params.category = category; }
  const term = location || q;
  if (term && term.trim()) {
    clauses.push("(location LIKE @term OR title LIKE @term OR subtitle LIKE @term)");
    params.term = `%${term.trim()}%`;
  }
  if (guests && Number(guests) > 0) { clauses.push("guests >= @guests"); params.guests = Number(guests); }
  if (ownerId != null) { clauses.push("owner_id = @ownerId"); params.ownerId = ownerId; }
  if (checkIn && checkOut) {
    clauses.push(`EXISTS (SELECT 1 FROM availability a
      WHERE a.listing_id = listings.id AND a.start_date <= @checkIn AND a.end_date >= @checkOut)`);
    params.checkIn = checkIn; params.checkOut = checkOut;
  }
  const where = `WHERE ${clauses.join(" AND ")}`;
  const rows = db.prepare(`SELECT * FROM listings ${where} ORDER BY created_at DESC, id DESC`).all(params);
  return rows.map((r) => toListing(r, user));
}

export function getListing(id, user = null) {
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
  return row ? toListing(row, user) : null;
}

export function getDestinations() {
  return db.prepare("SELECT DISTINCT location FROM listings WHERE location <> '' ORDER BY location").all().map((r) => r.location);
}

export function setAvailability(listingId, start, end) {
  if (!start || !end) return;
  db.prepare("DELETE FROM availability WHERE listing_id = ?").run(listingId);
  db.prepare("INSERT INTO availability (listing_id,start_date,end_date) VALUES (?,?,?)").run(listingId, start, end);
}

export function getAvailability(listingId) {
  const r = db.prepare("SELECT start_date, end_date FROM availability WHERE listing_id = ? ORDER BY start_date LIMIT 1").get(listingId);
  return r ? { start: r.start_date, end: r.end_date } : null;
}
```

(e) Update `createListing` to persist the new columns:

```js
export function createListing(data) {
  const info = db.prepare(`
    INSERT INTO listings (title,subtitle,price,rating,badge,image,cat,owner_id,location,guests,kind)
    VALUES (@title,@subtitle,@price,@rating,@badge,@image,@cat,@owner_id,@location,@guests,@kind)
  `).run({ kind: "stay", location: "", guests: 2, ...data });
  return getListing(info.lastInsertRowid);
}
```

(f) Update `updateListing`'s allowlist to include the new columns:

```js
  const allowed = ["title", "subtitle", "price", "rating", "badge", "image", "cat", "location", "guests"];
```

(g) Replace `toListing` to attach availability:

```js
function toListing(row, user) {
  let saved = false;
  if (user) {
    saved = !!db.prepare("SELECT 1 FROM saved_listings WHERE user_id=? AND listing_id=?").get(user.id, row.id);
  }
  return { ...row, saved, availability: getAvailability(row.id) };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm --prefix server test`
Expected: PASS (db suite green, including the new tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/db.js server/src/seed.js server/test/db.test.js
git commit -m "feat(server): listing location, guest capacity, and availability ranges

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: API — search params, destinations, host fields + validation

**Files:**
- Modify: `server/src/app.js`
- Test: `server/test/api.listings.test.js`

- [ ] **Step 1: Write the failing tests**

Append these tests to `server/test/api.listings.test.js` (inside the file, after the
existing tests; they reuse the existing `register`/`base` helpers):

```js
test("GET /api/listings filters by guests, location, dates, kind", async () => {
  const all = await (await fetch(base + "/api/listings")).json();
  assert.ok(all.length > 0);
  const big = await (await fetch(base + "/api/listings?guests=6")).json();
  assert.ok(big.every((l) => l.guests >= 6));
  const tahoe = await (await fetch(base + "/api/listings?location=Tahoe")).json();
  assert.ok(tahoe.every((l) => /tahoe/i.test(l.location)));
  const july = await (await fetch(base + "/api/listings?checkIn=2026-07-04&checkOut=2026-07-08")).json();
  assert.ok(july.some((l) => l.id === 3));
  const exp = await (await fetch(base + "/api/listings?kind=experience")).json();
  assert.equal(exp.length, 0);
});

test("GET /api/destinations returns location strings", async () => {
  const dests = await (await fetch(base + "/api/destinations")).json();
  assert.ok(Array.isArray(dests) && dests.includes("Lisbon"));
});

test("host create accepts location/guests/availability and they round-trip", async () => {
  const token = await register("host-av@test.com");
  const fd = new FormData();
  fd.set("title", "Berlin loft"); fd.set("price", "120"); fd.set("cat", "loft");
  fd.set("location", "Berlin"); fd.set("guests", "4");
  fd.set("availStart", "2026-05-01"); fd.set("availEnd", "2026-05-20");
  const made = await (await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd })).json();
  assert.equal(made.location, "Berlin");
  assert.equal(made.guests, 4);
  assert.deepEqual(made.availability, { start: "2026-05-01", end: "2026-05-20" });
  // and it is findable by a Berlin May search for 4 guests
  const hit = await (await fetch(base + "/api/listings?location=Berlin&guests=4&checkIn=2026-05-02&checkOut=2026-05-05")).json();
  assert.ok(hit.some((l) => l.id === made.id));
});

test("host create rejects bad guests / availability", async () => {
  const token = await register("host-bad@test.com");
  const mk = (mut) => { const fd = new FormData(); fd.set("title","X"); fd.set("price","99"); fd.set("cat","loft"); fd.set("location","X"); fd.set("guests","2"); mut(fd); return fd; };
  const badGuests = await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: mk((fd)=>fd.set("guests","0")) });
  assert.equal(badGuests.status, 400);
  const badRange = await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: mk((fd)=>{fd.set("availStart","2026-05-10"); fd.set("availEnd","2026-05-01");}) });
  assert.equal(badRange.status, 400);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm --prefix server test`
Expected: FAIL (params + destinations + host fields not handled).

- [ ] **Step 3: Implement in app.js**

(a) Add `getDestinations` and `setAvailability` to the db import at the top of
`server/src/app.js`:

```js
import {
  getCategories, getListings, getListing, createListing,
  updateListing, deleteListing, toggleSaved, getDestinations, setAvailability,
  createUser, getUserByEmail, publicUser, categoryExists,
} from "./db.js";
```

(b) Replace the `GET /api/listings` handler and add `/api/destinations`:

```js
  api.get("/listings", authOptional, (req, res) => {
    const { category, q, location, checkIn, checkOut, guests, kind } = req.query;
    res.json(getListings({ category, q, location, checkIn, checkOut, guests, kind, user: req.user }));
  });

  api.get("/destinations", (_req, res) => res.json(getDestinations()));
```

(c) Add a shared validation helper near the top of `createApp` (after `const api = ...`):

```js
  function validateListingBody(body, { partial = false } = {}) {
    const out = {};
    if (!partial || "guests" in body) {
      const g = Math.round(Number(body.guests));
      if (!Number.isFinite(g) || g < 1) return { error: "guests must be at least 1" };
      out.guests = g;
    }
    if (body.availStart || body.availEnd) {
      if (!body.availStart || !body.availEnd || body.availEnd <= body.availStart) {
        return { error: "availEnd must be after availStart" };
      }
      out.avail = { start: body.availStart, end: body.availEnd };
    }
    return { out };
  }
```

(d) Replace the POST `/api/listings` handler:

```js
  api.post("/listings", authRequired, uploadSingle, (req, res) => {
    const { title, subtitle, price, cat, rating, badge, location } = req.body || {};
    if (!title || !price || !cat) return res.status(400).json({ error: "title, price, cat required" });
    if (!categoryExists(cat)) return res.status(400).json({ error: "invalid category" });
    const p = Number(price);
    if (!Number.isFinite(p) || p <= 0) return res.status(400).json({ error: "price must be a positive number" });
    const v = validateListingBody(req.body || {});
    if (v.error) return res.status(400).json({ error: v.error });
    const listing = createListing({
      title, subtitle: subtitle || null, price: Math.round(p),
      rating: rating ? Number(rating) : null, badge: badge || null,
      image: req.file ? fileUrl(req.file.filename) : (req.body.image || null),
      cat, owner_id: req.user.id, location: location || "", guests: v.out.guests, kind: "stay",
    });
    if (v.out.avail) setAvailability(listing.id, v.out.avail.start, v.out.avail.end);
    res.status(201).json(getListing(listing.id, req.user));
  });
```

(e) Replace the PATCH `/api/listings/:id` handler:

```js
  api.patch("/listings/:id", authRequired, uploadSingle, (req, res) => {
    const id = Number(req.params.id);
    const existing = getListing(id);
    if (!existing) return res.status(404).json({ error: "Listing not found" });
    if (existing.owner_id !== req.user.id) return res.status(403).json({ error: "Not your listing" });
    if ("cat" in req.body && !categoryExists(req.body.cat)) return res.status(400).json({ error: "invalid category" });
    const v = validateListingBody(req.body || {}, { partial: true });
    if (v.error) return res.status(400).json({ error: v.error });
    const fields = {};
    for (const k of ["title", "subtitle", "cat", "badge", "location"]) if (k in req.body) fields[k] = req.body[k] || null;
    if ("price" in req.body) {
      const p = Number(req.body.price);
      if (!Number.isFinite(p) || p <= 0) return res.status(400).json({ error: "price must be a positive number" });
      fields.price = Math.round(p);
    }
    if ("rating" in req.body) fields.rating = req.body.rating ? Number(req.body.rating) : null;
    if ("guests" in req.body) fields.guests = v.out.guests;
    if (req.file) fields.image = fileUrl(req.file.filename);
    else if ("image" in req.body) fields.image = req.body.image || null;
    updateListing(id, fields);
    if (v.out.avail) setAvailability(id, v.out.avail.start, v.out.avail.end);
    res.json(getListing(id, req.user));
  });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm --prefix server test`
Expected: PASS (all backend tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/app.js server/test/api.listings.test.js
git commit -m "feat(server): search filters, destinations endpoint, host availability fields

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Currency context + price formatting

**Files:**
- Create: `client/src/currency/CurrencyContext.jsx`
- Modify: `client/src/main.jsx`, `client/src/components/PropertyCard.jsx`

- [ ] **Step 1: Create CurrencyContext.jsx**

```jsx
import React, { createContext, useContext, useState } from "react";

// Prices are stored in USD; these static rates convert for display only.
const RATES = { USD: 1, EUR: 0.92, GBP: 0.79, JPY: 157, CAD: 1.37, AUD: 1.51 };
export const CURRENCIES = [
  { code: "USD", label: "United States dollar", symbol: "$" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British pound", symbol: "£" },
  { code: "JPY", label: "Japanese yen", symbol: "¥" },
  { code: "CAD", label: "Canadian dollar", symbol: "$" },
  { code: "AUD", label: "Australian dollar", symbol: "$" },
];

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState(() => localStorage.getItem("subletair_currency") || "USD");
  function setCurrency(code) {
    setCurrencyState(code);
    localStorage.setItem("subletair_currency", code);
  }
  function format(amountUSD) {
    if (amountUSD == null) return "";
    const converted = amountUSD * (RATES[currency] ?? 1);
    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency", currency, maximumFractionDigits: currency === "JPY" ? 0 : 0,
      }).format(converted);
    } catch {
      return `$${Math.round(converted)}`;
    }
  }
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, format }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
```

- [ ] **Step 2: Wrap main.jsx**

In `client/src/main.jsx`, import the provider and wrap `<App />` (inside `AuthProvider`):

```jsx
import { CurrencyProvider } from "./currency/CurrencyContext.jsx";
```

and change the tree to:

```jsx
    <BrowserRouter>
      <AuthProvider>
        <CurrencyProvider>
          <App />
        </CurrencyProvider>
      </AuthProvider>
    </BrowserRouter>
```

- [ ] **Step 3: Use format() in PropertyCard**

In `client/src/components/PropertyCard.jsx`, import and use the formatter for the price.
Add at the top: `import { useCurrency } from "../currency/CurrencyContext.jsx";`
Inside the component body add: `const { format } = useCurrency();`
Replace the price line:

```jsx
        {price != null && (
          <span style={{ fontSize: "var(--type-body-sm-size)", marginTop: 4 }}>
            <strong style={{ fontWeight: 600 }}>{format(price)}</strong> {priceUnit}
          </span>
        )}
```

- [ ] **Step 4: Verify build**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/currency/CurrencyContext.jsx client/src/main.jsx client/src/components/PropertyCard.jsx
git commit -m "feat(client): currency context with live price conversion

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: Search flyout primitives (Where / Date / Guests)

**Files:**
- Create: `client/src/components/search/WhereFlyout.jsx`, `DateRangeFlyout.jsx`, `GuestsFlyout.jsx`
- Modify: `client/src/api.js`

- [ ] **Step 1: Add fetchDestinations + new params to api.js**

In `client/src/api.js`, extend `fetchListings` to pass the new params and add
`fetchDestinations`. Replace the `fetchListings` function and add the new export:

```js
export function fetchListings({ category = "all", q = "", location = "", checkIn = "", checkOut = "", guests = 0, kind = "stay" } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  if (location) params.set("location", location);
  if (checkIn) params.set("checkIn", checkIn);
  if (checkOut) params.set("checkOut", checkOut);
  if (guests) params.set("guests", String(guests));
  if (kind && kind !== "stay") params.set("kind", kind);
  const qs = params.toString();
  return fetch(`/api/listings${qs ? `?${qs}` : ""}`, { headers: authHeaders() }).then(json);
}
export const fetchDestinations = () => fetch("/api/destinations").then(json);
```

- [ ] **Step 2: Create GuestsFlyout.jsx**

```jsx
import React from "react";

const ROWS = [
  { key: "adults", label: "Adults", hint: "Ages 13 or above", min: 1 },
  { key: "children", label: "Children", hint: "Ages 2–12", min: 0 },
  { key: "infants", label: "Infants", hint: "Under 2", min: 0 },
  { key: "pets", label: "Pets", hint: "Service animals always welcome", min: 0 },
];

/** Guest steppers. `value` is { adults, children, infants, pets }. */
export function GuestsFlyout({ value, onChange }) {
  function set(key, next) { onChange({ ...value, [key]: next }); }
  return (
    <div style={panel}>
      {ROWS.map((r, i) => (
        <div key={r.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 0", borderTop: i ? "1px solid var(--color-hairline-soft)" : "none" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "var(--color-ink)" }}>{r.label}</div>
            <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{r.hint}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" aria-label={`Decrease ${r.label}`} className="sl-stepper-btn"
              disabled={value[r.key] <= r.min} onClick={() => set(r.key, Math.max(r.min, value[r.key] - 1))} style={stepBtn(value[r.key] <= r.min)}>–</button>
            <span style={{ minWidth: 18, textAlign: "center", fontSize: 15 }}>{value[r.key]}</span>
            <button type="button" aria-label={`Increase ${r.label}`} className="sl-stepper-btn"
              onClick={() => set(r.key, value[r.key] + 1)} style={stepBtn(false)}>+</button>
          </div>
        </div>
      ))}
    </div>
  );
}

const panel = { padding: "8px 24px 16px", width: 360, maxWidth: "90vw" };
function stepBtn(disabled) {
  return {
    width: 32, height: 32, borderRadius: "var(--radius-full)",
    border: "1px solid var(--color-border-strong)", background: "var(--color-canvas)",
    color: disabled ? "var(--color-muted-soft)" : "var(--color-ink)",
    cursor: disabled ? "not-allowed" : "pointer", fontSize: 18, lineHeight: 1,
  };
}
```

- [ ] **Step 3: Create WhereFlyout.jsx**

```jsx
import React, { useEffect, useState } from "react";
import { fetchDestinations } from "../../api.js";

/** Destination picker: autocomplete over real listing locations + recent searches. */
export function WhereFlyout({ value, onSelect }) {
  const [destinations, setDestinations] = useState([]);
  const [recent, setRecent] = useState(() => JSON.parse(localStorage.getItem("subletair_recent") || "[]"));

  useEffect(() => { fetchDestinations().then(setDestinations).catch(() => setDestinations([])); }, []);

  const q = (value || "").trim().toLowerCase();
  const matches = q ? destinations.filter((d) => d.toLowerCase().includes(q)) : destinations;

  function choose(d) {
    const next = [d, ...recent.filter((r) => r !== d)].slice(0, 4);
    setRecent(next);
    localStorage.setItem("subletair_recent", JSON.stringify(next));
    onSelect(d);
  }

  return (
    <div style={panel}>
      <button type="button" onClick={() => onSelect("")} style={row}>
        <span style={iconDot}>◎</span> I’m flexible
      </button>
      {!q && recent.length > 0 && (
        <>
          <div style={heading}>Recent searches</div>
          {recent.map((d) => (
            <button key={`r-${d}`} type="button" onClick={() => choose(d)} style={row}><span style={iconDot}>🕘</span> {d}</button>
          ))}
        </>
      )}
      <div style={heading}>Suggested destinations</div>
      {matches.slice(0, 8).map((d) => (
        <button key={d} type="button" onClick={() => choose(d)} style={row}><span style={iconDot}>📍</span> {d}</button>
      ))}
      {matches.length === 0 && <div style={{ ...row, color: "var(--color-muted)", cursor: "default" }}>No matches</div>}
    </div>
  );
}

const panel = { padding: 16, width: 360, maxWidth: "90vw", maxHeight: 420, overflowY: "auto" };
const heading = { fontSize: 12, fontWeight: 700, color: "var(--color-muted)", textTransform: "uppercase", letterSpacing: "0.04em", margin: "12px 8px 4px" };
const row = {
  display: "flex", alignItems: "center", gap: 12, width: "100%", textAlign: "left",
  padding: "10px 8px", border: "none", background: "transparent", cursor: "pointer",
  borderRadius: "var(--radius-sm)", fontSize: 15, color: "var(--color-ink)", fontFamily: "var(--font-family-base)",
};
const iconDot = { width: 32, height: 32, borderRadius: "var(--radius-sm)", background: "var(--color-surface-strong)", display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto" };
```

- [ ] **Step 4: Create DateRangeFlyout.jsx**

```jsx
import React, { useState } from "react";

const DAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
function ymd(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function addMonths(base, n) { return new Date(base.getFullYear(), base.getMonth() + n, 1); }

/** Range calendar. `value` is { checkIn, checkOut } (ISO strings). `single` picks one date. */
export function DateRangeFlyout({ value, onChange, single = false }) {
  const [view, setView] = useState(() => new Date(2026, 0, 1));
  const months = single ? [view] : [view, addMonths(view, 1)];

  function pick(dateStr) {
    if (single) { onChange({ checkIn: dateStr, checkOut: dateStr }); return; }
    const { checkIn, checkOut } = value;
    if (!checkIn || checkOut) { onChange({ checkIn: dateStr, checkOut: "" }); return; }
    if (dateStr <= checkIn) { onChange({ checkIn: dateStr, checkOut: "" }); return; }
    onChange({ checkIn, checkOut: dateStr });
  }

  return (
    <div style={panel}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button type="button" aria-label="Previous month" onClick={() => setView(addMonths(view, -1))} style={navBtn}>‹</button>
        <button type="button" aria-label="Next month" onClick={() => setView(addMonths(view, 1))} style={navBtn}>›</button>
      </div>
      <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
        {months.map((m, i) => (
          <Month key={i} month={m} value={value} onPick={pick} single={single} />
        ))}
      </div>
    </div>
  );
}

function Month({ month, value, onPick, single }) {
  const year = month.getFullYear(), mon = month.getMonth();
  const first = new Date(year, mon, 1).getDay();
  const days = new Date(year, mon + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const title = month.toLocaleString(undefined, { month: "long", year: "numeric" });
  return (
    <div style={{ width: 240 }}>
      <div style={{ textAlign: "center", fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={grid}>
        {DAYS.map((d) => <div key={d} style={{ fontSize: 11, color: "var(--color-muted)", textAlign: "center" }}>{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <span key={i} />;
          const ds = `${year}-${String(mon + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isStart = ds === value.checkIn, isEnd = ds === value.checkOut;
          const inRange = !single && value.checkIn && value.checkOut && ds > value.checkIn && ds < value.checkOut;
          const selected = isStart || isEnd;
          return (
            <button key={i} type="button" onClick={() => onPick(ds)} style={dayCell(selected, inRange)}>{day}</button>
          );
        })}
      </div>
    </div>
  );
}

const panel = { padding: 24, maxWidth: "90vw" };
const grid = { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 };
const navBtn = { width: 36, height: 36, borderRadius: "var(--radius-full)", border: "none", background: "transparent", cursor: "pointer", fontSize: 18, color: "var(--color-ink)" };
function dayCell(selected, inRange) {
  return {
    height: 34, border: "none", cursor: "pointer", fontSize: 13, borderRadius: "var(--radius-full)",
    fontFamily: "var(--font-family-base)",
    background: selected ? "var(--color-ink)" : inRange ? "var(--color-surface-strong)" : "transparent",
    color: selected ? "var(--color-on-dark)" : "var(--color-ink)",
  };
}
```

- [ ] **Step 5: Verify build**

Run: `npm --prefix client run build`
Expected: PASS (components compile even though not yet mounted).

- [ ] **Step 6: Commit**

```bash
git add client/src/components/search client/src/api.js
git commit -m "feat(client): search flyout primitives (where, dates, guests) + api params

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: SearchBar rewrite with flyouts + per-tab reshape

**Files:**
- Modify: `client/src/components/SearchBar.jsx`
- Modify: `client/src/styles/interactions.css` (stepper hover)

- [ ] **Step 1: Add stepper hover to interactions.css**

Append to `client/src/styles/interactions.css`:

```css
/* ---------- Guest steppers ---------- */
.sl-stepper-btn { transition: border-color var(--duration-fast) var(--ease-standard), background-color var(--duration-fast) var(--ease-standard); }
.sl-stepper-btn:hover:not(:disabled) { border-color: var(--color-ink); }

/* ---------- Search flyout popover ---------- */
.sl-flyout {
  position: absolute; top: calc(100% + 12px); z-index: 60;
  background: var(--color-canvas); border-radius: var(--radius-xl);
  box-shadow: var(--shadow-card); border: 1px solid var(--color-hairline-soft);
  animation: sl-fade-up 200ms var(--ease-out-quart) both;
}
```

- [ ] **Step 2: Rewrite SearchBar.jsx**

```jsx
import React, { useEffect, useRef, useState } from "react";
import { WhereFlyout } from "./search/WhereFlyout.jsx";
import { DateRangeFlyout } from "./search/DateRangeFlyout.jsx";
import { GuestsFlyout } from "./search/GuestsFlyout.jsx";

const EMPTY_GUESTS = { adults: 0, children: 0, infants: 0, pets: 0 };

/**
 * The signature pill search bar. Segments open one flyout at a time; the layout
 * reshapes per product tab (stays = Where/Check in/Check out/Who; experiences &
 * services = Where/Date/Who). Pressing search commits the composed query.
 */
export function SearchBar({ tab = "stays", onSearch, style }) {
  const [open, setOpen] = useState(null); // "where" | "dates" | "who" | null
  const [where, setWhere] = useState("");
  const [dates, setDates] = useState({ checkIn: "", checkOut: "" });
  const [guests, setGuests] = useState(EMPTY_GUESTS);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(null); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const single = tab !== "stays";
  const guestCount = guests.adults + guests.children;
  const guestLabel = guestCount ? `${guestCount} guest${guestCount > 1 ? "s" : ""}` : "Add guests";
  const datesLabel = dates.checkIn ? (single ? fmt(dates.checkIn) : `${fmt(dates.checkIn)}${dates.checkOut ? " – " + fmt(dates.checkOut) : ""}`) : (single ? "Add date" : "Add dates");

  function commit(e) {
    e?.preventDefault();
    setOpen(null);
    onSearch && onSearch({
      location: where,
      checkIn: dates.checkIn || "",
      checkOut: single ? dates.checkIn || "" : dates.checkOut || "",
      guests: guestCount,
    });
  }

  return (
    <div ref={ref} style={{ position: "relative", ...style }}>
      <form onSubmit={commit} className="sl-search" style={bar}>
        <Segment label="Where" value={where || "Search destinations"} muted={!where} onClick={() => setOpen(open === "where" ? null : "where")} active={open === "where"} where />
        <Divider />
        {single ? (
          <Segment label="Date" value={datesLabel} muted={!dates.checkIn} onClick={() => setOpen(open === "dates" ? null : "dates")} active={open === "dates"} />
        ) : (
          <>
            <Segment label="Check in" value={dates.checkIn ? fmt(dates.checkIn) : "Add dates"} muted={!dates.checkIn} onClick={() => setOpen(open === "dates" ? null : "dates")} active={open === "dates"} />
            <Divider />
            <Segment label="Check out" value={dates.checkOut ? fmt(dates.checkOut) : "Add dates"} muted={!dates.checkOut} onClick={() => setOpen(open === "dates" ? null : "dates")} active={open === "dates"} />
          </>
        )}
        <Divider />
        <Segment label="Who" value={guestLabel} muted={!guestCount} onClick={() => setOpen(open === "who" ? null : "who")} active={open === "who"} />
        <button type="submit" aria-label="Search" className="sl-search-orb" style={orb}>
          <SearchGlyph />
        </button>
      </form>

      {open === "where" && (
        <div className="sl-flyout" style={{ left: 0 }}>
          <WhereFlyout value={where} onSelect={(d) => { setWhere(d); setOpen(single ? "dates" : "dates"); }} />
        </div>
      )}
      {open === "dates" && (
        <div className="sl-flyout" style={{ left: "50%", transform: "translateX(-50%)" }}>
          <DateRangeFlyout value={dates} onChange={setDates} single={single} />
        </div>
      )}
      {open === "who" && (
        <div className="sl-flyout" style={{ right: 0 }}>
          <GuestsFlyout value={guests} onChange={setGuests} />
        </div>
      )}
    </div>
  );
}

function Segment({ label, value, muted, onClick, active, where }) {
  return (
    <button type="button" onClick={onClick} className="sl-search-seg" style={{ ...seg, background: active ? "var(--color-surface-soft)" : "transparent" }}>
      <span style={{ fontSize: "var(--type-caption-size)", fontWeight: 600, color: "var(--color-ink)" }}>{label}</span>
      <span style={{ fontSize: "var(--type-body-sm-size)", color: muted ? "var(--color-muted)" : "var(--color-ink)", whiteSpace: "nowrap", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
    </button>
  );
}
function Divider() { return <span style={{ width: 1, height: 30, background: "var(--color-hairline)" }} />; }

function fmt(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleString(undefined, { month: "short", day: "numeric" });
}

const bar = {
  display: "flex", alignItems: "center", height: 64, padding: "0 8px",
  borderRadius: "var(--radius-full)", background: "var(--color-canvas)",
  border: "1px solid var(--color-hairline)", fontFamily: "var(--font-family-base)",
  width: "fit-content", maxWidth: "100%",
};
const seg = {
  display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
  padding: "8px 24px", border: "none", borderRadius: "var(--radius-full)", cursor: "pointer", textAlign: "left",
};
const orb = {
  width: 48, height: 48, borderRadius: "var(--radius-full)", border: "none",
  cursor: "pointer", marginLeft: 8, display: "inline-flex", alignItems: "center", justifyContent: "center", flex: "0 0 auto",
};
function SearchGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
      <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm --prefix client run build`
Expected: FAIL — `Marketplace.jsx` still passes old `SearchBar` props (`query`, `onQueryChange`). That's wired in Task 8. If the build errors only reference Marketplace, proceed; otherwise fix SearchBar. (To keep this task independently committable, the unused-prop mismatch does not break the build — Vite only errors on unresolved imports, not extra props — so the build should PASS. Confirm it passes.)

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/SearchBar.jsx client/src/styles/interactions.css
git commit -m "feat(client): segmented search bar with where/date/guest flyouts

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Account menu dropdown

**Files:**
- Create: `client/src/components/AccountMenu.jsx`
- Modify: `client/src/styles/interactions.css`

- [ ] **Step 1: Add dropdown styling to interactions.css**

Append:

```css
/* ---------- Dropdown menu ---------- */
.sl-menu {
  position: absolute; top: calc(100% + 10px); right: 0; z-index: 60; min-width: 240px;
  background: var(--color-canvas); border-radius: var(--radius-md);
  box-shadow: var(--shadow-card); border: 1px solid var(--color-hairline-soft);
  padding: 8px 0; animation: sl-fade-up 160ms var(--ease-out-quart) both;
}
.sl-menu__item {
  display: flex; width: 100%; align-items: center; gap: 10px; padding: 10px 16px;
  border: none; background: transparent; cursor: pointer; text-align: left;
  font-size: 14px; color: var(--color-ink); font-family: var(--font-family-base);
  transition: background-color var(--duration-fast) var(--ease-standard);
}
.sl-menu__item:hover { background: var(--color-surface-soft); }
.sl-menu__item.is-strong { font-weight: 600; }
.sl-menu__divider { height: 1px; background: var(--color-hairline-soft); margin: 8px 0; }
```

- [ ] **Step 2: Create AccountMenu.jsx**

```jsx
import React, { useEffect, useRef, useState } from "react";

/**
 * Account dropdown. Auth-aware: logged-out shows auth + help; logged-in shows
 * wishlists/trips/messages, hosting, settings, and log out. Items without a real
 * destination call onComingSoon(label).
 */
export function AccountMenu({ user, onLogin, onSignup, onLogout, onHosting, onComingSoon }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function act(fn) { setOpen(false); fn && fn(); }
  const soon = (label) => () => onComingSoon && onComingSoon(label);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button type="button" className="sl-account" style={trigger} onClick={() => setOpen((o) => !o)} aria-haspopup="menu" aria-expanded={open}>
        <MenuGlyph />
        {user ? (
          <span style={avatar}>{user.name.charAt(0).toUpperCase()}</span>
        ) : (
          <span style={{ ...avatar, background: "var(--color-muted)" }}><PersonGlyph /></span>
        )}
      </button>

      {open && (
        <div className="sl-menu" role="menu">
          {user ? (
            <>
              <button role="menuitem" className="sl-menu__item is-strong" onClick={() => act(soon("Wishlists"))}>Wishlists</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Trips"))}>Trips</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Messages"))}>Messages</button>
              <div className="sl-menu__divider" />
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onHosting)}>Switch to hosting</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Account settings"))}>Account settings</button>
              <div className="sl-menu__divider" />
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onLogout)}>Log out</button>
            </>
          ) : (
            <>
              <button role="menuitem" className="sl-menu__item is-strong" onClick={() => act(onSignup)}>Sign up</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onLogin)}>Log in</button>
              <div className="sl-menu__divider" />
              <button role="menuitem" className="sl-menu__item" onClick={() => act(soon("Help Center"))}>Help Center</button>
              <button role="menuitem" className="sl-menu__item" onClick={() => act(onHosting)}>Become a host</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

const trigger = {
  display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 6px 5px 12px",
  borderRadius: "var(--radius-full)", border: "1px solid var(--color-hairline)",
  cursor: "pointer", color: "var(--color-ink)", background: "var(--color-canvas)",
};
const avatar = {
  width: 30, height: 30, borderRadius: "var(--radius-full)", background: "var(--color-primary)",
  color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
};
function MenuGlyph() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>); }
function PersonGlyph() { return (<svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-6 8-6s8 2 8 6z"/></svg>); }
```

- [ ] **Step 3: Verify build**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AccountMenu.jsx client/src/styles/interactions.css
git commit -m "feat(client): auth-aware account dropdown menu

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Language & currency modal

**Files:**
- Create: `client/src/components/LanguageCurrencyModal.jsx`

- [ ] **Step 1: Create LanguageCurrencyModal.jsx**

```jsx
import React, { useState } from "react";
import { CURRENCIES, useCurrency } from "../currency/CurrencyContext.jsx";

const LANGUAGES = [
  { code: "en", label: "English", region: "United States" },
  { code: "es", label: "Español", region: "España" },
  { code: "fr", label: "Français", region: "France" },
  { code: "de", label: "Deutsch", region: "Deutschland" },
  { code: "ja", label: "日本語", region: "日本" },
  { code: "pt", label: "Português", region: "Brasil" },
];

/** Globe modal: language (persisted, sets <html lang>) + currency (live conversion). */
export function LanguageCurrencyModal({ open, onClose }) {
  const { currency, setCurrency } = useCurrency();
  const [tab, setTab] = useState("language");
  const [lang, setLang] = useState(() => localStorage.getItem("subletair_lang") || "en");

  if (!open) return null;

  function chooseLang(code) {
    setLang(code);
    localStorage.setItem("subletair_lang", code);
    document.documentElement.lang = code;
  }

  return (
    <div onClick={onClose} className="sl-scrim" style={scrim}>
      <div onClick={(e) => e.stopPropagation()} className="sl-modal" style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <Tab active={tab === "language"} onClick={() => setTab("language")}>Language and region</Tab>
            <Tab active={tab === "currency"} onClick={() => setTab("currency")}>Currency</Tab>
          </div>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>×</button>
        </div>

        {tab === "language" ? (
          <>
            <p style={note}>Choosing a language updates your preference. Full translation is on the way; the interface stays in English for now.</p>
            <div style={grid}>
              {LANGUAGES.map((l) => (
                <button key={l.code} type="button" onClick={() => chooseLang(l.code)} style={tile(lang === l.code)}>
                  <div style={{ fontWeight: 600 }}>{l.label}</div>
                  <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{l.region}</div>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div style={grid}>
            {CURRENCIES.map((c) => (
              <button key={c.code} type="button" onClick={() => setCurrency(c.code)} style={tile(currency === c.code)}>
                <div style={{ fontWeight: 600 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: "var(--color-muted)" }}>{c.code} – {c.symbol}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick} style={{
      border: "none", background: "transparent", cursor: "pointer", padding: "8px 4px",
      fontSize: 16, fontWeight: 600, color: active ? "var(--color-ink)" : "var(--color-muted)",
      borderBottom: active ? "2px solid var(--color-ink)" : "2px solid transparent", fontFamily: "var(--font-family-base)",
    }}>{children}</button>
  );
}

const scrim = { position: "fixed", inset: 0, background: "var(--color-scrim-translucent)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, fontFamily: "var(--font-family-base)" };
const card = { background: "var(--color-canvas)", borderRadius: "var(--radius-md)", padding: 24, width: 720, maxWidth: "92vw", maxHeight: "80vh", overflowY: "auto", boxShadow: "var(--shadow-card)" };
const note = { fontSize: 14, color: "var(--color-muted)", margin: "0 0 16px" };
const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 8 };
const closeBtn = { border: "none", background: "transparent", fontSize: 24, cursor: "pointer", lineHeight: 1, color: "var(--color-ink)" };
function tile(active) {
  return {
    textAlign: "left", padding: "12px 14px", borderRadius: "var(--radius-sm)", cursor: "pointer",
    background: active ? "var(--color-surface-soft)" : "var(--color-canvas)",
    border: `1px solid ${active ? "var(--color-ink)" : "var(--color-hairline)"}`,
    fontFamily: "var(--font-family-base)", color: "var(--color-ink)",
  };
}
```

- [ ] **Step 2: Verify build**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add client/src/components/LanguageCurrencyModal.jsx
git commit -m "feat(client): language & currency modal with live currency switch

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Wire TopNav, App, and Marketplace (tabs, search, menus, empty states)

**Files:**
- Modify: `client/src/components/TopNav.jsx`, `client/src/App.jsx`, `client/src/pages/Marketplace.jsx`

- [ ] **Step 1: Update TopNav to use AccountMenu + globe + tab callbacks**

In `client/src/components/TopNav.jsx`:
- Add imports: `import { AccountMenu } from "./AccountMenu.jsx";`
- Change the destructured props to add `onLanguage`, `onSignup`, `onComingSoon` and keep
  `active, onSelect, user, onLogin, onLogout, onHostingClick`.
- Replace the right-side account-utilities `<div>` (from `<div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>` through its closing `</div>`) with:

```jsx
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <button type="button" className="sl-pill sl-topnav__host" style={textPill} onClick={onHostingClick}>
          {user ? "Switch to hosting" : "Become a host"}
        </button>
        <button type="button" aria-label="Language and currency" className="sl-pill" style={iconDisc} onClick={onLanguage}><GlobeGlyph /></button>
        <AccountMenu
          user={user}
          onLogin={onLogin}
          onSignup={onSignup}
          onLogout={onLogout}
          onHosting={onHostingClick}
          onComingSoon={onComingSoon}
        />
      </div>
```

(The old inline avatar/account-pill markup and the `accountPill` style constant become
unused; remove the `accountPill` const and the `PersonGlyph`/`MenuGlyph` helpers ONLY if
no longer referenced — `AccountMenu` has its own copies, so delete the now-unused
`accountPill` const, and the `MenuGlyph`/`PersonGlyph` functions in TopNav if unused.)

- [ ] **Step 2: Rewrite App.jsx to own tab + search + modals**

```jsx
import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { TopNav } from "./components/TopNav.jsx";
import { AuthModal } from "./components/AuthModal.jsx";
import { LanguageCurrencyModal } from "./components/LanguageCurrencyModal.jsx";
import { Marketplace } from "./pages/Marketplace.jsx";
import { Hosting } from "./pages/Hosting.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [langOpen, setLangOpen] = useState(false);
  const [tab, setTab] = useState("stays");
  const [search, setSearch] = useState({ location: "", checkIn: "", checkOut: "", guests: 0 });
  const [toast, setToast] = useState(null);

  function openAuth(mode) { setAuthMode(mode); setAuthOpen(true); }
  function goHosting() { if (!user) return openAuth("login"); navigate("/hosting"); }
  function comingSoon(label) {
    setToast(`${label} is coming soon`);
    setTimeout(() => setToast(null), 2200);
  }
  function selectTab(key) { setTab(key); navigate("/"); }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <TopNav
        active={tab}
        onSelect={selectTab}
        user={user}
        onLogin={() => openAuth("login")}
        onSignup={() => openAuth("register")}
        onLogout={logout}
        onHostingClick={goHosting}
        onLanguage={() => setLangOpen(true)}
        onComingSoon={comingSoon}
      />

      <Routes>
        <Route path="/" element={
          <Marketplace tab={tab} search={search} onSearch={setSearch} onRequireAuth={() => openAuth("login")} />
        } />
        <Route path="/hosting" element={<Hosting onRequireAuth={() => openAuth("login")} />} />
      </Routes>

      {authOpen && <AuthModal open onClose={() => setAuthOpen(false)} initialMode={authMode} />}
      <LanguageCurrencyModal open={langOpen} onClose={() => setLangOpen(false)} />
      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "var(--color-ink)", color: "var(--color-on-dark)", padding: "12px 20px", borderRadius: "var(--radius-full)", fontSize: 14, zIndex: 200, boxShadow: "var(--shadow-card)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
```

Note: `AuthModal` already accepts `initialMode`; ensure it is passed (it is, above).

- [ ] **Step 3: Rewrite Marketplace.jsx to consume tab + committed search + currency empty states**

```jsx
import React, { useEffect, useState } from "react";
import { SearchBar } from "../components/SearchBar.jsx";
import { CategoryStrip } from "../components/CategoryStrip.jsx";
import { PropertyCard } from "../components/PropertyCard.jsx";
import { fetchCategories, fetchListings, toggleSave } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

const TAB_KIND = { stays: "stay", experiences: "experience", services: "service" };
const COMING_SOON = {
  experiences: { title: "Experiences are coming soon", body: "Host-led activities, tours, and Originals will live here. For now, explore Stays." },
  services: { title: "Services are coming soon", body: "Chefs, photographers, training, and more, bookable with or without a stay. For now, explore Stays." },
};

export function Marketplace({ tab = "stays", search, onSearch, onRequireAuth }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const kind = TAB_KIND[tab] || "stay";

  useEffect(() => { fetchCategories().then(setCategories).catch(() => setCategories([])); }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchListings({ category, kind, ...search })
      .then((rows) => { if (active) { setListings(rows); setError(null); } })
      .catch(() => active && setError("Couldn't load listings."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [category, kind, search, user]);

  async function handleToggleSave(id) {
    if (!user) return onRequireAuth();
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l)));
    try {
      const updated = await toggleSave(id);
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
    } catch {
      setListings((prev) => prev.map((l) => (l.id === id ? { ...l, saved: !l.saved } : l)));
    }
  }

  const soon = COMING_SOON[tab];
  const heading = search.location ? `Stays in ${search.location}` : "Inspiration for your next trip";

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", padding: "20px 40px 24px", borderBottom: "1px solid var(--color-hairline-soft)" }}>
        <SearchBar tab={tab} onSearch={onSearch} />
      </div>

      <main style={{ maxWidth: "var(--container-editorial)", margin: "0 auto", padding: "0 40px 64px" }}>
        {soon ? (
          <div style={{ padding: "96px 0", textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
            <h1 style={{ fontSize: "var(--type-display-xl-size)", fontWeight: 700, margin: "0 0 12px" }}>{soon.title}</h1>
            <p style={{ fontSize: 16, color: "var(--color-muted)", lineHeight: 1.5 }}>{soon.body}</p>
          </div>
        ) : (
          <>
            {categories.length > 0 && <CategoryStrip categories={categories} active={category} onSelect={setCategory} />}
            <h1 style={{ fontSize: "var(--type-display-xl-size)", fontWeight: "var(--type-display-xl-weight)", lineHeight: "var(--type-display-xl-line)", margin: "24px 0", color: "var(--color-ink)" }}>{heading}</h1>
            {error && <p style={{ color: "var(--color-error-text)" }}>{error}</p>}
            {!error && loading && <p style={{ color: "var(--color-muted)" }}>Loading stays…</p>}
            {!error && !loading && listings.length === 0 && (
              <p style={{ color: "var(--color-muted)" }}>No stays match your search. Try different dates, fewer guests, or another destination.</p>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
              {listings.map((l) => (
                <PropertyCard key={l.id} image={l.image} title={l.title} subtitle={l.subtitle}
                  price={l.price} rating={l.rating} badge={l.badge} saved={l.saved}
                  onToggleSave={() => handleToggleSave(l.id)} />
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 4: Verify build**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/TopNav.jsx client/src/App.jsx client/src/pages/Marketplace.jsx
git commit -m "feat(client): tabs drive product + search, account menu, globe, empty states

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Host form — location, guests, availability

**Files:**
- Modify: `client/src/components/ListingForm.jsx`, `client/src/pages/Hosting.jsx`

- [ ] **Step 1: Add fields to ListingForm.jsx**

In `client/src/components/ListingForm.jsx`, add state and inputs for location, guests,
and an availability range, and include them in the submitted FormData.

Add near the other `useState` calls:

```jsx
  const [location, setLocation] = useState(initial?.location || "");
  const [guests, setGuests] = useState(initial?.guests || 2);
  const [availStart, setAvailStart] = useState(initial?.availability?.start || "");
  const [availEnd, setAvailEnd] = useState(initial?.availability?.end || "");
```

In the `submit` handler, after `fd.set("cat", cat);` add:

```jsx
      fd.set("location", location);
      fd.set("guests", String(guests));
      if (availStart) fd.set("availStart", availStart);
      if (availEnd) fd.set("availEnd", availEnd);
```

In the JSX, after the category `<select>` and before the rating input, add:

```jsx
      <input style={field} placeholder="Location (e.g. Lisbon)" value={location} onChange={(e) => setLocation(e.target.value)} required />
      <input style={field} type="number" min="1" max="16" placeholder="Max guests" value={guests} onChange={(e) => setGuests(e.target.value)} required />
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ flex: 1, fontSize: 13, color: "var(--color-muted)" }}>Available from
          <input style={{ ...field, width: "100%" }} type="date" value={availStart} onChange={(e) => setAvailStart(e.target.value)} />
        </label>
        <label style={{ flex: 1, fontSize: 13, color: "var(--color-muted)" }}>Available to
          <input style={{ ...field, width: "100%" }} type="date" value={availEnd} onChange={(e) => setAvailEnd(e.target.value)} />
        </label>
      </div>
```

- [ ] **Step 2: Verify Hosting still passes FormData straight through**

`client/src/pages/Hosting.jsx` already calls `createListing(fd)` / `updateListing(id, fd)`
with the form's FormData, so no change is required there. Confirm by reading the file;
if `handleCreate`/`handleUpdate` pass the FormData unchanged, this step is a no-op.

- [ ] **Step 3: Verify build**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/ListingForm.jsx
git commit -m "feat(client): host listing form captures location, guests, availability

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: End-to-end verification + README

**Files:** `README.md` (modify)

- [ ] **Step 1: Full backend test suite**

Run: `npm --prefix server test`
Expected: all tests pass.

- [ ] **Step 2: Client build**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 3: Full-stack smoke test (fresh DB)**

Run:
```bash
cd /Users/rotemassa/WebstormProjects/subletair
export SUBLETAIR_DB=/tmp/sl-search-e2e.db; rm -f /tmp/sl-search-e2e.db*
PORT=4200 node server/src/index.js & P=$!; sleep 1.6
echo -n "destinations: "; curl -s localhost:4200/api/destinations | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).slice(0,3)))"
echo -n "guests>=6: "; curl -s "localhost:4200/api/listings?guests=6" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).length,'results'))"
echo -n "july cabin: "; curl -s "localhost:4200/api/listings?checkIn=2026-07-04&checkOut=2026-07-08" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).some(l=>l.id===3)))"
echo -n "march cabin excluded: "; curl -s "localhost:4200/api/listings?checkIn=2026-03-04&checkOut=2026-03-08" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(!JSON.parse(d).some(l=>l.id===3)))"
echo -n "experiences empty: "; curl -s "localhost:4200/api/listings?kind=experience" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).length===0))"
kill $P; rm -f /tmp/sl-search-e2e.db*
```
Expected: destinations array; a guests count; `true`, `true`, `true`.

- [ ] **Step 4: Update README**

Add to the Features and API sections: the Where/When/Who search with location/date/guest
filtering, product tabs with coming-soon Experiences/Services, the account menu, and the
language/currency modal. Document the new `GET /api/listings` params
(`location, checkIn, checkOut, guests, kind`) and `GET /api/destinations`, plus the host
fields (`location, guests, availStart, availEnd`).

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document search filtering, product tabs, account menu, currency

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review Notes

- **Spec coverage:** schema location/guests/kind + availability (T1); search filters + destinations + host fields/validation (T2); currency context + price format (T3); flyout primitives + api params (T4); SearchBar reshape per tab (T5); account menu (T6); language/currency modal (T7); TopNav/App/Marketplace wiring + tabs + empty states (T8); host form fields (T9); E2E + README (T10). All spec sections mapped.
- **Type consistency:** `getListings` opts shape identical in db.js, app.js, and api.js; `availability` is `{start,end}` everywhere; SearchBar emits `{location,checkIn,checkOut,guests}` which Marketplace spreads into `fetchListings`, matching the API params; host fields `availStart/availEnd` consistent across ListingForm → api → app → db `setAvailability`.
- **Ordering:** T5's SearchBar changes props (`tab`, `onSearch`) that Marketplace only adopts in T8; between T5 and T8 the build still passes (extra/missing props are not build errors in Vite/React). T8 reconciles them. Flagged in T5 Step 3.
```
