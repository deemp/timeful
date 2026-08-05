// @vitest-environment happy-dom

import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import { timeTypes } from "@/constants"
import TimeFormatToggle from "./TimeFormatToggle.vue"

describe("TimeFormatToggle", () => {
  it("keeps the compact time-format styling local", () => {
    const wrapper = mount(TimeFormatToggle, {
      props: { modelValue: timeTypes.HOUR12 },
    })

    expect(wrapper.classes()).toContain("tw-h-8")
    expect(wrapper.classes()).toContain("tw-bg-white")
    expect(wrapper.get(".time-format-toggle__indicator").classes()).toContain(
      "tw-z-0",
    )
    expect(wrapper.get(".time-format-toggle__indicator").attributes("style")).toContain(
      "width: calc(50% - 4px)",
    )
    expect(wrapper.get(".time-format-toggle__indicator").attributes("style")).toContain(
      "border-color: transparent",
    )
    expect(wrapper.findAll(".time-format-toggle__option")[0].classes()).toContain(
      "tw-z-10",
    )
  })

  it("emits the selected time format", async () => {
    const wrapper = mount(TimeFormatToggle, {
      props: { modelValue: timeTypes.HOUR12 },
    })

    await wrapper.findAll(".time-format-toggle__option")[1].trigger("click")

    expect(wrapper.emitted("update:modelValue")).toEqual([[timeTypes.HOUR24]])
  })
})
