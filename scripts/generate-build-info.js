const fs = require('fs');

const date = new Date();
const buildTimestamp = date.toLocaleString('en-US', {
    timeZoneName: 'short',
    hour12: true,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
});

const content = `window.BUILD_INFO = "Build: ${buildTimestamp}";\n`;
fs.writeFileSync('src/build-version.js', content);
console.log(`Generated build info: ${buildTimestamp}`);
