import { timeTypes } from "@/constants"

export interface TimeFormatOption {
  text: string
  time: number
  value: number
}

type StorageWithTimeType = Storage & { timeType?: unknown }

const DEFAULT_LOCALE = "en-US"

const getNavigator = (): Navigator | undefined => {
  return typeof globalThis.navigator === "undefined" ? undefined : globalThis.navigator
}

const getStorage = (): Storage | undefined => {
  return typeof globalThis.localStorage === "undefined" ? undefined : globalThis.localStorage
}

const getStoredTimeType = (storage: Storage | undefined): string | undefined => {
  if (!storage) {
    return undefined
  }

  const timeType = (storage as StorageWithTimeType).timeType
  if (typeof timeType === "string") {
    return timeType
  }

  const storedValue = storage.getItem("timeType")
  return storedValue ?? undefined
}

const prefers12hFromStored = (
  value: string | undefined,
  fallback: boolean
): boolean => (value == undefined ? fallback : value === timeTypes.HOUR12)

const normalizeLocaleCandidate = (candidate: unknown): string | undefined => {
  if (typeof candidate !== "string") {
    return undefined
  }

  const trimmedCandidate = candidate.trim()
  if (!trimmedCandidate) {
    return undefined
  }

  try {
    return Intl.getCanonicalLocales(trimmedCandidate)[0]
  } catch {
    return undefined
  }
}

export const getLocale = (): string => {
  const navigator = getNavigator()

  for (const candidate of navigator?.languages ?? []) {
    const normalizedLocale = normalizeLocaleCandidate(candidate)
    if (normalizedLocale) {
      return normalizedLocale
    }
  }

  const navigatorLanguage = normalizeLocaleCandidate(navigator?.language)
  if (navigatorLanguage) {
    return navigatorLanguage
  }

  return (
    normalizeLocaleCandidate(Intl.DateTimeFormat().resolvedOptions().locale) ?? DEFAULT_LOCALE
  )
}

export const buildTimeOptions = (prefers12h: boolean): TimeFormatOption[] => {
  const times: TimeFormatOption[] = []
  if (prefers12h) {
    times.push({ text: "12 AM", time: 0, value: 0 })
    for (let h = 1; h < 12; ++h) {
      times.push({ text: `${String(h)} AM`, time: h, value: h })
    }
    for (let h = 0; h < 12; ++h) {
      times.push({
        text: `${String(h === 0 ? 12 : h)} PM`,
        time: h + 12,
        value: h + 12,
      })
    }
    times.push({ text: "12 AM", time: 0, value: 24 })
    return times
  }

  for (let h = 0; h < 24; ++h) {
    times.push({ text: `${String(h).padStart(2, "0")}:00`, time: h, value: h })
  }
  times.push({ text: "24:00", time: 0, value: 24 })
  return times
}

export const getTimeOptions = (): TimeFormatOption[] =>
  buildTimeOptions(prefers12hFromStored(getStoredTimeType(getStorage()), false))
