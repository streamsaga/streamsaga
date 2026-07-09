# Environment Variables

## `server/.env`

| Variable                 | Required | Description                                              |
|---------------------------|----------|-----------------------------------------------------------|
| `PORT`                    | No       | Defaults to `5000`                                        |
| `NODE_ENV`                | No       | `development` / `production`                               |
| `CLIENT_URL`               | No       | Origin allowed by CORS for the viewer site                 |
| `ADMIN_URL`                 | No       | Origin allowed by CORS for the admin dashboard              |
| `MONGODB_URI`              | Yes      | MongoDB connection string                                   |
| `JWT_ACCESS_SECRET`        | Yes      | Signing secret for short-lived access tokens                |
| `JWT_REFRESH_SECRET`       | Yes      | Signing secret for refresh tokens (must differ from above)  |
| `JWT_ACCESS_EXPIRES_IN`    | No       | Defaults to `15m`                                            |
| `JWT_REFRESH_EXPIRES_IN`   | No       | Defaults to `7d`                                              |
| `R2_ACCOUNT_ID`            | No*      | Cloudflare R2 account id — used once the storage pipeline is wired in |
| `R2_ENDPOINT`              | No*      | R2 S3-compatible endpoint                                     |
| `R2_ACCESS_KEY_ID`         | No*      | R2 access key                                                 |
| `R2_SECRET_ACCESS_KEY`     | No*      | R2 secret key                                                 |
| `R2_BUCKET`                | No*      | R2 bucket name                                                |

\* Not required for the current phase — uploads are stored to local disk until the R2 integration ships.

Never commit a real `.env` file. `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must be long, random, and different from each other; the server refuses to start without both set.

## `admin/.env`

| Variable        | Required | Description                                |
|------------------|----------|----------------------------------------------|
| `VITE_API_URL`   | Yes      | Base URL of the server API, e.g. `http://localhost:5000/api` |
