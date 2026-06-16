# Subletair v2 — Two-Sided Marketplace Design

_Date: 2026-06-16_

## Goal

Turn the existing guest-only Subletair marketplace into a two-sided marketplace:
**guests** browse / search / save listings, and **hosts** create and manage their
own listings. Every account can do both — "host" is simply the set of actions a
user takes on listings they own.

## Decisions (locked)

- **Identity:** Full auth — email + password (bcrypt), JWT, ownership + authorization.
- **Persistence:** File-based SQLite (`server/data/subletair.db`), replacing in-memory.
- **Listing photos:** File upload (server stores on disk, serves statically).
- **Wishlist:** Login-gated, per-user (no anonymous saving).
- **Routing:** Add `react-router-dom` for `/` (marketplace) and `/hosting` (host area).

## Architecture

### Backend (`server/`)

New dependencies: `bcryptjs`, `jsonwebtoken`, `multer`.

**Database (file-based SQLite).** On boot, create schema if absent; if `listings`
is empty, seed categories + demo listings attributed to a seeded demo host.

Tables:

- `users(id, name, email UNIQUE, password_hash, created_at)`
- `categories(key PK, label, sort)` — unchanged
- `listings(id, title, subtitle, price, rating, badge, image, cat, owner_id, created_at)`
  - `owner_id` FK → `users.id`. Drops the global `saved` column.
- `saved_listings(user_id, listing_id, PRIMARY KEY(user_id, listing_id))` — per-user wishlist.

**Auth.** `bcrypt` hashing; JWT signed with a server secret (`JWT_SECRET` env,
dev fallback constant). `authRequired` middleware verifies the bearer token and
attaches `req.user`. An `authOptional` variant attaches `req.user` when present
but does not reject — used by `GET /api/listings` so it can compute `saved`.

**Endpoints**

| Method | Path                     | Auth        | Description                                   |
| ------ | ------------------------ | ----------- | --------------------------------------------- |
| POST   | `/api/auth/register`     | none        | Create account, return `{ token, user }`      |
| POST   | `/api/auth/login`        | none        | Return `{ token, user }`                      |
| GET    | `/api/auth/me`           | required    | Current user                                  |
| GET    | `/api/categories`        | none        | Category strip entries                        |
| GET    | `/api/listings`          | optional    | List; `?category=&q=`; includes per-user `saved` |
| GET    | `/api/listings/mine`     | required    | Listings owned by current user                |
| GET    | `/api/listings/:id`      | optional    | Single listing (with `saved` if logged in)    |
| POST   | `/api/listings`          | required    | Create (multipart: fields + photo upload)     |
| PATCH  | `/api/listings/:id`      | required, owner | Edit own listing                          |
| DELETE | `/api/listings/:id`      | required, owner | Delete own listing                        |
| POST   | `/api/listings/:id/save` | required    | Toggle wishlist for current user              |

Authorization: mutations on `:id` return 403 if `listing.owner_id !== req.user.id`.

**Uploads.** `multer` writes to `server/uploads/` with a generated filename;
served at `/uploads/<file>`. Accept `image/jpeg|png|webp`, max ~5MB. A listing's
`image` is the resulting `/uploads/...` URL (or kept blank if none).

### Frontend (`client/`)

New dependency: `react-router-dom`.

**Auth context.** `AuthProvider` holds `{ user, token }`, persists token to
`localStorage`, exposes `login`, `register`, `logout`. The API client attaches
the bearer token to requests.

**Routing.** `/` → marketplace (existing), `/hosting` → host dashboard
(redirects to an auth prompt if logged out).

**Auth UI.** Login/Register modal. The `TopNav` account menu shows *Log in /
Sign up* when logged out; when logged in shows the user's initial avatar and a
**"Switch to hosting"** link plus *Log out*.

**Host dashboard (`/hosting`).**
- "Your listings" — grid of the host's own listings with **Edit** / **Delete**.
- "Create listing" form — title, subtitle, price, category select, optional
  rating, photo upload — composed from design-system components (`TextInput`,
  `Stepper`, `Button`). Edit reuses the same form pre-filled.

**Guest marketplace.** Unchanged visually; saving now requires login (clicking
the heart while logged out opens the auth modal). Host-created listings appear
alongside seed listings.

## Data flow

1. User registers/logs in → receives JWT → stored in `localStorage` → attached to
   subsequent requests.
2. Host submits create form (multipart) → server validates + stores photo →
   inserts listing with `owner_id` → appears in `/api/listings` for everyone.
3. Guest clicks heart → `POST /listings/:id/save` toggles a `saved_listings` row →
   `saved` reflected on next fetch and via optimistic UI.

## Error handling

- Auth: 400 on missing fields / duplicate email; 401 on bad credentials or
  invalid/expired token; 403 on editing a listing you don't own.
- Uploads: 400 on disallowed type or oversize.
- Frontend surfaces auth errors inline in the modal and listing-form errors inline.

## Testing

- Backend: lightweight integration checks via `curl`/node against the running API —
  register → login → create listing (multipart) → appears in list → save toggle →
  edit/delete authorization (owner vs non-owner) → 401/403 paths.
- Frontend: `vite build` must pass; manual click-through of register → create
  listing → see it on home → save → manage in dashboard.

## Out of scope (YAGNI)

Booking / payments, reviews, messaging, email verification, password reset,
multi-photo galleries, map view.
