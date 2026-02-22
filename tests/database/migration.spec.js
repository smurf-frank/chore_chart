const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('database/migration', path.resolve(__dirname, 'migration.js'));
