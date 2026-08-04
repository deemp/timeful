// @vitest-environment happy-dom

import { mount } from "@vue/test-utils"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Temporal } from "temporal-polyfill"
import { eventTypes } from "@/constants"
import { states } from "@/composables/schedule_overlap/types"
import ScheduleOverlapDaysOnlyGrid from "./ScheduleOverlapDaysOnlyGrid.vue"
import ScheduleOverlapTimeGrid from "./ScheduleOverlapTimeGrid.vue"
import type {
  ScheduleOverlapDaysOnlyGridViewModel,
  ScheduleOverlapTimeGridViewModel,
} from "./scheduleOverlapViewModelContracts"

const baseEvent = {
  _id: "evt-1",
  ownerId: "owner-1",
  name: "Grid drag test",
  type: eventTypes.SPECIFIC_DATES,
  dates: [Temporal.PlainDate.from("2026-01-01")],
  timeSeed: Temporal.Instant.from("2026-01-01T09:00:00Z").toZonedDateTimeISO("UTC"),
  daysOnly: false,
  hasSpecificTimes: false,
}

const buttonStub = {
  inheritAttrs: false,
  template: "<button v-bind=\"$attrs\"><slot /></button>",
}

const iconStub = {
  template: "<span><slot /></span>",
}

function createTimeGridViewModel() {
  const actions = {
    prevPage: vi.fn(),
    nextPage: vi.fn(),
    calendarScroll: vi.fn(),
    startDrag: vi.fn(),
    moveDrag: vi.fn(),
    endDrag: vi.fn(),
    resetCurTimeslot: vi.fn(),
    closeHint: vi.fn(),
    signUpForBlock: vi.fn(),
    toggleCollapsedSpan: vi.fn(),
  }

  const timedGrid: ScheduleOverlapTimeGridViewModel = {
    event: baseEvent,
    actions,
    calendarOnly: false,
    hasPrevPage: false,
    hasNextPage: false,
    splitTimes: [[{ hoursOffset: Temporal.Duration.from({ hours: 9 }), text: "9am", id: "time-9" }], []],
    times: [{ hoursOffset: Temporal.Duration.from({ hours: 9 }), text: "9am", id: "time-9" }],
    renderedRows: [],
    timeslotHeight: 60,
    days: [{
      dayText: "thu",
      dateString: "jan 1",
      dateObject: Temporal.Instant.from("2026-01-01T09:00:00Z").toZonedDateTimeISO("UTC"),
    }],
    isSpecificDates: true,
    isGroup: false,
    sampleCalendarEventsByDay: null,
    showLoader: false,
    loadingCalendarEvents: false,
    editing: false,
    alwaysShowCalendarEvents: false,
    showCalendarEvents: false,
    calendarEventsByDay: [[]],
    state: states.SCHEDULE_EVENT,
    states,
    page: 0,
    maxDaysPerPage: 1,
    dragStart: null,
    curScheduledEvent: null,
    scheduledEventStyle: {},
    scheduledEventStyles: [],
    signUpBlockBeingDraggedStyle: {},
    newSignUpBlockName: "Slot #1",
    isSignUp: false,
    signUpBlocksByDay: [[]],
    signUpBlocksToAddByDay: [[]],
    overlayAvailability: false,
    overlaidAvailability: [[]],
    timeslotClassStyle: [{ class: "", style: {} }],
    timeslotVon: [{}],
    allowDrag: true,
    noEventNames: false,
    hintTextShown: false,
    hintText: "",
    isPhone: false,
    max: 0,
    respondentsLength: 0,
    fetchedResponses: {},
    loadingResponsesLoading: false,
    toolRow: {
      event: baseEvent,
      state: states.SCHEDULE_EVENT,
      states,
      actions: {
        updateCurTimezone: vi.fn(),
        resetCurTimezone: vi.fn(),
        updateTimeType: vi.fn(),
        updateMobileNumDays: vi.fn(),
        updateShowBestTimes: vi.fn(),
        updateHideIfNeeded: vi.fn(),
        updateShowAllHours: vi.fn(),
        updateStartCalendarOnMonday: vi.fn(),
        updateWeekOffset: vi.fn(),
        scheduleEvent: vi.fn(),
        cancelScheduleEvent: vi.fn(),
        confirmScheduleEvent: vi.fn(),
      },
      curTimezone: {
        value: "UTC",
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      },
      timezoneModified: false,
      startCalendarOnMonday: false,
      showBestTimes: false,
      hideIfNeeded: false,
      showAllHours: false,
      isWeekly: false,
      calendarPermissionGranted: false,
      weekOffset: 0,
      timezoneReferenceDate: Temporal.Instant.from("2026-01-01T09:00:00Z").toZonedDateTimeISO("UTC"),
      numResponses: 0,
      mobileNumDays: 1,
      allowScheduleEvent: true,
      timeType: "12h",
    },
    getRenderedTimeBlockStyles: vi.fn(() => []),
    getRenderedTimeBlockStyle: vi.fn(() => ({})),
    getSignUpBlockStyle: vi.fn(() => ({})),
  }

  return { actions, timedGrid }
}

