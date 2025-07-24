import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

// Get the environment from command line arguments
const environment = process.argv[2] || 'local';

console.log(`Running tests in '${environment}' environment`);

let seleniumUrl, serverUrl;

if (environment === 'github') {
    seleniumUrl = 'http://localhost:4444/wd/hub';
    serverUrl = 'http://localhost:3000';
} else {
    // For local Docker setup
    seleniumUrl = 'http://localhost:4444/wd/hub';
    serverUrl = 'http://host.docker.internal:3000';
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
        options.addArguments('--disable-gpu');
        options.addArguments('--disable-extensions');
        options.addArguments('--remote-debugging-port=9222');
        options.addArguments('--disable-web-security');
        options.addArguments('--disable-features=VizDisplayCompositor');
        
        // Initialize the WebDriver
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .usingServer(seleniumUrl)
            .build();

        console.log("after driver init");
        
        // Set timeouts
        await driver.manage().setTimeouts({ 
            pageLoad: 30000,
            implicit: 10000
        });
        
        // Test server connectivity first
        console.log(`Testing server connectivity to ${serverUrl}`);
        
        // Navigate to the application with retry logic
        let retryCount = 0;
        const maxRetries = 5;
        
        while (retryCount < maxRetries) {
            try {
                console.log(`Attempt ${retryCount + 1}: Navigating to: ${serverUrl}`);
                await driver.get(serverUrl);
                console.log("Successfully navigated to server");
                break;
            } catch (error) {
                retryCount++;
                console.log(`Navigation attempt ${retryCount} failed:`, error.message);
                
                if (retryCount >= maxRetries) {
                    throw new Error(`Failed to navigate to ${serverUrl} after ${maxRetries} attempts. Last error: ${error.message}`);
                }
                
                console.log(`Waiting 3 seconds before retry...`);
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        // Wait for the page title to contain expected text
        console.log("Waiting for page title...");
        await driver.wait(until.titleContains('Browser Info'), 20000);
        console.log("✓ Page loaded with correct title");

        // Wait for the timestamp element to appear
        console.log("Looking for timestamp element...");
        const timestampElement = await driver.wait(
            until.elementLocated(By.id('timestamp')), 
            20000
        );
        
        console.log("✓ Timestamp element found");
        
        // Wait for the actual timestamp to load (not "Fetching...")
        console.log("Waiting for timestamp to load...");
        await driver.wait(async () => {
            try {
                const text = await timestampElement.getText();
                console.log(`Current timestamp text: "${text}"`);
                return text.includes('Server timestamp:') && !text.includes('Fetching');
            } catch (e) {
                console.log('Error getting timestamp text:', e.message);
                return false;
            }
        }, 30000);

        // Get the timestamp text
        const timestampText = await timestampElement.getText();
        console.log(`Final timestamp: ${timestampText}`);

        // Validate the timestamp format
        const timestampMatch = timestampText.match(/Server timestamp:\s*(.*)/);
        if (!timestampMatch) {
            throw new Error(`Timestamp text does not match expected format. Got: "${timestampText}"`);
        }
        
        const extractedTimestamp = timestampMatch[1];
        const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
        
        if (!timestampRegex.test(extractedTimestamp)) {
            throw new Error(`Timestamp format is invalid. Expected ISO format, got: "${extractedTimestamp}"`);
        }
        
        console.log('✓ Timestamp format is valid');

        // Check browser info is displayed
        console.log("Checking browser info...");
        const browserInfoElement = await driver.findElement(By.id('browser-info'));
        const browserInfoText = await browserInfoElement.getText();
        console.log(`Browser info: ${browserInfoText}`);
        
        if (!browserInfoText.includes('Your browser:')) {
            throw new Error(`Browser info not displayed correctly. Got: "${browserInfoText}"`);
        }
        
        console.log('✓ Browser info is displayed correctly');
        console.log('✓ All Selenium tests passed!');

    } catch (error) {
        console.error('❌ Selenium test failed:', error.message);
        
        // Additional debugging information
        if (driver) {
            try {
                const currentUrl = await driver.getCurrentUrl();
                console.log(`Current URL: ${currentUrl}`);
                
                const pageSource = await driver.getPageSource();
                console.log('Page source (first 1000 chars):', pageSource.substring(0, 1000));
                
                // Try to get console logs
                const logs = await driver.manage().logs().get('browser');
                if (logs.length > 0) {
                    console.log('Browser console logs:');
                    logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
                }
            } catch (debugError) {
                console.log('Could not get debug info:', debugError.message);
            }
        }
        
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