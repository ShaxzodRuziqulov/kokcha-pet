// Kokcha — desktop pet (asosiy jarayon)
// Bu yerda: oyna, harakat (yurish, sudrash, tushish), uyqu, eslatmalar, tray menyu, sozlamalar.

const { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage, powerMonitor, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

// ---- Sozlamalar ----
const BASE_W = 240;
const BASE_H = 280;
const PET_SIZE = 150;                    // personaj qutisi (oynaning pastki o'rtasida)
const SLEEP_AFTER_MS = 3 * 60 * 1000;    // klaviatura va sichqoncha shuncha vaqt tinch tursa — uxlaydi
const BREAK_RESET_MS = 5 * 60 * 1000;    // shuncha dam olsangiz, eslatma hisobi noldan boshlanadi
const AWAY_MS = 20 * 60 * 1000;          // shuncha yo'q bo'lsangiz, qaytganingizda kutib oladi
const RANDOM_CHAT_MS = 8 * 60 * 1000;    // o'zi gapirishi oralig'i (taxminan)
const PAUSE_MS = 3000;                   // yozishdan shuncha to'xtasangiz — gapirsa bo'ladi
const DANCE_MS = 1800;
const VK_CONTROL = 0x11;
const WALK_SPEED = 2;                    // har qadamda necha piksel
const WALK_TICK_MS = 20;
const CURSOR_TICK_MS = 40;
const SIZES = { small: 0.75, medium: 1, large: 1.3 };
const SIZE_LABELS = { small: 'Kichik', medium: "O'rta", large: 'Katta' };
const BREAK_OPTIONS = [30, 45, 60, 0];   // daqiqa; 0 — o'chiq

// Tayyor personajlar (ko'rinishi — characters.js) va ranglar (style.css)
const CHARACTERS = { kokcha: "Ko'kcha", cat: 'Mushukcha', dog: 'Kuchukcha', penguin: 'Pingvin' };
const CUSTOM_NAME = "Do'stcha";
const COLORS = {
  original: 'Asl rang',
  green: 'Yashil',
  pink: 'Pushti',
  yellow: 'Sariq',
  purple: 'Binafsha',
  blue: "Ko'k",
};
const IMAGE_EXTS = ['png', 'gif', 'webp', 'jpg', 'jpeg'];
const MAX_IMAGE_PX = 600;                // bundan kattasi kichraytiriladi (ekranda ~150–400 px bo'ladi)

const DEFAULTS = {
  autoWalk: true,
  quiet: false,
  size: 'medium',
  breakMinutes: 45,
  position: null,
  character: null,    // kokcha | cat | dog | penguin | custom
  color: 'original',
  customImage: null,  // "O'z rasmim" — userData ichidagi nusxa
  onboarded: false,   // birinchi ochilishdagi tanishtirish ko'rsatilganmi
  lastSeenDay: null,  // "xayrli tong" kuniga bir marta
};

let settings = { ...DEFAULTS };
let saveTimer = null;

let win = null;
let tray = null;

let state = 'idle';          // idle | walk | sleep
let manualSleep = false;     // foydalanuvchi o'zi uxlatganmi
let dragging = false;
let dragFrom = null;
let falling = false;
let hovering = false;        // kursor personaj ustida
let capturing = false;       // oyna sichqonchani ushlayaptimi (Ctrl bosilsa — yo'q)
let ghost = false;           // Ctrl bosilgan: personaj shaffof, orqasini bosish mumkin
let danceUntil = 0;
let userHidden = false;      // tray orqali yashirilgan
let fullscreenHidden = false; // boshqa dastur to'liq ekranda

let walkTimer = null;
let walkDir = 1;
let fallTimer = null;
let workStart = Date.now();  // dam olish eslatmasi hisobi
let nextChat = Date.now() + RANDOM_CHAT_MS;
let prevIdleMs = 0;
let lastLook = '';
let petTrack = { lastX: null, dir: 0, flips: [], cooldownUntil: 0 }; // silashni aniqlash
let isFullscreenApp = null;  // Windows'da to'liq ekranni aniqlovchi funksiya
let isCtrlDown = () => false;

// ---- Sozlamalarni saqlash ----
function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function loadSettings() {
  try {
    settings = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsPath(), 'utf8')) };
  } catch {
    settings = { ...DEFAULTS };
  }
  if (!SIZES[settings.size]) settings.size = DEFAULTS.size;
  if (!COLORS[settings.color]) settings.color = DEFAULTS.color;
  if (!CHARACTERS[settings.character] && settings.character !== 'custom') {
    // Avval custom/ papkaga rasm qo'yganlar uchun — o'sha rasm qoladi
    settings.character = findCustomSprites().idle ? 'custom' : 'kokcha';
  }
}

