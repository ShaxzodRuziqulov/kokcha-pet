// Renderer'ga faqat kerakli funksiyalarni ochib beramiz (xavfsiz ko'prik)
const { contextBridge, ipcRenderer } = require('electron');

const EVENTS = [
  'state', 'woke', 'welcome', 'say', 'hover', 'ghost', 'look', 'clicked', 'landed', 'petted', 'settings',
  'appearance', 'bubble-shift', 'update', 'mood', 'remind', 'persona', 'activity',
];

contextBridge.exposeInMainWorld('pet', {
  getInit: () => ipcRenderer.invoke('get-init'),
  dragStart: () => ipcRenderer.send('drag-start'),
  dragMove: () => ipcRenderer.send('drag-move'),
  dragEnd: () => ipcRenderer.send('drag-end'),
  click: () => ipcRenderer.send('pet-click'),
  menu: () => ipcRenderer.send('pet-menu'),
  dance: () => ipcRenderer.send('pet-dance'),
  busy: (ms) => ipcRenderer.send('pet-busy', Number(ms)),
  // Gap bulutchasidagi tugmalar: joyi (CSS px, oyna ichida yoki null) va bosilgan tugma
  hitArea: (rect) => ipcRenderer.send('hit-area', rect),
  action: (id) => ipcRenderer.send('bubble-action', id),
  on: (event, cb) => {
    if (EVENTS.includes(event)) ipcRenderer.on(event, (_e, data) => cb(data));
  },
});
