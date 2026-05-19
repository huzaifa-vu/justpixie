import { app, BrowserWindow, shell, ipcMain, dialog } from 'electron';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';

let PORT = 3000;
let nextServer: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let logStream: fs.WriteStream | null = null;

const isDev = process.env.NODE_ENV === 'development';
const isDebug = process.argv.includes('--debug');

// Setup file logging to userData directory
function setupLogging() {
  try {
    const userDataPath = app.getPath('userData');
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    const logPath = path.join(userDataPath, 'pixie-app.log');
    logStream = fs.createWriteStream(logPath, { flags: 'a' });
    writeLog('=== App Started ===');
    writeLog('Node Version:', process.version);
    writeLog('Platform:', process.platform);
    writeLog('UserData Path:', userDataPath);
  } catch (e) {
    console.error('Failed to setup file logging:', e);
  }
}

function writeLog(...args: any[]) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  console.log(msg);
  if (logStream) {
    logStream.write(line);
  }
}

async function checkPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(500);
    
    socket.once('connect', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    
    socket.once('error', () => {
      socket.destroy();
      
      const server = net.createServer();
      server.once('error', () => {
        resolve(false);
      });
      server.once('listening', () => {
        server.close(() => {
          resolve(true);
        });
      });
      server.listen(port, '127.0.0.1');
    });
    
    socket.connect(port, '127.0.0.1');
  });
}

async function getAvailablePort(startPort: number = 3000): Promise<number> {
  let port = startPort;
  while (true) {
    if (await checkPortFree(port)) {
      return port;
    }
    port++;
    if (port > 65535) {
      throw new Error('No available ports found');
    }
  }
}

async function waitForServer(url: string, timeoutMs: number = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch (e) {
      // server not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function startNextServer() {
  if (isDev) {
    writeLog('Running in development mode, assuming external server runs on port', PORT);
    return;
  }

  const serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js');
  writeLog('Spawning Next.js standalone server at:', serverPath);
  writeLog('Using port:', PORT);

  nextServer = spawn('node', [serverPath], {
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'production',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    },
    stdio: 'pipe',
  });

  nextServer.stdout?.on('data', (d) => writeLog('[Next stdout]', d.toString().trim()));
  nextServer.stderr?.on('data', (d) => writeLog('[Next stderr]', d.toString().trim()));

  nextServer.on('error', (err) => {
    writeLog('[Next Error Event]', err);
  });

  nextServer.on('exit', (code, signal) => {
    writeLog(`[Next Exit Event] Code: ${code}, Signal: ${signal}`);
  });
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
    backgroundColor: '#F4F7F4',
  });

  writeLog(`Waiting for Next.js server to respond at http://localhost:${PORT}...`);
  try {
    await waitForServer(`http://localhost:${PORT}`, 30000);
    writeLog(`Next.js server is ready. Loading URL...`);
  } catch (e: any) {
    writeLog(`Error waiting for server: ${e.message}`);
  }

  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(`http://localhost:${PORT}`)) {
      writeLog(`Opening external link: ${url}`);
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  if (isDev || isDebug) {
    writeLog('Opening Developer Tools...');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

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

function cleanupChildProcess() {
  if (nextServer) {
    writeLog('Terminating Next.js child process...');
    nextServer.kill('SIGTERM');
    nextServer = null;
  }
}

app.whenReady().then(async () => {
  setupLogging();

  if (!isDev) {
    try {
      PORT = await getAvailablePort(3000);
      writeLog(`Dynamically resolved port: ${PORT}`);
    } catch (e: any) {
      writeLog(`Error finding port, using default 3000: ${e.message}`);
    }
  }

  await startNextServer();
  await createWindow();

  if (mainWindow) {
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
      item.on('updated', (event, state) => {
        if (state === 'interrupted') {
          webContents.send('download-complete', 'interrupted');
        } else if (state === 'progressing' && !item.isPaused()) {
          webContents.send('download-progress', {
            received: item.getReceivedBytes(),
            total: item.getTotalBytes(),
            percent: item.getTotalBytes() ? item.getReceivedBytes() / item.getTotalBytes() : 0
          });
        }
      });

      item.once('done', (event, state) => {
        webContents.send('download-complete', state);
      });
    });
  }
});

app.on('window-all-closed', () => {
  cleanupChildProcess();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on('before-quit', () => {
  cleanupChildProcess();
});

process.on('exit', () => {
  cleanupChildProcess();
});

process.on('SIGINT', () => {
  cleanupChildProcess();
  app.quit();
});

process.on('SIGTERM', () => {
  cleanupChildProcess();
  app.quit();
});

