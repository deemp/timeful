import { ref } from "vue"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { Temporal } from "temporal-polyfill"
import { durations, eventTypes, UTC } from "@/constants"
import { createLocalStorageMock } from "@/test/localStorage"
import { buildSpecificTimesCreateDraft } from "@/composables/event/specificTimesEditDraft"
import { buildEventEditorSchedule } from "@/composables/event/eventEditorSchedule"
import { normalizeActiveSlots } from "@/utils/timedEventSlots"
import { states, type ScheduleOverlapEvent } from "./types"
import { useCalendarGrid } from "./useCalendarGrid"

const zdt = (iso: string) => Temporal.Instant.from(iso).toZonedDateTimeISO(UTC)

describe("useCalendarGrid", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", createLocalStorageMock())
  })

  it("renders existing specific-time grids from their exact projected slots", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-1",
      shortId: "grid123",
      name: "Specific times",
      type: eventTypes.SPECIFIC_DATES,
      dates: [Temporal.PlainDate.from("2026-05-19")],
      timeSeed: zdt("2026-05-19T06:15:00Z"),
      startTime: Temporal.PlainTime.from("06:15"),
      duration: durations.ONE_HOUR,
      hasSpecificTimes: true,
      times: [zdt("2026-05-19T06:15:00Z"), zdt("2026-05-19T06:30:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-1",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Moscow",
        offset: Temporal.Duration.from({ hours: -3 }),
        label: "Europe/Moscow",
        gmtString: "GMT+3",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    const firstRenderedTime = grid.splitTimes.value[0][0]
    const secondRenderedTime = grid.splitTimes.value[0][1]
    expect(firstRenderedTime).toBeDefined()
    expect(secondRenderedTime).toBeDefined()

    const firstDisplayedSlot = grid.getDisplayDateFromRowCol(0, 0)
    const firstIncludedSlot = grid.getDateFromDayTimeIndex(0, 1)

    expect(
      firstDisplayedSlot
        ?.withTimeZone("Europe/Moscow")
        .toPlainTime()
        .toString(),
    ).toBe("09:15:00")
    expect(firstRenderedTime.absoluteMinutes).toBe(9 * 60 + 15)
    expect(secondRenderedTime.absoluteMinutes).toBe(9 * 60 + 30)
    expect(
      firstIncludedSlot?.withTimeZone("Europe/Moscow").toPlainTime().toString(),
    ).toBe("09:30:00")
  })

  it("builds slot-aligned rows for half-hour-offset timezones", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-2",
      shortId: "grid-half-hour",
      name: "Half-hour timezone",
      type: eventTypes.SPECIFIC_DATES,
      dates: [Temporal.PlainDate.from("2026-05-19")],
      timeSeed: zdt("2026-05-19T06:00:00Z"),
      startTime: Temporal.PlainTime.from("06:00"),
      duration: Temporal.Duration.from({ hours: 2 }),
      hasSpecificTimes: false,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.THIRTY_MINUTES,
      creatorPosthogId: "creator-2",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Asia/Kolkata",
        offset: Temporal.Duration.from({ minutes: -330 }),
        label: "Asia/Kolkata",
        gmtString: "GMT+5:30",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value[0]).not.toHaveLength(0)
    expect(grid.times.value).not.toHaveLength(0)
    expect(grid.splitTimes.value[0][0]?.absoluteMinutes).toBe(11 * 60 + 30)
  })

  it("preserves exact rows in quarter-hour-offset timed grids", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-3",
      shortId: "grid-quarter-hour",
      name: "Quarter-hour timezone",
      type: eventTypes.SPECIFIC_DATES,
      dates: [Temporal.PlainDate.from("2026-05-19")],
      timeSeed: zdt("2026-05-19T05:30:00Z"),
      startTime: Temporal.PlainTime.from("05:30"),
      duration: Temporal.Duration.from({ hours: 8 }),
      hasSpecificTimes: false,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-3",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Asia/Kathmandu",
        offset: Temporal.Duration.from({ minutes: -345 }),
        label: "Asia/Kathmandu",
        gmtString: "GMT+5:45",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    const firstRenderedTime = grid.splitTimes.value[0][0]
    const secondRenderedTime = grid.splitTimes.value[0][1]
    const lastRenderedTime =
      grid.splitTimes.value[0][grid.splitTimes.value[0].length - 1]

    expect(firstRenderedTime.absoluteMinutes).toBe(11 * 60 + 15)
    expect(secondRenderedTime.absoluteMinutes).toBe(11 * 60 + 30)
    expect(
      grid
        .getDateFromDayHoursOffset(0, firstRenderedTime.hoursOffset)
        ?.withTimeZone("Asia/Kathmandu")
        .toPlainTime()
        .toString(),
    ).toBe("11:15:00")
    expect(
      grid
        .getDateFromDayTimeIndex(0, 1)
        ?.withTimeZone("Asia/Kathmandu")
        .toPlainTime()
        .toString(),
    ).toBe("11:30:00")
    expect(lastRenderedTime.absoluteMinutes).toBe(19 * 60)
    expect(
      grid
        .getDateFromDayHoursOffset(
          0,
          lastRenderedTime.hoursOffset.add(durations.FIFTEEN_MINUTES),
        )
        ?.withTimeZone("Asia/Kathmandu")
        .toPlainTime()
        .toString(),
    ).toBe("19:15:00")
  })

  it("renders saved specific-time windows from the selected instants instead of a broader duration", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-4",
      shortId: "grid-specific-window",
      name: "Specific times in a broader window",
      type: eventTypes.SPECIFIC_DATES,
      dates: [Temporal.PlainDate.from("2026-05-19")],
      timeSeed: zdt("2026-05-19T09:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 12 }),
      hasSpecificTimes: true,
      times: [zdt("2026-05-19T09:00:00Z"), zdt("2026-05-19T17:00:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-4",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: UTC,
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value[0]).toHaveLength(33)
    expect(grid.splitTimes.value[0][0]?.text).toBe("9 am")
    expect(grid.splitTimes.value[0][32]?.text).toBe("5 pm")
    expect(grid.splitTimes.value[0][32]?.absoluteMinutes).toBe(17 * 60)
  })

  it("returns a display date for grey specific-time gaps without treating them as event times", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5",
      shortId: "grid-specific-gap-tooltip",
      name: "Specific time gap",
      type: eventTypes.SPECIFIC_DATES,
      dates: [Temporal.PlainDate.from("2026-05-19")],
      timeSeed: zdt("2026-05-19T09:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 3 }),
      hasSpecificTimes: true,
      times: [zdt("2026-05-19T09:00:00Z"), zdt("2026-05-19T11:00:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.ONE_HOUR,
      creatorPosthogId: "creator-5",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: UTC,
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.getDateFromRowCol(1, 0)).toBeNull()
    expect(grid.getDisplayDateFromRowCol(1, 0)?.toString()).toBe(
      "2026-05-19T10:00:00+00:00[UTC]",
    )
  })

  it("derives saved specific-time day columns from event times in the viewer timezone", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5b",
      shortId: "grid-specific-belgrade-days",
      name: "Specific time saved event timezone view",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-29"),
        Temporal.PlainDate.from("2026-05-30"),
      ],
      timeSeed: zdt("2026-05-29T00:00:00Z"),
      startTime: Temporal.PlainTime.from("00:00"),
      duration: Temporal.Duration.from({ hours: 4 }),
      hasSpecificTimes: true,
      times: [
        zdt("2026-05-29T00:00:00Z"),
        zdt("2026-05-29T01:00:00Z"),
        zdt("2026-05-29T02:00:00Z"),
        zdt("2026-05-29T03:00:00Z"),
        zdt("2026-05-30T00:00:00Z"),
        zdt("2026-05-30T01:00:00Z"),
        zdt("2026-05-30T02:00:00Z"),
        zdt("2026-05-30T03:00:00Z"),
      ],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.ONE_HOUR,
      creatorPosthogId: "creator-5b",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Belgrade",
        offset: Temporal.Duration.from({ hours: -2 }),
        label: "Europe/Belgrade",
        gmtString: "GMT+2",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(
      grid.days.value.map((day) =>
        day.dateObject.withTimeZone("Europe/Belgrade").toPlainDate().toString(),
      ),
    ).toEqual(["2026-05-29", "2026-05-30"])
    expect(
      grid.splitTimes.value[0].map((time) => time.text).filter(Boolean),
    ).toEqual(["2 am", "3 am", "4 am", "5 am"])

    for (const dayIndex of [0, 1]) {
      expect(
        [0, 1, 2, 3].map((rowIndex) =>
          grid
            .getDateFromDayTimeIndex(dayIndex, rowIndex)
            ?.withTimeZone("Europe/Belgrade")
            .toPlainTime()
            .toString(),
        ),
      ).toEqual(["02:00:00", "03:00:00", "04:00:00", "05:00:00"])
    }
  })

  it("derives ordinary timed columns from their projected enabled slots", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-ee4cb",
      shortId: "ee4Cb",
      name: "Seed-owned timed columns",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-06-11"),
        Temporal.PlainDate.from("2026-06-12"),
      ],
      timeSeed: zdt("2026-06-11T00:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 8 }),
      hasSpecificTimes: false,
      enabledSlots: [
        ...Array.from({ length: 32 }, (_, index) =>
          zdt(
            `2026-06-11T${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}:00Z`,
          ),
        ),
        ...Array.from({ length: 32 }, (_, index) =>
          zdt(
            `2026-06-12T${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}:00Z`,
          ),
        ),
      ],
      activeSlots: [],
      eventTimezone: "Asia/Seoul",
      slotGeneration: {
        startTimeLocal: Temporal.PlainTime.from("09:00:00"),
        endTimeLocal: Temporal.PlainTime.from("17:00:00"),
        timeIncrement: Temporal.Duration.from({ minutes: 15 }),
      },
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-ee4cb",
      remindees: [],
    })

    const losAngelesGrid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "America/Los_Angeles",
        offset: Temporal.Duration.from({ hours: 7 }),
        label: "America/Los_Angeles",
        gmtString: "GMT-7",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(
      losAngelesGrid.days.value.map((day) =>
        day.dateObject
          .withTimeZone("America/Los_Angeles")
          .toPlainDate()
          .toString(),
      ),
    ).toEqual(["2026-06-10", "2026-06-11", "2026-06-12"])

    const tokyoGrid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Asia/Tokyo",
        offset: Temporal.Duration.from({ hours: -9 }),
        label: "Asia/Tokyo",
        gmtString: "GMT+9",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(
      tokyoGrid.days.value.map((day) =>
        day.dateObject.withTimeZone("Asia/Tokyo").toPlainDate().toString(),
      ),
    ).toEqual(["2026-06-11", "2026-06-12"])
  })

  it("uses saved specific-time instants instead of stale duration metadata for the visible window", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5c",
      shortId: "grid-specific-window-from-times",
      name: "Saved specific times override stale window",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-29"),
        Temporal.PlainDate.from("2026-05-30"),
      ],
      timeSeed: zdt("2026-05-29T00:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: true,
      times: [
        zdt("2026-05-29T00:00:00Z"),
        zdt("2026-05-29T00:15:00Z"),
        zdt("2026-05-29T00:30:00Z"),
        zdt("2026-05-29T00:45:00Z"),
        zdt("2026-05-29T01:00:00Z"),
        zdt("2026-05-29T01:15:00Z"),
        zdt("2026-05-29T01:30:00Z"),
        zdt("2026-05-29T01:45:00Z"),
        zdt("2026-05-29T02:00:00Z"),
        zdt("2026-05-29T02:15:00Z"),
        zdt("2026-05-29T02:30:00Z"),
        zdt("2026-05-29T02:45:00Z"),
        zdt("2026-05-29T03:00:00Z"),
        zdt("2026-05-29T03:15:00Z"),
        zdt("2026-05-29T03:30:00Z"),
        zdt("2026-05-29T03:45:00Z"),
        zdt("2026-05-30T00:00:00Z"),
        zdt("2026-05-30T00:15:00Z"),
        zdt("2026-05-30T00:30:00Z"),
        zdt("2026-05-30T00:45:00Z"),
        zdt("2026-05-30T01:00:00Z"),
        zdt("2026-05-30T01:15:00Z"),
        zdt("2026-05-30T01:30:00Z"),
        zdt("2026-05-30T01:45:00Z"),
        zdt("2026-05-30T02:00:00Z"),
        zdt("2026-05-30T02:15:00Z"),
        zdt("2026-05-30T02:30:00Z"),
        zdt("2026-05-30T02:45:00Z"),
        zdt("2026-05-30T03:00:00Z"),
        zdt("2026-05-30T03:15:00Z"),
        zdt("2026-05-30T03:30:00Z"),
        zdt("2026-05-30T03:45:00Z"),
      ],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-5c",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Belgrade",
        offset: Temporal.Duration.from({ hours: -2 }),
        label: "Europe/Belgrade",
        gmtString: "GMT+2",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value[1]).toEqual([])
    expect(
      grid.splitTimes.value[0].map((time) => time.text).filter(Boolean),
    ).toEqual(["2 am", "3 am", "4 am", "5 am"])
    expect(
      grid.splitTimes.value[0].map((time) => time.displayedMinutes),
    ).toEqual([
      120, 135, 150, 165, 180, 195, 210, 225, 240, 255, 270, 285, 300, 315, 330,
      345,
    ])
  })

  it("uses canonical slot generation instead of stale duration metadata for non-specific timed windows", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5cc",
      shortId: "grid-canonical-window-from-slot-generation",
      name: "Canonical timed window ignores stale duration",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-06-11"),
        Temporal.PlainDate.from("2026-06-12"),
      ],
      timeSeed: zdt("2026-06-11T09:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 3 }),
      hasSpecificTimes: false,
      times: [],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-5cc",
      remindees: [],
      eventTimezone: UTC,
      slotGeneration: {
        startTimeLocal: Temporal.PlainTime.from("09:00"),
        endTimeLocal: Temporal.PlainTime.from("17:00"),
        timeIncrement: durations.FIFTEEN_MINUTES,
      },
      enabledSlots: [
        zdt("2026-06-11T09:00:00Z"),
        zdt("2026-06-11T09:15:00Z"),
        zdt("2026-06-11T16:30:00Z"),
        zdt("2026-06-11T16:45:00Z"),
        zdt("2026-06-12T09:00:00Z"),
        zdt("2026-06-12T09:15:00Z"),
        zdt("2026-06-12T16:30:00Z"),
        zdt("2026-06-12T16:45:00Z"),
      ],
      activeSlots: [
        zdt("2026-06-11T09:00:00Z"),
        zdt("2026-06-11T09:15:00Z"),
        zdt("2026-06-11T16:30:00Z"),
        zdt("2026-06-11T16:45:00Z"),
        zdt("2026-06-12T09:00:00Z"),
        zdt("2026-06-12T09:15:00Z"),
        zdt("2026-06-12T16:30:00Z"),
        zdt("2026-06-12T16:45:00Z"),
      ],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: UTC,
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value[1]).toEqual([])
    expect(grid.splitTimes.value[0]).toHaveLength(32)
    expect(grid.splitTimes.value[0][0]?.text).toBe("9 am")
    expect(grid.splitTimes.value[0][28]?.text).toBe("4 pm")
    expect(grid.splitTimes.value[0][31]?.absoluteMinutes).toBe(16 * 60 + 45)
    expect(grid.getDateFromRowCol(31, 0)?.toInstant().toString()).toBe(
      "2026-06-11T16:45:00Z",
    )
  })

  it("keeps canonical timed slots unsplit and in their projected date columns", () => {
    const eventTimezone = "Asia/Baghdad"
    const enabledSlots = ["2026-08-06", "2026-08-07"].flatMap((day) =>
      Array.from({ length: 32 }, (_, index) =>
        Temporal.ZonedDateTime.from({
          timeZone: eventTimezone,
          year: Number(day.slice(0, 4)),
          month: Number(day.slice(5, 7)),
          day: Number(day.slice(8, 10)),
          hour: 9 + Math.floor(index / 4),
          minute: (index % 4) * 15,
        }),
      ),
    )
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-projected-columns",
      shortId: "projected-columns",
      name: "Projected columns",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-08-06"),
        Temporal.PlainDate.from("2026-08-07"),
      ],
      timeSeed: enabledSlots[0],
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 8 }),
      hasSpecificTimes: false,
      enabledSlots,
      activeSlots: enabledSlots,
      eventTimezone,
      slotGeneration: {
        startTimeLocal: Temporal.PlainTime.from("09:00"),
        endTimeLocal: Temporal.PlainTime.from("17:00"),
        timeIncrement: durations.FIFTEEN_MINUTES,
      },
      timedRecurrence: {
        kind: "specific_dates",
        selectedDays: [
          Temporal.PlainDate.from("2026-08-06"),
          Temporal.PlainDate.from("2026-08-07"),
        ],
        selectedDaysOfWeek: [],
        startOnMonday: true,
      },
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-projected-columns",
      remindees: [],
    })
    const makeGrid = (value: string, offset: Temporal.Duration) =>
      useCalendarGrid({
        event,
        weekOffset: ref(0),
        curTimezone: ref({
          value,
          offset,
          label: value,
          gmtString: value,
        }),
        state: ref(states.HEATMAP),
        isPhone: ref(false),
      })

    const baghdadGrid = makeGrid(eventTimezone, Temporal.Duration.from({ hours: -3 }))
    expect(baghdadGrid.splitTimes.value[0][0]?.absoluteMinutes).toBe(9 * 60)
    expect(baghdadGrid.splitTimes.value[1]).toEqual([])

    const tehranGrid = makeGrid("Asia/Tehran", Temporal.Duration.from({ minutes: -210 }))
    expect(tehranGrid.splitTimes.value[0][0]?.absoluteMinutes).toBe(9 * 60 + 30)
    expect(tehranGrid.splitTimes.value.at(-1)).toEqual([])

    const fijiGrid = makeGrid("Pacific/Fiji", Temporal.Duration.from({ hours: -12 }))
    expect(fijiGrid.splitTimes.value).toHaveLength(2)
    expect(fijiGrid.splitTimes.value[1]).toEqual([])
    expect(
      fijiGrid.days.value.map((day) => day.dateObject.toPlainDate().toString()),
    ).toEqual(["2026-08-06", "2026-08-07", "2026-08-08"])
    expect(fijiGrid.getDateFromRowCol(72, 0)?.toInstant().toString()).toBe(
      "2026-08-06T06:00:00Z",
    )
    expect(fijiGrid.getDateFromRowCol(0, 1)?.toInstant().toString()).toBe(
      "2026-08-06T12:00:00Z",
    )
    expect(fijiGrid.getDateFromRowCol(0, 2)?.toInstant().toString()).toBe(
      "2026-08-07T12:00:00Z",
    )
  })

  it("adds display-date columns for specific-times edit slots that cross midnight", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5d",
      shortId: "grid-specific-edit-days-from-times",
      name: "Edit specific times from saved instants",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-28"),
        Temporal.PlainDate.from("2026-05-29"),
      ],
      timeSeed: zdt("2026-05-28T00:00:00Z"),
      startTime: Temporal.PlainTime.from("00:00"),
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: true,
      times: [zdt("2026-05-28T22:00:00Z"), zdt("2026-05-29T22:00:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.ONE_HOUR,
      creatorPosthogId: "creator-5d",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Belgrade",
        offset: Temporal.Duration.from({ hours: -2 }),
        label: "Europe/Belgrade",
        gmtString: "GMT+2",
      }),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    expect(
      grid.days.value.map((day) => day.dateObject.toPlainDate().toString()),
    ).toEqual(["2026-05-28", "2026-05-29", "2026-05-30"])
    expect(grid.getDateFromRowCol(0, 0)).toBeNull()
    expect(grid.getDateFromRowCol(0, 1)?.toInstant().toString()).toBe(
      "2026-05-28T22:00:00Z",
    )
    expect(grid.getDateFromRowCol(0, 2)?.toInstant().toString()).toBe(
      "2026-05-29T22:00:00Z",
    )
  })

  it("uses activeSlots for normal-view specific-times cell occupancy while preserving the selected subset", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5d-active-subset",
      shortId: "grid-specific-active-subset",
      name: "Specific times active subset",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-28"),
        Temporal.PlainDate.from("2026-05-29"),
      ],
      timeSeed: zdt("2026-05-28T09:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 1 }),
      hasSpecificTimes: true,
      enabledSlots: [
        zdt("2026-05-28T09:00:00Z"),
        zdt("2026-05-28T09:15:00Z"),
        zdt("2026-05-28T09:30:00Z"),
        zdt("2026-05-28T09:45:00Z"),
        zdt("2026-05-29T09:00:00Z"),
        zdt("2026-05-29T09:15:00Z"),
      ],
      activeSlots: [zdt("2026-05-28T09:30:00Z"), zdt("2026-05-28T09:45:00Z")],
      times: [zdt("2026-05-28T09:30:00Z"), zdt("2026-05-28T09:45:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-5d-active-subset",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: UTC,
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(
      grid.splitTimes.value[0].map((time) => time.displayedMinutes),
    ).toEqual([9 * 60, 9 * 60 + 15, 9 * 60 + 30, 9 * 60 + 45])
    expect(grid.getDisplayDateFromRowCol(0, 0)?.toInstant().toString()).toBe(
      "2026-05-28T09:00:00Z",
    )
    expect(grid.getDisplayDateFromRowCol(1, 0)?.toInstant().toString()).toBe(
      "2026-05-28T09:15:00Z",
    )
    expect(grid.getDisplayDateFromRowCol(2, 0)?.toInstant().toString()).toBe(
      "2026-05-28T09:30:00Z",
    )
    expect(grid.getDisplayDateFromRowCol(3, 0)?.toInstant().toString()).toBe(
      "2026-05-28T09:45:00Z",
    )
    expect(grid.getDateFromRowCol(0, 0)).toBeNull()
    expect(grid.getDateFromRowCol(1, 0)).toBeNull()
    expect(grid.getDateFromRowCol(2, 0)?.toInstant().toString()).toBe(
      "2026-05-28T09:30:00Z",
    )
    expect(grid.getDateFromRowCol(3, 0)?.toInstant().toString()).toBe(
      "2026-05-28T09:45:00Z",
    )
    const activeSlot = grid.getDateFromRowCol(2, 0)
    expect(activeSlot).not.toBeNull()
    if (!activeSlot) {
      throw new Error("Expected selected specific-times grid cell")
    }
    expect(grid.specificTimesSet.value.has(activeSlot)).toBe(true)
  })

  it("rebuilds normal-view specific-times columns from active slots after a viewer timezone shift", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-gmt-boundary",
      shortId: "grid-gmt-boundary",
      name: "Specific times across viewer midnight",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-06-11"),
        Temporal.PlainDate.from("2026-06-12"),
        Temporal.PlainDate.from("2026-06-14"),
        Temporal.PlainDate.from("2026-06-17"),
        Temporal.PlainDate.from("2026-06-18"),
      ],
      timeSeed: zdt("2026-06-11T03:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 11 }),
      hasSpecificTimes: true,
      enabledSlots: [
        zdt("2026-06-11T06:00:00Z"),
        zdt("2026-06-12T06:00:00Z"),
        zdt("2026-06-14T06:00:00Z"),
      ],
      activeSlots: [
        zdt("2026-06-11T06:00:00Z"),
        zdt("2026-06-12T06:00:00Z"),
        zdt("2026-06-14T06:00:00Z"),
      ],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-gmt-boundary",
      remindees: [],
    })
    const curTimezone = ref({
      value: "Etc/GMT+6",
      offset: Temporal.Duration.from({ hours: 6 }),
      label: "GMT-6",
      gmtString: "GMT-6",
    })
    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone,
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(
      grid.days.value.map((day) =>
        day.dateObject
          .withTimeZone(curTimezone.value.value)
          .toPlainDate()
          .toString(),
      ),
    ).toEqual([
      "2026-06-11",
      "2026-06-12",
      "2026-06-14",
      "2026-06-17",
      "2026-06-18",
    ])

    curTimezone.value = {
      value: "Etc/GMT+7",
      offset: Temporal.Duration.from({ hours: 7 }),
      label: "GMT-7",
      gmtString: "GMT-7",
    }

    expect(
      grid.days.value.map((day) =>
        day.dateObject
          .withTimeZone(curTimezone.value.value)
          .toPlainDate()
          .toString(),
      ),
    ).toEqual([
      "2026-06-10",
      "2026-06-11",
      "2026-06-12",
      "2026-06-13",
      "2026-06-14",
      "2026-06-17",
      "2026-06-18",
    ])
    expect(grid.getDateFromRowCol(0, 1)?.toInstant().toString()).toBe(
      "2026-06-12T06:00:00Z",
    )
    expect(grid.getDateFromRowCol(0, 3)?.toInstant().toString()).toBe(
      "2026-06-14T06:00:00Z",
    )
  })

  it("supplements saved specific-time edit days with newly added membership dates", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5d-added-date",
      shortId: "grid-specific-edit-days-added-date",
      name: "Edit specific times with added date",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-28"),
        Temporal.PlainDate.from("2026-05-29"),
        Temporal.PlainDate.from("2026-05-30"),
      ],
      timeSeed: zdt("2026-05-28T00:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: true,
      times: [zdt("2026-05-28T09:00:00Z"), zdt("2026-05-29T09:00:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.ONE_HOUR,
      creatorPosthogId: "creator-5d-added-date",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: UTC,
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      }),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    expect(
      grid.days.value.map((day) =>
        day.dateObject.withTimeZone(UTC).toPlainDate().toString(),
      ),
    ).toEqual(["2026-05-28", "2026-05-29", "2026-05-30"])
  })

  it("moves colliding specific-times edit labels into their display-date column", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5d-colliding-local-days",
      shortId: "grid-specific-edit-colliding-days",
      name: "Edit specific times with colliding local days",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-30"),
        Temporal.PlainDate.from("2026-05-31"),
      ],
      timeSeed: zdt("2026-05-30T00:00:00Z"),
      startTime: Temporal.PlainTime.from("00:00"),
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: true,
      times: [zdt("2026-05-30T21:15:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-5d-colliding-local-days",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Moscow",
        offset: Temporal.Duration.from({ hours: -3 }),
        label: "Europe/Moscow",
        gmtString: "GMT+3",
      }),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    expect(grid.days.value).toHaveLength(2)
    expect(grid.days.value.map((day) => day.dateString)).toEqual([
      "may 30",
      "may 31",
    ])
    expect(
      grid.days.value.map((day) =>
        day.dateObject.withTimeZone("Europe/Moscow").toPlainDate().toString(),
      ),
    ).toEqual(["2026-05-30", "2026-05-31"])
    expect(grid.getDateFromRowCol(0, 0)).toBeNull()
    expect(grid.getDateFromRowCol(0, 1)?.toInstant().toString()).toBe(
      "2026-05-30T21:15:00Z",
    )
  })

  it("preserves reopened 5fa3A-shaped edit slots in their display-date column", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5fa3a-shape",
      shortId: "5fa3A",
      name: "Reopened specific times",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-30"),
        Temporal.PlainDate.from("2026-05-31"),
      ],
      timeSeed: zdt("2026-05-30T00:30:00Z"),
      startTime: Temporal.PlainTime.from("00:30"),
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: true,
      times: [zdt("2026-05-30T21:15:00Z"), zdt("2026-05-30T21:30:00Z")],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-5fa3a-shape",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Moscow",
        offset: Temporal.Duration.from({ hours: -3 }),
        label: "Europe/Moscow",
        gmtString: "GMT+3",
      }),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    expect(grid.days.value).toHaveLength(2)
    expect(grid.days.value.map((day) => day.dateString)).toEqual([
      "may 30",
      "may 31",
    ])
    expect(
      grid.allDays.value.map((day) =>
        day.dateObject.withTimeZone("Europe/Moscow").toPlainDate().toString(),
      ),
    ).toEqual(["2026-05-30", "2026-05-31"])
    expect(grid.getDateFromRowCol(0, 0)).toBeNull()
    expect(grid.getDateFromRowCol(0, 1)?.toInstant().toString()).toBe(
      "2026-05-30T21:15:00Z",
    )
    expect(grid.getDateFromRowCol(1, 1)?.toInstant().toString()).toBe(
      "2026-05-30T21:30:00Z",
    )
  })

  it("maps quarter-hour rows in specific-times edit mode from midnight instead of the event window start", () => {
    const enabledSlots = Array.from({ length: 96 }, (_, index) =>
      zdt(
        `2026-05-30T${String(Math.floor(index / 4)).padStart(2, "0")}:${String(
          (index % 4) * 15,
        ).padStart(2, "0")}:00Z`,
      ),
    ).concat(
      Array.from({ length: 96 }, (_, index) =>
        zdt(
          `2026-05-31T${String(Math.floor(index / 4)).padStart(2, "0")}:${String(
            (index % 4) * 15,
          ).padStart(2, "0")}:00Z`,
        ),
      ),
    )
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-5e",
      shortId: "grid-specific-edit-quarter-hours",
      name: "Edit specific times midnight rows",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-30"),
        Temporal.PlainDate.from("2026-05-31"),
      ],
      timeSeed: zdt("2026-05-30T00:00:00Z"),
      startTime: Temporal.PlainTime.from("09:00"),
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: true,
      enabledSlots,
      times: [],
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-5e",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: UTC,
        offset: Temporal.Duration.from({ hours: 0 }),
        label: "UTC",
        gmtString: "GMT+0",
      }),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    expect(grid.getDateFromRowCol(0, 0)?.toInstant().toString()).toBe(
      "2026-05-30T00:00:00Z",
    )
    expect(grid.getDateFromRowCol(1, 0)?.toInstant().toString()).toBe(
      "2026-05-30T00:15:00Z",
    )
    expect(grid.getDateFromRowCol(15, 1)?.toInstant().toString()).toBe(
      "2026-05-31T03:45:00Z",
    )
  })

  it("keeps wrapped UTC+3:30 rows continuous and owned by their header date", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-6",
      shortId: "grid-wrap-split-gap",
      name: "Wrapped half-hour offset",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-19"),
        Temporal.PlainDate.from("2026-05-20"),
      ],
      timeSeed: zdt("2026-05-19T19:30:00Z"),
      startTime: Temporal.PlainTime.from("19:30"),
      duration: Temporal.Duration.from({ hours: 8 }),
      hasSpecificTimes: false,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.THIRTY_MINUTES,
      creatorPosthogId: "creator-6",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "+03:30",
        offset: Temporal.Duration.from({ minutes: -210 }),
        label: "UTC+3:30",
        gmtString: "GMT+3:30",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value[0]).not.toHaveLength(0)
    expect(grid.splitTimes.value[1]).toEqual([])
    expect(grid.splitTimes.value[0][0]?.text).toBe("12 am")
    expect(grid.splitTimes.value[0][0]?.absoluteMinutes).toBe(0)
    expect(grid.splitTimes.value[0].at(-1)?.absoluteMinutes).toBe(
      23 * 60 + 30,
    )

    const totalRows =
      grid.splitTimes.value[0].length + grid.splitTimes.value[1].length

    for (let dayIndex = 0; dayIndex < grid.days.value.length; dayIndex += 1) {
      const headerDate = grid.days.value[dayIndex]?.dateObject
        .withTimeZone("+03:30")
        .toPlainDate()
        .toString()
      expect(headerDate).toBeDefined()

      for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
        const slot = grid.getDateFromDayTimeIndex(dayIndex, rowIndex)
        if (!slot) continue
        expect(slot.withTimeZone("+03:30").toPlainDate().toString()).toBe(
          headerDate,
        )
      }
    }

    expect(grid.getDateFromDayTimeIndex(0, 0)).toBeNull()
    expect(
      grid
        .getDateFromDayTimeIndex(1, 0)
        ?.withTimeZone("+03:30")
        .toPlainTime()
        .toString(),
    ).toBe("00:00:00")
    expect(
      grid
        .getDateFromDayTimeIndex(1, 2)
        ?.withTimeZone("+03:30")
        .toPlainTime()
        .toString(),
    ).toBe("01:00:00")
    expect(
      grid
        .getDateFromDayTimeIndex(1, 4)
        ?.withTimeZone("+03:30")
        .toPlainTime()
        .toString(),
    ).toBe("02:00:00")
  })

  it("merges wrapped UTC+4:00 rows when the displayed local-day ranges only touch", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-6b",
      shortId: "grid-wrap-touching-no-gap",
      name: "Wrapped touching UTC+4",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-19"),
        Temporal.PlainDate.from("2026-05-20"),
      ],
      timeSeed: zdt("2026-05-19T21:00:00Z"),
      startTime: Temporal.PlainTime.from("21:00"),
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: false,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.ONE_HOUR,
      creatorPosthogId: "creator-6b",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "+04:00",
        offset: Temporal.Duration.from({ hours: -4 }),
        label: "UTC+4:00",
        gmtString: "GMT+4:00",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value[1]).toEqual([])

    const displayedLabels = grid.splitTimes.value[0]
      .map((time) => time.text)
      .filter((label): label is string => Boolean(label))
    const displayedMinutes = grid.splitTimes.value[0]
      .map((time) => time.displayedMinutes)
      .filter((minutes): minutes is number => typeof minutes === "number")

    expect(displayedLabels.filter((label) => label === "12 am")).toHaveLength(1)
    expect(displayedLabels.filter((label) => label === "1 am")).toHaveLength(1)
    expect(new Set(displayedMinutes).size).toBe(displayedMinutes.length)
    expect(grid.splitTimes.value[0][0]?.displayedMinutes).toBe(0)
    expect(
      grid.splitTimes.value[0][grid.splitTimes.value[0].length - 1]
        ?.displayedMinutes,
    ).toBe(23 * 60)
  })

  it("merges overlapped wrapped Kathmandu rows into one non-duplicated local-day sequence", () => {
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-7",
      shortId: "grid-wrap-overlap-kathmandu",
      name: "Wrapped overlap Kathmandu",
      type: eventTypes.SPECIFIC_DATES,
      dates: [
        Temporal.PlainDate.from("2026-05-19"),
        Temporal.PlainDate.from("2026-05-20"),
      ],
      timeSeed: zdt("2026-05-18T18:30:00Z"),
      startTime: Temporal.PlainTime.from("18:30"),
      duration: Temporal.Duration.from({ hours: 25 }),
      hasSpecificTimes: false,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-7",
      remindees: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Asia/Kathmandu",
        offset: Temporal.Duration.from({ minutes: -345 }),
        label: "Asia/Kathmandu",
        gmtString: "GMT+5:45",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value[1]).toEqual([])

    const displayedLabels = grid.splitTimes.value[0]
      .map((time) => time.text)
      .filter((label): label is string => Boolean(label))

    expect(displayedLabels.filter((label) => label === "12 am")).toHaveLength(1)
    expect(displayedLabels.filter((label) => label === "1 am")).toHaveLength(1)
    expect(displayedLabels.filter((label) => label === "2 am")).toHaveLength(1)

    const displayedMinutes = grid.splitTimes.value[0]
      .map((time) => time.displayedMinutes)
      .filter((minutes): minutes is number => typeof minutes === "number")

    expect(new Set(displayedMinutes).size).toBe(displayedMinutes.length)
    expect(grid.splitTimes.value[0][0]?.displayedMinutes).toBe(0)
    expect(
      grid.splitTimes.value[0][grid.splitTimes.value[0].length - 1]
        ?.displayedMinutes,
    ).toBe(23 * 60 + 45)
  })

  it("maps create-flow specific-time display cells into the seeded enabled-slot domain even when the viewer timezone differs", () => {
    const schedule = buildEventEditorSchedule({
      daysOnly: false,
      daysOnlyType: eventTypes.SPECIFIC_DATES,
      selectedDateOption: "Specific dates",
      selectedDays: [
        Temporal.PlainDate.from("2026-05-28"),
        Temporal.PlainDate.from("2026-05-29"),
      ],
      selectedDaysOfWeek: [],
      startOnMonday: true,
      startTime: Temporal.PlainTime.from("09:00"),
      endTime: Temporal.PlainTime.from("11:00"),
      timezoneValue: UTC,
      timeIncrementMinutes: 15,
    })
    const draft = buildSpecificTimesCreateDraft({
      schedule,
      timeIncrementMinutes: 15,
    })
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-8",
      shortId: "grid-create-domain",
      name: "Create flow canonical domain",
      type: eventTypes.SPECIFIC_DATES,
      dates: draft.dates,
      timeSeed: draft.timeSeed,
      duration: draft.duration,
      hasSpecificTimes: true,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: Temporal.Duration.from({
        minutes: draft.timeIncrementMinutes,
      }),
      creatorPosthogId: "creator-8",
      remindees: [],
      enabledSlots: draft.enabledSlots,
      activeSlots: draft.activeSlots,
      eventTimezone: draft.eventTimezone,
      slotGeneration: draft.slotGeneration,
      timedRecurrence: draft.timedRecurrence,
      times: [],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Belgrade",
        offset: Temporal.Duration.from({ hours: -2 }),
        label: "Europe/Belgrade",
        gmtString: "GMT+2",
      }),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    const selectedSlots = [
      grid.getDisplayDateFromRowCol(36, 0),
      grid.getDisplayDateFromRowCol(37, 0),
      grid.getDisplayDateFromRowCol(36, 1),
    ]

    expect(selectedSlots.every((slot) => slot != null)).toBe(true)
    expect(selectedSlots.map((slot) => slot?.toInstant().toString())).toEqual([
      "2026-05-28T07:00:00Z",
      "2026-05-28T07:15:00Z",
      "2026-05-29T07:00:00Z",
    ])

    const normalized = normalizeActiveSlots({
      enabledSlots: draft.enabledSlots,
      activeSlots: selectedSlots.filter(
        (slot): slot is Temporal.ZonedDateTime => slot != null,
      ),
    })

    expect(
      normalized.activeSlots.map((slot) => slot.toInstant().toString()),
    ).toEqual([
      "2026-05-28T07:00:00Z",
      "2026-05-28T07:15:00Z",
      "2026-05-29T07:00:00Z",
    ])
    expect(grid.getDateFromRowCol(36, 0)?.toInstant().toString()).toBe(
      "2026-05-28T07:00:00Z",
    )
  })

  it("moves specific-times edit slots to their display-date columns while preserving enabled grey cells", () => {
    const schedule = buildEventEditorSchedule({
      daysOnly: false,
      daysOnlyType: eventTypes.SPECIFIC_DATES,
      selectedDateOption: "Specific dates",
      selectedDays: [
        Temporal.PlainDate.from("2026-06-24"),
        Temporal.PlainDate.from("2026-06-25"),
      ],
      selectedDaysOfWeek: [],
      startOnMonday: true,
      startTime: Temporal.PlainTime.from("09:00"),
      endTime: Temporal.PlainTime.from("17:00"),
      timezoneValue: "America/Los_Angeles",
      timeIncrementMinutes: 60,
    })
    const draft = buildSpecificTimesCreateDraft({
      schedule,
      timeIncrementMinutes: 60,
    })
    const activeSlots = (draft.enabledSlots ?? []).filter((slot) => {
      const instant = slot.toInstant().toString()
      return (
        instant === "2026-06-24T16:00:00Z" || instant === "2026-06-25T23:00:00Z"
      )
    })
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-9",
      shortId: "grid-edit-domain-membership-tz",
      name: "Edit flow canonical domain",
      type: eventTypes.SPECIFIC_DATES,
      dates: draft.dates,
      timeSeed: draft.timeSeed,
      duration: draft.duration,
      hasSpecificTimes: true,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: Temporal.Duration.from({
        minutes: draft.timeIncrementMinutes,
      }),
      creatorPosthogId: "creator-9",
      remindees: [],
      enabledSlots: draft.enabledSlots,
      activeSlots,
      eventTimezone: draft.eventTimezone,
      slotGeneration: draft.slotGeneration,
      timedRecurrence: draft.timedRecurrence,
      times: [...activeSlots],
    })

    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Europe/Belgrade",
        offset: Temporal.Duration.from({ hours: -2 }),
        label: "Europe/Belgrade",
        gmtString: "GMT+2",
      }),
      state: ref(states.SET_SPECIFIC_TIMES),
      isPhone: ref(false),
    })

    expect(
      grid.days.value.map((day) => day.dateObject.toPlainDate().toString()),
    ).toEqual(["2026-06-24", "2026-06-25", "2026-06-26"])
    expect(grid.getDateFromRowCol(18, 0)?.toInstant().toString()).toBe(
      "2026-06-24T16:00:00Z",
    )
    expect(grid.getDateFromRowCol(19, 0)?.toInstant().toString()).toBe(
      "2026-06-24T17:00:00Z",
    )
    expect(grid.getDateFromRowCol(1, 2)?.toInstant().toString()).toBe(
      "2026-06-25T23:00:00Z",
    )
    expect(grid.getDateFromRowCol(2, 2)?.toInstant().toString()).toBe(
      "2026-06-26T00:00:00Z",
    )

    const greySlot = grid.getDateFromRowCol(19, 0)
    const selectedSlot = grid.getDateFromRowCol(18, 0)
    expect(greySlot).not.toBeNull()
    expect(selectedSlot).not.toBeNull()
    if (!greySlot || !selectedSlot) {
      throw new Error("Expected enabled and selected specific-times edit slots")
    }
    expect(grid.specificTimesSet.value.has(greySlot)).toBe(false)
    expect(grid.specificTimesSet.value.has(selectedSlot)).toBe(true)

    const normalized = normalizeActiveSlots({
      enabledSlots: draft.enabledSlots,
      activeSlots: [...activeSlots, greySlot],
    })

    expect(
      normalized.enabledSlots.map((slot) => slot.toInstant().toString()),
    ).toEqual(draft.enabledSlots?.map((slot) => slot.toInstant().toString()))
    expect(
      normalized.activeSlots.map((slot) => slot.toInstant().toString()),
    ).toEqual([
      "2026-06-24T16:00:00Z",
      "2026-06-24T17:00:00Z",
      "2026-06-25T23:00:00Z",
    ])
  })

  it("retains enabled specific-time rows outside a sparse active subset in GMT+5:30", () => {
    const eventTimezone = "Asia/Yekaterinburg"
    const selectedDays = ["2026-08-12", "2026-08-13"]
    const enabledSlots = selectedDays.flatMap((day) =>
      Array.from({ length: 96 }, (_, index) =>
        Temporal.ZonedDateTime.from({
          timeZone: eventTimezone,
          year: Number(day.slice(0, 4)),
          month: Number(day.slice(5, 7)),
          day: Number(day.slice(8, 10)),
          hour: Math.floor(index / 4),
          minute: (index % 4) * 15,
        }),
      ),
    )
    const event = ref<ScheduleOverlapEvent>({
      _id: "evt-enabled-coverage",
      shortId: "enabled-coverage",
      name: "Enabled coverage",
      type: eventTypes.SPECIFIC_DATES,
      dates: selectedDays.map((day) => Temporal.PlainDate.from(day)),
      timeSeed: enabledSlots[0],
      duration: Temporal.Duration.from({ hours: 24 }),
      hasSpecificTimes: true,
      notificationsEnabled: false,
      blindAvailabilityEnabled: false,
      daysOnly: false,
      sendEmailAfterXResponses: -1,
      collectEmails: false,
      startOnMonday: true,
      timeIncrement: durations.FIFTEEN_MINUTES,
      creatorPosthogId: "creator-enabled-coverage",
      remindees: [],
      enabledSlots,
      activeSlots: enabledSlots.filter((slot) => {
        const time = slot.toPlainTime().toString()
        return time === "01:15:00" || time === "08:30:00"
      }),
      eventTimezone,
      slotGeneration: {
        startTimeLocal: Temporal.PlainTime.from("00:00"),
        endTimeLocal: Temporal.PlainTime.from("00:00"),
        timeIncrement: durations.FIFTEEN_MINUTES,
      },
      timedRecurrence: {
        kind: "specific_dates",
        selectedDays: selectedDays.map((day) => Temporal.PlainDate.from(day)),
      },
    })
    const grid = useCalendarGrid({
      event,
      weekOffset: ref(0),
      curTimezone: ref({
        value: "Asia/Kolkata",
        offset: Temporal.Duration.from({ minutes: -330 }),
        label: "Asia/Kolkata",
        gmtString: "GMT+5:30",
      }),
      state: ref(states.HEATMAP),
      isPhone: ref(false),
    })

    expect(grid.splitTimes.value.flat()).toHaveLength(96)
    expect(grid.getDisplayDateFromRowCol(1, 1)?.toInstant().toString()).toBe(
      "2026-08-12T18:45:00Z",
    )
    expect(grid.getDateFromRowCol(1, 1)).toBeNull()
  })
})
