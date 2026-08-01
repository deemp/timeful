# Repository Layout

This repo contains:

- a frontend in `./frontend`
- a backend in `./server`

## Working Defaults

Unless the user explicitly asks for server changes:

- treat `frontend/` as the primary working directory
- use clean layout-based fixes, not hacks
- prefer adding regression tests before fixing frontend bugs
- keep repo-tracked frontend browser checks under `frontend/e2e`
- newly added regression tests may fail when they are meant to expose an existing bug
- first confirm that the finding you plan to work on still reproduces
- update the relevant findings handoff file when adding or refining reproductions
- suggest new findings if you notice them

Canonical findings location:

- `findings/*.md`

## Server Test Workflow

For backend work that touches Mongo-backed route tests:

- use the isolated test overlay in `compose.test.yaml` as the default path
- start test Mongo with `docker compose --env-file .env.development -f compose.yaml -f compose.test.yaml up -d mongo-test`
- run the scoped route suite with `docker compose --env-file .env.development -f compose.yaml -f compose.test.yaml run --rm server-test`
- clean up isolated test state with `docker compose --env-file .env.development -f compose.yaml -f compose.test.yaml down -v`
- prefer the isolated Compose stack over host Mongo for repeatable local and CI-friendly runs
- if Mongo-backed tests are run directly on the host, require an explicit `MONGODB_URI` pointing at a dedicated test database
- do not rely on a `127.0.0.1:27017` fallback for Mongo-backed route tests

## Cross-Cutting Frontend Rules

Follow the frontend ADRs and `./frontend/AGENTS.md` for implementation details. In particular:

- keep boundary and transport types separate from internal types
- preserve one canonical internal shape per concept
- keep compatibility coercions and transport decoding or encoding at explicit boundaries, not inside views, composables, or submit paths
- many Temporal regressions are runtime issues, so passing typecheck or build is not sufficient
- keep shared timezone decoding centralized and avoid rebuilding it at call sites
- treat Temporal values with value semantics, not identity semantics
- keep civil-date, end-of-day, and working-hours semantics explicit at domain boundaries

## Required Checks

For frontend work, run:

- `cd frontend && npm run lint`
- `cd frontend && npm run typecheck`
- `cd frontend && npm run build`
- `cd frontend && npm run test:unit`

## Local Frontend Debug

For local frontend debugging, keep the production-oriented `compose.yaml` and layer the repo-local override on top of it.

Local frontend tooling expects these variables in the repo-root `.env.development`:

- `VITE_DEV_HOST`
- `VITE_DEV_PORT`
- `VITE_API_PROXY_TARGET`

If your local backend is on a different host or port, point `VITE_API_PROXY_TARGET` there instead.

Useful local entry points:

- fast UI debug: `http://127.0.0.1:4173/test`
- real integrated flow: sign in, open `http://127.0.0.1:4173/home`, then click create event

The Vite dev server proxies `/api` and `/swagger` to `VITE_API_PROXY_TARGET`, so frontend requests stay same-origin and avoid browser CORS issues.
The canonical env-file contract lives in `docs/environments.md`.

## Local Firefox E2E Verification

For local Firefox timed-event verification against the real runtime stack:

- start `mongo` and `server` with `docker compose --env-file .env.development -f compose.yaml -f compose.development.yaml up --build mongo server`
- start the migrated frontend from `frontend/` with `npm run dev -- --host 127.0.0.1 --port 4173`
- run Playwright from `frontend/` with `PLAYWRIGHT_USE_EXISTING_SERVER=1 npm run test:e2e -- --project=firefox-desktop`

When `PLAYWRIGHT_USE_EXISTING_SERVER=1` is set, Playwright keeps the configured `baseURL` but skips launching its own frontend `webServer`. Use this local-only mode when you intentionally want Playwright to target an already running migrated app; keep the default mode for CI and for runs where Playwright should own the dev server lifecycle.

## Rewrite Safety

- when cleaning the worktree for rebases, amends, or other history rewrites, prefer explicitly moving or copying tracked and untracked files aside and restoring them afterward
- do not use `rm` as the primary cleanup mechanism when a non-destructive move or backup approach is practical

## VS Code MCP Usage

Only use:

- `search_symbols_code`
- `get_symbol_definition_code`
- `get_diagnostics_code`

## Commits

- write conventional commit messages
- for frontend changes, use the `frontend` scope
- explain the changes in the commit body, including why they were made
- mention the active harness and current LLM model in the commit message
- immediately before committing, verify that the LLM model name is current
- do not include literal `\n` character sequences anywhere in a commit message; use actual newline characters for all line breaks
- do not mention unrelated changes
- end the commit message with two newline-separated co-author trailers: first `Co-authored-by: OpenCode <noreply@opencode.ai>`, then `Co-authored-by: <current model name> <noreply@openai.com>` as the second and final trailer for OpenAI models
- if the active model is not an OpenAI model, ask the user for the correct second trailer before committing