function saveSettings(now = false) {
  clearTimeout(saveTimer);
  const write = () => {
    try { fs.writeFileSync(settingsPath(), JSON.stringify(settings, null, 2)); } catch { /* muhim emas */ }
  };
  if (now) write();
  else saveTimer = setTimeout(write, 500);
}

// ---- Yordamchi funksiyalar ----
function alive() {
  return win && !win.isDestroyed();
}

function send(channel, payload) {
  if (alive()) win.webContents.send(channel, payload);
}

function setState(next) {
  state = next;
  send('state', { state, dir: walkDir });
  refreshTray();
}

const scale = () => SIZES[settings.size];
const winW = () => Math.round(BASE_W * scale());
const winH = () => Math.round(BASE_H * scale());

function workAreaAt(x, y) {
  return screen.getDisplayNearestPoint({ x: Math.round(x), y: Math.round(y) }).workArea;
}

function currentWorkArea() {
  const [x, y] = win.getPosition();
  return workAreaAt(x + winW() / 2, y + winH() / 2);
}

const groundY = (wa) => wa.y + wa.height - winH();
const clampX = (x, wa) => Math.min(Math.max(x, wa.x), wa.x + wa.width - winW());

// setPosition o'rniga setBounds: DPI masshtabida oyna o'lchami "suzib" ketmasligi uchun
function placeAt(x, y) {
  win.setBounds({ x: Math.round(x), y: Math.round(y), width: winW(), height: winH() });
}

function rememberPosition() {
  if (!alive()) return;
  const [x, y] = win.getPosition();
  settings.position = { x, y };
  saveSettings();
}

// Personaj turgan joy (ekran koordinatalarida)
function petRect() {
  const [x, y] = win.getPosition();
  const s = scale();
  return {
    x: x + ((BASE_W - PET_SIZE) / 2) * s,
    y: y + (BASE_H - PET_SIZE) * s,
    w: PET_SIZE * s,
    h: PET_SIZE * s,
  };
}

// Monitor uzilsa yoki taskbar joyi o'zgarsa — ko'rinadigan joyga, "yerga" qaytaradi
function snapToGround() {
  if (!alive() || dragging || falling) return;
  stopWalk();
  const [x] = win.getPosition();
  const wa = currentWorkArea();
  placeAt(clampX(x, wa), groundY(wa));
  rememberPosition();
}

// Foydalanuvchi o'z rasmlarini qo'yadigan papka:
//  - dasturlash rejimida:  assets/custom/
//  - exe holatida:         exe yonidagi custom/ papka
//    (portable exe o'zini Temp'ga ochadi, shuning uchun asl joyini PORTABLE_EXECUTABLE_DIR beradi)
function customDir() {
  if (!app.isPackaged) return path.join(__dirname, 'assets', 'custom');
  const exeDir = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(app.getPath('exe'));
  return path.join(exeDir, 'custom');
}

function findCustomSprites() {
  const dir = customDir();
  const sprites = {};
  for (const s of ['idle', 'walk', 'sleep', 'talk']) {
    for (const ext of ['png', 'gif', 'webp']) {
      const p = path.join(dir, `${s}.${ext}`);
      if (fs.existsSync(p)) {
        sprites[s] = fileUrl(p);
        break;
      }
    }
  }
  return sprites;
}

function fileUrl(p) {
  // ?v= — rasm almashtirilganda eski nusxa keshdan chiqmasligi uchun
  return `${pathToFileURL(p).href}?v=${Math.round(fs.statSync(p).mtimeMs)}`;
}

// ---- Personaj ko'rinishi ----
function appearance() {
  let character = settings.character;
  let sprites = {};
  if (character === 'custom') {
    sprites = findCustomSprites();
    if (settings.customImage && fs.existsSync(settings.customImage)) sprites.idle = fileUrl(settings.customImage);
    if (!sprites.idle) {
      character = 'kokcha'; // rasm topilmasa — Ko'kcha
      sprites = {};
    }
  }
  const name = character === 'custom' ? CUSTOM_NAME : CHARACTERS[character];
  return { character, color: settings.color, sprites, name };
}

