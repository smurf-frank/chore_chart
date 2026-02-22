const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('chores/crud', path.resolve(__dirname, 'crud.js'));
