# StreamFlix

A Netflix-style streaming platform being built as three independent apps: `client` (viewer site — not yet built), `admin` (admin dashboard), and `server` (REST API).

## Current build phase

This delivery covers **Phase 1: Admin Dashboard + Backend Foundation**.

Built and working end-to-end:

- **`server/`** — Express + TypeScript + MongoDB API
  - JWT auth (access + refresh tokens, httpOnly refresh cookie) with `user` / `admin` / `superadmin` roles
  - Full CRUD + publish/feature/trending toggles for Movies
  - Full CRUD + publish toggle for Series, plus nested Episodes CRUD
  - Genres and Categories CRUD
  - User management (list, search, change role, suspend, delete)
  - Dashboard analytics endpoint (totals, top titles, 14-day signup trend)
  - Singleton Settings endpoint
  - File upload endpoint (poster/banner/trailer/video) storing to local disk in dev
  - Middleware: JWT auth, admin-only guard, rate limiting, Zod validation, centralized error handling, Winston logging, Helmet, CORS
- **`admin/`** — React + Vite + TypeScript + Tailwind dashboard
  - Login (admin/superadmin only), protected routing, automatic token refresh
  - Dashboard with live stat cards and charts (Recharts)
  - Movies: search, paginate, create/edit, publish/unpublish, feature/trending toggle, delete
  - Series: same CRUD + a nested Episode manager modal
  - Genres & Categories management
  - Users: search, role change, suspend/reactivate, delete
  - Analytics page (content pipeline breakdown, most-watched)
  - Settings page (site name, maintenance mode, registration toggle, etc.)
  - Upload Center: real drag-and-drop queue with per-file progress bars, hitting the live upload endpoint

## Not yet built (next phases)

- `client/` viewer-facing site (hero banner, watch player, continue watching, etc.)
- FFmpeg-based HLS transcoding pipeline (240p–1080p) and Cloudflare R2 storage integration — the upload endpoint currently stores files to local disk and returns a direct URL; swapping in R2 + a transcoding queue is the next milestone
- WatchHistory / ContinueWatching / MyList data flows (models exist for User.myList; the rest ship with the client app)
- hls.js playback

## Getting started

### 1. Server

```bash
cd server
cp .env.example .env   # fill in MONGODB_URI and JWT secrets
npm install
npm run dev             # http://localhost:5000
```

Create your first admin account:

```bash
npx ts-node src/scripts/seedAdmin.ts admin@streamflix.com "a-strong-password" "Admin Name"
```

### 2. Admin dashboard

```bash
cd admin
cp .env.example .env    # VITE_API_URL=http://localhost:5000/api
npm install
npm run dev              # http://localhost:5174
```

Log in with the account you seeded above.

## Folder structure

```
streamflix/
├── server/                  # Express API
│   └── src/
│       ├── config/          # DB connection
│       ├── models/          # Mongoose schemas
│       ├── middleware/      # auth, validation, rate limiting, error handling, uploads
│       ├── controllers/     # route handlers
│       ├── routes/          # route definitions
│       ├── validators/      # Zod schemas
│       ├── utils/           # logger, jwt, slugify, ApiError, asyncHandler
│       └── scripts/         # seedAdmin
│
├── admin/                   # Admin dashboard (React + Vite + TS + Tailwind)
│   └── src/
│       ├── api/             # axios instance + per-resource API modules
│       ├── context/         # AuthContext
│       ├── components/      # layout, protected route, shared UI
│       ├── pages/           # one file per admin screen
│       └── types/           # shared TS types
│
└── docs/
```

See `docs/API.md` for endpoint documentation and `docs/ENVIRONMENT.md` for environment variable details.
