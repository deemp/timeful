// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest"
import { Temporal } from "temporal-polyfill"
import { resetScheduleOverlapMocks } from "./scheduleOverlapTestMocks"
import {
  buildScheduleOverlapProps,
  getTimedGridPresentation,
  installScheduleOverlapTestGlobals,
  mountScheduleOverlap,
  zdt,
} from "./scheduleOverlapTestUtils"

describe("ScheduleOverlap wrapped timezones", () => {
  beforeEach(() => {
    resetScheduleOverlapMocks()
    installScheduleOverlapTestGlobals()
  })

  it("keeps wrapped UTC+3:30 midnight rows continuous", () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01"), Temporal.PlainDate.from("2026-01-02")],
          timeSeed: zdt("2026-01-01T19:30:00Z"),
          startTime: Temporal.PlainTime.from("19:30"),
          duration: Temporal.Duration.from({ hours: 8 }),
          timeIncrement: Temporal.Duration.from({ minutes: 30 }),
          hasSpecificTimes: false,
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: {
          value: "+03:30",
          offset: Temporal.Duration.from({ minutes: -210 }),
          label: "UTC+3:30",
          gmtString: "GMT+3:30",
        },
      },
    })

    const vm = wrapper.vm as unknown as {
      getDateFromRowCol: (row: number, col: number) => Temporal.ZonedDateTime | null
    }
    const timedGrid = getTimedGridPresentation(wrapper)

    const hourLabels = timedGrid.renderedRows
      .map((row) => row.timeText)
      .filter((label): label is string => Boolean(label))

    expect(timedGrid.renderedRows.some((row) => row.kind === "split-gap")).toBe(false)
    expect(timedGrid.renderedRows[0]?.timeText).toBe("12 AM")
    expect(hourLabels).toContain("11 PM")
    expect(hourLabels.filter((label) => label === "2 AM")).toHaveLength(1)

    for (let col = 0; col < timedGrid.days.length; col += 1) {
      const headerDate = timedGrid.days[col]?.dateObject.withTimeZone("+03:30").toPlainDate().toString()
      for (let row = 0; row < timedGrid.splitTimes[0].length + timedGrid.splitTimes[1].length; row += 1) {
        const slot = vm.getDateFromRowCol(row, col)
        if (!slot) continue
        expect(slot.withTimeZone("+03:30").toPlainDate().toString()).toBe(headerDate)
      }
    }
  })

  it("does not render a split gap when wrapped UTC+4:00 local-day ranges only touch", () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01"), Temporal.PlainDate.from("2026-01-02")],
          timeSeed: zdt("2026-01-01T21:00:00Z"),
          startTime: Temporal.PlainTime.from("21:00"),
          duration: Temporal.Duration.from({ hours: 24 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          hasSpecificTimes: false,
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: {
          value: "+04:00",
          offset: Temporal.Duration.from({ hours: -4 }),
          label: "UTC+4:00",
          gmtString: "GMT+4:00",
        },
      },
    })

    const timedGrid = getTimedGridPresentation(wrapper)

    const hourLabels = timedGrid.renderedRows
      .map((row) => row.timeText)
      .filter((label): label is string => Boolean(label))

    expect(timedGrid.renderedRows.some((row) => row.kind === "split-gap")).toBe(false)
    expect(timedGrid.splitTimes[1]).toEqual([])
    expect(hourLabels.slice(0, 4)).toEqual(["12 AM", "1 AM", "2 AM", "3 AM"])
    expect(hourLabels.at(-1)).toBe("11 PM")
    expect(timedGrid.timeAxisEndText).toBe("12 AM")
    expect(hourLabels.filter((label) => label === "12 AM")).toHaveLength(1)
    expect(hourLabels.filter((label) => label === "1 AM")).toHaveLength(1)
    expect(
      new Set(
        timedGrid.splitTimes[0]
          .map((time) => time.displayedMinutes)
          .filter((minutes): minutes is number => typeof minutes === "number")
      ).size
    ).toBe(timedGrid.splitTimes[0].length)
  })

  it("does not render a split gap or duplicate hour labels when a wrapped Kathmandu window overlaps in displayed local time", () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01"), Temporal.PlainDate.from("2026-01-02")],
          timeSeed: zdt("2025-12-31T18:30:00Z"),
          startTime: Temporal.PlainTime.from("18:30"),
          duration: Temporal.Duration.from({ hours: 25 }),
          timeIncrement: Temporal.Duration.from({ minutes: 15 }),
          hasSpecificTimes: false,
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: {
          value: "Asia/Kathmandu",
          offset: Temporal.Duration.from({ minutes: -345 }),
          label: "Asia/Kathmandu",
          gmtString: "GMT+5:45",
        },
      },
    })

    const timedGrid = getTimedGridPresentation(wrapper)

    const hourLabels = timedGrid.renderedRows
      .map((row) => row.timeText)
      .filter((label): label is string => Boolean(label))

    expect(timedGrid.renderedRows.some((row) => row.kind === "split-gap")).toBe(false)
    expect(timedGrid.splitTimes[1]).toEqual([])
    expect(hourLabels.filter((label) => label === "12 AM")).toHaveLength(1)
    expect(hourLabels.filter((label) => label === "1 AM")).toHaveLength(1)
    expect(hourLabels.filter((label) => label === "2 AM")).toHaveLength(1)
    expect(
      new Set(
        timedGrid.splitTimes[0]
          .map((time) => time.displayedMinutes)
          .filter((minutes): minutes is number => typeof minutes === "number")
      ).size
    ).toBe(timedGrid.splitTimes[0].length)
  })
})
