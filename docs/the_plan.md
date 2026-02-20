# Capacitor Integration: Browser + Android

Convert the Chore Chart from a pure PWA into an app that runs identically in the browser and as a native Android APK using Capacitor.

## User Review Required

> [!IMPORTANT]
> **Async Migration**: Most `ChoreRepository` methods are currently synchronous. To support native SQLite on Android (via `@capacitor-community/sqlite`), which is async, the entire data layer (and its callers in [app.js](file:///home/frank/cosmos/projects/active/chore_chart/app.js)) must be migrated to be `async/await` compliant. This is a significant structural change.

> [!WARNING]
> **Offline Assets**: We will stop relying on CDNs for `sql.js` and Google Fonts. These assets will be bundled locally.

## Completed Work

### Phase 1: Capacitor Core Setup

#### [MODIFY] [package.json](package.json)
- Add Capacitor dependencies and build/sync scripts as outlined in [next_phase.md](next_phase.md).

#### [NEW] [capacitor.config.json](capacitor.config.json)
- Define `appId` (`com.smurffrank.chorechart`), `appName`, and `webDir`.

#### Verification (Phase 1)
- [x] Run `npm install` and verify no dependency conflicts.
- [x] Verify `npx cap init` command executes successfully with the new config.

---

### Phase 2: Offline-First Assets
- [x] **Local Vendor Assets**: [sql-wasm.js](src/vendor/sql-wasm.js) and [sql-wasm.wasm](src/vendor/sql-wasm.wasm) are self-hosted in `src/vendor/`.
- [x] **Self-hosted Fonts**: Inter and Outfit fonts are bundled in `src/fonts/` and declared in [fonts.css](src/fonts.css).
- [x] **HTML/JS Configuration**: [index.html](src/index.html) and [db.js](src/db.js) already point to these local assets.

> [!NOTE]
> This phase was confirmed to be completed in PR #27. No further action is needed for this component.

---

### Phase 3: Platform-Aware Data Layer

#### [NEW] [storage-strategy.js](src/storage-strategy.js)
- Platform detection logic (`window.Capacitor.isNativePlatform()`).

#### [MODIFY] [db.js](src/db.js)
- Migration to `async` for all schema and migration functions.
- Implementation of `CapacitorSQLite` for native Android path.

#### [MODIFY] [repository.js](src/repository.js)
- **Make all methods `async`**.
- Handle both synchronous `sql.js` (Web) and asynchronous `CapacitorSQLite` (Android) backends.

#### [MODIFY] [app.js](src/app.js)
- Update all calls to `ChoreRepository` and [db.js](src/db.js) to use `await`.

#### Verification (Phase 3)
- [x] **Browser Verification**: Open the app in a browser. Verify all features (add/remove chores, assignments, rotations) work as before.
- [x] **Data Persistence**: Refresh page and verify data persists in `localStorage` via the async `saveDatabase`.
- [x] **Automated Tests**: Run `npm test` (Playwright) and ensure all existing tests pass with the new async architecture.

---

## Proposed Changes

### Phase 4: Android Project Generation
- [x] Run `npx cap add android` and `npx cap sync`.
- [x] Installed Android Studio and SDK and opened IDE via `npx cap open android`.

#### Verification (Phase 4)
- [ ] **Android Build**: Run `npx cap open android`. Verify Android Studio opens and the project builds successfully.
- [ ] **Capacitor Sync**: Ensure `npx cap sync` correctly copies web assets into the `android/` directory.
- [ ] **Emulator Launch**: Run the app on an Android emulator. Verify the board loads and fonts render correctly.
- [ ] **Native Storage**: Add an assignment on the emulator, kill the app, and reopen. Verify the assignment persists (confirming `CapacitorSQLite` is working).

> [!IMPORTANT]
> **Checkpoint Phase 4**: I will bridge the work with a summary and verification results, then pause for your final review.
