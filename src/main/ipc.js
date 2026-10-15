// Renderer bilan aloqa: bosish, sudrash, menyu, raqs

const { ipcMain, screen } = require('electron');
const C = require('./context');
const settings = require('./settings');
const appearance = require('./appearance');
const menu = require('./menu');
const motion = require('./motion');
const activity = require('./activity');

const { ctx } = C;
const DANCE_MS = 1800;

let dragFrom = null;

function register() {
  ipcMain.handle('get-init', () => {
    const firstRun = !ctx.settings.onboarded;
    if (firstRun) {
      ctx.settings.onboarded = true;
      settings.save();
    }
    return { ...appearance.current(), quiet: ctx.settings.quiet, firstRun };
  });

  ipcMain.on('pet-menu', () => menu.popup());

  ipcMain.on('pet-click', () => {
    if (ctx.state === 'sleep') activity.wakeUp('click');
    else C.send('clicked');
  });

  ipcMain.on('pet-dance', () => {
    ctx.danceUntil = Date.now() + DANCE_MS;
    motion.stopWalk();
    if (ctx.pose === 'sit' || ctx.pose === 'lie') motion.setPose('stand');
  });

  ipcMain.on('drag-start', () => {
    if (!C.alive()) return;
    ctx.dragging = true;
    motion.stopMotion();
    ctx.perch = null;
    motion.setPose('stand');
    const c = screen.getCursorScreenPoint();
    const [x, y] = ctx.win.getPosition();
    dragFrom = { cx: c.x, cy: c.y, x, y };
    motion.beginDrag(c);
    if (ctx.state === 'sleep') activity.wakeUp('drag');
  });

  ipcMain.on('drag-move', () => {
    if (!C.alive() || !ctx.dragging || !dragFrom) return;
    const c = screen.getCursorScreenPoint();
    motion.sampleDrag(c);
    C.placeAt(dragFrom.x + c.x - dragFrom.cx, dragFrom.y + c.y - dragFrom.cy);
  });

  // Qo'yib yuborilganda pastga tushadi — ostida oyna bo'lsa, o'sha oyna ustiga
  ipcMain.on('drag-end', () => {
    if (!ctx.dragging || !dragFrom) return;
    ctx.dragging = false;
    dragFrom = null;
    motion.finishDrag(screen.getCursorScreenPoint());
    motion.fall();
  });
}

Object.assign(module.exports, { register });
