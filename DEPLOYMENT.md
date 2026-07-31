# Timeful Deployment Guide

Production and staging deployment using Docker Compose behind one shared Docker Caddy edge.

## Prerequisites

- Docker and Docker Compose
- Domain with DNS pointing to your server
- Inbound TCP ports 80 and 443, plus UDP port 443

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/deemp/timeful
cd timeful

# 2. Create both app environment files. Caddy reads their namespaced host variables.
cp .env.production.example .env.production
cp .env.staging.example .env.staging

# Edit both env files with their environment-specific values (see Configuration below).

# 3. Configure both app env files, including APP_BASE_URL and their CADDY_* values.
# Start the shared HTTPS edge once.
docker network create timeful-edge
docker volume create timeful-production-frontend-dist
docker volume create timeful-staging-frontend-dist
docker compose --env-file .env.production --env-file .env.staging -f compose.edge.yaml up -d

# 4. Build and start production.
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml up -d --build

# Start staging independently when needed.
# docker compose --project-name timeful-staging --env-file .env.staging -f compose.yaml -f compose.staging.yaml up -d --build
```

## Services

| Service              | Description                                                   | Port           |
| -------------------- | ------------------------------------------------------------- | -------------- |
| `mongo`              | MongoDB 7 database                                            | Internal only  |
| `frontend-artifacts` | Vue.js artifact export (outputs to shared volume, then exits) | N/A            |
| `server`             | Go backend                                                    | 127.0.0.1:3002 |

For staging, use `.env.staging` together with `compose.staging.yaml`; the server binds `127.0.0.1:3003`.

## Shared Caddy Edge

One Docker Caddy service owns public ports 80 and 443 for both environments. It routes each
hostname to the matching private backend and frontend artifacts over the `timeful-edge` Docker
network. Caddy handles:

- Automatic HTTPS certificates
- HTTP → HTTPS redirect
- www → non-www redirect
- Compression (gzip/zstd)
- Security headers

The root config imports a shared Timeful snippet and separate staging/production site files:

```text
caddy/Caddyfile
caddy/snippets/timeful.caddy
caddy/sites/production.caddy
caddy/sites/staging.caddy
```

The production and staging site hostnames are read from their respective app env files. DNS for
every canonical and `www` hostname must point to the server before Caddy can obtain its
certificates.

## Commands

> [!CAUTION]
> Use `down -v` only when intentionally discarding the Docker-managed data volumes for the selected environment.
>
> For production, this deletes the MongoDB data volume unless a backup is restored afterward.

```bash
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml up -d              # Start services
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml logs -f            # View logs
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml logs -f server     # View specific service logs
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml up -d --build      # Rebuild after code changes
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml down               # Stop services
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml down -v            # Stop and remove volumes (deletes data!)
```

Staging uses the same base commands with the staging env file and override:

```bash
docker compose --project-name timeful-staging --env-file .env.staging -f compose.yaml -f compose.staging.yaml up -d --build
docker compose --project-name timeful-staging --env-file .env.staging -f compose.yaml -f compose.staging.yaml logs -f
docker compose --project-name timeful-staging --env-file .env.staging -f compose.yaml -f compose.staging.yaml down
```

## Data & Backup

Data is persisted in Docker volumes: `mongo_data`, `frontend_dist`, `server_logs`.

The restore command below uses `--drop`.

> [!CAUTION]
> Run it only when you intend to replace the current `timeful` database with the backup archive.

```bash
# Backup MongoDB
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml exec mongo sh -c 'mongodump --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --db="$MONGODB_DATABASE" --archive=/data/db/backup.archive'
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml cp mongo:/data/db/backup.archive ./backup.archive

# Restore MongoDB
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml cp ./backup.archive mongo:/data/db/backup.archive
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml exec mongo sh -c 'mongorestore --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --drop --db="$MONGODB_DATABASE" --archive=/data/db/backup.archive'
```

## Troubleshooting

```bash
# Container won't start
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml logs server
ls -la .env.production