function applyAppearance(change, report = null) {
  const a = appearance();
  send('appearance', { ...a, change, report });
  if (tray) tray.setToolTip(a.name);
  saveSettings();
  refreshTray();
}

function setCharacter(character) {
  settings.character = character;
  applyAppearance('character');
}

function setColor(color) {
  settings.color = color;
  applyAppearance('color');
}

// Rasmni tekshiradi va iloji bo'lsa yaxshilaydi.
// Natija — personaj foydalanuvchiga aytadigan maslahatlar uchun "report".
function prepareImage(src, destBase) {
  const ext = path.extname(src).slice(1).toLowerCase();
  const report = { issues: [], cropped: false, w: 0, h: 0 };
  let img = nativeImage.createFromPath(src);

  // GIF va WebP'ni nativeImage o'qimaydi — o'zicha nusxalanadi
  if (img.isEmpty()) {
    if (ext === 'gif') report.issues.push('gif');
    const dest = `${destBase}.${ext}`;
    fs.copyFileSync(src, dest);
    return { dest, report };
  }

  const { width: w, height: h } = img.getSize();
  const px = img.toBitmap(); // har piksel 4 bayt, alfa — 4-chisi
  const alpha = (x, y) => px[(y * w + x) * 4 + 3];

  // Ko'rinadigan qism chegaralari
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alpha(x, y) > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error("Rasm butunlay shaffof — unda hech narsa ko'rinmaydi.");

  const corners = [alpha(0, 0), alpha(w - 1, 0), alpha(0, h - 1), alpha(w - 1, h - 1)];
  const hasBackground = corners.filter((a) => a > 24).length >= 3;
  let changed = false;

  if (hasBackground) {
    report.issues.push(ext === 'jpg' || ext === 'jpeg' ? 'jpg' : 'background');
  } else {
    // Atrofidagi bo'sh joyni qirqadi (pastdan deyarli qoldirmaydi — "yerda tursin")
    const m = Math.round(Math.max(w, h) * 0.03);
    const x = Math.max(0, minX - m);
    const y = Math.max(0, minY - m);
    const cw = Math.min(w, maxX + m + 1) - x;
    const ch = Math.min(h, maxY + 2) - y;
    if (cw < w * 0.92 || ch < h * 0.92) {
      img = img.crop({ x, y, width: cw, height: ch });
      report.cropped = true;
      changed = true;
    }
  }

  let size = img.getSize();
  if (Math.max(size.width, size.height) > MAX_IMAGE_PX) {
    img = size.width >= size.height
      ? img.resize({ width: MAX_IMAGE_PX, quality: 'best' })
      : img.resize({ height: MAX_IMAGE_PX, quality: 'best' });
    changed = true;
  }

  report.w = w;
  report.h = h;
  size = img.getSize();
  if (Math.max(w, h) < 150) report.issues.push('small');
  const ratio = size.width / size.height;
  if (ratio > 1.7 || ratio < 0.55) report.issues.push('shape');

  if (changed) {
    const dest = `${destBase}.png`;
    fs.writeFileSync(dest, img.toPNG());
    return { dest, report };
  }
  const dest = `${destBase}.${ext}`;
  fs.copyFileSync(src, dest);
  return { dest, report };
}

// "O'z rasmim..." — personaj maslahat berib turadi, rasm tekshiriladi
// va userData'ga nusxalanadi (asl fayl ko'chirilsa ham yo'qolmaydi)
async function chooseImage() {
  setUserHidden(false);
  if (state === 'sleep') wakeUp('click');
  send('say', 'image-tips');

  const res = await dialog.showOpenDialog({
    title: "Personaj uchun rasm tanlang — eng yaxshisi foni shaffof PNG",
    properties: ['openFile'],
    filters: [{ name: 'Rasmlar (PNG, GIF, WebP, JPG)', extensions: IMAGE_EXTS }],
  });
  if (res.canceled || !res.filePaths.length) {
    send('say', 'image-cancel');
    return refreshTray();
  }

  const dir = app.getPath('userData');
  try {
    // Avval yangisini tayyorlaymiz — xato bo'lsa, eski rasm o'z joyida qoladi
    const { dest: tmp, report } = prepareImage(res.filePaths[0], path.join(dir, 'my-pet-new'));
    for (const e of IMAGE_EXTS) fs.rmSync(path.join(dir, `my-pet.${e}`), { force: true });
    const dest = path.join(dir, `my-pet${path.extname(tmp)}`);
    fs.renameSync(tmp, dest);
    settings.customImage = dest;
    settings.character = 'custom';
    applyAppearance('custom', report);
  } catch (err) {
    send('say', 'image-error');
    dialog.showErrorBox("Rasmni o'rnatib bo'lmadi", String(err.message || err));
    refreshTray();
  }
}

