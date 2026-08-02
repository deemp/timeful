import { Temporal } from "temporal-polyfill"
import { UTC } from "@/constants"
import { getWrappedTimeRangeDuration, processEvent } from "@/utils"
import type { Event } from "@/types"
import {
  generateTimedSlotsForDay,
  getTimedRecurrence,
  getTimedSlotGeneration,
  hasCanonicalTimedSlots,
  mergeActiveSlotsByMembershipDay,
  normalizeActiveSlots,
  timedRecurrenceKindToEventType,
} from "@/utils/timedEventSlots"
import type { EventEditorScheduleResult } from "./eventEditorSchedule"

export interface SpecificTimesEditDraft {
  dates?: Temporal.PlainDate[]
  timeSeed?: Temporal.ZonedDateTime
  duration?: Temporal.Duration
  enabledSlots?: Temporal.ZonedDateTime[]
  activeSlots?: Temporal.ZonedDateTime[]
  eventTimezone?: string
  timedRecurrence?: Event["timedRecurrence"]
  slotGeneration?: Event["slotGeneration"]
  timeIncrementMinutes: number
  resetExistingTimes?: boolean
}

const timeIncrementMatches = (
  event: Event,
  timeIncrementMinutes: number,
): boolean =>
  Math.round(getTimedSlotGeneration(event).timeIncrement.total("minutes")) ===
  timeIncrementMinutes

const slotGenerationMatches = (
  event: Event,
  schedule: EventEditorScheduleResult,
): boolean => {
  const eventSlotGeneration = getTimedSlotGeneration(event)
  return (
    eventSlotGeneration.startTimeLocal.equals(
      schedule.slotGeneration.startTimeLocal,
    ) &&
    eventSlotGeneration.endTimeLocal.equals(
      schedule.slotGeneration.endTimeLocal,
    ) &&
    eventSlotGeneration.timeIncrement.total("minutes") ===
      schedule.slotGeneration.timeIncrement.total("minutes")
  )
}

const hasCanonicalTimedState = (event: Event): boolean =>
  !event.daysOnly &&
  (hasCanonicalTimedSlots(event) ||
    event.eventTimezone != null ||
    event.slotGeneration != null ||
    event.timedRecurrence != null)

const fullDaySpecificTimesSchedule = (
  schedule: EventEditorScheduleResult,
  timeIncrementMinutes: number,
) => {
  const slotGeneration = {
    startTimeLocal: Temporal.PlainTime.from("00:00"),
    endTimeLocal: Temporal.PlainTime.from("00:00"),
    timeIncrement: Temporal.Duration.from({ minutes: timeIncrementMinutes }),
  }
  const membershipDays =
    schedule.timedRecurrence.kind === "specific_dates"
      ? schedule.normalizedSelectedDays
      : schedule.dates.map((date) =>
          date.withTimeZone(schedule.eventTimezone).toPlainDate(),
        )
  const enabledSlots = membershipDays.flatMap((day) =>
    generateTimedSlotsForDay({
      day,
      timeZone: schedule.eventTimezone,
      slotGeneration,
    }),
  )

  return {
    ...schedule,
    duration: Temporal.Duration.from({ days: 1 }),
    enabledSlots,
    activeSlots: enabledSlots,
    slotGeneration,
  }
}

