# Inbox

Semi-structured TODO list

- [ ] Don't mention "legacy" in the code
- [ ] Add adr about using vue 3 and vuetify
- [ ] Speed up eslint and reduce memory consumption from 11GB
- [ ] remove `as unknown as`
- [ ] add eslint rule for `as unknown`
- [ ] is `$el` idiomatic modern syntax?
- [ ] add Playwright e2e tests from the comparator to the main repository
- [ ] commit comparator code to the main repository until it works as expected
- [ ] Check against composition API
- [ ] Use the right palette consistently for dropdowns, selects, buttons, switches
- [ ] use clean layout-based fixes
- [ ] avoid !important
- [ ] make a design system
- [ ] why is the button not blocked when none of the dates is selected
- [ ] refactoring - get rid of duplication
- [ ] add more instrumentation?
- [ ] don't modify vuetify internals (deep)
- [ ] load all routes lazily
- [ ] adr - add README that explains the ADR format
  - [ ] Add "Scope" - frontend, backend?
- [ ] adr - backend handles only particular paths for initial HTML with essential metadata
  - [ ] Scope: frontend, backend
- [ ] use the same node for frontend in dockerfile and in dev
- [ ] move hardcoded values to env vars in compose
- [ ] rename PR to Modernize the project
  - [ ] Frontend - migrate
  - [ ] Backend - reduce the responsibilities w.r.t serving static assets
  - [ ] Infra - harden dockerfiles, use a single env file for each environment
- [ ] Check whether NODE_ENV and GIN_MODE are in the example .env files
- [ ] introduce staging environment
- [ ] make more functions for business logic pure
- [ ] Get rid of eslint-disable-*
  - [ ] `eslint-disable vue/one-component-per-file`
- [ ] When editing the event, shouldn't be able to edit personal time (the button shouldn't be visible)
- [ ] event creator can edit other's availabilities (less probability that both guest event creator and guest clear both cookies and localstorage)?
- [ ] optional password for restoring. edit own responses and open for editing, can click the lock button to enter password and edit others' responses
- [ ] edit button always visible
- [ ] add description if initial event description is empty
- [ ] the selection box overlaps vertical lines on the left at the border of a grid of subsequent dates
- [ ] add instructions for the agent to write scripts for the browser and edit it instead of inline scripts
- [ ] which replaced tests should be restored and adjusted?
- [ ] after scrolling the grid, the circle inside the toggle is misaligned vertically, the No responses yet also changes the position
- [ ] Options should be higher than Responses?
- [ ] specify how the color at overlapping slots is calculated
- [ ] event Dates, edit event at the same height as best times, more options
- [ ] Create an event with specific times for dates May 30, 31, mark hours 0-4 for both dates, edit event, set dates for 28, 29, click next. See May 28, 30, 31 in specific times page, and May 30, 31 on the event page.
- [ ] Mark dates for only one day in specific times, save, edit again and see only one day on the event page
- [ ] Create an event for may 28 with availability from 0 to 4 and timezone +02:00. If you open the date picker in +0:00, should you see two days marked in the date picker?
- [ ] When adding availability, cancel and save should be aligned to the right
- [ ] Who are the group respondents?
- [ ] Make available/If needed on mobile higher to cover the "Adding availability" text
- [ ] Remove magic constants in CSS
- [ ] what is group (NewGroup.vue)?
- [ ] Handle narrow mobile screens (e.g. iPhone 17)
- [ ] "Editing availability as" shouldn't be in italic
- [ ] Collapse hours when editing response availability
- [ ] Mismatch between event page and specific times <http://127.0.0.1:4173/e/Eb67A>
- [ ] When creating event with specific times and setting timezone, on the specific times page, the timezone should be set to the one specified in the event (during creation). For a user, shown in should be the same on the event page and specific times page
- [ ] Lost slots on the specific times page when selected all slots at +7, then switched to +6
- [ ] <http://127.0.0.1:4173/e/EE2Fc> When editing event specific times, when "shown in" is +7, all slots for jun 15 are selected. When it's set to +6, jun 14 is duplicated and jun 15 is missing and there's a gap between jun 14 and jun 14.
- [ ] When I set specific times  0-4 on jun 14 and jun 16 when shown in is +5, then switch to +3,
      jun 15 doesn't appear although it should take some timeslots from jun 16
- [ ] what is the source of truth for enabled slots?
  - date picker may show dates that aren't shown when setting specific times.
    specific times editor should show these dates even if there are no enabled slots at these dates.
