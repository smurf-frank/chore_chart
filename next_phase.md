# Capacitor Integration: Browser + Android

Convert the chore chart from a pure PWA into an app that runs identically in the browser **and** as a native Android APK, using [Capacitor](https://capacitorjs.com/) as the bridge.

---

## Background

The project is already structured perfectly for this:
- `manifest.json` + `sw.js` → already a valid PWA
- `ChoreRepository` pattern → storage layer is fully swappable
- All HTML/CSS/JS is static assets → Capacitor can wrap them with zero structural changes

The only real work is:
1. Setting up Capacitor's toolchain
2. Swapping `localStorage`-backed `sql.js` for `@capacitor-community/sqlite` on Android (while keeping `sql.js` in the browser)
3. Fixing the online-only assets (`Google Fonts`, the `sql.js CDN`) so they work offline on Android

---

## Proposed Changes

### Phase 1 — Capacitor Setup

#### [MODIFY] [package.json](file:///home/frank/cosmos/projects/active/chore_chart/package.json)
Add Capacitor core and CLI as dev dependencies, and add `build` and `sync` scripts:
```json
"scripts": {
  "test": "playwright test",
  "build": "echo 'No build step — static assets'",
  "sync": "cap sync"
},
"dependencies": {
  "@capacitor/core": "^6.0.0"
},
"devDependencies": {
  "@playwright/test": "^1.49.0",
  "@capacitor/cli": "^6.0.0",
  "@capacitor/android": "^6.0.0",
  "@capacitor-community/sqlite": "^6.0.0"
}
```

#### [NEW] [capacitor.config.json](file:///home/frank/cosmos/projects/active/chore_chart/capacitor.config.json)
Tells Capacitor where web assets live and the Android package ID:
```json
{
  "appId": "com.smurffrank.chorechart",
  "appName": "Chore Chart",
  "webDir": ".",
  "android": {
    "allowMixedContent": false
  }
}
```

---

### Phase 2 — Offline-First Asset Fix

#### [MODIFY] [index.html](file:///home/frank/cosmos/projects/active/chore_chart/index.html)

**Remove the CDN `sql-wasm.js` script tag** (line 199) and add a local copy instead. Also replace Google Fonts CDN links with a self-hosted font file.

```diff
-    <link rel="preconnect" href="https://fonts.googleapis.com">
-    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
-    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;700&display=swap" rel="stylesheet">
+    <link rel="stylesheet" href="fonts.css">
```

```diff
-    <script src="https://sql.js.org/dist/sql-wasm.js"></script>
+    <script src="vendor/sql-wasm.js"></script>
```

Download these files locally:
- `vendor/sql-wasm.js` — from `https://sql.js.org/dist/sql-wasm.js`
- `vendor/sql-wasm.wasm` — from `https://sql.js.org/dist/sql-wasm.wasm`
- `fonts/` — downloaded Inter and Outfit font files (woff2)
- `fonts.css` — `@font-face` declarations pointing to `fonts/`

Update `locateFile` in `db.js` line 21 to point to `vendor/`:
```diff
-    locateFile: file => `https://sql.js.org/dist/${file}`
+    locateFile: file => `vendor/${file}`
```

---

### Phase 3 — Platform-Aware Storage Layer

This is the most significant code change. On Android, we use native SQLite (real file, survives reinstalls). In the browser, we keep `sql.js` + `localStorage`.

#### [NEW] [storage-strategy.js](file:///home/frank/cosmos/projects/active/chore_chart/storage-strategy.js)
A tiny module that detects the platform and exports a `StorageStrategy` object:

```js
// Returns 'native' when running inside a Capacitor Android app,
// 'web' when running in a browser.
const StorageStrategy = {
  isNative: () => window.Capacitor?.isNativePlatform?.() ?? false
};
```

#### [MODIFY] [db.js](file:///home/frank/cosmos/projects/active/chore_chart/db.js)
Split `initDatabase()` and `saveDatabase()` to branch by platform:

```js
async function initDatabase() {
  if (_db) return _db;

  if (StorageStrategy.isNative()) {
    // Use @capacitor-community/sqlite
    const { CapacitorSQLite, SQLiteConnection } = await import('./vendor/capacitor-sqlite.js');
    const sqlite = new SQLiteConnection(CapacitorSQLite);
    _db = await sqlite.createConnection('chore_chart', false, 'no-encryption', 1, false);
    await _db.open();
    // run schema creation using _db.execute() instead of _db.run()
  } else {
    // Existing sql.js path — unchanged
    const SQL = await initSqlJs({ locateFile: file => `vendor/${file}` });
    const savedData = localStorage.getItem(DB_NAME);
    _db = savedData
      ? new SQL.Database(Uint8Array.from(atob(savedData), c => c.charCodeAt(0)))
      : new SQL.Database();
  }

  await createSchema();
  // ... rest of migrations
  return _db;
}

function saveDatabase() {
  if (!_db) return;
  if (StorageStrategy.isNative()) return; // Native SQLite auto-persists
  // existing localStorage export path unchanged
  const data = _db.export();
  const base64 = btoa(String.fromCharCode(...data));
  localStorage.setItem(DB_NAME, base64);
}
```

> [!IMPORTANT]
> The native SQLite API uses `async` methods (`execute`, `query`) while `sql.js` is synchronous. All schema functions inside `db.js` (`createSchema`, `migrateToActors`, etc.) need to become `async` and `await` their calls. The public-facing `repository.js` already uses `async`-friendly patterns from `app.js`, but `ChoreRepository` methods that call `db.run()` synchronously must also become `async` in the native branch.
>
> **Strategy**: Keep two internal implementations, selected at init time, and expose a unified async API upward. `repository.js` method signatures **do not change**.

#### [MODIFY] [index.html](file:///home/frank/cosmos/projects/active/chore_chart/index.html)
Add `storage-strategy.js` before `db.js`:
```diff
+    <script src="storage-strategy.js"></script>
     <script src="db.js"></script>
```

---

### Phase 4 — Generate Android Project

These are shell commands to run once after the npm packages are installed:

```bash
# Install packages
npm install

# Initialize Capacitor (reads capacitor.config.json)
npx cap init "Chore Chart" "com.smurffrank.chorechart" --web-dir .

# Add the Android platform
npx cap add android

# Sync web assets into the Android project
npx cap sync android
```

This generates an `android/` directory (a standard Gradle/Android Studio project) at the root of the repo.

#### [MODIFY] [.gitignore](file:///home/frank/cosmos/projects/active/chore_chart/.gitignore)
Add:
```
node_modules/
android/.gradle/
android/app/build/
```

---

## Verification Plan

### Browser Verification (Unchanged Behavior)
```bash
# Serve locally — same as current workflow
npx serve .
# or
python3 -m http.server 8080
```
Open `http://localhost:8080` in a browser and verify:
- [ ] App loads without network requests to `sql.js.org` or `fonts.googleapis.com`
- [ ] Chores, members, and assignments persist across page refreshes
- [ ] All existing Playwright tests still pass: `npm test`

### Android Verification (Emulator)
```bash
# Open in Android Studio (requires Android Studio installed)
npx cap open android
```
In Android Studio:
- [ ] Build succeeds (`./gradlew assembleDebug`)
- [ ] Run on an emulator (API 30+) — app launches to the board
- [ ] Add an assignment, kill + reopen the app — assignment persists (this validates native SQLite, not `localStorage`)
- [ ] Fonts render correctly (validates offline font fix)
- [ ] No network calls fail (validates all CDN assets are local)

### Playwright (Existing CI)
The existing `ci.spec.js` test runs against the web build and continues to validate the browser path:
```bash
npm test
```
No changes to the test file are needed.
