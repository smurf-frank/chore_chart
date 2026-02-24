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

        - [ ] Run the **License Compliance Check**:

    // turbo - [ ] `npx license-checker-rseidelsohn --onlyAllow "MIT;ISC;Apache-2.0;AGPL-3.0;BSD-3-Clause;BSD-2-Clause;OFL-1.1;Unlicense;CC0-1.0;0BSD;BlueOak-1.0.0;CC-BY-3.0;MIT*;(MIT OR GPL-3.0-or-later);(MIT AND Zlib);(MIT AND CC-BY-3.0);LGPL-3.0-or-later;CC-BY-4.0;Python-2.0;(MIT OR CC0-1.0);(AFL-2.1 OR BSD-3-Clause);WTFPL OR ISC;WTFPL;(WTFPL OR MIT)" --summary` - [ ] Update `LICENSE-THIRD-PARTY.md` if any new dependencies were added. - [ ] Run `npm run license-notice` and verify the `licenses-third-party/` directory is updated.
    // turbo - [ ] `npm audit --omit=dev --audit-level=high`

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

5.  **GitHub Release** - [ ] Create the release using the GitHub CLI:
    // turbo - [ ] `gh release create v<VERSION> --title "Release v<VERSION>" --notes-file CHANGELOG.md`

6.  **Verification of Automation**
    - [ ] Monitor GitHub Actions (`android-build.yml` and `archive-src.yml`).
    - [ ] Once complete, verify the release on GitHub contains:
        - [ ] `.apk` and `.apk.asc` (Signature)
        - [ ] `.apk.sha256` and `.apk.sha256.asc` (Signed Checksum)
        - [ ] `.zip` and `.zip.asc`
        - [ ] `.zip.sha256` and `.zip.sha256.asc`
    - [ ] Verify that the `licenses-third-party/` directory is included in the source archive.
    - [ ] Verify that the release notes have been automatically updated with the "Verification" section.

7.  **Final Sync**
    - [ ] Update `MASTER_STATUS.md` to reflect the completed release.
    - [ ] Notify the user that the release is live and verified.
