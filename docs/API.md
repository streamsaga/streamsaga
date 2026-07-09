# StreamFlix API Documentation

Base URL: `http://localhost:5000/api`

All responses use the shape `{ success: boolean, data?: ..., message?: string }`.
Admin-only routes require `Authorization: Bearer <accessToken>` for a user with role `admin` or `superadmin`.

## Auth (`/auth`)

| Method | Path            | Auth  | Description                              |
|--------|-----------------|-------|-------------------------------------------|
| POST   | `/register`     | None  | Create a `user`-role account              |
| POST   | `/login`        | None  | Login for any role                        |
| POST   | `/admin/login`  | None  | Login, rejects non-admin roles            |
| POST   | `/refresh`      | Cookie| Exchange refresh cookie for new access token |
| POST   | `/logout`       | Cookie| Invalidate refresh token                  |
| GET    | `/me`           | Bearer| Current user profile                      |

Access tokens expire in 15 minutes by default; refresh tokens are stored in an httpOnly cookie scoped to `/api/auth` and expire in 7 days.

## Movies (`/movies`)

| Method | Path                  | Auth  | Description                          |
|--------|-----------------------|-------|----------------------------------------|
| GET    | `/`                   | None  | List/search/filter published-and-all movies (paginated) |
| GET    | `/slug/:slug`         | None  | Get a published movie by slug          |
| POST   | `/`                   | Admin | Create movie (status starts `draft`)   |
| GET    | `/:id`                | Admin | Get movie by id                        |
| PUT    | `/:id`                | Admin | Update movie                           |
| DELETE | `/:id`                | Admin | Delete movie                           |
| PATCH  | `/:id/publish`        | Admin | Set status to `published`              |
| PATCH  | `/:id/unpublish`      | Admin | Set status back to `draft`             |
| PATCH  | `/:id/featured`       | Admin | Toggle `isFeatured`                    |
| PATCH  | `/:id/trending`       | Admin | Toggle `isTrending`                    |

Query params on `GET /`: `page`, `limit`, `search`, `genre`, `category`, `status`, `featured`, `trending`.

## Series (`/series`) & Episodes

| Method | Path                              | Auth  | Description               |
|--------|-----------------------------------|-------|----------------------------|
| GET    | `/series`                         | None  | List/search series          |
| GET    | `/series/:id`                     | None  | Get series by id            |
| POST   | `/series`                         | Admin | Create series                |
| PUT    | `/series/:id`                     | Admin | Update series                |
| DELETE | `/series/:id`                     | Admin | Delete series                |
| PATCH  | `/series/:id/publish`             | Admin | Publish                      |
| PATCH  | `/series/:id/unpublish`           | Admin | Unpublish                    |
| GET    | `/series/:seriesId/episodes`      | None  | List episodes for a series   |
| POST   | `/series/:seriesId/episodes`      | Admin | Add an episode                |
| PUT    | `/episodes/:id`                   | Admin | Update an episode             |
| DELETE | `/episodes/:id`                   | Admin | Delete an episode             |

## Genres (`/genres`) & Categories (`/categories`)

Standard CRUD; `GET` is public, `POST` / `PUT` / `DELETE` require admin.

## Users (`/users`) — admin only

| Method | Path             | Description                    |
|--------|------------------|----------------------------------|
| GET    | `/`              | List/search users (paginated)   |
| GET    | `/:id`           | Get user by id                  |
| PATCH  | `/:id/role`      | Change role                      |
| PATCH  | `/:id/active`    | Toggle active/suspended           |
| DELETE | `/:id`           | Delete user                       |

## Dashboard (`/dashboard`) — admin only

`GET /stats` → totals (movies/series/users/published/draft/processing), top 5 movies by views, 14-day signup trend.

## Settings (`/settings`) — admin only

`GET /` and `PUT /` on a singleton settings document (site name, description, logo, support email, maintenance mode, registration toggle).

## Uploads (`/uploads`) — admin only

| Method | Path        | Field name | Description                          |
|--------|-------------|------------|----------------------------------------|
| POST   | `/poster`   | `poster`   | Image upload, returns a direct URL    |
| POST   | `/banner`   | `banner`   | Image upload                          |
| POST   | `/trailer`  | `trailer`  | Video upload                          |
| POST   | `/video`    | `video`    | Video upload (raw movie/episode file) |

Files are currently stored to local disk under `server/uploads/` and served from `/uploads/...`. This will be replaced by direct-to-R2 multipart uploads plus an FFmpeg transcoding queue in the next build phase — the API surface (`{ url, originalName, size, mimeType }`) is designed to stay the same after that swap.
