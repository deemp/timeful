# Environment Files

Timeful uses one root env file per environment:

- `.env.development` for local development
- `.env.staging` for staging deployments and staging-style runs
- `.env.production` for production builds and production-style runs

The application-level deployment environment is defined separately from toolchain mode:

- backend runtime: `APP_ENV`
- frontend build-time/browser boundary: `VITE_APP_ENV`

Allowed values for both are `development`, `staging`, and `production`.
When unset, blank, or invalid, both sides default to `development`.
Normal deployments should keep `APP_ENV` and `VITE_APP_ENV` aligned.
`staging` is preserved as a distinct label, but it uses production-like defaults unless overridden explicitly.

Shareable defaults live in:

- `.env.development.example`
- `.env.staging.example`
- `.env.production.example`

## How the env files are used

- Frontend dev tooling reads `.env.development` through `frontend/config/tooling.ts`.
- Frontend staging-style builds read `.env.staging`.
- Frontend production builds and `vite preview` read `.env.production`.
- Vite client env loading uses the repo root as `envDir`, so `import.meta.env.VITE_*` also comes from the same root file for the active mode.
- Docker Compose reads the selected root env file through `--env-file`.
- `frontend-artifacts` receives frontend build-time values from that same Compose env file.
- `server` receives backend runtime variables from Compose interpolation based on that same file.
- The edge Caddy Compose project reads both `.env.production` and `.env.staging`; it only
  passes their namespaced `CADDY_*` values into Caddy.
- When the Go server is run directly, it prefers `.env.development` for `APP_ENV=development`, `.env.staging` for `APP_ENV=staging`, and `.env.production` for `APP_ENV=production`. `GIN_MODE` still controls Gin release/debug behavior, and `ENV_FILE=/path/to/file` overrides the lookup entirely.

## Variable ownership

Frontend tooling variables:

- `VITE_DEV_HOST`
- `VITE_DEV_PORT`
- `VITE_API_PROXY_TARGET`
- `VITE_PREVIEW_HOST`
- `VITE_PREVIEW_PORT`

Frontend build-time variables:

- `VITE_APP_ENV`
- `VITE_POSTHOG_API_KEY`
- `VITE_POSTHOG_API_HOST`
- `VITE_ENABLE_SIGN_IN`
- `VITE_ENABLE_FREEMIUM`
- `VITE_ENABLE_RICH_LANDING`
- `VITE_ENABLE_THIRD_PARTY_SHELL`
- `VITE_FEEDBACK_URL`
- `VITE_SUPPORT_EMAIL`
- `VITE_GITHUB_REPO_URL`

Compose-to-frontend build arg mappings:

- `CLIENT_ID` -> `VITE_GOOGLE_CLIENT_ID`
- `MICROSOFT_CLIENT_ID` -> `VITE_MICROSOFT_CLIENT_ID`
- the `VITE_*` build-time flags above are passed through directly

## Frontend build-time flag semantics

- **`VITE_ENABLE_SIGN_IN`** — Controls sign-in and sign-up availability in the frontend.
  Defaults to `true` when unset or blank. Set to `false` to hide sign-in buttons, redirect
  sign-in/sign-up routes away, and replace sign-in-gated feature prompts with
  "Requires sign-in, which is disabled in this build." Existing auth sessions still
  work, so previously signed-in users retain access to auth-protected routes.
  This is a frontend-only gate; backend auth endpoints remain live regardless.
- **`VITE_ENABLE_RICH_LANDING`** — Controls whether the full landing page is shown.
  Defaults to `true` when unset or blank. Set to `false` to keep only the Timeful
   brand, the header "How it works" action, the GitHub icon, the "Find a time to meet"
   heading, the primary create-event CTA, and the hero preview card. This minimal mode
   hides landing sign-in affordances, the in-page how-it-works section, testimonials, the FAQ,
   and the footer.
- **`VITE_FEEDBACK_URL`** — Controls where frontend “Give feedback” links point.
  Defaults to `https://github.com/deemp/timeful/issues` when unset or blank.
- **`VITE_SUPPORT_EMAIL`** — Controls the support email address shown in the frontend. Support
  affordances are hidden when unset or blank.
- **`VITE_POSTHOG_API_HOST`** — Optional PostHog API host. Set this when analytics uses a
  self-hosted or reverse-proxied PostHog endpoint; otherwise the PostHog SDK default is used.
- **`VITE_GITHUB_REPO_URL`** — Controls where frontend GitHub links point. This value
  is required for Docker-built frontend artifacts.

Backend runtime variables:

