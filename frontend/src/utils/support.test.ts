import { describe, expect, it } from "vitest"
import { getSupportEmail } from "./support"

describe("support", () => {
  it("returns undefined when no support address is configured", () => {
    expect(getSupportEmail()).toBeUndefined()
    expect(getSupportEmail({})).toBeUndefined()
    expect(getSupportEmail({ VITE_SUPPORT_EMAIL: "   " })).toBeUndefined()
  })

  it("returns the configured support address", () => {
    expect(getSupportEmail({ VITE_SUPPORT_EMAIL: " support@example.com " })).toBe(
      "support@example.com"
    )
  })
})
