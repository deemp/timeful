// @vitest-environment happy-dom

import { mount, shallowMount } from "@vue/test-utils"
import { h, nextTick, ref, type ComponentPublicInstance } from "vue"
import { describe, expect, it, vi } from "vitest"
import { states } from "@/composables/schedule_overlap/types"
import ColorLegend from "./ColorLegend.vue"
import ScheduleOverlapSidebar from "./ScheduleOverlapSidebar.vue"
import type {
  ScheduleOverlapRespondentsPanelExposed,
  ScheduleOverlapSidebarExposed,
} from "./scheduleOverlapContracts"
import {
  buildScheduleOverlapSidebarViewModel,
  scheduleOverlapGlobalStubs,
} from "./scheduleOverlapTestUtils"

type ExposeFn<T> = (exposed?: T) => void

describe("ScheduleOverlapSidebar", () => {
  it("exposes the sign-up block scroll bridge through the child ref boundary", () => {
    const scrollToSignUpBlock = vi.fn()
    const SignUpBlocksListStub = {
      name: "SignUpBlocksList",
      setup(
        _: unknown,
        {
          expose,
        }: {
          expose: ExposeFn<{ scrollToSignUpBlock: typeof scrollToSignUpBlock }>
        },
      ) {
        expose({ scrollToSignUpBlock })
        return () => null
      },
    }

    const wrapper = shallowMount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          isSignUp: true,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          SignUpBlocksList: SignUpBlocksListStub,
        },
      },
    })

    ;(
      wrapper.vm as ComponentPublicInstance & ScheduleOverlapSidebarExposed
    ).scrollToSignUpBlock?.("block-42")

    expect(scrollToSignUpBlock).toHaveBeenCalledWith("block-42")
  })

  it("exposes the options section element while edit controls are rendered", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: buildScheduleOverlapSidebarViewModel(),
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
        },
      },
    })

    const vm = wrapper.vm as ComponentPublicInstance &
      ScheduleOverlapSidebarExposed

    expect(vm.optionsSectionEl).toBeInstanceOf(HTMLElement)
  })

  it("exposes the respondents panel element while the panel branch is rendered", async () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.HEATMAP,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ScheduleOverlapRespondentsPanel: {
            name: "ScheduleOverlapRespondentsPanel",
            setup(
              _: unknown,
              {
                expose,
              }: { expose: ExposeFn<ScheduleOverlapRespondentsPanelExposed> },
            ) {
              const panelEl = ref<HTMLElement | null>(null)
              expose({
                get panelEl() {
                  return panelEl.value
                },
              })
              return () =>
                h("div", { ref: panelEl, class: "respondents-panel-stub" })
            },
          },
        },
      },
    })

    await nextTick()

    const vm = wrapper.vm as ComponentPublicInstance &
      ScheduleOverlapSidebarExposed

    expect(vm.respondentsPanelEl).toBeInstanceOf(HTMLElement)
    expect(vm.respondentsPanelEl?.className).toContain("respondents-panel-stub")
  })

  it("shows range-event active-slot legend items without specific-times editing guidance", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.BEST_TIMES,
          activeSlotsCount: 1,
          responseCount: 0,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ColorLegend,
        },
      },
    })

    expect(wrapper.text()).toContain(
      "Unavailable, change in Add/Edit availability",
    )
    expect(wrapper.text()).not.toContain("Disabled, change in Edit event")
    expect(wrapper.text()).toContain(
      "Disabled, outside the event dates in the event timezone",
    )
  })

  it("shows edit-event guidance for saved specific-times events", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.BEST_TIMES,
          activeSlotsCount: 1,
          event: {
            ...buildScheduleOverlapSidebarViewModel().event,
            hasSpecificTimes: true,
          },
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ColorLegend,
        },
      },
    })

    expect(wrapper.text()).toContain(
      "Unavailable, change in Add/Edit availability",
    )
    expect(wrapper.text()).toContain("Disabled, change in Edit event")
  })

  it("shows the collapsed-hours legend item when hours can collapse", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.BEST_TIMES,
          activeSlotsCount: 1,
          canCollapseHours: true,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ColorLegend,
        },
      },
    })

    expect(wrapper.text()).toContain("Disabled, collapsed")
  })

  it("does not render the overlay availability switch in the sidebar", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          showOverlayAvailabilityToggle: true,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
        },
      },
    })

    const overlaySwitch = wrapper.find("#overlay-availabilities-toggle")

    expect(overlaySwitch.exists()).toBe(false)
  })

  it("does not render the ad wrapper when the sidebar view model disables ads", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.HEATMAP,
          showAds: false,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          AsyncPubliftAd: {
            template: "<div class='async-publift-ad-stub'><slot /></div>",
          },
        },
      },
    })

    expect(wrapper.find(".async-publift-ad-stub").exists()).toBe(false)
  })

  it("keeps the desktop sidebar sticky at 640px+ while mobile ads stay phone-only", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.HEATMAP,
          isPhone: false,
          showAds: true,
          rightSideWidth: "clamp(10rem, 25vw, 13rem)",
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          AsyncPubliftAd: {
            template: "<div class='async-publift-ad-stub'><slot /></div>",
          },
        },
      },
    })

    expect(wrapper.classes()).toContain("tw-sticky")
    expect(wrapper.find(".async-publift-ad-stub").exists()).toBe(false)
  })

  it("places the desktop control block above the respondents panel", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.HEATMAP,
          isPhone: false,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
        },
      },
    })

    expect(wrapper.classes()).toContain("tw-sticky")
    expect(wrapper.classes()).not.toContain("tw-pt-11")
    expect(wrapper.find(".schedule-overlap-sidebar__tool-row").exists()).toBe(
      true,
    )
    expect(wrapper.html()).toContain("tw-pt-4")
  })

  it("places compact timezone and format controls before desktop responses", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.HEATMAP,
          isPhone: false,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
          ToolRow: {
            name: "ToolRow",
            props: ["compact"],
            template: "<div class='tool-row-stub' />",
          },
          ScheduleOverlapRespondentsPanel: {
            name: "ScheduleOverlapRespondentsPanel",
            template: "<div class='respondents-panel-stub' />",
          },
        },
      },
    })

    const toolRow = wrapper.get(".schedule-overlap-sidebar__tool-row")
    const respondentsPanel = wrapper.get(".respondents-panel-stub")

    expect(toolRow.getComponent({ name: "ToolRow" }).props("compact")).toBe(
      true,
    )
    expect(
      toolRow.element.compareDocumentPosition(respondentsPanel.element) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it("keeps the hovered respondents state aligned with the grid body", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.SINGLE_AVAILABILITY,
          isPhone: false,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
        },
      },
    })

    expect(wrapper.classes()).toContain("tw-sticky")
    expect(wrapper.classes()).not.toContain("tw-pt-11")
    expect(wrapper.classes()).not.toContain("tw-pt-14")
  })

  it("keeps the desktop top offset while rendering edit availability controls", () => {
    const wrapper = mount(ScheduleOverlapSidebar, {
      props: {
        sidebar: {
          ...buildScheduleOverlapSidebarViewModel(),
          state: states.EDIT_AVAILABILITY,
          isPhone: false,
        },
      },
      global: {
        stubs: {
          ...scheduleOverlapGlobalStubs,
        },
      },
    })

    expect(wrapper.classes()).toContain("tw-sticky")
    expect(wrapper.classes()).not.toContain("tw-pt-14")
    expect(wrapper.html()).toContain("tw-pt-14")
  })
})