function createNonConsecutiveTimeGridViewModel() {
  const { actions, timedGrid } = createTimeGridViewModel()

  timedGrid.days = [
    {
      dayText: "thu",
      dateString: "jan 1",
      dateObject: Temporal.Instant.from("2026-01-01T09:00:00Z").toZonedDateTimeISO("UTC"),
      isConsecutive: true,
    },
    {
      dayText: "sat",
      dateString: "jan 3",
      dateObject: Temporal.Instant.from("2026-01-03T09:00:00Z").toZonedDateTimeISO("UTC"),
      isConsecutive: false,
    },
  ]
  timedGrid.calendarEventsByDay = [[], []]
  timedGrid.signUpBlocksByDay = [[], []]
  timedGrid.signUpBlocksToAddByDay = [[], []]
  timedGrid.overlaidAvailability = [[], []]
  timedGrid.timeslotClassStyle = [
    { class: "", style: {} },
    { class: "", style: {} },
  ]
  timedGrid.timeslotVon = [{}, {}]

  return { actions, timedGrid }
}

function createDaysOnlyGridViewModel() {
  const actions = {
    prevPage: vi.fn(),
    nextPage: vi.fn(),
    startDrag: vi.fn(),
    moveDrag: vi.fn(),
    endDrag: vi.fn(),
    resetCurTimeslot: vi.fn(),
    closeHint: vi.fn(),
  }

  const daysOnlyGrid: ScheduleOverlapDaysOnlyGridViewModel = {
    event: {
      ...baseEvent,
      daysOnly: true,
    },
    actions,
    curMonthText: "jan",
    hasPrevPage: false,
    hasNextPage: false,
    daysOfWeek: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
    monthDays: [{
      date: 1,
      time: Temporal.Instant.from("2026-01-01T00:00:00Z").toZonedDateTimeISO("UTC"),
      dateObject: Temporal.Instant.from("2026-01-01T00:00:00Z").toZonedDateTimeISO("UTC"),
      included: true,
    }],
    dayTimeslotClassStyle: [{ class: "", style: {} }],
    dayTimeslotVon: [{}],
    allowDrag: true,
    isPhone: false,
    hintTextShown: false,
    hintText: "",
    calendarOnly: false,
    toolRow: {
      event: {
        ...baseEvent,
        daysOnly: true,
      },
      state: states.EDIT_AVAILABILITY,
      states,
      actions: {
        updateCurTimezone: vi.fn(),
        resetCurTimezone: vi.fn(),
        updateTimeType: vi.fn(),
        updateMobileNumDays: vi.fn(),
        updateShowBestTimes: vi.fn(),
        updateHideIfNeeded: vi.fn(),
        updateShowAllHours: vi.fn(),
        updateStartCalendarOnMonday: vi.fn(),
        updateWeekOffset: vi.fn(),
        scheduleEvent: vi.fn(),
        cancelScheduleEvent: vi.fn(),
        confirmScheduleEvent: vi.fn(),
      },
      curTimezone: {
        value: "UTC",
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      },
      timezoneModified: false,
      startCalendarOnMonday: false,
      showBestTimes: false,
      hideIfNeeded: false,
      showAllHours: false,
      isWeekly: false,
      calendarPermissionGranted: false,
      weekOffset: 0,
      timezoneReferenceDate: Temporal.Instant.from("2026-01-01T00:00:00Z").toZonedDateTimeISO("UTC"),
      numResponses: 0,
      mobileNumDays: 1,
      allowScheduleEvent: false,
      timeType: "12h",
    },
  }

  return { actions, daysOnlyGrid }
}