// ---- Oyna ----
function startPosition() {
  const saved = settings.position;
  const wa = saved
    ? workAreaAt(saved.x + winW() / 2, saved.y + winH() / 2)
    : screen.getPrimaryDisplay().workArea;
  const x = saved ? clampX(saved.x, wa) : wa.x + wa.width - winW() - 60;
  return { x, y: groundY(wa) };
}

function createWindow() {
  const { x, y } = startPosition();

  win = new BrowserWindow({
    width: winW(),
    height: winH(),
    x,
    y,                                // taskbar ustida turadi
    show: false,
    transparent: true,
    frame: false,
    resizable: false,
    hasShadow: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      zoomFactor: scale(),
    },
  });

  win.setAlwaysOnTop(true, 'screen-saver');
  win.setVisibleOnAllWorkspaces(true);
  // Shaffof joylar sichqonchani o'tkazib yuboradi; personaj ustida esa ushlaydi (trackCursor)
  win.setIgnoreMouseEvents(true);
  win.once('ready-to-show', () => win.showInactive()); // fokusni o'g'irlamaydi
  win.loadFile('index.html');
}

function updateVisibility() {
  if (!alive()) return;
  const shouldShow = !userHidden && !fullscreenHidden;
  if (shouldShow && !win.isVisible()) {
    win.showInactive();
    win.setAlwaysOnTop(true, 'screen-saver');
  } else if (!shouldShow && win.isVisible()) {
    stopWalk();
    win.hide();
  }
  refreshTray();
}

function setUserHidden(hidden) {
  userHidden = hidden;
  updateVisibility();
}

// Windows funksiyalari: to'liq ekranni va Ctrl tugmasini aniqlash.
// Yuklanmasa — bu ikki imkoniyat o'chadi, qolgani odatdagidek ishlaydi.
function initNative() {
  if (process.platform !== 'win32') return;
  try {
    const koffi = require('koffi');
    const shell32 = koffi.load('shell32.dll');
    const query = shell32.func('int __stdcall SHQueryUserNotificationState(_Out_ int *pquns)');
    // 2 — to'liq ekranli dastur, 3 — Direct3D o'yin, 4 — prezentatsiya rejimi
    isFullscreenApp = () => {
      const out = [0];
      return query(out) === 0 && [2, 3, 4].includes(out[0]);
    };

    const user32 = koffi.load('user32.dll');
    const keyState = user32.func('short __stdcall GetAsyncKeyState(int vKey)');
    isCtrlDown = () => (keyState(VK_CONTROL) & 0x8000) !== 0;
  } catch {
    isFullscreenApp = null;
  }
}

function watchFullscreen() {
  if (!isFullscreenApp) return;
  setInterval(() => {
    const full = isFullscreenApp();
    if (full !== fullscreenHidden) {
      fullscreenHidden = full;
      updateVisibility();
    }
  }, 1500);
}

// ---- Yurish ----
function stopWalk() {
  if (walkTimer) clearInterval(walkTimer);
  walkTimer = null;
  if (state === 'walk') {
    setState('idle');
    rememberPosition();
  }
}

function startWalk() {
  if (state !== 'idle' || dragging || falling || hovering || Date.now() < danceUntil) return;
  if (!alive() || !win.isVisible()) return;
  walkDir = Math.random() < 0.5 ? -1 : 1;
  setState('walk');

  let stepsLeft = Math.round((3000 + Math.random() * 4000) / WALK_TICK_MS);

  walkTimer = setInterval(() => {
    if (!alive() || dragging || hovering) return stopWalk();

    const [x, y] = win.getPosition();
    const wa = currentWorkArea();
    const nx = x + walkDir * WALK_SPEED;

    // Ekran chetiga qarab yurayotgan bo'lsagina buriladi (aks holda chetda titrab qoladi)
    const hitLeft = walkDir < 0 && nx < wa.x;
    const hitRight = walkDir > 0 && nx + winW() > wa.x + wa.width;
    if (hitLeft || hitRight) {
      walkDir *= -1;
      send('state', { state, dir: walkDir });
    }
    placeAt(x + walkDir * WALK_SPEED, y);

    if (--stepsLeft <= 0) stopWalk();
  }, WALK_TICK_MS);
}

