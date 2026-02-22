const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('settings/prefs', path.resolve(__dirname, 'prefs.js'));
