#!/usr/bin/env bash
set -euo pipefail

environment="${1:-production}"

case "$environment" in
production)
  env_file=".env.production"
  project_name="timeful-production"
  override_file="compose.production.yaml"
  ;;
staging)
  env_file=".env.staging"
  project_name="timeful-staging"
  override_file="compose.staging.yaml"
  ;;
*)
  printf 'Usage: %s [production|staging]\n' "$0" >&2
  exit 1
  ;;
esac

repo_root="$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)"
cd "$repo_root"

if [[ ! -f "$env_file" ]]; then
  printf 'Environment file not found: %s\n' "$env_file" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$env_file"
set +a

: "${MONGODB_ROOT_USERNAME:?MONGODB_ROOT_USERNAME is required}"
: "${MONGODB_ROOT_PASSWORD:?MONGODB_ROOT_PASSWORD is required}"
: "${MONGODB_APP_USERNAME:?MONGODB_APP_USERNAME is required}"
: "${MONGODB_APP_PASSWORD:?MONGODB_APP_PASSWORD is required}"
: "${MONGODB_DATABASE:?MONGODB_DATABASE is required}"

compose=(
  docker compose
  --project-name "$project_name"
  --env-file "$env_file"
  -f compose.yaml
  -f "$override_file"
)

"${compose[@]}" cp mongo/migration/create-users.js mongo:/tmp/timeful-create-users.js
"${compose[@]}" exec -T \
  -e MONGODB_ROOT_USERNAME \
  -e MONGODB_ROOT_PASSWORD \
  -e MONGODB_APP_USERNAME \
  -e MONGODB_APP_PASSWORD \
  -e MONGODB_DATABASE \
  mongo mongosh --quiet --file /tmp/timeful-create-users.js
