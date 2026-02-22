# Master Status: Chore Chart

> **Purpose**: This is the **living document** that tracks your project's current state.

---

## 🎯 Current Focus

### Active Sprint / Phase

**Phase Name**: Capacitor Cross-Platform Integration
**Version**: v0.0.3
**Dates**: 2026-02-15 → 2026-02-19

### This Week's Priority

**Priority**: Integrate Capacitor for cross-platform deployment (Web + Android).

### Status: 🟢 On Track

---

## 📊 Progress Overview

### Completed Milestones

- ✅ **Project Management Setup** (Completed: 2026-02-15)
- ✅ **Core Architecture Foundation** (Completed: 2026-02-15)
- ✅ **Project Infrastructure** (Completed: 2026-02-15)
- ✅ **Release v0.0.1** (Completed: 2026-02-15)
- ✅ **Release v0.0.2** (Completed: 2026-02-16)
- ✅ **Release v0.0.3** (Completed: 2026-02-21)

### In Progress

- ✅ **Capacitor Integration**:
    - Project restructured (`src/`, `tests/`, `docs/`).
    - Android Studio & SDK installed locally.
    - Android platform added and synced.
    - Manual verification of Android build, emulator, and native storage persistence complete.

### Done

- ✅ **Project Restructuring**:
    - Separated concerns by migrating application code to `src/`, testing suite to `tests/`, and planning documents to `docs/`.
    - Updated all CI/CD pipelines, test configuration, and internal script references to reflect the new structure.
- ✅ **Android Development Environment Setup**:
    - Installed Android Studio (Panda 1) and minimal SDK tools (API 34).
    - Configured system environment variables (`ANDROID_HOME`, `JAVA_HOME`, `CAPACITOR_ANDROID_STUDIO_PATH`) globally.
- ✅ **Async Data Layer Migration**:
    - Converted all `ChoreRepository` database transactions to `async/await`.
    - Implemented `StorageStrategy` to swap between Web `sql.js` and Native Capacitor SQLite.
    - Added automated verification via completely rewritten unit testing suite.
- ✅ **Group Rotation Assignment**:
    - Automated 7-day chore rotation through group members.
    - Alphabetical member sorting for deterministic assignment.
    - Modal UI for selecting start member and start day.
- ✅ **Per-Branch Deployments**:
    - Automatic deployment of every branch to `/<branch-name>/`.
    - Release versions deployed to root (`/`).
    - **Channel Switcher**: Dynamic dropdown in Settings modal to switch between deployments.
- ✅ **Security Hardening**:
    - **Service Worker**: Switched to network-first strategy for instant updates.
    - **GH Actions**: Fixed script injection vulnerability in `deploy.yml`.
    - **App Logic**: Added allow-list validation for branch navigation (CodeQL).
    - **PR Protocol**: Mandated security review for all pull requests.
    - **Commit Signing**: Mandated GPG-signed commits in `PROJECT_BIBLE.md`.
- ✅ **Visual & UX Refinement**:
    - Resizable chore column with Settings control.
    - Full-name tooltips on hover.
    - PWA Richer Install UI with device screenshots.
- ✅ **Recover Test Coverage**: Ported all legacy tests to fully parallel async Playwright unit tests.
- [x] **Test Modularization**: Separated the test suite into specific domains (`chores`, `assignments`, `actors`, `settings`, `groups`, `rotations`, `database`).
- [x] **Framework Validation**: Created a meta-test (`tests/framework/framework.spec.js`) to permanently validate the DOM-based runner logic.
- ✅ **Tactile UX for Mobile**:
    - Implemented `mobile-drag-drop` polyfill for seamless touch interactions.
    - Added CSS visual feedback (lifting scale effect and shadow) during dragging.
    - Built-in `navigator.vibrate` haptic feedback for grabbing and dropping markers.

---

## 📋 Context for Next Session

### Where You Left Off

**Last Worked On**: 2026-02-21

**Status**: **Release v0.0.3** is live! The project now features Capacitor integration, an async data layer, a modularized Playwright test suite, and a modern linting/formatting strategy with Husky. PR #29 (Capacitor 8.1.0 upgrade) is open but deferred for verification.

### Next Steps (For Resuming)

1. **PR #29 Verification**: Manually verify and merge the Capacitor 8.1.0 upgrade. Check for any breaking changes in CLI patterns or Android SDK requirements.
2. **CI Pipeline Optimization**: Follow the `docs/playwright_sharding_strategy.md` to optimize the GitHub Actions runner.
3. **Postgres/MySQL Migration (v2)**: Begin transitioning the `ChoreRepository` and `StorageStrategy` to support remote SQL backends.

---

## 📝 Update Log

| Date       | Updated By  | Summary of Changes                                                             |
| ---------- | ----------- | ------------------------------------------------------------------------------ |
| 2026-02-15 | Antigravity | Initial setup, groups, PWA, and v0.0.1 release.                                |
| 2026-02-16 | Antigravity | Implemented Group Rotation feature.                                            |
| 2026-02-16 | Antigravity | Set up per-branch deployments and channel switcher.                            |
| 2026-02-16 | Antigravity | Fixed security vulnerabilities (Actions injection, XSS sink).                  |
| 2026-02-16 | Antigravity | Updated PROJECT_BIBLE with security protocols.                                 |
| 2026-02-16 | Antigravity | Released v0.0.2.                                                               |
| 2026-02-19 | Antigravity | Capacitor setup and Phase 3 Async Data Layer Migration complete.               |
| 2026-02-19 | Antigravity | Restructured to src/tests/docs. Installed Android SDK. Generated Android proj. |
| 2026-02-20 | Antigravity | Verified Android environment, downloaded system image, created AVD.            |
| 2026-02-20 | Antigravity | Completed Phase 4 Verification: Android build, sync, and storage success.      |
| 2026-02-21 | Antigravity | Restructured and recovered legacy test suite using modular Playwright runner.  |
| 2026-02-21 | Antigravity | Cleaned up obsolete documentation and finalized Mobile Tactile UX markers.     |
| 2026-02-21 | Antigravity | Released v0.0.3.                                                               |