function scheduleRandomWalk() {
  const delay = 8000 + Math.random() * 10000;
  setTimeout(() => {
    if (settings.autoWalk && state === 'idle') startWalk();
    scheduleRandomWalk();
  }, delay);
}

// ---- Sudrash va tushish ----
function stopFall() {
  if (fallTimer) clearInterval(fallTimer);
  fallTimer = null;
  falling = false;
}

// Qo'yib yuborilganda taskbar ustiga "tushadi"
function fallToGround() {
  if (!alive()) return;
  const [x0, y0] = win.getPosition();
  const wa = currentWorkArea();
  const x = clampX(x0, wa);
  const target = groundY(wa);

  if (y0 >= target - 2) {
    placeAt(x, target);
    rememberPosition();
    return;
  }

  falling = true;
  let y = y0;
  let vy = 0;
  fallTimer = setInterval(() => {
    if (!alive()) return stopFall();
    vy = Math.min(vy + 1.6, 40);
    y = Math.min(y + vy, target);
    placeAt(x, y);
    if (y >= target) {
      stopFall();
      send('landed');
      rememberPosition();
    }
  }, 16);
}

// ---- Uyqu ----
function goToSleep(manual = false) {
  stopWalk();
  manualSleep = manual;
  setState('sleep');
}

function wakeUp(reason) {
  if (state !== 'sleep') return;
  manualSleep = false;
  setState('idle');
  send('woke', { reason }); // renderer gap pufakchasini ko'rsatadi
}

// Klaviatura ham, sichqoncha ham hisobga olinadi (getSystemIdleTime)
function watchActivity() {
  setInterval(() => {
    const idleMs = powerMonitor.getSystemIdleTime() * 1000;
    const now = Date.now();

    if (idleMs < 2000) {
      if (prevIdleMs >= AWAY_MS) {
        // Uzoq yo'q edingiz — kutib oladi (kunning birinchi kelishida "xayrli tong")
        const today = new Date().toDateString();
        const reason = settings.lastSeenDay !== today ? 'morning' : 'back';
        settings.lastSeenDay = today;
        saveSettings();
        if (state === 'sleep' && !manualSleep) wakeUp(reason);
        else if (state !== 'sleep') send('welcome', reason);
      } else if (state === 'sleep' && !manualSleep) {
        // Foydalanuvchi qaytdi — o'zi uxlab qolgan bo'lsa uyg'onadi
        wakeUp('idle');
      }
    } else if (state !== 'sleep' && idleMs > SLEEP_AFTER_MS) {
      goToSleep(false);
    }
    prevIdleMs = idleMs;

    const canTalk = state !== 'sleep' && win.isVisible();
    const paused = idleMs >= PAUSE_MS; // yozayotgan paytingizda gapirmaydi

    // Dam olish eslatmasi: faqat uzluksiz ishlagan vaqt sanaladi.
    // Yozishdan to'xtashingizni kutadi, lekin 2 daqiqadan ortiq kechiktirmaydi.
    if (idleMs >= BREAK_RESET_MS) {
      workStart = now;
    } else if (settings.breakMinutes > 0 && canTalk) {
      const due = now - workStart - settings.breakMinutes * 60 * 1000;
      if (due >= 0 && (paused || due > 2 * 60 * 1000)) {
        send('say', 'break');
        workStart = now;
      }
    }

    // O'zi gapirishi: faqat siz to'xtab turganingizda, jim rejimda emas
    if (now >= nextChat && canTalk && state === 'idle' && paused && idleMs < SLEEP_AFTER_MS) {
      if (!settings.quiet) send('say', 'random');
      nextChat = now + RANDOM_CHAT_MS * (0.75 + Math.random() * 0.5);
    }
  }, 1000);
}

