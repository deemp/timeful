import { expect, test } from "@playwright/test"
import {
  SLOT_UTC_MAY_28,
  SLOT_UTC_MAY_29,
  buildUtcSpecificTimesRangeInstants,
  buildSpecificDateSeed,
  clickDateCell,
  collectDatePickerState,
  countGridCellsByClass,
  createSpecificTimesEventFromDialog,
  dismissConsent,
  fetchEventByShortId,
  openEditDialog,
  openEventPage,
  proceedToSpecificTimesGrid,
  revealAdvancedOptions,
  saveEditorAndWaitForPut,
  seedCanonicalTimedEvent,
  selectedDatesFromState,
  setSpecificTimesEnabled,
  sortIsoInstants,
} from "./helpers/timed-event-helpers"

test.describe.configure({ mode: "serial" })

test("mobile grid does not show a tooltip after reload before a slot is selected", async ({
  page,
}) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile unselected tooltip reload regression"
  )
  await page.setViewportSize({ width: 375, height: 900 })

  const gridSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await gridSlot.scrollIntoViewIfNeeded()
  const gridSlotBox = await gridSlot.boundingBox()
  expect(gridSlotBox).not.toBeNull()
  if (!gridSlotBox) {
    throw new Error("Expected a visible grid slot before reload")
  }

  await page.mouse.move(
    gridSlotBox.x + gridSlotBox.width / 2,
    gridSlotBox.y + gridSlotBox.height / 2
  )
  await page.reload({ waitUntil: "domcontentloaded" })
  await dismissConsent(page)
  await expect(gridSlot).toBeVisible()
  await page.waitForTimeout(800)

  await expect(page.locator(".tw-fixed.tw-z-50")).toHaveCount(0)
})

test("mobile compatibility mouse press shows the selected-slot tooltip", async ({
  page,
}) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile compatibility mouse tooltip regression"
  )
  await page.setViewportSize({ width: 375, height: 900 })

  const selectedSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await selectedSlot.scrollIntoViewIfNeeded()
  const selectedSlotBox = await selectedSlot.boundingBox()
  expect(selectedSlotBox).not.toBeNull()
  if (!selectedSlotBox) {
    throw new Error("Expected selected grid slot to be visible")
  }

  await selectedSlot.dispatchEvent("mousedown", {
    clientX: selectedSlotBox.x + selectedSlotBox.width / 2,
    clientY: selectedSlotBox.y + selectedSlotBox.height / 2,
  })

  const tooltip = page.locator(".tw-fixed.tw-z-50")
  await expect(tooltip).toBeVisible()
  expect(await tooltip.textContent()).not.toBe("")
})

test("mobile timeslot click shows the selected-slot tooltip", async ({ page }) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile click tooltip regression"
  )
  await page.setViewportSize({ width: 375, height: 900 })

  const selectedSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await selectedSlot.scrollIntoViewIfNeeded()
  await selectedSlot.dispatchEvent("click")

  const tooltip = page.locator(".tw-fixed.tw-z-50")
  await expect(tooltip).toBeVisible()
  expect(await tooltip.textContent()).not.toBe("")

  const [selectedSlotBox, tooltipBox] = await Promise.all([
    selectedSlot.boundingBox(),
    tooltip.boundingBox(),
  ])
  expect(selectedSlotBox).not.toBeNull()
  expect(tooltipBox).not.toBeNull()
  if (!selectedSlotBox || !tooltipBox) {
    throw new Error("Expected visible selected slot and tooltip")
  }

  const verticalGap = tooltipBox.y + tooltipBox.height <= selectedSlotBox.y
    ? selectedSlotBox.y - (tooltipBox.y + tooltipBox.height)
    : tooltipBox.y - (selectedSlotBox.y + selectedSlotBox.height)
  expect(verticalGap).toBeGreaterThan(0)
})

