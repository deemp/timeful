export interface PrivacyPolicyEnvironment {
  VITE_ENABLE_PRIVACY_POLICY?: string
}

export function isPrivacyPolicyEnabled(
  env: PrivacyPolicyEnvironment = import.meta.env
): boolean {
  const value = env.VITE_ENABLE_PRIVACY_POLICY?.trim().toLowerCase()

  if (!value) {
    return true
  }

  return value !== "false"
}

export const privacyPolicyEnabled = isPrivacyPolicyEnabled()
