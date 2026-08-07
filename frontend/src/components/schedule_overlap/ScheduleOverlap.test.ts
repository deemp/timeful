// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from "vitest"
import { nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { Temporal } from "temporal-polyfill"
import type * as UtilsModule from "@/utils"
import {
  buildScheduleOverlapProps,
  installScheduleOverlapTestGlobals,
  mountScheduleOverlap,
  type ScheduleOverlapWrapper,
  scheduleOverlapGlobalStubs,
} from "./scheduleOverlapTestUtils"
import { useCalendarGrid } from "@/composables/schedule_overlap/useCalendarGrid"
import {
  MIN_COLLAPSIBLE_HIDDEN_SPAN_HOURS,
  states,
  type ScheduleOverlapEvent,
} from "@/composables/schedule_overlap/types"
import type { formatTooltipContent } from "./scheduleOverlapRendering"
import { ZdtMap } from "@/utils"
import ScheduleOverlap from "./ScheduleOverlap.vue"
import Tooltip from "../Tooltip.vue"
import scheduleOverlapSource from "./ScheduleOverlap.vue?raw"
import scheduleOverlapSidebarSource from "./ScheduleOverlapSidebar.vue?raw"
import scheduleOverlapTimeGridSource from "./ScheduleOverlapTimeGrid.vue?raw"
import scheduleOverlapDaysOnlyGridSource from "./ScheduleOverlapDaysOnlyGrid.vue?raw"
import { SCHEDULE_OVERLAP_COMPACT_DESKTOP_BREAKPOINT } from "./scheduleOverlapBreakpoints"

const viewportWidth = { value: 1024 }
const zdt = (iso: string) => Temporal.Instant.from(iso).toZonedDateTimeISO("UTC")
const { putMock, refreshAuthUserMock, showInfoMock, showErrorMock } = vi.hoisted(() => ({
  putMock: vi.fn(),
  refreshAuthUserMock: vi.fn(),
  showInfoMock: vi.fn(),
  showErrorMock: vi.fn(),
}))
const utcTimezone = {
  value: "UTC",
  offset: Temporal.Duration.from({ hours: 0 }),
  label: "UTC",
  gmtString: "GMT+0",
}
const buildUtcSpecificTimes = (date: string, times: string[]) =>
  times.map((time) => zdt(`${date}T${time}Z`))
const buildUtcQuarterHourSlots = (date: string) =>
  Array.from({ length: 96 }, (_, index) =>
    Temporal.PlainDate.from(date)
      .toZonedDateTime({
        timeZone: "UTC",
        plainTime: "00:00:00",
      })
      .add({ minutes: index * 15 })
  )
const buildCanonicalSpecificTimesEvent = ({
  name,
  dates,
}: {
  name: string
  dates: string[]
}): ScheduleOverlapEvent => ({
  ...buildScheduleOverlapProps().event,
  name,
  dates: dates.map((date) => Temporal.PlainDate.from(date)),
  timeSeed: zdt(`${dates[0]}T00:00:00Z`),
  startTime: Temporal.PlainTime.from("00:00"),
  duration: Temporal.Duration.from({ hours: 24 }),
  hasSpecificTimes: true,
  timeIncrement: Temporal.Duration.from({ minutes: 15 }),
  times: [],
  enabledSlots: dates.flatMap((date) => buildUtcQuarterHourSlots(date)),
  eventTimezone: "UTC",
  slotGeneration: {
    startTimeLocal: Temporal.PlainTime.from("00:00"),
    endTimeLocal: Temporal.PlainTime.from("00:00"),
    timeIncrement: Temporal.Duration.from({ minutes: 15 }),
  },
  timedRecurrence: {
    kind: "specific_dates",
    selectedDays: dates.map((date) => Temporal.PlainDate.from(date)),
    selectedDaysOfWeek: [],
    startOnMonday: false,
  },
})

interface TimedGridPresentationForTest {
  days: { dateObject: Temporal.ZonedDateTime; isConsecutive?: boolean }[]
  renderedRows: {
    id: string
    kind: "timeslot" | "collapsed" | "filler" | "split-gap"
    startLabel?: string
    endLabel?: string
    timeText?: string
    height: number
  }[]
  splitTimes: {
    absoluteMinutes?: number
    displayedMinutes?: number
    text?: string
  }[][]
  timeAxisEndText?: string
}

const getTimedGridPresentation = (wrapper: ScheduleOverlapWrapper) =>
  wrapper.findComponent({ name: "ScheduleOverlapTimeGrid" }).props("timedGrid") as
    TimedGridPresentationForTest

vi.mock("vuetify", () => ({
  useDisplay: () => ({
    width: viewportWidth,
  }),
}))

vi.mock("@/utils", async () => {
  const actual = await vi.importActual<typeof UtilsModule>("@/utils")
  return {
    ...actual,
    put: putMock,
  }
})

vi.mock("@/stores/main", () => ({
  useMainStore: () => ({
    authUser: null,
    refreshAuthUser: refreshAuthUserMock,
    showInfo: showInfoMock,
    showError: showErrorMock,
  }),
}))

vi.mock("@/plugins/posthog", () => ({
  posthog: {
    capture: vi.fn(),
  },
}))

describe("ScheduleOverlap", () => {
  it("switches the sidebar layout to the standard sm breakpoint", () => {
    expect(scheduleOverlapSource).toContain(
      'class="schedule-overlap-layout tw-flex"'
    )
    expect(scheduleOverlapSource).toContain(
      `:class="isPhone ? 'tw-flex-col' : 'tw-flex-row'"`
    )
    expect(scheduleOverlapSidebarSource).toContain(
      "sidebar.isPhone"
    )
  })

  it("keeps the stacked-to-side-by-side breakpoint at sm while forcing the compact desktop grid pane to fill the row", () => {
    expect(scheduleOverlapSource).toContain(
      "SCHEDULE_OVERLAP_COMPACT_DESKTOP_BREAKPOINT"
    )
    expect(scheduleOverlapSource).toContain(
      'class="schedule-overlap-layout__grid-pane tw-flex tw-grow tw-pl-4"'
    )
    expect(scheduleOverlapSource).toContain(
      "@media (min-width: 640px) and (max-width: 767px)"
    )
    expect(scheduleOverlapSource).toContain("flex: 1 1 0%;")
  })

  it("keeps the compact-desktop breakpoint constant at 640", () => {
    expect(SCHEDULE_OVERLAP_COMPACT_DESKTOP_BREAKPOINT).toBe(640)
  })

  it("collapses runs of three or more inactive hours", () => {
    expect(MIN_COLLAPSIBLE_HIDDEN_SPAN_HOURS).toBe(3)
  })

  it("stretches timed and days-only grid columns across the compact desktop width helper", () => {
    expect(scheduleOverlapTimeGridSource).toContain(
      'class="schedule-overlap-time-grid__content tw-grow tw-min-w-0"'
    )
    expect(scheduleOverlapTimeGridSource).toContain(
      "schedule-overlap-time-grid__day-column"
    )
    expect(scheduleOverlapTimeGridSource).toContain(
      "@media (min-width: 640px) and (max-width: 767px)"
    )
    expect(scheduleOverlapTimeGridSource).toContain("width: 100%;")
    expect(scheduleOverlapTimeGridSource).toContain("flex: 1 1 0%;")
    expect(scheduleOverlapDaysOnlyGridSource).toContain(
      'class="schedule-overlap-days-only-grid tw-grow"'
    )
    expect(scheduleOverlapDaysOnlyGridSource).toContain(
      'class="schedule-overlap-days-only-grid__month tw-grid tw-grid-cols-7"'
    )
    expect(scheduleOverlapDaysOnlyGridSource).toContain(
      "@media (min-width: 640px) and (max-width: 767px)"
    )
    expect(scheduleOverlapDaysOnlyGridSource).toContain("width: 100%;")
  })

  beforeEach(() => {
    viewportWidth.value = 1024
    putMock.mockReset()
    putMock.mockResolvedValue(undefined)
    refreshAuthUserMock.mockReset()
    showInfoMock.mockReset()
    showErrorMock.mockReset()
    installScheduleOverlapTestGlobals()
  })

  it("renders overnight split calendar events without comparing Temporal.Duration via valueOf", () => {
    expect(() => mountScheduleOverlap()).not.toThrow()
  })

  it("maps a rendered specific-times drag to the exact UTC quarter-hour instants", async () => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {
          return undefined
        }

        disconnect() {
          return undefined
        }
      }
    )
    vi.stubGlobal("scrollTo", vi.fn())

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
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {
          return undefined
        }

        disconnect() {
          return undefined
        }
      }
    )
    vi.stubGlobal("scrollTo", vi.fn())
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
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {
          return undefined
        }

        disconnect() {
          return undefined
        }
      }
    )
    vi.stubGlobal("scrollTo", vi.fn())

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

  it("renders the extracted timed grid child for timed events", () => {
    const wrapper = mountScheduleOverlap()

    expect(wrapper.findComponent({ name: "ScheduleOverlapTimeGrid" }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: "ScheduleOverlapDaysOnlyGrid" }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: "ScheduleOverlapSidebar" }).exists()).toBe(true)
  })

  it("uses the legacy strong heatmap tint in the normal post-submit grid for disjoint guest responses", async () => {
    localStorage.setItem("showBestTimes", "false")
    localStorage.setItem(
      "evt-1.guestOwnershipCollection",
      JSON.stringify({
        version: 1,
        selectedLookupKey: "guest-2-token",
        records: [
          {
            lookupKey: "guest-1-token",
            name: "guest-1",
            guestId: "guest-1-token",
            guestEditToken: "token-1",
            guestEditPolicy: "protected",
            guestOwnershipMode: "token",
            lastUsedAt: 2,
          },
          {
            lookupKey: "guest-2-token",
            name: "guest-2",
            guestId: "guest-2-token",
            guestEditToken: "token-2",
            guestEditPolicy: "protected",
            guestOwnershipMode: "token",
            lastUsedAt: 1,
          },
        ],
      })
    )

    const wrapper = mountScheduleOverlap({
      props: {
        curGuestId: "guest-2",
        initialTimezone: utcTimezone,
        event: {
          ...buildScheduleOverlapProps().event,
          name: "Two guest responses",
          dates: [Temporal.PlainDate.from("2026-01-01")],
          timeSeed: zdt("2026-01-01T09:00:00Z"),
          startTime: Temporal.PlainTime.from("09:00"),
          duration: Temporal.Duration.from({ hours: 2 }),
          timeIncrement: Temporal.Duration.from({ hours: 1 }),
          responses: {
            "guest-1": {
              name: "guest-1",
              guest: true,
              guestId: "guest-1-token",
              guestEditPolicy: "protected",
              guestOwnershipMode: "token",
              user: {
                _id: "guest-1",
                firstName: "guest-1",
                lastName: "",
                email: "",
              },
              availability: [zdt("2026-01-01T09:00:00Z")],
              ifNeeded: [],
              manualAvailability: {},
            },
            "guest-2": {
              name: "guest-2",
              guest: true,
              guestId: "guest-2-token",
              guestEditPolicy: "protected",
              guestOwnershipMode: "token",
              user: {
                _id: "guest-2",
                firstName: "guest-2",
                lastName: "",
                email: "",
              },
              availability: [zdt("2026-01-01T10:00:00Z")],
              ifNeeded: [],
              manualAvailability: {},
            },
          },
        },
      },
      global: {
        stubs: {
          ScheduleOverlapTimeGrid: {
            name: "ScheduleOverlapTimeGrid",
            props: {
              timedGrid: {
                type: Object,
                required: true,
              },
            },
            template: "<div />",
          },
        },
      },
    })
    const vm = wrapper.vm as unknown as {
      responsesFormatted: ZdtMap<Set<string>>
    }
    vm.responsesFormatted = new ZdtMap([
      [zdt("2026-01-01T09:00:00Z"), new Set(["guest-1"])],
      [zdt("2026-01-01T10:00:00Z"), new Set(["guest-2"])],
    ])
    await nextTick()
    await nextTick()

    const timedGrid = wrapper.findComponent({ name: "ScheduleOverlapTimeGrid" }).props(
      "timedGrid"
    ) as {
      overlayAvailability: boolean
      timeslotClassStyle: { style: Record<string, string> }[]
      toolRow: { showBestTimes: boolean }
    }
    const renderedColors = timedGrid.timeslotClassStyle
      .map((classStyle) => classStyle.style.backgroundColor)
      .filter((backgroundColor): backgroundColor is string =>
        typeof backgroundColor === "string"
      )

    expect(timedGrid.toolRow.showBestTimes).toBe(false)
    expect(timedGrid.overlayAvailability).toBe(false)
    expect(renderedColors).toContain("#00994CE1")
    expect(renderedColors).not.toContain("#00994C70")
  })

  it("passes cohesive sidebar and mobile overlay view models to extracted children", () => {
    viewportWidth.value = 639

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
          ScheduleOverlapMobileOverlay: {
            name: "ScheduleOverlapMobileOverlay",
            props: {
              overlay: {
                type: Object,
                required: true,
              },
            },
            template: "<div />",
          },
        },
      },
      props: {
        calendarPermissionGranted: true,
      },
    })

    const sidebarViewModel = wrapper.findComponent({ name: "ScheduleOverlapSidebar" })
      .props("sidebar") as {
        event: { _id?: string }
        respondentsPanel: { eventId: string }
      }
    const overlayViewModel = wrapper.findComponent({
      name: "ScheduleOverlapMobileOverlay",
    }).props("overlay") as {
      event: { _id?: string }
      respondentsPanel: { eventId: string }
    }

    expect(sidebarViewModel.event._id).toBe("evt-1")
    expect(sidebarViewModel.respondentsPanel.eventId).toBe("evt-1")
    expect(overlayViewModel.event._id).toBe("evt-1")
    expect(overlayViewModel.respondentsPanel.eventId).toBe("evt-1")
  })

  it("keeps mobile-only boundaries active below 640px and removes them at 640px", async () => {
    viewportWidth.value = 639

    const buildWrapper = () =>
      mountScheduleOverlap({
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
              template: "<div class='sidebar-stub' />",
            },
            ScheduleOverlapMobileOverlay: {
              name: "ScheduleOverlapMobileOverlay",
              props: {
                overlay: {
                  type: Object,
                  required: true,
                },
              },
              template: "<div class='overlay-stub' />",
            },
            ToolRow: {
              name: "ToolRow",
              props: {
                toolRow: {
                  type: Object,
                  required: true,
                },
              },
              template: "<div class='tool-row-stub' />",
            },
          },
        },
      })

    const mobileWrapper = buildWrapper()
    await nextTick()

    const getSidebarViewModel = (wrapper: ScheduleOverlapWrapper) =>
      wrapper.findComponent({ name: "ScheduleOverlapSidebar" }).props("sidebar") as {
        isPhone: boolean
        rightSideWidth: string
      }

    expect(mobileWrapper.find(".tool-row-stub").exists()).toBe(true)
    expect(mobileWrapper.find(".overlay-stub").exists()).toBe(true)
    expect(mobileWrapper.find(".schedule-overlap-layout").classes()).toContain("tw-flex-col")
    expect(getSidebarViewModel(mobileWrapper).isPhone).toBe(true)
    expect(getSidebarViewModel(mobileWrapper).rightSideWidth).toBe("100%")

    mobileWrapper.unmount()
    viewportWidth.value = 640

    const desktopWrapper = buildWrapper()
    await nextTick()

    expect(desktopWrapper.find(".tool-row-stub").exists()).toBe(false)
    expect(desktopWrapper.find(".overlay-stub").exists()).toBe(false)
    expect(desktopWrapper.find(".schedule-overlap-layout").classes()).toContain("tw-flex-row")
    expect(getSidebarViewModel(desktopWrapper).isPhone).toBe(false)
    expect(getSidebarViewModel(desktopWrapper).rightSideWidth).toBe("clamp(10rem, 28vw, 13rem)")
  })

  it("keeps the explicit guest edit target in the respondents panel view model", () => {
    const wrapper = mountScheduleOverlap({
      props: {
        curGuestId: "guest-1",
      },
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
      respondentsPanel: { curGuestId: string }
    }

    expect(sidebarViewModel.respondentsPanel.curGuestId).toBe("guest-1")
  })

  it("passes cohesive timed and days-only grid view models to grid boundaries", () => {
    const timedWrapper = mountScheduleOverlap({
      global: {
        stubs: {
          ScheduleOverlapTimeGrid: {
            name: "ScheduleOverlapTimeGrid",
            props: {
              timedGrid: {
                type: Object,
                required: true,
              },
            },
            template: "<div />",
          },
        },
      },
    })

    const timedGrid = timedWrapper.findComponent({ name: "ScheduleOverlapTimeGrid" })
      .props("timedGrid") as {
      event: { _id?: string }
      actions: { nextPage: () => void; signUpForBlock: (block: { _id: string }) => void }
      toolRow: {
        numResponses: number
        actions: { updateWeekOffset: (value: number) => void }
      }
    }

    expect(timedGrid.event._id).toBe("evt-1")
    expect(typeof timedGrid.actions.nextPage).toBe("function")
    expect(typeof timedGrid.actions.signUpForBlock).toBe("function")
    expect(timedGrid.toolRow.numResponses).toBe(0)
    expect(typeof timedGrid.toolRow.actions.updateWeekOffset).toBe("function")

    const daysOnlyWrapper = mountScheduleOverlap({
      props: {
        event: {
          ...buildScheduleOverlapProps().event,
          daysOnly: true,
        },
      },
      global: {
        stubs: {
          ScheduleOverlapDaysOnlyGrid: {
            name: "ScheduleOverlapDaysOnlyGrid",
            props: {
              daysOnlyGrid: {
                type: Object,
                required: true,
              },
            },
            template: "<div />",
          },
        },
      },
    })

    const daysOnlyGrid = daysOnlyWrapper.findComponent({
      name: "ScheduleOverlapDaysOnlyGrid",
    }).props("daysOnlyGrid") as {
      event: { daysOnly?: boolean }
      actions: { prevPage: () => void; closeHint: () => void }
      toolRow: {
        numResponses: number
        actions: { updateShowBestTimes: (value: boolean) => void }
      }
    }

    expect(daysOnlyGrid.event.daysOnly).toBe(true)
    expect(typeof daysOnlyGrid.actions.prevPage).toBe("function")
    expect(typeof daysOnlyGrid.actions.closeHint).toBe("function")
    expect(daysOnlyGrid.toolRow.numResponses).toBe(0)
    expect(typeof daysOnlyGrid.toolRow.actions.updateShowBestTimes).toBe("function")
  })

  it("clears curGuestId when the selected guest is deleted from the respondents panel", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        curGuestId: "guest-1",
      },
      global: {
        stubs: {
          ScheduleOverlapSidebar: {
            name: "ScheduleOverlapSidebar",
            emits: ["guestAvailabilityDeleted"],
            template:
              "<button class=\"delete-selected-guest\" @click=\"$emit('guestAvailabilityDeleted', 'guest-1')\" />",
          },
        },
      },
    })

    await wrapper.get(".delete-selected-guest").trigger("click")

    expect(wrapper.emitted("setCurGuestId")).toEqual([[""]])
  })

  it("leaves curGuestId unchanged when a different guest is deleted", async () => {
    const wrapper = mountScheduleOverlap({
      props: {
        curGuestId: "guest-1",
      },
      global: {
        stubs: {
          ScheduleOverlapSidebar: {
            name: "ScheduleOverlapSidebar",
            emits: ["guestAvailabilityDeleted"],
            template:
              "<button class=\"delete-other-guest\" @click=\"$emit('guestAvailabilityDeleted', 'guest-2')\" />",
          },
        },
      },
    })

    await wrapper.get(".delete-other-guest").trigger("click")

    expect(wrapper.emitted("setCurGuestId")).toBeUndefined()
  })

  it("keeps curGuestId on the token guest id when renaming the selected guest", async () => {
    localStorage.setItem(
      "evt-1.guestOwnership",
      JSON.stringify({
        name: "guest-1",
        guestId: "guest-token-id",
        guestEditToken: "edit-token",
        guestEditPolicy: "protected",
        guestOwnershipMode: "token",
      })
    )
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          statusText: "OK",
          headers: new Headers(),
          text: () =>
            Promise.resolve(
              JSON.stringify({
                guestCredentials: {
                  guestId: "guest-token-id",
                  guestEditToken: "edit-token-2",
                  guestEditPolicy: "protected",
                  guestOwnershipMode: "token",
                },
              })
            ),
        })
      )
    )

    const wrapper = mountScheduleOverlap({
      props: {
        curGuestId: "guest-token-id",
        event: {
          ...buildScheduleOverlapProps().event,
          responses: {
            "guest-token-id": {
              name: "guest-1",
              guest: true,
              guestId: "guest-token-id",
              guestEditPolicy: "protected",
              guestOwnershipMode: "token",
              user: {
                _id: "guest-token-id",
                firstName: "guest-1",
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
      newGuestName: string
      saveGuestName: () => Promise<void>
      canEditGuestName: boolean
    }

    expect(vm.canEditGuestName).toBe(true)

    vm.newGuestName = "guest-2"
    await vm.saveGuestName()
    const selectedGuestKey = wrapper.emitted("setCurGuestId")?.[0]?.[0] as string

    expect(selectedGuestKey).toBe("guest-token-id")

    await wrapper.setProps({
      curGuestId: selectedGuestKey,
    })

    expect(vm.canEditGuestName).toBe(true)
  })

  it("updates curGuestId to the renamed guest name for legacy guests", async () => {
    localStorage.setItem(
      "evt-1.guestOwnership",
      JSON.stringify({
        name: "guest-1",
        guestOwnershipMode: "legacy",
      })
    )

    const wrapper = mountScheduleOverlap({
      props: {
        curGuestId: "guest-1",
        event: {
          ...buildScheduleOverlapProps().event,
          responses: {
            "guest-1": {
              name: "guest-1",
              guest: true,
              guestOwnershipMode: "legacy",
              user: {
                _id: "guest-1",
                firstName: "guest-1",
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
      newGuestName: string
      saveGuestName: () => Promise<void>
    }

    vm.newGuestName = "guest-2"
    await vm.saveGuestName()

    expect(wrapper.emitted("setCurGuestId")).toEqual([["guest-2"]])
  })

  it("keeps respondents in the sidebar view model for specific-date events", () => {
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
      respondentsPanel: {
        respondents: { _id?: string; firstName?: string }[]
      }
    }

    expect(sidebarViewModel.respondentsPanel.respondents).toEqual([
      expect.objectContaining({
        _id: "khh",
        firstName: "khh",
      }),
    ])
  })

  it("keeps grouped sidebar and mobile overlay listeners wired to local state and parent emits", async () => {
    viewportWidth.value = 639

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
            template: `
              <div>
                <button class="sidebar-name" @click="$emit('update:newGuestName', 'Renamed guest')" />
                <button class="sidebar-best-times" @click="$emit('update:showBestTimes', true)" />
                <button class="sidebar-add-availability" @click="$emit('addAvailability')" />
              </div>
            `,
          },
          ScheduleOverlapMobileOverlay: {
            name: "ScheduleOverlapMobileOverlay",
            props: {
              overlay: {
                type: Object,
                required: true,
              },
            },
            template: `
              <div>
                <button class="overlay-type" @click="$emit('update:availabilityType', 'ifNeeded')" />
                <button class="overlay-week-offset" @click="$emit('update:weekOffset', 2)" />
                <button class="overlay-add-guest" @click="$emit('addAvailabilityAsGuest')" />
              </div>
            `,
          },
        },
      },
    })

    await wrapper.get(".sidebar-name").trigger("click")
    await wrapper.get(".sidebar-best-times").trigger("click")
    await wrapper.get(".overlay-type").trigger("click")
    await nextTick()

    const sidebarViewModel = wrapper.findComponent({ name: "ScheduleOverlapSidebar" })
      .props("sidebar") as {
      newGuestName: string
      respondentsPanel: { showBestTimes: boolean }
    }
    const overlayViewModel = wrapper.findComponent({
      name: "ScheduleOverlapMobileOverlay",
    }).props("overlay") as {
      availabilityType: string
    }

    expect(sidebarViewModel.newGuestName).toBe("Renamed guest")
    expect(sidebarViewModel.respondentsPanel.showBestTimes).toBe(true)
    expect(overlayViewModel.availabilityType).toBe("ifNeeded")

    await wrapper.get(".sidebar-add-availability").trigger("click")
    await wrapper.get(".overlay-week-offset").trigger("click")
    await wrapper.get(".overlay-add-guest").trigger("click")

    expect(wrapper.emitted("addAvailability")).toEqual([[]])
    expect(wrapper.emitted("update:weekOffset")).toEqual([[2]])
    expect(wrapper.emitted("addAvailabilityAsGuest")).toEqual([[]])
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

  it("renders the mobile tooltip for the current hovered timeslot", async () => {
    viewportWidth.value = 375
    const wrapper = mountScheduleOverlap({
      global: {
        stubs: {
          Tooltip,
        },
      },
    })
    const vm = wrapper.vm as unknown as {
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
    }

    vm.getTimeslotVon(1, 0).mouseover()
    await wrapper.get(".tw-relative").trigger("mouseenter")
    await nextTick()

    expect(wrapper.find(".tw-fixed.tw-z-50").exists()).toBe(true)
  })

  it("shows the mobile tooltip after selecting a timeslot by click", async () => {
    viewportWidth.value = 375
    const cell = document.createElement("div")
    cell.className = "timeslot"
    cell.dataset.row = "1"
    cell.dataset.col = "0"
    cell.getBoundingClientRect = () =>
      ({ left: 40, top: 80, width: 120, height: 20 }) as DOMRect
    const dragSection = document.createElement("div")
    dragSection.id = "drag-section"
    dragSection.append(cell)
    document.body.append(dragSection)

    const wrapper = mountScheduleOverlap({
      global: {
        stubs: {
          Tooltip,
        },
      },
    })
    const vm = wrapper.vm as unknown as {
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
      selectedTooltipSlot: { row: number; col: number } | null
    }

    vm.getTimeslotVon(1, 0).click()
    await nextTick()

    expect(vm.selectedTooltipSlot).toEqual({ row: 1, col: 0 })
    expect(wrapper.find(".tw-fixed.tw-z-50").exists()).toBe(true)

    wrapper.unmount()
    dragSection.remove()
  })

  it("dismisses the mobile tooltip when clicking outside the grid", async () => {
    viewportWidth.value = 375
    const cell = document.createElement("div")
    cell.className = "timeslot"
    cell.dataset.row = "1"
    cell.dataset.col = "0"
    cell.getBoundingClientRect = () =>
      ({ left: 40, top: 80, width: 120, height: 20 }) as DOMRect
    const dragSection = document.createElement("div")
    dragSection.id = "drag-section"
    dragSection.append(cell)
    document.body.append(dragSection)

    const wrapper = mountScheduleOverlap({
      global: {
        stubs: {
          Tooltip,
        },
      },
    })
    const vm = wrapper.vm as unknown as {
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
      selectedTooltipSlot: { row: number; col: number } | null
    }

    vm.getTimeslotVon(1, 0).click()
    await nextTick()
    expect(wrapper.find(".tw-fixed.tw-z-50").exists()).toBe(true)

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }))
    await nextTick()

    expect(vm.selectedTooltipSlot).toBeNull()
    expect(wrapper.find(".tw-fixed.tw-z-50").exists()).toBe(false)

    wrapper.unmount()
    dragSection.remove()
  })

  it("clears the mobile selection and tooltip when clicking an inactive gap", async () => {
    viewportWidth.value = 375
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
      global: {
        stubs: {
          Tooltip,
        },
      },
    })
    const vm = wrapper.vm as unknown as {
      curTimeslot: { row: number; col: number }
      getTimeslotVon: (row: number, col: number) => Record<string, () => void>
    }

    vm.getTimeslotVon(0, 0).click()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: 0, col: 0 })
    expect(wrapper.find(".tw-fixed.tw-z-50").exists()).toBe(true)

    vm.getTimeslotVon(1, 0).click()
    await nextTick()

    expect(vm.curTimeslot).toEqual({ row: -1, col: -1 })
    expect(wrapper.find(".tw-fixed.tw-z-50").exists()).toBe(false)

    wrapper.unmount()
  })

})
