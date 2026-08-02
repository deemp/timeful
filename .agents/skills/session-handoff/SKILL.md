---
name: session-handoff
description: Session handoff, handoff notes, or handoff file: use when the user explicitly asks to capture durable context from the current session for later work.
---

# Session Handoff

Create a handoff only when the user explicitly requests one. Do not create one automatically at task completion.

## Create The File

1. Immediately before writing the handoff, capture the most recently updated OpenCode session in the current project directory. Use:

   ```sh
   session_id="$(opencode session list --format json --max-count 1 | python3 -c 'import json, sys; sessions = json.load(sys.stdin); session_id = sessions[0].get("id") if len(sessions) == 1 else None; sys.exit("Could not determine the most recently updated OpenCode session.") if not isinstance(session_id, str) or not session_id.startswith("ses_") else print(session_id)')"
   ```

    The OpenCode CLI has no explicit current-session command or environment variable. This records the most recently updated session for the project, which is the best supported lookup. If another session in the same directory is updated concurrently, stop and ask the user to confirm the session ID rather than recording an uncertain ID.
2. Capture the UTC+0 creation timestamp immediately before writing with `created_at="$(date -u +'%Y-%m-%dT%H-%M-%SZ')"`.
3. Create `handoff/` if it does not exist.
4. Write the handoff to `handoff/handoff-${created_at}.md`.
5. Report the resulting path.

## Content

Capture only facts established during the current session. The handoff must be useful without the chat transcript and must not invent completion, verification, risks, or decisions.

Use this structure, omitting sections with no content:

```markdown
# Session Handoff

- Created session: `<OpenCode session ID>`

## Completed Work

## Important Decisions

## Findings And Risks

## Validation

## Remaining Work

## Relevant Files
```

- Include exact commands and their outcomes in **Validation** when they affect confidence in the work.
- Include changed or inspected paths in **Relevant Files** when they provide useful continuation context.
- Describe unresolved work concretely in **Remaining Work**, including blockers or prerequisites.
- Keep entries concise, factual, and actionable.
