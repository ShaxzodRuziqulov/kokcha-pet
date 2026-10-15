// Global yorliq: ko'rinishni mavjud window moduli orqali boshqaradi.
const { globalShortcut } = require('electron');
const C = require('./context');
const win = require('./window');

const ACCELERATOR = 'Control+Alt+M';
let registered = false;

function toggleVisibility() {
  if (C.alive()) win.setUserHidden(C.ctx.win.isVisible());
}

function register() {
  if (registered) return;
  try {
    registered = globalShortcut.register(ACCELERATOR, toggleVisibility);
  } catch {
    registered = false;
  }
  require('./menu').refreshTray();
}

function unregister() {
  if (registered) globalShortcut.unregister(ACCELERATOR);
  registered = false;
}

function menuItems() {
  return [
    {
      label: C.alive() && C.ctx.win.isVisible() ? 'Yashirish' : "Koʻrsatish",
      ...(registered ? { accelerator: 'Ctrl+Alt+M', registerAccelerator: false } : {}),
      click: toggleVisibility,
    },
    ...(!registered ? [{ label: 'Ctrl+Alt+M band yoki mavjud emas', enabled: false }] : []),
  ];
}

Object.assign(module.exports, { register, unregister, menuItems });