export const buildSpecificTimesEditDraft = ({
  event,
  schedule,
  timeIncrementMinutes,
  specificTimesEnabled,
}: {
  event?: Event
  schedule: EventEditorScheduleResult
  timeIncrementMinutes: number
  specificTimesEnabled: boolean
}): SpecificTimesEditDraft | undefined => {
  if (!event) {
    return undefined
  }

  const preservedTimedRecurrence =
    schedule.timedRecurrence.kind === "weekly" &&
    schedule.timedRecurrence.selectedDays.length === 0
      ? {
          ...schedule.timedRecurrence,
          selectedDays: getTimedRecurrence(event).selectedDays,
        }
      : schedule.timedRecurrence
  const slotWindowMatches =
    timeIncrementMatches(event, timeIncrementMinutes) &&
    slotGenerationMatches(event, schedule)
  if (!specificTimesEnabled) {
    const normalizedSlots = normalizeActiveSlots({
      enabledSlots: schedule.enabledSlots,
      activeSlots: schedule.enabledSlots,
    })

    return {
      dates: [...schedule.normalizedSelectedDays],
      timeSeed: schedule.dates[0]?.withTimeZone(UTC),
      duration: schedule.duration,
      enabledSlots: normalizedSlots.enabledSlots,
      activeSlots: normalizedSlots.activeSlots,
      eventTimezone: schedule.eventTimezone,
      timedRecurrence: preservedTimedRecurrence,
      slotGeneration: schedule.slotGeneration,
      timeIncrementMinutes,
      resetExistingTimes: false,
    }
  }

  const resetExistingTimes =
    !hasCanonicalTimedState(event) || !slotWindowMatches
  const specificTimesSchedule = fullDaySpecificTimesSchedule(
    {
      ...schedule,
      timedRecurrence: preservedTimedRecurrence,
    },
    timeIncrementMinutes,
  )
  const nextActiveSlots = resetExistingTimes
    ? []
    : mergeActiveSlotsByMembershipDay({
        priorEnabledSlots:
          event.enabledSlots ?? event.activeSlots ?? event.times,
        priorActiveSlots:
          event.activeSlots ?? event.times ?? schedule.activeSlots,
        nextEnabledSlots: specificTimesSchedule.enabledSlots,
        timeZone: specificTimesSchedule.eventTimezone,
        slotGeneration: specificTimesSchedule.slotGeneration,
        priorMembershipDays:
          getTimedRecurrence(event).kind === "specific_dates"
            ? getTimedRecurrence(event).selectedDays
            : undefined,
        nextMembershipDays:
          preservedTimedRecurrence.kind === "specific_dates"
            ? specificTimesSchedule.normalizedSelectedDays
            : undefined,
      })
  const normalizedSlots = normalizeActiveSlots({
    enabledSlots: specificTimesSchedule.enabledSlots,
    activeSlots: nextActiveSlots,
  })

  return {
    dates: [...schedule.normalizedSelectedDays],
    timeSeed: schedule.dates[0]?.withTimeZone(UTC),
    duration: specificTimesSchedule.duration,
    enabledSlots: normalizedSlots.enabledSlots,
    activeSlots: normalizedSlots.activeSlots,
    eventTimezone: specificTimesSchedule.eventTimezone,
    timedRecurrence:
      preservedTimedRecurrence.kind === "specific_dates"
        ? {
            ...preservedTimedRecurrence,
            selectedDays: specificTimesSchedule.normalizedSelectedDays,
          }
        : preservedTimedRecurrence,
    slotGeneration: specificTimesSchedule.slotGeneration,
    timeIncrementMinutes,
    resetExistingTimes,
  }
}

export const buildSpecificTimesCreateDraft = ({
  schedule,
  timeIncrementMinutes,
}: {
  schedule: EventEditorScheduleResult
  timeIncrementMinutes: number
}): SpecificTimesEditDraft => {
  const specificTimesSchedule = fullDaySpecificTimesSchedule(
    schedule,
    timeIncrementMinutes,
  )

  return {
    dates: [...specificTimesSchedule.normalizedSelectedDays],
    timeSeed: specificTimesSchedule.dates[0]?.withTimeZone(UTC),
    duration: specificTimesSchedule.duration,
    enabledSlots: [...specificTimesSchedule.enabledSlots],
    activeSlots: [],
    eventTimezone: specificTimesSchedule.eventTimezone,
    timedRecurrence: specificTimesSchedule.timedRecurrence,
    slotGeneration: specificTimesSchedule.slotGeneration,
    timeIncrementMinutes,
    resetExistingTimes: true,
  }
}

export const applySpecificTimesEditDraft = ({
  event,
  draft,
}: {
  event: Event
  draft: SpecificTimesEditDraft
}): Event => {
  const normalizedSlots = normalizeActiveSlots({
    enabledSlots: draft.enabledSlots ?? event.enabledSlots,
    activeSlots: draft.activeSlots ?? event.activeSlots ?? event.times,
  })
  const nextEvent: Event = {
    ...event,
    type:
      draft.timedRecurrence != null
        ? timedRecurrenceKindToEventType(draft.timedRecurrence.kind)
        : event.type,
    dates: draft.timedRecurrence?.selectedDays ?? draft.dates,
    timeSeed:
      draft.enabledSlots?.[0]?.withTimeZone(UTC) ??
      draft.timeSeed ??
      event.timeSeed,
    duration:
      scheduleDurationFromSlotGeneration(draft.slotGeneration) ??
      draft.duration ??
      event.duration,
    timeIncrement: Temporal.Duration.from({
      minutes: draft.timeIncrementMinutes,
    }),
    enabledSlots: normalizedSlots.enabledSlots,
    activeSlots: normalizedSlots.activeSlots,
    eventTimezone: draft.eventTimezone ?? event.eventTimezone,
    slotGeneration: draft.slotGeneration ?? event.slotGeneration,
    timedRecurrence: draft.timedRecurrence ?? event.timedRecurrence,
    times: draft.resetExistingTimes === true ? [] : normalizedSlots.activeSlots,
  }

  processEvent(nextEvent)

  return nextEvent
}

const scheduleDurationFromSlotGeneration = (
  slotGeneration: Event["slotGeneration"],
): Temporal.Duration | undefined =>
  slotGeneration?.startTimeLocal != null && slotGeneration.endTimeLocal != null
    ? getWrappedTimeRangeDuration(
        slotGeneration.startTimeLocal,
        slotGeneration.endTimeLocal,
      )
    : undefined
