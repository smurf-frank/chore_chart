---
description: How to perform a full project release with GPG signing and checksums
---

This workflow guides the AI engineer through the official release process for Chore Chart.

## Prerequisites

- [ ] Ensure `scripts/setup-release-gpg.sh` has been run and secrets are set in GitHub.
- [ ] Verify `GPG_FINGERPRINT` is available in repository variables.

## Steps

1.  **Preparation**
    // turbo - [ ] `git checkout master`
    // turbo - [ ] `git pull origin master` - [ ] Run `npm run lint` and `npm test` to ensure stability.

2.  **Version Bump**
    - [ ] Update version in `package.json`.
    - [ ] Update `PROJECT_BIBLE.md` with the new version number.
    - [ ] Add entries to `CHANGELOG.md`.

3.  **Active Reflection**
    - [ ] Run the `sync-checkpoint` workflow.
    - [ ] Verify that the commit message for the version bump starts with :bookmark: or 🔖.

4.  **Tagging**
    - [ ] Create a signed git tag: `git tag -s v<VERSION> -m "Release v<VERSION>"`
    - [ ] Push the tag: `git push origin v<VERSION>`

5.  **GitHub Release**
    - [ ] Go to GitHub UI and "Draft a new release".
    - [ ] Select the new tag.
    - [ ] Title: `Release v<VERSION>`
    - [ ] Description: Paste content from `CHANGELOG.md`.
    - [ ] **Publish Release**.

6.  **Verification of Automation**
    - [ ] Monitor GitHub Actions (`android-build.yml` and `archive-src.yml`).
    - [ ] Once complete, verify the release on GitHub contains:
        - [ ] `.apk` and `.apk.asc` (Signature)
        - [ ] `.apk.sha256` and `.apk.sha256.asc` (Signed Checksum)
        - [ ] `.zip` and `.zip.asc`
        - [ ] `.zip.sha256` and `.zip.sha256.asc`
    - [ ] Verify that the release notes have been automatically updated with the "Verification" section.

7.  **Final Sync**
    - [ ] Update `MASTER_STATUS.md` to reflect the completed release.
    - [ ] Notify the user that the release is live and verified.
