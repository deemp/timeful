// @vitest-environment happy-dom

import { beforeEach, describe, expect, it } from "vitest"
import { nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { Temporal } from "temporal-polyfill"
import { putMock, resetScheduleOverlapMocks } from "./scheduleOverlapTestMocks"
import {
  buildCanonicalSpecificTimesEvent,
  buildScheduleOverlapProps,
  getTimedGridPresentation,
  installScheduleOverlapTestGlobals,
  mountScheduleOverlap,
  scheduleOverlapGlobalStubs,
  stubResizeObserver,
  stubScrollTo,
  utcTimezone,
} from "./scheduleOverlapTestUtils"
import { useCalendarGrid } from "@/composables/schedule_overlap/useCalendarGrid"
import {
  states,
  type ScheduleOverlapEvent,
} from "@/composables/schedule_overlap/types"
import ScheduleOverlap from "./ScheduleOverlap.vue"

describe("ScheduleOverlap specific times", () => {
  beforeEach(() => {
    resetScheduleOverlapMocks()
    installScheduleOverlapTestGlobals()
  })

  it("renders overnight split calendar events without comparing Temporal.Duration via valueOf", () => {
    expect(() => mountScheduleOverlap()).not.toThrow()
  })

  it("maps a rendered specific-times drag to the exact UTC quarter-hour instants", async () => {
    stubResizeObserver()
    stubScrollTo()

    const wrapper = mount(ScheduleOverlap, {
      props: {
        ...buildScheduleOverlapProps(),
        fromEditEvent: true,
        initialTimezone: utcTimezone,
        event: buildCanonicalSpecificTimesEvent({
          name: "Specific times drag mapping",
          dates: ["2026-05-29", "2026-05-30"],
        }),
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ScheduleOverlapSidebar: true,
          ScheduleOverlapMobileOverlay: true,
        },
      },
    })

    await nextTick()
    await nextTick()

    const startCell = wrapper.get('[data-row="0"][data-col="0"]')
    const endCell = wrapper.get('[data-row="15"][data-col="1"]')

    await startCell.trigger("mousedown", { clientX: 5, clientY: 5 })
    await endCell.trigger("mousemove", { clientX: 10, clientY: 10 })
    await endCell.trigger("mouseup", { clientX: 10, clientY: 10 })

    const vm = wrapper.vm as unknown as {
      tempTimes: Set<Temporal.ZonedDateTime>
    }

    expect(
      [...vm.tempTimes]
        .sort((a, b) => Temporal.ZonedDateTime.compare(a, b))
        .map((time) => time.toString())
    ).toEqual(
      ["2026-05-29", "2026-05-30"].flatMap((date) =>
        [
          "00:00:00",
          "00:15:00",
          "00:30:00",
          "00:45:00",
          "01:00:00",
          "01:15:00",
          "01:30:00",
          "01:45:00",
          "02:00:00",
          "02:15:00",
          "02:30:00",
          "02:45:00",
          "03:00:00",
          "03:15:00",
          "03:30:00",
          "03:45:00",
        ].map((time) => `${date}T${time}+00:00[UTC]`)
      )
    )
  })

  it("renders the saved specific-times window immediately after saving a new event selection", async () => {
    stubResizeObserver()
    stubScrollTo()
    localStorage.setItem("showAllHours", "false")

    const wrapper = mount(ScheduleOverlap, {
      props: {
        ...buildScheduleOverlapProps(),
        fromEditEvent: true,
        initialTimezone: utcTimezone,
        event: buildCanonicalSpecificTimesEvent({
          name: "Immediate saved specific times",
          dates: ["2026-05-29", "2026-05-30"],
        }),
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ScheduleOverlapSidebar: true,
          ScheduleOverlapMobileOverlay: true,
        },
      },
    })

    await nextTick()
    await nextTick()

    const startCell = wrapper.get('[data-row="0"][data-col="0"]')
    const endCell = wrapper.get('[data-row="15"][data-col="1"]')

    await startCell.trigger("mousedown", { clientX: 5, clientY: 5 })
    await endCell.trigger("mousemove", { clientX: 10, clientY: 10 })
    await endCell.trigger("mouseup", { clientX: 10, clientY: 10 })

    const vm = wrapper.vm as unknown as {
      saveTempTimes: () => void
      eventRef: { times?: Temporal.ZonedDateTime[]; startTime?: Temporal.PlainTime; endTime?: Temporal.PlainTime }
    }

    vm.saveTempTimes()
    await Promise.resolve()
    await nextTick()
    await nextTick()

    expect(putMock).toHaveBeenCalledTimes(1)
    expect(putMock.mock.calls[0]?.[1]).toMatchObject({
      activeSlots: [
        "2026-05-29T00:00:00Z",
        "2026-05-29T00:15:00Z",
        "2026-05-29T00:30:00Z",
        "2026-05-29T00:45:00Z",
        "2026-05-29T01:00:00Z",
        "2026-05-29T01:15:00Z",
        "2026-05-29T01:30:00Z",
        "2026-05-29T01:45:00Z",
        "2026-05-29T02:00:00Z",
        "2026-05-29T02:15:00Z",
        "2026-05-29T02:30:00Z",
        "2026-05-29T02:45:00Z",
        "2026-05-29T03:00:00Z",
        "2026-05-29T03:15:00Z",
        "2026-05-29T03:30:00Z",
        "2026-05-29T03:45:00Z",
        "2026-05-30T00:00:00Z",
        "2026-05-30T00:15:00Z",
        "2026-05-30T00:30:00Z",
        "2026-05-30T00:45:00Z",
        "2026-05-30T01:00:00Z",
        "2026-05-30T01:15:00Z",
        "2026-05-30T01:30:00Z",
        "2026-05-30T01:45:00Z",
        "2026-05-30T02:00:00Z",
        "2026-05-30T02:15:00Z",
        "2026-05-30T02:30:00Z",
        "2026-05-30T02:45:00Z",
        "2026-05-30T03:00:00Z",
        "2026-05-30T03:15:00Z",
        "2026-05-30T03:30:00Z",
        "2026-05-30T03:45:00Z",
      ],
    })
    expect(vm.eventRef.times?.map((time) => time.toString())).toEqual(
      ["2026-05-29", "2026-05-30"].flatMap((date) =>
        [
          "00:00:00",
          "00:15:00",
          "00:30:00",
          "00:45:00",
          "01:00:00",
          "01:15:00",
          "01:30:00",
          "01:45:00",
          "02:00:00",
          "02:15:00",
          "02:30:00",
          "02:45:00",
          "03:00:00",
          "03:15:00",
          "03:30:00",
          "03:45:00",
        ].map((time) => `${date}T${time}+00:00[UTC]`)
      )
    )
    expect(vm.eventRef.startTime?.toString()).toBe("00:00:00")
    expect(vm.eventRef.endTime?.toString()).toBe("04:00:00")
    const timedGrid = getTimedGridPresentation(wrapper)
    expect(
      timedGrid.days.map((day) => day.dateObject.withTimeZone("UTC").toPlainDate().toString())
    ).toEqual(["2026-05-29", "2026-05-30"])
    const renderedHourLabels = timedGrid.splitTimes[0].map((time) => time.text).filter(Boolean)
    expect(renderedHourLabels).toHaveLength(24)
    expect(renderedHourLabels[0]).toBe("12 AM")
    expect(renderedHourLabels.at(-1)).toBe("11 PM")
    expect(timedGrid.splitTimes[0].map((time) => time.displayedMinutes)).toEqual(
      Array.from({ length: 96 }, (_, index) => index * 15)
    )
    expect(
      timedGrid.renderedRows.filter((row) => row.kind === "collapsed")
    ).toEqual([
      expect.objectContaining({ startLabel: "4 AM", endLabel: "12 AM" }),
    ])
  })

  it("keeps unselected membership dates editable after saving specific times on only one day", async () => {
    stubResizeObserver()
    stubScrollTo()

    const wrapper = mount(ScheduleOverlap, {
      props: {
        ...buildScheduleOverlapProps(),
        fromEditEvent: true,
        initialTimezone: utcTimezone,
        event: buildCanonicalSpecificTimesEvent({
          name: "Specific times preserve membership",
          dates: ["2026-05-28", "2026-05-29"],
        }),
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ScheduleOverlapSidebar: true,
          ScheduleOverlapMobileOverlay: true,
        },
      },
    })

    await nextTick()
    await nextTick()

    const startCell = wrapper.get('[data-row="0"][data-col="1"]')
    const endCell = wrapper.get('[data-row="3"][data-col="1"]')

    await startCell.trigger("mousedown", { clientX: 5, clientY: 5 })
    await endCell.trigger("mousemove", { clientX: 10, clientY: 10 })
    await endCell.trigger("mouseup", { clientX: 10, clientY: 10 })

    const vm = wrapper.vm as unknown as {
      saveTempTimes: () => void
      eventRef: ScheduleOverlapEvent
    }

    vm.saveTempTimes()
    await Promise.resolve()
    await nextTick()
    await nextTick()

    expect(putMock).toHaveBeenCalledTimes(1)
    expect(putMock.mock.calls[0]?.[1]).toMatchObject({
      activeSlots: [
        "2026-05-29T00:00:00Z",
        "2026-05-29T00:15:00Z",
        "2026-05-29T00:30:00Z",
        "2026-05-29T00:45:00Z",
      ],
    })
    expect(vm.eventRef.dates?.map((date) => date.toString())).toEqual([
      "2026-05-28",
      "2026-05-29",
    ])

    const reopenedEvent = ref(vm.eventRef)
    const reopenedGrid = useCalendarGrid({
      event: reopenedEvent,
      weekOffset: ref(0),
      curTimezone: ref(utcTimezone),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    expect(
      reopenedGrid.days.value.map((day) =>
        day.dateObject.withTimeZone("UTC").toPlainDate().toString()
      )
    ).toEqual(["2026-05-28", "2026-05-29"])
  })

  it("uses the saved timezone when initialTimezone is missing", () => {
    localStorage.setItem("shownInTimezone_evt-1", JSON.stringify({ value: "America/Los_Angeles" }))

    const wrapper = mountScheduleOverlap({
      global: {
        stubs: {
          ScheduleOverlapSidebar: {
            name: "ScheduleOverlapSidebar",
            props: {
              sidebar: {
                type: Object,
                required: true,
              },
            },
            template: "<div />",
          },
        },
      },
    })

    const sidebarViewModel = wrapper.findComponent({ name: "ScheduleOverlapSidebar" })
      .props("sidebar") as {
      curTimezone: {
        value: string
        label: string
        gmtString: string
        offset: { total: (unit: string) => number }
      }
    }

    expect(sidebarViewModel.curTimezone.value).toBe("America/Los_Angeles")
    expect(sidebarViewModel.curTimezone.label).toBe("Pacific Time")
    expect(sidebarViewModel.curTimezone.gmtString).toBe("(GMT-8:00)")
    expect(sidebarViewModel.curTimezone.offset.total("minutes")).toBe(-480)
  })
})
