// O'ng tugma paneli uchun ko'prik: faqat ro'yxatni olish, bandni bosish, yopish va balandlikni aytish
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('panel', {
  onModel: (cb) => ipcRenderer.on('panel:model', (_e, model) => cb(model)),
  act: (id, label) => ipcRenderer.send('panel:act', String(id), String(label)),
  close: () => ipcRenderer.send('panel:close'),
  height: (h) => ipcRenderer.send('panel:height', Number(h)),
});
