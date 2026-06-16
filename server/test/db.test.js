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
