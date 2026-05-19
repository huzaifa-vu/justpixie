# 🎬 Video Alchemy Tool Guide

The **Video Alchemy** suite (`/dashboard/video`) handles heavy video and audio manipulations. While 9 of the tools operate 100% locally in the browser via WebAssembly compilation cores, the YouTube Downloader leverages a robust multi-tiered proxy backend to bypass CORS and streaming limitations.

---

## 🛠️ The Tool Catalog

| Tool Name | Route | Core Technology | Description |
|---|---|---|---|
| **A/V Merger** | `/video/merge` | `ffmpeg.wasm` | Combines independent video and audio tracks. |
| **Video to Audio** | `/video/audio` | `ffmpeg.wasm` | Extracts high-bitrate MP3 or WAV audio tracks. |
| **Video Silencer** | `/video/silence` | `ffmpeg.wasm` | Native audio track suppression (muting). |
| **Compress Video** | `/video/compress` | `ffmpeg.wasm` | Compresses videos using lossy size reduction (CRF adjustments). |
| **GIF Maker** | `/video/gif` | `ffmpeg.wasm` | Encodes video segments into optimized loops. |
| **Rotate Video** | `/video/rotate` | `ffmpeg.wasm` | Rotates video frames by 90, 180, or 270 degrees. |
| **Video Speed** | `/video/speed` | `ffmpeg.wasm` | Accelerates or slows playback rates in-browser. |
| **Video Trimmer** | `/video/trim` | `ffmpeg.wasm` | Trims timelines precisely using timestamps. |
| **To Screenshots** | `/video/screenshots` | HTML5 Video Element | Captures frames natively at specified intervals. |
| **YouTube Downloader**| `/video/youtube` | Server-Side Resolvers | Downloads high-definition video and audio from external platforms. |

---

## 🔬 Core Implementation & Engine Mechanics

### 1. In-Browser Video Processing (`ffmpeg.wasm`)
The majority of the Video Alchemy tools use **FFmpeg compiled to WebAssembly (WASM)**. Because video transcoding is computationally intensive, the engine executes inside a Web Worker thread, keeping the main UI thread responsive.

#### Transcoding Flow:
1.  **Engine Load:** Lazy loads the FFmpeg core binaries and wasm files into memory.
2.  **File System Virtualization (MEMFS):** Pixie writes the uploaded HTML5 File blob directly to FFmpeg's virtual in-memory filesystem:
    ```typescript
    await ffmpeg.writeFile("input.mp4", await fetchFile(file));
    ```
3.  **Command Execution:** Execute standard CLI flags directly on the virtual environment:
    *   *Trim:* `await ffmpeg.exec(['-ss', startTime, '-to', endTime, '-i', 'input.mp4', '-c', 'copy', 'output.mp4'])`
    *   *Extract MP3:* `await ffmpeg.exec(['-i', 'input.mp4', '-vn', '-acodec', 'libmp3lame', '-ab', '192k', 'output.mp3'])`
    *   *Video Speed:* `await ffmpeg.exec(['-i', 'input.mp4', '-filter_complex', `[0:v]setpts=${1/speed}*PTS[v];[0:a]atempo=${speed}[a]`, '-map', '[v]', '-map', '[a]', 'output.mp4'])`
    *   *GIF Encoder:* `await ffmpeg.exec(['-i', 'input.mp4', '-t', duration, '-vf', 'fps=10,scale=320:-1:flags=lanczos', 'output.gif'])`
4.  **Serialization:** Reads the output file from MEMFS and converts it into a local browser Blob URL for download.
    ```typescript
    const data = await ffmpeg.readFile("output.mp4");
    const resultBlob = new Blob([data], { type: "video/mp4" });
    const downloadUrl = URL.createObjectURL(resultBlob);
    ```

### 2. Multi-Tiered YouTube Downloader (`/api/video/downloader`)
Downloading YouTube streams directly from the client is prohibited by browser CORS policies. Pixie routes queries through a serverless API handler which implements a **4-Level Failover Resolver Pool** to find streaming links:

```
[User Request URL]
        │
        ├──► Level 1: Private Worker Bridge (Workers API) ───[Success]───┐
        │                                                                ├─► Return Metadata
        ├──► Level 2: ytdown.to API Scraper ───────────────[Success]───┤
        │                                                                ├─► Return Metadata
        ├──► Level 3: Invidious/Piped Public Pool ─────────[Success]───┤
        │                                                                ├─► Return Metadata
        └──► Level 4: Cobalt API Fallback ──────────────────[Success]───┤
                                                                         │
                                   [Fallback: Native yt-dlp Executable] ─┘
```

#### The Fallback Engine:
*   **Level 1: Private Bridge:** An edge worker bridge fetching raw video stream blocks.
*   **Level 2: ytdown.to API:** Scrapes ytdown options.
*   **Level 3: Global Resolver Pool:** Dispatches searches to active public Piped and Invidious nodes.
*   **Level 4: Cobalt Fallback:** Routes through cobalt instances.
*   **Level 5: Local Binary execution:** If the URL is not from YouTube, the server falls back to spawning a local `yt-dlp` shell instance using the `youtube-dl-exec` bridge.
*   **Streaming Proxy:** If the format requires bypassing regional blocks or strict CORS, the server proxies the chunks from the source stream to the browser via a streaming chunk response, ensuring a high-performance download stream.
