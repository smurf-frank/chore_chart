---
description: how to commit and push changes in this project
---

# Git Commit & Push Workflow

This project uses a `commit-msg` hook that validates gitmoji format. The hook itself is fast, but `git commit` can still exceed the synchronous wait window and go to background. **Never poll the background process to check completion — verify via `git log` instead.**

## Steps

1. Stage files:

```bash
git add <files>
```

// turbo 2. Check if `PROJECT_BIBLE.md` is among the staged files:

```bash
git diff --cached --name-only | grep "PROJECT_BIBLE.md" && echo "⚠️  BIBLE STAGED" || echo "✅ Bible not staged"
```

**If the Bible is staged: STOP.** Do not proceed until you have shown the user a summary of all changes to `PROJECT_BIBLE.md` and received explicit written approval to commit. Use `git diff --cached PROJECT_BIBLE.md` to show the exact diff.

3. Commit with a gitmoji-prefixed message (`:emoji_code:` format, NOT Unicode emoji):

```bash
git commit -m ":sparkles: feat: description of change"
```

Common codes: `:sparkles:` (feature), `:bug:` (fix), `:memo:` (docs), `:elephant:` (db), `:cloud:` (infra), `:triangular_ruler:` (architecture), `:rocket:` (deploy)

// turbo 4. Immediately verify the commit landed (do NOT wait on the background commit process):

```bash
git log --oneline -3
```

If the commit appears in the log, it succeeded. The background process status is irrelevant.

5. Push to remote:

```bash
git push origin <branch-name>
```

// turbo 6. Verify push succeeded by checking the log output from step 5 for the remote confirmation line, or run:

```bash
git log --oneline origin/<branch-name>..HEAD
```

An empty result means everything is pushed.

## Important Notes

- **Never use Unicode emoji** in commit messages (e.g. 🔥). Always use the `:code:` form.
- **`git commit` will always go to background** due to hook latency. This is expected — use `git log` to confirm, not `command_status` polling.
- `config.yaml` is gitignored — never commit it.
- Never commit API keys, secrets, or absolute local paths.
