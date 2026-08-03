<template>
  <div
    class="tw-relative"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMoveWithOverride"
  >
    <slot></slot>
    <div
      v-if="(isVisible || forceVisible) && content"
      class="tw-pointer-events-none tw-fixed tw-z-50 tw-rounded-lg tw-bg-dark-gray tw-px-1.5 tw-py-1 tw-text-xs tw-text-white tw-shadow-lg tw-transition-opacity tw-duration-200"
      :style="tooltipStyle"
    >
      {{ content }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, toRef, watch } from "vue"
import { useTooltipState, TOOLTIP_Y_OFFSET_PX } from "@/composables/useTooltipState"

defineOptions({ name: "AppTooltip" })

const props = withDefaults(
  defineProps<{
    content?: string
    positionOverride?: {
      x: number
      y: number
      placement?: "above" | "below"
    } | null
    forceVisible?: boolean
  }>(),
  { content: "", positionOverride: null, forceVisible: false }
)

const { handleMouseEnter, handleMouseLeave, handleMouseMove, isVisible, style, position } =
  useTooltipState(toRef(props, "content"))

const tooltipStyle = computed(() => {
  const placement = props.positionOverride?.placement
  if (!placement) {
    return style.value
  }

  return {
    left: `${String(position.value.x)}px`,
    top: `${String(position.value.y)}px`,
    transform: placement === "above"
      ? "translate(-50%, calc(-100% - 8px))"
      : "translate(-50%, 8px)",
  }
})

const handleMouseMoveWithOverride = (event: MouseEvent) => {
  if (!props.positionOverride) {
    handleMouseMove(event)
  }
}

watch(
  () => props.positionOverride,
  (pos) => {
    if (pos) {
      position.value = {
        x: pos.x,
        y: pos.placement
          ? pos.y
          : pos.y < 100
          ? pos.y + TOOLTIP_Y_OFFSET_PX
          : pos.y - TOOLTIP_Y_OFFSET_PX,
      }
    }
  },
  { immediate: true }
)
</script>
