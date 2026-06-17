export interface GitHubEnvironment {
  VITE_GITHUB_REPO_URL: string
}

export function getGitHubRepoUrl(
  env: GitHubEnvironment = import.meta.env
): string {
  return env.VITE_GITHUB_REPO_URL
}

export const gitHubRepoUrl = getGitHubRepoUrl()
