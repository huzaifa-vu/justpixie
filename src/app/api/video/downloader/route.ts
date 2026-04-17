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

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');

  try {
    let info: any = null;
    let downloadOptions: any[] = [];
    let usedCobalt = false;

    // --- PHASE 1: RESOLVER SELECTION ---
    if (isYouTube) {
      try {
        console.log('Attempting Cobalt Resolver for YouTube...');
        const cobaltRes = await fetch('https://api.cobalt.tools/api/json', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ url: videoUrl, videoQuality: '1080', filenameStyle: 'pretty' })
        });

        if (cobaltRes.ok) {
          const cobaltData = await cobaltRes.json();
          if (cobaltData.status === 'success' || cobaltData.status === 'picker' || cobaltData.status === 'tunnel') {
            usedCobalt = true;
            
            // Map Cobalt response to our internal format
            info = {
              title: cobaltData.filename || 'YouTube Video',
              thumbnail: '', // Cobalt doesn't always provide this, fallback to oembed if needed
              duration: 0,
              original_url: videoUrl
            };

            if (cobaltData.status === 'picker' && cobaltData.picker) {
              downloadOptions = cobaltData.picker.map((item: any, idx: number) => ({
                id: `cobalt-${idx}`,
                quality: item.text || item.label || '720p',
                ext: 'mp4',
                size: 0,
                isCombined: true,
                url: item.url,
                vcodec: 'h264',
                acodec: 'aac'
              }));
            } else if (cobaltData.url) {
              downloadOptions = [{
                id: 'cobalt-main',
                quality: 'HD',
                ext: 'mp4',
                size: 0,
                isCombined: true,
                url: cobaltData.url,
                vcodec: 'h264',
                acodec: 'aac'
              }];
            }
          }
        }
      } catch (err) {
        console.warn('Cobalt Resolver failed, falling back to yt-dlp:', err);
      }
    }

    // --- PHASE 2: FALLBACK TO YT-DLP ---
    if (!usedCobalt) {
      // Sanity check for binary
      const stats = fs.statSync(binPath);
      if (stats.size < 1024 * 512) throw new Error('Standalone binary invalid.');

      info = await youtubeDl(videoUrl, {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        ignoreConfig: true,
        noCacheDir: true,
        noPlaylist: true,
        extractorArgs: isYouTube ? 'youtube:player-client=tv,web' : undefined,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      } as any);

      const rawFormats = info.formats || [];
      const bestAudio = rawFormats
        .filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none')
        .sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];

      const qualityMap: Record<string, any> = {};
      rawFormats.forEach((f: any) => {
        if (!f.height || f.height < 144) return;
        if (f.format_id?.startsWith('sb') || f.vcodec === 'mhtml' || f.protocol === 'mhtml') return;
        
        const q = `${f.height}p`;
        const current = qualityMap[q];
        const isCombined = f.vcodec !== 'none' && f.acodec !== 'none';
        
        let isBetter = !current || (isCombined && !current.isCombined) || (isCombined === current.isCombined && f.tbr > current.tbr);

        if (isBetter) {
          qualityMap[q] = {
            id: f.format_id,
            quality: q,
            ext: f.ext,
            isCombined,
            size: f.filesize || f.filesize_approx,
            url: f.url,
            audioId: isCombined ? null : bestAudio?.format_id,
            audioUrl: isCombined ? null : bestAudio?.url,
            audioSize: isCombined ? null : (bestAudio?.filesize || bestAudio?.filesize_approx || 0)
          };
        }
      });

      downloadOptions = Object.values(qualityMap).sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));
      if (bestAudio) {
        downloadOptions.unshift({
          id: bestAudio.format_id,
          quality: 'Audio',
          ext: bestAudio.ext || 'm4a',
          isCombined: true,
          size: bestAudio.filesize || bestAudio.filesize_approx,
          url: bestAudio.url
        });
      }
    }

    // --- PHASE 3: PROXY FETCHING ---
    if (proxy) {
      const formatId = searchParams.get('formatId');
      const range = req.headers.get('range');
      
      let streamUrl = '';
      if (usedCobalt) {
        const opt = downloadOptions.find(o => o.id === formatId) || downloadOptions[0];
        streamUrl = opt?.url;
      } else {
        const targetFormat = info.formats?.find((f: any) => f.format_id === formatId) || info.formats?.[0];
        streamUrl = targetFormat?.url;
      }

      if (!streamUrl) throw new Error('Stream URL not found.');

      // Extract title for Content-Disposition
      const title = info.title || 'video';
      const cleanTitle = title.replace(/[^\x00-\x7F]/g, "").replace(/[\\/:*?"<>|]/g, "_");

      const response = await fetch(streamUrl, {
        headers: {
          ...(range ? { Range: range } : {}),
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': isYouTube ? 'https://www.youtube.com/' : 'https://www.google.com/',
        },
      });
      
      const headers = new Headers();
      headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
      headers.set('Content-Length', response.headers.get('Content-Length') || '');
      headers.set('Content-Disposition', `attachment; filename="${cleanTitle}.mp4"`);
      headers.set('Accept-Ranges', 'bytes');
      if (response.headers.get('Content-Range')) {
        headers.set('Content-Range', response.headers.get('Content-Range')!);
      }

      return new Response(response.body, {
        status: response.status,
        headers: headers,
      });
    }

    return NextResponse.json({ ...info, downloadOptions });

  } catch (error: any) {
    console.error('Hybrid Resolver Error:', error);
    return NextResponse.json({ 
      error: 'Metadata extraction failed.', 
      details: error.message 
    }, { status: 500 });
  }
}