# MongoDB connection issues
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml ps
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml exec mongo sh -c 'mongosh --username "$MONGO_INITDB_ROOT_USERNAME" --password "$MONGO_INITDB_ROOT_PASSWORD" --authenticationDatabase admin --eval "db.adminCommand(\"ping\")"'

# Frontend not loading
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml logs frontend-artifacts
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml exec server ls -la /app/frontend/dist
```

---

## Configuration

### Required Environment Variables

Create `.env.production` from `.env.production.example` for production, or `.env.staging` from `.env.staging.example` for staging.

The selected root env file is the single source of truth for:

- Docker Compose interpolation
- frontend build args
- backend runtime configuration

See `docs/environments.md` for the full contract and development commands.

#### Required

| Variable         | Description                                                                 |
| ---------------- | --------------------------------------------------------------------------- |
| `CLIENT_ID`      | Google OAuth client ID                                                      |
| `CLIENT_SECRET`  | Google OAuth client secret                                                  |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data (generate with `openssl rand -base64 32`) |
| `SESSION_SECRET` | Session cookie encryption key (generate with `openssl rand -base64 32`)     |
| `APP_BASE_URL` | Canonical public HTTPS origin used in generated links and payment redirects |
| `MONGODB_ROOT_USERNAME` / `MONGODB_ROOT_PASSWORD` | MongoDB administrative account for backups and maintenance |
| `MONGODB_APP_USERNAME` / `MONGODB_APP_PASSWORD` | MongoDB application account with access only to `MONGODB_DATABASE` |
| `MONGODB_DATABASE` | Application database name; defaults to `timeful` |

#### Optional — Payments

| Variable                | Description                        |
| ----------------------- | ---------------------------------- |
| `STRIPE_API_KEY`        | Stripe API key                     |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret      |
| `STRIPE_*_PRICE_ID`     | Stripe price IDs for various plans |

#### Optional — Additional Calendars

| Variable                  | Description                             |
| ------------------------- | --------------------------------------- |
| `MICROSOFT_CLIENT_ID`     | Microsoft OAuth client ID (for Outlook) |
| `MICROSOFT_CLIENT_SECRET` | Microsoft OAuth client secret           |

#### Optional — CORS

| Variable       | Description                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `CORS_ORIGINS` | Comma-separated additional browser origins, such as the `www` hostname. `APP_BASE_URL` is always allowed. |

#### Optional — Other Services

| Variable                                     | Description                                  |
| -------------------------------------------- | -------------------------------------------- |
| `ANALYTICS_USERNAME` / `ANALYTICS_PASSWORD`  | Basic auth for /api/analytics routes         |
| `SERVICE_ACCOUNT_KEY_PATH`                   | Google Cloud service account for Cloud Tasks |
| `SLACK_*_WEBHOOK_URL`                        | Slack webhooks for notifications             |
| `GMAIL_APP_PASSWORD` / `TIMEFUL_EMAIL_ADDRESS` | Gmail SMTP for sending emails                |
| `LISTMONK_*`                                 | Listmonk email service configuration, including `LISTMONK_OTP_FROM_ADDRESS` for OTP senders |
| `VITE_SUPPORT_EMAIL`                         | Support email embedded in frontend artifacts |
| `DISCORD_BOT_TOKEN` / `GUILD_ID`             | Discord bot integration                      |

See `.env.production.example` and `.env.staging.example` for the complete lists.

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the following APIs:
   - Google Calendar API
   - People API (Contacts)
   - Admin SDK API (Directory)
4. Create OAuth 2.0 credentials (Web application type)
5. Add authorized redirect URIs:
   - `https://yourdomain.com/api/auth/callback`
   - `http://localhost:3002/api/auth/callback` (for development)
6. Copy the Client ID and Client Secret to your `.env`
