// @vitest-environment happy-dom

import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import Tooltip from "./Tooltip.vue"
import tooltipSource from "./Tooltip.vue?raw"

describe("Tooltip", () => {
  it("uses declarative pointer listeners instead of manual DOM wiring", () => {
    expect(tooltipSource).toContain('@mouseenter="handleMouseEnter"')
    expect(tooltipSource).toContain('@mouseleave="handleMouseLeave"')
    expect(tooltipSource).toContain('@mousemove="handleMouseMoveWithOverride"')
    expect(tooltipSource).not.toContain("addEventListener")
    expect(tooltipSource).not.toContain("removeEventListener")
  })

  it("shows new content immediately and positions it through the tooltip state helper", async () => {
    const wrapper = mount(Tooltip, {
      props: {
        content: "",
      },
      slots: {
        default: "<button>Trigger</button>",
      },
    })

    const trigger = wrapper.get("div.tw-relative")

    await trigger.trigger("mouseenter")
    expect(wrapper.text()).not.toContain("Hello")

    await wrapper.setProps({ content: "Hello" })
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain("Hello")

    await trigger.trigger("mousemove", { clientX: 100, clientY: 200 })

    const tooltip = wrapper.get(".tw-fixed")
    expect(tooltip.attributes("style")).toContain("left: 100px;")
    expect(tooltip.attributes("style")).toContain("top: 172px;")
    expect(tooltip.attributes("style")).toContain("translate(-50%, -50%)")

    await trigger.trigger("mouseleave")
    expect(wrapper.find(".tw-fixed").exists()).toBe(false)
  })

  it("keeps an overridden position when the pointer moves", async () => {
    const wrapper = mount(Tooltip, {
      props: {
        content: "Hello",
      },
      slots: {
        default: "<button>Trigger</button>",
      },
    })
    const trigger = wrapper.get("div.tw-relative")

    await trigger.trigger("mouseenter")
    await wrapper.setProps({ positionOverride: { x: 40, y: 200 } })
    await trigger.trigger("mousemove", { clientX: 900, clientY: 700 })

    const tooltip = wrapper.get(".tw-fixed")
    expect(tooltip.attributes("style")).toContain("left: 40px;")
    expect(tooltip.attributes("style")).toContain("top: 172px;")
  })

  it("places edge-anchored overrides outside their anchor with a gap", async () => {
    const wrapper = mount(Tooltip, {
      props: {
        content: "Hello",
        positionOverride: { x: 40, y: 200, placement: "above" },
      },
      slots: {
        default: "<button>Trigger</button>",
      },
    })

    await wrapper.vm.$nextTick()

    const tooltip = wrapper.get(".tw-fixed")
    expect(tooltip.attributes("style")).toContain("left: 40px;")
    expect(tooltip.attributes("style")).toContain("top: 200px;")
    expect(tooltip.attributes("style")).toContain("translate(-50%, calc(-100% - 8px))")

    await wrapper.setProps({ positionOverride: { x: 40, y: 20, placement: "below" } })

    expect(tooltip.attributes("style")).toContain("top: 20px;")
    expect(tooltip.attributes("style")).toContain("translate(-50%, 8px)")
  })

  it("renders immediately when visibility is explicitly forced", async () => {
    const wrapper = mount(Tooltip, {
      props: {
        content: "Hello",
        forceVisible: true,
      },
      slots: {
        default: "<button>Trigger</button>",
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.find(".tw-fixed").exists()).toBe(true)
  })
})
