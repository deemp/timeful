# Frontend Glossary

This glossary briefly defines timed-event slot terminology used across the
frontend. The authoritative definitions live in the linked documents (ADR-012,
functional requirements); this file summarizes them for quick reference and
does not replace them.

Canonical source of truth for the slot model: [ADR-012: Frontend Timed Event
Picked-Date Slot Model](./adr/012-frontend-timed-event-instant-slot-model.md).

## Timed-slot terms

- `picked dates`: the canonical picked-date membership for timed specific-date
  events. The date picker is a direct view of picked dates; picking a date
  regenerates the enabled slot domain for that date.
  ([ADR-012 Terminology](./adr/012-frontend-timed-event-instant-slot-model.md#terminology),
  [Picked-date semantics](./adr/012-frontend-timed-event-instant-slot-model.md#picked-date-semantics))

- `enabled slots`: the canonical full slot domain for the picked dates; the
  complete set of instants a timed event could offer.
  ([ADR-012 Terminology](./adr/012-frontend-timed-event-instant-slot-model.md#terminology))

- `active slots`: the canonical subset of enabled slots that respondents can
  actually answer on. The canonical invariant is `active slots ⊆ enabled slots`.
  ([ADR-012 Terminology](./adr/012-frontend-timed-event-instant-slot-model.md#terminology))

- `event timezone`: the persisted timezone used to interpret picked dates and
  generate enabled slots. Changing it preserves picked dates, rebuilds the
  enabled domain, and filters active slots to the rebuilt domain.
  ([ADR-012 Terminology](./adr/012-frontend-timed-event-instant-slot-model.md#terminology),
  [Timezone semantics](./adr/012-frontend-timed-event-instant-slot-model.md#timezone-semantics))

- `display timezone`: the timezone used to render timed slots in the UI,
  controlled by the `Shown in` selector. It only affects projection/rendering
  and does not change picked dates, enabled slots, or active slots.
  ([ADR-012 Terminology](./adr/012-frontend-timed-event-instant-slot-model.md#terminology))

- `slot-generation settings`: the persisted timed-event settings used to
  generate enabled slots for picked dates or recurrence-owned timed instances.
  Interpreted in the event timezone; batch-added slots are generated from these
  settings, not from incidental viewport state.
  ([ADR-012 Terminology](./adr/012-frontend-timed-event-instant-slot-model.md#terminology),
  [Slot-generation semantics](./adr/012-frontend-timed-event-instant-slot-model.md#slot-generation-semantics))

- `advanced slot editing`: the UI mode exposed by the specific-times toggle.
  It allows slot-level edits to active slots without changing the canonical
  persistence model; disabling it restores `active slots = enabled slots` for
  the current picked-date domain.
  ([ADR-012 Terminology](./adr/012-frontend-timed-event-instant-slot-model.md#terminology),
  [Advanced slot editing semantics](./adr/012-frontend-timed-event-instant-slot-model.md#advanced-slot-editing-semantics))

- `daysOnly` events: events that remain outside the timed slot model and
  continue using date-only semantics.
  ([ADR-012 Decision](./adr/012-frontend-timed-event-instant-slot-model.md#decision))

## Time format terms

- `event time format`: the 12/24-hour format used to render times inside event
  editor forms (the `What times might work?` / `Time range` dropdowns and the
  start/end time fields). It persists independently of the display time format
  under `eventTimeType` and defaults to 24-hour; changing it while creating an
  event saves the new preference.
  ([browser date preferences](../frontend/src/utils/browserDatePreferences.ts),
  [event editor state](../frontend/src/composables/event/useEventEditorState.ts))

- `display time format`: the format used to render times in the event-page
  schedule grid and tooltips, controlled by the event-page `12h/24h` switch and
  persisted under `timeType`. It defaults to 24-hour and only affects event-page
  rendering, not the event editor forms.
  ([browser date preferences](../frontend/src/utils/browserDatePreferences.ts),
  [calendar grid](../frontend/src/composables/schedule_overlap/useCalendarGrid.ts))

## Timed-grid rendering terms

- `enabled inactive slot`: an enabled slot that is not active. It remains
  editable in specific-times editing but is not respondent-selectable; it uses
  a treatment separate from both active slots and disabled padding cells.
  ([ADR-012 Rendering rules](./adr/012-frontend-timed-event-instant-slot-model.md#rendering-and-summary-semantics),
  [FR-026](./requirements/functional.md#fr-026))

- `disabled padding cell`: a grid cell without a mapped enabled slot. It is
  non-editable and uses a visually distinct unavailable treatment; it is not a
  slot at all.
  ([ADR-012 Rendering rules](./adr/012-frontend-timed-event-instant-slot-model.md#rendering-and-summary-semantics),
  [FR-026](./requirements/functional.md#fr-026))

- `projected date column`: a grid column derived from enabled slots projected
  into the display timezone. A projected slot belongs to its display-local
  calendar-date column; an adjacent column is created when that date is
  otherwise absent, and a slot crossing midnight is not duplicated.
  ([ADR-012 Rendering rules](./adr/012-frontend-timed-event-instant-slot-model.md#rendering-and-summary-semantics),
  [FR-025](./requirements/functional.md#fr-025),
  [FR-026](./requirements/functional.md#fr-026))

- `range-generated` versus `full-day` enabled domain: a default timed event
  created from selected days and a start/end window persists that generated
  range as both enabled and active slots; entering specific-times during
  creation replaces the range with a full-day enabled domain for each picked
  date and an initially empty active subset.
  ([ADR-012 Decision](./adr/012-frontend-timed-event-instant-slot-model.md#decision),
  [FR-026](./requirements/functional.md#fr-026))
