// Menyu (tray va personaj ustida o'ng tugma — bir xil), tray belgisi, Windows bilan birga ishga tushish

const { app, Menu, Tray, nativeImage } = require('electron');
const path = require('path');
const C = require('./context');
const settings = require('./settings');
const appearance = require('./appearance');
const win = require('./window');
const motion = require('./motion');
const activity = require('./activity');
const updater = require('./updater');
const shortcuts = require('./shortcuts');
const persona = require('./persona');

const { ctx } = C;

const SIZE_LABELS = { small: 'Kichik', medium: "Oʻrta", large: 'Katta' };
// Midori'ning kadrli harakatlari (renderer: Chibi.playActivity)
const ACTIVITY_LABELS = {
  wave: 'Qoʻl silkitsin', read: 'Kitob oʻqisin', tea: 'Choy ichsin', water: 'Gul sugʻorsin', stretch: 'Choʻzilsin',
};
const BREAK_OPTIONS = [30, 45, 60, 0]; // daqiqa; 0 — o'chiq

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

// ---- Menyu ----
// Paneldagi ikonkalar (almashtirgichlar uchun)
const CHECK_PANEL = {
  'Oʻzi harakat qilsin': ['🚶', 'Oʻzi yursin'], 'Oynalar ustiga chiqsin': ['🪟', 'Oynalarga chiqsin'],
  'Jim rejim (faqat eslatmalar)': ['🔕', 'Jim rejim'], 'Windows bilan birga ishga tushsin': ['🚀', 'Windows bilan ochilsin'],
};

function check(label, checked, onChange, enabled = true) {
  const [panelIcon, panelLabel] = CHECK_PANEL[label] || [];
  return { label, type: 'checkbox', checked, enabled, panelIcon, panelLabel, click: (item) => onChange(item.checked) };
}

function radios(entries, isChecked, onPick) {
  return entries.map(([key, label]) => ({ label, type: 'radio', checked: isChecked(key), click: () => onPick(key) }));
}

function characterMenu() {
  const s = ctx.settings;
  return [
    ...radios(Object.entries(appearance.CHARACTERS), (k) => s.character === k, appearance.setCharacter),
    { type: 'separator' },
    {
      label: s.customImage ? "Oʻz rasmim" : "Oʻz rasmim...",
      type: 'radio',
      checked: s.character === 'custom',
      click: () => (s.customImage ? appearance.setCharacter('custom') : appearance.chooseImage()),
    },
    ...(s.customImage ? [{ label: 'Boshqa rasm tanlash...', click: appearance.chooseImage }] : []),
  ];
}

