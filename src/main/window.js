// Personaj oynasi: yaratish, ko'rinish/yashirish, o'lcham, ekranga qaytarish

const { BrowserWindow, screen } = require('electron');
const path = require('path');
const C = require('./context');
const settings = require('./settings');
const menu = require('./menu');
const motion = require('./motion');

const { ctx } = C;

function startPosition() {
  const saved = ctx.settings.position;
  const wa = saved
    ? C.workAreaAt(saved.x + C.winW() / 2, saved.y + C.winH() / 2)
    : screen.getPrimaryDisplay().workArea;
  const x = saved ? C.clampX(saved.x, wa) : wa.x + wa.width - C.winW() - 60;
  return { x, y: C.groundY(wa) }; // taskbar ustida turadi
}

function create() {
  const { x, y } = startPosition();

  const win = new BrowserWindow({
    width: C.winW(),
    height: C.winH(),
    x,
    y,
    show: false,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      zoomFactor: C.scale(),
    },
  });
  ctx.win = win;

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  // Shaffof joylar sichqonchani o'tkazib yuboradi; personaj ustida esa ushlaydi (activity.trackCursor)
  win.setIgnoreMouseEvents(true);
  win.once('ready-to-show', () => win.showInactive()); // fokusni o'g'irlamaydi
  win.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  return win;
}

function updateVisibility() {
  if (!C.alive()) return;
  const shouldShow = !ctx.userHidden && !ctx.fullscreenHidden;
  if (shouldShow && !ctx.win.isVisible()) {
    ctx.win.showInactive();
    ctx.win.setAlwaysOnTop(true, 'screen-saver');
  } else if (!shouldShow && ctx.win.isVisible()) {
    if (ctx.motion && ctx.motion !== 'walk') snapToGround(); // havoda yoki devorda qolmasin
    motion.stopMotion();
    ctx.win.hide();
  }
  menu.refreshTray();
}

function setUserHidden(hidden) {
  ctx.userHidden = hidden;
  updateVisibility();
}

// Monitor uzilsa yoki taskbar joyi o'zgarsa — ko'rinadigan joyga, "yerga" qaytaradi
function snapToGround() {
  if (!C.alive() || ctx.dragging) return;
  motion.stopMotion();
  ctx.perch = null;
  motion.setPose('stand');
  const [x] = ctx.win.getPosition();
  const wa = C.currentWorkArea();
  C.placeAt(C.clampX(x, wa), C.groundY(wa));
  C.rememberPosition();
}

function setSize(size) {
  if (!C.alive() || size === ctx.settings.size) return;
  if (ctx.motion && ctx.motion !== 'walk') return; // havoda yoki devorda — keyinroq
  motion.stopMotion();
  if (ctx.pose === 'ledge') motion.setPose('stand');
  const [x, y] = ctx.win.getPosition();
  const oldW = C.winW();
  const oldH = C.winH();
  const wa = C.currentWorkArea();

  ctx.settings.size = size;
  settings.save();
  ctx.win.webContents.setZoomFactor(C.scale());
  // Oyoqlari turgan joyda qoladi (yerda yoki oyna ustida)
  const nx = C.clampX(x + (oldW - C.winW()) / 2, wa);
  C.placeAt(nx, ctx.perch ? ctx.perch.y - C.winH() : Math.min(y + oldH - C.winH(), C.groundY(wa)));
  C.rememberPosition();
  menu.refreshTray();
}

Object.assign(module.exports, { create, updateVisibility, setUserHidden, snapToGround, setSize });
