---
description: list all available slash command workflows in this project
---

# List Workflows

// turbo

1. List all available workflows:

```bash
ls .agent/workflows/
```

// turbo 2. Show each workflow's description:

```bash
grep -h "^description:" .agent/workflows/*.md | sed 's/description: //'
```

3. Summarize the available slash commands to the user in a table:

| Slash Command           | Description                                                            |
| ----------------------- | ---------------------------------------------------------------------- |
| `/session_start`        | Start a new session — restore context from Bible, Status, and open PRs |
| `/git_commit_and_push`  | Commit with gitmoji and push, verify via git log                       |
| `/pre_api_commit`       | Security checklist before committing API-touching code                 |
| `/update_master_status` | End-of-session update to MASTER_STATUS.md                              |
| `/create_pr`            | Pre-flight checks, conflict detection, create draft PR                 |
| `/merge_pr`             | Merge an approved PR with squash, clean up branch                      |
| `/list_workflows`       | Show this list                                                         |