- [ ] Make a demo screenshot of <http://127.0.0.1:4173/e/6df78>
- [ ] At <http://127.0.0.1:4173/e/6df78>, when I hover over Maya Patel, I see if needed (yellow) for jun 20, 13:45-14:30 but it's available (green) when I edit her availability.
- [ ] When scrolling shown in timezones, the drop-down list gets narrow or wide depending on the width of the content.
- [ ] On the specific times page <http://127.0.0.1:4173/e/Eb67A>, when I switch timezone from +5 to +6, the left-most upper-most enabled slot should become disabled
- [ ] On the specific times page <http://127.0.0.1:4173/e/Eb67A>, when I switch timezone from +5 to +4 and on june 14, 0-4 are selected, jun 13 should appear
- [ ] make the feedback link configurable via .env and point to issues in my repo
- [ ] add flag to disable sign-in
- [ ] document flags that disable features
- [ ] make it possible to disable sign-in on backend
- [ ] add flag for enabling discord banner at the top (disabled by default)
- [ ] demo
  - first convert png to webp <https://picflow.com/convert/png-to-webp>
  - remember scale and screen size and make full page
  - then <https://ezgif.com/webp-maker>
    - 600 ms delay
    - 1200 ms for the last one
    - quality 90
  - <https://ezgif.com/webp-maker/ezgif-62a1b9a1b6704abf-split.html>
- [ ] rich landing enabled flag - enable more than just the title and demo
- [ ] font size of hours and days of week too large on mobile
- [ ] tooltip with time should appear where I hover cursor or release it
- [ ] on click on lock icon, show a tooltip with explanation why not editable
- [ ] improve readme
  - [ ] replace the icon
  - [ ] update the site link
  - [ ] add warning about unstability and possible loss of information and under construction
  - [ ] update technologies
- [ ] add github button on the event page
- [ ] in FAQ, align text and +
- [ ] in FAQ, don't mention calendars when sign in is disabled
- [ ] How it works section still exists?
- [ ] landing on mobile - no button at the top, better buttons like on desktop
- [ ] should be able to edit specific times again
- [ ] not support recurring events to not bloat the localstorage with slots?
- [ ] When hover over collapsed stripe, don't show the pointer for selecting hours
- [ ] editing availability as - add input field to write the name over Available
- [ ] On the event page, in More options, "Show all hours" should be above "Hide if needed times"
- [ ] Everyone should be unavailable in responses when hover over red, light-grey, or dark-grey
- [ ] switch to when2meet in the repo
- [ ] make the app name configurable and when2meet by default
- [ ] why grey without grid in <http://127.0.0.1:4173/e/Eb67A> at gmt+9?
- [ ] reduce the number of columns on mobile so that the event can fit into that
- [ ] Summarize feedback on <https://www.reddit.com/r/schej/>
- [ ] Document the architecture and integration with external systems,
    e.g. Google Cloud project
- [ ] Add `flake.nix`
- [ ] enable tests with chromium in addition to Firefox
- [ ] Refactor .env files
  - Group values
  - Shift the most important higher
- [ ] Schedule:
  - Phase 1 - everyone
  - Phase 2 - only the event owner, be it a registered or an anon user
- [ ] Support setting password when adding availability
- [ ] Move Show all hours to over Overlay availabilities on desktop and mobile
- [ ] Given an event was scheduled and time zone switched so that event slots shifted to another date, mark them blue in relevant dates
- [ ] <http://127.0.0.1:4173/e/aB3BE>
  - ok in gmt+3
  - padding gets added in +3:30 although not needed
  - grid split in +12 although shouldn't
- [ ] Introduce a log of non-architectural decisions with SPEC-NNN identifiers
- [ ] Introduce an index that tracks the status of SPECs
- [ ] On mobile, when changing availability, don't show responses offcanvas panel
- [ ] Set up CI/CD (maybe CD on releases only)

## MUST

- [ ] Event can be edited only by the creator. The description too
- [ ] event in +3, edit specific times in +9, some time slots are lost
- [ ] event in +3,
- [ ] specific times uses the default 9-18 after unselecting 9-18
- [ ] when autofill is disabled, only manually should be enabled
- [ ] default hours for new event should be 9-18
- [ ] RIIR
  - [ ] switch to Postgres
  - [ ] use dbfirst
  - [ ] don't fix sign in functionality in the Go version
  - [ ] keep the original code in comments for line-by-line rewriting
