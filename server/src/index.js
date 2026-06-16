// Subletair marketplace API.
// Serves categories + listings from an in-memory SQLite database, and in
// production also serves the built React client.

import express from "express";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";

import {
  getCategories,
  getListings,
  getListing,
  toggleSaved,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const api = express.Router();

api.get("/health", (_req, res) => res.json({ ok: true }));

api.get("/categories", (_req, res) => {
  res.json(getCategories());
});

api.get("/listings", (req, res) => {
  const { category, q } = req.query;
  res.json(getListings({ category, q }));
});

api.get("/listings/:id", (req, res) => {
  const listing = getListing(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json(listing);
});

api.post("/listings/:id/save", (req, res) => {
  const listing = toggleSaved(Number(req.params.id));
  if (!listing) return res.status(404).json({ error: "Listing not found" });
  res.json(listing);
});

app.use("/api", api);

// Serve the built client if it exists (production single-process mode).
const clientDist = path.resolve(__dirname, "../../client/dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) =>
    res.sendFile(path.join(clientDist, "index.html"))
  );
}

app.listen(PORT, () => {
  console.log(`Subletair API listening on http://localhost:${PORT}`);
});
