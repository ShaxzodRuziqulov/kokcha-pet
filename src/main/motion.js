// Harakat: yurish, o'tirish, yotish, sakrash, yiqilish, oynalar ustida yurish, devorga tirmashish.
// Bir vaqtda faqat bitta harakat (ctx.motion) bo'ladi.

const { powerMonitor } = require('electron');
const C = require('./context');
const { createSurfaceFinder } = require('./surfaces');

const { ctx } = C;

const WALK_SPEED = 2;          // har qadamda necha piksel
const TICK_MS = 20;
const CLIMB_SPEED = 2;         // devorga tirmashish tezligi
const PERCH_TICK_MS = 80;      // oyna ustida turganda oyna holatini tekshirish
const JUMP_REACH = 520;        // qanchalik balandga sakray oladi (o'rta o'lchamda)
const FOOT_HALF = 40;          // oyoqlar kengligining yarmi — qirradan yiqilmaslik uchun
const LEDGE_DROP = 20;         // chekkada o'tirganda oyna shuncha pastga tushadi (oyoqlar osilib turadi)
const PAUSE_MS = 3000;         // yozishdan shuncha to'xtasangiz — gapirsa bo'ladi

let timer = null;
let wantClimb = false;         // devorga yetganda tirmashsin
let getSurfaces = null;        // surfaces.js
let dragSamples = null;
const THROW_WINDOW_MS = 120;

// Faqat qo'yib yuborish oldidagi harakat: uzoq sudrash va oxirida to'xtash jahl emas.
function beginDrag(cursor, now = performance.now()) {
  dragSamples = [{ x: cursor.x, y: cursor.y, t: now }];
}

function sampleDrag(cursor, now = performance.now()) {
  if (!dragSamples) return;
  dragSamples.push({ x: cursor.x, y: cursor.y, t: now });
  dragSamples = dragSamples.filter(p => now - p.t <= THROW_WINDOW_MS).slice(-32);
}

function finishDrag(cursor, now = performance.now()) {
  if (!dragSamples) return;
  const last = dragSamples[dragSamples.length - 1];
  if (now - last.t > 100) { dragSamples = null; return; }
  sampleDrag(cursor, now);
  const first = dragSamples[0];
  dragSamples = null;
  const elapsed = now - first.t;
  if (elapsed < 30 || elapsed > THROW_WINDOW_MS || !C.alive()) return;
  const distance = Math.hypot(cursor.x - first.x, cursor.y - first.y) / C.scale();
  const speed = Math.round(distance * 1000 / elapsed);
  if (distance < 35 || speed < 700) return;
  require('./persona').thrown();
  C.send('mood', { mood: 'angry', level: speed >= 2200 ? 3 : speed >= 1400 ? 2 : 1 });
}

function init(nativeHandle) {
  getSurfaces = createSurfaceFinder(nativeHandle);
}

const canClimb = () => !!getSurfaces;

// ---- Umumiy ----
function stopMotion() {
  if (timer) clearInterval(timer);
  timer = null;
  const was = ctx.motion;
  ctx.motion = null;
  if (was === 'walk') {
    wantClimb = false;
    if (ctx.state === 'walk') {
      C.setState('idle');
      C.rememberPosition();
    }
  }
}

function stopWalk() {
  if (ctx.motion === 'walk') stopMotion();
}

function setPose(next, side = null) {
  if (!C.alive()) return;
  // Chekkada o'tirganda oyna biroz pastga tushadi — oyoqlari qirradan osilib turadi
  const drop = Math.round((ctx.settings.character === 'chibi-girl' ? 46 : LEDGE_DROP) * C.scale());
  if (ctx.pose === 'ledge' && next !== 'ledge') {
    const [x, y] = ctx.win.getPosition();
    C.placeAt(x, y - drop);
  } else if (next === 'ledge' && ctx.pose !== 'ledge') {
    const [x, y] = ctx.win.getPosition();
    C.placeAt(x, y + drop);
  }
  ctx.pose = next;
  ctx.side = side;
  C.sendState();
}

// Harakat paytida gapirib qo'yadi (jim rejimda va siz yozayotganingizda — yo'q)
function chatter(kind, chance = 0.5) {
  if (ctx.settings.quiet || ctx.state === 'sleep' || Math.random() > chance) return;
  if (powerMonitor.getSystemIdleTime() * 1000 < PAUSE_MS) return;
  C.send('say', kind);
}

