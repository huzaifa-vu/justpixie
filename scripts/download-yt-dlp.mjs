import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const binDir = path.join(rootDir, 'bin');

// Official standalone binary URLs
const URLS = {
  linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp',
  win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
};

async function download() {
  const platform = process.platform;
  const url = URLS[platform];
  
  if (!url) {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(0); // Exit gracefully as this might be an unsupported build env
  }

  const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const outputPath = path.join(binDir, binaryName);

  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  console.log(`Downloading standalone yt-dlp for ${platform}...`);
  console.log(`Source: ${url}`);
  console.log(`Destination: ${outputPath}`);

  const file = fs.createWriteStream(outputPath);
  
  https.get(url, (response) => {
    // Handle redirects
    if (response.statusCode === 301 || response.statusCode === 302) {
      https.get(response.headers.location, (redirectResponse) => {
        redirectResponse.pipe(file);
        finish(file, outputPath);
      });
    } else {
      response.pipe(file);
      finish(file, outputPath);
    }
  }).on('error', (err) => {
    console.error(`Download failed: ${err.message}`);
    process.exit(1);
  });
}

function finish(file, outputPath) {
  file.on('finish', () => {
    file.close();
    console.log('Download complete.');
    
    // Set execution permissions on Linux/Mac
    if (process.platform !== 'win32') {
      try {
        fs.chmodSync(outputPath, 0o755);
        console.log('Set execution permissions.');
      } catch (err) {
        console.warn(`Could not set permissions: ${err.message}`);
      }
    }
  });
}

download().catch(err => {
  console.error(err);
  process.exit(1);
});
