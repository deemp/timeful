// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest"
import { nextTick } from "vue"
import { Temporal } from "temporal-polyfill"
import { states } from "@/composables/schedule_overlap/types"
import { resetScheduleOverlapMocks, showInfoMock } from "./scheduleOverlapTestMocks"
import {
  buildScheduleOverlapProps,
  buildUtcSpecificTimes,
  getTimedGridPresentation,
  installScheduleOverlapTestGlobals,
  mountScheduleOverlap,
  utcTimezone,
  zdt,
} from "./scheduleOverlapTestUtils"

describe("ScheduleOverlap collapsed hours", () => {
  beforeEach(() => {
    resetScheduleOverlapMocks()
    installScheduleOverlapTestGlobals()
  })

  it("keeps a fully active saved specific-times window expanded", async () => {
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
          duration: Temporal.Duration.from({ hours: 11 }),
          times: [
            ...buildUtcSpecificTimes("2026-01-01", [
              "09:00:00",
              "10:00:00",
              "11:00:00",
              "12:00:00",
              "13:00:00",
              "14:00:00",
              "15:00:00",
              "16:00:00",
              "17:00:00",
              "18:00:00",
              "19:00:00",
              "20:00:00",
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
              "17:00:00",
              "18:00:00",
              "19:00:00",
              "20:00:00",
            ]),
          ],
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: {
          value: "UTC",
          offset: Temporal.Duration.from({ hours: 0 }),
          label: "UTC",
          gmtString: "GMT+0",
        },
      },
    })

    const vm = wrapper.vm as unknown as {
      showAllHours: boolean
      updateShowAllHours: (value: boolean) => void
    }

    expect(vm.showAllHours).toBe(false)

    let timedGrid = getTimedGridPresentation(wrapper)
    const initialTimeslotRows = timedGrid.renderedRows.filter((row) => row.kind === "timeslot")
    expect(timedGrid.renderedRows.some((row) => row.kind === "collapsed")).toBe(false)
    expect(initialTimeslotRows.length).toBe(timedGrid.splitTimes.flat().length)
    expect(initialTimeslotRows[0]?.timeText).toBe("9 AM")
    expect(
      initialTimeslotRows
        .map((row) => row.timeText)
        .filter((label): label is string => Boolean(label)),
    ).toEqual([
      "9 AM",
      "10 AM",
      "11 AM",
      "12 PM",
      "1 PM",
      "2 PM",
      "3 PM",
      "4 PM",
      "5 PM",
      "6 PM",
      "7 PM",
      "8 PM",
    ])

    vm.updateShowAllHours(true)
    await nextTick()

    expect(vm.showAllHours).toBe(true)
    timedGrid = getTimedGridPresentation(wrapper)
    expect(timedGrid.renderedRows.some((row) => row.kind === "collapsed")).toBe(false)
    const expandedTimeslotRows = timedGrid.renderedRows.filter((row) => row.kind === "timeslot")
    expect(expandedTimeslotRows).toHaveLength(timedGrid.splitTimes.flat().length)
    expect(expandedTimeslotRows).toHaveLength(initialTimeslotRows.length)
  })

  it("animates loaded availability when editing an existing respondent", async () => {
    vi.useFakeTimers()

    try {
      localStorage.setItem("evt-1.guestName", "Mag")

      const wrapper = mountScheduleOverlap({
        props: {
          event: {
            ...buildScheduleOverlapProps().event,
            dates: [
              Temporal.PlainDate.from("2026-01-01"),
              Temporal.PlainDate.from("2026-01-02"),
            ],
            timeSeed: zdt("2026-01-01T09:00:00Z"),
            startTime: Temporal.PlainTime.from("09:00"),
            duration: Temporal.Duration.from({ hours: 4 }),
            timeIncrement: Temporal.Duration.from({ hours: 1 }),
            responses: {
              Mag: {
                name: "Mag",
                user: {
                  _id: "Mag",
                  firstName: "Mag",
                  lastName: "",
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
        fetchedResponses: Record<string, { availability?: Temporal.ZonedDateTime[]; ifNeeded?: Temporal.ZonedDateTime[] }>
        editGuestAvailability: (id: string) => void
        availabilityAnimEnabled: boolean
        availability: { size: number }
      }

      vm.fetchedResponses = {
        Mag: {
          availability: [
            zdt("2026-01-01T09:00:00Z"),
            zdt("2026-01-01T10:00:00Z"),
          ],
          ifNeeded: [],
        },
      }

      vm.editGuestAvailability("Mag")
      await nextTick()

      expect(vm.availabilityAnimEnabled).toBe(false)
      expect(vm.availability.size).toBe(2)
      expect(showInfoMock).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it("keeps rows visible when any page day allows them, even if the same edge hours are grey on other days", () => {
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
          duration: Temporal.Duration.from({ hours: 14 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            ...buildUtcSpecificTimes("2026-01-01", [
              "13:00:00",
              "14:00:00",
              "15:00:00",
              "16:00:00",
              "17:00:00",
              "18:00:00",
              "19:00:00",
            ]),
            ...buildUtcSpecificTimes("2026-01-02", [
              "11:00:00",
              "12:00:00",
              "13:00:00",
              "14:00:00",
              "15:00:00",
              "16:00:00",
              "17:00:00",
              "18:00:00",
              "19:00:00",
              "20:00:00",
              "21:00:00",
              "22:00:00",
            ]),
          ],
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    expect(
      getTimedGridPresentation(wrapper).renderedRows.some((row) => row.kind === "collapsed")
    ).toBe(false)
  })

  it("collapses enabled but inactive interior specific-time hours", () => {
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
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      state: (typeof states)[keyof typeof states]
    }

    expect(vm.state).toBe(states.HEATMAP)
    expect(getTimedGridPresentation(wrapper).renderedRows.filter((row) => row.kind === "collapsed")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          startLabel: "10 AM",
          endLabel: "4 PM",
        }),
      ])
    )
  })

  it("keeps inactive specific-time hours collapsed while scheduling", async () => {
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
            ...buildUtcSpecificTimes("2026-01-01", ["09:00:00", "16:00:00"]),
            ...buildUtcSpecificTimes("2026-01-02", ["09:00:00", "16:00:00"]),
          ],
          times: [
            ...buildUtcSpecificTimes("2026-01-01", ["09:00:00", "16:00:00"]),
            ...buildUtcSpecificTimes("2026-01-02", ["09:00:00", "16:00:00"]),
          ],
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    const vm = wrapper.vm as unknown as {
      state: (typeof states)[keyof typeof states]
      scheduleEvent: () => void
    }

    vm.scheduleEvent()
    await nextTick()

    expect(vm.state).toBe(states.SCHEDULE_EVENT)
    expect(getTimedGridPresentation(wrapper).renderedRows.filter((row) => row.kind === "collapsed")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ startLabel: "10 AM", endLabel: "4 PM" }),
      ])
    )
  })

  it("collapses the omitted day boundaries around a saved specific-times window", () => {
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
          duration: Temporal.Duration.from({ hours: 13 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            ...buildUtcSpecificTimes("2026-01-01", [
              "14:00:00",
              "15:00:00",
              "16:00:00",
              "17:00:00",
            ]),
            ...buildUtcSpecificTimes("2026-01-02", [
              "14:00:00",
              "15:00:00",
              "16:00:00",
              "17:00:00",
            ]),
          ],
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    const timedGrid = getTimedGridPresentation(wrapper)
    expect(timedGrid.renderedRows.some((row) => row.kind === "collapsed")).toBe(false)
    const timeslotRows = timedGrid.renderedRows.filter((row) => row.kind === "timeslot")
    expect(timeslotRows[0]?.timeText).toBe("2 PM")
    expect(timeslotRows.at(-1)?.timeText).toBe("5 PM")
  })

  it("does not add full-day filler rows around a saved specific-times window", () => {
    localStorage.setItem("showAllHours", "true")
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [Temporal.PlainDate.from("2026-01-01")],
          timeSeed: zdt("2026-01-01T14:00:00Z"),
          hasSpecificTimes: true,
          startTime: Temporal.PlainTime.from("14:00"),
          duration: Temporal.Duration.from({ hours: 4 }),
          timeIncrement: Temporal.Duration.from({ minutes: 30 }),
          times: buildUtcSpecificTimes("2026-01-01", [
            "14:00:00",
            "14:30:00",
            "15:00:00",
            "15:30:00",
            "16:00:00",
            "16:30:00",
            "17:00:00",
            "17:30:00",
          ]),
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    const timedGrid = getTimedGridPresentation(wrapper)
    const timeslotRows = timedGrid.renderedRows.filter((row) => row.kind === "timeslot")

    expect(timedGrid.renderedRows.some((row) => row.kind === "filler")).toBe(false)
    expect(timeslotRows[0]?.timeText).toBe("2 PM")
    expect(timeslotRows.at(-1)?.timeText).toBeUndefined()
  })

  it("keeps a row expanded when any visible day allows that exact specific-time slot", () => {
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
          duration: Temporal.Duration.from({ hours: 9 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          times: [
            ...buildUtcSpecificTimes("2026-01-01", [
              "09:00:00",
              "10:00:00",
              "16:00:00",
              "17:00:00",
            ]),
            ...buildUtcSpecificTimes("2026-01-02", [
              "09:00:00",
              "10:00:00",
              "13:00:00",
              "16:00:00",
              "17:00:00",
            ]),
          ],
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    expect(
      getTimedGridPresentation(wrapper).renderedRows.some((row) => row.kind === "collapsed")
    ).toBe(false)
  })

  it("collapses only whole interior hours for schedule-grey runs with partial-hour boundaries", () => {
    localStorage.setItem("showAllHours", "false")
    const wrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          dates: [
            Temporal.PlainDate.from("2026-01-01"),
            Temporal.PlainDate.from("2026-01-02"),
          ],
          timeSeed: zdt("2026-01-01T08:15:00Z"),
          hasSpecificTimes: true,
          startTime: Temporal.PlainTime.from("08:15"),
          duration: Temporal.Duration.from({ hours: 12 }),
          times: [
            zdt("2026-01-01T08:15:00Z"),
            zdt("2026-01-01T10:15:00Z"),
            zdt("2026-01-02T18:45:00Z"),
            zdt("2026-01-02T20:15:00Z"),
          ],
        },
        alwaysShowCalendarEvents: false,
        sampleCalendarEventsByDay: [],
        initialTimezone: utcTimezone,
      },
    })

    const timedGrid = getTimedGridPresentation(wrapper)
    const collapsedRows = timedGrid.renderedRows.filter((row) => row.kind === "collapsed")

    expect(collapsedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          startLabel: "11 AM",
          endLabel: "6 PM",
        }),
      ])
    )
    expect(timedGrid.renderedRows.some((row) => row.kind === "timeslot")).toBe(true)
  })
})
