// Kokcha — desktop pet (asosiy jarayon, kirish nuqtasi)
//
// Modullar (src/main):
//   context     — umumiy holat va geometriya yordamchilari
//   settings    — sozlamalarni saqlash
//   window      — personaj oynasi, ko'rinish, o'lcham
//   appearance  — personajlar, ranglar, "O'z rasmim"
//   motion      — yurish, sakrash, yiqilish, oynalar ustida yurish, tirmashish
//   surfaces    — ochiq oynalarning qirralarini topish (Windows)
//   activity    — uyqu, eslatmalar, kursor, silash
//   native      — to'liq ekran va Ctrl'ni aniqlash (Windows)
//   menu        — tray va o'ng tugma menyusi
//   updater     — avtomatik yangilanish
//   ipc         — renderer bilan aloqa

const { app, Menu, screen } = require('electron');
const C = require('./src/main/context');
const settings = require('./src/main/settings');
const win = require('./src/main/window');
const appearance = require('./src/main/appearance');
const motion = require('./src/main/motion');
const activity = require('./src/main/activity');
const native = require('./src/main/native');
const menu = require('./src/main/menu');
const updater = require('./src/main/updater');
const ipc = require('./src/main/ipc');
const shortcuts = require('./src/main/shortcuts');
const reminders = require('./src/main/reminders');

const { ctx } = C;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  // Ikkinchi marta ochishga urinilsa — mavjud personaj "men shu yerdaman" deydi
  app.on('second-instance', () => {
    win.setUserHidden(false);
    if (ctx.state === 'sleep') activity.wakeUp('click');
    else C.send('say', 'here');
  });

  app.whenReady().then(() => {
    Menu.setApplicationMenu(null); // Ctrl+/- kabi standart zoom tugmalari o'chadi
    settings.load();
    appearance.normalize();
    ctx.settings.lastSeenDay = new Date().toDateString();
    settings.save();

    ipc.register();
    const w = win.create();
    w.webContents.once('did-finish-load', () => reminders.start());
    native.init();
    motion.init(w.getNativeWindowHandle());
    menu.createTray();
    shortcuts.register();

    native.watchFullscreen();
    activity.start();
    motion.start();
    updater.start();

    for (const ev of ['display-added', 'display-removed', 'display-metrics-changed']) {
      screen.on(ev, () => setTimeout(win.snapToGround, 300)); // taskbar joylashib olishini kutamiz
    }

    // Faqat sinov uchun: KOKCHA_DEBUG=1 bilan harakatlarni tashqaridan boshqarish
    if (process.env.KOKCHA_DEBUG) {
      global.kokchaDebug = {
        ...motion,
        placeAt: C.placeAt,
        info: () => ({
          state: ctx.state,
          pose: ctx.pose,
          side: ctx.side,
          motion: ctx.motion,
          perch: ctx.perch,
          pos: ctx.win.getPosition(),
          size: [C.winW(), C.winH()],
          wa: C.currentWorkArea(),
        }),
      };
    }
  });

  app.on('before-quit', () => {
    shortcuts.unregister();
    C.rememberPosition();
    settings.save(true);
  });
  app.on('window-all-closed', () => app.quit());
}
