import { computed, ref, watch } from "vue"
import type { ComputedRef, Ref } from "vue"
import type { Temporal } from "temporal-polyfill"
import type { AvailabilityType } from "@/constants"
import type { useAvailabilityData } from "@/composables/schedule_overlap/useAvailabilityData"
import type { useCalendarGrid } from "@/composables/schedule_overlap/useCalendarGrid"
import type { useDragPaint } from "@/composables/schedule_overlap/useDragPaint"
import type { useEventScheduling } from "@/composables/schedule_overlap/useEventScheduling"
import type { useScheduleOverlapUI } from "@/composables/schedule_overlap/useScheduleOverlapUI"
import {
  getScheduledEventFromDragRange,
  states,
  type RowCol,
  type ScheduleOverlapEvent,
  type ScheduleOverlapState,
} from "@/composables/schedule_overlap/types"
import {
  buildDayGridTimeslotClassStyles,
  buildOverlaidAvailability,
  buildRenderedOverlayAvailability,
  buildRenderedTimeBlockFragments,
  buildTimeGridTimeslotClassStyles,
  getTimeBlockStyle,
} from "./scheduleOverlapRendering"
import {
  buildCollapsedPageSegments,
  buildPageSlots,
  buildRenderedTimeGridRows,
  getPageGreyFlags,
  getTimeAxisEndText,
} from "./scheduleOverlapGridRows"

interface UseTimedGridPresentationOptions {
  event: ComputedRef<ScheduleOverlapEvent>
  state: Ref<ScheduleOverlapState>
  defaultState: ComputedRef<ScheduleOverlapState>
  isSignUp: ComputedRef<boolean>
  showAllHours: Ref<boolean>
  availabilityType: Ref<AvailabilityType>
  curGuestId: ComputedRef<string>
  authUserId: ComputedRef<string | undefined>
  animateTimeslotAlways: ComputedRef<boolean>
  availabilityAnimEnabled: Ref<boolean>
  curRespondentsMax: ComputedRef<number>
  dragging: Ref<boolean>
  dragStart: Ref<RowCol | null>
  dragCur: Ref<RowCol | null>
  getTimeslotVon: (row: number, col: number) => Record<string, () => void>
  grid: ReturnType<typeof useCalendarGrid>
  avail: ReturnType<typeof useAvailabilityData>
  drag: ReturnType<typeof useDragPaint>
  scheduling: ReturnType<typeof useEventScheduling>
  ui: ReturnType<typeof useScheduleOverlapUI>
}

