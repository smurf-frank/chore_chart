const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

test('Framework Validation (Meta-Test)', async ({ page }) => {
    const baseUrl = `file://${path.resolve(__dirname, 'base.html')}`;

    // We expect the intentional failures in the console, so we don't console.error them here
    // But we still log page errors
    page.on('pageerror', (err) => console.log(`PAGE ERROR: ${err.message}`));

    await page.goto(baseUrl);

    // Wait for the module script to initialize the globals
    await page.waitForFunction(() => typeof window.runTests === 'function');

    // We inject a fake test suite that contains both passing and intentionally failing assertions
    const logicCode = `
        describe('Meta Passing Suite', () => {
            it('should pass a basic assertion', () => {
                expect(1).toBe(1);
            });
            it('should pass an array inclusion', () => {
                expect([1, 2, 3]).toContain(2);
            });
        });

        describe('Meta Failing Suite', () => {
            it('should intentionally fail a toBe assertion', () => {
                expect(1).toBe(2);
            });
            it('should fail an array inclusion', () => {
                expect([1, 2]).toContain(3);
            });
        });

        window.runTests();
    `;

    await page.addScriptTag({ content: logicCode });

    // Wait for tests to finish processing
    const summary = page.locator('#summary');
    await expect(summary).not.toContainText('Running...', { timeout: 15000 });

    // Verify the UI accurately reflects the passes and failures

    // Total numbers check
    await expect(summary).toContainText('2 passed');
    await expect(summary).toContainText('2 failed');
    await expect(summary).toContainText('4 total');

    // Document title check
    const title = await page.title();
    expect(title).toBe('✗ 2 Failed - Unit Tests');

    // Verify row styling and exact error messages
    const failRows = await page.locator('.test-row.fail').all();
    expect(failRows.length).toBe(2);

    // Check specific error traces
    const firstErrorObj = page.locator('.test-row.fail').nth(0).locator('.test-error');
    await expect(firstErrorObj).toContainText('Expected 2, got 1');

    const secondErrorObj = page.locator('.test-row.fail').nth(1).locator('.test-error');
    await expect(secondErrorObj).toContainText('Expected array to contain 3');
});
