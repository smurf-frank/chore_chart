---
description: how to create a pull request from the current feature branch into master
---

# Create Pull Request Workflow

Run this when a feature branch is ready to be reviewed and merged into `master`.

// turbo

1. Confirm the working tree is clean and everything is pushed:

```bash
git status && git log --oneline origin/master..HEAD
```

All commits should be pushed. If not, run `/git_commit_and_push` first.

// turbo 2. Confirm you are NOT on master:

```bash
git branch --show-current
```

If on `master`, stop — a PR requires a feature branch.

// turbo 3. Fetch the latest master to ensure the target branch is up to date:

```bash
git fetch origin master
```

// turbo 4. Check if master has moved ahead of this branch (divergence check):

```bash
git log --oneline HEAD..origin/master
```

If this produces output, master has new commits. Rebase the feature branch onto the latest master before creating the PR:

```bash
git rebase origin/master
```

Resolve any conflicts, then `git rebase --continue`. Re-push with `git push --force-with-lease origin <branch>`.

// turbo 5. Check for potential merge conflicts using `git diff`:

```bash
git diff origin/master...HEAD --name-only
```

This shows every file changed on the feature branch since it diverged from master. Review the list — any file also modified on master since the branch was cut is a potential conflict. To see the full diff:

```bash
git diff origin/master...HEAD
```

If conflicts are likely, rebase onto master first (see step 4), resolve conflicts, then proceed.

// turbo 6. Write the PR body to a temp file, then create the PR:

```bash
cat > /tmp/pr_body.md << 'EOF'
## Summary
[1-2 sentences describing what this branch does]

## Changes
- [key change 1]
- [key change 2]

## Follow-up
- [anything not included in this PR]
EOF

gh pr create \
  --base master \
  --title "<title>" \
  --body-file /tmp/pr_body.md \
  --draft
```

Edit `/tmp/pr_body.md` with actual content before running `gh pr create`.
Always create as `--draft` so the human can review before marking ready.

// turbo 7. Confirm the PR was created and capture its URL:

```bash
gh pr view --web 2>/dev/null || gh pr view
```

8. Note the PR in `MASTER_STATUS.md` session log — add one line to the current session's summary:

```
- Opened PR: "<title>" (<pr_url>)
```

Then commit and push via `/git_commit_and_push`.

## Notes

- PRs are always created against `master` unless explicitly told otherwise.
- Always create as `--draft` first; the human marks it ready for review.
- Do not merge the PR in this workflow — use `/merge_pr` for that.
