import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronPixie', {
  isDesktop: true,
  platform: process.platform,

  showSaveDialog: (options: any) =>
    ipcRenderer.invoke('show-save-dialog', options),

  showOpenDialog: (options: any) =>
    ipcRenderer.invoke('show-open-dialog', options),

  getVersion: () => ipcRenderer.invoke('get-version'),

  openExternal: (url: string) => {
    // Let client trigger openExternal explicitly if needed
    // Otherwise the setWindowOpenHandler in main.ts catches target="_blank" redirects.
    return ipcRenderer.send('open-external', url);
  },

  downloadURL: (url: string) => {
    ipcRenderer.send('download-url', url);
  }
});