- `APP_ENV`
- `APP_BASE_URL`
- `CLIENT_ID`
- `CLIENT_SECRET`
- `ANDROID_CLIENT_ID`
- `IOS_CLIENT_ID`
- `MICROSOFT_CLIENT_ID`
- `MICROSOFT_CLIENT_SECRET`
- `MONGODB_URI` (development and direct server runs)
- `MONGODB_DATABASE`
- `MONGODB_ROOT_USERNAME`
- `MONGODB_ROOT_PASSWORD`
- `MONGODB_APP_USERNAME`
- `MONGODB_APP_PASSWORD`
- `ENCRYPTION_KEY`
- `SESSION_SECRET`
- `CORS_ORIGINS`
- `SERVICE_ACCOUNT_KEY_PATH`
- `ANALYTICS_USERNAME`
- `ANALYTICS_PASSWORD`
- `DISCORD_BOT_TOKEN`
- `DISCORD_BOT_CHANNEL`
- `GUILD_ID`
- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_CLOUD_TASKS_LOCATION`
- `GOOGLE_CLOUD_TASKS_QUEUE`
- `SLACK_DEV_WEBHOOK_URL`
- `SLACK_PROD_WEBHOOK_URL`
- `SLACK_MONETIZATION_WEBHOOK_URL`
- `MAILCHIMP_API_KEY`
- `MAILJET_API_KEY`
- `MAILJET_API_SECRET`
- `MAILJET_LIST_ID`
- `LISTMONK_ENABLED`
- `LISTMONK_URL`
- `LISTMONK_USERNAME`
- `LISTMONK_PASSWORD`
- `LISTMONK_LIST_ID`
- `LISTMONK_INITIAL_EMAIL_REMINDER_ID`
- `LISTMONK_SECOND_EMAIL_REMINDER_ID`
- `LISTMONK_FINAL_EMAIL_REMINDER_ID`
- `LISTMONK_OTP_EMAIL_TEMPLATE_ID`
- `LISTMONK_OTP_FROM_ADDRESS`
- `GMAIL_APP_PASSWORD`
- `TIMEFUL_EMAIL_ADDRESS`
- `STRIPE_API_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_MONTHLY_STUDENT_PRICE_ID`
- `STRIPE_YEARLY_PRICE_ID`
- `STRIPE_YEARLY_STUDENT_PRICE_ID`
- `STRIPE_LIFETIME_PRICE_ID`
- `STRIPE_LIFETIME_PRICE_ID_2`
- `STRIPE_LIFETIME_STUDENT_PRICE_ID`
- `GIN_MODE`

Deployment environment semantics:

- `APP_ENV=development` defaults the Go server to port `3002`, prefers `.env.development`, and defaults Gin to debug unless `GIN_MODE` overrides it.
- `APP_ENV=staging` defaults the Go server to port `3003`, prefers `.env.staging`, and defaults Gin to release unless `GIN_MODE` overrides it.
- `APP_ENV=production` defaults the Go server to port `3002`, prefers `.env.production`, and defaults Gin to release unless `GIN_MODE` overrides it.
- `VITE_APP_ENV` is the frontend-facing mirror for browser-exposed environment-dependent behavior and should normally match `APP_ENV`.
- `APP_BASE_URL` is required and must be an absolute HTTP(S) origin without a path. The backend
  uses it for generated email links, Cloud Tasks payloads, Stripe redirects, and Slack messages.
- `CORS_ORIGINS` is an optional comma-separated list of additional browser origins. The normalized
  `APP_BASE_URL` is always allowed, so use this for `www`, localhost, preview, or alternate-client
  origins only.
- `LISTMONK_OTP_FROM_ADDRESS` is the sender used for OTP emails. It must be a valid mailbox or
  RFC 5322 display-name address when an OTP email is sent.

## Precedence

- For frontend tooling, shell variables override values from `.env.development`, `.env.staging`, or `.env.production`.
- For Compose commands, shell variables passed into `docker compose --env-file ...` override values from the selected env file during interpolation.
- `ENV_FILE` has highest priority for direct backend runs because it explicitly selects which file the Go server should load.

## Commands

Development:

```sh
cp .env.development.example .env.development
docker compose --env-file .env.development -f compose.yaml -f compose.development.yaml up --build mongo server
cd frontend
npm run dev
```

Staging Docker Compose:

```sh
cp .env.staging.example .env.staging
docker compose --project-name timeful-staging --env-file .env.staging -f compose.yaml -f compose.staging.yaml up -d --build
```

Production-style local build/preview:

```sh
cp .env.production.example .env.production
cd frontend
npm run build
npm run preview
```

Production Docker Compose:

```sh
cp .env.production.example .env.production
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml up -d --build
```

## Shared HTTPS edge

Local development does not run Caddy. It uses the Vite server and its same-origin API proxy.
When staging and production share a host, a single Docker Caddy service owns public ports 80
and 443, issues certificates, and routes requests by hostname to each stack over the
`timeful-edge` Docker network.

Set these values in their corresponding app env files to DNS names whose `A` and, if
applicable, `AAAA` records point to the host:

- `CADDY_PRODUCTION_DOMAIN`
- `CADDY_PRODUCTION_WWW_DOMAIN`
- `CADDY_STAGING_DOMAIN`
- `CADDY_STAGING_WWW_DOMAIN`

The canonical Caddy hostname must match the hostname in that environment's `APP_BASE_URL`.

Provision the shared network and artifact volumes once. They are external so tearing down one
Compose project cannot remove resources used by another:

```sh
docker network create timeful-edge
docker volume create timeful-production-frontend-dist
docker volume create timeful-staging-frontend-dist
```

Then start the edge by merging the two app env files. Compose uses them for interpolation, but
only the four `CADDY_*` variables are passed to Caddy:

```sh
docker compose --env-file .env.production --env-file .env.staging -f compose.edge.yaml up -d
```

Then start each app as a separate project:

```sh
docker compose --project-name timeful-production --env-file .env.production -f compose.yaml -f compose.production.yaml up -d --build
docker compose --project-name timeful-staging --env-file .env.staging -f compose.yaml -f compose.staging.yaml up -d --build
```

The edge configuration is split into `caddy/Caddyfile`, shared handlers in
`caddy/snippets/timeful.caddy`, and one site file per environment. Keep shared routing in the
snippet; site files should only provide hostnames, upstreams, and frontend roots.

Open inbound TCP ports 80 and 443 and UDP port 443. Caddy automatically redirects HTTP to
HTTPS and obtains certificates after DNS points to the host. Update OAuth redirect URIs and
allowed origins to use the configured HTTPS canonical hostnames.

## MongoDB authentication

Development and test Compose stacks use unauthenticated, isolated MongoDB instances.
Staging and production require separate root and application credentials. Their overlays
create the root account and an application account with `readWrite` access only to the configured
`MONGODB_DATABASE`; Compose constructs the server connection URI from the application credentials.
The new default database name is `timeful`.

Changing `MONGODB_DATABASE` selects a different database; it does not rename or copy existing
data. Migrate a populated deployment by backing up the old database, restoring it under the new
name, creating the application user for the new database, then deploying the changed environment.

## External Service Names

`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLOUD_TASKS_LOCATION`, and
`GOOGLE_CLOUD_TASKS_QUEUE` form the Cloud Tasks parent used for reminder jobs. The defaults name
the Timeful project and existing `us-central1` / `SendReminderEmail` resources. Create the target
project and queue, grant the configured service account access, and update these values before
retiring the old Google Cloud project; Google Cloud project IDs cannot be renamed in place.

`DISCORD_BOT_CHANNEL` selects the channel used by the Discord bot. Set it explicitly for each
environment after creating the replacement channel; the Timeful defaults are only used when the
variable is unset.

Mongo initialization scripts run only for an empty data volume. To enable authentication
for an existing unauthenticated staging or production volume, first populate the new
credentials in the selected env file and run the bootstrap script against the currently
running unauthenticated stack:

```sh
./scripts/mongo/bootstrap-existing-users.sh .env.production
```

Then stop the existing stack and start it with the appropriate authenticated overlay.
The bootstrap script is idempotent and does not remove data.

## Server test modes

Pure Go unit tests can run either on the host or in a container.

Mongo-backed route tests should use the isolated Compose overlay by default so they run against a dedicated Docker network and test-only Mongo volume:

```sh
docker compose --env-file .env.development -f compose.yaml -f compose.test.yaml up -d mongo-test
docker compose --env-file .env.development -f compose.yaml -f compose.test.yaml run --rm server-test
docker compose --env-file .env.development -f compose.yaml -f compose.test.yaml down -v
```

> [!CAUTION]
> The `down -v` cleanup is intentional for this test-only stack.
>
> Do not use it against the development or production Compose project unless you mean to remove that environment's persisted volumes.

The `server-test` service mounts `./server`, connects to `mongodb://mongo-test:27017`, and runs only the Mongo-backed route suite from `server/routes/events_read_filters_test.go`.

Host-run Mongo-backed tests remain opt-in. When running them outside the Compose test stack, set `MONGODB_URI` explicitly to a dedicated test database. Do not rely on a local `127.0.0.1:27017` fallback.
