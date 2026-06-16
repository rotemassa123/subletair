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

export function categoryExists(key) {
  return !!db.prepare("SELECT 1 FROM categories WHERE key = ?").get(key);
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
