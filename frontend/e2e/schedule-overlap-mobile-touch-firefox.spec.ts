import { expect, test } from "@playwright/test"
import { createSpecificTimesEventFromDialog } from "./helpers/timed-event-helpers"

test("Responses panel prevents touch gestures from reaching the mobile grid", async ({
  page,
}) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile Responses touch shield regression"
  )

  const selectedSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await selectedSlot.scrollIntoViewIfNeeded()
  await selectedSlot.dispatchEvent("click")

  await page.evaluate(() => {
    const dragSection = document.querySelector("#drag-section")
    if (!(dragSection instanceof HTMLElement)) {
      throw new Error("Expected drag section")
    }
    dragSection.dataset.pointerDowns = "0"
    dragSection.dataset.mouseDowns = "0"
    dragSection.dataset.clicks = "0"
    dragSection.addEventListener("pointerdown", () => {
      dragSection.dataset.pointerDowns = String(
        Number(dragSection.dataset.pointerDowns) + 1
      )
    })
    dragSection.addEventListener("mousedown", () => {
      dragSection.dataset.mouseDowns = String(
        Number(dragSection.dataset.mouseDowns) + 1
      )
    })
    dragSection.addEventListener("click", () => {
      dragSection.dataset.clicks = String(Number(dragSection.dataset.clicks) + 1)
    })
  })

  const responsesHeading = page
    .locator(".schedule-overlap-mobile-overlay")
    .getByText("Responses", { exact: true })
  await expect(responsesHeading).toBeVisible()
  const headingBox = await responsesHeading.boundingBox()
  expect(headingBox).not.toBeNull()
  if (!headingBox) {
    throw new Error("Expected the Responses heading to be visible")
  }
  await page.touchscreen.tap(
    headingBox.x + headingBox.width / 2,
    headingBox.y + headingBox.height / 2
  )
  await expect(responsesHeading).toBeVisible()
  await expect.poll(() => page.locator("#drag-section").evaluate((element) => ({
    pointerDowns: Number((element as HTMLElement).dataset.pointerDowns),
    mouseDowns: Number((element as HTMLElement).dataset.mouseDowns),
    clicks: Number((element as HTMLElement).dataset.clicks),
  }))).toEqual({ pointerDowns: 0, mouseDowns: 0, clicks: 0 })
})

test("Responses panel stacks above an overlapping mobile tooltip", async ({ page }) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile Responses tooltip layering regression"
  )

  const selectedSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await selectedSlot.scrollIntoViewIfNeeded()
  await selectedSlot.dispatchEvent("click")

  const overlay = page.locator(".schedule-overlap-mobile-overlay")
  const tooltip = page.locator(".tw-fixed.tw-z-50")
  await expect(overlay.getByText("Responses", { exact: true })).toBeVisible()
  await expect(tooltip).toBeVisible()

  await expect.poll(() => page.evaluate(() => {
    const overlayElement = document.querySelector<HTMLElement>(
      ".schedule-overlap-mobile-overlay"
    )
    const tooltipElement = document.querySelector<HTMLElement>(
      ".tw-fixed.tw-z-50"
    )
    if (!overlayElement || !tooltipElement) return false

    const overlayRect = overlayElement.getBoundingClientRect()
    tooltipElement.style.left = `${String(overlayRect.left + overlayRect.width / 2)}px`
    tooltipElement.style.top = `${String(overlayRect.top + 16)}px`
    tooltipElement.style.transform = "translate(-50%, 0)"
    tooltipElement.style.pointerEvents = "auto"

    return overlayElement.contains(document.elementFromPoint(
      overlayRect.left + overlayRect.width / 2,
      overlayRect.top + 16
    ))
  })).toBe(true)
})

