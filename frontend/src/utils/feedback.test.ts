import { describe, expect, it } from "vitest"
import { getFeedbackUrl } from "./feedback"

describe("feedback", () => {
  it("uses the GitHub issues page by default", () => {
    expect(getFeedbackUrl()).toBe("https://github.com/deemp/timeful/issues")
    expect(getFeedbackUrl({})).toBe("https://github.com/deemp/timeful/issues")
    expect(getFeedbackUrl({ VITE_FEEDBACK_URL: "   " })).toBe(
      "https://github.com/deemp/timeful/issues"
    )
  })

  it("returns the configured feedback URL", () => {
    expect(
      getFeedbackUrl({ VITE_FEEDBACK_URL: "https://example.com/feedback" })
    ).toBe("https://example.com/feedback")
  })
})
