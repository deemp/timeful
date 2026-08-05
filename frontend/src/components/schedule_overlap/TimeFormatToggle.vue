<template>
  <div
    class="time-format-toggle tw-relative tw-flex tw-h-8 tw-w-fit tw-overflow-hidden tw-rounded-md tw-border tw-border-solid tw-border-light-gray-stroke tw-bg-white"
  >
    <div
      class="time-format-toggle__indicator tw-absolute tw-z-0 tw-rounded-[5px] tw-border tw-border-light-gray-stroke tw-border-solid tw-transition-all"
      :style="indicatorStyle"
    ></div>
    <button
      v-for="option in options"
      :key="option.value"
      class="time-format-toggle__option tw-relative tw-z-10 tw-flex tw-min-w-14 tw-items-center tw-justify-center tw-px-3.5 tw-text-sm tw-font-medium tw-transition-all"
      :class="option.value === modelValue ? 'tw-text-black' : 'tw-text-dark-gray'"
      type="button"
      @click="emit('update:modelValue', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type CSSProperties } from "vue"
import { timeTypes } from "@/constants"

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  "update:modelValue": [value: string]
}>()

const options = [
  { label: "12h", value: timeTypes.HOUR12 },
  { label: "24h", value: timeTypes.HOUR24 },
] as const

const selectedIndex = computed(() =>
  Math.max(options.findIndex((option) => option.value === props.modelValue), 0),
)

const indicatorStyle = computed<CSSProperties>(() => ({
  top: "2px",
  bottom: "2px",
  left: "2px",
  borderColor: "transparent",
  backgroundColor: "#F2F2F2",
  boxShadow: "none",
  transform: `translateX(calc(${String(selectedIndex.value * 100)}% + ${String(selectedIndex.value * 4)}px))`,
  width: "calc(50% - 4px)",
}))
</script>