const centerX = () => ctx.win.getPosition()[0] + C.winW() / 2;
const feetY = () => ctx.win.getPosition()[1] + C.winH();

// Tana qirrasi oyna markazidan qancha uzoqda (personaj qutisi ichida tana ~26 px ichkarida)
const bodyHalf = () => (C.petSize() / 2 - 26) * C.scale();

// Tana ekrandan chiqmasin (oynaning shaffof qismi chiqib tursa mayli)
function clampBodyX(x, wa) {
  const half = C.winW() / 2;
  const cx = Math.min(Math.max(x + half, wa.x + bodyHalf()), wa.x + wa.width - bodyHalf());
  return cx - half;
}

// ---- Sirtlar: yer (taskbar ustida) va oynalarning yuqori qirralari ----
function usableSurfaces() {
  if (!getSurfaces || !ctx.settings.climb) return [];
  const petH = C.petSize() * C.scale();
  return getSurfaces().filter((sf) => {
    const wa = C.workAreaAt((sf.x1 + sf.x2) / 2, sf.y + 1);
    return sf.y - petH >= wa.y               // personaj ekran tepasidan chiqib ketmasin
      && sf.y < wa.y + wa.height - 40         // yerga juda yaqin emas
      && sf.x2 - sf.x1 >= 2 * FOOT_HALF * C.scale() + 10;
  });
}

// cx nuqtadan pastdagi eng yaqin sirt; hech narsa bo'lmasa — yer
function landingBelow(cx, fy) {
  const wa = C.workAreaAt(cx, fy - 1);
  let best = { ground: true, y: wa.y + wa.height, x1: wa.x, x2: wa.x + wa.width };
  for (const sf of usableSurfaces()) {
    if (cx >= sf.x1 && cx <= sf.x2 && sf.y >= fy - 3 && sf.y < best.y) best = sf;
  }
  return best;
}

function land(target, hard) {
  ctx.perch = target.ground ? null : { ...target };
  setPose('stand');
  if (hard) C.send('landed');
  C.rememberPosition();
  if (hard && ctx.perch) chatter('perch', 0.35);
}

// ---- Yiqilish (gravitatsiya) ----
function fall() {
  if (!C.alive()) return;
  stopMotion();
  if (ctx.pose !== 'stand') setPose('stand');
  const [x0, y0] = ctx.win.getPosition();
  const x = clampBodyX(x0, C.currentWorkArea());
  const target = landingBelow(x + C.winW() / 2, y0 + C.winH());
  const ty = target.y - C.winH();

  if (y0 >= ty - 2) {
    C.placeAt(x, ty);
    land(target, false);
    return;
  }

  ctx.motion = 'fall';
  setPose('fall');
  let y = y0;
  let vy = 0;
  timer = setInterval(() => {
    if (!C.alive()) return stopMotion();
    vy = Math.min(vy + 1.6, 40);
    y = Math.min(y + vy, ty);
    C.placeAt(x, y);
    if (y >= ty) {
      stopMotion();
      land(target, y - y0 > 30);
    }
  }, 16);
}

// ---- Yurish ----
function walkBounds() {
  if (ctx.perch) {
    const f = FOOT_HALF * C.scale();
    return { min: ctx.perch.x1 + f, max: ctx.perch.x2 - f, ledge: true };
  }
  const wa = C.currentWorkArea();
  // Devorga tirmashmoqchi bo'lsa — tanasi devorga tekkuncha boradi
  const m = wantClimb ? bodyHalf() : C.winW() / 2;
  return { min: wa.x + m, max: wa.x + wa.width - m, ledge: false };
}

function startWalk(dir) {
  if (ctx.state !== 'idle' || ctx.motion || ctx.dragging || ctx.hovering || Date.now() < ctx.danceUntil) return;
  if (!C.alive() || !ctx.win.isVisible()) return;
  if (ctx.pose !== 'stand') setPose('stand');
  ctx.walkDir = dir || (Math.random() < 0.5 ? -1 : 1);
  ctx.motion = 'walk';
  C.setState('walk');

  let stepsLeft = wantClimb ? Infinity : Math.round((3000 + Math.random() * 4000) / TICK_MS);

  timer = setInterval(() => {
    if (!C.alive() || ctx.dragging || ctx.hovering) return stopWalk();

    const [x, y] = ctx.win.getPosition();
    const b = walkBounds();
    const cx = x + C.winW() / 2 + ctx.walkDir * WALK_SPEED;
    // Faqat chetga qarab yurayotgan bo'lsa (aks holda chetda titrab qoladi)
    if ((ctx.walkDir < 0 && cx < b.min) || (ctx.walkDir > 0 && cx > b.max)) return onEdge(b);
    C.placeAt(x + ctx.walkDir * WALK_SPEED, y);

    if (--stepsLeft <= 0) stopWalk();
  }, TICK_MS);
}

