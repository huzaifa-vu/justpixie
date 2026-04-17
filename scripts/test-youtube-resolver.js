const https = require('https');

async function testYtDown(url) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams();
    data.append('url', url);

    const options = {
      hostname: 'app.ytdown.to',
      port: 443,
      path: '/proxy.php',
      method: 'POST',
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://app.ytdown.to/en24/',
        'Origin': 'https://app.ytdown.to'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve(json);
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${body.substring(0, 100)}`));
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(data.toString());
    req.end();
  });
}

async function run() {
  const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rickroll
  console.log(`Testing ytdown.to with: ${testUrl}`);
  
  try {
    const result = await testYtDown(testUrl);
    if (result.mediaItems && result.mediaItems.length > 0) {
      console.log('✅ TEST PASSED');
      console.log(`Found ${result.mediaItems.length} formats.`);
      console.log(`Title: ${result.mediaItems[0].name}`);
    } else {
      console.log('❌ TEST FAILED: No media items found');
      console.log('Response:', JSON.stringify(result, null, 2));
    }
  } catch (e) {
    console.log('❌ TEST ERROR:', e.message);
  }
}

run();
