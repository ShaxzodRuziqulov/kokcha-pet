// Avtomatik yangilanish (GitHub Releases).
//  - O'rnatilgan dastur: yangi versiya fonda yuklanadi, personaj aytadi,
//    keyingi yopilishda o'zi o'rnatiladi (yoki menyudan "Yangilash" — darhol).
//  - Portable exe: o'zini yangilay olmaydi — yangi versiya chiqqanini aytadi va sahifasini ochadi.

const { app, net, shell } = require('electron');
const C = require('./context');

const REPO = 'ShaxzodRuziqulov/kokcha-pet';
const FIRST_CHECK_MS = 30 * 1000;
const CHECK_EVERY_MS = 6 * 60 * 60 * 1000;

let pending = null; // { version, portable }
let autoUpdater = null;

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
  if (!res.ok) return null;
  const json = await res.json();
  return String(json.tag_name || '').replace(/^v/, '') || null;
}

function announce(version, portable) {
  if (pending && pending.version === version) return;
  pending = { version, portable };
  C.send('update', pending);
  require('./menu').refreshTray();
}

async function check() {
  try {
    if (isPortable()) {
      const latest = await latestVersion();
      if (latest && isNewer(latest, app.getVersion())) announce(latest, true);
    } else {
      await autoUpdater.checkForUpdates();
    }
  } catch {
    /* internet yo'q yoki GitHub javob bermadi — keyingi safar */
  }
}

function start() {
  if (!app.isPackaged) return; // dasturlash rejimida tekshirilmaydi
  if (!isPortable()) {
    ({ autoUpdater } = require('electron-updater'));
    autoUpdater.logger = null;
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('update-downloaded', (info) => announce(info.version, false));
    autoUpdater.on('error', () => {}); // jim — keyingi tekshiruvda qayta urinadi
  }
  setTimeout(check, FIRST_CHECK_MS);
  setInterval(check, CHECK_EVERY_MS);
}

function install() {
  if (!pending) return;
  if (pending.portable) {
    shell.openExternal(`https://github.com/${REPO}/releases/latest`);
  } else {
    // Jim o'rnatadi va dasturni qayta ochadi
    setImmediate(() => autoUpdater.quitAndInstall(true, true));
  }
}

// Menyuning eng tepasidagi band (yangi versiya bo'lsa)
function menuItems() {
  if (!pending) return [];
  const label = pending.portable
    ? `✨ Yangi versiya ${pending.version} — yuklab olish`
    : `✨ Yangilash (${pending.version}) — qayta ishga tushadi`;
  return [{ label, click: install }, { type: 'separator' }];
}

Object.assign(module.exports, { start, menuItems, isNewer });
