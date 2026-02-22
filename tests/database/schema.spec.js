const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('database/schema', path.resolve(__dirname, 'schema.js'));
