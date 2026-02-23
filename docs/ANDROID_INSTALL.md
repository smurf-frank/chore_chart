# 📱 Android Installation Guide

This guide explains how to install **Chore Chart** on your Android device.

## Option 1: Native Android APK (Recommended)

This provides the best performance and a fully native experience.

1.  **Download**: Navigate to the [Latest GitHub Release](https://github.com/smurf-frank/chore_chart/releases/latest).
2.  **Select Artifact**: Download the file named like `chore-chart-apk--master--[timestamp].apk`.
3.  **Install**: Open the `.apk` file on your device. You may need to enable "Allow from this source" in your Android security settings.
4.  **Verify**: Look for the **"CC"** icon in your app drawer.

## Option 2: Web App (PWA)

Ideal if you don't want to install an APK or are using a shared device.

1.  **Open Chrome**: Navigate to [https://smurf-frank.github.io/chore_chart/](https://smurf-frank.github.io/chore_chart/).
2.  **Add to Home screen**:
    - Tap the **Menu** icon (three dots `⋮`).
    - Select **"Install app"** or **"Add to Home screen"**.
3.  **Confirm**: Tap **"Install"**.

## Option 3: Developer / Source Build

If you want to build the app yourself or customize it.

1.  **Download Source**: Download the `chore-chart-src--[branch]--[timestamp].zip` from the [Releases](https://github.com/smurf-frank/chore_chart/releases).
2.  **Extract**: Unzip the archive.
3.  **Build**:
    ```bash
    npm install
    npm run build
    npx cap sync android
    # Open in Android Studio to run on physical device
    npx cap open android
    ```

## 🔒 Security & Verification

All official releases are signed for your protection.

- **Checksums**: Use `sha256sum -c <file>.sha256` to verify file integrity.
- **GPG Signatures**: Verify the author's signature using `gpg --verify <file>.asc <file>`.
- **Key ID**: Refer to the release notes for the specific GPG Fingerprint used for that version.