export function useTimedGridPresentation(opts: UseTimedGridPresentationOptions) {
  const canCollapseTimes = computed(
    () =>
      !opts.event.value.daysOnly &&
      opts.state.value !== states.EDIT_SIGN_UP_BLOCKS &&
      opts.state.value !== states.SET_SPECIFIC_TIMES &&
      !opts.showAllHours.value
  )
  const pageSlots = computed(() =>
    buildPageSlots(
      opts.grid.splitTimes.value,
      Math.round(opts.grid.timeslotDuration.value.total("minutes"))
    )
  )
  const isBaseRowInactiveOnEveryVisibleDay = (baseRowIndex: number): boolean => {
    for (let dayIndex = 0; dayIndex < opts.grid.days.value.length; dayIndex += 1) {
      if (opts.grid.getDateFromRowCol(baseRowIndex, dayIndex)) return false
    }
    return true
  }
  const pageGreyFlags = computed(() =>
    getPageGreyFlags(pageSlots.value, isBaseRowInactiveOnEveryVisibleDay)
  )
  const collapsedPageSegments = computed(() =>
    buildCollapsedPageSegments({
      canCollapseTimes: canCollapseTimes.value,
      pageSlots: pageSlots.value,
      pageGreyFlags: pageGreyFlags.value,
      timeslotMinutes: Math.round(opts.grid.timeslotDuration.value.total("minutes")),
    })
  )
  const expandedCollapsedSpanIds = ref<Set<string>>(new Set())
  const collapseCandidateSpanIds = computed(
    () => new Set(collapsedPageSegments.value.map((segment) => segment.id))
  )

  const overlaidAvailabilityBlocks = computed(() =>
    buildOverlaidAvailability({
      daysLength: opts.grid.days.value.length,
      firstSplitTimes: opts.grid.splitTimes.value[0],
      secondSplitTimes: opts.grid.splitTimes.value[1],
      timeslotDuration: opts.grid.timeslotDuration.value,
      getDateFromRowCol: opts.grid.getDateFromRowCol,
      dragging: opts.dragging.value,
      inDragRange: opts.drag.inDragRange,
      dragType: opts.drag.dragType.value,
      availabilityType: opts.availabilityType.value,
      availability: opts.avail.availability.value,
      ifNeeded: opts.avail.ifNeeded.value,
    })
  )

  const baseTimeslotClassStyle = computed(() => {
    if (opts.isSignUp.value) {
      return Array.from(
        { length: opts.grid.days.value.length * opts.grid.times.value.length },
        () => ({ class: "tw-bg-light-gray ", style: {} })
      )
    }

    return buildTimeGridTimeslotClassStyles({
      firstSplitTimes: opts.grid.splitTimes.value[0],
      secondSplitTimes: opts.grid.splitTimes.value[1],
      getDateFromRowCol: opts.grid.getDateFromRowCol,
      getEnabledDateFromRowCol: opts.grid.getEnabledDateFromRowCol,
      getTimedCellState: (row, col) =>
        opts.grid.getTimedCellState(row, opts.grid.maxDaysPerPage.value * opts.grid.page.value + col),
      state: opts.state.value,
      overlayAvailability: opts.ui.overlayAvailability.value,
      dragType: opts.drag.dragType.value,
      availabilityType: opts.availabilityType.value,
      availability: opts.avail.availability.value,
      ifNeeded: opts.avail.ifNeeded.value,
      tempTimes: opts.avail.tempTimes.value,
      responsesFormatted: opts.avail.responsesFormatted.value,
      parsedResponses: opts.avail.parsedResponses.value,
      curRespondent: opts.ui.curRespondent.value,
      curRespondents: opts.ui.curRespondents.value,
      curRespondentsSet: opts.ui.curRespondentsSet.value,
      respondents: opts.avail.respondents.value,
      curRespondentsMax: opts.curRespondentsMax.value,
      max: opts.avail.max.value,
      defaultState: opts.defaultState.value,
      userHasResponded: opts.avail.userHasResponded.value,
      curGuestId: opts.curGuestId.value,
      authUserId: opts.authUserId.value,
      inDragRange: opts.drag.inDragRange,
      animateTimeslotAlways: opts.animateTimeslotAlways.value,
      availabilityAnimEnabled: opts.availabilityAnimEnabled.value,
      timeslotHeight: opts.grid.timeslotHeight.value,
      timezoneOffset: opts.grid.timezoneOffset.value,
      curTimeslot: opts.avail.curTimeslot.value,
      editing: opts.ui.editing.value,
      isColConsecutive: opts.grid.isColConsecutive,
      daysLength: opts.grid.days.value.length,
      firstSplitLength: opts.grid.splitTimes.value[0].length,
      lastRow: opts.grid.splitTimes.value[0].length + opts.grid.splitTimes.value[1].length - 1,
    })
  })

  const dayTimeslotClassStyle = computed(() =>
    buildDayGridTimeslotClassStyles({
      monthDays: opts.grid.monthDays.value.map((day) => day.dateObject),
      state: opts.state.value,
      overlayAvailability: opts.ui.overlayAvailability.value,
      dragType: opts.drag.dragType.value,
      availabilityType: opts.availabilityType.value,
      availability: opts.avail.availability.value,
      ifNeeded: opts.avail.ifNeeded.value,
      tempTimes: opts.avail.tempTimes.value,
      responsesFormatted: opts.avail.responsesFormatted.value,
      parsedResponses: opts.avail.parsedResponses.value,
      curRespondent: opts.ui.curRespondent.value,
      curRespondents: opts.ui.curRespondents.value,
      curRespondentsSet: opts.ui.curRespondentsSet.value,
      respondents: opts.avail.respondents.value,
      curRespondentsMax: opts.curRespondentsMax.value,
      max: opts.avail.max.value,
      defaultState: opts.defaultState.value,
      userHasResponded: opts.avail.userHasResponded.value,
      curGuestId: opts.curGuestId.value,
      authUserId: opts.authUserId.value,
      inDragRange: opts.drag.inDragRange,
      monthDayIncluded: opts.grid.monthDayIncluded.value,
      curTimeslot: opts.avail.curTimeslot.value,
      lastMonthRow: Math.floor(opts.grid.monthDays.value.length / 7),
    })
  )

  const baseTimeslotVon = computed(() => {
    const vons: Record<string, () => void>[] = []
    for (let day = 0; day < opts.grid.days.value.length; day += 1)
      for (let time = 0; time < opts.grid.times.value.length; time += 1)
        vons.push(opts.getTimeslotVon(time, day))
    return vons
  })

  const getBaseRowTimeItem = (baseRowIndex: number) => {
    const firstSplitLength = opts.grid.splitTimes.value[0].length
    return baseRowIndex < firstSplitLength
      ? opts.grid.splitTimes.value[0][baseRowIndex]
      : opts.grid.splitTimes.value[1][baseRowIndex - firstSplitLength]
  }
  const renderedRows = computed(() =>
    buildRenderedTimeGridRows({
      pageSlots: pageSlots.value,
      collapsedPageSegments: collapsedPageSegments.value,
      expandedCollapsedSpanIds: expandedCollapsedSpanIds.value,
      timeslotHeight: opts.grid.timeslotHeight.value,
      visibleDayCount: opts.grid.days.value.length,
      getTimeItem: getBaseRowTimeItem,
      getCell: (baseRowIndex, dayIndex) => {
        const cellIndex = dayIndex * opts.grid.times.value.length + baseRowIndex
        return {
          class: baseTimeslotClassStyle.value[cellIndex]?.class ?? "",
          style: baseTimeslotClassStyle.value[cellIndex]?.style ?? {},
          von: baseTimeslotVon.value[cellIndex] ?? {},
        }
      },
    })
  )
  const timeAxisEndText = computed(() => getTimeAxisEndText(pageSlots.value))
  const scheduledEventStyles = computed(() => {
    const scheduledEvent =
      opts.dragging.value && opts.dragStart.value && opts.dragCur.value
        ? getScheduledEventFromDragRange(opts.dragStart.value, opts.dragCur.value)
        : opts.scheduling.curScheduledEvent.value ?? opts.scheduling.savedScheduledEvent.value
    return scheduledEvent
      ? buildRenderedTimeBlockFragments({
          renderedRows: renderedRows.value,
          startBaseRowIndex: scheduledEvent.row,
          coveredBaseRowCount: scheduledEvent.numRows,
        })
      : []
  })
  const overlaidAvailability = computed(() =>
    buildRenderedOverlayAvailability({
      renderedRows: renderedRows.value,
      overlaidAvailability: overlaidAvailabilityBlocks.value,
      splitTimes: opts.grid.splitTimes.value,
      timeslotDuration: opts.grid.timeslotDuration.value,
      isBaseRowVisibleOnDay: (row, day) => opts.grid.getDateFromRowCol(row, day) !== null,
    })
  )
  const timeslotClassStyle = computed(() =>
    renderedRows.value.flatMap((row) =>
      row.cells?.map((cell) => ({ class: cell.class, style: cell.style })) ?? []
    )
  )
  const timeslotVon = computed(() =>
    renderedRows.value.flatMap((row) => row.cells?.map((cell) => cell.von) ?? [])
  )
  const dayTimeslotVon = computed(() =>
    opts.grid.monthDays.value.map((_day, index) =>
      opts.getTimeslotVon(Math.floor(index / 7), index % 7)
    )
  )

  watch(collapseCandidateSpanIds, (validIds) => {
    const nextIds = [...expandedCollapsedSpanIds.value].filter((id) => validIds.has(id))
    if (nextIds.length !== expandedCollapsedSpanIds.value.size) {
      expandedCollapsedSpanIds.value = new Set(nextIds)
    }
  })

  const updateShowAllHours = (value: boolean) => {
    opts.showAllHours.value = value
    if (value) expandedCollapsedSpanIds.value = new Set()
  }
  const toggleCollapsedSpan = (id: string) => {
    const next = new Set(expandedCollapsedSpanIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expandedCollapsedSpanIds.value = next
  }
  const getRenderedTimeBlockStyle = (timeBlock: {
    hoursOffset?: Temporal.Duration
    hoursLength?: Temporal.Duration
  }) => getTimeBlockStyle({ timeBlock, firstSplitTimes: opts.grid.splitTimes.value[0] })
  const getRenderedTimeBlockStyles = (timeBlock: {
    hoursOffset?: Temporal.Duration
    hoursLength?: Temporal.Duration
  }) => {
    const style = getRenderedTimeBlockStyle(timeBlock)
    const baseRowIndex = opts.grid.splitTimes.value.flat().findIndex(
      (time) => time.hoursOffset.total("minutes") === (timeBlock.hoursOffset?.total("minutes") ?? 0)
    )
    const coveredBaseRowCount = Math.round(
      (timeBlock.hoursLength?.total("minutes") ?? 0) /
        opts.grid.timeslotDuration.value.total("minutes")
    )
    return baseRowIndex === -1 || coveredBaseRowCount <= 0
      ? [style]
      : buildRenderedTimeBlockFragments({
          renderedRows: renderedRows.value,
          startBaseRowIndex: baseRowIndex,
          coveredBaseRowCount,
        })
  }

  return {
    dayTimeslotClassStyle,
    dayTimeslotVon,
    getRenderedTimeBlockStyle,
    getRenderedTimeBlockStyles,
    overlaidAvailability,
    renderedRows,
    scheduledEventStyles,
    timeAxisEndText,
    timeslotClassStyle,
    timeslotVon,
    toggleCollapsedSpan,
    updateShowAllHours,
  }
}
