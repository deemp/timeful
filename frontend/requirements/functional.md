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
