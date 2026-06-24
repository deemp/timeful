export interface FeedbackEnvironment {
  VITE_FEEDBACK_URL?: string
}

const DEFAULT_FEEDBACK_URL = "https://github.com/deemp/timeful/issues"

export function getFeedbackUrl(
  env: FeedbackEnvironment = import.meta.env
): string {
  const value = env.VITE_FEEDBACK_URL?.trim()

  if (!value) {
    return DEFAULT_FEEDBACK_URL
  }

  return value
}

export const feedbackUrl = getFeedbackUrl()
