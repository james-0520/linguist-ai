import { browserService } from './services/browserService.ts';

async function testBrowser() {
    console.log('Starting browser test...');

    // Initialize the browser
    const initSuccess = await browserService.initialize();
    if (!initSuccess) {
        console.error('Failed to initialize browser');
        return;
    }

    // Navigate to a test page
    const navSuccess = await browserService.navigate('https://example.com');
    if (!navSuccess) {
        console.error('Failed to navigate');
        await browserService.close();
        return;
    }

    // Get page content
    const content = await browserService.getPageContent();
    if (content) {
        console.log('Page content length:', content.length);
        console.log('Page title:', content.match(/<title>(.*?)<\/title>/)?.[1] || 'No title found');
    }

    // Take a screenshot
    const screenshotSuccess = await browserService.takeScreenshot('test-screenshot.png');
    if (screenshotSuccess) {
        console.log('Screenshot taken successfully');
    }

    // Close the browser
    await browserService.close();
    console.log('Browser test completed');
}

testBrowser().catch(console.error);
