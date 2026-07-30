import { describe, expect, it } from "vitest"
import { getGitHubRepoUrl } from "./github"

describe("getGitHubRepoUrl", () => {
  it("returns the configured repository URL", () => {
    expect(
      getGitHubRepoUrl({ VITE_GITHUB_REPO_URL: "https://github.com/deemp/timeful" }),
    ).toBe("https://github.com/deemp/timeful")
  })
})
