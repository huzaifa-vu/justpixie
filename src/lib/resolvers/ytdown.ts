export interface ResolverResult {
  title: string;
  thumbnail: string;
  duration: number;
  original_url: string;
  downloadOptions: DownloadOption[];
}

export interface DownloadOption {
  id: string;
  quality: string;
  ext: string;
  isCombined: boolean;
  url: string;
  bitrate?: number;
  size?: number;
  audioUrl?: string;
  audioSize?: number;
}

export async function resolveYtDown(videoUrl: string): Promise<ResolverResult | null> {
  try {
    const res = await fetch('https://app.ytdown.to/proxy.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'X-Requested-With': 'XMLHttpRequest',
        'Origin': 'https://app.ytdown.to',
        'Referer': 'https://app.ytdown.to/en24/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: `url=${encodeURIComponent(videoUrl)}`,
      // @ts-ignore
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data.mediaItems || !Array.isArray(data.mediaItems)) return null;

    const downloadOptions: DownloadOption[] = data.mediaItems.map((item: any, index: number) => {
      const isAudio = item.type === 'Audio';
      return {
        id: `ytd-${index}-${item.mediaQuality}`,
        quality: item.mediaQuality,
        ext: item.mediaExtension?.toLowerCase() || (isAudio ? 'm4a' : 'mp4'),
        isCombined: item.mediaTask === 'download' || item.type === 'Audio',
        // For 'merge' tasks, the mediaUrl is the conversion endpoint
        // For 'download' tasks or audio, mediaPreviewUrl is often the direct link
        url: item.mediaUrl,
        size: parseSize(item.mediaFileSize),
        // Additional info for merged files if needed, but ytdown handles merging server-side
      };
    });

    return {
      title: data.mediaItems[0]?.name || 'YouTube Video',
      thumbnail: data.mediaItems[0]?.mediaThumbnail || '',
      duration: parseDuration(data.mediaItems[0]?.mediaDuration),
      original_url: videoUrl,
      downloadOptions: downloadOptions.sort((a, b) => {
        if (a.quality === 'Audio') return 1;
        if (b.quality === 'Audio') return -1;
        return parseInt(b.quality) - parseInt(a.quality);
      })
    };
  } catch (error) {
    console.warn('ytdown resolver failed:', error);
    return null;
  }
}

function parseSize(sizeStr: string): number {
  if (!sizeStr) return 0;
  const match = sizeStr.match(/([\d.]+)\s*(MB|GB|KB)/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  if (unit === 'GB') return val * 1024 * 1024 * 1024;
  if (unit === 'MB') return val * 1024 * 1024;
  if (unit === 'KB') return val * 1024;
  return val;
}

function parseDuration(durStr: string): number {
  if (!durStr) return 0;
  const parts = durStr.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}
