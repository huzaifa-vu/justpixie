/**
 * YouTube PoToken (Proof of Origin Token) Generator
 * 
 * Updated implementation: Calls an internal API proxy to fetch tokens
 * to avoid browser CORS restrictions.
 */

export interface YouTubeTokens {
  poToken: string;
  visitorData: string;
}

/**
 * Fetches identity tokens through our internal server-side proxy.
 */
export async function getYouTubePoToken(): Promise<YouTubeTokens | null> {
  try {
    // Call our internal proxy to avoid CORS errors with youtube.com
    const response = await fetch('/api/video/downloader/tokens');
    
    if (!response.ok) {
        console.warn('Internal token proxy returned an error.');
        return null;
    }
    
    const data = await response.json();
    
    return {
       poToken: data.poToken || '',
       visitorData: data.visitorData || ''
    };
  } catch (error) {
    console.warn('PoToken harvesting failed:', error);
    return null;
  }
}
