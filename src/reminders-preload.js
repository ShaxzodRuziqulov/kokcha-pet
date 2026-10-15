const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('reminders', {
  list: () => ipcRenderer.invoke('reminders:list'),
  add: input => ipcRenderer.invoke('reminders:add', input),
  remove: id => ipcRenderer.invoke('reminders:remove', id),
  onChanged: callback => ipcRenderer.on('reminders:changed', () => callback()),
});
