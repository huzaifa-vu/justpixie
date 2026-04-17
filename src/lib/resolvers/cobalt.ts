import { ResolverResult, DownloadOption } from './ytdown';

export async function resolveCobalt(videoUrl: string): Promise<ResolverResult | null> {
  try {
    const res = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        url: videoUrl,
        videoQuality: '1080',
        audioFormat: 'mp3'
      }),
      // @ts-ignore
      signal: AbortSignal.timeout(10000)
    });

    if (!res.ok) return null;

    const data = await res.json();
    
    // Cobalt returns a single URL for the best quality requested
    if (data.status === 'error') return null;
    
    if (data.url || data.picker) {
      const downloadOptions: DownloadOption[] = [];
      
      if (data.url) {
        downloadOptions.push({
          id: 'cobalt-main',
          quality: 'Premium HD',
          ext: 'mp4',
          isCombined: true,
          url: data.url
        });
      }
      
      if (data.picker) {
        data.picker.forEach((item: any, index: number) => {
          downloadOptions.push({
            id: `cobalt-p-${index}`,
            quality: item.quality || 'HD',
            ext: item.ext || 'mp4',
            isCombined: true,
            url: item.url
          });
        });
      }

      return {
        title: 'Video Download',
        thumbnail: '',
        duration: 0,
        original_url: videoUrl,
        downloadOptions
      };
    }

    return null;
  } catch (error) {
    console.warn('cobalt resolver failed:', error);
    return null;
  }
}
