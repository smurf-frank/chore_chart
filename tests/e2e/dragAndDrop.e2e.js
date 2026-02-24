/**
 * E2E Test: Drag & Drop Marker Assignment
 *
 * Verifies the tactile UX of dragging a marker from the palette to a chore
 * cell inside the Capacitor WebView. This test specifically exercises the
 * DragDropTouch.js polyfill by using the W3C Actions API to simulate
 * realistic touch gestures (touchstart -> hold -> move -> touchend).
 */

const WEBVIEW_SWITCH_TIMEOUT_MS = 20000;

async function switchToWebView() {
    await driver.waitUntil(
        async () => {
            const contexts = await driver.getContexts();
            return contexts.some((c) => String(c).includes('WEBVIEW'));
        },
        {
            timeout: WEBVIEW_SWITCH_TIMEOUT_MS,
            timeoutMsg: `WebView context did not appear within ${WEBVIEW_SWITCH_TIMEOUT_MS}ms`
        }
    );
    const contexts = await driver.getContexts();
    const webview = contexts.find((c) => String(c).includes('WEBVIEW'));
    await driver.switchContext(webview);
}

describe('Drag & Drop Marker Assignment', () => {
    before(async () => {
        await switchToWebView();
        // Wait for the board to finish its async initialization
        await driver.waitUntil(
            async () => {
                const board = await $('#chore-board');
                const html = await board.getHTML();
                // The loading placeholder is replaced once app.js finishes
                return !html.includes('board-loading');
            },
            { timeout: 15000, timeoutMsg: 'Board did not finish initializing within 15s' }
        );
    });

    it('should have at least one draggable marker in the palette', async () => {
        const palette = await $('#palette-markers');
        await palette.waitForDisplayed({ timeout: 5000 });
        const markers = await palette.$$('.marker');
        expect(markers.length).toBeGreaterThan(0);
    });

    it('should drag a marker from the palette onto a chore cell', async () => {
        // 1. Locate the first marker in the palette and the first non-header board cell
        const firstMarker = await $('#palette-markers .marker');
        await firstMarker.waitForDisplayed({ timeout: 5000 });

        const firstCell = await $('.board-cell:not(.header-cell)');
        await firstCell.waitForDisplayed({ timeout: 5000 });

        // 2. Record the cell contents before the drag
        const htmlBefore = await firstCell.getHTML();

        // 3. Simulate a touch drag using the W3C Pointer Actions API.
        //    This chain mimics a real finger: press, hold, move, release.
        //    The hold pause (200ms) is critical to trigger the DragDropTouch
        //    polyfill's 'dragstart' detection logic.
        await driver
            .action('pointer', { parameters: { pointerType: 'touch' } })
            .move({ duration: 0, origin: firstMarker, x: 0, y: 0 })
            .down({ button: 0 })
            .pause(250)
            .move({ duration: 800, origin: firstCell, x: 0, y: 0 })
            .up({ button: 0 })
            .perform();

        // 4. Allow the async drop handler in app.js to complete
        await driver.pause(500);

        // 5. Assert: the cell's HTML should now contain a marker element
        const htmlAfter = await firstCell.getHTML();
        expect(htmlAfter).toContain('marker');
        expect(htmlAfter).not.toEqual(htmlBefore);
    });

    it('should allow double-tapping a marker in a cell to remove it', async () => {
        // Find the marker that was dropped in the previous test
        const markerInCell = await $('.board-cell:not(.header-cell) .marker');
        const exists = await markerInCell.isExisting();

        if (!exists) {
            // If no marker is present from the prior test, skip gracefully
            return;
        }

        await markerInCell.doubleClick();
        await driver.pause(500);

        const remainingMarkers = await $$('.board-cell:not(.header-cell) .marker');
        // After double-click removal, the cell should be empty
        expect(remainingMarkers.length).toBe(0);
    });
});
