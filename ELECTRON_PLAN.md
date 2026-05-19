# 🖥️ Pixie Desktop App — Electron Integration Plan

> **Goal:** Wrap the existing Next.js Pixie web app inside Electron to produce a native Windows / macOS / Linux desktop application. Zero new UI needed — Electron simply hosts the Next.js server or static export inside a `BrowserWindow`. All 49 offline tools keep working identically. Online features (AI router, YouTube downloader) work when internet is available and gracefully degrade when offline.

---

## 1. Chosen Integration Strategy: `next-electron-server` Pattern

We will **not** rebuild or duplicate any UI. Instead, we use the well-proven pattern of:

1. Running `next build` + `next start` (or a static export for fully offline use) inside the Electron main process.
2. Loading `http://localhost:PORT` into an Electron `BrowserWindow`.
3. Packaging everything with `electron-builder`.

This means:
- Every existing route, tool, CSS module, WASM binary, and API handler works as-is.
- We add approximately **4 new files** to the repo (Electron main, preload, builder config, and updated `package.json` scripts).

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Electron Main Process (Node.js)                            │
│                                                             │
│  ┌─────────────────────┐   ┌───────────────────────────┐   │
│  │  next start         │   │  electron/main.ts         │   │
│  │  (localhost:3000)   │◄──│  Spawns Next.js server    │   │
│  │                     │   │  Creates BrowserWindow    │   │
│  └─────────────────────┘   │  Handles system tray      │   │
│                             │  Registers IPC handlers   │   │
│                             └───────────────────────────┘   │
│                                        │                    │
│                             ┌──────────▼──────────┐         │
│                             │  Preload Script     │         │
│                             │  (context bridge)   │         │
│                             └──────────┬──────────┘         │
└────────────────────────────────────────│────────────────────┘
                                         │
┌────────────────────────────────────────▼────────────────────┐
│  Renderer Process (Chromium)                                │
│  Loads: http://localhost:3000  (full Next.js app)           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ WASM Tools   │  │ Canvas APIs  │  │ Web Speech API   │  │
│  │ ffmpeg.wasm  │  │ pdf-lib      │  │ Text to Speech   │  │
│  │ bg-removal   │  │ pdfjs-dist   │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Online Features (gracefully degrade when offline)   │   │
│  │  • /api/ai/router → Gemini 2.5 Flash                 │   │
│  │  • /api/video/downloader → yt-dlp + resolver pool    │   │
│  │  • Supabase Auth & Quota checks                      │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. New Files to Create

```
pixie/
├── electron/
│   ├── main.ts          ← Electron main process entry
│   ├── preload.ts       ← Context bridge (exposes safe IPC to renderer)
│   └── tray.ts          ← System tray icon & menu (optional but nice)
├── electron-builder.yml ← Packaging configuration
└── ELECTRON_PLAN.md     ← This document
```

Existing files that need **minor edits**:
- `package.json` — add electron deps + new scripts
- `next.config.ts` — add `output: 'standalone'` for bundled server

---

## 4. Dependencies to Add

```bash
npm install --save-dev electron electron-builder ts-node
npm install --save-dev concurrently wait-on cross-env
```

| Package | Role |
|---|---|
| `electron` | Desktop shell runtime |
| `electron-builder` | Packages into `.exe`, `.dmg`, `.AppImage` |
| `ts-node` | Run TypeScript Electron main without compiling first |
| `concurrently` | Run Next.js dev + Electron simultaneously in dev mode |
| `wait-on` | Electron main waits for Next.js server to be ready before opening window |
| `cross-env` | Cross-platform env variable setting in npm scripts |

---

## 5. Implementation Steps

### Step 1 — Update `next.config.ts`

Add `output: 'standalone'` so Next.js bundles its own server node runtime into `.next/standalone/`. This is what Electron will ship.

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'standalone',   // ← ADD THIS
  async headers() { ... },
  async redirects() { ... },
};
```

> **Why standalone?** The standalone output copies only the exact node_modules needed by the Next.js server into `.next/standalone/node_modules`. This eliminates shipping the full 300MB `node_modules` in the packaged app.

---

### Step 2 — Create `electron/main.ts`

This is the Electron entry point. It:
1. Spawns the Next.js standalone server as a child process.
2. Waits for the server to respond on `localhost:3000`.
3. Opens a `BrowserWindow` loading that URL.
4. Handles app lifecycle (close, minimize to tray, etc.).

```typescript
// electron/main.ts
import { app, BrowserWindow, shell, Menu } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import waitOn from 'wait-on';

