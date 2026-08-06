// @vitest-environment happy-dom

import { computed, defineComponent, nextTick, ref } from "vue"
import { mount } from "@vue/test-utils"
import { afterEach, describe, expect, it, vi } from "vitest"
import { useTimedGridInteractions } from "./useTimedGridInteractions"
import { joinTooltipSegments } from "./scheduleOverlapRendering"

const mountedWrappers: ReturnType<typeof mount>[] = []

afterEach(() => {
  for (const wrapper of mountedWrappers.splice(0)) wrapper.unmount()
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

const mountInteractions = (phone = false) => {
  const isPhone = ref(phone)
  const dragging = ref(false)
  const dragCur = ref<{ row: number; col: number } | null>(null)
  const timeslotSelected = ref(false)
  const tooltipContent = ref<{ text: string; mono: boolean }[]>([])
  const showAvailability = vi.fn()
  const highlightAvailability = vi.fn()
  const startDrag = vi.fn(() => {
    dragging.value = true
    dragCur.value = { row: 1, col: 0 }
  })
  const moveDrag = vi.fn()
  const endDrag = vi.fn(() => {
    dragging.value = false
    dragCur.value = null
  })
  let interactions!: ReturnType<typeof useTimedGridInteractions>
  const Harness = defineComponent({
    setup() {
      interactions = useTimedGridInteractions({
        isPhone: computed(() => isPhone.value),
        daysOnly: computed(() => false),
        interactable: computed(() => true),
        dragging,
        dragCur,
        timeslotSelected,
        tooltipContent,
        startDrag,
        moveDrag,
        endDrag,
        showAvailability,
        shouldHighlightAvailability: () => true,
        highlightAvailability,
        getTooltipContent: (row, col) => [{ text: `slot-${String(row)}-${String(col)}`, mono: false }],
      })
      return () => null
    },
  })
  const wrapper = mount(Harness)
  mountedWrappers.push(wrapper)

  return {
    isPhone,
    dragging,
    dragCur,
    tooltipContent,
    showAvailability,
    highlightAvailability,
    startDrag,
    moveDrag,
    endDrag,
    interactions,
    wrapper,
  }
}

const appendSlot = (
  row: number,
  col: number,
  top: number | (() => number) = 80
) => {
  const cell = document.createElement("div")
  cell.className = "timeslot"
  cell.dataset.row = String(row)
  cell.dataset.col = String(col)
  cell.getBoundingClientRect = () =>
    ({
      left: 40,
      top: typeof top === "function" ? top() : top,
      width: 120,
      height: 20,
    }) as DOMRect
  const dragSection = document.querySelector("#drag-section") ?? document.createElement("div")
  dragSection.id = "drag-section"
  dragSection.append(cell)
  if (!dragSection.parentElement) document.body.append(dragSection)
  return cell
}

describe("useTimedGridInteractions", () => {
  it("registers and removes its outside-grid handler in capture phase", () => {
    const addEventListener = vi.spyOn(document, "addEventListener")
    const removeEventListener = vi.spyOn(document, "removeEventListener")
    const { wrapper } = mountInteractions(true)

    expect(addEventListener).toHaveBeenCalledWith("click", expect.any(Function), true)

    wrapper.unmount()
    mountedWrappers.splice(mountedWrappers.indexOf(wrapper), 1)
    expect(removeEventListener).toHaveBeenCalledWith("click", expect.any(Function), true)
  })

  it("anchors a mobile click and dismisses it from a capture-phase outside click", () => {
    appendSlot(1, 0)
    const { interactions, tooltipContent } = mountInteractions(true)

    interactions.getTimeslotVon(1, 0).click()

    expect(interactions.selectedTooltipSlot.value).toEqual({ row: 1, col: 0 })
    expect(interactions.tooltipPosition.value).toEqual({
      x: 100,
      y: 100,
      placement: "below",
    })
    expect(joinTooltipSegments(tooltipContent.value)).toBe("slot-1-0")

    document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    expect(interactions.selectedTooltipSlot.value).toBeNull()
    expect(interactions.tooltipPosition.value).toBeNull()
    expect(tooltipContent.value).toEqual([])
  })

  it("uses cursor coordinates on desktop and clears them on cell leave", () => {
    const { interactions, tooltipContent } = mountInteractions()

    interactions.moveTimedGridDrag({ clientX: 150, clientY: 280 } as MouseEvent)
    expect(interactions.tooltipPosition.value).toEqual({ x: 150, y: 280 })

    interactions.getTimeslotVon(1, 0).mouseleave()
    expect(interactions.tooltipPosition.value).toBeNull()
    expect(tooltipContent.value).toEqual([])
  })

  it("selects a mobile anchor from a compatibility mouse target", () => {
    const cell = appendSlot(1, 0)
    const { interactions } = mountInteractions(true)
    vi.spyOn(document, "elementFromPoint").mockReturnValue(null)

    interactions.startTimedGridDrag({
      target: cell,
      clientX: 900,
      clientY: 700,
    } as unknown as MouseEvent)

    expect(interactions.selectedTooltipSlot.value).toEqual({ row: 1, col: 0 })
  })

  it("moves a mobile drag anchor to the current grid cell and retains it outside the grid", () => {
    appendSlot(1, 0, 80)
    appendSlot(2, 0, 100)
    const { interactions, dragging, dragCur, moveDrag } = mountInteractions(true)
    const outsideGrid = document.createElement("div")
    dragging.value = true
    dragCur.value = { row: 1, col: 0 }
    interactions.selectedTooltipSlot.value = { row: 1, col: 0 }
    moveDrag.mockImplementation(() => {
      dragCur.value = { row: 2, col: 0 }
    })

    const currentCell = document.querySelector<HTMLElement>(
      '#drag-section .timeslot[data-row="2"][data-col="0"]'
    )
    if (!currentCell) throw new Error("Expected current grid cell")

    interactions.moveTimedGridDrag({
      target: currentCell,
      clientX: 100,
      clientY: 110,
    } as unknown as MouseEvent)

    expect(interactions.selectedTooltipSlot.value).toEqual({ row: 2, col: 0 })
    expect(interactions.tooltipPosition.value).toEqual({
      x: 100,
      y: 100,
      placement: "above",
    })

    interactions.moveTimedGridDrag({
      target: outsideGrid,
      clientX: 900,
      clientY: 700,
    } as unknown as MouseEvent)

    expect(interactions.tooltipPosition.value).toEqual({
      x: 100,
      y: 100,
      placement: "above",
    })
  })

  it("shows and repositions the mobile tooltip for the current slot on hover and scroll", async () => {
    let top = 140
    appendSlot(1, 0, () => top)
    const { interactions, tooltipContent } = mountInteractions(true)

    interactions.getTimeslotVon(1, 0).mouseover()
    await nextTick()

    expect(interactions.selectedTooltipSlot.value).toEqual({ row: 1, col: 0 })
    expect(joinTooltipSegments(tooltipContent.value)).toBe("slot-1-0")
    expect(interactions.tooltipPosition.value).toEqual({
      x: 100,
      y: 140,
      placement: "above",
    })

    top = 80
    window.dispatchEvent(new Event("scroll"))

    expect(interactions.tooltipPosition.value).toEqual({
      x: 100,
      y: 100,
      placement: "below",
    })
  })
})
