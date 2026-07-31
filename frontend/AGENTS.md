# Frontend

The frontend migration is primarily from:

- `Date` / number / string
- JavaScript
- Vue 2

To:

- TypeScript
- Vue 3
- Composition API
- `Temporal` via `temporal-polyfill`
- Vuetify

## ADR Rules

Read the ADRs that are relevant to the task before editing frontend code.

Always read:

- `./adr/0001-frontend-boundary-models-and-canonical-internal-shapes.md` for boundary, transport, decoding, encoding, or model-shape changes
- `./adr/0002-temporal-and-timezone-semantics.md` for date, time, timezone, working-hours, civil-date, or `Temporal` changes

Do not treat "read every ADR in the folder" as the default requirement.

## Architecture Rules

- keep boundary and transport types separate from internal frontend types
- preserve one canonical internal shape per concept
- keep transport decoding and encoding at explicit boundaries, not inside views, composables, or submit paths
- prefer typed domain helpers and composables over view-level coercion
- do not mix boundary payload shapes into component state
- keep shared timezone decoding centralized instead of rebuilding it ad hoc at call sites
- treat `Temporal` values with value semantics, not identity semantics
- keep civil-date, end-of-day, and working-hours semantics explicit at domain boundaries

## Styling Rules

- use layout-based fixes instead of overrides or hacks
- when debugging Vuetify wrapper behavior, verify rendered ancestor styles such as wrapper opacity, not only the leaf node
- in non-scoped Vue style blocks, prefer plain selectors over `:deep(...)` for framework wrapper overrides
- use `:deep(...)` only when scoped styles actually need to cross component boundaries
- confirm the final selector matches the rendered class structure in the browser

## Browser Verification

- use `npm run inspect -- --target <scenario-name>` for current-app diagnostics
- keep repo-tracked Playwright specs, helpers, and repro entrypoints under `./e2e`
- use Playwright specs for assertion-based regression coverage
- follow `./e2e/inspect/AGENTS.md` for inspection command details

## Required Checks

After meaningful frontend changes, run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`

Add regression coverage when fixing a reproduced migration bug unless there is a concrete reason it cannot be covered at that layer.
