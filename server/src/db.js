// In-memory SQLite database for the Subletair marketplace.
// Created fresh on every server start and seeded from seed.js.

import Database from "better-sqlite3";
import { categories, listings } from "./seed.js";

const db = new Database(":memory:");
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE categories (
    key   TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    sort  INTEGER NOT NULL
  );

  CREATE TABLE listings (
    id       INTEGER PRIMARY KEY,
    title    TEXT NOT NULL,
    subtitle TEXT,
    price    INTEGER NOT NULL,
    rating   REAL,
    badge    TEXT,
    image    TEXT NOT NULL,
    cat      TEXT NOT NULL,
    saved    INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (cat) REFERENCES categories(key)
  );
`);

const insertCategory = db.prepare(
  "INSERT INTO categories (key, label, sort) VALUES (@key, @label, @sort)"
);
categories.forEach((c, i) => insertCategory.run({ ...c, sort: i }));

const insertListing = db.prepare(`
  INSERT INTO listings (id, title, subtitle, price, rating, badge, image, cat)
  VALUES (@id, @title, @subtitle, @price, @rating, @badge, @image, @cat)
`);
for (const l of listings) insertListing.run(l);

// --- Queries -----------------------------------------------------------------

export function getCategories() {
  return db.prepare("SELECT key, label FROM categories ORDER BY sort").all();
}

export function getListings({ category = "all", q = "" } = {}) {
  const clauses = [];
  const params = {};

  if (category && category !== "all") {
    clauses.push("cat = @category");
    params.category = category;
  }
  if (q && q.trim()) {
    clauses.push("(title LIKE @q OR subtitle LIKE @q)");
    params.q = `%${q.trim()}%`;
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(`SELECT * FROM listings ${where} ORDER BY id`)
    .all(params);
  return rows.map(toListing);
}

export function getListing(id) {
  const row = db.prepare("SELECT * FROM listings WHERE id = ?").get(id);
  return row ? toListing(row) : null;
}

export function toggleSaved(id) {
  const row = db.prepare("SELECT saved FROM listings WHERE id = ?").get(id);
  if (!row) return null;
  const next = row.saved ? 0 : 1;
  db.prepare("UPDATE listings SET saved = ? WHERE id = ?").run(next, id);
  return getListing(id);
}

function toListing(row) {
  return { ...row, saved: !!row.saved };
}

export default db;
