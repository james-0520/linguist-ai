import playwright from 'playwright';

class BrowserService {
    private browser: any | null = null;
    private page: any | null = null;

    async initialize() {
        try {
            const { chromium } = playwright;
            this.browser = await chromium.launch({
                headless: false, // Set to true for headless mode
                args: ['--no-sandbox', '--disable-setuid-sandbox']
            });
            this.page = await this.browser.newPage();
            console.log('Browser initialized successfully');
            return true;
        } catch (error) {
            console.error('Failed to initialize browser:', error);
            return false;
        }
    }

    async navigate(url: string) {
        if (!this.page) {
            console.error('Browser not initialized');
            return false;
        }

        try {
            await this.page.goto(url, { waitUntil: 'domcontentloaded' });
            console.log(`Navigated to: ${url}`);
            return true;
        } catch (error) {
            console.error('Navigation failed:', error);
            return false;
        }
    }

    async getPageContent() {
        if (!this.page) {
            console.error('Browser not initialized');
            return null;
        }

        try {
            return await this.page.content();
        } catch (error) {
            console.error('Failed to get page content:', error);
            return null;
        }
    }

    async takeScreenshot(path: string) {
        if (!this.page) {
            console.error('Browser not initialized');
            return false;
        }

        try {
            await this.page.screenshot({ path });
            console.log(`Screenshot saved to: ${path}`);
            return true;
        } catch (error) {
            console.error('Failed to take screenshot:', error);
            return false;
        }
    }

    async close() {
        try {
            if (this.browser) {
                await this.browser.close();
                console.log('Browser closed successfully');
            }
            return true;
        } catch (error) {
            console.error('Failed to close browser:', error);
            return false;
        }
    }

    async evaluateJavaScript(code: string) {
        if (!this.page) {
            console.error('Browser not initialized');
            return null;
        }

        try {
            return await this.page.evaluate(code);
        } catch (error) {
            console.error('JavaScript evaluation failed:', error);
            return null;
        }
    }

    async fillForm(selector: string, value: string) {
        if (!this.page) {
            console.error('Browser not initialized');
            return false;
        }

        try {
            await this.page.fill(selector, value);
            return true;
        } catch (error) {
            console.error('Failed to fill form:', error);
            return false;
        }
    }

    async clickElement(selector: string) {
        if (!this.page) {
            console.error('Browser not initialized');
            return false;
        }

        try {
            await this.page.click(selector);
            return true;
        } catch (error) {
            console.error('Failed to click element:', error);
            return false;
        }
    }
}

export const browserService = new BrowserService();
