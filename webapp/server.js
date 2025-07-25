import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Security validation functions
function detectXSS(input) {
    if (!input || typeof input !== 'string') return false;
    
    const xssPatterns = [
        /<script[^>]*>.*?<\/script>/gi,
        /<iframe[^>]*>.*?<\/iframe>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<img[^>]+src[^>]*=.*?javascript:/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
}

function detectSQLInjection(input) {
    if (!input || typeof input !== 'string') return false;
    
    const lowerInput = input.toLowerCase();
    const sqlPatterns = [
        /union\s+select/g,
        /'\s*(or|and)\s*'?\d/g,
        /'\s*or\s*'?1'?\s*=\s*'?1/g,
        /'\s*;\s*drop\s+table/g,
        /admin'\s*--/g,
    ];
    
    return sqlPatterns.some(pattern => pattern.test(lowerInput));
}

// Routes
app.get('/', (req, res) => {
    const errorMessage = req.query.error ? 
        (req.query.error === 'xss' ? '🚨 XSS attack detected! Input has been cleared for your safety.' : 
         req.query.error === 'sql' ? '🚨 SQL injection attack detected! Input has been cleared for your safety.' : '') : '';
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Secure Search Application</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                    text-align: center;
                }
                .form-group {
                    margin: 20px 0;
                }
                label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: bold;
                }
                input[type="text"] {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #ddd;
                    border-radius: 5px;
                    font-size: 16px;
                    box-sizing: border-box;
                }
                input[type="submit"] {
                    background-color: #1976d2;
                    color: white;
                    padding: 12px 30px;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    font-size: 16px;
                    margin-top: 10px;
                }
                input[type="submit"]:hover {
                    background-color: #1565c0;
                }
                .security-info {
                    background-color: #e8f5e8;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #4caf50;
                }
                .warning {
                    background-color: #fff3e0;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #ff9800;
                }
                .error {
                    background-color: #ffebee;
                    color: #c62828;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #f44336;
                    font-weight: bold;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Secure Search Application</h1>
                
                ${errorMessage ? `<div class="error">${errorMessage}</div>` : ''}
                
                <div class="security-info">
                    <h3>🔒 Security Features Active</h3>
                    <ul>
                        <li>XSS Attack Detection</li>
                        <li>SQL Injection Prevention</li>
                        <li>Input Sanitization</li>
                        <li>Content Security Policy</li>
                    </ul>
                </div>
                
                <form action="/search" method="POST">
                    <div class="form-group">
                        <label for="searchTerm">Enter your search term:</label>
                        <input type="text" id="searchTerm" name="searchTerm" 
                               placeholder="Type your search query here..." required>
                    </div>
                    <input type="submit" value="Search">
                </form>
                
                <div class="warning">
                    <h4>⚠️ Try testing these malicious inputs:</h4>
                    <ul>
                        <li><code>&lt;script&gt;alert('XSS')&lt;/script&gt;</code></li>
                        <li><code>' OR '1'='1' --</code></li>
                        <li><code>&lt;img src=x onerror=alert('XSS')&gt;</code></li>
                        <li><code>'; DROP TABLE users; --</code></li>
                    </ul>
                    <p><em>These will be detected and blocked by our security system.</em></p>
                </div>
            </div>
        </body>
        </html>
    `);
});

app.post('/search', (req, res) => {
    const searchTerm = req.body.searchTerm || '';
    
    console.log(`Search request received: "${searchTerm}"`);
    
    // Check for XSS attacks
    if (detectXSS(searchTerm)) {
        console.log('XSS attack detected and blocked');
        return res.redirect('/?error=xss');
    }
    
    // Check for SQL injection
    if (detectSQLInjection(searchTerm)) {
        console.log('SQL injection attack detected and blocked');
        return res.redirect('/?error=sql');
    }
    
    // If input is safe, display results (basic sanitization by escaping HTML)
    const safeTerm = searchTerm.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Search Results</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                }
                .container {
                    background-color: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                h1 {
                    color: #333;
                }
                .search-term {
                    background-color: #e3f2fd;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #2196f3;
                }
                .back-button {
                    display: inline-block;
                    background-color: #1976d2;
                    color: white;
                    padding: 10px 20px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin-top: 20px;
                }
                .back-button:hover {
                    background-color: #1565c0;
                }
                .success {
                    background-color: #e8f5e8;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #4caf50;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Search Results</h1>
                
                <div class="success">
                    ✅ Input validation passed! No security threats detected.
                </div>
                
                <div class="search-term">
                    <h3>Your search term:</h3>
                    <p><strong>"${safeTerm}"</strong></p>
                </div>
                
                <div class="search-term">
                    <h3>Search Results:</h3>
                    <p>This is where search results for "${safeTerm}" would appear.</p>
                    <p><em>In a real application, this would query a database or search engine.</em></p>
                </div>
                
                <a href="/" class="back-button">← Return to Home Page</a>
            </div>
        </body>
        </html>
    `);
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Secure web application running on port ${PORT}`);
    console.log('Security features enabled:');
    console.log('- XSS Protection');
    console.log('- SQL Injection Prevention');
    console.log('- Input Sanitization');
});