// Chetga yetdi. Yerda — buriladi yoki devorga tirmashadi.
// Oyna ustida — buriladi, chekkada oyog'ini osiltirib o'tiradi yoki sakrab tushadi.
function onEdge(b) {
  if (!b.ledge) {
    if (wantClimb) return startClimb(ctx.walkDir > 0 ? 'right' : 'left');
    ctx.walkDir *= -1;
    return C.sendState();
  }
  const r = Math.random();
  if (r < 0.45) {
    ctx.walkDir *= -1;
    return C.sendState();
  }
  stopWalk();
  if (r < 0.75) {
    setPose('ledge');
    chatter('ledge', 0.4);
    return;
  }
  const [x, y] = ctx.win.getPosition();
  C.placeAt(x + ctx.walkDir * FOOT_HALF * C.scale() * 1.4, y);
  ctx.perch = null;
  chatter('drop', 0.4);
  fall();
}

// ---- Sakrash (yaqindagi oyna ustiga) ----
function findJumpTarget() {
  const s = C.scale();
  const cx = centerX();
  const fy = feetY();
  const f = FOOT_HALF * s;
  const options = [];
  for (const sf of usableSurfaces()) {
    const up = fy - sf.y;
    if (up < 60 * s || up > JUMP_REACH * s) continue;
    const lx = Math.min(Math.max(cx, sf.x1 + f), sf.x2 - f);
    if (Math.abs(lx - cx) > 380 * s) continue;
    options.push({ surface: sf, x: lx });
  }
  return options.length ? options[Math.floor(Math.random() * options.length)] : null;
}

function jumpTo(target, landX) {
  stopMotion();
  const [x0, y0] = ctx.win.getPosition();
  const x1 = landX - C.winW() / 2;
  const y1 = target.y - C.winH();
  ctx.walkDir = x1 >= x0 ? 1 : -1;
  setPose('jump');
  ctx.motion = 'jump';

  // Kvadrat egri chiziq: o'rtasida eng baland nuqta (top) bo'ladi
  const top = Math.min(y0, y1) - 60 * C.scale();
  const c = 2 * top - (y0 + y1) / 2;
  const T = 650 + Math.abs(y1 - y0) * 0.6;
  const t0 = Date.now() + 250; // avval cho'kkalab oladi
  timer = setInterval(() => {
    if (!C.alive()) return stopMotion();
    const t = Math.min(1, Math.max(0, (Date.now() - t0) / T));
    if (t === 0) return;
    C.placeAt(x0 + (x1 - x0) * t, (1 - t) ** 2 * y0 + 2 * (1 - t) * t * c + t ** 2 * y1);
    if (t >= 1) {
      stopMotion();
      land(target, true);
    }
  }, 16);
}

// ---- Devorga tirmashish ----
// Ekran chetiga tirmashadi. Devorga tegib turgan oyna bo'lsa — uning ustiga chiqib oladi,
// bo'lmasa biroz osilib turib, pastga tushib ketadi.
function startClimb(wallSide) {
  stopMotion();
  ctx.perch = null;
  const s = C.scale();
  const wa = C.currentWorkArea();
  const right = wallSide === 'right';
  const wallX = right ? wa.x + wa.width : wa.x;
  const x = (right ? wallX - bodyHalf() : wallX + bodyHalf()) - C.winW() / 2;
  let y = ctx.win.getPosition()[1];
  setPose('climb', wallSide);
  C.placeAt(x, y);

  const fy0 = y + C.winH();
  const edge = 40 * s;
  const goal = usableSurfaces()
    .filter((sf) => (right ? sf.x2 >= wallX - edge : sf.x1 <= wallX + edge) && sf.y < fy0 - 40 * s)
    .sort((a, b) => b.y - a.y)[0]; // eng yaqini
  const highest = wa.y + C.petSize() * s + 20;
  const stopFeet = goal ? goal.y : Math.max(highest, fy0 - (200 + Math.random() * 250) * s);

  ctx.motion = 'climb';
  chatter('climb', 0.4);
  timer = setInterval(() => {
    if (!C.alive() || ctx.dragging) return stopMotion();
    y -= CLIMB_SPEED;
    C.placeAt(x, y);
    if (y + C.winH() > stopFeet) return;
    stopMotion();
    if (goal) climbOnto(goal, right);
    else hang(wallSide);
  }, TICK_MS);
}

