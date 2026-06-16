# Two-Sided Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full authentication and host listing management to the Subletair marketplace so guests browse/save and hosts create/manage their own listings.

**Architecture:** Express API over file-based SQLite gains a `users` table, listing `owner_id`, a per-user `saved_listings` join table, JWT auth, and multipart photo upload. The React client gains an auth context, a login/register modal, routing, and a host dashboard — all built from the existing design-system components.

**Tech Stack:** Node + Express, better-sqlite3 (file), bcryptjs, jsonwebtoken, multer, node:test; React + Vite, react-router-dom.

---

## File Structure

**Backend**
- `server/package.json` — add deps + `test` script
- `server/src/app.js` — **new**: `createApp()` factory (routes), no `.listen`
- `server/src/index.js` — **rewrite**: import `createApp`, listen, serve client/uploads
- `server/src/db.js` — **rewrite**: file DB (env-overridable), new schema, seed-if-empty
- `server/src/seed.js` — keep listings/categories; add `demoHost`
- `server/src/auth.js` — **new**: hashing, JWT sign/verify, `authRequired`/`authOptional`
- `server/src/uploads.js` — **new**: multer config
- `server/uploads/.gitkeep`, `server/data/.gitkeep` — **new** (dirs are gitignored)
- `server/test/*.test.js` — **new**: integration tests

**Frontend**
- `client/package.json` — add `react-router-dom`
- `client/src/api.js` — **rewrite**: token-aware client, auth + listings CRUD
- `client/src/auth/AuthContext.jsx` — **new**
- `client/src/components/AuthModal.jsx` — **new**
- `client/src/components/ListingForm.jsx` — **new**
- `client/src/components/TopNav.jsx` — **modify**: auth-aware account menu
- `client/src/pages/Marketplace.jsx` — **new**: extracted from current `App.jsx`
- `client/src/pages/Hosting.jsx` — **new**: host dashboard
- `client/src/main.jsx` — **modify**: wrap in `BrowserRouter` + `AuthProvider`
- `client/src/App.jsx` — **rewrite**: route shell

---

## Task 1: Backend dependencies and test harness

**Files:**
- Modify: `server/package.json`

- [ ] **Step 1: Add deps and test script**

Edit `server/package.json` so `dependencies` and `scripts` read:

```json
  "scripts": {
    "dev": "node --watch src/index.js",
    "start": "node src/index.js",
    "test": "node --test"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "better-sqlite3": "^11.8.1",
    "cors": "^2.8.5",
    "express": "^4.21.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1"
  }
```

- [ ] **Step 2: Install**

Run: `npm --prefix server install`
Expected: adds bcryptjs, jsonwebtoken, multer; no errors.

- [ ] **Step 3: Commit**

```bash
git add server/package.json server/package-lock.json
git commit -m "chore(server): add auth + upload deps and test script"
```

---

## Task 2: Rewrite db.js — file DB, new schema, seed-if-empty

**Files:**
- Modify: `server/src/seed.js`
- Rewrite: `server/src/db.js`
- Test: `server/test/db.test.js`

- [ ] **Step 1: Add a demo host to seed.js**

Append to `server/src/seed.js`:

```js
export const demoHost = {
  name: "Subletair Demo Host",
  email: "demo@subletair.test",
  // bcrypt hash of "password123"
  password: "password123",
};
```

- [ ] **Step 2: Write the failing test**

Create `server/test/db.test.js`:

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

test("getListings filters by category and query", () => {
  const cabins = db.getListings({ category: "cabin" });
  assert.ok(cabins.every((l) => l.cat === "cabin"));
  const lofts = db.getListings({ q: "loft" });
  assert.ok(lofts.every((l) => /loft/i.test(l.title) || /loft/i.test(l.subtitle ?? "")));
});

