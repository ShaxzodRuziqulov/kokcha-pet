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

// Gap bulutchasidagi tugmalar — faqat shu ro'yxatdagilar (renderer ixtiyoriy buyruq bera olmaydi)
const BUBBLE_ACTIONS = {
  'update-install': () => require('./updater').install(),
};

let dragFrom = null;

function register() {
  ipcMain.handle('get-init', () => {
    const firstRun = !ctx.settings.onboarded;
    if (firstRun) {
      ctx.settings.onboarded = true;
      settings.save();
    }
    return { ...appearance.current(), quiet: ctx.settings.quiet, firstRun,
      persona: require('./persona').initial() };
  });

  ipcMain.on('pet-menu', () => menu.popup());

  // Gap bulutchasidagi tugmalar. Joy CSS px'da saqlanadi — DIP'ga tekshiruv paytida joriy
  // scale bilan aylantiriladi (o'lcham almashsa ham to'g'ri qoladi; Codex review P2).
  ipcMain.on('hit-area', (_e, rect) => {
    const ok = rect && ['x', 'y', 'w', 'h'].every((k) => Number.isFinite(rect[k]) && Math.abs(rect[k]) < 5000);
    ctx.hitArea = ok ? { x: rect.x, y: rect.y, w: rect.w, h: rect.h } : null;
  });
  ipcMain.on('bubble-action', (_e, id) => {
    // Faqat ro'yxatning o'z funksiyalari ('__proto__' kabi meros kalitlar emas; Codex review P3)
    if (typeof id === 'string' && Object.hasOwn(BUBBLE_ACTIONS, id) && typeof BUBBLE_ACTIONS[id] === 'function') BUBBLE_ACTIONS[id]();
  });

  ipcMain.on('pet-click', () => {
    if (ctx.state === 'sleep') activity.wakeUp('click');
    else C.send('clicked');
  });

  ipcMain.on('pet-dance', () => {
    ctx.danceUntil = Date.now() + DANCE_MS;
    motion.stopWalk();
    if (ctx.pose === 'sit' || ctx.pose === 'lie') motion.setPose('stand');
  });

  // Midori mashg'ulot qilyapti (kitob, choy...): shu vaqt ichida yurish boshlanmaydi; o'tirgan bo'lsa — turadi
  ipcMain.on('pet-busy', (_e, ms) => {
    if (!Number.isFinite(ms) || ms <= 0 || ctx.dragging || ctx.state === 'sleep' || ctx.motion === 'fall' ||
        ctx.motion === 'jump' || ctx.motion === 'climb' || ctx.pose === 'ledge' || ctx.pose === 'hang') return;
    ctx.danceUntil = Math.max(ctx.danceUntil, Date.now() + Math.min(ms, 5000));
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
