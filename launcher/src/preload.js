'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('valley', {
  init: () => ipcRenderer.invoke('init'),
  status: () => ipcRenderer.invoke('status'),
  play: () => ipcRenderer.invoke('play'),
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  openDownloads: () => ipcRenderer.invoke('open-downloads'),
  cancelManual: () => ipcRenderer.invoke('cancel-manual'),
  openPrism: () => ipcRenderer.invoke('open-prism'),
  openLogs: () => ipcRenderer.invoke('open-logs'),
  minimize: () => ipcRenderer.send('win-minimize'),
  close: () => ipcRenderer.send('win-close'),
  onProgress: (cb) => ipcRenderer.on('progress', (_e, p) => cb(p)),
  onManual: (cb) => ipcRenderer.on('manual', (_e, p) => cb(p)),
  onLaunched: (cb) => ipcRenderer.on('launched', (_e, p) => cb(p)),
});
