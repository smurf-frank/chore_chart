# Husky Git Hooks Workflow

This project uses [Husky](https://typicode.github.io/husky/) to manage and enforce Git hooks.

## Why Husky?

Standard Git hooks (in `.git/hooks/`) are not tracked by version control, making it difficult to share enforcement rules across a team. Husky solves this by:

1.  **Shared Hooks**: Stores hooks in the `.husky/` directory, which is committed to the repository.
2.  **Automatic Setup**: Automatically configures local Git settings during `npm install`.
3.  **Consistency**: Ensures every developer (and AI assistant) follows the same linting, formatting, and commit standards.

## Usage & Enforcement

We currently enforce the following:

### 1. Pre-commit (`pre-commit`)

Runs `lint-staged` before every commit. This ensures that:

- **JavaScript/CSS/HTML**: Files are properly linted and formatted.
- **Markdown**: All documentation follows consistent formatting styles.

### 2. Commit Message (`commit-msg`)

Enforces the **Emoji Prefix** rule defined in the [Project Bible](../PROJECT_BIBLE.md). All commit messages must start with a relevant emoji (e.g., ✨, 🐛, 📝) or a text code (e.g., `:sparkles:`).

### 3. Pre-push (`pre-push`)

Runs `npm run lint`, `npm test`, `npm audit --audit-level=high`, and a **License Compliance Check** before any push to the remote. This acts as a comprehensive safety check to ensure that only stable, secure, and legally compliant code reaches the central repository.

### 4. Post-merge (`post-merge`)

Automatically checks for changes in `package-lock.json` after a `pull` or `merge`. If changes are found, it triggers `npm install` to keep your local dependencies in sync with the team without manual intervention.

## Setup for Developers

If you are setting up the project for the first time:

```bash
# 1. Install dependencies (this automatically initializes Husky)
npm install

# 2. Verify Husky is active
# If the .husky/_ directory exists, you are ready to go!
ls -d .husky/_
```

## Troubleshooting

- **Bypassing hooks**: Never use `--no-verify`. If a hook fails, fix the underlying linting or formatting issue.
- **Hooks not firing**: Ensure you have run `npm install`. If issues persist, you can manually trigger setup with `npx husky install`.
