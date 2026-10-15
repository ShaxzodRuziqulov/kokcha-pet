// Bir martalik eslatmalar: vaqtlar epoch ms, ma'lumot settings.json'da saqlanadi.
const { app, BrowserWindow, ipcMain, powerMonitor } = require('electron');
const { randomUUID } = require('crypto');
const path = require('path');
const C = require('./context');
const settings = require('./settings');
let editor = null, timer = null, running = false, nextDelivery = 0;
const MAX_PENDING = 50;

function normalize(value) {
  const ids = new Set();
  if (!Array.isArray(value)) return [];
  return value.filter(item => {
    if (!item || typeof item.id !== 'string' || item.id.length > 64 || !item.id || ids.has(item.id) ||
        typeof item.text !== 'string' || !item.text.trim() || item.text.length > 200 ||
        !Number.isSafeInteger(item.dueAt) || item.dueAt <= 0 || item.dueAt > 8640000000000000) return false;
    ids.add(item.id); return true;
  }).slice(-100).map(item => ({ id: item.id, text: item.text.trim(), dueAt: item.dueAt,
    ...(Number.isSafeInteger(item.deliveredAt) && item.deliveredAt > 0 ? { deliveredAt: item.deliveredAt } : {}) }));
}

const list = () => C.ctx.settings.reminders || [];
const pendingCount = () => list().filter(item => !item.deliveredAt).length;
function changed() {
  if (!settings.save(true)) return false;
  require('./menu').refreshTray();
  if (editor && !editor.isDestroyed()) editor.webContents.send('reminders:changed');
  return true;
}

function tick() {
  clearTimeout(timer); timer = null;
  if (!running) return;
  const now = Date.now();
  const pending = list().filter(item => !item.deliveredAt).sort((a, b) => a.dueAt - b.dueAt);
  if (!pending.length) return;
  const ready = C.alive() && C.ctx.win.isVisible() && !C.ctx.userHidden && !C.ctx.fullscreenHidden &&
    !C.ctx.win.webContents.isLoadingMainFrame();
  if (pending[0].dueAt <= now && now >= nextDelivery && ready) {
    const item = pending[0];
    item.deliveredAt = now;
    nextDelivery = now + 20000; // pufakchalar bir-birini bosib ketmasin
    if (changed()) C.send('remind', { text: item.text });
    else delete item.deliveredAt;
  }
  const next = list().filter(item => !item.deliveredAt).reduce((n, item) => Math.min(n, item.dueAt), Infinity);
  if (Number.isFinite(next)) {
    const delay = next <= now && !ready ? 1000 : Math.max(250, next - now, nextDelivery - now);
    timer = setTimeout(tick, Math.min(delay, 2147483647));
  }
}

function add(input) {
  const text = typeof input?.text === 'string' ? input.text.trim() : '';
  const dueAt = input?.dueAt;
  if (!text || text.length > 200) return { error: 'Matn 1–200 belgidan iborat boʻlsin.' };
  if (!Number.isSafeInteger(dueAt) || dueAt <= Date.now() || dueAt > 8640000000000000) return { error: 'Kelajakdagi vaqtni tanlang.' };
  if (pendingCount() >= MAX_PENDING) return { error: 'Avval mavjud eslatmalardan birini oʻchiring (eng koʻpi 50 ta).' };
  // Yetkazilgan eski yozuvlar oxirgi 50 ta bilan cheklanadi; faol yozuvlar yo'qolmaydi.
  const before = list();
  C.ctx.settings.reminders = [...list().filter(item => item.deliveredAt).slice(-49),
    ...list().filter(item => !item.deliveredAt), { id: randomUUID(), text, dueAt }];
  if (!changed()) { C.ctx.settings.reminders = before; return { error: 'Saqlab boʻlmadi. Diskdagi boʻsh joyni tekshiring.' }; }
  tick(); return { ok: true };
}

function remove(id) {
  if (typeof id !== 'string') return { error: 'Eslatma topilmadi.' };
  const before = list();
  C.ctx.settings.reminders = before.filter(item => item.id !== id);
  if (list().length === before.length) return { error: 'Eslatma topilmadi.' };
  if (!changed()) { C.ctx.settings.reminders = before; return { error: 'Oʻchirib boʻlmadi. Diskdagi boʻsh joyni tekshiring.' }; }
  tick(); return { ok: true };
}

function open() {
  if (editor && !editor.isDestroyed()) { editor.show(); editor.focus(); return; }
  editor = new BrowserWindow({ width: 540, height: 620, minWidth: 420, minHeight: 420,
    title: 'Eslatmalar', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, '..', 'reminders-preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true } });
  editor.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  editor.webContents.on('will-navigate', event => event.preventDefault());
  editor.once('ready-to-show', () => { if (editor && !editor.isDestroyed()) editor.show(); });
  editor.on('closed', () => { editor = null; });
  editor.loadFile(path.join(__dirname, '..', 'renderer', 'reminders.html'));
}

function start() {
  if (running) return;
  running = true;
  // Faqat shu oynaning o'z preload'i ushbu kanallardan foydalanishi mumkin.
  for (const [channel, handler] of Object.entries({ list: () => list(), add, remove })) {
    ipcMain.handle(`reminders:${channel}`, (event, input) => {
      if (!editor || editor.isDestroyed() || event.sender !== editor.webContents ||
          event.senderFrame !== editor.webContents.mainFrame) throw new Error('Eslatmalar oynasi talab qilinadi.');
      return handler(input);
    });
  }
  powerMonitor.on('resume', tick);
  app.on('before-quit', stop);
  tick();
}

function stop() {
  running = false; clearTimeout(timer); timer = null;
  powerMonitor.removeListener('resume', tick);
}

Object.assign(module.exports, { normalize, pendingCount, add, remove, open, start, stop });
