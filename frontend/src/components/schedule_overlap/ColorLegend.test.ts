// @vitest-environment happy-dom

import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"

import ColorLegend from "./ColorLegend.vue"

describe("ColorLegend", () => {
  const mountLegend = (props?: Partial<InstanceType<typeof ColorLegend>["$props"]>) =>
    mount(ColorLegend, {
      props: {
        activeSlotsCount: 0,
        responseCount: 0,
        isAddingAvailability: false,
        ...props,
      },
    })

  const expectStructuralColors = (wrapper: ReturnType<typeof mountLegend>) => {
    expect(wrapper.text()).toContain("Unavailable, select in Edit event")
    expect(wrapper.html()).toContain("tw-bg-light-gray-stroke")
    expect(wrapper.text()).toContain("Unavailable, padding")
    expect(wrapper.html()).toContain("tw-bg-gray")
  }

  const labels = (wrapper: ReturnType<typeof mountLegend>) =>
    wrapper.findAll("span").map((label) => label.text())

  it("shows only structural colors when the event has no active slots or responses", () => {
    const wrapper = mountLegend()

    expectStructuralColors(wrapper)
    expect(labels(wrapper)).toEqual([
      "Unavailable, select in Edit event",
      "Unavailable, padding",
    ])
    expect(wrapper.html()).not.toContain("tw-bg-[#F9CCCC]")
  })

  it("adds unavailable when the event has active slots", () => {
    const wrapper = mountLegend({ activeSlotsCount: 1 })

    expectStructuralColors(wrapper)
    expect(labels(wrapper)).toEqual([
      "Unavailable, select in Add/Edit availability",
      "Unavailable, select in Edit event",
      "Unavailable, padding",
    ])
    expect(wrapper.html()).toContain("tw-bg-[#F9CCCC]")
  })

  it("shows the full palette after a response is received", () => {
    const wrapper = mountLegend({ responseCount: 1 })

    expectStructuralColors(wrapper)
    expect(wrapper.text()).toContain("Available")
    expect(wrapper.html()).toContain("tw-bg-[#00994C77]")
    expect(wrapper.text()).toContain("If needed")
    expect(wrapper.html()).toContain("tw-bg-yellow")
    expect(wrapper.text()).toContain("Unavailable, select in Add/Edit availability")
    expect(wrapper.html()).toContain("tw-bg-[#F9CCCC]")
    expect(labels(wrapper)).toHaveLength(5)
  })

  it("shows the full palette while adding availability", () => {
    const wrapper = mountLegend({ isAddingAvailability: true })

    expect(wrapper.text()).toContain("Available")
    expect(wrapper.text()).toContain("If needed")
    expect(wrapper.text()).toContain("Unavailable, select in Add/Edit availability")
    expect(labels(wrapper)).toHaveLength(5)
  })

  it("uses the respondent checkbox control geometry for each indicator", () => {
    const wrapper = mountLegend({ responseCount: 1 })

    const indicatorSlots = wrapper.findAll(".color-legend__indicator-slot")
    expect(indicatorSlots).toHaveLength(5)

    for (const indicatorSlot of indicatorSlots) {
      expect(indicatorSlot.find(".tw-h-4.tw-w-4").exists()).toBe(true)
    }
  })

  it("splits Edit availability and Edit event onto a new line from the medium breakpoint", () => {
    const wrapper = mountLegend({ activeSlotsCount: 1 })

    const responsiveBreaks = wrapper.findAll("br.tw-hidden.md\\:tw-block")

    expect(responsiveBreaks).toHaveLength(2)
  })
})
