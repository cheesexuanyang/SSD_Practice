import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Get the environment from command line arguments
const environment = process.argv[2] || 'local';

console.log(`Running tests in '${environment}' environment`);

let seleniumUrl, serverUrl;

if (environment === 'github') {
    seleniumUrl = 'http://selenium:4444/wd/hub';
    serverUrl = 'http://testserver:3000';
} else {
    seleniumUrl = 'http://localhost:4444/wd/hub';
    serverUrl = 'http://localhost:3000';
}

console.log(`Selenium URL: ${seleniumUrl}`);
console.log(`Server URL: ${serverUrl}`);

async function runSeleniumTests() {
    let driver;
    
    try {
        console.log("before driver init");
        
        // Set up Chrome options
        const options = new chrome.Options();
        options.addArguments('--headless');
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        
        // Initialize the WebDriver
        if (environment === 'github') {
            driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .usingServer(seleniumUrl)
                .build();
        } else {
            driver = await new Builder()
                .forBrowser('chrome')
                .setChromeOptions(options)
                .usingServer(seleniumUrl)
                .build();
        }

        console.log("after driver init");
        
        // Navigate to the application
        await driver.get(serverUrl);
        console.log("after driver get serverUrl");

        // Wait for the page title to contain expected text
        await driver.wait(until.titleContains('Browser Info'), 10000);
        console.log("✓ Page loaded with correct title");

        // Wait for the timestamp element to appear
        const timestampElement = await driver.wait(
            until.elementLocated(By.id('timestamp')), 
            10000
        );
        
        // Wait for the actual timestamp to load (not "Fetching...")
        await driver.wait(async () => {
            const text = await timestampElement.getText();
            return text.includes('Server timestamp:') && !text.includes('Fetching');
        }, 10000);

        // Get the timestamp text
        const timestampText = await timestampElement.getText();
        console.log(`Timestamp: ${timestampText}`);

        // Validate the timestamp format
        const timestampMatch = timestampText.match(/Server timestamp:\s*(.*)/);
        if (!timestampMatch) {
            throw new Error('Timestamp text does not match expected format');
        }
        
        const extractedTimestamp = timestampMatch[1];
        const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        
        if (!timestampRegex.test(extractedTimestamp)) {
            throw new Error('Timestamp format is invalid');
        }
        
        console.log('✓ Timestamp format is valid');

        // Check browser info is displayed
        const browserInfoElement = await driver.findElement(By.id('browser-info'));
        const browserInfoText = await browserInfoElement.getText();
        console.log(`Browser info: ${browserInfoText}`);
        
        if (!browserInfoText.includes('Your browser:')) {
            throw new Error('Browser info not displayed correctly');
        }
        
        console.log('✓ Browser info is displayed correctly');
        console.log('All Selenium tests passed!');

    } catch (error) {
        console.error('Selenium test failed:', error.message);
        process.exit(1);
    } finally {
        if (driver) {
            await driver.quit();
            console.log('WebDriver closed');
        }
    }
}

// Run the tests
runSeleniumTests();