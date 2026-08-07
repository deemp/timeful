import "@/test/regressionTestSetup"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { timeTypes } from "@/constants"
import { createLocalStorageMock } from "@/test/localStorage"
import { getLocale, getTimeOptions } from "./browserDatePreferences"

describe("browserDatePreferences", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it("prefers navigator.languages over navigator.language", () => {
    vi.stubGlobal("navigator", {
      languages: ["fr-CA", "en-US"],
      language: "en-GB",
    })

    expect(getLocale()).toBe("fr-CA")
  })

  it("falls back to navigator.language when languages is empty", () => {
    vi.stubGlobal("navigator", {
      languages: [],
      language: "de-DE",
    })

    expect(getLocale()).toBe("de-DE")
  })

  it("ignores invalid navigator.languages entries when navigator.language is usable", () => {
    vi.stubGlobal("navigator", {
      languages: [undefined],
      language: "en-GB",
    })

    expect(getLocale()).toBe("en-GB")
  })

  it("ignores blank navigator locale values before falling back", () => {
    vi.stubGlobal("navigator", {
      languages: [""],
      language: "fr-FR",
    })

    expect(getLocale()).toBe("fr-FR")
  })

  it("falls back to Intl resolved locale when navigator values are unusable", () => {
    vi.stubGlobal("navigator", {
      languages: [undefined, ""],
      language: "",
    })
    vi.spyOn(Intl, "DateTimeFormat").mockImplementation(
      () =>
        ({
          resolvedOptions: () => ({ locale: "es-419" }),
        }) as Intl.DateTimeFormat,
    )

    expect(getLocale()).toBe("es-419")
  })

  it("defaults to 24-hour format when no override is stored", () => {
    vi.stubGlobal("navigator", {
      languages: ["en-US"],
      language: "en-US",
    })
    vi.stubGlobal("localStorage", createLocalStorageMock())

    const options = getTimeOptions()
    expect(options[0]).toEqual({ text: "00:00", time: 0, value: 0 })
    expect(options[1]).toEqual({ text: "01:00", time: 1, value: 1 })
    expect(options[23]).toEqual({ text: "23:00", time: 23, value: 23 })
    expect(options[24]).toEqual({ text: "24:00", time: 0, value: 24 })
  })

  it("lets the saved timeType override to 12-hour format", () => {
    vi.stubGlobal("navigator", {
      languages: ["en-US"],
      language: "en-US",
    })
    vi.stubGlobal(
      "localStorage",
      createLocalStorageMock({
        timeType: timeTypes.HOUR12,
      })
    )

    const options = getTimeOptions()

    expect(options[0]).toEqual({ text: "12 AM", time: 0, value: 0 })
    expect(options[12]).toEqual({ text: "12 PM", time: 12, value: 12 })
    expect(options[24]).toEqual({ text: "12 AM", time: 0, value: 24 })
  })

  it("lets the saved timeType override to 24-hour format", () => {
    vi.stubGlobal("navigator", {
      languages: ["en-US"],
      language: "en-US",
    })
    vi.stubGlobal(
      "localStorage",
      createLocalStorageMock({
        timeType: timeTypes.HOUR24,
      })
    )

    const options = getTimeOptions()

    expect(options[0]).toEqual({ text: "00:00", time: 0, value: 0 })
    expect(options[1]).toEqual({ text: "01:00", time: 1, value: 1 })
    expect(options[23]).toEqual({ text: "23:00", time: 23, value: 23 })
    expect(options[24]).toEqual({ text: "24:00", time: 0, value: 24 })
  })
})
