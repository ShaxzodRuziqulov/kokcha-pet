// O'ng tugma paneli: personaj ustida o'ng tugma bosilganda Windows menyusi o'rniga chiqadigan panelcha.
// Bandlar menu.js dagi bitta ro'yxatdan (template) olinadi — tray menyusi bilan mantiq bir xil.
// Panel faqat id (ro'yxatdagi yo'l) va yorliqni qaytaradi; amal main'da qayta qurilgan ro'yxatdan topiladi.

const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const C = require('./context');

const { ctx } = C;
const WIDTH = 272;
const MAX_HEIGHT = 620;
let panel = null;
let shownAt = 0;

// label — moslik tekshiruvi uchun asl yorliq; text — panelda ko'rinadigani (panelLabel bo'lsa qisqasi)
function serialize(items, prefix = []) {
  return items.map((item, i) => {
    const id = [...prefix, i].join('.');
    if (item.type === 'separator') return { id, type: 'separator' };
    if (item.panelHide) return null;
    return {
      id,
      type: item.type || (item.submenu ? 'submenu' : 'normal'),
      label: item.label,
      text: item.panelLabel || item.label,
      checked: !!item.checked,
      enabled: item.enabled !== false,
      icon: item.panelIcon || null,
      kind: item.panelKind || null,
      submenu: item.submenu ? serialize(item.submenu, [...prefix, i]) : undefined,
    };
  }).filter(Boolean);
}

// Sarlavhadagi kichik rasm: Midori — o'z kadri, "O'z rasmim" — o'sha rasm, Ko'kcha — nihol
function avatar(a) {
  if (ctx.settings.character === 'chibi-girl') return { src: 'chibi/frames/stand.png', top: true };
  if (ctx.settings.character === 'custom' && a.sprites?.idle) return { src: a.sprites.idle };
  return { emoji: '🌱' };
}

function model() {
  const menu = require('./menu');
  const appearance = require('./appearance');
  const persona = require('./persona');
  const a = appearance.current();
  const isMidori = ctx.settings.character === 'chibi-girl';
  return {
    header: {
      name: a.name,
      mood: isMidori ? persona.LABELS[persona.current().id] : null,
      state: ctx.state === 'sleep' ? 'Uxlayapti' : ctx.userHidden ? 'Yashiringan' : null,
      version: app.getVersion(),
      avatar: avatar(a),
    },
    items: serialize(menu.template({ forPanel: true })),
  };
}

function find(items, id) {
  let node = null, list = items;
  for (const part of id.split('.')) {
    node = list?.[Number(part)];
    list = node?.submenu;
  }
  return node;
}

function act(id, label) {
  if (typeof id !== 'string' || !/^\d+(\.\d+)*$/.test(id)) return;
  const item = find(require('./menu').template({ forPanel: true }), id);
  // Ro'yxat o'zgargan bo'lsa (masalan, tepaga yangilanish bandi qo'shildi) — boshqa bandni bosib yubormaymiz
  if (!item || item.label !== label || item.enabled === false || !item.click) return refresh();
  const keepOpen = item.type === 'checkbox' || item.type === 'radio';
  if (!keepOpen) hide();
  item.click({ checked: item.type === 'checkbox' ? !item.checked : true });
  if (keepOpen) setTimeout(refresh, 30);
}

function refresh() {
  if (panel && !panel.isDestroyed() && panel.isVisible()) panel.webContents.send('panel:model', model());
}

function hide() {
  if (panel && !panel.isDestroyed() && panel.isVisible()) panel.hide();
}

// Personaj yonida, ekran ichida
function place(height) {
  const r = C.petRect();
  const wa = C.workAreaAt(r.x + r.w / 2, r.y + r.h / 2);
  const h = Math.min(height, MAX_HEIGHT, wa.height - 16);
  let x = r.x + r.w - 10;
  if (x + WIDTH > wa.x + wa.width - 8) x = r.x - WIDTH + 10;
  x = Math.min(Math.max(x, wa.x + 8), wa.x + wa.width - WIDTH - 8);
  const y = Math.min(Math.max(r.y + r.h - h, wa.y + 8), wa.y + wa.height - h - 8);
  panel.setBounds({ x: Math.round(x), y: Math.round(y), width: WIDTH, height: Math.round(h) });
}

function create() {
  panel = new BrowserWindow({
    width: WIDTH, height: 400, show: false, frame: false, transparent: true, resizable: false,
    skipTaskbar: true, alwaysOnTop: true, hasShadow: false, fullscreenable: false, minimizable: false,
    maximizable: false,
    webPreferences: { preload: path.join(__dirname, '..', 'panel-preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  panel.setAlwaysOnTop(true, 'screen-saver');
  panel.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  panel.webContents.on('will-navigate', (e) => e.preventDefault());
  // Tashqariga bosilsa — yopiladi (ochilgan zahoti kelgan blur'ni hisobga olmaymiz)
  panel.on('blur', () => { if (Date.now() - shownAt > 150) hide(); });
  panel.on('closed', () => { panel = null; });
  panel.loadFile(path.join(__dirname, '..', 'renderer', 'panel.html'));
}

function show() {
  if (!C.alive()) return;
  if (!panel || panel.isDestroyed()) create();
  const open = () => {
    panel.webContents.send('panel:model', model());
    place(420);
    shownAt = Date.now();
    panel.show();
    panel.focus();
  };
  if (panel.webContents.isLoadingMainFrame()) panel.webContents.once('did-finish-load', open);
  else open();
}

const fromPanel = (event) => panel && !panel.isDestroyed() && event.sender === panel.webContents;

function register() {
  ipcMain.on('panel:act', (event, id, label) => { if (fromPanel(event)) act(id, label); });
  ipcMain.on('panel:close', (event) => { if (fromPanel(event)) hide(); });
  // Panel o'z balandligini aytadi — oyna shunga moslanadi
  ipcMain.on('panel:height', (event, h) => {
    if (fromPanel(event) && Number.isFinite(h) && h > 40 && h < 2000) place(Math.ceil(h));
  });
}

Object.assign(module.exports, { register, show, hide, refresh });
