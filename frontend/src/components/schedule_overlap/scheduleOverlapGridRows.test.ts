import { describe, expect, it } from "vitest"
import { Temporal } from "temporal-polyfill"
import type { TimeItem } from "@/composables/schedule_overlap/types"
import {
  buildCollapsedPageSegments,
  buildPageSlots,
  buildRenderedTimeGridRows,
  getPageGreyFlags,
  getTimeAxisEndText,
} from "./scheduleOverlapGridRows"

const times = (start: number, count: number, increment = 60): TimeItem[] =>
  Array.from({ length: count }, (_, index) => ({
    hoursOffset: Temporal.Duration.from({ minutes: start + index * increment }),
    absoluteMinutes: start + index * increment,
  }))

const formatTime = (absoluteMinutes: number) =>
  `${String(Math.floor(absoluteMinutes / 60)).padStart(2, "0")}:${String(
    absoluteMinutes % 60
  ).padStart(2, "0")}`

describe("scheduleOverlapGridRows", () => {
  it("keeps split time rows in stable base-row order", () => {
    const slots = buildPageSlots([times(1320, 2), times(0, 2)], 60)

    expect(slots.map((slot) => [slot.id, slot.baseRowIndex, slot.startMinutes])).toEqual([
      ["time-0", 0, 1320],
      ["time-1", 1, 1380],
      ["time-2", 2, 0],
      ["time-3", 3, 60],
    ])
  })

  it("only collapses complete interior hours meeting the minimum span", () => {
    const slots = buildPageSlots([times(9 * 60 + 15, 16, 15), []], 15)
    const segments = buildCollapsedPageSegments({
      canCollapseTimes: true,
      pageSlots: slots,
      pageGreyFlags: slots.map(() => true),
      timeslotMinutes: 15,
    })

    expect(segments).toEqual([
      expect.objectContaining({
        id: "collapsed-600-780",
        hiddenStartIndex: 3,
        hiddenEndIndex: 15,
      }),
    ])
  })

  it("does not collapse a run when one visible day has an active slot", () => {
    const slots = buildPageSlots([times(9 * 60, 4), []], 60)
    const greyFlags = getPageGreyFlags(slots, (baseRowIndex) => baseRowIndex !== 2)

    expect(
      buildCollapsedPageSegments({
        canCollapseTimes: true,
        pageSlots: slots,
        pageGreyFlags: greyFlags,
        timeslotMinutes: 60,
      })
    ).toEqual([])
  })

  it("replaces collapsed rows and restores them when expanded", () => {
    const slots = buildPageSlots([times(9 * 60, 5), []], 60)
    const [segment] = buildCollapsedPageSegments({
      canCollapseTimes: true,
      pageSlots: slots,
      pageGreyFlags: [false, true, true, true, false],
      timeslotMinutes: 60,
    })
    const buildRows = (expandedCollapsedSpanIds: Set<string>) =>
      buildRenderedTimeGridRows({
        pageSlots: slots,
        collapsedPageSegments: [segment],
        expandedCollapsedSpanIds,
        timeslotHeight: 60,
        visibleDayCount: 1,
        getTimeItem: (index) => times(9 * 60, 5)[index],
        formatTime,
        getCell: () => ({ class: "", style: {}, von: {} }),
      })

    expect(buildRows(new Set()).map((row) => row.kind)).toEqual(["timeslot", "collapsed", "timeslot"])
    expect(buildRows(new Set([segment.id])).map((row) => row.baseRowIndex)).toEqual([0, 1, 2, 3, 4])
    expect(getTimeAxisEndText(slots, formatTime)).toBe("14:00")
  })

  it("uses the selected time format for regular, collapsed, and end-axis labels", () => {
    const slots = buildPageSlots([times(12 * 60, 5), []], 60)
    const [segment] = buildCollapsedPageSegments({
      canCollapseTimes: true,
      pageSlots: slots,
      pageGreyFlags: [false, true, true, true, false],
      timeslotMinutes: 60,
    })
    const formatTwelveHour = (absoluteMinutes: number) =>
      `${String((Math.floor(absoluteMinutes / 60) + 11) % 12 + 1)} ${
        absoluteMinutes < 12 * 60 ? "am" : "pm"
      }`
    const rows = buildRenderedTimeGridRows({
      pageSlots: slots,
      collapsedPageSegments: [segment],
      expandedCollapsedSpanIds: new Set(),
      timeslotHeight: 60,
      visibleDayCount: 1,
      getTimeItem: (index) => ({
        ...times(12 * 60, 5)[index],
        text: index === 0 ? "12 pm" : index === 4 ? "4 pm" : undefined,
      }),
      formatTime: formatTwelveHour,
      getCell: () => ({ class: "", style: {}, von: {} }),
    })

    expect(rows.map((row) => row.timeText)).toEqual(["12 pm", "1 pm", "4 pm"])
    expect(rows[1]).toMatchObject({ startLabel: "1 pm", endLabel: "4 pm" })
    expect(getTimeAxisEndText(slots, formatTwelveHour)).toBe("5 pm")
  })
})
