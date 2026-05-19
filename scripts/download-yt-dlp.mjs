import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const binDir = path.join(rootDir, 'bin');

const URLS = {
  linux: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux',
  win32: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  darwin: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
};

/**
 * Robust HTTPS downloader that handles multiple redirects and User-Agent requirements.
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    };

    https.get(url, options, (res) => {
      // Handle Redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download: Status ${res.statusCode}`));
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);

      file.on('finish', () => {
        file.close();
        
        // Validate file size (yt-dlp standalone starts at ~15MB)
        const stats = fs.statSync(dest);
        if (stats.size < 1024 * 1024 * 12) { // 12MB threshold
            return reject(new Error(`Downloaded file is too small (${stats.size} bytes). This is likely the zipimport version, but we need the standalone binary.`));
        }
        
        resolve();
      });

      file.on('error', (err) => {
        fs.unlink(dest, () => {}); // Clean up partial file
        reject(err);
      });
    }).on('error', reject);
  });
}

async function main() {
  if (process.env.VERCEL || process.env.CI_SKIP_YTDLP) {
    console.log('Skipping yt-dlp download (Vercel or CI bypass environment detected).');
    process.exit(0);
  }

  const platform = process.platform;
  const url = URLS[platform];
  
  if (!url) {
    console.error(`Unsupported platform: ${platform}`);
    process.exit(0);
  }

  const binaryName = platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp';
  const outputPath = path.join(binDir, binaryName);

  if (!fs.existsSync(binDir)) {
    fs.mkdirSync(binDir, { recursive: true });
  }

  console.log(`Downloading standalone yt-dlp for ${platform}...`);
  try {
    await downloadFile(url, outputPath);
    console.log('Download complete.');

    if (platform !== 'win32') {
      fs.chmodSync(outputPath, 0o755);
      console.log('Set execution permissions.');
    }
    
    // Final Stat
    const stats = fs.statSync(outputPath);
    console.log(`Success: Binary size is ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
    
  } catch (err) {
    console.error(`Download process failed: ${err.message}`);
    process.exit(1);
  }
}

main();
