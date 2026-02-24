// Returns 'native' when running inside a Capacitor Android app,
// 'web' when running in a browser.
const StorageStrategy = {
    isNative: () => window.Capacitor?.isNativePlatform?.() ?? false
};
