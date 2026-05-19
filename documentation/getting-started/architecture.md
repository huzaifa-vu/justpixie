# 🏗️ Technical Architecture

This document describes the technical architecture, directory structure, and runtime execution patterns of Pixie.

---

## 🛠️ The Tech Stack

Pixie is built on the following technologies:
*   **Core framework:** Next.js (App Router, TypeScript)
*   **Styling:** Vanilla CSS Modules (no global style leakage, modular layout design)
*   **UI Animations:** Framer Motion (page transitions, micro-interactions) and GSAP (landing page hero animations)
*   **Icons:** Lucide React
*   **Backend & Auth:** Supabase (Client & Admin SDKs)
*   **Billing & Subscriptions:** Lemon Squeezy (subscription webhook handlers)

---

## 📂 Codebase Directory Map

```
pixie/
├── documentation/            # Developer & User guide markdown sheets
├── public/                   # Static assets, fallback media, WASM binary files
├── scripts/                  # Pre/post-install scripts (e.g. yt-dlp resolver)
├── src/
│   ├── app/                  # Next.js App Router Structure
│   │   ├── api/              # Route handlers (AI router, user quotas, webhooks)
│   │   ├── login/            # Supabase user authentication flows
│   │   ├── pricing/          # Subscription upgrade plans
│   │   └── dashboard/        # Main workspace shell
│   │       ├── image/        # Hub page and 12 Image Magic tool pages
│   │       ├── pdf/          # Hub page and 9 PDF Spell tool pages
│   │       ├── video/        # Hub page and 10 Video Alchemy tool pages
│   │       ├── dev/          # Hub page and 14 Dev Utility pages
│   │       └── text/         # Hub page and 5 Text & Data tool pages
│   ├── components/           # Reusable React components (DropZone, Toolbars, HUD)
│   ├── contexts/             # Global contexts (Auth, settings)
│   ├── hooks/                # Custom React hooks (useAiHydration, useQuota)
│   └── utils/                # Helper modules (toolsRegistry, supabase client)
```

---

## ⚡ WebAssembly (WASM) & Heavy Asset Execution

A critical engineering challenge in Next.js when working with WASM engines (like FFmpeg WASM or AI models) is **preventing Server-Side Rendering (SSR) compile errors** and **optimizing browser loading**.

### 1. Lazy Initialization Pattern
To prevent Next.js node environments from attempting to execute client-side WebAssembly binaries during compile time, all heavy engine initialization is locked behind client side checks and loaded asynchronously inside `useEffect` or triggered via user event callbacks.

**Example: Asynchronous FFmpeg Loading**
```typescript
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";

const ffmpegRef = useRef<FFmpeg | null>(null);

const loadFFmpeg = async () => {
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  const ffmpeg = new FFmpeg();
  
  // Attach logging listeners
  ffmpeg.on("log", ({ message }) => console.log(message));
  
  await ffmpeg.load({
    coreJS: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmSource: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });
  
  ffmpegRef.current = ffmpeg;
};
```

### 2. Multi-Threading & SharedArrayBuffer Headers
Some WASM engines require multi-threaded processing. This requires enabling `SharedArrayBuffer` support in the user's browser. To do this, Next.js is configured with specific security headers in `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};
```
*Note: These headers ensure that the browser sandbox runs in a secure cross-origin isolation mode, allowing multi-threaded WebAssembly to access CPU cores.*

---

## 💾 Client-Side State & Local Blob Management

All processed results (images, audio cuts, compressed PDFs, formatted text) are saved back to the browser's DOM memory.

1.  **File Staging:** Files drop into a custom `<DropZone />` component, which converts them into standard HTML5 `File` arrays.
2.  **Object URLs:** During processing, files are accessed locally. To render or preview the output, Pixie creates in-memory reference tags using `URL.createObjectURL(blob)`.
3.  **Automatic Memory Scrubbing:** To prevent browser memory exhaustion (out-of-memory crashes), Pixie components clean up object URLs when the component unmounts:
```typescript
useEffect(() => {
  return () => {
    if (originalUrl) URL.revokeObjectURL(originalUrl);
    if (compressedUrl) URL.revokeObjectURL(compressedUrl);
  };
}, [originalUrl, compressedUrl]);
```
4.  **Auto-Download Integration:** If the user has "Auto-Download" enabled in their settings dashboard, Pixie programmatically triggers a virtual click on a hidden anchor tag to save the file to the user's local disk immediately upon process completion.
