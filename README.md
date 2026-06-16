# Subletair

An Airbnb-style sublet marketplace, implemented from the **Subletair Design System**
handoff bundle (Claude Design export). The frontend recreates the `Marketplace.dc.html`
template — top nav, pill search bar, category strip, and a photo-first property-card
grid — backed by a small REST API over an in-memory SQLite database.

## Stack

- **Backend** — Express + `better-sqlite3` (in-memory). Schema is created and seeded
  fresh on every start, so there is nothing to provision.
- **Frontend** — React + Vite. Components and design tokens are ported verbatim from
  the design system (`TopNav`, `SearchBar`, `PropertyCard`, `Badge`, `IconButton`,
  plus a `CategoryStrip`), styled entirely through the brand's CSS custom properties.

## Layout

```
server/   Express API + in-memory SQLite (src/index.js, db.js, seed.js)
client/   Vite + React app
  src/styles/      design tokens (colors, typography, spacing, fonts, base)
  src/components/  ported design-system components
  src/App.jsx      the marketplace page wired to the API
```

## Run it

```bash
npm run install:all   # installs root, server, and client deps
npm run dev           # starts API (:4000) and client (:5173) together
```

Then open http://localhost:5173. Vite proxies `/api/*` to the Express server.

To run as a single process (API serving the built client):

```bash
npm run build         # builds client/dist
npm start             # serves API + client on :4000
```

## API

| Method | Path                      | Description                                    |
| ------ | ------------------------- | ---------------------------------------------- |
| GET    | `/api/categories`         | Category strip entries                         |
| GET    | `/api/listings`           | Listings; `?category=<key>&q=<text>` to filter |
| GET    | `/api/listings/:id`       | A single listing                               |
| POST   | `/api/listings/:id/save`  | Toggle the wishlist (heart) state              |

## Notes / caveats

- The brand font *Subletair Cereal VF* is not bundled (licensed); Inter is loaded
  from Google Fonts as the substitute, matching the design system's own fallback.
- Listing imagery references the Unsplash CDN, same as the design bundle.
- The DB is in-memory: wishlist toggles persist for the life of the server process
  and reset on restart.
