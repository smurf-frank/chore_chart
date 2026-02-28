---
description: how to start a new AI session and restore project context
---

# Session Start Workflow

Run this at the beginning of every new session to restore full project context and avoid drift.

// turbo

1. Ensure `gh` is configured for non-interactive use:

```bash
gh config set prompt disabled && gh config set pager cat
```

// turbo 2. Read the Project Bible to restore static foundations:

```bash
cat PROJECT_BIBLE.md
```

// turbo 2. Read the Master Status to restore current state and next steps:

```bash
cat MASTER_STATUS.md
```

// turbo 3. Check for any open pull requests:

```bash
gh pr list --state open
```

If any are open, review and summarize each one:

```bash
gh pr view <number>
```

Include PR title, source branch, and current state (draft/open/changes requested) in the session summary to the user.

4. Summarize to the user:
    - Current phase and status
    - Where we left off (last session summary)
    - The next 1-3 concrete actions
    - Any open follow-up items flagged in the last session

5. Ask the user what they want to work on, or propose the logical next step from the status doc.

## Notes

- Do NOT start writing code or making changes before completing steps 1-2.
- If the user has already provided context in their first message, steps 1-2 can be run in parallel with reading that context.
- The Bible is the anchor — if anything conflicts with it, flag the conflict before proceeding.
- When running `gh` or other fast CLI tools, use a synchronous wait of at least 2000ms (e.g., `WaitMsBeforeAsync: 2000`) to ensure status capture.
