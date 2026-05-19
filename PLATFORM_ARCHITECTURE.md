# 🏗️ Pixie — Universal Multi-Platform Architecture

> **The Goal:** One git push, one codebase, three deployment targets — Web (Vercel), Desktop (Electron), Mobile (Capacitor). No duplicated code. No broken deployments.

---

## 🔑 The First Critical Truth: You Are Almost Already There

Before anything else, you need to understand this:

**Vercel does NOT care about the `electron/` folder.** Vercel runs `next build` and deploys the Next.js output. It completely ignores any files it doesn't recognise — `electron/main.ts`, `electron-builder.yml`, `ELECTRON_PLAN.md` — all ignored. You can push the Electron files to your repo TODAY and Vercel won't even blink.

**The `postinstall` script IS the only real problem.** Your current `package.json` has:
```json
"postinstall": "node scripts/download-yt-dlp.mjs"
```
This downloads a 15MB+ binary from GitHub on every `npm install`. On Vercel's build servers, this runs during deployment and can fail (network timeouts, unsupported platform detection). This needs to be made environment-aware. That is the **only actual fix needed** for Vercel compatibility right now.

Everything else is a CI/CD and workflow design problem — not a code architecture problem.

---

## 🌐 The Professional Answer: Single Repo + Platform-Aware CI/CD

The industry name for this is a **"Universal Application" with platform-specific build targets**. Companies like Notion, Discord, Linear, and Figma all use this exact model.

### The Stack

| Layer | Technology | Role |
|---|---|---|
| **Shared Code** | Next.js (your current app) | UI, tools, logic — runs everywhere |
| **Web** | Vercel | Auto-deploys on every `git push` to `main` |
| **Desktop** | Electron | Wraps the Next.js app in a native shell |
| **Mobile** | Capacitor | Wraps the Next.js app in a native mobile shell |
| **Orchestration** | GitHub Actions | Triggers right builds for right platforms |

### Why Not a Full Monorepo Rewrite?

A monorepo (Turborepo/Nx) splits code into `apps/web`, `apps/desktop`, `packages/ui` etc. This is the ideal long-term architecture for large teams. **But for Pixie right now, it requires weeks of refactoring** with zero user-visible benefit. The single-repo + CI/CD approach below gives you 95% of the same benefit in 2 days.

---

## 🔀 The Git Branching Strategy

```
main (protected)
  │
  ├── Triggers → Vercel auto-deploy (web)
  └── Triggers → GitHub Actions (only on version tags)
                        │
                        ├── build-desktop.yml  → Electron .exe / .dmg / .AppImage
                        └── build-mobile.yml   → Capacitor iOS / Android (future)
```

**The flow in plain English:**
1. You write code, push to `main` → Vercel auto-deploys the web app. Done.
2. When you're ready for a new desktop release, you tag the commit: `git tag v1.0.1 && git push origin v1.0.1`
3. GitHub Actions detects the tag, runs the Electron build for Windows/Mac/Linux, produces installers, uploads them to a GitHub Release automatically.
4. Users download from your GitHub Release page or your website.

You **never** manually run Electron builds. The CI does it.

---

## 🔧 Fix #1: Platform-Aware `postinstall` Script (Do This Now)

The `download-yt-dlp.mjs` script must be skipped on Vercel. Vercel sets an environment variable called `VERCEL` to `"1"`.

**Edit `scripts/download-yt-dlp.mjs` — add this at the top of `main()`:**

```javascript
async function main() {
  // Skip on Vercel and other CI environments where binary is not needed
  if (process.env.VERCEL || process.env.CI_SKIP_YTDLP) {
    console.log('Skipping yt-dlp download (Vercel/CI environment detected).');
    return;
  }
  
  // ... rest of existing code unchanged
}
```

That's it. Vercel continues to work perfectly. The binary downloads locally and in Electron builds.

---

## 🔧 Fix #2: Make `next.config.ts` Conditionally Standalone

`output: 'standalone'` is needed for Electron (bundles Node.js server) but unnecessary for Vercel (which has its own output handling). It works on Vercel too, but it's cleaner to be explicit:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const isElectronBuild = process.env.BUILD_TARGET === 'electron';

