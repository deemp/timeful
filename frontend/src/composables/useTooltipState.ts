import { computed, ref, watch, type ComputedRef, type Ref } from "vue"
import type { TooltipSegment } from "@/components/schedule_overlap/scheduleOverlapRendering"

export const TOOLTIP_Y_OFFSET_PX = 28

export interface TooltipPosition {
  x: number
  y: number
}

export interface TooltipState {
  handleMouseEnter: () => void
  handleMouseLeave: () => void
  handleMouseMove: (event: MouseEvent) => void
  isVisible: Ref<boolean>
  position: Ref<TooltipPosition>
  style: ComputedRef<Record<string, string>>
}

export const useTooltipState = (content: Ref<TooltipSegment[]>): TooltipState => {
  const position = ref<TooltipPosition>({ x: 0, y: 0 })
  const isVisible = ref(false)

  watch(
    content,
    newContent => {
      isVisible.value = newContent.length > 0
    },
    { immediate: true }
  )

  return {
    handleMouseMove: event => {
      position.value = {
        x: event.clientX,
        y: event.clientY < 100
          ? event.clientY + TOOLTIP_Y_OFFSET_PX
          : event.clientY - TOOLTIP_Y_OFFSET_PX,
      }
    },
    handleMouseEnter: () => {
      if (content.value.length > 0) {
        isVisible.value = true
      }
    },
    handleMouseLeave: () => {
      isVisible.value = false
    },
    isVisible,
    position,
    style: computed(() => ({
      left: `${String(position.value.x)}px`,
      top: `${String(position.value.y)}px`,
      transform: "translate(-50%, -50%)",
    })),
  }
}