test("saved is per-user via saved_listings", () => {
  const u = db.createUser({ name: "A", email: "a@test", password_hash: "x" });
  const before = db.getListings({ user: u }).find((l) => l.id === 1);
  assert.equal(before.saved, false);
  db.toggleSaved({ userId: u.id, listingId: 1 });
  const after = db.getListings({ user: u }).find((l) => l.id === 1);
  assert.equal(after.saved, true);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm --prefix server test`
Expected: FAIL (db.js still in-memory/old API — missing `getUserByEmail`, etc.)

- [ ] **Step 4: Rewrite db.js**

Replace `server/src/db.js` entirely:

```js
// File-based SQLite for the Subletair marketplace.
// Path is overridable via SUBLETAIR_DB (use ":memory:" in tests).

import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { categories, listings, demoHost } from "./seed.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.SUBLETAIR_DB || path.resolve(__dirname, "../data/subletair.db");

if (DB_PATH !== ":memory:") fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS categories (
    key   TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    sort  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS listings (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    title      TEXT NOT NULL,
    subtitle   TEXT,
    price      INTEGER NOT NULL,
    rating     REAL,
    badge      TEXT,
    image      TEXT,
    cat        TEXT NOT NULL,
    owner_id   INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (cat) REFERENCES categories(key),
    FOREIGN KEY (owner_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS saved_listings (
    user_id    INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, listing_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
  );
`);

seedIfEmpty();

function seedIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS n FROM listings").get().n;
  if (count > 0) return;

  const insertCat = db.prepare("INSERT OR IGNORE INTO categories (key,label,sort) VALUES (@key,@label,@sort)");
  categories.forEach((c, i) => insertCat.run({ ...c, sort: i }));

  let host = getUserByEmail(demoHost.email);
  if (!host) {
    host = createUser({
      name: demoHost.name,
      email: demoHost.email,
      password_hash: bcrypt.hashSync(demoHost.password, 10),
    });
  }

  const insertListing = db.prepare(`
    INSERT INTO listings (id,title,subtitle,price,rating,badge,image,cat,owner_id)
    VALUES (@id,@title,@subtitle,@price,@rating,@badge,@image,@cat,@owner_id)
  `);
  for (const l of listings) insertListing.run({ ...l, owner_id: host.id });
}

// --- Users -------------------------------------------------------------------

export function createUser({ name, email, password_hash }) {
  const info = db
    .prepare("INSERT INTO users (name,email,password_hash) VALUES (?,?,?)")
    .run(name, email, password_hash);
  return getUserById(info.lastInsertRowid);
}
export function getUserByEmail(email) {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email);
}
export function getUserById(id) {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id);
}
export function publicUser(u) {
  return u ? { id: u.id, name: u.name, email: u.email } : null;
}

// --- Categories / listings ---------------------------------------------------

export function getCategories() {
  return db.prepare("SELECT key,label FROM categories ORDER BY sort").all();
}

export function getListings({ category = "all", q = "", user = null, ownerId = null } = {}) {
  const clauses = [];
  const params = {};
  if (category && category !== "all") { clauses.push("cat = @category"); params.category = category; }
  if (q && q.trim()) { clauses.push("(title LIKE @q OR subtitle LIKE @q)"); params.q = `%${q.trim()}%`; }
  if (ownerId != null) { clauses.push("owner_id = @ownerId"); params.ownerId = ownerId; }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db.prepare(`SELECT * FROM listings ${where} ORDER BY created_at DESC, id DESC`).all(params);
  return rows.map((r) => toListing(r, user));
}

export function getListing(id, user = null) {
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
  return row ? toListing(row, user) : null;
}

export function createListing(data) {
  const info = db.prepare(`
    INSERT INTO listings (title,subtitle,price,rating,badge,image,cat,owner_id)
    VALUES (@title,@subtitle,@price,@rating,@badge,@image,@cat,@owner_id)
  `).run(data);
  return getListing(info.lastInsertRowid);
}

export function updateListing(id, fields) {
  const allowed = ["title", "subtitle", "price", "rating", "badge", "image", "cat"];
  const sets = allowed.filter((k) => k in fields).map((k) => `${k} = @${k}`);
  if (!sets.length) return getListing(id);
  db.prepare(`UPDATE listings SET ${sets.join(", ")} WHERE id = @id`).run({ ...fields, id });
  return getListing(id);
}

export function deleteListing(id) {
  return db.prepare("DELETE FROM listings WHERE id = ?").run(id).changes > 0;
}

export function toggleSaved({ userId, listingId }) {
  const existing = db.prepare("SELECT 1 FROM saved_listings WHERE user_id=? AND listing_id=?").get(userId, listingId);
  if (existing) {
    db.prepare("DELETE FROM saved_listings WHERE user_id=? AND listing_id=?").run(userId, listingId);
  } else {
    db.prepare("INSERT INTO saved_listings (user_id,listing_id) VALUES (?,?)").run(userId, listingId);
  }
  return getListing(listingId, { id: userId });
}

function toListing(row, user) {
  let saved = false;
  if (user) {
    saved = !!db.prepare("SELECT 1 FROM saved_listings WHERE user_id=? AND listing_id=?").get(user.id, row.id);
  }
  return { ...row, saved };
}

export default db;
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix server test`
Expected: PASS (3 db tests).

- [ ] **Step 6: Add gitignore entries and keep dirs**

Create `server/uploads/.gitkeep` (empty) and `server/data/.gitkeep` (empty). Append to root `.gitignore`:

```
server/data/
server/uploads/*
!server/uploads/.gitkeep
```

- [ ] **Step 7: Commit**

```bash
git add server/src/db.js server/src/seed.js server/test/db.test.js server/uploads/.gitkeep server/data/.gitkeep .gitignore
git commit -m "feat(server): file-based DB with users, ownership, per-user wishlist"
```

---

## Task 3: Auth module (hashing + JWT + middleware)

**Files:**
- Create: `server/src/auth.js`
- Test: `server/test/auth.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/test/auth.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/auth.js";

test("hash + verify password round-trips", () => {
  const h = hashPassword("hunter2");
  assert.notEqual(h, "hunter2");
  assert.equal(verifyPassword("hunter2", h), true);
  assert.equal(verifyPassword("wrong", h), false);
});

test("sign + verify token round-trips", () => {
  const token = signToken({ id: 7 });
  const payload = verifyToken(token);
  assert.equal(payload.id, 7);
});

test("verifyToken returns null on garbage", () => {
  assert.equal(verifyToken("not-a-token"), null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix server test`
Expected: FAIL ("Cannot find module ../src/auth.js").

- [ ] **Step 3: Implement auth.js**

Create `server/src/auth.js`:

```js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getUserById } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "subletair-dev-secret-change-me";
const TOKEN_TTL = "7d";

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 10);
}
export function verifyPassword(plain, hash) {
  return bcrypt.compareSync(plain, hash);
}
export function signToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function userFromHeader(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  return getUserById(payload.id) || null;
}

export function authOptional(req, _res, next) {
  req.user = userFromHeader(req);
  next();
}

export function authRequired(req, res, next) {
  const user = userFromHeader(req);
  if (!user) return res.status(401).json({ error: "Authentication required" });
  req.user = user;
  next();
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix server test`
Expected: PASS (db + auth tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/auth.js server/test/auth.test.js
git commit -m "feat(server): password hashing, JWT, and auth middleware"
```

---

## Task 4: App factory + auth endpoints

**Files:**
- Create: `server/src/app.js`
- Test: `server/test/api.auth.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/test/api.auth.test.js`:

```js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.SUBLETAIR_DB = ":memory:";
const { createApp } = await import("../src/app.js");

let server, base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

async function post(path, body) {
  const res = await fetch(base + path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

test("register returns token + user, then /me works", async () => {
  const reg = await post("/api/auth/register", { name: "Jo", email: "jo@test.com", password: "secret12" });
  assert.equal(reg.status, 201);
  assert.ok(reg.body.token);
  assert.equal(reg.body.user.email, "jo@test.com");
  assert.equal(reg.body.user.password_hash, undefined);

  const me = await fetch(base + "/api/auth/me", { headers: { authorization: `Bearer ${reg.body.token}` } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).email, "jo@test.com");
});

test("duplicate email is rejected", async () => {
  await post("/api/auth/register", { name: "A", email: "dup@test.com", password: "secret12" });
  const again = await post("/api/auth/register", { name: "B", email: "dup@test.com", password: "secret12" });
  assert.equal(again.status, 400);
});

test("login succeeds with right password, 401 with wrong", async () => {
  await post("/api/auth/register", { name: "Li", email: "li@test.com", password: "secret12" });
  const ok = await post("/api/auth/login", { email: "li@test.com", password: "secret12" });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  const bad = await post("/api/auth/login", { email: "li@test.com", password: "nope" });
  assert.equal(bad.status, 401);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix server test`
Expected: FAIL ("Cannot find module ../src/app.js").

- [ ] **Step 3: Implement app.js with auth routes**

Create `server/src/app.js`:

```js
import express from "express";
import cors from "cors";
import {
  getCategories, getListings, getListing, createListing,
  updateListing, deleteListing, toggleSaved,
  createUser, getUserByEmail, publicUser,
} from "./db.js";
import { hashPassword, verifyPassword, signToken, authRequired, authOptional } from "./auth.js";
import { uploadSingle, fileUrl } from "./uploads.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const api = express.Router();
  api.get("/health", (_req, res) => res.json({ ok: true }));

  // --- Auth ---
  api.post("/auth/register", (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ error: "name, email, password required" });
    if (password.length < 6) return res.status(400).json({ error: "password must be at least 6 characters" });
    if (getUserByEmail(email)) return res.status(400).json({ error: "email already registered" });
    const user = createUser({ name, email, password_hash: hashPassword(password) });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  });

  api.post("/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const user = email && getUserByEmail(email);
    if (!user || !verifyPassword(password || "", user.password_hash)) {
      return res.status(401).json({ error: "invalid email or password" });
    }
    res.json({ token: signToken(user), user: publicUser(user) });
  });

  api.get("/auth/me", authRequired, (req, res) => res.json(publicUser(req.user)));

  // --- Catalog ---
  api.get("/categories", (_req, res) => res.json(getCategories()));

  api.get("/listings", authOptional, (req, res) => {
    const { category, q } = req.query;
    res.json(getListings({ category, q, user: req.user }));
  });

  api.get("/listings/mine", authRequired, (req, res) => {
    res.json(getListings({ ownerId: req.user.id, user: req.user }));
  });

  api.get("/listings/:id", authOptional, (req, res) => {
    const listing = getListing(Number(req.params.id), req.user);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  });

  // --- Host CRUD ---
  api.post("/listings", authRequired, uploadSingle, (req, res) => {
    const { title, subtitle, price, cat, rating, badge } = req.body || {};
    if (!title || !price || !cat) return res.status(400).json({ error: "title, price, cat required" });
    const listing = createListing({
      title,
      subtitle: subtitle || null,
      price: Math.round(Number(price)) || 0,
      rating: rating ? Number(rating) : null,
      badge: badge || null,
      image: req.file ? fileUrl(req.file.filename) : (req.body.image || null),
      cat,
      owner_id: req.user.id,
    });
    res.status(201).json(listing);
  });

  api.patch("/listings/:id", authRequired, uploadSingle, (req, res) => {
    const id = Number(req.params.id);
    const existing = getListing(id);
    if (!existing) return res.status(404).json({ error: "Listing not found" });
    if (existing.owner_id !== req.user.id) return res.status(403).json({ error: "Not your listing" });
    const fields = {};
    for (const k of ["title", "subtitle", "cat", "badge"]) if (k in req.body) fields[k] = req.body[k] || null;
    if ("price" in req.body) fields.price = Math.round(Number(req.body.price)) || 0;
    if ("rating" in req.body) fields.rating = req.body.rating ? Number(req.body.rating) : null;
    if (req.file) fields.image = fileUrl(req.file.filename);
    else if ("image" in req.body) fields.image = req.body.image || null;
    res.json(updateListing(id, fields));
  });

  api.delete("/listings/:id", authRequired, (req, res) => {
    const id = Number(req.params.id);
    const existing = getListing(id);
    if (!existing) return res.status(404).json({ error: "Listing not found" });
    if (existing.owner_id !== req.user.id) return res.status(403).json({ error: "Not your listing" });
    deleteListing(id);
    res.json({ ok: true });
  });

  api.post("/listings/:id/save", authRequired, (req, res) => {
    const id = Number(req.params.id);
    if (!getListing(id)) return res.status(404).json({ error: "Listing not found" });
    res.json(toggleSaved({ userId: req.user.id, listingId: id }));
  });

  app.use("/api", api);
  return app;
}
```

> Note: this file imports `./uploads.js` (Task 5). The auth tests don't exercise upload, but the import must resolve — implement Task 5 before running, OR temporarily stub. To keep TDD flowing, **do Step 4 of Task 5 first** (create `uploads.js`), then run this task's test.

- [ ] **Step 4: Create uploads.js (minimal, needed for import)** — see Task 5 Step 3 for the full file; create it now.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm --prefix server test`
Expected: PASS (db, auth, api.auth tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/app.js server/test/api.auth.test.js
git commit -m "feat(server): app factory with register/login/me endpoints"
```

---

## Task 5: Photo upload (multer) + listings CRUD test

**Files:**
- Create: `server/src/uploads.js`
- Test: `server/test/api.listings.test.js`

- [ ] **Step 1: Write the failing test**

Create `server/test/api.listings.test.js`:

```js
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.SUBLETAIR_DB = ":memory:";
const { createApp } = await import("../src/app.js");

let server, base;
before(async () => {
  server = createApp().listen(0);
  await new Promise((r) => server.once("listening", r));
  base = `http://localhost:${server.address().port}`;
});
after(() => server.close());

async function register(email) {
  const res = await fetch(base + "/api/auth/register", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: "H", email, password: "secret12" }),
  });
  return (await res.json()).token;
}

test("create listing (multipart, with photo) then it appears publicly", async () => {
  const token = await register("host1@test.com");
  const fd = new FormData();
  fd.set("title", "Test cabin");
  fd.set("price", "150");
  fd.set("cat", "cabin");
  fd.set("photo", new Blob([new Uint8Array([0xff, 0xd8, 0xff])], { type: "image/jpeg" }), "p.jpg");

  const create = await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
  assert.equal(create.status, 201);
  const made = await create.json();
  assert.equal(made.title, "Test cabin");
  assert.match(made.image, /^\/uploads\//);

  const list = await (await fetch(base + "/api/listings?category=cabin")).json();
  assert.ok(list.some((l) => l.id === made.id));
});

test("only the owner can edit or delete", async () => {
  const owner = await register("owner@test.com");
  const other = await register("other@test.com");
  const fd = new FormData();
  fd.set("title", "Mine"); fd.set("price", "99"); fd.set("cat", "loft");
  const made = await (await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${owner}` }, body: fd })).json();

  const forbidden = await fetch(base + `/api/listings/${made.id}`, {
    method: "PATCH", headers: { authorization: `Bearer ${other}`, "content-type": "application/json" },
    body: JSON.stringify({ title: "Hacked" }),
  });
  assert.equal(forbidden.status, 403);

  const del = await fetch(base + `/api/listings/${made.id}`, { method: "DELETE", headers: { authorization: `Bearer ${owner}` } });
  assert.equal(del.status, 200);
});

test("save toggle is per-user and requires auth", async () => {
  const token = await register("saver@test.com");
  const noAuth = await fetch(base + "/api/listings/1/save", { method: "POST" });
  assert.equal(noAuth.status, 401);
  const on = await (await fetch(base + "/api/listings/1/save", { method: "POST", headers: { authorization: `Bearer ${token}` } })).json();
  assert.equal(on.saved, true);
  const off = await (await fetch(base + "/api/listings/1/save", { method: "POST", headers: { authorization: `Bearer ${token}` } })).json();
  assert.equal(off.saved, false);
});

test("listings/mine returns only my listings", async () => {
  const token = await register("mine@test.com");
  const fd = new FormData();
  fd.set("title", "Only mine"); fd.set("price", "120"); fd.set("cat", "city");
  await fetch(base + "/api/listings", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: fd });
  const mine = await (await fetch(base + "/api/listings/mine", { headers: { authorization: `Bearer ${token}` } })).json();
  assert.ok(mine.length >= 1);
  assert.ok(mine.every((l) => l.title === "Only mine"));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix server test`
Expected: FAIL (uploads.js missing, or 500 on multipart).

- [ ] **Step 3: Implement uploads.js**

Create `server/src/uploads.js`:

```js
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, "../uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".img";
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ALLOWED.has(file.mimetype)),
});

// Accept a single optional file under field "photo". Wrap to convert multer
// errors (e.g. too large) into a 400 JSON response.
export function uploadSingle(req, res, next) {
  upload.single("photo")(req, res, (err) => {
    if (err) return res.status(400).json({ error: "upload failed: " + err.message });
    next();
  });
}

export function fileUrl(filename) {
  return `/uploads/${filename}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix server test`
Expected: PASS (all backend tests).

- [ ] **Step 5: Commit**

```bash
git add server/src/uploads.js server/test/api.listings.test.js
git commit -m "feat(server): photo upload + listing CRUD with owner authorization"
```

---

## Task 6: Wire index.js to the app factory + serve uploads

**Files:**
- Rewrite: `server/src/index.js`

- [ ] **Step 1: Rewrite index.js**

Replace `server/src/index.js`:

```js
// Subletair server entry point: build the app, mount static dirs, listen.

import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import { createApp } from "./app.js";
import { UPLOAD_DIR } from "./uploads.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = createApp();

// Serve uploaded photos.
app.use("/uploads", express.static(UPLOAD_DIR));

// Serve the built client in single-process mode, if present.
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api") || req.path.startsWith("/uploads")) return next();
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.listen(PORT, () => console.log(`Subletair API listening on http://localhost:${PORT}`));
```

- [ ] **Step 2: Manual smoke test**

Run (in one line so it self-terminates):
```bash
cd server && node -e "import('./src/index.js')" & P=$!; sleep 1.5; curl -s localhost:4000/api/health; curl -s localhost:4000/api/categories | head -c 80; kill $P
```
Expected: `{"ok":true}` then a JSON categories array.

- [ ] **Step 3: Commit**

```bash
git add server/src/index.js
git commit -m "feat(server): serve uploads + client via app factory"
```

---

## Task 7: Frontend — router, auth context, API client

**Files:**
- Modify: `client/package.json`
- Rewrite: `client/src/api.js`
- Create: `client/src/auth/AuthContext.jsx`
- Modify: `client/src/main.jsx`

- [ ] **Step 1: Add react-router-dom**

Run: `npm --prefix client install react-router-dom@^6.28.0`
Expected: installs cleanly.

- [ ] **Step 2: Rewrite api.js (token-aware)**

Replace `client/src/api.js`:

```js
// Token-aware client for the Subletair API.

let authToken = localStorage.getItem("subletair_token") || null;

export function setToken(token) {
  authToken = token;
  if (token) localStorage.setItem("subletair_token", token);
  else localStorage.removeItem("subletair_token");
}
export function getToken() {
  return authToken;
}

function authHeaders(extra = {}) {
  return authToken ? { ...extra, Authorization: `Bearer ${authToken}` } : extra;
}

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || `Request failed: ${res.status}`);
  return body;
}

// Auth
export const register = (data) =>
  fetch("/api/auth/register", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).then(json);
export const login = (data) =>
  fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }).then(json);
export const me = () => fetch("/api/auth/me", { headers: authHeaders() }).then(json);

// Catalog
export const fetchCategories = () => fetch("/api/categories").then(json);
export function fetchListings({ category = "all", q = "" } = {}) {
  const params = new URLSearchParams();
  if (category && category !== "all") params.set("category", category);
  if (q) params.set("q", q);
  const qs = params.toString();
  return fetch(`/api/listings${qs ? `?${qs}` : ""}`, { headers: authHeaders() }).then(json);
}
export const fetchMyListings = () => fetch("/api/listings/mine", { headers: authHeaders() }).then(json);
export const toggleSave = (id) => fetch(`/api/listings/${id}/save`, { method: "POST", headers: authHeaders() }).then(json);

// Host CRUD (FormData so a photo file can ride along)
export const createListing = (formData) =>
  fetch("/api/listings", { method: "POST", headers: authHeaders(), body: formData }).then(json);
export const updateListing = (id, formData) =>
  fetch(`/api/listings/${id}`, { method: "PATCH", headers: authHeaders(), body: formData }).then(json);
export const deleteListing = (id) =>
  fetch(`/api/listings/${id}`, { method: "DELETE", headers: authHeaders() }).then(json);
```

- [ ] **Step 3: Create AuthContext.jsx**

Create `client/src/auth/AuthContext.jsx`:

```jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import * as api from "../api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!api.getToken()) { setReady(true); return; }
    api.me().then(setUser).catch(() => api.setToken(null)).finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const { token, user } = await api.login({ email, password });
    api.setToken(token);
    setUser(user);
  }
  async function register(name, email, password) {
    const { token, user } = await api.register({ name, email, password });
    api.setToken(token);
    setUser(user);
  }
  function logout() {
    api.setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, ready, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

- [ ] **Step 4: Wrap main.jsx**

Replace `client/src/main.jsx`:

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./styles/styles.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
```

- [ ] **Step 5: Verify build**

Run: `npm --prefix client run build`
Expected: build passes (App.jsx still the old single page — fine for now).

- [ ] **Step 6: Commit**

```bash
git add client/package.json client/package-lock.json client/src/api.js client/src/auth/AuthContext.jsx client/src/main.jsx
git commit -m "feat(client): router, auth context, token-aware API client"
```

---

## Task 8: Frontend — auth modal + auth-aware TopNav

**Files:**
- Create: `client/src/components/AuthModal.jsx`
- Modify: `client/src/components/TopNav.jsx`

- [ ] **Step 1: Create AuthModal.jsx**

Create `client/src/components/AuthModal.jsx`:

```jsx
import React, { useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

/** Login / register modal over the global scrim. */
export function AuthModal({ open, onClose, initialMode = "login" }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div onClick={onClose} style={scrim}>
      <div onClick={(e) => e.stopPropagation()} style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "var(--type-display-sm-size)", fontWeight: 600, margin: 0 }}>
            {mode === "login" ? "Log in" : "Sign up"}
          </h2>
          <button onClick={onClose} aria-label="Close" style={closeBtn}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <input style={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          )}
          <input style={field} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input style={field} type="password" placeholder="Password (min 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          {error && <span style={{ color: "var(--color-error-text)", fontSize: 14 }}>{error}</span>}
          <button type="submit" disabled={busy} style={primaryBtn}>
            {busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>

        <p style={{ fontSize: 14, color: "var(--color-muted)", marginTop: 16, textAlign: "center" }}>
          {mode === "login" ? "New to Subletair? " : "Already have an account? "}
          <button onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); }} style={linkBtn}>
            {mode === "login" ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </div>
  );
}

