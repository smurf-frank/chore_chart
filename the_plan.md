# Capacitor Integration: Browser + Android

Convert the Chore Chart from a pure PWA into an app that runs identically in the browser and as a native Android APK using Capacitor.

## User Review Required

> [!IMPORTANT]
> **Async Migration**: Most `ChoreRepository` methods are currently synchronous. To support native SQLite on Android (via `@capacitor-community/sqlite`), which is async, the entire data layer (and its callers in [app.js](file:///home/frank/cosmos/projects/active/chore_chart/app.js)) must be migrated to be `async/await` compliant. This is a significant structural change.

> [!WARNING]
> **Offline Assets**: We will stop relying on CDNs for `sql.js` and Google Fonts. These assets will be bundled locally.

## Completed Work

### Phase 2: Offline-First Assets
- [x] **Local Vendor Assets**: [sql-wasm.js](file:///home/frank/cosmos/projects/active/chore_chart/vendor/sql-wasm.js) and [sql-wasm.wasm](file:///home/frank/cosmos/projects/active/chore_chart/vendor/sql-wasm.wasm) are self-hosted in `vendor/`.
- [x] **Self-hosted Fonts**: Inter and Outfit fonts are bundled in `fonts/` and declared in [fonts.css](file:///home/frank/cosmos/projects/active/chore_chart/fonts.css).
- [x] **HTML/JS Configuration**: [index.html](file:///home/frank/cosmos/projects/active/chore_chart/index.html) and [db.js](file:///home/frank/cosmos/projects/active/chore_chart/db.js) already point to these local assets.

## Proposed Changes

### Phase 1: Capacitor Core Setup

#### [MODIFY] [package.json](file:///home/frank/cosmos/projects/active/chore_chart/package.json)
- Add Capacitor dependencies and build/sync scripts as outlined in [next_phase.md](file:///home/frank/cosmos/projects/active/chore_chart/next_phase.md).

#### [NEW] [capacitor.config.json](file:///home/frank/cosmos/projects/active/chore_chart/capacitor.config.json)
- Define `appId` (`com.smurffrank.chorechart`), `appName`, and `webDir`.

#### Verification (Phase 1)
- [x] Run `npm install` and verify no dependency conflicts.
- [x] Verify `npx cap init` command executes successfully with the new config.

> [!IMPORTANT]
> **Checkpoint**: I will provide a summary of the setup and verification results, then pause and use `notify_user` to get approval before proceeding to Phase 3.

---

---

### Phase 2: Offline-First Assets (ALREADY COMPLETED)

> [!NOTE]
> This phase was confirmed to be completed in PR #27. No further action is needed for this component.

---

### Phase 3: Platform-Aware Data Layer

#### [NEW] [storage-strategy.js](file:///home/frank/cosmos/projects/active/chore_chart/storage-strategy.js)
- Platform detection logic (`window.Capacitor.isNativePlatform()`).

#### [MODIFY] [db.js](file:///home/frank/cosmos/projects/active/chore_chart/db.js)
- Migration to `async` for all schema and migration functions.
- Implementation of `CapacitorSQLite` for native Android path.

#### [MODIFY] [repository.js](file:///home/frank/cosmos/projects/active/chore_chart/repository.js)
- **Make all methods `async`**.
- Handle both synchronous `sql.js` (Web) and asynchronous `CapacitorSQLite` (Android) backends.

#### [MODIFY] [app.js](file:///home/frank/cosmos/projects/active/chore_chart/app.js)
- Update all calls to `ChoreRepository` and [db.js](file:///home/frank/cosmos/projects/active/chore_chart/db.js) to use `await`.

#### Verification (Phase 3)
- [x] **Browser Verification**: Open the app in a browser. Verify all features (add/remove chores, assignments, rotations) work as before.
- [x] **Data Persistence**: Refresh page and verify data persists in `localStorage` via the async [saveDatabase](file:///home/frank/cosmos/projects/active/chore_chart/db.js#232-242).
- [x] **Automated Tests**: Run `npm test` (Playwright) and ensure all existing tests pass with the new async architecture.

> [!IMPORTANT]
> **Checkpoint**: I will provide a summary of the code migration and verification results, then pause and use `notify_user` to get approval before proceeding to Phase 4.

---

### Phase 4: Android Project Generation
- Run `npx cap add android` and `npx cap sync`.

#### Verification (Phase 4)
- [ ] **Android Build**: Run `npx cap open android`. Verify Android Studio opens and the project builds successfully.
- [ ] **Capacitor Sync**: Ensure `npx cap sync` correctly copies web assets into the `android/` directory.
- [ ] **Emulator Launch**: Run the app on an Android emulator. Verify the board loads and fonts render correctly.
- [ ] **Native Storage**: Add an assignment on the emulator, kill the app, and reopen. Verify the assignment persists (confirming `CapacitorSQLite` is working).

> [!IMPORTANT]
> **Checkpoint Phase 4**: I will bridge the work with a summary and verification results, then pause for your final review.

