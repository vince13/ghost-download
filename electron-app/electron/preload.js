const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  getAudioDevices: () => ipcRenderer.invoke('get-audio-devices'),
  setAudioOutput: (deviceId) => ipcRenderer.invoke('set-audio-output', deviceId),
  platform: process.platform,
  // HUD window controls
  closeHud: () => ipcRenderer.send('close-hud-window'),
  minimizeHud: () => ipcRenderer.send('minimize-hud-window')
});

