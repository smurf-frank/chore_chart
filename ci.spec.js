const { test, expect } = require('@playwright/test');
const path = require('path');

test('run browser unit tests', async ({ page }) => {
    // Load the local tests.html file
    const testUrl = `file://${path.resolve(__dirname, 'tests.html')}`;
    await page.goto(testUrl);

    // Wait for the final summary to appear (indicating tests finished)
    // The summary div is populated at the end of runTests()
    // Wait for the final summary to appear and show results (no longer "Running...")
    const summary = page.locator('#summary');
    await expect(summary).not.toContainText('Running...', { timeout: 15000 });

    // Get the text content of the summary
    const summaryText = await summary.innerText();
    console.log('Test Summary:', summaryText);

    // Check the document title for the pass indicator
    // tests.html sets title to "✓ All Passed - Unit Tests" on success
    const title = await page.title();
    expect(title).toContain('✓ All Passed');

    // Also verify no "failed" class in the summary (just in case title check isn't enough)
    const failCount = await page.locator('#summary .fail').count();
    expect(failCount).toBe(0);
});
