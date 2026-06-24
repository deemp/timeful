export interface LandingAvailabilityEnvironment {
  VITE_ENABLE_RICH_LANDING?: string
}

export function isRichLandingEnabled(
  env: LandingAvailabilityEnvironment = import.meta.env
): boolean {
  const value = env.VITE_ENABLE_RICH_LANDING?.trim().toLowerCase()

  if (!value) {
    return true
  }

  return value !== "false"
}

export const richLandingEnabled = isRichLandingEnabled()
