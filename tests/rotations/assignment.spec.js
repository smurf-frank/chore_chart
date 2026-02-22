const { runSuiteInBrowser } = require('../framework/test-bridge');
const path = require('path');

runSuiteInBrowser('rotations/assignment', path.resolve(__dirname, 'assignment.js'));
