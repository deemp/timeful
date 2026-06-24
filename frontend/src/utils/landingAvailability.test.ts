import { describe, expect, it } from "vitest"
import { isRichLandingEnabled } from "./landingAvailability"

describe("landingAvailability", () => {
  it("keeps the rich landing enabled by default", () => {
    expect(isRichLandingEnabled()).toBe(true)
    expect(isRichLandingEnabled({})).toBe(true)
    expect(isRichLandingEnabled({ VITE_ENABLE_RICH_LANDING: "   " })).toBe(true)
  })

  it("disables the rich landing when the env flag is false", () => {
    expect(
      isRichLandingEnabled({
        VITE_ENABLE_RICH_LANDING: "false",
      })
    ).toBe(false)
    expect(
      isRichLandingEnabled({
        VITE_ENABLE_RICH_LANDING: " FALSE ",
      })
    ).toBe(false)
  })

  it("keeps the rich landing enabled for other values", () => {
    expect(
      isRichLandingEnabled({
        VITE_ENABLE_RICH_LANDING: "true",
      })
    ).toBe(true)
    expect(
      isRichLandingEnabled({
        VITE_ENABLE_RICH_LANDING: "0",
      })
    ).toBe(true)
  })
})