const scrim = {
  position: "fixed", inset: 0, background: "var(--color-scrim-translucent)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
  fontFamily: "var(--font-family-base)",
};
const card = {
  background: "var(--color-canvas)", borderRadius: "var(--radius-md)",
  padding: 24, width: 380, maxWidth: "90vw", boxShadow: "var(--shadow-card)",
};
const field = {
  height: 48, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-hairline)",
  padding: "0 14px", fontSize: 16, fontFamily: "var(--font-family-base)", outline: "none",
};
const primaryBtn = {
  height: 48, borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
  background: "var(--color-primary)", color: "var(--color-on-primary)",
  fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
const closeBtn = { border: "none", background: "transparent", fontSize: 24, cursor: "pointer", lineHeight: 1, color: "var(--color-ink)" };
const linkBtn = { border: "none", background: "transparent", color: "var(--color-ink)", fontWeight: 600, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 14 };
```

- [ ] **Step 2: Make TopNav auth-aware**

In `client/src/components/TopNav.jsx`, replace the account-utilities `<div>` (the block starting `<div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>` through its closing `</div>`) with a version driven by props. Add `user`, `onLogin`, `onLogout`, `onHostingClick` to the destructured props, and render:

```jsx
      <div style={{ display: "flex", alignItems: "center", gap: 8, flex: "0 0 auto" }}>
        <button type="button" style={textPill} onClick={onHostingClick}>
          {user ? "Switch to hosting" : "Become a host"}
        </button>
        <button type="button" aria-label="Language" style={iconDisc}><GlobeGlyph /></button>
        {user ? (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 32, height: 32, borderRadius: "var(--radius-full)",
              background: "var(--color-primary)", color: "#fff", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600,
            }}>{user.name.charAt(0).toUpperCase()}</span>
            <button type="button" style={textPill} onClick={onLogout}>Log out</button>
          </div>
        ) : (
          <button type="button" style={accountPill} onClick={onLogin}>
            <MenuGlyph />
            <span style={{
              width: 30, height: 30, borderRadius: "var(--radius-full)",
              background: "var(--color-muted)", color: "#fff", display: "inline-flex",
              alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600,
            }}><PersonGlyph /></span>
          </button>
        )}
      </div>
