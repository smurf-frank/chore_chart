const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('groups/management', path.resolve(__dirname, 'management.js'));
