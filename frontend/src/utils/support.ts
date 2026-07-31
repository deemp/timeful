export interface SupportEnvironment {
  VITE_SUPPORT_EMAIL?: string
}

export function getSupportEmail(
  env: SupportEnvironment = import.meta.env
): string | undefined {
  const value = env.VITE_SUPPORT_EMAIL?.trim()

  return value === "" ? undefined : value
}

export const supportEmail = getSupportEmail()
