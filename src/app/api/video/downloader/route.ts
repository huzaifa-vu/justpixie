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

// Helper: Extract YouTube video ID
const extractVideoId = (url: string) => {
  const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
  return match?.[1] || null;
};

// Helper: Attempt Piped API extraction
const fetchPiped = async (videoId: string) => {
  const instances = [
    'https://pipedapi.kavin.rocks',
    'https://api-piped.mha.fi',
    'https://piped-api.lunar.icu'
  ];

  for (const instance of instances) {
    try {
      console.log(`Trying Piped Instance: ${instance}`);
      const res = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 3600 }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.videoStreams && data.videoStreams.length > 0) {
          return data;
        }
      }
    } catch (e) {
      console.warn(`Piped instance ${instance} failed.`, e);
    }
  }
  return null;
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
    let info: any = null;
    let downloadOptions: any[] = [];
    let usedResolver = false;

    // --- PHASE 1: PIPED RESOLVER (YOUTUBE ONLY) ---
    if (isYouTube && videoId) {
      const pipedData = await fetchPiped(videoId);
      if (pipedData) {
        usedResolver = true;
        console.log('Piped Resolver Success!');
        
        info = {
          title: pipedData.title || 'YouTube Video',
          thumbnail: pipedData.thumbnailUrl || '',
          duration: pipedData.duration || 0,
          original_url: videoUrl
        };

        // Map streams: prioritize MPEG_4 (combined)
        const allStreams = [...(pipedData.videoStreams || []), ...(pipedData.audioStreams || [])];
        
        const qualityMap: Record<string, any> = {};
        allStreams.forEach((s: any) => {
          if (s.videoOnly) return; 

          const isAudio = s.mimeType?.startsWith('audio/');
          const q = isAudio ? 'Audio' : (s.quality || '720p');
          
          if (!qualityMap[q] || (s.bitrate > qualityMap[q].bitrate)) {
            qualityMap[q] = {
              id: `piped-${isAudio ? 'audio' : s.quality}`,
              quality: q,
              ext: s.format === 'MPEG_4' ? 'mp4' : (isAudio ? 'm4a' : 'webm'),
              isCombined: true,
              size: 0,
              url: s.url,
              bitrate: s.bitrate
            };
          }
        });
        
        downloadOptions = Object.values(qualityMap).sort((a: any, b: any) => {
            if (a.quality === 'Audio') return -1;
            if (b.quality === 'Audio') return 1;
            return parseInt(b.quality) - parseInt(a.quality);
        });
      }
    }

    // --- PHASE 2: FALLBACK TO YT-DLP (IOS CLIENT BYPASS) ---
    if (!usedResolver) {
      console.log('Falling back to yt-dlp (ios bypass)...');
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
        // The 'ios' client is currently the strongest bypass for data-center IPs
        extractorArgs: isYouTube ? 'youtube:player-client=ios,tv' : undefined,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
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
      const opt = downloadOptions.find(o => o.id === formatId) || downloadOptions[0];
      streamUrl = opt?.url;

      if (!streamUrl) throw new Error('Stream URL not found.');

      const title = info.title || 'video';
      const cleanTitle = title.replace(/[^\x00-\x7F]/g, "").replace(/[\\/:*?"<>|]/g, "_");

      const response = await fetch(streamUrl, {
        headers: {
          ...(range ? { Range: range } : {}),
          'User-Agent': isYouTube ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
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
    console.error('Resilient Resolver Error:', error);
    return NextResponse.json({ 
      error: 'Metadata extraction failed on all levels.', 
      details: error.message 
    }, { status: 500 });
  }
}
