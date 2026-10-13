// Renderer'ga faqat kerakli funksiyalarni ochib beramiz (xavfsiz ko'prik)
const { contextBridge, ipcRenderer } = require('electron');

const EVENTS = [
  'state', 'woke', 'welcome', 'say', 'hover', 'ghost', 'look', 'clicked', 'landed', 'petted', 'settings',
  'appearance', 'bubble-shift',
];

contextBridge.exposeInMainWorld('pet', {
  getInit: () => ipcRenderer.invoke('get-init'),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragMove: () => ipcRenderer.send('drag-move'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  click: () => ipcRenderer.send('pet-click'),
  menu: () => ipcRenderer.send('pet-menu'),
  dance: () => ipcRenderer.send('pet-dance'),
  on: (event, cb) => {
    if (EVENTS.includes(event)) ipcRenderer.on(event, (_e, data) => cb(data));
  },
});