function climbOnto(goal, right) {
  const f = FOOT_HALF * C.scale() * 1.5;
  const wa = C.currentWorkArea();
  const cx = right ? Math.min(goal.x2, wa.x + wa.width) - f : Math.max(goal.x1, wa.x) + f;
  C.placeAt(cx - C.winW() / 2, goal.y - C.winH());
  ctx.walkDir = right ? -1 : 1;
  land(goal, true);
  chatter('perch', 0.6);
}

function hang(wallSide) {
  ctx.motion = 'hang';
  setPose('hang', wallSide);
  chatter('hang', 0.6);
  timer = setTimeout(() => {
    timer = null;
    ctx.motion = null;
    chatter('drop', 0.5);
    fall();
  }, 2500 + Math.random() * 2000);
}

// ---- Oyna ustida turish ----
// Oyna surilsa — birga ko'chadi. Yopilsa, yig'ilsa, to'liq ekranga yoyilsa
// yoki ustini boshqa oyna yopsa — yiqilib tushadi.
function trackPerch() {
  setInterval(() => {
    if (!C.alive() || !ctx.perch || ctx.dragging || !ctx.win.isVisible()) return;
    if (ctx.motion === 'fall' || ctx.motion === 'jump' || ctx.motion === 'climb') return;

    const mine = usableSurfaces().filter((sf) => sf.hwnd === ctx.perch.hwnd);
    if (!mine.length) return dropFromPerch();

    const dx = mine[0].left - ctx.perch.left;
    const dy = mine[0].y - ctx.perch.y;
    const [x, y] = ctx.win.getPosition();
    if (dx || dy) C.placeAt(x + dx, y + dy);

    const cx = x + dx + C.winW() / 2;
    const seg = mine.find((sf) => cx >= sf.x1 && cx <= sf.x2);
    if (!seg) return dropFromPerch();
    ctx.perch = { ...seg };
  }, PERCH_TICK_MS);
}

function dropFromPerch() {
  ctx.perch = null;
  fall();
}

// ---- O'zi nima qilishni tanlaydi ----
function scheduleBehavior() {
  setTimeout(() => {
    try {
      if (ctx.settings.autoWalk) decide();
    } catch {
      /* keyingi safar */
    }
    scheduleBehavior();
  }, 6000 + Math.random() * 8000);
}

function decide() {
  if (ctx.state !== 'idle' || ctx.motion || ctx.dragging || ctx.hovering || Date.now() < ctx.danceUntil) return;
  if (!C.alive() || !ctx.win.isVisible()) return;
  wantClimb = false;

  // O'tirgan yoki yotgan bo'lsa — ko'pincha shu holatda biroz qoladi
  if (ctx.pose === 'sit' || ctx.pose === 'lie' || ctx.pose === 'ledge') {
    if (Math.random() < 0.45) setPose('stand');
    return;
  }

  const r = Math.random();
  if (ctx.settings.climb && getSurfaces) {
    if (r < 0.15) {
      const t = findJumpTarget();
      if (t) {
        chatter('jump', 0.3);
        return jumpTo(t.surface, t.x);
      }
    } else if (r < 0.22 && !ctx.perch) {
      wantClimb = true;
      const wa = C.currentWorkArea();
      return startWalk(centerX() > wa.x + wa.width / 2 ? 1 : -1);
    }
  }
  if (r < 0.65) return startWalk();
  if (r < 0.85) {
    setPose('sit');
    return chatter('sit', 0.3);
  }
  setPose('lie');
  chatter('lie', 0.3);
}

// ---- Boshlash ----
function start() {
  trackPerch();
  scheduleBehavior();
}

Object.assign(module.exports, {
  init,
  start,
  canClimb,
  stopMotion,
  stopWalk,
  setPose,
  fall,
  startWalk,
  jumpTo,
  startClimb,
  findJumpTarget,
  usableSurfaces,
  decide,
  beginDrag,
  sampleDrag,
  finishDrag,
});