- [ ] Remove split-gap
- [ ] given new days are added in edit event with specific times, when the specific times page is opened, then the new days should be available for editing
- [ ] there's no time when all 8 respondents are available should be over responses
- [ ] On a non-existing page, 404 must be centered vertically and horizontally
- [ ] Given I'm on the event page in read mode, when I click somewhere in the red zone, then the Add availability and/or Edit availability must blink
- [ ] On the event page, when a multi-line description is saved, then all lines should be displayed
- [ ] When the guest adds several responses, there should be a record for each response in localstorage
- [ ] when user clicks edit availability, they should see a drop-down list of all respondents whose availability they can change. own availabilities first, open for editing next, people with password last
- [ ] Enforce that the user name is always non-empty

      The core of this is a functional requirement:

      - which guest names are accepted or rejected
      - how respondent names are normalized
      - what data the API returns
      - how duplicates and legacy rows are handled

      It has some non-functional aspects:

      - data quality and consistency
      - robustness against malformed input
      - maintainability of one canonical contract
- [ ] Add format 12h/24h - in the event creation form
- [ ] Make the format in the event form independent of the local format on the event page
- [ ] "If necessary" - don't show in the legend, color the "if necessary" text that appears on hover
- [ ] Use TypeScript 7 to speed up type checking and tests (?)
- [ ] On mobile, make tooltip durable - after scrolling the page, it should appear near the selected timeslot
  - Currently, when I click a grey slot, then scroll down, then return back, the tooltip disappears.
    When I click a grey slot, it reappears
- [ ] In responses, show the square for the status of a person at the corresponding timeslot (available, if needed, unavailable, etc.) instead of a profile image
- [ ] The event that spans two dates must appear on both dates
- [ ] Add "Disabled, collapsed" legend item
- [ ] Given I'm scheduling an event, when I'm outside of active cells, I can't schedule the event and when I'm inside them, I can schedule

## SHOULD

- [ ] the grid lines should be black, not grey
- [ ] Add concurrency control (two people edit the event simultaneously)

## COULD

- [ ] anon identity to save preferences, maybe sign in by password
- [ ] use @dicebear/identicon for avatars, not generic head?
      The downside is that after updating the name, the avatar will change too.

## MUST - Done

- [x] use `.env.example` instead of `.env.template`
  - We use `.env.development.example` and `.env.production.example`
- [x] multi-day <http://127.0.0.1:4173/e/5Ef6f>
- [x] Let's nest all toggles under Options dropdown and make it open by default
  - Show best times is always visible, other can be opened via Options
- [x] overlay availabilities - each slot has a solid frame <https://timeful.fun/e/c762cA>
- [x] there should be a space between grids for non-consecutive days
- [x] edit event button is missing
- [x] shown in should be the same size as the timezone and black
- [x] the description text should be at the same vertical position when not editing and when editing
- [x] replace the Create event button on the main page with the actual form
  - No, there's additional useful info about the app on the main page
- [x] on the event page, near "shown in", the underline colors for the timezone and time should be the same
- [x] move adr to the repo root
  - No, keep adr for frontend inside frontend
- [x] use full "development" instead of "dev" and "production" instead of "prod"
- [x] Can't save time for the first time
- [x] In create event -> advanced options, "Timezone" should be black
- [x] Show full grid by default
  - It's collapsed by default
- [x] add option to collapse unused hours (not hide)
- [x] make each collapsed hours uncollapsible
- [x] mobile version - switching between 3 days and 7 days doesn't work
  - Works now
- [x] Add availability only over the responses section so that it can scroll
  - Moved to the header
- [x] When viewing an event, when clicking, dragging the box pointer in the red area, then unclicking, the box disappears
- [x] in a collapsed section, upper line overlaps the original line but the lower line doesn't
- [x] use the same colors for all grid lines
- [x] the selection box is almost invisible
  - Now it's hatched
- [x] use the same frequency of dashes for the selection box and the grid separator at half an hour
  - we use solid selection box
- [x] when I click somewhere, the drop-down list in edit availability doesn't disappear
- [x] let's collapse hours when they're at the start or at the end too. These hours are useless anyway
- [x] Check +3:30 and +5:45
- [x] common grey zones at the start of the day and at the end of the day must be invisible, not collapsed
- [x] when editing event, the week day every letter looks the same as the day of month
- [x] create event with specific availability in +2, 0-4 (day 1), 0-4 (day 2). When opened in 0:00, should see the previous date
- [x] box cursor doesn't follow the mouse in the specific times grid
- [x] no Options when there are no responses
  - now there's an option to show all hours
