
const axios = require('axios');

async function testInstaVideoSave() {
    const url = 'https://www.instagram.com/reels/C56H2vIInl6/';
    try {
        console.log('Testing instavideosave.net...');
        // First get the page to find any tokens
        const res = await axios.get('https://instavideosave.net/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        });
        
        console.log('Page loaded. Checking for form tokens...');
        // Look for any input names that might be tokens
        const tokenMatch = res.data.match(/name="([^"]*token[^"]*)" value="([^"]*)"/i);
        if (tokenMatch) {
            console.log('Found token:', tokenMatch[1], '=', tokenMatch[2]);
        } else {
            console.log('No token found in HTML.');
        }

        // Try a common API endpoint if known, or just check network
        // Most use an 'action' or 'convert' endpoint
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testInstaVideoSave();
