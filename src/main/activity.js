// Foydalanuvchi faolligi: uyqu va uyg'onish, dam olish eslatmasi, o'zi gapirishi,
// kursor (ustidami, Ctrl, silash, ko'zlar kursorga qaraydi)

const { powerMonitor, screen } = require('electron');
const C = require('./context');
const settings = require('./settings');
const motion = require('./motion');
const native = require('./native');

const { ctx } = C;

const SLEEP_AFTER_MS = 3 * 60 * 1000;  // klaviatura va sichqoncha shuncha tinch tursa — uxlaydi
const BREAK_RESET_MS = 5 * 60 * 1000;  // shuncha dam olsangiz, eslatma hisobi noldan boshlanadi
const AWAY_MS = 20 * 60 * 1000;        // shuncha yo'q bo'lsangiz, qaytganingizda kutib oladi
const RANDOM_CHAT_MS = 8 * 60 * 1000;  // o'zi gapirishi oralig'i (taxminan)
const PAUSE_MS = 3000;                 // yozishdan shuncha to'xtasangiz — gapirsa bo'ladi
const CURSOR_TICK_MS = 40;

let workStart = Date.now();            // dam olish eslatmasi hisobi
let nextChat = Date.now() + RANDOM_CHAT_MS;
let prevIdleMs = 0;
let capturing = false;                 // oyna sichqonchani ushlayaptimi
let ghost = false;                     // Ctrl bosilgan: personaj shaffof, orqasini bosish mumkin
let lastLook = '';
const petTrack = { lastX: null, dir: 0, flips: [], cooldownUntil: 0 }; // silashni aniqlash

// ---- Uyqu ----
function goToSleep(manual = false) {
  motion.stopWalk();
  ctx.manualSleep = manual;
  // Devorda bo'lsa — avval tushadi; turgan bo'lsa — ba'zan yotib uxlaydi
  if (ctx.pose === 'climb' || ctx.pose === 'hang') motion.fall();
  else if (!ctx.motion && ctx.pose === 'stand' && Math.random() < 0.5) ctx.pose = 'lie';
  C.setState('sleep');
}

function wakeUp(reason) {
  if (ctx.state !== 'sleep') return;
  ctx.manualSleep = false;
  if (ctx.pose === 'lie' || ctx.pose === 'sit') ctx.pose = 'stand';
  C.setState('idle');
  C.send('woke', { reason }); // renderer gap pufakchasini ko'rsatadi
}

function resetBreakTimer() {
  workStart = Date.now();
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
        const reason = ctx.settings.lastSeenDay !== today ? 'morning' : 'back';
        ctx.settings.lastSeenDay = today;
        settings.save();
        if (ctx.state === 'sleep' && !ctx.manualSleep) wakeUp(reason);
        else if (ctx.state !== 'sleep') C.send('welcome', reason);
      } else if (ctx.state === 'sleep' && !ctx.manualSleep) {
        wakeUp('idle'); // foydalanuvchi qaytdi — o'zi uxlab qolgan bo'lsa uyg'onadi
      }
    } else if (ctx.state !== 'sleep' && idleMs > SLEEP_AFTER_MS) {
      goToSleep(false);
    }
    prevIdleMs = idleMs;

    const canTalk = ctx.state !== 'sleep' && C.alive() && ctx.win.isVisible();
    const paused = idleMs >= PAUSE_MS; // yozayotgan paytingizda gapirmaydi

    // Dam olish eslatmasi: faqat uzluksiz ishlagan vaqt sanaladi.
    // Yozishdan to'xtashingizni kutadi, lekin 2 daqiqadan ortiq kechiktirmaydi.
    if (idleMs >= BREAK_RESET_MS) {
      workStart = now;
    } else if (ctx.settings.breakMinutes > 0 && canTalk) {
      const due = now - workStart - ctx.settings.breakMinutes * 60 * 1000;
      if (due >= 0 && (paused || due > 2 * 60 * 1000)) {
        C.send('say', 'break');
        workStart = now;
      }
    }

    // O'zi gapirishi: faqat siz to'xtab turganingizda, jim rejimda emas
    if (now >= nextChat && canTalk && ctx.state === 'idle' && paused && idleMs < SLEEP_AFTER_MS) {
      if (!ctx.settings.quiet) C.send('say', 'random');
      nextChat = now + RANDOM_CHAT_MS * (0.75 + Math.random() * 0.5);
    }
  }, 1000);
}

// Kursor personaj ustida u yoq-bu yoqqa yurgizilsa — "silash"
function trackPetting(c, now) {
  if (!ctx.hovering || ctx.dragging || ghost) {
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
    require('./persona').petted();
    C.send('petted');
    petTrack.flips = [];
    petTrack.cooldownUntil = now + 1200;
  }
}

function trackCursor() {
  setInterval(() => {
    if (!C.alive() || !ctx.win.isVisible()) return;
    const c = screen.getCursorScreenPoint();
    const r = C.petRect();
    const now = Date.now();

    if (!ctx.dragging) {
      const over = c.x >= r.x && c.x < r.x + r.w && c.y >= r.y && c.y < r.y + r.h;
      const nextGhost = over && native.isCtrlDown(); // Ctrl — orqadagi narsani bosish uchun
      // Tugmali gap bulutchasi ham sichqonchani ushlaydi (personajni "silash" hisoblanmaydi)
      const [wx, wy] = ctx.win.getPosition(), h = ctx.hitArea;
      const overBubble = !!h && c.x >= wx + h.x && c.x < wx + h.x + h.w && c.y >= wy + h.y && c.y < wy + h.y + h.h;
      const nextCapture = (over && !nextGhost) || overBubble;

      if (over !== ctx.hovering) {
        ctx.hovering = over;
        C.send('hover', over);
        if (over) motion.stopWalk();
      }
      if (nextGhost !== ghost) {
        ghost = nextGhost;
        C.send('ghost', ghost);
      }
      if (nextCapture !== capturing) {
        capturing = nextCapture;
        ctx.win.setIgnoreMouseEvents(!capturing);
      }
    }

    trackPetting(c, now);

    if (ctx.state !== 'sleep') {
      const dx = c.x - (r.x + r.w / 2);
      const dy = c.y - (r.y + r.h / 2);
      const key = `${Math.round(dx / 6)},${Math.round(dy / 6)}`;
      if (key !== lastLook) {
        lastLook = key;
        C.send('look', { dx, dy });
      }
    }
  }, CURSOR_TICK_MS);
}

function start() {
  watchActivity();
  trackCursor();
}

Object.assign(module.exports, { start, goToSleep, wakeUp, resetBreakTimer });
