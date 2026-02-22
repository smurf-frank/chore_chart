const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

/**
 * Helper to run a specific test suite inside the custom HTML/JS framework
 * @param {string} testSuitePath - Relative path to the spec file being tested
 * @param {string} jsLogicPath - Absolute path to the JS module containing the describe() blocks
 */
function runSuiteInBrowser(testSuitePath, jsLogicPath) {
    test(`Run ${testSuitePath}`, async ({ page }) => {
        const baseUrl = `file://${path.resolve(__dirname, 'base.html')}`;

        // Log browser console stuff to terminal for debugging
        page.on('console', msg => {
            if (msg.type() === 'error') console.error(`BROWSER ERROR: ${msg.text()}`);
        });

        await page.goto(baseUrl);

        // Wait for the module script to initialize
        await page.waitForFunction(() => typeof window.runTests === 'function');

        // Read the JS logic from disk
        const specLogic = fs.readFileSync(jsLogicPath, 'utf8');

        // Inject the logic into the page
        await page.addScriptTag({ content: specLogic });

        // Trigger the internal runner
        await page.evaluate(async () => {
            await window.runTests();
        });

        // Wait for framework to finish
        const summary = page.locator('#summary');
        await expect(summary).not.toContainText('Running...', { timeout: 15000 });

        // Ensure title shows pass
        const title = await page.title();
        if (!title.includes('✓ All Passed')) {
            const failures = await page.locator('.test-row.fail').allTextContents();
            console.log(`[${testSuitePath}] Failures:\n${failures.join('\n')}`);
        }

        // The core assertion for Playwright
        expect(title).toContain('✓ All Passed');

        const failCount = await page.locator('#summary .fail').count();
        expect(failCount).toBe(0);
    });
}

module.exports = { runSuiteInBrowser };
