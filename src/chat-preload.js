const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('chat', {
  state: () => ipcRenderer.invoke('chat:state'),
  setKey: key => ipcRenderer.invoke('chat:set-key', key),
  clearKey: () => ipcRenderer.invoke('chat:clear-key'),
  ask: text => ipcRenderer.invoke('chat:ask', text),
  reset: () => ipcRenderer.invoke('chat:reset'),
  openStudio: () => ipcRenderer.invoke('chat:open-studio'),
});
