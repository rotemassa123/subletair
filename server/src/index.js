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
