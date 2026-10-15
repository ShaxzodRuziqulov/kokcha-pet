// Umumiy holat va yordamchi funksiyalar. Barcha modullar shu yerdagi `ctx` orqali bog'lanadi.
//
// Modullar bir-birini chaqiradi (masalan, motion → menu). Aylanma bog'liqlik muammo bo'lmasligi
// uchun modullar `Object.assign(module.exports, ...)` bilan eksport qiladi va boshqa modul
// funksiyalarini faqat chaqiruv paytida oladi (`motion.fall()`), yuklanish paytida emas.

const { screen } = require('electron');

const BASE_W = 240;     // oyna o'lchami (o'rta o'lchamda)
const BASE_H = 280;
const PET_SIZE = 150;   // personaj qutisi — oynaning pastki o'rtasida
const petSize = () => ctx.settings.character === 'chibi-girl' ? 180 : PET_SIZE;
const SIZES = { small: 0.75, medium: 1, large: 1.3 };

const ctx = {
  win: null,
  tray: null,
  settings: {},
  state: 'idle',        // idle | walk | sleep
  pose: 'stand',        // stand | sit | ledge | lie | climb | hang | jump | fall
  side: null,           // climb/hang: qaysi devorda (left | right)
  walkDir: 1,
  motion: null,         // walk | fall | jump | climb | hang — bir vaqtda faqat bittasi
  perch: null,          // oyna ustida bo'lsa: { hwnd, x1, x2, y, left }, yerda — null
  manualSleep: false,   // foydalanuvchi o'zi uxlatganmi
  dragging: false,
  hovering: false,      // kursor personaj ustida
  danceUntil: 0,
  userHidden: false,    // menyu orqali yashirilgan
  fullscreenHidden: false, // boshqa dastur to'liq ekranda
  hitArea: null,        // tugmali gap bulutchasi: { x, y, w, h } oyna ichida (DIP) — shu joy ham bosiladi
};

let bubbleShift = 0;

const alive = () => !!ctx.win && !ctx.win.isDestroyed();

function send(channel, payload) {
  if (alive()) ctx.win.webContents.send(channel, payload);
}

function sendState() {
  send('state', { state: ctx.state, dir: ctx.walkDir, pose: ctx.pose, side: ctx.side });
}

function setState(next) {
  ctx.state = next;
  sendState();
  require('./menu').refreshTray();
}

// ---- Geometriya ----
const scale = () => SIZES[ctx.settings.size] || 1;
const winW = () => Math.round(BASE_W * scale());
const winH = () => Math.round(BASE_H * scale());

function workAreaAt(x, y) {
  return screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) }).workArea;
}

function currentWorkArea() {
  const [x, y] = ctx.win.getPosition();
  return workAreaAt(x + winW() / 2, y + winH() / 2);
}

const groundY = (wa) => wa.y + wa.height - winH();
const clampX = (x, wa) => Math.min(Math.max(x, wa.x), wa.x + wa.width - winW());

// setPosition o'rniga setBounds: DPI masshtabida oyna o'lchami "suzib" ketmasligi uchun
function placeAt(x, y) {
  ctx.win.setBounds({ x: Math.round(x), y: Math.round(y), width: winW(), height: winH() });

  // Oyna ekran chetidan chiqib tursa — gap pufakchasini ichkariga suradi
  const wa = workAreaAt(x + winW() / 2, y + winH() / 2);
  const over = Math.max(0, wa.x - x) - Math.max(0, x + winW() - (wa.x + wa.width));
  const shift = Math.round(over / scale());
  if (shift !== bubbleShift) {
    bubbleShift = shift;
    send('bubble-shift', shift);
  }
}

function rememberPosition() {
  if (!alive()) return;
  const [x, y] = ctx.win.getPosition();
  ctx.settings.position = { x, y };
  require('./settings').save();
}

// Personaj turgan joy (ekran koordinatalarida)
function petRect() {
  const [x, y] = ctx.win.getPosition();
  const s = scale();
  const size = petSize();
  return {
    x: x + ((BASE_W - size) / 2) * s,
    y: y + (BASE_H - size) * s,
    w: size * s,
    h: size * s,
  };
}

Object.assign(module.exports, {
  ctx,
  BASE_W,
  BASE_H,
  PET_SIZE,
  petSize,
  SIZES,
  alive,
  send,
  sendState,
  setState,
  scale,
  winW,
  winH,
  workAreaAt,
  currentWorkArea,
  groundY,
  clampX,
  placeAt,
  rememberPosition,
  petRect,
});
