---
description: How to perform a security and integrity audit on the project
---

This workflow provides a standardized process for auditing the security and integrity of the Chore Chart codebase and its releases.

## Frequency

- Perform before every MAJOR or MINOR release.
- Perform whenever a core dependency is added.
- Perform as part of a monthly sweep.

## Steps

1.  **Dependency Audit**
    // turbo - [ ] Run `npm audit` to check for known vulnerabilities in dependencies. - [ ] If vulnerabilities are found, run `npm audit fix` or research manual fixes.

2.  **Secret Scanning**
    - [ ] Run a local grep/search for common secret patterns (API keys, private keys, etc.) to ensure none were accidentally committed.
    - [ ] Use `grep -rE "AIza[0-9A-Za-z-_]{35}|[0-9a-f]{32}|-----BEGIN [A-Z ]+ PRIVATE KEY-----" .` (excluding `.git` and `node_modules`).

3.  **GPG & Integrity Check**
    - [ ] Verify that all recent commits by the agent/developer are GPG-signed: `git log --show-signature -n 10`
    - [ ] If a release has just occurred, perform a manual verification of at least one artifact:
        1. Download `<artifact>.apk` and `<artifact>.apk.asc`.
        2. Run `gpg --verify <artifact>.apk.asc <artifact>.apk`.
        3. Verify the output says "Good signature" and matches the `GPG_FINGERPRINT`.

4.  **Husky Enforcement**
    // turbo - [ ] Verify Husky hooks are active: `ls -d .husky/_` - [ ] Test the commit-msg hook by attempting a dummy commit without an emoji (ensure it is blocked).

5.  **GitHub Token Permissions**
    - [ ] Review `.github/workflows/` files.
    - [ ] Ensure `permissions: contents: write` is only used where necessary (Release uploads, notes updates).
    - [ ] Verify no secrets are echoed or leaked in workflow logs.

6.  **Findings & Mitigation**
    - [ ] Document any findings in a temporary log or as a GitHub issue.
    - [ ] Propose and implement fixes immediately for high-risk findings.
    - [ ] Notify the user of the audit completion and results.