// Kursor personaj ustida u yoq-bu yoqqa yurgizilsa — "silash"
function trackPetting(c, now) {
  if (!hovering || dragging || ghost) {
    petTrack.lastX = null;
    petTrack.dir = 0;
    return;
  }
  if (petTrack.lastX !== null) {
    const d = c.x - petTrack.lastX;
    if (Math.abs(d) >= 3) {
      const dir = Math.sign(d);
      if (petTrack.dir && dir !== petTrack.dir) petTrack.flips.push(now);
      petTrack.dir = dir;
    }
  }
  petTrack.lastX = c.x;
  petTrack.flips = petTrack.flips.filter((t) => now - t < 1500);
  if (petTrack.flips.length >= 3 && now > petTrack.cooldownUntil) {
    send('petted');
    petTrack.flips = [];
    petTrack.cooldownUntil = now + 1200;
  }
}

// ---- Kursor: personaj ustidami, Ctrl bosilganmi, silash, ko'zlar kursorga qaraydi ----
function trackCursor() {
  setInterval(() => {
    if (!alive() || !win.isVisible()) return;
    const c = screen.getCursorScreenPoint();
    const r = petRect();
    const now = Date.now();

    if (!dragging) {
      const over = c.x >= r.x && c.x < r.x + r.w && c.y >= r.y && c.y < r.y + r.h;
      const nextGhost = over && isCtrlDown(); // Ctrl — orqadagi narsani bosish uchun
      const nextCapture = over && !nextGhost;

      if (over !== hovering) {
        hovering = over;
        send('hover', over);
        if (over) stopWalk();
      }
      if (nextGhost !== ghost) {
        ghost = nextGhost;
        send('ghost', ghost);
      }
      if (nextCapture !== capturing) {
        capturing = nextCapture;
        win.setIgnoreMouseEvents(!capturing);
      }
    }

    trackPetting(c, now);

    if (state !== 'sleep') {
      const dx = c.x - (r.x + r.w / 2);
      const dy = c.y - (r.y + r.h / 2);
      const key = `${Math.round(dx / 6)},${Math.round(dy / 6)}`;
      if (key !== lastLook) {
        lastLook = key;
        send('look', { dx, dy });
      }
    }
  }, CURSOR_TICK_MS);
}

// ---- O'lcham ----
function setSize(size) {
  if (!alive() || size === settings.size) return;
  const [x] = win.getPosition();
  const oldW = winW();
  const wa = currentWorkArea();

  settings.size = size;
  saveSettings();
  win.webContents.setZoomFactor(scale());
  placeAt(clampX(x + (oldW - winW()) / 2, wa), groundY(wa));
  rememberPosition();
  refreshTray();
}

// ---- Windows bilan birga ishga tushish ----
function autoStartOptions() {
  // portable exe uchun asl exe yo'li (Temp'dagi nusxa emas)
  return { path: process.env.PORTABLE_EXECUTABLE_FILE || process.execPath };
}

function getAutoStart() {
  return app.isPackaged && app.getLoginItemSettings(autoStartOptions()).openAtLogin;
}

function setAutoStart(on) {
  app.setLoginItemSettings({ openAtLogin: on, ...autoStartOptions() });
  refreshTray();
}

// ---- Menyu (tray va personaj ustida o'ng tugma — bir xil) ----
function menuTemplate() {
  return [
    { label: 'Gapir', enabled: state !== 'sleep' && !userHidden, click: () => send('say', 'random') },
    state === 'sleep'
      ? { label: "Uyg'ot", click: () => wakeUp('click') }
      : { label: 'Uxlat', click: () => goToSleep(true) },
    { label: userHidden ? "Ko'rsatish" : 'Yashirish', click: () => setUserHidden(!userHidden) },
    { type: 'separator' },
    {
      label: 'Personaj',
      submenu: [
        ...Object.entries(CHARACTERS).map(([key, label]) => ({
          label,
          type: 'radio',
          checked: settings.character === key,
          click: () => setCharacter(key),
        })),
        { type: 'separator' },
        {
          label: settings.customImage ? "O'z rasmim" : "O'z rasmim...",
          type: 'radio',
          checked: settings.character === 'custom',
          click: () => (settings.customImage ? setCharacter('custom') : chooseImage()),
        },
        ...(settings.customImage ? [{ label: 'Boshqa rasm tanlash...', click: chooseImage }] : []),
      ],
    },
    {
      label: 'Rang',
      enabled: settings.character !== 'custom',
      submenu: Object.entries(COLORS).map(([key, label]) => ({
        label,
        type: 'radio',
        checked: settings.color === key,
        click: () => setColor(key),
      })),
    },
    { type: 'separator' },
    {
      label: "O'zi yursin",
      type: 'checkbox',
      checked: settings.autoWalk,
      click: (item) => {
        settings.autoWalk = item.checked;
        if (!item.checked) stopWalk();
        saveSettings();
      },
    },
    {
      label: 'Jim rejim (faqat eslatmalar)',
      type: 'checkbox',
      checked: settings.quiet,
      click: (item) => {
        settings.quiet = item.checked;
        send('settings', { quiet: settings.quiet });
        saveSettings();
      },
    },
    {
      label: "O'lcham",
      submenu: Object.keys(SIZES).map((k) => ({
        label: SIZE_LABELS[k],
        type: 'radio',
        checked: settings.size === k,
        click: () => setSize(k),
      })),
    },
    {
      label: 'Dam olish eslatmasi',
      submenu: BREAK_OPTIONS.map((m) => ({
        label: m ? `Har ${m} daqiqada` : "O'chiq",
        type: 'radio',
        checked: settings.breakMinutes === m,
        click: () => {
          settings.breakMinutes = m;
          workStart = Date.now();
          saveSettings();
        },
      })),
    },
    {
      label: 'Windows bilan birga ishga tushsin',
      type: 'checkbox',
      enabled: app.isPackaged, // dasturlash rejimida ma'nosi yo'q
      checked: getAutoStart(),
      click: (item) => setAutoStart(item.checked),
    },
    { type: 'separator' },
    { label: 'Chiqish', click: () => app.quit() },
  ];
}

