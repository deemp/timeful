#!/usr/bin/env bash
set -euo pipefail

env_file="${1:-.env.production}"

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

compose=(docker compose --env-file "$env_file")

"${compose[@]}" cp mongo/migration/create-users.js mongo:/tmp/timeful-create-users.js
"${compose[@]}" exec -T \
  -e MONGODB_ROOT_USERNAME \
  -e MONGODB_ROOT_PASSWORD \
  -e MONGODB_APP_USERNAME \
  -e MONGODB_APP_PASSWORD \
  -e MONGODB_DATABASE \
  mongo mongosh --quiet --file /tmp/timeful-create-users.js
