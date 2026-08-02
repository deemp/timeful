# Functional Requirements

## FR-001

A guest can add availability several times. Store all records in the guest browser.

## FR-002

Each column in the grid must contain only the dates that belong to the same date.

## FR-003

Responses can only be edited, not deleted.

## FR-004

If the response can be edited, there's a pencil on the right. Otherwise, a lock.

## FR-005

Button styles on the event page follow Material Design:

- `Add availability`: filled primary, subtle shadow if needed for separation, no persistent glow
- `Edit availability`: filled primary, calmer than add, no glow
- `Edit event` and `Copy link`: outlined, no shadow

## FR-006

Setting "Shown in" shouldn't affect the initial event time zone.

## FR-007

When scheduling an event, it can't be empty.

## FR-008

Availability can't be empty.

## FR-009

In the new event form, when I click a button near the month or the year, the form should stay in place and not scroll to the top.

## FR-010

In the new event form, when the event name isn't set and when the user changes the month, the form scrolls to the top adn requires the event name to remind the user to set it.

## FR-011

On the response edit page, overlay availabilities shall show all availabilities, without hiding.

## FR-012

When there are responses but no responses to edit, the user should see disabled Edit availability button.

## FR-013

`available` and `if needed` shall not overlap.

## FR-014

Dates picked in the date picker shall be the source of truth for enabled time slots.

## FR-015

When sign in is disabled, all related functionality on the frontend must be gated.

## FR-016

When scheduling an event, the tooltip with the info about the time slot should follow the mouse cursor and not be above the slot where scheduling the event started

## FR-017

Default hours for a new event should be 9-18.

## FR-018

Grid colors shall use context-specific labels:

- In the specific-times editor: white is `Selected for the event`, light grey is `Available to select`, and dark grey is `Unavailable, padding`.
- In the event availability grid: pale red is `Unavailable, select in Add/Edit availability`, light grey is `Unavailable, select in Edit event`, and dark grey is `Unavailable, padding`.
- The event availability legend shall show light grey and dark grey when there are no active slots or responses; add pale red when there are active slots; show all colors while adding availability or after receiving a response.
- Specific-times enabled inactive cells shall remain editable, while dark-grey padding cells outside the enabled domain shall be non-editable.
- Padding shall appear only in cells without an enabled slot for that display-date column. It shall not be created by rounding the time axis or by page-wide filler rows.

## FR-019

Collapsed hours rectangle height should be the same as half-hour line.

## FR-020

Each full-hour line in the grid should have a label on the left, including top of the collapsed hours rectangle.

## FR-021

Specific-times events shall preserve a separate enabled-slot domain and active-slot selection:

- Entering specific-times while creating an event shall create a full-day enabled domain for every picked date.
- Reopening a specific-times event shall retain its persisted enabled domain.
- Specific-times edit columns shall be the ordered union of picked dates and enabled-slot dates projected into the displayed timezone.
- A slot that projects across midnight shall appear in its display-local date column; the grid shall add that adjacent column when needed.
- Picked-date columns shall remain visible even when they contain no projected enabled slots.

## FR-022

Time-range picker labels shall represent the end-of-day boundary clearly:

- In 24-hour mode, labels shall be zero-padded from `00:00` through `23:00`, followed by `24:00`.
- In 12-hour mode, the end-of-day option shall be `12 AM`.
- Selecting the end-of-day boundary shall render as `00:00` in the next date column of the grid.

## FR-023

When `Show all hours` is disabled, the grid shall collapse inactive runs based on active-slot membership:

- Leading, interior, and trailing inactive runs shall be eligible for collapse.
- Collapse bands shall align to complete hours and require at least three consecutive inactive hours.
- The left time axis shall show each collapsed band's start boundary and day-boundary labels such as `00:00`.
- Wrapped overnight ranges shall use a continuous time axis without a structural split gap.
- Schedule drags shall end only on active slots; moving into an enabled inactive slot shall retain the last active endpoint.
- Calendar, selected, and saved scheduled-event overlays shall render as contiguous visible fragments and shall not cross collapsed rows.

## FR-024

Anyone with the event link can schedule a selected time range on Timeful:

- The Schedule menu shall list `Timeful` first, with a Timeful icon, followed by Google Calendar and Outlook.
- The mobile Schedule action shall offer the same three destinations.
- Selecting Timeful shall persist the selected range and render it as an unlabelled, solid blue indicator centered at 70% of its day-column width, so availability remains visible behind it.
- Anyone with the event link can schedule, reschedule, or clear the Timeful schedule.
- After saving a Timeful schedule, viewers shall see `Reschedule event` and `Clear` actions.
- Starting rescheduling shall hide the saved block; saving a new Timeful range shall replace the prior schedule.
- The legend shall permanently include a blue `Scheduled event` item matching the scheduled-event indicator.

## FR-025

Canonical timed-event grids shall preserve slot instants when the display timezone changes:

- Changing `Shown in` shall not change an enabled or active slot's instant.
- A slot's displayed clock label and tooltip shall use the selected display timezone.
- A slot shall render at most once in a grid and shall not be duplicated because its displayed time crosses midnight.
- Wrapped ranges shall remain continuous without structural split gaps.

## FR-026

Timed grids shall distinguish the enabled-slot domain from the active-slot selection according to the editing mode. This requirement supersedes FR-021's display-timezone column-projection rules where they conflict.

- A grid column represents a date picked in the date picker, interpreted in the event timezone. Changing `Shown in` shall not add, remove, or reassign picked-date columns.
- `Shown in` changes a slot's displayed clock time and tooltip date/time only. A slot remains owned by its picked-date column even when its displayed instant crosses midnight.
- While setting specific times, every increment from `00:00` inclusive through the next `00:00` exclusive shall be an enabled slot for every picked date. The grid shall show that full-day domain. Selected slots are active; enabled inactive slots remain editable; cells outside the enabled domain are non-editable padding.
- On the event page for a specific-times event, the grid shall show its complete enabled domain, with inactive spans eligible for the existing collapsed-hours behavior. Active slots are respondent-selectable. Enabled inactive slots are not respondent-selectable and shall not be presented as padding.
- On the event page for a range event, only increments in the selected range are enabled and active. The grid shall render the selected range with hour-aligned axis boundaries; it need not render the rest of the day. Any rendered slot outside the range is non-enabled and shall be labelled as outside the selected range, not padding.
- The legend shall name cells by their domain state: active, enabled but inactive, outside the selected range, or padding outside the enabled domain. It shall not use `Unavailable, padding` for an enabled inactive slot or for a slot omitted solely because a range grid does not render the rest of the day.

## FR-027

Timed grids shall preserve every enabled slot on daylight-saving-time transition days.

- A grid cell's identity shall be its instant, not its displayed clock label.
- When clocks move backward and a local clock time occurs twice, the grid shall render both slots in chronological order and distinguish their labels with the applicable timezone offset or abbreviation.
- When clocks move forward and local clock times do not exist, the grid shall not render nonexistent slots.
- The same instant-preserving behavior applies to enabled-slot membership, active-slot selection, availability responses, drag selection, scheduling, and tooltips.
