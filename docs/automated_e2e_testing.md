# Automated End-to-End (E2E) Testing Pipeline

This document outlines the strategy, architecture, and implementation steps for establishing an automated End-to-End (E2E) testing pipeline for the Chore Chart Android application.

The primary goal is to reliably test complex touch interactions (like Drag-and-Drop and column resizing) that occur within the Capacitor WebView, both locally and in a Continuous Integration (CI) environment like GitHub Actions.

## The Architecture: Appium + WebDriverIO

The Chore Chart Android app is powered by Capacitor, meaning the entire UI is an HTML/JS web application running inside a single native Android `WebView`.

Standard Android UI testing frameworks like Espresso or UIAutomator are blind to the DOM inside the WebView. Therefore, we must use a framework capable of "**Context Switching**": starting in the native Android environment, identifying the WebView, and switching into it to interact with the DOM elements.

The industry-standard stack for this is:

1.  **Appium**: An open-source automation server that acts as a bridge. It installs the APK on a device/emulator and uses Android's UiAutomator2 under the hood.
2.  **WebDriverIO (WDIO)**: A next-generation Node.js test automation framework. It sends commands to the Appium server. Crucially, WDIO supports context switching and the **W3C Actions API**, which is required to simulate precise, complex touch gestures (like dragging) that trigger polyfills like `DragDropTouch`.

---

## 1. Local Implementation Guide

### Prerequisites

- Node.js 24 installed locally
- Android Studio installed (with SDK and platform tools configured in your `PATH`)
- An Android Emulator (AVD) created and ready to launch (e.g., Pixel 5 API 36)

### Step 1: Install Dependencies

In the root of your project, install the required automation tools:

```bash
npm install --save-dev @wdio/cli
npx wdio config # Follow the prompts to configure a basic mobile setup
npm install --save-dev appium appium-uiautomator2-driver
```

### Step 2: Configure Appium Driver

Install the UiAutomator2 driver directly into your local Appium instance:

```bash
npx appium driver install uiautomator2
```

### Step 3: Configure `wdio.conf.js`

Update the generated `wdio.conf.js` to define your capabilities. Crucially, you must tell Appium where to find your compiled APK.

```javascript
exports.config = {
    // ... other config ...
    port: 4723, // Default Appium port
    services: ['appium'],
    capabilities: [
        {
            platformName: 'Android',
            'appium:deviceName': 'Pixel_5_API_36', // Match your local emulator name
            'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
            'appium:automationName': 'UiAutomator2',
            'appium:autoGrantPermissions': true
            // Optional: autoWebview: true (If you want Appium to attempt context switch immediately)
        }
    ]
    // ...
};
```

### Step 4: Writing the Test (Context Switching & W3C Actions)

Create a test file (e.g., `test/specs/dragAndDrop.e2e.js`). The key here is switching contexts and using the `action()` API.

```javascript
describe('Chore Chart Interactions', () => {
    it('should drag a marker to a chore cell', async () => {
        // 1. Switch to the WebView context
        const contexts = await driver.getContexts();
        const webview = contexts.find((context) => context.includes('WEBVIEW'));
        await driver.switchContext(webview);

        // 2. Identify Elements
        const marker = await $('#palette-markers .marker').first();
        const targetCell = await $('.board-cell:not(.header)').first();

        // 3. Simulate Complex Drag using W3C Actions API
        // This simulates a literal path a finger would take, triggering the DragDropTouch polyfill
        await driver
            .action('pointer')
            .move({ duration: 0, origin: marker, x: 0, y: 0 })
            .down({ button: 0 }) // Touch start
            .pause(200) // Simulate 'hold to drag' delay
            .move({ duration: 1000, origin: targetCell, x: 0, y: 0 }) // Drag
            .up({ button: 0 }) // Touch end (Drop)
            .perform();

        // 4. Assert the drop was successful
        // (e.g., expect targetCell to contain the marker's class or data ID)
        const cellContents = await targetCell.getHTML();
        expect(cellContents).toContain('marker');
    });
});
```

### Step 5: Running Locally

1. Compile the latest APK: `npx cap sync && cd android && ./gradlew assembleDebug && cd ..`
2. Start your Android Emulator.
3. Run the tests: `npx wdio run wdio.conf.js`

---

## 2. GitHub Actions CI Integration

To ensure interactions aren't broken by future commits, we can run this architecture headlessly in GitHub Actions using the reliable `reactivecircus/android-emulator-runner`.

Create a new workflow file at `.github/workflows/e2e-tests.yml`:

```yaml
name: Android E2E Tests

on:
    push:
        branches: [main]
    pull_request:
        branches: [main]

jobs:
    test:
        runs-on: macos-latest # macOS provides hardware acceleration (HAXM) natively, required for fast Android emulators in CI

        steps:
            - name: Checkout Code
              uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '24' # Or your project's version
                  cache: 'npm'

            - name: Set up JDK
              uses: actions/setup-java@v4
              with:
                  java-version: '21'
                  distribution: 'temurin'
                  cache: gradle

            - name: Install Dependencies
              run: npm ci

            - name: Build Web Assets & Sync Capacitor
              run: npm run sync

            - name: Build Debug APK
              working-directory: ./android
              run: ./gradlew assembleDebug

            - name: Run E2E Tests on Emulator
              uses: reactivecircus/android-emulator-runner@v2
              with:
                  api-level: 36
                  target: google_apis
                  arch: x86_64
                  profile: pixel_5
                  script: npx wdio run wdio.conf.js # This script connects to the local Appium server started by WebdriverIO's appium service
```

### CI Considerations

- **`macos-latest` runner**: It is highly recommended to use macOS runners for Android emulator tests in GitHub Actions. Linux runners require nested virtualization, which is complex and incredibly slow. macOS runners have hardware acceleration out of the box.
- **Flakiness**: E2E UI tests are notoriously flaky due to timing issues. Utilize WebdriverIO's built-in wait commands (e.g., `waitForDisplayed()`, `waitForClickable()`) heavily, rather than hardcoded `.pause()` timeouts.
