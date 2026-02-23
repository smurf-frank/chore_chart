---
description: How to perform an Active Reflection & Sync Checkpoint
---

This workflow is used to force a "pause and reflect" moment during complex tasks to ensure compliance with the **Project Bible**.

## When to Run

- After every major phase in `task.md`.
- Before any `git commit` that affects core project DNA.
- Whenever a task exceeds 10 tool calls without user interaction.

## Steps

1.  **Read the Bible**: Use `view_file` on `PROJECT_BIBLE.md` (even if you think you remember it).
2.  **Summarize Progress**: List all technical work completed in the current session.
3.  **State Next Steps**: Detail exactly what you plan to do next and how it aligns with the Bible.
4.  **Confirm Compliance**: Sanity check the following:
    - [ ] Am I using the correct **Commit Emoji**?
    - [ ] Am I **Signing** my commits?
    - [ ] Am I avoiding **local paths** in documentation?
    - [ ] Are artifact **naming conventions** followed?
    - [ ] Is **linting** passing?
5.  **Notify User**: Use `notify_user` to present this summary and reflection to the user and await their confirmation.
