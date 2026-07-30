<template>
  <div class="tw-flex tw-flex-col tw-gap-1">
    <div class="tw-text-sm tw-font-medium">Legend:</div>
    <div v-if="showResponsePalette" class="tw-flex tw-items-start">
      <div class="color-legend__indicator-slot">
        <div
          class="tw-h-4 tw-w-4 tw-rounded tw-border tw-border-gray tw-bg-[#00994C77]"
        ></div>
      </div>
      <span class="tw-text-sm">Available</span>
    </div>
    <div v-if="showResponsePalette" class="tw-flex tw-items-start">
      <div class="color-legend__indicator-slot">
        <div
          class="tw-h-4 tw-w-4 tw-rounded tw-border tw-border-gray tw-bg-yellow"
        ></div>
      </div>
      <span class="tw-text-sm">If needed</span>
    </div>
    <div
      v-if="showResponsePalette || activeSlotsCount > 0"
      class="tw-flex tw-items-start"
    >
      <div class="color-legend__indicator-slot">
        <div
          class="tw-h-4 tw-w-4 tw-rounded tw-border tw-border-gray tw-bg-[#F9CCCC]"
        ></div>
      </div>
      <span class="tw-text-sm"
        >Unavailable, select in <br class="tw-hidden md:tw-block" />Add/Edit availability</span
      >
    </div>
    <div class="tw-flex tw-items-start">
      <div class="color-legend__indicator-slot">
        <div
          class="tw-h-4 tw-w-4 tw-rounded tw-border tw-border-gray tw-bg-light-gray-stroke"
        ></div>
      </div>
      <span class="tw-text-sm"
        >Unavailable, select in <br class="tw-hidden md:tw-block" />Edit event</span
      >
    </div>
    <div class="tw-flex tw-items-start">
      <div class="color-legend__indicator-slot">
        <div
          class="tw-h-4 tw-w-4 tw-rounded tw-border tw-border-gray tw-bg-gray"
        ></div>
      </div>
      <span class="tw-text-sm">Unavailable, padding</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  activeSlotsCount: number
  responseCount: number
  isAddingAvailability: boolean
}>()

const showResponsePalette = computed(
  () => props.isAddingAvailability || props.responseCount > 0,
)
</script>

<style scoped>
.color-legend__indicator-slot {
  display: flex;
  flex: 0 0 auto;
  width: 1.25rem;
  height: 1.25rem;
  margin-right: 0.75rem;
  margin-left: 0.25rem;
  align-items: center;
  justify-content: center;
}
</style>
