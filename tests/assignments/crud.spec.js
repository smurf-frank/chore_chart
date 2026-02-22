const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('assignments/crud', path.resolve(__dirname, 'crud.js'));
