// tests/framework/runner.js

const suites = [];
let currentSuite = null;

function describe(name, fn) {
    currentSuite = { name, tests: [], beforeEachFn: null };
    suites.push(currentSuite);
    fn();
}

function beforeEach(fn) {
    if (currentSuite) currentSuite.beforeEachFn = fn;
}

function it(name, fn) {
    if (currentSuite) currentSuite.tests.push({ name, fn });
}

function expect(actual) {
    return {
        toBe(expected) {
            if (actual !== expected) throw new Error(`Expected ${expected}, got ${actual}`);
        },
        toBeGreaterThan(n) {
            if (!(actual > n)) throw new Error(`Expected ${actual} > ${n}`);
        },
        toContain(item) {
            if (!actual.includes(item)) throw new Error(`Expected array to contain ${item}`);
        }
    };
}

async function runTests() {
    const SQL = await window.initSqlJs({
        locateFile: (file) => `https://sql.js.org/dist/${file}`
    });

    let totalPass = 0,
        totalFail = 0;
    const resultsDiv = document.getElementById('results');

    for (const suite of suites) {
        const suiteDiv = document.createElement('div');
        suiteDiv.className = 'suite';

        const header = document.createElement('div');
        header.className = 'suite-header';
        header.innerHTML = `<span>${suite.name}</span>`;
        suiteDiv.appendChild(header);

        let suitePass = 0,
            suiteFail = 0;

        for (const test of suite.tests) {
            let error = null;

            // Fresh DB for each test using direct assignment to the global db.js variable
            localStorage.removeItem(DB_NAME);
            _db = { isNative: false, client: new SQL.Database() };

            if (suite.beforeEachFn) {
                try {
                    await suite.beforeEachFn();
                } catch (e) {
                    error = e;
                }
            }

            if (!error) {
                try {
                    await test.fn();
                } catch (e) {
                    error = e;
                    console.error('TEST ERROR:', test.name, e);
                }
            }
            if (error && suite.beforeEachFn && error.message === undefined)
                console.error('BEFORE EACH ERROR:', suite.name, error);

            const passed = !error;
            if (passed) {
                totalPass++;
                suitePass++;
            } else {
                totalFail++;
                suiteFail++;
            }

            const row = document.createElement('div');
            row.className = `test-row ${passed ? 'pass' : 'fail'}`;
            row.innerHTML = `
                <span class="test-icon">${passed ? '✓' : '✗'}</span>
                <div class="test-name">
                    ${test.name}
                    ${error ? `<div class="test-error">${error.stack || error.message || error}</div>` : ''}
                </div>
            `;
            suiteDiv.appendChild(row);
        }

        header.innerHTML = `<span>${suite.name}</span> <span class="${suiteFail ? 'fail' : 'pass'}" style="float:right; font-weight:normal;">${suiteFail ? suiteFail + ' failed' : suitePass + ' passed'}</span>`;
        resultsDiv.appendChild(suiteDiv);
    }

    const summary = document.getElementById('summary');
    summary.innerHTML = `
        <span class="pass">${totalPass} passed</span> · 
        <span class="${totalFail ? 'fail' : ''}">${totalFail} failed</span> · 
        ${totalPass + totalFail} total
    `;
    document.title = totalFail ? `✗ ${totalFail} Failed - Unit Tests` : `✓ All Passed - Unit Tests`;
}

// Make them globally available for scripts injected into the page
window.describe = describe;
window.beforeEach = beforeEach;
window.it = it;
window.expect = expect;
window.runTests = runTests;
