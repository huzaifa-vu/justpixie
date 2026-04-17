import { NextRequest, NextResponse } from 'next/server';
import { create } from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';

// Construct the absolute path to the yt-dlp binary.
// This fixes ENOENT errors where the binary is not found in the default path.
const binPath = path.join(
  process.cwd(), 
  'bin', 
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);

const youtubeDl = create(binPath);

// This API route acts as a metadata resolver for video platforms.
// It leverages yt-dlp on the server-side to extract direct stream URLs.

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  const proxy = searchParams.get('proxy') === 'true';

  if (!videoUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  try {
    // Sanity check: verify the binary exists and is not 0 bytes
    try {
      const stats = fs.statSync(binPath);
      if (stats.size < 1024 * 512) { // Less than 512KB is definitely wrong for a standalone binary
        throw new Error(`Standalone binary is corrupt or too small (${stats.size} bytes).`);
      }
    } catch (e: any) {
      console.error('Binary Access Error:', e);
      return NextResponse.json({ 
        error: 'Extractor engine is not ready. Please try again in a moment.', 
        details: e.message 
      }, { status: 503 });
    }

    // Extract metadata using yt-dlp
    const info = await youtubeDl(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      extractorArgs: 'youtube:player-client=android,web;innertube_host=www.youtube.com',
      userAgent: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    } as any);

    // If proxy mode is requested, we fetch and pipe the actual video data.
    if (proxy) {
      const formatId = searchParams.get('formatId');
      const range = req.headers.get('range');
      
      const targetFormat = info.formats?.find((f: any) => f.format_id === formatId) || 
                          info.formats?.find((f: any) => f.vcodec !== 'none' && f.acodec !== 'none') || 
                          info.formats?.[0];
      
      if (!targetFormat?.url) {
        return NextResponse.json({ error: 'No downloadable stream found for this video.' }, { status: 404 });
      }

      // Dynamic Referer based on video URL to avoid 403 Forbidden catches (especially on X/Twitter)
      let referer = 'https://www.google.com/';
      try {
        const urlObj = new URL(videoUrl!);
        if (urlObj.hostname.includes('twitter.com') || urlObj.hostname.includes('x.com')) {
          referer = 'https://x.com/';
        } else if (urlObj.hostname.includes('youtube.com')) {
          referer = 'https://www.youtube.com/';
        } else if (urlObj.hostname.includes('instagram.com')) {
          referer = 'https://www.instagram.com/';
        } else if (urlObj.hostname.includes('facebook.com')) {
          referer = 'https://www.facebook.com/';
        }
      } catch (e) {}

      // Forward range headers to the platform CDN to support chunked fetching
      // Enhanced browser impersonation headers to bypass bot detection
      const response = await fetch(targetFormat.url, {
        headers: {
          ...(range ? { Range: range } : {}),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': referer,
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Origin': referer.slice(0, -1),
        },
      });
      
      // Transfer relevant headers back to the client
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
      headers.set('Content-Length', response.headers.get('Content-Length') || '');
      headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(info.title || 'video')}.${targetFormat.ext || 'mp4'}"`);
      headers.set('Accept-Ranges', 'bytes');
      if (response.headers.get('Content-Range')) {
        headers.set('Content-Range', response.headers.get('Content-Range')!);
      }

      return new Response(response.body, {
        status: response.status,
        headers: headers,
      });
    }

    // Process formats into a clean list of quality options
    const rawFormats = info.formats || [];
    const qualityMap: Record<string, any> = {};
    
    // Find best audio-only stream (prefer m4a/aac for compatibility)
    const bestAudio = rawFormats
      .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
      .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];

    rawFormats.forEach((f: any) => {
      // Filter out resolutions below 144p as requested by user
      // Also filter out storyboards (sb*) and metadata formats (mhtml) that cause 404s
      if (!f.height || f.height < 144) return;
      if (f.format_id?.startsWith('sb') || f.vcodec === 'mhtml' || f.protocol === 'mhtml') return;
      
      const q = `${f.height}p`;
      
      // We want to keep track of the best format for each resolution
      const current = qualityMap[q];
      const isCombined = f.vcodec !== 'none' && f.acodec !== 'none';
      
      // SMART PRIORITY:
      // 1. Prefer formats that have both video and audio (isCombined) to avoid local merging.
      // 2. If both are combined (or both are split), prefer the one with higher total bitrate (tbr).
      let isBetter = false;
      if (!current) {
        isBetter = true;
      } else if (isCombined && !current.isCombined) {
        isBetter = true;
      } else if (isCombined === current.isCombined) {
        if (f.tbr > current.tbr) isBetter = true;
      }

      if (isBetter) {
        qualityMap[q] = {
          id: f.format_id,
          quality: q,
          ext: f.ext,
          vcodec: f.vcodec,
          acodec: f.acodec,
          isCombined: isCombined,
          size: f.filesize || f.filesize_approx,
          tbr: f.tbr,
          url: f.url,
          audioId: isCombined ? null : bestAudio?.format_id,
          audioUrl: isCombined ? null : bestAudio?.url,
          audioSize: isCombined ? null : (bestAudio?.filesize || bestAudio?.filesize_approx || 0)
        };
      }
    });

    const downloadOptions = Object.values(qualityMap).sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));

    // Prepend Audio Only option if available
    if (bestAudio) {
      downloadOptions.unshift({
        id: bestAudio.format_id,
        quality: 'Audio',
        ext: bestAudio.ext || 'm4a',
        vcodec: 'none',
        acodec: bestAudio.acodec,
        isCombined: true,
        size: bestAudio.filesize || bestAudio.filesize_approx,
        tbr: bestAudio.abr,
        url: bestAudio.url,
        audioId: null,
        audioUrl: null
      });
    }

    // Return the full metadata + processed options to the client.
    return NextResponse.json({
      ...info,
      downloadOptions
    });

  } catch (error: any) {
    console.error('Metadata Resolver Error:', error);
    
    // Friendly error messages for common issues
    let message = 'Failed to extract video metadata.';
    if (error.message?.includes('Unsupported URL')) {
      message = 'This platform or URL is not supported yet.';
    } else if (error.message?.includes('Sign in')) {
      message = 'This video requires authentication or is age-restricted.';
    }

    return NextResponse.json({ 
      error: message, 
      details: error.message,
      command: error.command, 
      stderr: error.stderr 
    }, { status: 500 });
  }
}