- [x] disallow editing past dates
  - Not disallowing because it's a feature
- [x] after adding availability, the selected segments are dark green
- [x] Move "Copy link" closer to the event title
- [x] too drastic width change at page width breakpoints (1/3 of the screen)
- [x] Make edit event a button with a pencil icon
- [x] When no responses, show only add availability and show all hours
- [x] show pencils
- [x] When one response, doesn't show best times
- [x] There's no source of truth for dates for specific times and event
  - Added ADR-012
- [x] do we have recurring events?
      Yes — it uses a custom TimedRecurrence model with two kinds: specific_dates (explicit date list) and weekly (day-of-week pattern). No iCalendar RRULE support.
- [x] In the new event form, in Advanced options, The Timezone text isn't aligned horizontally with "Time increment"
      The styling differs too
- [x] On the event page without responses, there should be only Add availability and Show all hours, not very wide Add availability and More options

      "Show all hours" should be under "Add availability", as before.
      The toggle and "Show all hours" text should be centered vertically within their box
- [x] Create event with 9 - 17, timezone +9 (<http://127.0.0.1:4173/e/ee4Cb>), june 11 and 12.
      Expected: june 10 and 11 are shown on the event page
      Actual: june 11, 12, 13 are shown there
- [x] Spacing between lines is different when editing and viewing event description
- [x] Shown in shouldn't affect the time zone
- [x] Availability not rendered at <http://127.0.0.1:4173/e/Eb67A>
- [x] <http://127.0.0.1:4173/e/Eb67A> shown in GMT -7 shows blank grey columns
- [x] <http://127.0.0.1:4173/e/Eb67A> doesn't show the bottom separator
- [x] When there are no responses, Add availability and show all hours are too wide
- [x] in What days might work, when sun and mon are selected, when enabling start on monday, both mon and sun must be selected
- [x] remove formerly known as schej and flag
- [x] on the event page, responses should be aligned top with the grid top
- [x] add flag to enable privacy policy
- [x] use the same palette for event page
  (enabled - light-grey, active -red; disabled - dark-grey)
- [x] legend should be visible even if no responses. Show only enabled/active
- [x] show all hours should work on the event page
- [x] hide dates where there's nothing to pick?
  - no, keep all dates
- [x] the day ends at 24
   No, at `00:00` for consistency with 12AM in 12-hour format
- [x] there should be a label for each grid row that marks the start of an hour, even for collapsed
- [x] get rid of 12-hour format?
   No
- [x] remove Add availability, leave just edit availability
   No. In this case, we won't be able to add availability for someone
- [x] don't uncollapse rows when scheduling
- [x] show event when rescheduling
- [x] Schedule button on mobile should be filled blueish when clicked
- [x] When there's a scheduled event and I edit availability, I shold draw only with green cells, not blue cells (scheduled)
- [x] when editing availability, overlay availabilities should preserve the marked time slots and not shift
- [x] set specific times - just select, don't draw scheduled event
- [x] on mobile, edit availability is permanently greenish although should be like that only after a click
  - It's ok - it's disabled
- [x] on mobile and desktop, there should be no delay between selecting the time slot and seeing the tooltip with time and date
- [x] on mobile, I shouldn't be able to click the grid through that Responses offcanvas
- [x] on mobile, the tooltip should stay near selected timeslot and shouldn't move around
  - now we store the info about the selected timeslot and render based on its position
- [x] in commit skill, make the script for session identifier and time a single script
- [x] on mobile, when scrolling, the tooltip with time should scroll together with selected cell, not stay frozen at the same height of the screen while the screen scrolls
- [x] on mobile, when no slot is selected, the tooltip shouldn't be visible
- [x] When a timeslot is selected, it's position is saved.
      When the page is reloaded, the selection is rendered at the timeslot.
      However, there's no tooltip near the selection.
- [x] on mobile, when long press inside the grid changes the selected timeslot, the tooltip must also appear near the selected timeslot
  - currently, it stays near the previously selected timeslot
- [x] on mobile, when long press inside the grid makes the timeslot selected, the tooltip must appear near it.
  - currently, the tooltip doesn't appear
- [x] on mobile, the tooltip should be under top navbar when the grid gets scrolled up
- [x] On the event page without responses, there should be only Add availability and Show all hours, not very wide Add availability and More options

      "Show all hours" should be under "Add availability", as before.
      The toggle and "Show all hours" text should be centered vertically within their box

- [x] "Best times" toggle should appear when there is at least one response, not more than one
- [x] When Best times and More options are both visible, they should be side by side
- [x] On mobile, on the event page, when swiping inside the grid, the grid should scroll just like when swiping outside
- [x] "select in Add/Edit availability" -> "change in ..."
- [x] On mobile, on the event page, when not interacting with the grid, make it scrollable with finger on the grid
- [x] Disabled padding cells - "Unavailable, outside the event dates in the event timezone"
- [x] In desktop app, in firefox, the selected timeslot must follow the mouse when it moves inside the grid, no matter clicks.
- [x] doesn't show time on hover after clicking and moving the cursor - <http://127.0.0.1:4173/e/dEeaF>
  - Can't reproduce
- [x] on mobile, tooltip should be below the Responses offcanvas panel
- [x] get rid of the comparator, leave just inspect and update docs
- [x] Given I'm on the event page, when I move the mouse cursor out of the grid, the Responses must show just the number of responses and not show who's available
- [x] In the desktop version, the alignment of rows in add/edit availability should be similar to the event page.

      - event title - Cancel, Save
      - Edit event - Show all hours
      - Add description - shouldn't be visible, actually
- [x] make scheduled event color #76AFF2 so that it's visible on the green background
- [x] Given on the event page, when scrolled down, then clicked Edit event, then the navbar (timeful, create an event, etc.) must not move higher
- [x] On the event page, align:
      - event title with Add availability/Edit availability
      - "Edit event" and Copy link with Show best times and More options
      - The event description with Schedule/Reschedule event
- [x] When changing availability, there should be these buttons:
  
  - Cancel | Save
  - Overlay availability | More options (Show all hours)
  - Delete
- [x] show all hours should show all hours, not trimmed. Currently, it trims wrong
  - can't reproduce
- [x] Given on the edit availability page, when no timeslot is marked as available/if needed, then the Save button should be disabled
- [x] Allow multiple scheduled events.

    Remove clear in Reschedule event because one can just wipe it by dragging the event cursor.

    Should behave just like the availability cursor.

    Given I clicked Reschedule event,
    when I click a slot that belongs to the existing event, the slot gets cleared
    and when I click a free slot, it becomes an event slot
    and adjacent slots merge into a single event

  - Won't implement because it makes the interface much more complicated.
    If there's 0 slots selected, how to save?
    If there's several events selected, need to warn that exactly one event is required to schedule on Google Calendar
- [x] On desktop, the width of buttons when adding availability should be the same as on the event page
- [x] On desktop, when rescheduling event, add availability, edit availability, edit event should be disabled
- [x] On desktop, Shown in and timezone should be above Responses and scroll with it so that when all timeslots are shown
     and one selects a timeslot and see the tooltip with the time, they can see which timezone that time belongs to
- [x] Use monospace font for times
  - [x] in the grid
  - [x] in the tooltip
- [x] Don't show the cursor and tooltip in enabled, inactive or disabled cells
- [x] On mobile, given I'm on the event page and a timeslot is selected and the tooltip is visible, when I click the responses offcanvas, the selected timeslot and its tooltip must not disappear
- [x] On mobile, make the grid labels fit on the screen
- [x] Given I'm on desktop and on the event page, when I hover over collapsed hours,
  - the responses should show 0/N (behave similarly to disabled cells)
  - and mark everyone unavailable
  - and the selection at the highlight at the last hovered timeslot must be cleared
- [x] Given the selected dates are non-consecutive and make the grid split into sub-grids (e.g. Aug 6 and 9), when I click (desktop, mobile) or hover (desktop) in the space between sub-grids, the highlight and tooltip at the last selected timeslot must be cleared like when clicking or hovering inactive timeslots
- [x] On desktop, given I'm on the event page, when I hover an active timeslot or hover outside the grid and then hover over an inactive slot, then the Responses sidebar should show (0/N) and all responses crossed-out and the status square should have the corresponding color (light-grey for enabled, inactive etc.)
- [x] On mobile, buttons with arrows for switching pages when there are several days, buttons should be the same size
- [x] On mobile, when I click a disabled timeslot, the selection should disappear
- [x] On desktop, given I'm on the event page, when I hover or click inside the grid outside active cells, the highlight at the last timeslot and any tooltip should not be visible

## SHOULD - Done

## COULD - Done