const nextConfig: NextConfig = {
  ...(isElectronBuild && { output: 'standalone' }),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/dashboard/pdf/lock",
        destination: "/dashboard/pdf/privacy",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

Then in `package.json` Electron build scripts:
```json
"electron:build": "cross-env BUILD_TARGET=electron next build && electron-builder build"
```

Vercel never sets `BUILD_TARGET`, so it gets the standard build. Electron sets it explicitly and gets `standalone`.

---

## 🔧 Fix #3: Platform Detection in React Components

Some UI or behaviour should differ between web and desktop (e.g. "Download" button using native dialog on desktop, showing/hiding the billing upgrade section, etc.).

Create `src/utils/platform.ts`:

```typescript
// src/utils/platform.ts

// Detects if running inside Electron (set by preload.ts contextBridge)
export const isDesktop = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).electronPixie?.isDesktop;
};

// Detects if running as a mobile app (Capacitor sets this)
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
};

// Detects web browser
export const isWeb = (): boolean => !isDesktop() && !isMobile();

// Current platform string
export const getPlatform = (): 'web' | 'desktop' | 'mobile' => {
  if (isDesktop()) return 'desktop';
  if (isMobile()) return 'mobile';
  return 'web';
};
```

Use anywhere in your app:
```tsx
import { isDesktop, isWeb } from '@/utils/platform';

// In the upgrade/billing page:
if (isDesktop()) {
  // Open browser to pricing page
  window.electronPixie.openExternal('https://pixie.app/pricing');
} else {
  // Show in-app upgrade modal
}
```

---

## 🤖 The GitHub Actions CI/CD Pipelines

Create these files in `.github/workflows/`:

### Web: Already Handled by Vercel
You don't need a GitHub Action for web deployment — Vercel's GitHub integration does this automatically on every push to `main`. Nothing to set up.

### Desktop: `.github/workflows/desktop-release.yml`

```yaml
name: Desktop Release

# ONLY triggers when you push a version tag like v1.0.0
on:
  push:
    tags:
      - 'v*'

jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        env:
          CI_SKIP_YTDLP: true   # Skip yt-dlp download, we bundle it separately
          
      - name: Download yt-dlp for Windows
        run: node scripts/download-yt-dlp.mjs
        
      - name: Build Next.js + Electron
        run: npm run electron:build:win
        env:
          BUILD_TARGET: electron
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}
          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}
          # Lemon Squeezy for billing
          LEMON_SQUEEZY_API_KEY: ${{ secrets.LEMON_SQUEEZY_API_KEY }}
          LEMON_SQUEEZY_STORE_ID: ${{ secrets.LEMON_SQUEEZY_STORE_ID }}
          LEMON_SQUEEZY_VARIANT_ID: ${{ secrets.LEMON_SQUEEZY_VARIANT_ID }}
          LEMON_SQUEEZY_WEBHOOK_SECRET: ${{ secrets.LEMON_SQUEEZY_WEBHOOK_SECRET }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # For electron-builder to upload to GitHub Releases
          
      - name: Upload Windows Installer to GitHub Release
        uses: actions/upload-artifact@v4
        with:
          name: pixie-windows
          path: dist-electron/*.exe

  build-macos:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        env:
          CI_SKIP_YTDLP: true
      - run: node scripts/download-yt-dlp.mjs
      - run: npm run electron:build:mac
        env:
          BUILD_TARGET: electron
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}
          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: pixie-macos
          path: dist-electron/*.dmg

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
        env:
          CI_SKIP_YTDLP: true
      - run: node scripts/download-yt-dlp.mjs
      - run: npm run electron:build:linux
        env:
          BUILD_TARGET: electron
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }}
          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      - uses: actions/upload-artifact@v4
        with:
          name: pixie-linux
          path: dist-electron/*.AppImage

  create-release:
    needs: [build-windows, build-macos, build-linux]
    runs-on: ubuntu-latest
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v4
        
      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            pixie-windows/*.exe
            pixie-macos/*.dmg
            pixie-linux/*.AppImage
          generate_release_notes: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**What happens when you run `git tag v1.2.0 && git push origin v1.2.0`:**
1. GitHub spins up Windows, macOS, and Linux VMs simultaneously.
2. Each VM builds the app for its platform.
3. All three installers are uploaded to a GitHub Release page automatically.
4. Users see `Pixie v1.2.0 — Download for Windows / Mac / Linux`.

---

## 📱 Mobile (Future): Capacitor

Capacitor is the mobile equivalent of Electron — it wraps your web app in a native iOS/Android shell. Since Pixie is Next.js, you export a static build and Capacitor loads it.

**The key:** Capacitor works almost identically to Electron conceptually:
- Static Next.js export goes into `www/` folder
- Capacitor wraps it in a WebView
- Uses the same `window.Capacitor` detection pattern as `window.electronPixie`

**What changes for mobile (future planning):**
- Tools that use `SharedArrayBuffer` (ffmpeg.wasm multithreading) won't work on mobile WebViews — these would use a lighter single-threaded mode
- AI router and YouTube downloader work as-is (internet dependent)
- File system access uses `@capacitor/filesystem` plugin instead of blob URLs

This is why the `platform.ts` utility file matters — by the time you add mobile, every component already has the platform detection pattern in place.

### Future Mobile GitHub Action (`.github/workflows/mobile-release.yml`)
```yaml
name: Mobile Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
        env: { CI_SKIP_YTDLP: true }
      - run: npm run mobile:build:android
      # ... upload APK / submit to Play Store

  build-ios:
    runs-on: macos-latest
    # ... Xcode build + submit to App Store
```

---

## 📦 Microsoft Store (MSIX Packaging)

`electron-builder` supports MSIX packaging for the Microsoft Store out of the box. Add to `electron-builder.yml`:

```yaml
win:
  target:
    - target: nsis      # Standard Windows installer download from website
      arch: [x64]
    - target: appx      # Microsoft Store MSIX package
      arch: [x64]

appx:
  applicationId: com.pixie.app
  identityName: PixieApp
  publisher: "CN=Your Publisher Name"
  publisherDisplayName: "Pixie"
```

The `.appx` file produced is submitted to the Microsoft Partner Center dashboard for Store review.

---

## 🗺️ Complete Platform Map

```
git push origin main
        │
        ├──► Vercel (automatic, always)
        │         └── pixie.app  ← live in ~60 seconds
        │
        └──► GitHub (code stored)
                  │
                  └── git tag v1.x.x && git push origin v1.x.x
                            │
                            ├──► GitHub Actions: Windows build
                            │         └── Pixie-Setup-1.x.x.exe (download from website)
                            │         └── Pixie-1.x.x.appx      (Microsoft Store)
                            │
                            ├──► GitHub Actions: macOS build
                            │         └── Pixie-1.x.x.dmg       (download from website)
                            │         └── Pixie-1.x.x.pkg       (Mac App Store, future)
                            │
                            ├──► GitHub Actions: Linux build
                            │         └── Pixie-1.x.x.AppImage  (download from website)
                            │         └── Pixie-1.x.x.deb       (apt repository, future)
                            │
                            └──► GitHub Actions: Mobile (future)
                                      ├── Pixie.apk              (Google Play Store)
                                      └── Pixie.ipa              (Apple App Store)
```

---

## ✅ Implementation Priority — What to Do and When

### Right Now (30 minutes — fixes Vercel compatibility for Electron files)
1. Edit `scripts/download-yt-dlp.mjs` — add the `process.env.VERCEL` early-exit check
2. Edit `next.config.ts` — add conditional `output: 'standalone'`
3. Create `src/utils/platform.ts` — the platform detection utility
4. Update `.gitignore` — add `dist-electron/` and `electron/out/`
5. Commit and push → verify Vercel still deploys cleanly

### Phase 1 — Desktop Working (2–3 days)
6. Create `electron/main.ts`, `electron/preload.ts`, `electron/tray.ts`
7. Create `electron-builder.yml`
8. Update `package.json` scripts
9. Test locally with `npm run electron:dev`
10. Create `.github/workflows/desktop-release.yml`
11. Add all secret keys to GitHub repo secrets (Settings → Secrets)
12. Test by tagging: `git tag v0.1.0-beta && git push origin v0.1.0-beta`
13. Verify the GitHub Release is created with all three installers

### Phase 2 — Mobile Scaffold (future, 1–2 weeks)
14. Add Capacitor: `npx cap init && npx cap add android && npx cap add ios`
15. Create mobile-specific static export script
16. Add mobile-specific platform handling for ffmpeg.wasm
17. Add `.github/workflows/mobile-release.yml`

---

## 🔑 GitHub Repository Secrets to Set

Go to `github.com/your-repo/settings/secrets/actions` and add:

| Secret Name | Value |
|---|---|
| `GEMINI_API_KEY` | Your Gemini API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key |
| `SUPABASE_SECRET_KEY` | Supabase service role key |
| `LEMON_SQUEEZY_API_KEY` | Lemon Squeezy API key |
| `LEMON_SQUEEZY_STORE_ID` | Store ID |
| `LEMON_SQUEEZY_VARIANT_ID` | Variant ID |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Webhook secret |

`GITHUB_TOKEN` is automatically provided by GitHub Actions — you don't set this one.

---

## 📋 Summary: The 3 Core Principles

1. **One codebase, platform-aware behaviour** — `platform.ts` tells components where they're running. 95% of code is identical everywhere.

2. **Vercel handles web automatically** — nothing changes. Every push to `main` deploys the web app.

3. **Version tags trigger native builds** — `git tag v1.0.0` + push = GitHub Actions builds Windows/Mac/Linux installers and publishes a GitHub Release. No manual work.

The fundamental insight: **your web app IS your desktop app IS your mobile app**. The platforms are just thin native shells that load the same Next.js app. You never write the same logic twice.