const PORT = 3000;
let nextServer: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const isDev = !app.isPackaged;

async function startNextServer() {
  if (isDev) {
    // In dev mode, assume `npm run dev` is already running
    return;
  }

  // In production, spawn the standalone server
  const serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js');
  
  nextServer = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'production',
      // Pass through required env vars (bundled at build time)
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    stdio: 'pipe',
  });

  nextServer.stdout?.on('data', (d) => console.log('[Next]', d.toString()));
  nextServer.stderr?.on('data', (d) => console.error('[Next ERR]', d.toString()));
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    title: 'Pixie',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,   // NEVER enable - security risk
    },
    // Frameless option (optional - matches Pixie's premium look)
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#F4F7F4', // --soft-sage to prevent white flash on load
  });

  // Wait for the Next.js server to be up before loading the URL
  await waitOn({ resources: [`http://localhost:${PORT}`], timeout: 30000 });
  
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Open external links in default browser, not in app
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(async () => {
  await startNextServer();
  await createWindow();
});

app.on('window-all-closed', () => {
  nextServer?.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Cleanup on quit
app.on('before-quit', () => {
  nextServer?.kill();
});
```

---

### Step 3 — Create `electron/preload.ts`

The preload script runs in a privileged context and safely bridges Electron APIs to the renderer (the Next.js React app). It exposes only what we explicitly allow.

```typescript
// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronPixie', {
  // Tells the renderer it's running inside Electron
  isDesktop: true,
  platform: process.platform,

  // Native save dialog (so users can save to a custom path instead of Downloads)
  showSaveDialog: (options: Electron.SaveDialogOptions) =>
    ipcRenderer.invoke('show-save-dialog', options),

  // Native open dialog (alternative to drag-and-drop)
  showOpenDialog: (options: Electron.OpenDialogOptions) =>
    ipcRenderer.invoke('show-open-dialog', options),

  // App version
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Online/Offline state (Electron has direct access to network state)
  onNetworkChange: (callback: (isOnline: boolean) => void) =>
    ipcRenderer.on('network-change', (_e, isOnline) => callback(isOnline)),
});
```

Then in `main.ts`, register the IPC handlers:
```typescript
import { ipcMain, dialog } from 'electron';

ipcMain.handle('show-save-dialog', (_e, options) => dialog.showSaveDialog(options));
ipcMain.handle('show-open-dialog', (_e, options) => dialog.showOpenDialog(options));
ipcMain.handle('get-version', () => app.getVersion());
```

On the React side, the window object now has `window.electronPixie` — you can check `window.electronPixie?.isDesktop` to know if running in Electron vs. web browser.

---

### Step 4 — Update `package.json` Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "postinstall": "node scripts/download-yt-dlp.mjs",

    "electron:dev": "concurrently --kill-others \"npm run dev\" \"wait-on http://localhost:3000 && cross-env NODE_ENV=development electron electron/main.ts\"",

    "electron:build": "next build && electron-builder build --config electron-builder.yml",
    "electron:build:win": "next build && electron-builder build --win --config electron-builder.yml",
    "electron:build:mac": "next build && electron-builder build --mac --config electron-builder.yml",
    "electron:build:linux": "next build && electron-builder build --linux --config electron-builder.yml"
  }
}
```

---

### Step 5 — Create `electron-builder.yml`

