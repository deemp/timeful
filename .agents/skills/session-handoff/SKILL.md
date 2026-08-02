---
name: session-handoff
description: Session handoff, handoff notes, or handoff file: use when the user explicitly asks to capture durable context from the current session for later work.
---

# Session Handoff

Create a handoff only when the user explicitly requests one. Do not create one automatically at task completion.

## Create The File

1. Generate an ID with `python3 -c 'import uuid; print(uuid.uuid7())'`. The development shell must provide Python 3.14 or later. Do not install a package or substitute another UUID version. If the command is unavailable, report the prerequisite and do not create a file.
2. Create `tmp/handoff/` if it does not exist.
3. Capture the active OpenCode session ID and an ISO 8601 timestamp with timezone immediately before writing the handoff. The timestamp is when the handoff is first created, not when the session began.
4. Write the handoff to `tmp/handoff/handoff-<uuidv7>.md`.
5. Report the resulting path.

## Content

Capture only facts established during the current session. The handoff must be useful without the chat transcript and must not invent completion, verification, risks, or decisions.

Use this structure, omitting sections with no content:

```markdown
# Session Handoff

- Created session: `<OpenCode session ID>`
- Created at: `<ISO 8601 timestamp when this handoff was first created>`

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
