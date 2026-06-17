# Subletair

An Airbnb-style **two-sided** sublet marketplace, implemented from the **Subletair
Design System** handoff bundle (Claude Design export). Guests browse, search, and
save listings; hosts sign up and create/manage their own. The UI recreates the
`Marketplace.dc.html` template — top nav, pill search bar, category strip, and a
photo-first property-card grid — backed by a REST API over file-based SQLite.

## Stack

- **Backend** — Express + `better-sqlite3` (file-based at `server/data/subletair.db`),
  JWT auth (`jsonwebtoken`) with `bcryptjs` password hashing, and `multer` photo
  uploads. Schema is created and seeded with demo listings on first run.
- **Frontend** — React + Vite + `react-router-dom`. Components and design tokens are
  ported verbatim from the design system (`TopNav`, `SearchBar`, `PropertyCard`,
  `Badge`, `IconButton`, plus `CategoryStrip`), styled through the brand's CSS
  custom properties.

## Features

- **Auth** — register / log in / log out (email + password, JWT in `localStorage`).
- **Search** — Airbnb-style Where / When / Who pill: a destination autocomplete
  (typeable, backed by real listing locations), a dual-month date-range calendar,
  and adults/children/infants/pets steppers. Results filter by destination,
  availability date range, and guest capacity.
- **Product tabs** — Stays / Experiences / Services. Stays is the live marketplace;
  switching reshapes the search bar and Experiences/Services show a "coming soon"
  state (no inventory yet).
- **Account menu** — auth-aware dropdown (logged out: Log in / Sign up / Help /
  Become a host; logged in: Wishlists, Trips, hosting, settings, Log out).
- **Language & currency** — globe modal; switching currency live-converts every
  displayed price. Language is a persisted preference (sets `<html lang>`); full
  copy translation is not yet wired.
- **Guest** — browse, filter by category, search, and save listings to a per-user
  wishlist (saving requires login).
- **Host** — a `/hosting` dashboard to create, edit, and delete your own listings,
  with photo upload plus location, guest capacity, and an availability date range.
  Host-created listings appear (and become searchable) in the public marketplace.

## Layout

```
server/   Express API + file-based SQLite
  src/app.js       createApp() — all routes
  src/index.js     entry point: serves API, /uploads, and client build
  src/db.js        schema, seed, queries
  src/auth.js      bcrypt + JWT + auth middleware
  src/uploads.js   multer photo upload config
  test/            node:test integration tests
client/   Vite + React app
  src/styles/      design tokens (colors, typography, spacing, fonts, base)
  src/components/  design-system components + AuthModal, ListingForm
  src/pages/       Marketplace, Hosting
  src/auth/        AuthContext
  src/api.js       token-aware API client
```

## Run it

```bash
npm run install:all   # installs root, server, and client deps
npm run dev           # starts API (:4000) and client (:5173) together
```

Then open http://localhost:5173. Vite proxies `/api/*` to the Express server.

Sign up with any email, or log in as the seeded demo host
(`demo@subletair.test` / `password123`) to see pre-owned listings.

To run as a single process (API serving the built client):

```bash
npm run build         # builds client/dist
npm start             # serves API + client on :4000
```

## Tests

```bash
npm --prefix server test   # node:test integration suite (auth, CRUD, uploads, wishlist)
```

## API

| Method | Path                      | Auth         | Description                                    |
| ------ | ------------------------- | ------------ | ---------------------------------------------- |
| POST   | `/api/auth/register`      | —            | Create account → `{ token, user }`             |
| POST   | `/api/auth/login`         | —            | Log in → `{ token, user }`                     |
| GET    | `/api/auth/me`            | required     | Current user                                   |
| GET    | `/api/categories`         | —            | Category strip entries                         |
| GET    | `/api/destinations`       | —            | Distinct listing locations (autocomplete)      |
| GET    | `/api/listings`           | optional     | Listings + filters (below); per-user `saved`   |
| GET    | `/api/listings/mine`      | required     | The current user's own listings                |
| GET    | `/api/listings/:id`       | optional     | A single listing                               |
| POST   | `/api/listings`           | required     | Create (multipart; `photo` file field)         |
| PATCH  | `/api/listings/:id`       | required (owner) | Edit own listing                           |
| DELETE | `/api/listings/:id`       | required (owner) | Delete own listing                         |
| POST   | `/api/listings/:id/save`  | required     | Toggle the wishlist (heart) for the current user |

`GET /api/listings` filters (all optional, AND-combined): `category`, `q`,
`location`, `checkIn` / `checkOut` (ISO `YYYY-MM-DD`; a listing matches when one of
its availability ranges covers the stay), `guests` (capacity ≥ N), and `kind`
(`stay` default; `experience` / `service` return empty).

Host create/edit (`POST` / `PATCH /api/listings`) accept, alongside the listing
fields and `photo`: `location`, `guests`, and an availability range
`availStart` / `availEnd`.

Uploaded photos are served from `/uploads/<file>`.

## Notes / caveats

- The brand font *Subletair Cereal VF* is not bundled (licensed); Inter is loaded
  from Google Fonts as the substitute, matching the design system's own fallback.
- Seed listing imagery references the Unsplash CDN, same as the design bundle.
- Persistence is a local SQLite file (`server/data/subletair.db`, git-ignored).
  Set `JWT_SECRET` in production — the dev fallback is refused when
  `NODE_ENV=production`.
- Out of scope (intentionally): booking/payments, reviews, messaging, email
  verification, password reset.
