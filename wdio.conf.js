exports.config = {
    runner: 'local',
    port: 4723,
    specs: ['./tests/e2e/**/*.js'],
    exclude: [],
    maxInstances: 1,
    capabilities: [
        {
            platformName: 'Android',
            'appium:deviceName': 'Pixel_5_API_36',
            'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
            'appium:automationName': 'UiAutomator2',
            'appium:autoGrantPermissions': true,
            'appium:newCommandTimeout': 240
        }
    ],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    services: ['appium'],
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
};
