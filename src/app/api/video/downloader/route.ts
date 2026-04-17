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
    let result: any = null;

    if (isYouTube && videoId) {
      // --- LEVEL 1: PRIVATE BRIDGE ---
      const bridgeData = await attemptBridgeExtraction(videoId);
      if (bridgeData && bridgeData.formatStreams) {
        console.log('Level 1 Success: Private Bridge');
        result = transformBridgeData(bridgeData, videoUrl);
      }

      // --- LEVEL 2: YT-DOWN PROXY ---
      if (!result) {
        const ytdownResult = await resolveYtDown(videoUrl);
        if (ytdownResult && ytdownResult.downloadOptions.length > 0) {
          console.log('Level 2 Success: ytdown.to');
          result = ytdownResult;
        }
      }

      // --- LEVEL 3: GLOBAL POOL ---
      if (!result) {
        const poolData = await attemptPoolExtraction(videoId);
        if (poolData) {
          console.log(`Level 3 Success: Pool (${poolData.type})`);
          result = transformPoolData(poolData, videoUrl);
        }
      }
    } else {
      // Non-YouTube fallback to yt-dlp
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
      throw new Error('All download resolvers failed for this video.');
    }

    // Proxy logic
    if (proxy) {
      return handleProxyRequest(req, result, videoUrl);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Final Bridge Resolver Error:', error);
    return NextResponse.json({ error: 'Download failed after all attempts.', details: error.message }, { status: 500 });
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
    const q = f.qualityLabel || '720p';
    qualityMap[q] = { id: `br-${f.itag}`, quality: q, ext: 'mp4', isCombined: true, url: f.url, bitrate: f.bitrate };
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
    downloadOptions.unshift({ id: `br-audio`, quality: 'Audio', ext: 'm4a', isCombined: true, url: bestAudio.url, bitrate: bestAudio.bitrate });
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
      const q = isAudio ? 'Audio' : (s.quality || '720p');
      if (!qualityMap[q] || (s.bitrate > qualityMap[q].bitrate)) {
        qualityMap[q] = { id: `res-${isAudio ? 'audio' : s.quality}`, quality: q, ext: s.format === 'MPEG_4' ? 'mp4' : (isAudio ? 'm4a' : 'webm'), isCombined: true, url: s.url, bitrate: s.bitrate };
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
      qualityMap[q] = { id: f.format_id, quality: q, ext: f.ext, isCombined, size: f.filesize || f.filesize_approx, url: f.url, audioUrl: isCombined ? null : bestAudio?.url };
    }
  });
  const options = Object.values(qualityMap).sort((a: any, b: any) => parseInt(b.quality) - parseInt(a.quality));
  if (bestAudio) options.unshift({ id: bestAudio.format_id, quality: 'Audio', ext: bestAudio.ext || 'm4a', isCombined: true, size: bestAudio.filesize || bestAudio.filesize_approx, url: bestAudio.url });
  return { title: info.title || 'Video', thumbnail: info.thumbnail || '', duration: info.duration || 0, original_url: videoUrl, downloadOptions: options };
}

async function handleProxyRequest(req: NextRequest, result: any, videoUrl: string) {
  const { searchParams } = new URL(req.url);
  const formatId = searchParams.get('formatId');
  const range = req.headers.get('range');
  const opt = result.downloadOptions.find((o: any) => o.id === formatId) || result.downloadOptions[0];
  const streamUrl = opt?.url;
  
  if (!streamUrl) throw new Error('Stream URL not found.');
  
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
