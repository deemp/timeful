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