test("touching a timeslot keeps its mobile tooltip anchored while scrolling", async ({ page }) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile touch selected-slot tooltip regression"
  )

  const selectedSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await selectedSlot.scrollIntoViewIfNeeded()
  const selectedSlotBox = await selectedSlot.boundingBox()
  expect(selectedSlotBox).not.toBeNull()
  if (!selectedSlotBox) {
    throw new Error("Expected selected grid slot to be visible")
  }

  await page.touchscreen.tap(
    selectedSlotBox.x + selectedSlotBox.width / 2,
    selectedSlotBox.y + selectedSlotBox.height / 2
  )

  const tooltip = page.locator(".tw-fixed.tw-z-50")
  await expect(tooltip).toBeVisible()
  expect(await tooltip.textContent()).not.toBe("")

  await page.evaluate(() => {
    window.scrollBy({ top: 50 })
  })

  await expect.poll(async () => {
    return page.evaluate(() => {
      const slot = document.querySelector<HTMLElement>(
        '#drag-section .timeslot[data-row="1"][data-col="0"]'
      )
      const tooltipElement = document.querySelector<HTMLElement>(".tw-fixed.tw-z-50")
      if (!slot || !tooltipElement) return false

      const slotRect = slot.getBoundingClientRect()
      return Number.parseFloat(tooltipElement.style.left) ===
          slotRect.left + slotRect.width / 2 &&
        Number.parseFloat(tooltipElement.style.top) ===
          (tooltipElement.style.transform.includes("calc")
            ? slotRect.top
            : slotRect.top + slotRect.height)
    })
  }).toBe(true)
})

test("mobile grid tooltip stays below the top navbar when scrolled underneath it", async ({
  page,
}) => {
  await createSpecificTimesEventFromDialog(
    page,
    "Mobile tooltip navbar layering regression"
  )

  const selectedSlot = page.locator(
    '#drag-section .timeslot[data-row="1"][data-col="0"]'
  )
  await selectedSlot.scrollIntoViewIfNeeded()
  const selectedSlotBox = await selectedSlot.boundingBox()
  expect(selectedSlotBox).not.toBeNull()
  if (!selectedSlotBox) {
    throw new Error("Expected selected grid slot to be visible")
  }

  await page.touchscreen.tap(
    selectedSlotBox.x + selectedSlotBox.width / 2,
    selectedSlotBox.y + selectedSlotBox.height / 2
  )

  const tooltip = page.locator(".tw-fixed.tw-z-50")
  await expect(tooltip).toBeVisible()

  await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(
      ".tw-fixed.tw-h-14.tw-w-screen"
    )
    const slot = document.querySelector<HTMLElement>(
      '#drag-section .timeslot[data-row="1"][data-col="0"]'
    )
    const scrollContainer = document.scrollingElement as HTMLElement | null
    if (!header || !slot || !scrollContainer) {
      throw new Error("Expected top navbar, selected grid slot, and scroll container")
    }

    const headerRect = header.getBoundingClientRect()
    const slotRect = slot.getBoundingClientRect()
    scrollContainer.style.scrollBehavior = "auto"
    scrollContainer.scrollTop +=
      slotRect.top - (headerRect.height - slotRect.height - 16)
    window.dispatchEvent(new Event("scroll"))
  })

  await expect.poll(() => page.evaluate(() => {
    const header = document.querySelector<HTMLElement>(
      ".tw-fixed.tw-h-14.tw-w-screen"
    )
    const tooltipElement = document.querySelector<HTMLElement>(".tw-fixed.tw-z-50")
    if (!header || !tooltipElement) return false

    // Allow hit testing without changing the tooltip's stacking context.
    tooltipElement.style.pointerEvents = "auto"

    const headerRect = header.getBoundingClientRect()
    const tooltipRect = tooltipElement.getBoundingClientRect()
    const left = Math.max(headerRect.left, tooltipRect.left)
    const right = Math.min(headerRect.right, tooltipRect.right)
    const top = Math.max(headerRect.top, tooltipRect.top)
    const bottom = Math.min(headerRect.bottom, tooltipRect.bottom)
    if (left >= right || top >= bottom) return false

    return header.contains(document.elementFromPoint(
      (left + right) / 2,
      (top + bottom) / 2
    ))
  })).toBe(true)
})
