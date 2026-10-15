// Yangilanish (GitHub Releases).
//  - O'rnatilgan dastur: yangi versiya fonda yuklanadi, personaj aytadi va gap bulutchasida
//    "Yangilash" tugmasi chiqadi. Bosilmasa — keyingi yopilishda o'zi o'rnatiladi.
//  - Menyuda doim "Yangilanishni tekshirish": natijani personaj aytadi.
//  - Portable exe: o'zini yangilay olmaydi — yangi versiya chiqqanini aytadi va sahifasini ochadi.
//
// Renderer'ga `update` kanali: { status, version, portable, percent?, manual }
//   status: checking | downloading | ready | latest | error | dev

const { app, net, shell } = require('electron');
const C = require('./context');

const REPO = 'ShaxzodRuziqulov/kokcha-pet';
const FIRST_CHECK_MS = 30 * 1000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

let state = { status: 'idle' };   // idle | checking | downloading | ready | latest | error
let manual = false;                // oxirgi tekshiruvni foydalanuvchi o'zi boshladimi
let autoUpdater = null;
let lastPercentShown = -1;

const isPortable = () => !!process.env.PORTABLE_EXECUTABLE_FILE;

// "1.10.0" > "1.9.2"
function isNewer(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) > (pb[i] || 0);
  }
  return false;
}

async function latestVersion() {
  const res = await net.fetch(`https://api.github.com/repos/${REPO}/releases/latest`, {
    headers: { 'User-Agent': 'kokcha-desktop-pet' },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}`);
  const json = await res.json();
  return String(json.tag_name || '').replace(/^v/, '') || null;
}

// Holat o'zgardi: menyu yangilanadi; personaj faqat muhim yoki so'ralgan holatlarda gapiradi
function setState(next, { tell = false } = {}) {
  state = next;
  require('./menu').refreshTray();
  if (tell) C.send('update', { ...state, manual, portable: isPortable() });
}

function onError() {
  const wasManual = manual;
  // Yuklab bo'lingan versiya yo'qolmasin
  if (state.status === 'ready') return;
  setState({ status: 'error' }, { tell: wasManual });
  manual = false;
}

async function check(byUser = false) {
  if (state.status === 'checking' || state.status === 'downloading') {
    if (byUser) C.send('update', { ...state, manual: true, portable: isPortable() });
    return;
  }
  if (state.status === 'ready') {
    if (byUser) C.send('update', { ...state, manual: true, portable: isPortable() });
    return;
  }
  manual = byUser;
  if (!app.isPackaged) {
    if (byUser) C.send('update', { status: 'dev', manual: true, version: app.getVersion() });
    return;
  }
  setState({ status: 'checking' }, { tell: byUser });
  try {
    if (isPortable()) {
      const latest = await latestVersion();
      if (latest && isNewer(latest, app.getVersion())) setState({ status: 'ready', version: latest }, { tell: true });
      else setState({ status: 'latest', version: app.getVersion() }, { tell: byUser });
    } else {
      // Natija hodisalar orqali keladi (pastda)
      await autoUpdater.checkForUpdates();
    }
  } catch {
    onError(); // internet yo'q yoki GitHub javob bermadi — keyingi safar
  }
}

function start() {
  if (app.isPackaged && !isPortable()) {
    ({ autoUpdater } = require('electron-updater'));
    autoUpdater.logger = null;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('update-available', (info) => {
      lastPercentShown = -1;
      setState({ status: 'downloading', version: info.version, percent: 0 }, { tell: manual });
    });
    autoUpdater.on('update-not-available', () => {
      setState({ status: 'latest', version: app.getVersion() }, { tell: manual });
      manual = false;
    });
    autoUpdater.on('download-progress', (p) => {
      const percent = Math.floor(p.percent || 0);
      // Menyu har 10% da yangilanadi — tez-tez qayta qurish shart emas
      if (Math.floor(percent / 10) === Math.floor(lastPercentShown / 10)) return;
      lastPercentShown = percent;
      setState({ ...state, status: 'downloading', percent });
    });
    autoUpdater.on('update-downloaded', (info) => {
      setState({ status: 'ready', version: info.version }, { tell: true });
      manual = false;
    });
    autoUpdater.on('error', onError);
  }
  if (!app.isPackaged) return; // dasturlash rejimida o'zi tekshirmaydi
  setTimeout(() => check(false), FIRST_CHECK_MS);
  setInterval(() => check(false), CHECK_EVERY_MS);
}

function install() {
  if (state.status !== 'ready') return;
  if (isPortable()) {
    shell.openExternal(`https://github.com/${REPO}/releases/latest`);
  } else {
    // Jim o'rnatadi va dasturni qayta ochadi
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
  }
}

// Menyu bandlari: tepada — tayyor yangilanish; pastda (versiya yonida) — tekshirish
function menuItems() {
  if (state.status !== 'ready') return [];
  const label = isPortable()
    ? `✨ Yangi versiya ${state.version} — yuklab olish`
    : `✨ Yangilash (${state.version}) — hoziroq o'rnatish`;
  return [{ label, click: install }, { type: 'separator' }];
}

function checkItem() {
  const s = state.status;
  if (s === 'checking') return { label: 'Yangilanish tekshirilmoqda…', enabled: false };
  if (s === 'downloading') return { label: `Yangi versiya yuklanmoqda… ${state.percent || 0}%`, enabled: false };
  if (s === 'ready') return { label: `Yangilash (${state.version})`, click: install };
  return { label: '🔄 Yangilanishni tekshirish', click: () => check(true) };
}

const status = () => ({ ...state });

Object.assign(module.exports, { start, check, install, menuItems, checkItem, status, isNewer });
