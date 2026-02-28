/**
 * E2E Test: App Bootstrap
 *
 * Verifies that the Chore Chart Android app launches correctly inside the
 * Capacitor WebView and that the core UI elements are visible and ready.
 * This is the foundational "smoke test" that all other E2E tests depend on.
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

describe('App Bootstrap', () => {
    before(async () => {
        await switchToWebView();
    });

    it('should load the app header with the Chore Chart title', async () => {
        const title = await $('#chart-title');
        await title.waitForDisplayed({ timeout: 10000 });
        const text = await title.getText();
        expect(text).toContain('Chore Chart');
    });

    it('should render the chore board container', async () => {
        const board = await $('#chore-board');
        await board.waitForDisplayed({ timeout: 10000 });
        const displayed = await board.isDisplayed();
        expect(displayed).toBe(true);
    });

    it('should render the marker palette section', async () => {
        const palette = await $('#marker-palette');
        await palette.waitForDisplayed({ timeout: 10000 });
        const displayed = await palette.isDisplayed();
        expect(displayed).toBe(true);
    });

    it('should show the Members button in the header', async () => {
        const membersBtn = await $('#members-btn');
        await membersBtn.waitForDisplayed({ timeout: 5000 });
        const displayed = await membersBtn.isDisplayed();
        expect(displayed).toBe(true);
    });
});
