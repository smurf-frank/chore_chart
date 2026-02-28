---
description: how to update the MASTER_STATUS.md at the end of a work session
---

# Update Master Status Workflow

Run this at the end of every work session to keep the status doc current for the next session.

// turbo

1. Read the current status doc to avoid overwriting anything:

```bash
cat MASTER_STATUS.md
```

2. Update the following sections in `MASTER_STATUS.md`:

    **"Where You Left Off"**
    - Set `Last Worked On` to today's date
    - Write a one-line summary of current state

    **"Next Steps (For Resuming)"**
    - Rewrite with the 2-3 most concrete, actionable next items

    **"In Progress / Completed Milestones"**
    - Mark any newly completed items as ✅
    - Add any new in-progress items as 🔄

    **"Recent AI Sessions Summary"** — add a new entry:

    ```
    ### Session YYYY-MM-DD
    - **Objective**: [what we set out to do]
    - **Outcome**: [bullet list of what was actually accomplished]
    - **Files Modified**: [list key files]
    - **Follow-up Needed**: [anything unresolved]
    ```

    **"Key Decisions Log"** — add a row for any architectural or strategic decisions made this session.

    **"Update Log"** — add a row at the bottom of the table.

3. Commit and push using `/git_commit_and_push`:

```bash
git add MASTER_STATUS.md
git commit -m ":memo: status: update MASTER_STATUS for session YYYY-MM-DD"
```

// turbo 4. Verify commit landed:

```bash
git log --oneline -2
```

## Notes

- This should be the **last thing done** in a session, after all other commits are pushed.
- Keep session summaries factual and concise — they are context for the next AI session.
- If the session was short or purely conversational (no code changes), a brief entry is still valuable.