const global = {
  stubs: {
    ToolRow: true,
    ZigZag: true,
    "v-btn": true,
    "v-icon": true,
    "v-expand-transition": true,
    "v-progress-circular": true,
    CalendarEventBlock: true,
    SignUpCalendarBlock: true,
  },
}

describe("ScheduleOverlap grid drag bindings", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("forwards timed-grid drag events through the rendered drag surface", async () => {
    const { timedGrid, actions } = createTimeGridViewModel()
    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    const dragSection = wrapper.get("#drag-section")
    await dragSection.trigger("pointerdown")
    await dragSection.trigger("pointermove")
    await dragSection.trigger("pointerup")
    await dragSection.trigger("pointercancel")
    await dragSection.trigger("lostpointercapture")

    expect(actions.startDrag).toHaveBeenCalledTimes(1)
    expect(actions.moveDrag).toHaveBeenCalledTimes(1)
    expect(actions.endDrag).toHaveBeenCalledTimes(3)
  })

  it("forwards timed-grid mouse drag events through the rendered drag surface", async () => {
    const { timedGrid, actions } = createTimeGridViewModel()
    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    const dragSection = wrapper.get("#drag-section")
    await dragSection.trigger("mousedown")
    await dragSection.trigger("mousemove")
    await dragSection.trigger("mouseup")

    expect(actions.startDrag).toHaveBeenCalledTimes(1)
    expect(actions.moveDrag).toHaveBeenCalledTimes(1)
    expect(actions.endDrag).toHaveBeenCalledTimes(1)
  })

  it("allows vertical touch panning through read-only grid surfaces", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.allowDrag = false
    const { daysOnlyGrid } = createDaysOnlyGridViewModel()
    daysOnlyGrid.allowDrag = false

    const timedWrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })
    const daysOnlyWrapper = mount(ScheduleOverlapDaysOnlyGrid, {
      props: { daysOnlyGrid },
      global,
    })

    expect(timedWrapper.get("#drag-section").attributes("style")).toContain(
      "touch-action: pan-y;"
    )
    expect(daysOnlyWrapper.get("#drag-section").attributes("style")).toContain(
      "touch-action: pan-y;"
    )
  })

  it("keeps touch drag selection enabled on editable grid surfaces", () => {
    const { timedGrid } = createTimeGridViewModel()
    const { daysOnlyGrid } = createDaysOnlyGridViewModel()

    const timedWrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })
    const daysOnlyWrapper = mount(ScheduleOverlapDaysOnlyGrid, {
      props: { daysOnlyGrid },
      global,
    })

    expect(timedWrapper.get("#drag-section").attributes("style")).toContain(
      "touch-action: none;"
    )
    expect(daysOnlyWrapper.get("#drag-section").attributes("style")).toContain(
      "touch-action: none;"
    )
  })

  it("renders non-consecutive day gaps as wide blank spacing", () => {
    const { timedGrid } = createNonConsecutiveTimeGridViewModel()
    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    const gaps = wrapper.findAll('div[style="width: 20px;"]')

    expect(gaps).toHaveLength(2)
    for (const gap of gaps) {
      expect(gap.attributes("style")).toContain("width: 20px;")
    }
  })

  it("keeps timed-grid navigation buttons within the phone navigation slot", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.hasPrevPage = true
    timedGrid.hasNextPage = true

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global: {
        ...global,
        stubs: {
          ...global.stubs,
          "v-btn": buttonStub,
          "v-icon": iconStub,
        },
      },
    })

    const navButtons = wrapper.findAll("button")

    expect(navButtons).toHaveLength(2)
    const nextButton = navButtons[1]
    const nextButtonClasses = nextButton.classes()
    expect(nextButtonClasses).toContain("tw-h-8")
    expect(nextButtonClasses).toContain("tw-w-8")
    expect(nextButtonClasses).toContain("tw-min-w-8")
    expect(nextButtonClasses).toContain("sm:tw-h-[36px]")
    expect(nextButtonClasses).toContain("sm:tw-w-[36px]")
    expect(nextButtonClasses).toContain("sm:tw-min-w-[36px]")
    expect(nextButton.element.parentElement?.parentElement?.classList).toContain("tw-w-10")
  })

  it("renders owned overlay availability frame classes for available and if-needed blocks", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.overlayAvailability = true
    timedGrid.overlaidAvailability = [
      [
        {
          top: "0px",
          height: "30px",
          type: "available",
        },
        {
          top: "30px",
          height: "30px",
          type: "if_needed",
        },
      ],
    ]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    const availableBlock = wrapper.get(".time-grid-overlay-block--available")
    const ifNeededBlock = wrapper.get(".time-grid-overlay-block--if-needed")

    expect(availableBlock.classes()).toContain("time-grid-overlay-block")
    expect(availableBlock.classes()).toContain("overlay-avail-shadow-green")
    expect(ifNeededBlock.classes()).toContain("time-grid-overlay-block")
    expect(ifNeededBlock.classes()).toContain("overlay-avail-shadow-yellow")
  })

  it("renders scheduled events as centered, solid shadowed blocks without names", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.dragStart = { row: 0, col: 0 }
    timedGrid.scheduledEventStyles = [{ top: "0px", height: "60px" }]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    const scheduledEvent = wrapper.get(".scheduled-event-block")

    expect(scheduledEvent.classes()).toContain("tw-border-scheduled-event")
    expect(scheduledEvent.classes()).toContain("tw-bg-scheduled-event")
    expect(scheduledEvent.classes()).toContain("tw-shadow-[0_0_8px_rgba(0,0,0,0.35)]")
    expect(scheduledEvent.text()).toBe("")
    expect(scheduledEvent.element.parentElement?.classList).toContain("tw-left-[15%]")
    expect(scheduledEvent.element.parentElement?.classList).toContain("tw-w-[70%]")
  })

  it("keeps the saved event visible while rescheduling", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.dragStart = null
    timedGrid.curScheduledEvent = null
    timedGrid.savedScheduledEvent = { row: 0, col: 0, numRows: 1 }
    timedGrid.scheduledEventStyles = [{ top: "0px", height: "60px" }]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    expect(wrapper.findAll(".scheduled-event-block")).toHaveLength(1)
  })

  it("keeps the saved event visible while viewing availability", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.state = states.HEATMAP
    timedGrid.savedScheduledEvent = { row: 0, col: 0, numRows: 1 }
    timedGrid.scheduledEventStyles = [{ top: "0px", height: "60px" }]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    expect(wrapper.findAll(".scheduled-event-block")).toHaveLength(1)
  })

  it("hides a saved scheduled event while editing availability", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.state = states.EDIT_AVAILABILITY
    timedGrid.savedScheduledEvent = { row: 0, col: 0, numRows: 1 }
    timedGrid.scheduledEventStyles = [{ top: "0px", height: "60px" }]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    expect(wrapper.findAll(".scheduled-event-block")).toHaveLength(0)
  })

  it("hides scheduled events while setting specific times", () => {
    const { timedGrid } = createTimeGridViewModel()
    timedGrid.state = states.SET_SPECIFIC_TIMES
    timedGrid.savedScheduledEvent = { row: 0, col: 0, numRows: 1 }
    timedGrid.scheduledEventStyles = [{ top: "0px", height: "60px" }]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    expect(wrapper.findAll(".scheduled-event-block")).toHaveLength(0)
  })

  it("renders one structural interior collapsed-hours row and forwards expansion clicks", async () => {
    const { timedGrid, actions } = createNonConsecutiveTimeGridViewModel()
    timedGrid.state = states.HEATMAP
    timedGrid.renderedRows = [
      {
        id: "collapsed-660-900",
        kind: "collapsed",
        height: 44,
        rowTop: 0,
        startLabel: "11:00",
        endLabel: "15:00",
      },
      {
        id: "time-24",
        kind: "timeslot",
        height: 60,
        rowTop: 44,
        timeText: "3 pm",
        baseRowIndex: 24,
        cells: [
          { class: "day-0", style: {}, von: {} },
          { class: "day-1", style: {}, von: {} },
        ],
      },
    ]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global: {
        ...global,
        stubs: {
          ...global.stubs,
          "v-icon": iconStub,
        },
      },
    })

    const collapsedRows = wrapper.findAll("button.schedule-overlap-collapsed-row")

    expect(collapsedRows).toHaveLength(1)
    expect(collapsedRows[0].text()).toContain("11:00-15:00")

    await collapsedRows[0].trigger("click")

    expect(actions.toggleCollapsedSpan).toHaveBeenCalledWith("collapsed-660-900")
  })

  it("emits stable row and column dataset coordinates on timed-grid timeslot cells", () => {
    const { timedGrid } = createNonConsecutiveTimeGridViewModel()
    timedGrid.renderedRows = [
      {
        id: "time-4",
        kind: "timeslot",
        height: 60,
        rowTop: 0,
        timeText: "01:00",
        baseRowIndex: 4,
        cells: [
          { class: "day-0", style: {}, von: {} },
          { class: "day-1", style: {}, von: {} },
        ],
      },
    ]

    const wrapper = mount(ScheduleOverlapTimeGrid, {
      props: { timedGrid },
      global,
    })

    const firstCell = wrapper.get('[data-row="4"][data-col="0"]')
    const secondCell = wrapper.get('[data-row="4"][data-col="1"]')

    expect(firstCell.classes()).toContain("timeslot")
    expect(secondCell.classes()).toContain("timeslot")
  })

  it("forwards days-only drag events through the rendered drag surface", async () => {
    const { daysOnlyGrid, actions } = createDaysOnlyGridViewModel()
    const wrapper = mount(ScheduleOverlapDaysOnlyGrid, {
      props: { daysOnlyGrid },
      global,
    })

    const dragSection = wrapper.get("#drag-section")
    await dragSection.trigger("pointerdown")
    await dragSection.trigger("pointermove")
    await dragSection.trigger("pointerup")
    await dragSection.trigger("pointercancel")
    await dragSection.trigger("lostpointercapture")

    expect(actions.startDrag).toHaveBeenCalledTimes(1)
    expect(actions.moveDrag).toHaveBeenCalledTimes(1)
    expect(actions.endDrag).toHaveBeenCalledTimes(3)
  })

  it("forwards days-only mouse drag events through the rendered drag surface", async () => {
    const { daysOnlyGrid, actions } = createDaysOnlyGridViewModel()
    const wrapper = mount(ScheduleOverlapDaysOnlyGrid, {
      props: { daysOnlyGrid },
      global,
    })

    const dragSection = wrapper.get("#drag-section")
    await dragSection.trigger("mousedown")
    await dragSection.trigger("mousemove")
    await dragSection.trigger("mouseup")

    expect(actions.startDrag).toHaveBeenCalledTimes(1)
    expect(actions.moveDrag).toHaveBeenCalledTimes(1)
    expect(actions.endDrag).toHaveBeenCalledTimes(1)
  })
})