```yaml
# electron-builder.yml
appId: com.pixie.desktop
productName: Pixie
copyright: "© 2026 Pixie"

directories:
  output: dist-electron
  buildResources: public

# The main Electron entry point (compiled from electron/main.ts)
main: electron/main.js

files:
  - electron/**/*
  - public/**/*
  - ".next/standalone/**/*"
  - ".next/static/**/*"

# Copy Next.js output into the packaged app resources
extraResources:
  - from: ".next/standalone"
    to: "app/.next/standalone"
    filter: ["**/*"]
  - from: ".next/static"
    to: "app/.next/standalone/.next/static"
    filter: ["**/*"]
  - from: "public"
    to: "app/.next/standalone/public"
    filter: ["**/*"]
  - from: "bin"
    to: "app/bin"
    filter: ["**/*"]     # Bundles the yt-dlp binary for the downloader

win:
  target:
    - target: nsis       # Creates a standard Windows installer (.exe)
      arch: [x64]
  icon: public/favicon.ico

mac:
  target:
    - target: dmg
      arch: [x64, arm64] # Intel + Apple Silicon
  icon: public/apple-touch-icon.png
  category: public.app-category.productivity

linux:
  target:
    - target: AppImage
    - target: deb
  icon: public/favicon.ico
  category: Utility

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: public/favicon.ico
  uninstallerIcon: public/favicon.ico
```

---

## 6. Online vs Offline Feature Handling

This is the core design decision. Here is the strategy for every network-dependent feature:

### 6A. Fully Offline Tools (No Change Needed)
All 49 tools in Image / PDF / Video / Dev / Text categories work offline already. The WASM binaries load from the bundled static assets inside `.next/static`. No modifications needed.

### 6B. AI Semantic Router (`/api/ai/router`)

**Online:** Works exactly as in the web app — calls Gemini API.

**Offline Fallback Strategy:**
- The client checks `navigator.onLine` before submitting a prompt.
- If offline, show a toast: *"You're offline. AI routing is unavailable — browse tools manually below."*
- The tool grid and search bar are always visible and fully functional offline.
- No change to the API route needed. The client just gates the submit action.

Implementation: Add a small `useNetworkStatus` hook that wraps `navigator.onLine` and the `online`/`offline` window events. Display a banner when offline (this was already planned in TODO.md as **T-20**).

### 6C. YouTube Downloader (`/api/video/downloader`)

**Online:** Works exactly as in the web app — uses the resolver pool + yt-dlp binary.

**Desktop Advantage:** The yt-dlp binary is bundled directly inside the app (via `extraResources` in builder config), so it doesn't need to be downloaded at runtime.

**Offline:** Show a clear "Internet connection required for downloading" message. No other fallback possible for this tool by nature.

### 6D. Supabase Auth & Quota

**Online:** Works as normal — cookie-based auth via Next.js SSR routes.

**Offline Fallback:**
- If Supabase cannot be reached, the quota check in `/api/ai/router` will throw. Catch the error and return a graceful "offline" response.
- For the UI, the `useQuota` hook's fetch to `/api/user/quota` will fail — catch it and display `{ used: 0, limit: '∞ (offline mode)', isUnlimited: true }`.
- In offline mode, skip the quota gate and let users use the AI router if they have a cached valid session. This is a local app — trust is higher.

```typescript
// In /api/ai/router/route.ts — add a try/catch around the Supabase block:
try {
  // existing Supabase quota logic
} catch (supabaseErr) {
  console.warn('Supabase unreachable, proceeding without quota check (desktop offline mode)');
  // continue to Gemini call
}
```

### 6E. Lemon Squeezy / Billing

On desktop, the concept of a web-based billing subscription needs rethinking:
- **Option A (Simplest):** Keep Lemon Squeezy. Users click "Upgrade", which opens their default browser to the checkout URL via `shell.openExternal(url)`.
- **Option B (Long-term):** One-time purchase via Paddle or a license key system stored in Electron's `safeStorage`.

**Plan: Start with Option A.** No code changes needed — just ensure external URLs are handled via `shell.openExternal`.

---

## 7. COOP/COEP Headers — Critical Fix for Desktop

The `next.config.ts` currently sets `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` globally — required for `SharedArrayBuffer` (used by ffmpeg.wasm multithreading).

In Electron, when loading `http://localhost:3000` in the renderer, these headers **still apply and still work**. No change required. Electron's Chromium respects them correctly.

However, if you ever switch to `file://` protocol loading (static export), COOP/COEP won't work. **Stay with the localhost server approach.**

---

## 8. Native OS Integrations (Enhancements)

These are optional but make the app feel truly native:

### 8A. System Tray
```typescript
// electron/tray.ts
import { Tray, Menu, nativeImage } from 'electron';

export function createTray(mainWindow: BrowserWindow) {
  const icon = nativeImage.createFromPath(path.join(__dirname, '../public/favicon.ico'));
  const tray = new Tray(icon);
  
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Pixie', click: () => mainWindow.show() },
    { label: 'Quit', click: () => app.quit() },
  ]));
  
  tray.on('double-click', () => mainWindow.show());
}
```

### 8B. Native File Save Dialog
Instead of a browser `<a download>` trigger, use `dialog.showSaveDialog` for a native save experience. Call this from the renderer via the preload bridge `window.electronPixie.showSaveDialog(...)`.

### 8C. Auto-Updater
Use `electron-updater` (bundled with `electron-builder`) to automatically check for updates on launch and install them in the background.

```typescript
import { autoUpdater } from 'electron-updater';
autoUpdater.checkForUpdatesAndNotify();
```

---

## 9. Development Workflow

```bash
# Terminal 1: Start everything together
npm run electron:dev

# This runs:
# → next dev (localhost:3000)
# → waits for it to be ready
# → launches Electron loading localhost:3000
```

Hot-reloading works automatically — Next.js HMR runs, Electron just displays the updated page without requiring a restart.

---

## 10. Build & Release Workflow

```bash
# 1. Build Next.js standalone
npm run build

# 2. Package for the current platform
npm run electron:build

# Output in dist-electron/:
#   Pixie Setup 1.0.0.exe   (Windows)
#   Pixie-1.0.0.dmg         (macOS)
#   Pixie-1.0.0.AppImage    (Linux)
```

For CI/CD, GitHub Actions can be configured to build for all three platforms automatically on version tag pushes.

---

## 11. Implementation Order (Phased)

### Phase 1 — Working Prototype (1–2 days)
1. Install electron + electron-builder + concurrently + wait-on + ts-node
2. Create `electron/main.ts` with basic BrowserWindow loading localhost:3000
3. Create `electron/preload.ts` with `isDesktop` flag
4. Update `package.json` scripts
5. Add `output: 'standalone'` to `next.config.ts`
6. Run `npm run electron:dev` — full app in a desktop window

### Phase 2 — Offline Resilience (1 day)
7. Add `useNetworkStatus` hook
8. Gate AI router submit button with online check (show friendly offline message)
9. Catch Supabase errors in API routes gracefully
10. Handle quota fetch failures in `useQuota.ts`

### Phase 3 — Packaging (1 day)
11. Create `electron-builder.yml`
12. Compile TypeScript electron files
13. Run `npm run electron:build:win` — test the installer
14. Bundle yt-dlp binary correctly via `extraResources`

### Phase 4 — Native Polish (optional, 1 day)
15. Add system tray (`electron/tray.ts`)
16. Native save dialogs for tool downloads
17. Auto-updater integration
18. App icon set (all sizes for all platforms)

---

## 12. Estimated Final App Size

| Component | Size |
|---|---|
| Electron runtime | ~80 MB |
| Chromium | ~120 MB |
| Next.js standalone bundle | ~15 MB |
| WASM binaries (ffmpeg, bg-removal) | ~35 MB (loaded lazily from CDN or bundled) |
| yt-dlp binary | ~12 MB |
| **Total installed size** | **~260–280 MB** |

This is normal and expected for an Electron app. Comparable to VS Code (~350 MB) or Figma (~250 MB).

---

## 13. Key Decisions Summary

| Decision | Choice | Reason |
|---|---|---|
| Integration pattern | localhost server | Reuses all Next.js routes & APIs unchanged |
| Next.js output | `standalone` | Self-contained server, no full node_modules needed |
| WASM multithreading | Keep COOP/COEP headers | ffmpeg.wasm requires SharedArrayBuffer |
| Auth offline | Graceful skip quota | Trust desktop users more; no server to exploit |
| AI offline | Block with message | Can't run Gemini locally (model too large) |
| YouTube offline | Block with message | Requires network by nature |
| Billing | `shell.openExternal` | No checkout UI changes needed |
| Distribution | electron-builder | Industry standard, supports all platforms |
| Updates | electron-updater | Auto-update via GitHub Releases |