// Bitta ro'yxat: tray menyusi ham, o'ng tugma paneli ham (panel.js) shundan quriladi.
// panelIcon / panelKind — faqat panel uchun (Windows menyusi ularni e'tiborsiz qoldiradi).
function template() {
  const s = ctx.settings;
  const sleeping = ctx.state === 'sleep';
  return [
    ...updater.menuItems().map((i) => (i.type === 'separator' ? i : { ...i, panelKind: 'banner' })),
    { label: 'Gapir', panelIcon: '💬', panelKind: 'tile', enabled: !sleeping && !ctx.userHidden, click: () => C.send('say', 'random') },
    sleeping
      ? { label: "Uygʻot", panelIcon: '☀️', panelKind: 'tile', click: () => activity.wakeUp('click') }
      : { label: 'Uxlat', panelIcon: '😴', panelKind: 'tile', click: () => activity.goToSleep(true) },
    ...shortcuts.menuItems().map((i) => (i.enabled === false ? { ...i, panelKind: 'note' }
      : { ...i, panelIcon: '🙈', panelKind: 'tile' })),
    { type: 'separator' },
    { label: 'Personaj', panelIcon: '🧸', submenu: characterMenu() },
    ...(s.character === 'chibi-girl' ? [{
      label: 'Harakat',
      panelIcon: '🎬',
      enabled: ctx.state !== 'sleep' && !ctx.userHidden,
      submenu: Object.entries(ACTIVITY_LABELS).map(([id, label]) => ({ label, click: () => C.send('activity', id) })),
    }] : []),
    ...(s.character === 'chibi-girl' ? [{
      label: 'Kayfiyat',
      panelIcon: '💭',
      submenu: radios(Object.entries(persona.LABELS), (id) => persona.current().id === id, persona.set),
    }] : []),
    {
      label: 'Rang',
      panelIcon: '🎨',
      panelHide: s.character === 'custom' || s.character === 'chibi-girl',   // panelda — kerak bo'lmasa ko'rinmaydi
      enabled: s.character !== 'custom' && s.character !== 'chibi-girl',
      submenu: radios(Object.entries(appearance.COLORS), (k) => s.color === k, appearance.setColor),
    },
    { type: 'separator' },
    check("Oʻzi harakat qilsin", s.autoWalk, (on) => {
      s.autoWalk = on;
      if (!on) motion.stopWalk();
      settings.save();
    }),
    check('Oynalar ustiga chiqsin', s.climb && motion.canClimb(), (on) => {
      s.climb = on;
      settings.save();
      // O'chirilsa — oyna ustidan yoki devordan yerga tushadi
      if (!on && (ctx.perch || ctx.pose === 'climb' || ctx.pose === 'hang')) motion.fall();
    }, motion.canClimb()),
    check('Jim rejim (faqat eslatmalar)', s.quiet, (on) => {
      s.quiet = on;
      C.send('settings', { quiet: on });
      settings.save();
    }),
    {
      label: "Oʻlcham",
      panelIcon: '📏',
      submenu: radios(Object.entries(SIZE_LABELS), (k) => s.size === k, win.setSize),
    },
    {
      label: 'Dam olish eslatmasi',
      panelLabel: 'Tanaffus',
      panelIcon: '☕',
      submenu: radios(
        BREAK_OPTIONS.map((m) => [m, m ? `Har ${m} daqiqada` : "Oʻchiq"]),
        (m) => s.breakMinutes === m,
        (m) => {
          s.breakMinutes = m;
          activity.resetBreakTimer();
          settings.save();
        },
      ),
    },
    { label: 'Suhbat (AI)...', panelLabel: 'Suhbat', panelIcon: '✨', click: () => require('./ai').open() },
    { label: `Eslatmalar (${require('./reminders').pendingCount()})...`, panelLabel: `Eslatmalar (${require('./reminders').pendingCount()})`,
      panelIcon: '⏰', click: () => require('./reminders').open() },
    // dasturlash rejimida ma'nosi yo'q
    check('Windows bilan birga ishga tushsin', getAutoStart(), setAutoStart, app.isPackaged),
    { type: 'separator' },
    { label: `Versiya ${app.getVersion()}`, enabled: false, panelKind: 'version' },
    { ...updater.checkItem(), panelIcon: '🔄' },
    { label: 'Chiqish', panelIcon: '⏻', panelKind: 'danger', click: () => app.quit() },
  ];
}

function refreshTray() {
  if (!ctx.tray) return;
  ctx.tray.setContextMenu(Menu.buildFromTemplate(template()));
}

// Personaj ustida o'ng tugma — o'z paneli (tray'da esa Windows menyusi)
function popup() {
  if (C.alive()) require('./panel').show();
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(app.getAppPath(), 'assets', 'tray.png'));
  ctx.tray = new Tray(icon);
  ctx.tray.setToolTip(appearance.current().name);
  // Chap tugma: yashirin bo'lsa ko'rsatadi, uxlayotgan bo'lsa uyg'otadi, aks holda gapiradi
  ctx.tray.on('click', () => {
    if (ctx.userHidden) win.setUserHidden(false);
    else if (ctx.state === 'sleep') activity.wakeUp('click');
    else C.send('say', 'random');
  });
  refreshTray();
}

Object.assign(module.exports, { createTray, refreshTray, popup, template });
