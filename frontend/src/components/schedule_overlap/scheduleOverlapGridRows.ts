import type {
  RenderedTimeGridRow,
  RenderedTimeGridRowCell,
  TimeItem,
} from "@/composables/schedule_overlap/types"
import {
  COLLAPSED_HOURS_ROW_HEIGHT,
  MIN_COLLAPSIBLE_HIDDEN_SPAN_HOURS,
} from "@/composables/schedule_overlap/types"

export interface PageSlot {
  id: string
  kind: "timeslot" | "filler"
  startMinutes: number
  endMinutes: number
  baseRowIndex?: number
}

export interface CollapsedPageSegment {
  id: string
  hiddenStartIndex: number
  hiddenEndIndex: number
  startMinutes: number
  endMinutes: number
}

export function formatAbsoluteMinutes(absoluteMinutes: number | undefined): string {
  if (typeof absoluteMinutes !== "number") return ""

  const normalizedMinutes = ((absoluteMinutes % (24 * 60)) + 24 * 60) % (24 * 60)
  const hours = Math.floor(normalizedMinutes / 60)
  const minutes = normalizedMinutes % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

export function buildPageSlots(
  splitTimes: TimeItem[][],
  timeslotMinutes: number
): PageSlot[] {
  const firstSplitLength = splitTimes[0]?.length ?? 0
  return splitTimes.flatMap((times, splitIndex) =>
    times.map((time, index) => {
      const baseRowIndex = splitIndex === 0 ? index : firstSplitLength + index
      const startMinutes = time.absoluteMinutes ?? 0
      return {
        id: `time-${String(baseRowIndex)}`,
        kind: "timeslot" as const,
        startMinutes,
        endMinutes: startMinutes + timeslotMinutes,
        baseRowIndex,
      }
    })
  )
}

export function getPageGreyFlags(
  pageSlots: PageSlot[],
  isBaseRowInactiveOnEveryVisibleDay: (baseRowIndex: number) => boolean
): boolean[] {
  return pageSlots.map((slot) =>
    slot.kind === "filler"
      ? true
      : isBaseRowInactiveOnEveryVisibleDay(slot.baseRowIndex ?? -1)
  )
}

export function buildCollapsedPageSegments({
  canCollapseTimes,
  pageSlots,
  pageGreyFlags,
  timeslotMinutes,
}: {
  canCollapseTimes: boolean
  pageSlots: PageSlot[]
  pageGreyFlags: boolean[]
  timeslotMinutes: number
}): CollapsedPageSegment[] {
  if (!canCollapseTimes) return []

  const minimumSlotsToCollapse = Math.ceil(
    (MIN_COLLAPSIBLE_HIDDEN_SPAN_HOURS * 60) / timeslotMinutes
  )
  const segments: CollapsedPageSegment[] = []

  const flushRun = (runStartIndex: number | null, runEndIndex: number) => {
    if (runStartIndex == null) return

    const runStartMinutes = pageSlots[runStartIndex]?.startMinutes
    const runEndMinutes = pageSlots[runEndIndex - 1]?.endMinutes
    if (typeof runStartMinutes !== "number" || typeof runEndMinutes !== "number") return

    const collapsedStartMinutes = Math.ceil(runStartMinutes / 60) * 60
    const collapsedEndMinutes = Math.floor(runEndMinutes / 60) * 60
    if (collapsedEndMinutes <= collapsedStartMinutes) return

    const hiddenStartIndex = pageSlots.findIndex(
      (slot, index) =>
        index >= runStartIndex &&
        index < runEndIndex &&
        slot.startMinutes === collapsedStartMinutes
    )
    const hiddenEndIndex = pageSlots.findIndex(
      (slot, index) =>
        index >= runStartIndex &&
        index < runEndIndex &&
        slot.endMinutes === collapsedEndMinutes
    )
    if (
      hiddenStartIndex === -1 ||
      hiddenEndIndex === -1 ||
      hiddenEndIndex + 1 - hiddenStartIndex < minimumSlotsToCollapse
    ) {
      return
    }

    segments.push({
      id: `collapsed-${String(collapsedStartMinutes)}-${String(collapsedEndMinutes)}`,
      hiddenStartIndex,
      hiddenEndIndex: hiddenEndIndex + 1,
      startMinutes: collapsedStartMinutes,
      endMinutes: collapsedEndMinutes,
    })
  }

  let runStartIndex: number | null = null
  for (let index = 0; index < pageSlots.length; index += 1) {
    if (pageGreyFlags[index]) {
      runStartIndex ??= index
    } else {
      flushRun(runStartIndex, index)
      runStartIndex = null
    }
  }
  flushRun(runStartIndex, pageSlots.length)

  return segments
}

export function buildRenderedTimeGridRows({
  pageSlots,
  collapsedPageSegments,
  expandedCollapsedSpanIds,
  timeslotHeight,
  visibleDayCount,
  getTimeItem,
  getCell,
  formatTime,
}: {
  pageSlots: PageSlot[]
  collapsedPageSegments: CollapsedPageSegment[]
  expandedCollapsedSpanIds: Set<string>
  timeslotHeight: number
  visibleDayCount: number
  getTimeItem: (baseRowIndex: number) => TimeItem
  getCell: (baseRowIndex: number, dayIndex: number) => RenderedTimeGridRowCell
  formatTime: (absoluteMinutes: number) => string
}): RenderedTimeGridRow[] {
  const rows: RenderedTimeGridRow[] = []
  const collapsedSegmentByStartIndex = new Map<number, CollapsedPageSegment>()
  for (const segment of collapsedPageSegments) {
    if (!expandedCollapsedSpanIds.has(segment.id)) {
      collapsedSegmentByStartIndex.set(segment.hiddenStartIndex, segment)
    }
  }

  let rowTop = 0
  for (let slotIndex = 0; slotIndex < pageSlots.length; slotIndex += 1) {
    const collapsedSegment = collapsedSegmentByStartIndex.get(slotIndex)
    if (collapsedSegment) {
      rows.push({
        id: collapsedSegment.id,
        kind: "collapsed",
        height: COLLAPSED_HOURS_ROW_HEIGHT,
        rowTop,
        timeText: formatTime(collapsedSegment.startMinutes),
        startLabel: formatTime(collapsedSegment.startMinutes),
        endLabel: formatTime(collapsedSegment.endMinutes),
      })
      rowTop += COLLAPSED_HOURS_ROW_HEIGHT
      slotIndex = collapsedSegment.hiddenEndIndex - 1
      continue
    }

    const slot = pageSlots[slotIndex]
    if (slot.kind !== "timeslot" || typeof slot.baseRowIndex !== "number") continue

    const baseRowIndex = slot.baseRowIndex
    const timeItem = getTimeItem(baseRowIndex)
    rows.push({
      id: slot.id,
      kind: "timeslot",
      height: timeslotHeight,
      rowTop,
      timeText:
        (timeItem.text?.match(/ [+-]\d{2}:\d{2}$/) ? timeItem.text : undefined) ??
        (typeof timeItem.absoluteMinutes === "number" && timeItem.absoluteMinutes % 60 === 0
          ? formatTime(timeItem.absoluteMinutes)
          : undefined),
      baseRowIndex,
      cells: Array.from({ length: visibleDayCount }, (_, dayIndex) =>
        getCell(baseRowIndex, dayIndex)
      ),
    })
    rowTop += timeslotHeight
  }

  return rows
}

export function getTimeAxisEndText(
  pageSlots: PageSlot[],
  formatTime: (absoluteMinutes: number) => string
): string | undefined {
  const endMinutes = pageSlots.at(-1)?.endMinutes
  return typeof endMinutes === "number" && endMinutes % 60 === 0
    ? formatTime(endMinutes)
    : undefined
}
