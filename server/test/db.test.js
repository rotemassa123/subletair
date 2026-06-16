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
