# Pixie — Project Context

> **Last Updated:** April 16, 2026 (Local Project Timeline)  
> **Purpose:** This file provides complete project context for AI agents working on the Pixie codebase.

---

## 1. Project Overview
**Pixie** is a high-performance, **local-first, serverless file conversion application**. 
- **Privacy First:** 100% of processing happens in the user's browser using WebAssembly (WASM). No files are ever uploaded to a server.
- **Zero Server Costs:** Since the user's hardware does the work, the application has zero backend compute costs.
- **AI-Powered:** A central AI router (Gemini 1.5 Flash) interprets natural language prompts and route users to the correct tool with auto-filled configurations.

---

## 2. Tech Stack & Engineering
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Vanilla CSS Modules (No Tailwind)
- **Enginearies:**
  - **Multimedia:** `ffmpeg.wasm` (Video/Audio processing)
  - **Images:** `browser-image-compression`, AI background removal (`@imgly/background-removal`), Canvas API
  - **PDFs:** `pdf-lib`, `pdfjs-dist`
  - **Dev/Text:** Native JS, Web Crypto API, Web Speech API
- **Animations:** `framer-motion`, `gsap`
- **Icons:** `lucide-react`
- **Backend:** Supabase (Auth, Quota Management)

---

## 3. Design System: "Pastel Squircles"
- **Background:** Soft Sage (`#f4f7f4`)
- **Primary Text:** Deep Charcoal (`#222222`)
- **Accents:** Mint Green (`#a7f3d0`), Gentle Lilac (`#c4b5fd`)
- **Aesthetic:** Massive border radii (`--radius-bento: 48px`), pill-shaped buttons, bento-grid layouts.
- **Rules:** No generic colors. Use the defined palette tokens. Components must feel "alive" with micro-animations.

---

## 4. Feature Progress (All Tools Completed)

| Category | Status | Count |
|----------|--------|-------|
| 📸 **Image Magic** | 12 Built | Compressor, BG Remover, Format, Watermark, Resize, Crop, Rotate, Filters, Favicon, Palette, Annotate, Img-to-PDF |
| 🎬 **Video Alchemy** | 9 Built | Silencer, MP3 Extractor, GIF Maker, Compressor, Rotate, Speed, Trim, Screenshots, Frames |
| 📄 **PDF Spells** | 9 Built | Compress, Merge, Split, Lock, PDF-to-Img, Rotate, Numbers, Watermark, Reorder |
| 🛠️ **Dev Utilities** | 14 Built | JSON, Base64, Hash, Color, Lorem, URL, JWT, UUID, Timestamp, Minifier, Regex, Markdown, Diff, QR |
| 📝 **Text & Data** | 5 Built | Word Counter, Case Converter, Replace, CSV, Speech |

---

## 5. Directory Structure
- `src/app/` — Global layout and landing page
- `src/app/dashboard/` — Main app shell with sidebar and breadcrumbs
- `src/app/dashboard/[category]/` — Hub pages (Image, PDF, etc.)
- `src/app/dashboard/[category]/[tool]/` — Individual tool implementations
- `public/` — Static assets and WASM binaries

---

## 6. Current Roadmap & Next Steps
1. **AI Integration:** Completed. Gemini 1.5 Flash router is fully functional on the Dashboard.
2. **Auth & Settings:** Completed. Supabase integration for user accounts and quotas is live.
3. **Mobile & Desktop:** Exploring feasibility for Android and Desktop (Electron/Tauri) versions.
4. **Maintenance:** Refining "Pastel Squircle" responsive layouts and auditing tool performance.

---

## 7. Key Architecture Patterns
- **WASM Lazy Loading:** FFmpeg and AI models are initialized inside `useEffect` with lazy loading to ensure SSR compatibility.
- **AI Hydration:** Tools consume piped parameters from the router via the `useAiHydration` hook.
- **Shared CSS:** Most tools share layouts from `../format/page.module.css` or `../dev/dev.module.css` to maintain brand consistency.
- **Local Blobs:** Result files are generated as local `Blob` URLs for instant, private downloads.

