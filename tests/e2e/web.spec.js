const { test, expect } = require('@playwright/test');

test.describe('Web E2E: App Bootstrap & Interactions', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('#chore-board')).not.toHaveClass(/board-loading/);
    });

    test('should load the app header with the Chore Chart title', async ({ page }) => {
        const title = page.locator('#chart-title');
        await expect(title).toBeVisible();
        await expect(title).toContainText('Chore Chart');
    });

    test('should render the chore board container', async ({ page }) => {
        const board = page.locator('#chore-board');
        await expect(board).toBeVisible();
    });

    test('should render the marker palette section', async ({ page }) => {
        const palette = page.locator('#marker-palette');
        await expect(palette).toBeVisible();
    });

    test('should show the Members button in the header', async ({ page }) => {
        const membersBtn = page.locator('#members-btn');
        await expect(membersBtn).toBeVisible();
    });

    test('should render an assigned marker in the board cell and allow removal via double-click', async ({
        page
    }) => {
        // Target an actual assignment cell, not the corner or chore name cells
        const firstCell = page.locator('.assignment-cell').first();
        const htmlBefore = await firstCell.innerHTML();

        // Playwright/Chromium headless natively struggles with DragDropTouch.
        // For the Web E2E, we verify UI reactivity by bypassing the drag
        // gesture and invoking the app logic directly, then verifying the DOM.
        await page.evaluate(async () => {
            const choreId = 1; // Assuming first chore is ID 1
            const dayIndex = 0; // Monday
            const actorId = 1; // First person

            // Invoke the repository directly as app.js would
            await window.ChoreRepository.addAssignment(choreId, dayIndex, actorId);
            // Trigger a board re-render
            await window.renderBoard();
        });

        // The app re-renders asynchronously
        await page.waitForTimeout(500);

        const htmlAfter = await firstCell.innerHTML();
        expect(htmlAfter).toContain('marker');
        expect(htmlAfter).not.toEqual(htmlBefore);

        // Verify Removal via Double-Click
        const markerInCell = firstCell.locator('.marker').first();
        await expect(markerInCell).toBeVisible();

        await markerInCell.dblclick();
        await page.waitForTimeout(500);

        await expect(firstCell.locator('.marker')).toHaveCount(0);
    });
});
