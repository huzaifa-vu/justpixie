import { NextRequest, NextResponse } from 'next/server';
import { create } from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { resolveYtDown } from '@/lib/resolvers/ytdown';
import { resolveCobalt } from '@/lib/resolvers/cobalt';

const binPath = path.join(
  process.cwd(), 
  'bin', 
  process.platform === 'win32' ? 'yt-dlp.exe' : 'yt-dlp'
);

const youtubeDl = create(binPath);

const PRIVATE_BRIDGE_URL = 'https://pixie-bridge.bc250404672mhu.workers.dev/';

const RESOLVER_POOL = [
  { url: 'https://pipedapi.kavin.rocks/streams/', type: 'piped' },
  { url: 'https://api-piped.mha.fi/streams/', type: 'piped' },
  { url: 'https://piped-api.lunar.icu/streams/', type: 'piped' },
  { url: 'https://pipedapi.oxitane.it/streams/', type: 'piped' },
  { url: 'https://yewtu.be/api/v1/videos/', type: 'invidious' },
  { url: 'https://invidious.projectsegfau.lt/api/v1/videos/', type: 'invidious' }
];

const sslResilientAgent = new https.Agent({ rejectUnauthorized: false });

const attemptBridgeExtraction = async (videoId: string) => {
  try {
    const res = await fetch(`${PRIVATE_BRIDGE_URL}?id=${videoId}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e: any) {
    console.warn(`Private bridge failed: ${e.message}`);
  }
  return null;
};

const attemptPoolExtraction = async (videoId: string) => {
  for (const instance of RESOLVER_POOL) {
    try {
      const res = await fetch(`${instance.url}${videoId}`, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(4000),
        // @ts-ignore
        agent: sslResilientAgent 
      } as any);
      if (res.ok) {
        const data = await res.json();
        return { type: instance.type, data };
      }
    } catch (e: any) {
      console.warn(`Resolver ${instance.url} skipped: ${e.message}`);
    }
  }
  return null;
};

const extractVideoId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoUrl = searchParams.get('url');
  const proxy = searchParams.get('proxy') === 'true';

  if (!videoUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const videoId = isYouTube ? extractVideoId(videoUrl) : null;

  try {
    console.log(`[API] Downloader process started for: ${videoUrl}`);
    let result: any = null;

    if (isYouTube && videoId) {
      // --- LEVEL 1: PRIVATE BRIDGE ---
      try {
        console.log(`[Level 1] Attempting Private Bridge for ${videoId}`);
        const bridgeData = await attemptBridgeExtraction(videoId);
        if (bridgeData && (bridgeData.formatStreams || bridgeData.adaptiveFormats)) {
          console.log('Level 1 Success: Private Bridge');
          result = transformBridgeData(bridgeData, videoUrl);
        }
      } catch (e: any) {
        console.warn(`[Level 1] Bridge Failed: ${e.message}`);
      }

      // --- LEVEL 2: YT-DOWN PROXY ---
      if (!result) {
        try {
          console.log(`[Level 2] Attempting ytdown.to`);
          const ytdownResult = await resolveYtDown(videoUrl);
          if (ytdownResult && ytdownResult.downloadOptions.length > 0) {
            console.log('Level 2 Success: ytdown.to');
            result = ytdownResult;
          }
        } catch (e: any) {
          console.warn(`[Level 2] ytdown failed: ${e.message}`);
        }
      }

      // --- LEVEL 3: GLOBAL POOL ---
      if (!result) {
        try {
          console.log(`[Level 3] Attempting Global Resolver Pool`);
          const poolData = await attemptPoolExtraction(videoId);
          if (poolData) {
            console.log(`Level 3 Success: Pool (${poolData.type})`);
            result = transformPoolData(poolData, videoUrl);
          }
        } catch (e: any) {
          console.warn(`[Level 3] Pool failed: ${e.message}`);
        }
      }

      // --- LEVEL 4: COBALT FALLBACK ---
      if (!result) {
        try {
          console.log(`[Level 4] Attempting Cobalt fallback`);
          const cobaltResult = await resolveCobalt(videoUrl);
          if (cobaltResult && cobaltResult.downloadOptions.length > 0) {
            console.log('Level 4 Success: Cobalt');
            result = cobaltResult;
          }
        } catch (e: any) {
          console.warn(`[Level 4] Cobalt failed: ${e.message}`);
        }
      }
    } else {
      // Non-YouTube fallback to yt-dlp
      console.log(`[Fallback] Running yt-dlp for non-YouTube URL`);
      const info = await youtubeDl(videoUrl, {
        dumpSingleJson: true,
        noWarnings: true,
        noCheckCertificate: true,
        preferFreeFormats: true,
        ignoreConfig: true,
        noCacheDir: true,
        noPlaylist: true,
      } as any);
      
      result = transformYtDlpData(info, videoUrl);
    }

    if (!result) {
      console.error(`[ERROR] All resolvers failed for ${videoUrl}`);
      throw new Error('All download resolvers failed for this video. This video might be region-locked or our server IPs are blocked.');
    }

    // Proxy logic
    if (proxy) {
      return handleProxyRequest(req, result, videoUrl);
    }

    console.log(`[API] Successfully resolved metadata for: ${result.title}`);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[API] Fatal Error:', error.message);
    return NextResponse.json({ error: 'Download engine failure.', details: error.message }, { status: 500 });
  }
}

// --- TRANSFORMERS ---

function transformBridgeData(data: any, videoUrl: string) {
  const formats = data.formatStreams || [];
  const adaptive = data.adaptiveFormats || [];
  const bestAudio = adaptive
    .filter((f: any) => f.mimeType?.includes('audio/'))
    .sort((a: any, b: any) => (parseInt(b.bitrate) || 0) - (parseInt(a.bitrate) || 0))[0];

  const qualityMap: Record<string, any> = {};
  formats.forEach((f: any) => {
    const rawQ = f.qualityLabel || '720p';
    const q = rawQ.replace('FHD', '1080p').replace('QHD', '1440p').replace('4K', '2160p').replace('HD', '720p').replace('SD', '480p');
    qualityMap[q] = { id: `br-${f.itag}`, quality: q, ext: 'mp4', isCombined: true, url: f.url, bitrate: f.bitrate, isExternal: false };
  });

  adaptive.forEach((f: any) => {
    if (!f.qualityLabel) return;
    const q = f.qualityLabel;
    if (!qualityMap[q]) {
      qualityMap[q] = { id: `br-${f.itag}`, quality: q, ext: f.mimeType?.includes('video/webm') ? 'webm' : 'mp4', isCombined: false, url: f.url, bitrate: f.bitrate, audioUrl: bestAudio?.url };
    }
  });

  const downloadOptions = Object.values(qualityMap).sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));
  if (bestAudio) {
    const q = `Audio (${bestAudio.bitrate ? Math.round(bestAudio.bitrate / 1000) + 'k' : 'Standard'}) (Audio)`;
    downloadOptions.unshift({ id: `br-audio`, quality: q, ext: 'm4a', isCombined: true, url: bestAudio.url, bitrate: bestAudio.bitrate, isExternal: false });
  }

  return { title: data.title || 'Video', thumbnail: data.thumbnailUrl || '', duration: data.duration || 0, original_url: videoUrl, downloadOptions };
}

function transformPoolData(pool: any, videoUrl: string) {
  const { type, data } = pool;
  let downloadOptions: any[] = [];
  if (type === 'piped') {
    const allStreams = [...(data.videoStreams || []), ...(data.audioStreams || [])];
    const qualityMap: Record<string, any> = {};
    allStreams.forEach((s: any) => {
      if (s.videoOnly) return; 
      const isAudio = s.mimeType?.startsWith('audio/');
      const rawQ = isAudio ? 'Audio' : (s.quality || '720p');
      let q = rawQ.replace('FHD', '1080p').replace('QHD', '1440p').replace('4K', '2160p').replace('HD', '720p').replace('SD', '480p');
      if (isAudio && !q.includes('Audio')) q = `${q} (Audio)`;
      if (!qualityMap[q] || (s.bitrate > qualityMap[q].bitrate)) {
        qualityMap[q] = { id: `res-${isAudio ? 'audio' : s.quality}`, quality: q, ext: s.format === 'MPEG_4' ? 'mp4' : (isAudio ? 'm4a' : 'webm'), isCombined: true, url: s.url, bitrate: s.bitrate, isExternal: false };
      }
    });
    downloadOptions = Object.values(qualityMap);
  } else {
    downloadOptions = (data.formatStreams || []).map((s: any) => ({ id: `res-${s.qualityLabel || s.resolution}`, quality: s.qualityLabel || s.quality || 'HD', ext: s.container || 'mp4', isCombined: true, url: s.url, bitrate: s.bitrate || 0 }));
  }
  return { title: data.title || 'Video', thumbnail: data.thumbnailUrl || data.videoThumbnails?.[0]?.url || '', duration: data.duration || 0, original_url: videoUrl, downloadOptions: downloadOptions.sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality)) };
}

function transformYtDlpData(info: any, videoUrl: string) {
  const rawFormats = info.formats || [];
  const bestAudio = rawFormats.filter((f: any) => f.vcodec === 'none' && f.acodec !== 'none').sort((a: any, b: any) => (b.abr || 0) - (a.abr || 0))[0];
  const qualityMap: Record<string, any> = {};
  rawFormats.forEach((f: any) => {
    if (!f.height || f.height < 144) return;
    const q = `${f.height}p`;
    const isCombined = f.vcodec !== 'none' && f.acodec !== 'none';
    if (!qualityMap[q] || (isCombined && !qualityMap[q].isCombined)) {
      qualityMap[q] = { id: f.format_id, quality: q, ext: f.ext, isCombined, size: f.filesize || f.filesize_approx, url: f.url, audioUrl: isCombined ? null : bestAudio?.url, isExternal: false };
    }
  });
  const options = Object.values(qualityMap).sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));
  if (bestAudio) {
    const q = `${bestAudio.abr ? Math.round(bestAudio.abr) + 'k' : 'Standard'} (Audio)`;
    options.unshift({ id: bestAudio.format_id, quality: q, ext: bestAudio.ext || 'm4a', isCombined: true, size: bestAudio.filesize || bestAudio.filesize_approx, url: bestAudio.url, isExternal: false });
  }
  return { title: info.title || 'Video', thumbnail: info.thumbnail || '', duration: info.duration || 0, original_url: videoUrl, downloadOptions: options };
}

async function handleProxyRequest(req: NextRequest, result: any, videoUrl: string) {
  const { searchParams } = new URL(req.url);
  const formatId = searchParams.get('formatId');
  const range = req.headers.get('range');
  
  const opt = result.downloadOptions.find((o: any) => o.id === formatId) || result.downloadOptions[0];
  if (!opt) throw new Error(`Format ID ${formatId} not found and no default available.`);
  
  const streamUrl = opt?.url;
  if (!streamUrl) throw new Error('Stream URL not found in format options.');

  // --- EXTERNAL WORKER HANDLING (ytdown, cobalt, etc) ---
  const isExternalProxy = streamUrl.includes('worker03.com') || streamUrl.includes('ytdown.to') || streamUrl.includes('cobalt.tools');
  
  if (isExternalProxy) {
    console.log(`[Proxy] Checking external worker status: ${streamUrl}`);
    
    // Fetch the URL to see if it's a JSON status or a redirect to a file
    const upstreamRes = await fetch(streamUrl, {
      redirect: 'manual', // Specifically handle the redirect ourselves if needed
      headers: { 
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });

    // Case 1: Direct File Download or Redirect
    if (upstreamRes.status >= 300 && upstreamRes.status < 400) {
      const location = upstreamRes.headers.get('location');
      if (location) {
        console.log(`[Proxy] External worker redirected directly to: ${location}`);
        return NextResponse.redirect(location);
      }
    }

    const contentType = upstreamRes.headers.get('content-type') || '';
    
    // Case 2: Status JSON (Queued/Merging)
    if (contentType.includes('application/json')) {
      const statusJson = await upstreamRes.json();
      console.log(`[Proxy] External worker returned status: ${statusJson.status || 'unknown'}`);
      return NextResponse.json(statusJson);
    }

    // Case 3: Binary/File body (if it returned the file directly instead of a redirect)
    if (!contentType.includes('text/html')) {
       console.log(`[Proxy] External worker returned direct file body (${contentType})`);
       return NextResponse.redirect(streamUrl);
    }

    // Default: Just redirect to let browser handle it
    console.log(`[Proxy] Defaulting to redirect for external stream`);
    return NextResponse.redirect(streamUrl);
  }

  // --- STREAMING STRATEGY (FALLBACK) ---
  console.log(`[Proxy] Streaming through Vercel: ${streamUrl.substring(0, 50)}...`);
  const response = await fetch(streamUrl, {
    headers: { 
      ...(range ? { Range: range } : {}), 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 
      'Referer': 'https://www.youtube.com/', 
    },
    // @ts-ignore
    agent: sslResilientAgent
  } as any);

  const cleanTitle = (result.title || 'video').replace(/[^\x00-\x7F]/g, "").replace(/[\\/:*?"<>|]/g, "_");
  const headers = new Headers();
  headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4');
  headers.set('Content-Length', response.headers.get('Content-Length') || '');
  headers.set('Content-Disposition', `attachment; filename="${cleanTitle}.${opt.ext || 'mp4'}"`);
  headers.set('Accept-Ranges', 'bytes');
  if (response.headers.get('Content-Range')) { headers.set('Content-Range', response.headers.get('Content-Range')!); }
  
  return new Response(response.body, { status: response.status, headers: headers });
}