test("mobile grid tooltip stays beside the selected slot while a press moves outside it", async ({
  page,
}) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile selected-slot tooltip regression"
  )
  await page.setViewportSize({ width: 375, height: 900 })

  const selectedSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await selectedSlot.scrollIntoViewIfNeeded()
  const selectedSlotBox = await selectedSlot.boundingBox()
  expect(selectedSlotBox).not.toBeNull()
  if (!selectedSlotBox) {
    throw new Error("Expected selected grid slot to be visible")
  }

  const selectedX = selectedSlotBox.x + selectedSlotBox.width / 2
  const selectedY = selectedSlotBox.y + selectedSlotBox.height / 2

  await page.mouse.move(selectedX, selectedY)
  await page.mouse.down()

  const tooltip = page.locator(".tw-fixed.tw-z-50")
  await expect(tooltip).toBeVisible()
  const tooltipText = await tooltip.textContent()
  expect(tooltipText).not.toBe("")

  const outsideGridPoint = await page.evaluate(() => {
    const candidates = [
      { x: 8, y: 8 },
      { x: window.innerWidth - 8, y: 8 },
      { x: 8, y: window.innerHeight - 8 },
      { x: window.innerWidth - 8, y: window.innerHeight - 8 },
    ]
    const point = candidates.find(({ x, y }) =>
      !document.elementFromPoint(x, y)?.closest("#drag-section")
    )
    if (!point) {
      throw new Error("Expected a viewport point outside the time grid")
    }
    return point
  })
  await page.mouse.move(outsideGridPoint.x, outsideGridPoint.y, { steps: 10 })
  const selectedSlotAfterMove = await selectedSlot.boundingBox()
  expect(selectedSlotAfterMove).not.toBeNull()
  if (!selectedSlotAfterMove) {
    throw new Error("Expected selected grid slot to remain visible")
  }
  await expect.poll(async () => tooltip.evaluate((element) =>
    Number.parseFloat((element as HTMLElement).style.left)
  )).toBe(selectedSlotAfterMove.x + selectedSlotAfterMove.width / 2)
  await expect(tooltip).toHaveText(tooltipText ?? "")

  await page.mouse.up()
})

test("enabling specific-times and saving without grid edits preserves canonical timed fields", async ({
  page,
  request,
}) => {
  const seeded = await seedCanonicalTimedEvent(
    request,
    buildSpecificDateSeed({
      name: "Specific-times no-op regression",
      selectedDays: ["2026-05-28", "2026-05-29"],
      enabledSlots: [...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29],
      eventTimezone: "UTC",
      startTimeLocal: "00:00:00",
      endTimeLocal: "04:00:00",
      timeIncrementMinutes: 60,
      activeSlots: [...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29],
      hasSpecificTimes: false,
    })
  )
  const baselineEvent = await fetchEventByShortId(request, seeded.shortId)

  await openEventPage(page, seeded.shortId)
  const editorCard = await openEditDialog(page)
  await revealAdvancedOptions(editorCard)
  await setSpecificTimesEnabled(editorCard, true)
  await proceedToSpecificTimesGrid(page)
  await saveEditorAndWaitForPut(page, { action: "next" })

  const savedEvent = await fetchEventByShortId(request, seeded.shortId)
  expect(sortIsoInstants(savedEvent.enabledSlots)).toEqual(
    sortIsoInstants([...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29])
  )
  expect(sortIsoInstants(savedEvent.activeSlots)).toEqual(
    sortIsoInstants([...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29])
  )
  expect(savedEvent.eventTimezone).toBe(baselineEvent.eventTimezone)
  expect(savedEvent.slotGeneration).toEqual(baselineEvent.slotGeneration)
  expect(savedEvent.timedRecurrence).toEqual(baselineEvent.timedRecurrence)

  await page.reload({ waitUntil: "domcontentloaded" })
  await dismissConsent(page)
  const reopenedEditor = await openEditDialog(page)
  const selectedDates = selectedDatesFromState(await collectDatePickerState(reopenedEditor))
  expect(selectedDates).toEqual(["2026-05-28", "2026-05-29"])
})

test("disabling specific-times restores active slots to the full enabled domain", async ({
  page,
  request,
}) => {
  const seeded = await seedCanonicalTimedEvent(
    request,
    buildSpecificDateSeed({
      name: "Disable specific-times regression",
      selectedDays: ["2026-05-28", "2026-05-29"],
      enabledSlots: [...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29],
      activeSlots: [...SLOT_UTC_MAY_29],
      eventTimezone: "UTC",
      startTimeLocal: "00:00:00",
      endTimeLocal: "04:00:00",
      timeIncrementMinutes: 60,
    })
  )

  await openEventPage(page, seeded.shortId)
  const editorCard = await openEditDialog(page)
  await revealAdvancedOptions(editorCard)
  await setSpecificTimesEnabled(editorCard, false)
  await saveEditorAndWaitForPut(page, { action: "save" })

  const savedEvent = await fetchEventByShortId(request, seeded.shortId)
  expect(sortIsoInstants(savedEvent.enabledSlots)).toEqual(
    sortIsoInstants([...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29])
  )
  expect(sortIsoInstants(savedEvent.activeSlots)).toEqual(
    sortIsoInstants([...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29])
  )
})

