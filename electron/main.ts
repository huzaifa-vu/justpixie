import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import waitOn from 'wait-on';

const PORT = 3000;
let nextServer: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';

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
      // Pass client environment parameters
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
      nodeIntegration: false,
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    backgroundColor: '#F4F7F4', // Soft-sage background token to avoid white flash
  });

  // Wait for the local Next.js server port to respond
  await waitOn({ resources: [`http://localhost:${PORT}`], timeout: 30000 });
  
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Route any external links to standard desktop browser
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

// Native Dialogue Intercepts
ipcMain.handle('show-save-dialog', async (_e, options) => {
  if (!mainWindow) return null;
  return await dialog.showSaveDialog(mainWindow, options);
});

ipcMain.handle('show-open-dialog', async (_e, options) => {
  if (!mainWindow) return null;
  return await dialog.showOpenDialog(mainWindow, options);
});

ipcMain.handle('get-version', () => app.getVersion());

ipcMain.on('open-external', (_e, url) => {
  shell.openExternal(url);
});

ipcMain.on('download-url', (_e, url) => {
  if (mainWindow) {
    mainWindow.webContents.downloadURL(url);
  }
});

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

app.on('before-quit', () => {
  nextServer?.kill();
});
