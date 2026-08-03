---
name: session-handoff
description: Session handoff, handoff notes, or handoff file: use when the user explicitly asks to capture durable context from the current session for later work.
---

# Session Handoff

Create a handoff only when the user explicitly requests one. Do not create one automatically at task completion.

<!--
Content guidance adapted from Matt Pocock's handoff skill:
https://github.com/mattpocock/skills/blob/main/skills/productivity/handoff/SKILL.md
Licensed under MIT.
-->

## Create The File

1. Immediately before writing the handoff, capture the most recently updated OpenCode session and the UTC creation timestamp. Use:

   ```sh
   python3 <<'PY'
   import json
   import subprocess
   import sys
   from datetime import UTC, datetime

   result = subprocess.run(
       ["opencode", "session", "list", "--format", "json", "--max-count", "1"],
       check=True,
       capture_output=True,
       text=True,
   )
   sessions = json.loads(result.stdout)
   session_id = sessions[0].get("id") if len(sessions) == 1 else None
   if not isinstance(session_id, str) or not session_id.startswith("ses_"):
       sys.exit("Could not determine the most recently updated OpenCode session.")

   print(f"session_id: {session_id}")
   print(f"created_at: {datetime.now(UTC):%Y-%m-%dT%H-%M-%SZ}")
   PY
   ```

   The output labels provide the `session_id` and `created_at` values to use below. The OpenCode CLI has no explicit current-session command or environment variable. This records the most recently updated session for the project, which is the best supported lookup. If another session in the same directory is updated concurrently, stop and ask the user to confirm the session ID rather than recording an uncertain ID.
2. Create `handoff/` if it does not exist.
3. Write the handoff to `handoff/handoff-<created_at>.md`, replacing `<created_at>` with the script output.
4. Report the resulting path.

## Content

Capture only facts established during the current session. The handoff must be useful without the chat transcript and must not invent completion, verification, risks, or decisions.

Do not duplicate material already captured in a specification, plan, ADR, issue, commit, diff, or test. Reference the artifact by repository path or URL and record only the current status or implication. Redact secrets and personal data; never include credentials, tokens, or other sensitive values.

Use this structure, omitting sections with no content:

```markdown
# Session Handoff

- Created session: `<OpenCode session ID>`

## Completed Work

## Important Decisions

## Findings And Risks

## Validation

## Remaining Work

## Handoff Relationships

## Suggested Skills

## Relevant Files
```

- Include exact commands and their outcomes in **Validation** when they affect confidence in the work.
- Include changed or inspected paths in **Relevant Files** when they provide useful continuation context.
- Describe unresolved work concretely in **Remaining Work**, including blockers or prerequisites.
- Tailor **Remaining Work** to the user's stated next-session focus when one is provided.
- In **Handoff Relationships**, use `Continues` for unresolved work from a prior handoff and `Supersedes` only for conclusions or next steps that are no longer current. Reference the durable artifact that governs the work when useful. Omit the section when there is no meaningful relationship.
- In **Suggested Skills**, name only repository skills that are relevant and known to exist. Omit the section otherwise.
- Keep entries concise, factual, and actionable.
