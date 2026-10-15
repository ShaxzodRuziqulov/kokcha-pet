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

const { ctx } = C;

const SIZE_LABELS = { small: 'Kichik', medium: "O'rta", large: 'Katta' };
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
function check(label, checked, onChange, enabled = true) {
  return { label, type: 'checkbox', checked, enabled, click: (item) => onChange(item.checked) };
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
      label: s.customImage ? "O'z rasmim" : "O'z rasmim...",
      type: 'radio',
      checked: s.character === 'custom',
      click: () => (s.customImage ? appearance.setCharacter('custom') : appearance.chooseImage()),
    },
    ...(s.customImage ? [{ label: 'Boshqa rasm tanlash...', click: appearance.chooseImage }] : []),
  ];
}

function template() {
  const s = ctx.settings;
  const sleeping = ctx.state === 'sleep';
  return [
    ...updater.menuItems(),
    { label: 'Gapir', enabled: !sleeping && !ctx.userHidden, click: () => C.send('say', 'random') },
    sleeping
      ? { label: "Uyg'ot", click: () => activity.wakeUp('click') }
      : { label: 'Uxlat', click: () => activity.goToSleep(true) },
    ...shortcuts.menuItems(),
    { type: 'separator' },
    { label: 'Personaj', submenu: characterMenu() },
    {
      label: 'Rang',
      enabled: s.character !== 'custom' && s.character !== 'chibi-girl',
      submenu: radios(Object.entries(appearance.COLORS), (k) => s.color === k, appearance.setColor),
    },
    { type: 'separator' },
    check("O'zi harakat qilsin", s.autoWalk, (on) => {
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
      label: "O'lcham",
      submenu: radios(Object.entries(SIZE_LABELS), (k) => s.size === k, win.setSize),
    },
    {
      label: 'Dam olish eslatmasi',
      submenu: radios(
        BREAK_OPTIONS.map((m) => [m, m ? `Har ${m} daqiqada` : "O'chiq"]),
        (m) => s.breakMinutes === m,
        (m) => {
          s.breakMinutes = m;
          activity.resetBreakTimer();
          settings.save();
        },
      ),
    },
    { label: `Eslatmalar (${require('./reminders').pendingCount()})...`, click: () => require('./reminders').open() },
    // dasturlash rejimida ma'nosi yo'q
    check('Windows bilan birga ishga tushsin', getAutoStart(), setAutoStart, app.isPackaged),
    { type: 'separator' },
    { label: `Versiya ${app.getVersion()}`, enabled: false },
    { label: 'Chiqish', click: () => app.quit() },
  ];
}

function refreshTray() {
  if (!ctx.tray) return;
  ctx.tray.setContextMenu(Menu.buildFromTemplate(template()));
}

function popup() {
  if (C.alive()) Menu.buildFromTemplate(template()).popup({ window: ctx.win });
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

Object.assign(module.exports, { createTray, refreshTray, popup });
