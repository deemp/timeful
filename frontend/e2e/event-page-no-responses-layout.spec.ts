import { expect, test } from "@playwright/test"
import {
  buildSpecificDateSeed,
  openEventPage,
  seedCanonicalTimedEvent,
} from "./helpers/timed-event-helpers"
import { Temporal } from "temporal-polyfill"

test.describe.configure({ mode: "serial" })

test("event page without responses pairs each header row with one action column", async ({
  page,
  request,
}, testInfo) => {
  const now = Temporal.Now.instant()
  const today = now.toZonedDateTimeISO("UTC").toPlainDate().toString()

  const seed = await seedCanonicalTimedEvent(
    request,
    buildSpecificDateSeed({
      name: `Layout test ${String(now.epochMilliseconds)}`,
      selectedDays: [today],
      enabledSlots: [`${today}T09:00:00.000Z`, `${today}T10:00:00.000Z`],
      activeSlots: [`${today}T09:00:00.000Z`, `${today}T10:00:00.000Z`],
      eventTimezone: "UTC",
      startTimeLocal: "09:00",
      endTimeLocal: "17:00",
      timeIncrementMinutes: 60,
    })
  )

  await openEventPage(page, seed.shortId)

  // Verify "Add availability" button exists
  const addAvailabilityBtn = page.locator("#desktop-primary-availability-btn")
  await expect(addAvailabilityBtn).toBeVisible()
  await expect(addAvailabilityBtn).toHaveText(/Add availability/i)

  const showAllHoursToggle = page.locator("#show-all-hours-toggle")
  const scheduleEventButton = page.getByRole("button", {
    name: /^Schedule event$/i,
  })
    await expect(showAllHoursToggle).toBeVisible()
    await expect(scheduleEventButton).toBeVisible()

    if (testInfo.project.name === "chromium-desktop") {
      const timeFormatToggle = page.locator(".time-format-toggle")
      const firstTimeGridRow = page.locator(
        ".schedule-overlap-time-grid__body-row",
      )
      const title = page.locator(
        "#event-header > .event-header-row:first-child > .tw-min-w-0.tw-flex-1 > div:first-child",
      )
    const editEventButton = page.locator("#edit-event-btn")
    const addDescriptionButton = page.getByRole("button", {
      name: /^\+\s*add description$/i,
    })
    const [
      titleBox,
      addAvailabilityBox,
      editEventBox,
      showAllHoursBox,
      addDescriptionBox,
      scheduleEventBox,
      timeFormatToggleBox,
      firstTimeGridRowBox,
    ] = await Promise.all([
        title.boundingBox(),
        addAvailabilityBtn.boundingBox(),
        editEventButton.boundingBox(),
        showAllHoursToggle.boundingBox(),
        addDescriptionButton.boundingBox(),
        scheduleEventButton.boundingBox(),
        timeFormatToggle.boundingBox(),
        firstTimeGridRow.boundingBox(),
      ])
    if (
      titleBox === null ||
      addAvailabilityBox === null ||
      editEventBox === null ||
      showAllHoursBox === null ||
      addDescriptionBox === null ||
      scheduleEventBox === null ||
      timeFormatToggleBox === null ||
      firstTimeGridRowBox === null
    ) {
      throw new Error(
        "Expected each header-row detail and action to have boxes",
      )
    }
    for (const [detailBox, actionBox] of [
      [titleBox, addAvailabilityBox],
      [editEventBox, showAllHoursBox],
      [addDescriptionBox, scheduleEventBox],
    ]) {
      expect(
        Math.abs(
          detailBox.y + detailBox.height / 2 -
            (actionBox.y + actionBox.height / 2),
        ),
      ).toBeLessThanOrEqual(1)
      expect(Math.abs(actionBox.width - addAvailabilityBox.width)).toBeLessThanOrEqual(1)
      expect(Math.abs(actionBox.x - addAvailabilityBox.x)).toBeLessThanOrEqual(1)
    }
    expect(Math.abs(timeFormatToggleBox.y - firstTimeGridRowBox.y)).toBeLessThanOrEqual(1)

    const allHoursContentCenter = await page.evaluate<number | null>(() => {
      const toggle = document.querySelector<HTMLElement>(
        "#show-all-hours-toggle",
      )
      const control = toggle?.querySelector<HTMLElement>(
        ".v-selection-control",
      )
      const input = control?.querySelector<HTMLElement>(
        ".v-selection-control__wrapper",
      )
      const label = control?.querySelector<HTMLElement>(".v-label")

      if (!toggle || !input || !label) return null

      const inputRect = input.getBoundingClientRect()
      const labelRect = label.getBoundingClientRect()
      return (
        Math.min(inputRect.left, labelRect.left) +
        Math.max(inputRect.right, labelRect.right)
      ) / 2
    })
    expect(allHoursContentCenter).not.toBeNull()
    if (allHoursContentCenter === null) {
      throw new Error("Expected the Show all hours switch content")
    }
    expect(
      Math.abs(
        allHoursContentCenter - (showAllHoursBox.x + showAllHoursBox.width / 2),
      ),
    ).toBeLessThanOrEqual(2)
  }

  // Verify the parent wrapper does NOT have tw-col-span-2 (which makes it very wide)
  const parentWrapper = page.locator("#event-header-actions .desktop-primary-availability-anchor")
  const parentClass = await parentWrapper.getAttribute("class")
  expect(parentClass).not.toContain("tw-col-span-2")

  // Verify "More options" is NOT present
  const moreOptions = page.locator("#desktop-header-more-options")
  await expect(moreOptions).not.toBeVisible()
})
