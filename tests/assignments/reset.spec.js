const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('assignments/reset', path.resolve(__dirname, 'reset.js'));
