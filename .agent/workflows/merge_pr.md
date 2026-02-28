---
description: how to merge an approved pull request into master
---

# Merge PR Workflow

**CRITICAL RULES:**

- You must require **EXPLICIT APPROVAL FROM THE HUMAN** before merging anything. Do not assume consent.
- You must **NEVER BYPASS BRANCH PROTECTIONS** under any circumstance. Do not use `--admin` flags.

// turbo

1. Confirm the PR is open and get its status:

```bash
gh pr view
```

Confirm: PR is open, all checks pass, and the human has given explicit approval to merge.

// turbo 2. Confirm you are on the correct feature branch:

```bash
git branch --show-current
```

// turbo 3. Mark the PR as ready for review (if still draft):

```bash
gh pr ready
```

4. Merge the PR using squash merge (keeps master history clean):

```bash
gh pr merge --squash --delete-branch
```

- `--squash`: combines all feature branch commits into one clean commit on master.
- `--delete-branch`: removes the remote feature branch after merge.

// turbo 5. Switch to master and pull to confirm the merge landed:

```bash
git checkout master && git pull origin master && git log --oneline -3
```

// turbo 6. Confirm the feature branch is cleaned up locally:

```bash
git branch -d <feature-branch-name>
```

7. Update `MASTER_STATUS.md` to reflect the merge — run `/update_master_status`.

## Notes

- **Never merge without explicit human approval** — this is a Review Trigger in the PROJECT_BIBLE.
- Prefer `--squash` to keep the master log readable. Use `--merge` only if full commit history must be preserved.
- If the PR has conflicts, resolve them on the feature branch first, then re-run this workflow from step 1.
- After merging, the next feature branch should be cut from the updated `master`.
