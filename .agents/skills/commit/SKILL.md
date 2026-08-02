---
name: commit
description: Create a git commit: use when the user explicitly asks to commit changes.
---

# Commit

- Write conventional commit messages.
- For frontend changes, use the `frontend` scope.
- Use this required format:

  ```text
  <type>(<optional scope>): <imperative summary>

  <Body explaining what changed and why.>

  Harness: <active harness>
  Model: <current LLM model>
  ```

- The body and both metadata lines are required.
- Immediately before committing, verify that the LLM model name is current.
- Do not include literal `\n` character sequences anywhere in a commit message; use actual newline characters for all line breaks.
- Do not mention unrelated changes.
- Do not include `Co-authored-by` trailers.
