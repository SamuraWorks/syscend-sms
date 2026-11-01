# Syscend Campus — Railway Deployment Guide

## Overview

Syscend Campus runs on **Laravel 13** (PHP 8.2) + **React/Inertia** + **PostgreSQL**.
Railway deploys via Nixpacks with the configuration in `railway.json`, `nixpacks.toml`, and `Procfile`.

---

## Architecture on Railway

| Service | Purpose | Config |
|---------|---------|--------|
| **Web** | Main app server | `Procfile` web process |
| **Worker** | Queue consumer (`jobs` table) | `Procfile` worker process |
| **Scheduler** | Laravel task scheduler (cron) | `Procfile` scheduler process |
| **PostgreSQL** | Primary database | Railway add-on |

---

## Step 1 — Create a Railway Project

1. Go to [railway.app](https://railway.app) and log in.
2. Click **New Project** → **Deploy from GitHub Repo**.
3. Select `SamuraWorks/syscend-campus`.
4. Railway detects `railway.json` and `nixpacks.toml` automatically.

---

## Step 2 — Add a PostgreSQL Database

1. Inside your project, click **New** → **Database** → **PostgreSQL**.
2. Railway provisions a database and exposes `DATABASE_URL` on the PostgreSQL service.
3. Link it to your app service: **Settings** → **Networking** → **Public Networking** (optional).

Railway sets these env vars on the PostgreSQL service (you don't need to set them manually):

```
PGHOST=...
PGPORT=...
PGDATABASE=...
PGUSER=...
PGPASSWORD=...
DATABASE_URL=postgresql://... # Full connection string
```

---

## Step 3 — Set Environment Variables

Go to your app service → **Variables** and add all of the following:

### Critical (must set)

| Variable | Value | Notes |
|----------|-------|-------|
| `APP_KEY` | *(auto-generated)* | Run `php artisan key:generate` after first deploy, or paste a `base64:` key |
| `APP_URL` | `https://your-app.up.railway.app` | Must match your domain |
| `DB_CONNECTION` | `pgsql` | |
| `DB_HOST` | `${{Postgres.PGHOST}}` | Railway variable reference (auto-linked) |
| `DB_PORT` | `${{Postgres.PGPORT}}` | |
| `DB_DATABASE` | `${{Postgres.PGDATABASE}}` | |
| `DB_USERNAME` | `${{Postgres.PGUSER}}` | |
| `DB_PASSWORD` | `${{Postgres.PGPASSWORD}}` | |
| `DB_SSLMODE` | `require` | Required for Railway PostgreSQL |
| `APP_ENV` | `production` | |
| `APP_DEBUG` | `false` | Never enable in production |
| `SESSION_DOMAIN` | *(leave empty)* | Let Laravel auto-detect from APP_URL |
| `SESSION_SECURE_COOKIE` | `true` | Required for HTTPS |

### Session & Cache

| Variable | Value |
|----------|-------|
| `SESSION_DRIVER` | `database` |
| `SESSION_LIFETIME` | `60` |
| `SESSION_ENCRYPT` | `true` |
| `SESSION_SAME_SITE` | `lax` |
| `CACHE_STORE` | `database` |
| `QUEUE_CONNECTION` | `database` |

### Logging

| Variable | Value |
|----------|-------|
| `LOG_CHANNEL` | `stack` |
| `LOG_STACK` | `daily,stderr` |
| `LOG_LEVEL` | `error` |

### Mail (optional, configure later)

| Variable | Value |
|----------|-------|
| `MAIL_MAILER` | `smtp` |
| `MAIL_HOST` | *(your SMTP host)* |
| `MAIL_PORT` | `587` |
| `MAIL_USERNAME` | *(your SMTP username)* |
| `MAIL_PASSWORD` | *(your SMTP password)* |
| `MAIL_SCHEME` | `tls` |
| `MAIL_FROM_ADDRESS` | `noreply@syscend.com` |
| `MAIL_FROM_NAME` | `Syscend Campus` |

### Payment Gateways (configure per-school via database)

| Variable | Value |
|----------|-------|
| `ORANGE_MONEY_RETURN_URL` | `${APP_URL}/school/fees/payments/callback?method=orange_money` |
| `ORANGE_MONEY_CANCEL_URL` | `${APP_URL}/school/fees/payments/callback?method=orange_money&status=cancelled` |
| `ORANGE_MONEY_WEBHOOK_URL` | `${APP_URL}/api/v1/payments/webhook/orange-money` |

### AI (optional)

| Variable | Value |
|----------|-------|
| `GEMINI_API_KEY` | *(your Gemini API key)* |

---

## Step 4 — First Deploy & Post-Deploy Commands

After the first deploy completes, run these commands in Railway's **Shell** tab:

```bash
# Generate app key (if not set)
php artisan key:generate --force

# Run migrations
php artisan migrate --force

# Seed admin user
php artisan db:seed --class=AdminSeeder

# Create storage symlink
php artisan storage:link

# Cache config/routes/views for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## Step 5 — Add Worker & Scheduler Services

Railway's Procfile defines three processes. You need separate services for worker and scheduler:

### Worker Service
1. Click **New** → **Service** → **Select the same repo**.
2. Go to **Settings** → **Deploy** → set **Custom Start Command**:
   ```
   php artisan queue:work --sleep=3 --tries=3 --max-time=3600
   ```
3. Ensure the same env vars are linked (copy from the web service).

### Scheduler Service
1. Click **New** → **Service** → **Select the same repo**.
2. Go to **Settings** → **Deploy** → set **Custom Start Command**:
   ```
   php artisan schedule:work
   ```

---

## Step 6 — Domain & HTTPS

Railway provides a free `*.up.railway.app` domain with automatic HTTPS.

To use a custom domain (e.g., `syscend.com`):
1. Go to **Settings** → **Networking** → **Custom Domain**.
2. Add your domain and configure DNS CNAME to point to `cname.up.railway.app`.
3. Update `APP_URL` to `https://syscend.com`.
4. Update `SESSION_DOMAIN` if using a subdomain.

---

## Health Check

The app exposes a health endpoint at `/up` (configured in `bootstrap/app.php`).
Railway monitors this endpoint and restarts the service if it fails.

---

## File Uploads (Storage)

By default, uploaded files are stored locally. For persistent storage on Railway:

**Option A — Railway Volumes (recommended)**
1. Go to your web service → **Settings** → **Volumes**.
2. Add a volume mount at `/var/www/html/storage/app`.
3. Files will persist across deploys.

**Option B — External S3/MinIO**
Set `FILESYSTEM_DISK=s3` and configure S3 credentials in env vars.

---

## Queue Worker Configuration

- Uses the `database` driver with the `jobs` table.
- `after_commit=true` ensures jobs only run after transactions commit.
- Worker runs with `--max-time=3600` (1 hour) to prevent memory leaks.
- Failed jobs are logged to `failed_jobs` table.
- Monitor with: `php artisan queue:failed`

---

## Troubleshooting

### App won't start
- Check logs in Railway dashboard → **Deploy Logs**.
- Common: Missing `DB_CONNECTION=pgsql` env var.
- Common: Missing `php artisan migrate` after first deploy.

### 502 Bad Gateway
- The app may still be building. Check **Deploy Logs**.
- Ensure `php artisan serve --host=0.0.0.0 --port=$PORT` is the start command.

### CSRF token mismatch
- Ensure `SESSION_SECURE_COOKIE=true` and your domain is correct.

### Files not persisting
- Add a Railway Volume for `/var/www/html/storage/app`.

### Queue jobs not processing
- Ensure the worker service is running with the correct start command.
- Check `php artisan queue:failed` for failed jobs.

---

## Environment Variable Quick Reference

All variables the app reads (from codebase audit):

```
# Required
APP_NAME, APP_ENV, APP_KEY, APP_DEBUG, APP_URL
DB_CONNECTION, DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD, DB_SSLMODE

# Session
SESSION_DRIVER, SESSION_LIFETIME, SESSION_ENCRYPT, SESSION_DOMAIN,
SESSION_SECURE_COOKIE, SESSION_HTTP_ONLY, SESSION_SAME_SITE

# Cache & Queue
CACHE_STORE, QUEUE_CONNECTION, QUEUE_FAILED_DRIVER

# Logging
LOG_CHANNEL, LOG_STACK, LOG_LEVEL, LOG_DEPRECATIONS_CHANNEL

# Mail
MAIL_MAILER, MAIL_SCHEME, MAIL_HOST, MAIL_PORT, MAIL_USERNAME,
MAIL_PASSWORD, MAIL_FROM_ADDRESS, MAIL_FROM_NAME

# Filesystem
FILESYSTEM_DISK

# Payments (per-school via DB)
ORANGE_MONEY_RETURN_URL, ORANGE_MONEY_CANCEL_URL, ORANGE_MONEY_WEBHOOK_URL

# AI
GEMINI_API_KEY

# SMS (per-school via DB)
SMS_PROVIDER, VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_SENDER_ID,
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER

# Frontend
VITE_APP_NAME
```

---

## Build Process

Nixpacks handles the build automatically:

1. **Setup**: Installs `libpng`, `libjpeg`, `freetype`, `gd` (required by DomPDF).
2. **Install**: `composer install --no-dev` + `npm ci`.
3. **Build**: `npm run build` (Vite) + Laravel config/route/view caching.
4. **Start**: `php artisan serve --host=0.0.0.0 --port=$PORT`.

The `package.json` declares `"engines": {"node": ">=20"}` to ensure Railway uses Node 20+.

---

## Security Notes

- `APP_DEBUG=false` — No stack traces exposed.
- `SESSION_SECURE_COOKIE=true` — Cookies only sent over HTTPS.
- `APP_ENV=production` — Disables demo reset, enables maintenance mode.
- CORS restricted to `APP_URL` only.
- AdminSeeder generates a random 16-char password (no hardcoded credentials).
- Orange Money webhook logs only `transaction_id`, `status`, `timestamp`.