```

Update the props line near the top of the function to:

```jsx
  active = "stays",
  onSelect,
  user,
  onLogin,
  onLogout,
  onHostingClick,
  style,
  ...rest
```

(Remove the old `userName` prop and its usage — replaced by `user`.)

- [ ] **Step 3: Verify build**

Run: `npm --prefix client run build`
Expected: passes.

- [ ] **Step 4: Commit**

```bash
git add client/src/components/AuthModal.jsx client/src/components/TopNav.jsx
git commit -m "feat(client): auth modal and auth-aware top nav"
```

---

## Task 9: Frontend — Marketplace page (login-gated save) + App router shell

**Files:**
- Create: `client/src/pages/Marketplace.jsx`
- Rewrite: `client/src/App.jsx`

- [ ] **Step 1: Create Marketplace.jsx**

Create `client/src/pages/Marketplace.jsx` — this is the current `App.jsx` body adapted to use auth + shared modal control via props:

```jsx
import React, { useEffect, useState } from "react";
import { SearchBar } from "../components/SearchBar.jsx";
import { CategoryStrip } from "../components/CategoryStrip.jsx";
import { PropertyCard } from "../components/PropertyCard.jsx";
import { fetchCategories, fetchListings, toggleSave } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";

export function Marketplace({ onRequireAuth }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchListings({ category, q: query })
      .then((rows) => { if (active) { setListings(rows); setError(null); } })
      .catch(() => active && setError("Couldn't load listings."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [category, query, user]);

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

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", padding: "20px 40px 24px", borderBottom: "1px solid var(--color-hairline-soft)" }}>
        <SearchBar query={queryInput} onQueryChange={setQueryInput} onSearch={() => setQuery(queryInput)} />
      </div>

      <main style={{ maxWidth: "var(--container-editorial)", margin: "0 auto", padding: "0 40px 64px" }}>
        {categories.length > 0 && (
          <CategoryStrip categories={categories} active={category} onSelect={setCategory} />
        )}

        <h1 style={{ fontSize: "var(--type-display-xl-size)", fontWeight: "var(--type-display-xl-weight)", lineHeight: "var(--type-display-xl-line)", margin: "24px 0", color: "var(--color-ink)" }}>
          {query ? `Stays matching “${query}”` : "Inspiration for your next trip"}
        </h1>

        {error && <p style={{ color: "var(--color-error-text)" }}>{error}</p>}
        {!error && loading && <p style={{ color: "var(--color-muted)" }}>Loading stays…</p>}
        {!error && !loading && listings.length === 0 && (
          <p style={{ color: "var(--color-muted)" }}>No stays found. Try a different search or category.</p>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {listings.map((l) => (
            <PropertyCard key={l.id} image={l.image} title={l.title} subtitle={l.subtitle}
              price={l.price} rating={l.rating} badge={l.badge} saved={l.saved}
              onToggleSave={() => handleToggleSave(l.id)} />
          ))}
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Rewrite App.jsx as the route shell**

Replace `client/src/App.jsx`:

```jsx
import React, { useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { TopNav } from "./components/TopNav.jsx";
import { AuthModal } from "./components/AuthModal.jsx";
import { Marketplace } from "./pages/Marketplace.jsx";
import { Hosting } from "./pages/Hosting.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  function goHosting() {
    if (!user) return setAuthOpen(true);
    navigate("/hosting");
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--color-canvas)" }}>
      <TopNav
        active="stays"
        user={user}
        onLogin={() => setAuthOpen(true)}
        onLogout={logout}
        onHostingClick={goHosting}
        onSelect={() => navigate("/")}
      />

      <Routes>
        <Route path="/" element={<Marketplace onRequireAuth={() => setAuthOpen(true)} />} />
        <Route path="/hosting" element={<Hosting onRequireAuth={() => setAuthOpen(true)} />} />
      </Routes>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build** (will fail until Task 10 creates Hosting.jsx)

Run: `npm --prefix client run build`
Expected: FAIL ("Could not resolve ./pages/Hosting.jsx"). This is expected; Task 10 adds it. Proceed to Task 10 before committing.

- [ ] **Step 4: (after Task 10) Commit** — committed together with Task 10.

---

## Task 10: Frontend — Hosting dashboard + ListingForm

**Files:**
- Create: `client/src/components/ListingForm.jsx`
- Create: `client/src/pages/Hosting.jsx`

- [ ] **Step 1: Create ListingForm.jsx**

Create `client/src/components/ListingForm.jsx`:

```jsx
import React, { useState } from "react";

/**
 * Create/edit form for a listing. Submits FormData (so a photo file rides
 * along). `initial` pre-fills for edit mode; `categories` populates the select.
 */
export function ListingForm({ categories, initial = null, onSubmit, onCancel }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [price, setPrice] = useState(initial?.price || "");
  const [cat, setCat] = useState(initial?.cat || (categories[1]?.key ?? "loft"));
  const [rating, setRating] = useState(initial?.rating || "");
  const [badge, setBadge] = useState(initial?.badge || "");
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.set("title", title);
      fd.set("subtitle", subtitle);
      fd.set("price", String(price));
      fd.set("cat", cat);
      if (rating) fd.set("rating", String(rating));
      if (badge) fd.set("badge", badge);
      if (file) fd.set("photo", file);
      await onSubmit(fd);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const selectableCats = categories.filter((c) => c.key !== "all");

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
      <input style={field} placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <input style={field} placeholder="Subtitle (e.g. ‘City centre · Jun 18–22’)" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      <input style={field} type="number" min="1" placeholder="Price per night (USD)" value={price} onChange={(e) => setPrice(e.target.value)} required />
      <select style={field} value={cat} onChange={(e) => setCat(e.target.value)}>
        {selectableCats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
      </select>
      <input style={field} type="number" step="0.01" min="0" max="5" placeholder="Rating (optional, 0–5)" value={rating} onChange={(e) => setRating(e.target.value)} />
      <select style={field} value={badge} onChange={(e) => setBadge(e.target.value)}>
        <option value="">No badge</option>
        <option value="Guest favorite">Guest favorite</option>
        <option value="New">New</option>
      </select>
      <label style={{ fontSize: 14, color: "var(--color-muted)" }}>
        Photo {initial ? "(leave blank to keep current)" : ""}
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files[0] || null)} style={{ display: "block", marginTop: 6 }} />
      </label>
      {error && <span style={{ color: "var(--color-error-text)", fontSize: 14 }}>{error}</span>}
      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={busy} style={primaryBtn}>{busy ? "Saving…" : initial ? "Save changes" : "Publish listing"}</button>
        {onCancel && <button type="button" onClick={onCancel} style={secondaryBtn}>Cancel</button>}
      </div>
    </form>
  );
}

const field = {
  height: 48, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-hairline)",
  padding: "0 14px", fontSize: 16, fontFamily: "var(--font-family-base)", outline: "none", background: "var(--color-canvas)",
};
const primaryBtn = {
  height: 48, padding: "0 24px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
  background: "var(--color-primary)", color: "var(--color-on-primary)", fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
const secondaryBtn = {
  height: 48, padding: "0 24px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-ink)", cursor: "pointer",
  background: "var(--color-canvas)", color: "var(--color-ink)", fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
```

- [ ] **Step 2: Create Hosting.jsx**

Create `client/src/pages/Hosting.jsx`:

```jsx
import React, { useEffect, useState } from "react";
import { ListingForm } from "../components/ListingForm.jsx";
import { PropertyCard } from "../components/PropertyCard.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { fetchCategories, fetchMyListings, createListing, updateListing, deleteListing } from "../api.js";

export function Hosting({ onRequireAuth }) {
  const { user, ready } = useAuth();
  const [categories, setCategories] = useState([]);
  const [mine, setMine] = useState([]);
  const [editing, setEditing] = useState(null); // listing being edited, or "new", or null
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategories().then(setCategories).catch(() => setCategories([])); }, []);

  useEffect(() => {
    if (!ready) return;
    if (!user) { onRequireAuth(); return; }
    refresh();
  }, [ready, user]);

  function refresh() {
    setLoading(true);
    fetchMyListings().then(setMine).catch(() => setMine([])).finally(() => setLoading(false));
  }

  async function handleCreate(fd) { await createListing(fd); setEditing(null); refresh(); }
  async function handleUpdate(id, fd) { await updateListing(id, fd); setEditing(null); refresh(); }
  async function handleDelete(id) {
    if (!confirm("Delete this listing?")) return;
    await deleteListing(id); refresh();
  }

  if (!ready) return null;
  if (!user) return <Centered>Please log in to manage your listings.</Centered>;

  return (
    <main style={{ maxWidth: "var(--container-editorial)", margin: "0 auto", padding: "32px 40px 64px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "var(--type-display-xl-size)", fontWeight: 700, margin: 0 }}>Your listings</h1>
        {!editing && <button onClick={() => setEditing("new")} style={primaryBtn}>Create listing</button>}
      </div>

      {editing === "new" && (
        <Section title="New listing">
          <ListingForm categories={categories} onSubmit={handleCreate} onCancel={() => setEditing(null)} />
        </Section>
      )}
      {editing && editing !== "new" && (
        <Section title="Edit listing">
          <ListingForm categories={categories} initial={editing} onSubmit={(fd) => handleUpdate(editing.id, fd)} onCancel={() => setEditing(null)} />
        </Section>
      )}

      {loading ? (
        <p style={{ color: "var(--color-muted)" }}>Loading…</p>
      ) : mine.length === 0 ? (
        <p style={{ color: "var(--color-muted)" }}>You haven’t published any listings yet.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {mine.map((l) => (
            <div key={l.id}>
              <PropertyCard image={l.image} title={l.title} subtitle={l.subtitle} price={l.price} rating={l.rating} badge={l.badge} />
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button onClick={() => setEditing(l)} style={smallBtn}>Edit</button>
                <button onClick={() => handleDelete(l.id)} style={{ ...smallBtn, color: "var(--color-error-text)" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 32, padding: 24, border: "1px solid var(--color-hairline)", borderRadius: "var(--radius-md)" }}>
      <h2 style={{ fontSize: "var(--type-display-sm-size)", fontWeight: 600, margin: "0 0 16px" }}>{title}</h2>
      {children}
    </section>
  );
}
function Centered({ children }) {
  return <div style={{ padding: 64, textAlign: "center", color: "var(--color-muted)" }}>{children}</div>;
}

const primaryBtn = {
  height: 48, padding: "0 24px", borderRadius: "var(--radius-sm)", border: "none", cursor: "pointer",
  background: "var(--color-primary)", color: "var(--color-on-primary)", fontSize: 16, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
const smallBtn = {
  flex: 1, height: 36, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-hairline)", cursor: "pointer",
  background: "var(--color-canvas)", color: "var(--color-ink)", fontSize: 14, fontWeight: 500, fontFamily: "var(--font-family-base)",
};
```

- [ ] **Step 3: Verify build**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 4: Commit (Tasks 9 + 10 together)**

```bash
git add client/src/pages/Marketplace.jsx client/src/pages/Hosting.jsx client/src/App.jsx client/src/components/ListingForm.jsx
git commit -m "feat(client): marketplace page (login-gated save), hosting dashboard, listing form"
```

---

## Task 11: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full backend test suite**

Run: `npm --prefix server test`
Expected: all tests pass (db, auth, api.auth, api.listings).

- [ ] **Step 2: Build the client**

Run: `npm --prefix client run build`
Expected: PASS.

- [ ] **Step 3: Full-stack smoke test (single process)**

Run:
```bash
npm --prefix client run build
PORT=4000 node server/src/index.js & P=$!; sleep 1.5
TOKEN=$(curl -s -X POST localhost:4000/api/auth/register -H 'content-type: application/json' -d '{"name":"E2E","email":"e2e@test.com","password":"secret12"}' | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d).token))")
echo "token len: ${#TOKEN}"
curl -s -X POST localhost:4000/api/listings -H "authorization: Bearer $TOKEN" -F title="E2E loft" -F price=140 -F cat=loft | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const l=JSON.parse(d);console.log('created id',l.id,'image',l.image)})"
curl -s "localhost:4000/api/listings?q=E2E" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log('found',JSON.parse(d).map(l=>l.title)))"
kill $P
```
Expected: token length > 20; a created listing id; found `[ 'E2E loft' ]`.

- [ ] **Step 4: Manual click-through (dev mode)**

Run: `npm run dev`, open http://localhost:5173. Verify: sign up → avatar appears → "Switch to hosting" → create a listing with a photo → it shows in "Your listings" → return to `/` → it appears in the grid → heart saves it (logged in) → log out → clicking heart opens the auth modal.

- [ ] **Step 5: Update README**

Add the new endpoints (`/api/auth/*`, `/api/listings` CRUD, `/uploads`), the auth + hosting features, and note the DB is now file-based at `server/data/subletair.db`. Replace the "in-memory" caveat accordingly.

- [ ] **Step 6: Commit**

```bash
git add README.md
git commit -m "docs: document auth, hosting, and file-based persistence"
```

---

## Self-Review Notes

- **Spec coverage:** users/auth (T3,T4), JWT (T3), file DB (T2), owner_id + CRUD + authorization (T2,T5), multer upload (T5), per-user saved_listings (T2,T5), routing (T7), auth context/modal/nav (T7,T8), hosting dashboard + form (T10), login-gated save (T9), README (T11). All spec sections mapped.
- **Type consistency:** `getListings` accepts `{category,q,user,ownerId}` consistently across db + app; `toggleSaved({userId,listingId})` consistent T2↔T5; API client `createListing/updateListing` send FormData matching `uploadSingle` field `photo`.
- **Ordering caveat:** Task 4 imports `./uploads.js`; the plan calls this out and instructs creating `uploads.js` (Task 5 Step 3) before running Task 4's test.
