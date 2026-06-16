import express from "express";
import cors from "cors";
import {
  getCategories, getListings, getListing, createListing,
  updateListing, deleteListing, toggleSaved, getDestinations, setAvailability,
  createUser, getUserByEmail, publicUser, categoryExists,
} from "./db.js";
import { hashPassword, verifyPassword, signToken, authRequired, authOptional } from "./auth.js";
import { uploadSingle, fileUrl } from "./uploads.js";

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  const api = express.Router();
  api.get("/health", (_req, res) => res.json({ ok: true }));

  function validateListingBody(body) {
    const out = {};
    if ("guests" in body) {
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
    const { category, q, location, checkIn, checkOut, guests, kind } = req.query;
    res.json(getListings({ category, q, location, checkIn, checkOut, guests, kind, user: req.user }));
  });

  api.get("/destinations", (_req, res) => res.json(getDestinations()));

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
      cat, owner_id: req.user.id, location: location || "", guests: v.out.guests ?? 2, kind: "stay",
    });
    if (v.out.avail) setAvailability(listing.id, v.out.avail.start, v.out.avail.end);
    res.status(201).json(getListing(listing.id, req.user));
  });

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

  // Global JSON error handler — keeps error responses JSON-shaped.
  app.use((err, _req, res, _next) => {
    res.status(err.status || 500).json({ error: err.message || "Internal error" });
  });

  return app;
}
