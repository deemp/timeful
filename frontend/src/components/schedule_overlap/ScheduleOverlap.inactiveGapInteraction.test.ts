// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest"
import { nextTick } from "vue"
import { Temporal } from "temporal-polyfill"
import type { formatTooltipContent } from "./scheduleOverlapRendering"
import { resetScheduleOverlapMocks } from "./scheduleOverlapTestMocks"
import {
  buildScheduleOverlapProps,
  buildUtcSpecificTimes,
  getTimedGridPresentation,
  installScheduleOverlapTestGlobals,
  mountScheduleOverlap,
  utcTimezone,
  zdt,
} from "./scheduleOverlapTestUtils"

describe("ScheduleOverlap inactive gap interactions", () => {
  beforeEach(() => {
    resetScheduleOverlapMocks()
    installScheduleOverlapTestGlobals()
  })

  it("keeps non-editing hover following the cursor after a click", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          responses: {
            khh: {
              user: {
                _id: "000000000000000000000000",
                firstName: "khh",
                lastName: "",
                email: "",
              },
              availability: [],
              ifNeeded: [],
              manualAvailability: {},
            },
          },
        },
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      timeslotSelected: boolean
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
    }

    vm.getTimeslotVon(0, 0).click()
    vm.getTimeslotVon(1, 0).mouseover()
    await nextTick()

    expect(vm.timeslotSelected).toBe(false)
    expect(vm.curTimeslot).toEqual({ row: 1, col: 0 })
  })

  it("clears the hover highlight and tooltip on inactive grey specific-time gaps", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01")],
          timeSeed: zdt("2026-01-01T09:00:00Z"),
          hasSpecificTimes: true,
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 3 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            zdt("2026-01-01T09:00:00Z"),
            zdt("2026-01-01T11:00:00Z"),
          ],
        },
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      tooltipContent: ReturnType<typeof formatTooltipContent>
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
    }

    vm.getTimeslotVon(1, 0).mouseover()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(vm.tooltipContent).toEqual([])

    vm.getTimeslotVon(0, 0).mouseover()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: 0, col: 0 })
    expect(vm.tooltipContent).not.toEqual([])

    vm.getTimeslotVon(1, 0).mouseover()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(vm.tooltipContent).toEqual([])
  })

  it("clears the desktop selection and tooltip when clicking an inactive gap", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01")],
          timeSeed: zdt("2026-01-01T09:00:00Z"),
          hasSpecificTimes: true,
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 3 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            zdt("2026-01-01T09:00:00Z"),
            zdt("2026-01-01T11:00:00Z"),
          ],
        },
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
    }

    vm.getTimeslotVon(0, 0).click()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: 0, col: 0 })

    vm.getTimeslotVon(1, 0).click()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })

    wrapper.unmount()
  })

  it("marks the timeslot inactive and clears respondent availability when hovering an inactive gap", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01")],
          timeSeed: zdt("2026-01-01T09:00:00Z"),
          hasSpecificTimes: true,
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 3 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            zdt("2026-01-01T09:00:00Z"),
            zdt("2026-01-01T11:00:00Z"),
          ],
          responses: {
            "user-1": {
              name: "User One",
              user: {
                _id: "user-1",
                firstName: "User",
                lastName: "One",
                email: "",
              },
              availability: [],
              ifNeeded: [],
              manualAvailability: {},
            },
          },
        },
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      curTimeslotInactive: boolean
      curTimeslotAvailability: Record<string, boolean>
      fetchedResponses: Record<
        string,
        {
          availability?: Temporal.ZonedDateTime[]
          ifNeeded?: Temporal.ZonedDateTime[]
        }
      >
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
    }

    vm.fetchedResponses = {
      "user-1": {
        availability: [zdt("2026-01-01T09:00:00Z")],
        ifNeeded: [],
      },
    }
    await nextTick()

    vm.getTimeslotVon(0, 0).mouseover()
    await nextTick()

    expect(vm.curTimeslotInactive).toBe(false)
    expect(vm.curTimeslot).toEqual({ row: 0, col: 0 })
    expect(vm.curTimeslotAvailability["user-1"]).toBe(true)

    vm.getTimeslotVon(1, 0).mouseover()
    await nextTick()

    expect(vm.curTimeslotInactive).toBe(true)
    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(vm.curTimeslotAvailability["user-1"]).toBe(false)

    wrapper.unmount()
  })

  it("marks the collapsed hours inactive and clears the highlight on hover", async () => {
    localStorage.setItem("showAllHours", "false")
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [
            Temporal.PlainDate.from("2026-01-01"),
            Temporal.PlainDate.from("2026-01-02"),
          ],
          timeSeed: zdt("2026-01-01T09:00:00Z"),
          hasSpecificTimes: true,
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 8 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          enabledSlots: [
            ...buildUtcSpecificTimes("2026-01-01", [
              "09:00:00",
              "10:00:00",
              "11:00:00",
              "12:00:00",
              "13:00:00",
              "14:00:00",
              "15:00:00",
              "16:00:00",
            ]),
            ...buildUtcSpecificTimes("2026-01-02", [
              "09:00:00",
              "10:00:00",
              "11:00:00",
              "12:00:00",
              "13:00:00",
              "14:00:00",
              "15:00:00",
              "16:00:00",
            ]),
          ],
          activeSlots: [
            ...buildUtcSpecificTimes("2026-01-01", [
              "09:00:00",
              "16:00:00",
            ]),
            ...buildUtcSpecificTimes("2026-01-02", [
              "09:00:00",
              "16:00:00",
            ]),
          ],
          times: [
            ...buildUtcSpecificTimes("2026-01-01", ["09:00:00", "16:00:00"]),
            ...buildUtcSpecificTimes("2026-01-02", ["09:00:00", "16:00:00"]),
          ],
          responses: {
            "user-1": {
              name: "User One",
              user: {
                _id: "user-1",
                firstName: "User",
                lastName: "One",
                email: "",
              },
              availability: [],
              ifNeeded: [],
              manualAvailability: {},
            },
          },
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      curTimeslotInactive: boolean
      curTimeslotAvailability: Record<string, boolean>
      fetchedResponses: Record<
        string,
        {
          availability?: Temporal.ZonedDateTime[]
          ifNeeded?: Temporal.ZonedDateTime[]
        }
      >
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
      markCollapsedRowInactive: () => void
    }

    vm.fetchedResponses = {
      "user-1": {
        availability: [zdt("2026-01-01T09:00:00Z")],
        ifNeeded: [],
      },
    }
    await nextTick()

    const collapsedRows = getTimedGridPresentation(wrapper).renderedRows.filter(
      (row) => row.kind === "collapsed"
    )
    expect(collapsedRows.length).toBeGreaterThan(0)

    vm.getTimeslotVon(0, 0).mouseover()
    await nextTick()

    expect(vm.curTimeslotInactive).toBe(false)
    expect(vm.curTimeslot).toEqual({ row: 0, col: 0 })
    expect(vm.curTimeslotAvailability["user-1"]).toBe(true)

    vm.markCollapsedRowInactive()
    await nextTick()

    expect(vm.curTimeslotInactive).toBe(true)
    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(vm.curTimeslotAvailability).toEqual({ "user-1": false })

    wrapper.unmount()
  })

  it("marks the timeslot inactive and clears respondent availability when clicking an inactive gap", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01")],
          timeSeed: zdt("2026-01-01T09:00:00Z"),
          hasSpecificTimes: true,
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 3 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            zdt("2026-01-01T09:00:00Z"),
            zdt("2026-01-01T11:00:00Z"),
          ],
          responses: {
            "user-1": {
              name: "User One",
              user: {
                _id: "user-1",
                firstName: "User",
                lastName: "One",
                email: "",
              },
              availability: [],
              ifNeeded: [],
              manualAvailability: {},
            },
          },
        },
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      curTimeslotInactive: boolean
      curTimeslotAvailability: Record<string, boolean>
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
    }

    vm.getTimeslotVon(0, 0).click()
    await nextTick()

    expect(vm.curTimeslotInactive).toBe(false)

    vm.getTimeslotVon(1, 0).click()
    await nextTick()

    expect(vm.curTimeslotInactive).toBe(true)
    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(vm.curTimeslotAvailability["user-1"]).toBe(false)

    wrapper.unmount()
  })

  it("shows the aggregate responses when hovering the space between split grids", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [
            Temporal.PlainDate.from("2026-08-06"),
            Temporal.PlainDate.from("2026-08-09"),
          ],
          timeSeed: zdt("2026-08-06T09:00:00Z"),
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 3 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            zdt("2026-08-06T09:00:00Z"),
            zdt("2026-08-06T11:00:00Z"),
            zdt("2026-08-09T09:00:00Z"),
            zdt("2026-08-09T11:00:00Z"),
          ],
          responses: {
            "user-1": {
              name: "User One",
              user: {
                _id: "user-1",
                firstName: "User",
                lastName: "One",
                email: "",
              },
              availability: [],
              ifNeeded: [],
              manualAvailability: {},
            },
          },
        },
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      curTimeslotInactive: boolean
      curTimeslotAvailability: Record<string, boolean>
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
      markSplitGapOutside: () => void
    }

    expect(
      getTimedGridPresentation(wrapper).days.map((day) => day.isConsecutive)
    ).toEqual([true, false])

    vm.getTimeslotVon(0, 0).mouseover()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: 0, col: 0 })
    expect(vm.curTimeslotAvailability["user-1"]).toBe(false)

    vm.markSplitGapOutside()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(vm.curTimeslotInactive).toBe(false)
    expect(vm.curTimeslotAvailability["user-1"]).toBe(true)

    wrapper.unmount()
  })

  it("shows the aggregate responses when clicking the space between split grids", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [
            Temporal.PlainDate.from("2026-08-06"),
            Temporal.PlainDate.from("2026-08-09"),
          ],
          timeSeed: zdt("2026-08-06T09:00:00Z"),
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 3 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            zdt("2026-08-06T09:00:00Z"),
            zdt("2026-08-06T11:00:00Z"),
            zdt("2026-08-09T09:00:00Z"),
            zdt("2026-08-09T11:00:00Z"),
          ],
          responses: {
            "user-1": {
              name: "User One",
              user: {
                _id: "user-1",
                firstName: "User",
                lastName: "One",
                email: "",
              },
              availability: [],
              ifNeeded: [],
              manualAvailability: {},
            },
          },
        },
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      curTimeslotInactive: boolean
      curTimeslotAvailability: Record<string, boolean>
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
      clickSplitGapOutside: () => void
    }

    vm.getTimeslotVon(0, 0).click()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: 0, col: 0 })
    expect(vm.curTimeslotAvailability["user-1"]).toBe(false)

    vm.clickSplitGapOutside()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(vm.curTimeslotInactive).toBe(false)
    expect(vm.curTimeslotAvailability["user-1"]).toBe(true)

    wrapper.unmount()
  })
})