function refreshTray() {
  if (!tray) return;
  tray.setContextMenu(Menu.buildFromTemplate(menuTemplate()));
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png'));
  tray = new Tray(icon);
  tray.setToolTip(appearance().name);
  // Chap tugma: yashirin bo'lsa ko'rsatadi, uxlayotgan bo'lsa uyg'otadi, aks holda gapiradi
  tray.on('click', () => {
    if (userHidden) setUserHidden(false);
    else if (state === 'sleep') wakeUp('click');
    else send('say', 'random');
  });
  refreshTray();
}

// ---- Renderer bilan aloqa ----
ipcMain.handle('get-init', () => {
  const firstRun = !settings.onboarded;
  if (firstRun) {
    settings.onboarded = true;
    saveSettings();
  }
  return { ...appearance(), quiet: settings.quiet, firstRun };
});

ipcMain.on('pet-menu', () => {
  if (alive()) Menu.buildFromTemplate(menuTemplate()).popup({ window: win });
});

ipcMain.on('pet-dance', () => {
  danceUntil = Date.now() + DANCE_MS;
  stopWalk();
});

ipcMain.on('drag-start', () => {
  if (!alive()) return;
  dragging = true;
  stopWalk();
  stopFall();
  const c = screen.getCursorScreenPoint();
  const [x, y] = win.getPosition();
  dragFrom = { cx: c.x, cy: c.y, x, y };
  if (state === 'sleep') wakeUp('drag');
});

ipcMain.on('drag-move', () => {
  if (!alive() || !dragging || !dragFrom) return;
  const c = screen.getCursorScreenPoint();
  placeAt(dragFrom.x + c.x - dragFrom.cx, dragFrom.y + c.y - dragFrom.cy);
});

ipcMain.on('drag-end', () => {
  dragging = false;
  dragFrom = null;
  fallToGround();
});

ipcMain.on('pet-click', () => {
  if (state === 'sleep') wakeUp('click');
  else send('clicked');
});

// ---- Ishga tushirish ----
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  // Ikkinchi marta ochishga urinilsa — mavjud Ko'kcha "men shu yerdaman" deydi
  app.on('second-instance', () => {
    setUserHidden(false);
    if (state === 'sleep') wakeUp('click');
    else send('say', 'here');
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null); // Ctrl+/- kabi standart zoom tugmalari o'chadi
    loadSettings();
    settings.lastSeenDay = new Date().toDateString();
    saveSettings();
    createWindow();
    createTray();
    initNative();
    watchFullscreen();
    watchActivity();
    trackCursor();
    scheduleRandomWalk();

    for (const ev of ['display-added', 'display-removed', 'display-metrics-changed']) {
      screen.on(ev, () => setTimeout(snapToGround, 300)); // taskbar joylashib olishini kutamiz
    }
  });

  app.on('before-quit', () => {
    rememberPosition();
    saveSettings(true);
  });
  app.on('window-all-closed', () => app.quit());
}
