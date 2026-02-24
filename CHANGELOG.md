# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-02-23

### Added

- **Production Tagging**: Automated pipeline for official artifact signing (APK, ZIP, SHA256) via GitHub Releases.
- **E2E Mobile Architecture**: Formalized Appium and WebDriverIO native interface bindings for Android testing in `docs/automated_e2e_testing.md`.
- **Target OS Compatibility**: Android 15 Edge-to-Edge compliance established via CSS `env(safe-area-inset)` fallbacks.

### Changed

- **Capacitor 8 Upgrade**: Migrated Android mobile bindings to `v8.1.0` utilizing API 36 compiling with Java 21 logic.
- **Native User Interface**: Replaced generic polyfill with `DragDropTouch.js` to restore tactile UX and properly dispatch nested `touchmove` events for column resize handles.

### Security

- **Strict Dependency Overrides**: Forced secure `minimatch` resolution to address high-severity Regular Expression Denial of Service (ReDoS) vulnerability.

## [0.0.3] - 2026-02-21

### Added

- **Capacitor Integration**: Bootstrapped `@capacitor/core` and `@capacitor/android` to wrap the web assets into a native offline-first Android app.
- **Async Data Layer**: Abstracted local storage to support both synchronous Web SQLite (`sql.js`) and asynchronous native Android SQLite (`@capacitor-community/sqlite`).
- **Tactile UX**: Implemented `mobile-drag-drop` polyfill and `navigator.vibrate()` haptic feedback for a realistic, physical magnet feel on mobile screens.
- **Continuous Integration**: Rebuilt the Playwright test runner to fully support parallel worker threads against async modules under `.github/workflows/ci.yml`.
- **Code Quality**: Added a three-tier enforcement policy for ESLint and Prettier code quality checking using Husky git hooks and GitHub Actions.

### Changed

- Refactored `ChoreRepository` and all its usage points in `app.js` to strictly implement `async`/`await` patterns.
- Replaced monolithic synchronous tests with modularized async test blocks separated by domain (e.g., `tests/chores`, `tests/actors`).
- Updated `index.html` to load fonts and vendor scripts locally (offline-first) rather than through external CDNs.

## [0.0.2] - 2026-02-16

### Added

- **Group Rotation Assignment**: Modal UI and automated 7-day chore rotation through group members with dynamic alphabetical sorting.
- **Channel Switcher**: Added a dynamic dropdown to the Settings modal to switch between per-branch deployments (`/feature-name/`) and production (`/`).
- **Security Protocols**: Added rigorous branch navigation validation (CodeQL checked), mandated GPG-signed commits, and updated the Service Worker to a network-first strategy for instant cache busting.

## [0.0.1] - 2026-02-15

### Added

- Initial project structure featuring a digital magnetic bulletin board for chore management.
- Skeuomorphic marker placement logic and visual UI grid layout.
- Synchronous local browser database using `sql.js`.
- Basic GitHub pages deployment via `deploy.yml`.