test("broad timed edits rewrite contradictory canonical slots before reopen-specific-times seeding", async ({
  page,
  request,
}) => {
  const canonicalWindow = [
    ...buildUtcSpecificTimesRangeInstants({
      day: "2026-05-28",
      startHour: 9,
      startMinute: 0,
      endHour: 16,
      endMinute: 0,
      incrementMinutes: 60,
    }),
    ...buildUtcSpecificTimesRangeInstants({
      day: "2026-05-29",
      startHour: 9,
      startMinute: 0,
      endHour: 16,
      endMinute: 0,
      incrementMinutes: 60,
    }),
  ]
  const staleSlots = [
    "2026-05-28T06:00:00Z",
    "2026-05-28T07:00:00Z",
    "2026-05-29T05:00:00Z",
  ]

  const seeded = await seedCanonicalTimedEvent(
    request,
    buildSpecificDateSeed({
      name: "Broad timed canonical rewrite regression",
      selectedDays: ["2026-05-28", "2026-05-29"],
      enabledSlots: [...staleSlots, ...canonicalWindow],
      activeSlots: [...staleSlots, ...canonicalWindow],
      eventTimezone: "UTC",
      startTimeLocal: "09:00:00",
      endTimeLocal: "17:00:00",
      timeIncrementMinutes: 60,
      hasSpecificTimes: false,
    })
  )

  await openEventPage(page, seeded.shortId)
  const editorCard = await openEditDialog(page)
  await revealAdvancedOptions(editorCard)
  await setSpecificTimesEnabled(editorCard, false)

  const putResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      response.url().includes("/api/events/"),
    { timeout: 30000 }
  )
  await saveEditorAndWaitForPut(page, { action: "save" })
  const putPayload = putResponsePromise.then((response) =>
    response.request().postDataJSON() as {
      enabledSlots?: string[]
      activeSlots?: string[]
    }
  )

  expect(sortIsoInstants((await putPayload).enabledSlots)).toEqual(
    sortIsoInstants(canonicalWindow)
  )
  expect(sortIsoInstants((await putPayload).activeSlots)).toEqual(
    sortIsoInstants(canonicalWindow)
  )

  const savedEvent = await fetchEventByShortId(request, seeded.shortId)
  expect(sortIsoInstants(savedEvent.enabledSlots)).toEqual(
    sortIsoInstants(canonicalWindow)
  )
  expect(sortIsoInstants(savedEvent.activeSlots)).toEqual(
    sortIsoInstants(canonicalWindow)
  )

  await page.reload({ waitUntil: "domcontentloaded" })
  await dismissConsent(page)
  const reopenedEditor = await openEditDialog(page)
  await revealAdvancedOptions(reopenedEditor)
  await setSpecificTimesEnabled(reopenedEditor, true)
  await proceedToSpecificTimesGrid(page)

  expect(await countGridCellsByClass(page, "tw-bg-white")).toBe(canonicalWindow.length)
})

test("timed date edits preserve active subsets on add and remove both enabled and active slots on delete", async ({
  page,
  request,
}) => {
  const newDaySlots = [
    "2026-05-30T00:00:00Z",
    "2026-05-30T01:00:00Z",
    "2026-05-30T02:00:00Z",
    "2026-05-30T03:00:00Z",
  ]
  const seeded = await seedCanonicalTimedEvent(
    request,
    buildSpecificDateSeed({
      name: "Date add remove regression",
      selectedDays: ["2026-05-28", "2026-05-29"],
      enabledSlots: [...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29],
      activeSlots: [...SLOT_UTC_MAY_29],
      eventTimezone: "UTC",
      startTimeLocal: "00:00:00",
      endTimeLocal: "04:00:00",
      timeIncrementMinutes: 60,
    })
  )

  await openEventPage(page, seeded.shortId)
  let editorCard = await openEditDialog(page)
  await clickDateCell(editorCard, "2026-05-30")
  await proceedToSpecificTimesGrid(page)
  await saveEditorAndWaitForPut(page, { action: "next" })

  let savedEvent = await fetchEventByShortId(request, seeded.shortId)
  expect(sortIsoInstants(savedEvent.enabledSlots)).toEqual(
    sortIsoInstants([...SLOT_UTC_MAY_28, ...SLOT_UTC_MAY_29, ...newDaySlots])
  )
  expect(sortIsoInstants(savedEvent.activeSlots)).toEqual(sortIsoInstants(SLOT_UTC_MAY_29))

  await page.reload({ waitUntil: "domcontentloaded" })
  await dismissConsent(page)
  editorCard = await openEditDialog(page)
  await clickDateCell(editorCard, "2026-05-28")
  await proceedToSpecificTimesGrid(page)
  await saveEditorAndWaitForPut(page, { action: "next" })

  savedEvent = await fetchEventByShortId(request, seeded.shortId)
  expect(sortIsoInstants(savedEvent.enabledSlots)).toEqual(
    sortIsoInstants([...SLOT_UTC_MAY_29, ...newDaySlots])
  )
  expect(sortIsoInstants(savedEvent.activeSlots)).toEqual(sortIsoInstants(SLOT_UTC_MAY_29))
})
