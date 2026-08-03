import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  type ComputedRef,
  type Ref,
} from "vue"
import type { RowCol } from "@/composables/schedule_overlap/types"

export interface TooltipPositionOverride {
  x: number
  y: number
  placement?: "above" | "below"
}

interface UseTimedGridInteractionsOptions {
  isPhone: ComputedRef<boolean>
  daysOnly: ComputedRef<boolean>
  interactable: ComputedRef<boolean>
  dragging: Ref<boolean>
  dragCur: Ref<RowCol | null>
  timeslotSelected: Ref<boolean>
  tooltipContent: Ref<string>
  startDrag: (event: PointerEvent | MouseEvent) => void
  moveDrag: (event: PointerEvent | MouseEvent) => void
  endDrag: (event?: PointerEvent | MouseEvent) => void
  showAvailability: (row: number, col: number) => void
  shouldHighlightAvailability: () => boolean
  highlightAvailability: () => void
  getTooltipContent: (row: number, col: number) => string | undefined
  document?: Document
}

export function useTimedGridInteractions(opts: UseTimedGridInteractionsOptions) {
  const selectedTooltipSlot = ref<RowCol | null>(null)
  const tooltipPosition = ref<TooltipPositionOverride | null>(null)
  const documentRef = opts.document ?? globalThis.document
  const visibleTooltipContent = computed(() =>
    !opts.isPhone.value || selectedTooltipSlot.value
      ? opts.tooltipContent.value
      : ""
  )

  const setTooltipForRowCol = (row: number, col: number) => {
    const content = opts.getTooltipContent(row, col)
    if (content !== undefined) opts.tooltipContent.value = content
  }

  const getTimedGridSlotFromEvent = (
    event: PointerEvent | MouseEvent
  ): RowCol | null => {
    const getSlotFromElement = (element: Element | null): RowCol | null => {
      const cell = element?.closest<HTMLElement>(
        "#drag-section .timeslot[data-row][data-col]"
      )
      if (!cell) return null

      const row = Number.parseInt(cell.dataset.row ?? "", 10)
      const col = Number.parseInt(cell.dataset.col ?? "", 10)
      return Number.isFinite(row) && Number.isFinite(col) ? { row, col } : null
    }

    const targetSlot = getSlotFromElement(
      event.target instanceof Element ? event.target : null
    )
    return targetSlot ?? getSlotFromElement(
      documentRef.elementFromPoint(event.clientX, event.clientY)
    )
  }

  const updateSelectedTooltipSlot = (event: PointerEvent | MouseEvent) => {
    if (!opts.isPhone.value || !opts.dragging.value || !opts.dragCur.value) {
      return
    }

    const slot = getTimedGridSlotFromEvent(event)
    if (
      slot?.row === opts.dragCur.value.row &&
      slot.col === opts.dragCur.value.col
    ) {
      selectedTooltipSlot.value = slot
    }
  }

  const setTooltipPositionForSelectedSlot = () => {
    const selectedSlot = selectedTooltipSlot.value
    if (!selectedSlot) return

    const cell = documentRef.querySelector<HTMLElement>(
      `#drag-section .timeslot[data-row="${String(selectedSlot.row)}"][data-col="${String(selectedSlot.col)}"]`
    )
    if (!cell) return

    const { left, top, width, height } = cell.getBoundingClientRect()
    const placement = top < 100 ? "below" : "above"
    tooltipPosition.value = {
      x: left + width / 2,
      y: placement === "above" ? top : top + height,
      placement,
    }
  }

  const setTooltipPositionForDrag = (event: PointerEvent | MouseEvent) => {
    if (opts.isPhone.value) {
      setTooltipPositionForSelectedSlot()
      return
    }

    tooltipPosition.value = { x: event.clientX, y: event.clientY }
  }

  const dismissMobileTooltipOnOutsideGridClick = (event: MouseEvent) => {
    if (
      !opts.isPhone.value ||
      !selectedTooltipSlot.value ||
      (event.target instanceof Element && event.target.closest("#drag-section"))
    ) {
      return
    }
    selectedTooltipSlot.value = null
    tooltipPosition.value = null
    opts.tooltipContent.value = ""
  }

  const startTimedGridDrag = (event: PointerEvent | MouseEvent) => {
    opts.startDrag(event)
    updateSelectedTooltipSlot(event)
    setTooltipPositionForDrag(event)
    if (!opts.daysOnly.value && selectedTooltipSlot.value) {
      setTooltipForRowCol(
        selectedTooltipSlot.value.row,
        selectedTooltipSlot.value.col
      )
    }
  }

  const moveTimedGridDrag = (event: PointerEvent | MouseEvent) => {
    opts.moveDrag(event)
    setTooltipPositionForDrag(event)
    const tooltipSlot = opts.isPhone.value
      ? selectedTooltipSlot.value
      : opts.dragCur.value
    if (opts.dragging.value && !opts.daysOnly.value && tooltipSlot) {
      setTooltipForRowCol(tooltipSlot.row, tooltipSlot.col)
    }
  }

  const endTimedGridDrag = (event?: PointerEvent | MouseEvent) => {
    const tooltipSlot = opts.isPhone.value
      ? selectedTooltipSlot.value
      : opts.dragCur.value
    if (!opts.daysOnly.value && tooltipSlot) {
      setTooltipForRowCol(tooltipSlot.row, tooltipSlot.col)
    }
    if (event) setTooltipPositionForDrag(event)
    opts.endDrag(event)
  }

  const getTimeslotVon = (row: number, col: number): Record<string, () => void> => {
    if (!opts.interactable.value) return {}
    return {
      click: () => {
        opts.showAvailability(row, col)
        if (opts.isPhone.value && !opts.daysOnly.value) {
          selectedTooltipSlot.value = { row, col }
          setTooltipPositionForSelectedSlot()
          setTooltipForRowCol(row, col)
        }
      },
      mousedown: () => {
        if (opts.shouldHighlightAvailability()) opts.highlightAvailability()
      },
      mouseover: () => {
        if (!opts.timeslotSelected.value) {
          opts.showAvailability(row, col)
          if (!opts.daysOnly.value) setTooltipForRowCol(row, col)
        }
      },
      mouseleave: () => {
        if (opts.isPhone.value && selectedTooltipSlot.value) return
        tooltipPosition.value = null
        opts.tooltipContent.value = ""
      },
    }
  }

  onMounted(() => {
    documentRef.addEventListener("click", dismissMobileTooltipOnOutsideGridClick, true)
  })

  onBeforeUnmount(() => {
    documentRef.removeEventListener("click", dismissMobileTooltipOnOutsideGridClick, true)
  })

  return {
    selectedTooltipSlot,
    tooltipPosition,
    visibleTooltipContent,
    getTimeslotVon,
    startTimedGridDrag,
    moveTimedGridDrag,
    endTimedGridDrag,
    updateSelectedTooltipSlot,
  }
}
