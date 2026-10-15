// Midori fe'li: diskdagi asosiy navbat va faqat shu sessiyadagi qisqa hodisa holati.
const { powerMonitor } = require('electron');
const C = require('./context');
const settings = require('./settings');

const ORDER = Object.freeze(['cheerful', 'shy', 'tsundere', 'playful']);
const LABELS = Object.freeze({ cheerful: 'Quvnoq', shy: 'Uyatchan', tsundere: 'Qaysar', playful: "Sho'x" });
const MIN_MS = 3 * 60 * 60 * 1000, MAX_MS = 4 * 60 * 60 * 1000;
const EVENT_MS = 2 * 60 * 1000, PET_WINDOW_MS = 20000, PET_COUNT = 4;
let timer = null, running = false, temporary = null, petTimes = [];
let selected = null, lastId = null;

const interval = () => MIN_MS + Math.floor(Math.random() * (MAX_MS - MIN_MS + 1));
const record = (id, now) => ({ id, since: now, nextAt: now + interval() });

function normalize(value, now = Date.now()) {
  const id = ORDER.includes(value?.id) ? value.id : ORDER[0];
  if (!ORDER.includes(value?.id) || !Number.isSafeInteger(value.since) || value.since < 0 || value.since > now) {
    return record(id, now);
  }
  const span = value.nextAt - value.since;
  const nextAt = Number.isSafeInteger(value.nextAt) && span >= MIN_MS && span <= MAX_MS
    ? value.nextAt : value.since + interval();
  return { id, since: value.since, nextAt };
}

// appearance modulini faqat chaqiruv paytida olamiz: aylanma import ishga tushmaydi.
const character = () => require('./appearance').current().character;
const isMidori = () => (selected ?? character()) === 'chibi-girl';
const base = () => C.ctx.settings.persona;

function current(reason = 'start') {
  return { id: isMidori() ? (temporary?.id || base()?.id || ORDER[0]) : 'curious', reason };
}

function publish(reason, force = false) {
  const payload = current(reason);
  const changed = payload.id !== lastId;
  lastId = payload.id;
  if (changed || force) C.send('persona', payload);
  if (changed) require('./menu').refreshTray();
}

function schedule() {
  clearTimeout(timer); timer = null;
  if (!running) return;
  const nextAt = Math.min(base().nextAt, temporary?.until ?? Infinity);
  timer = setTimeout(() => { timer = null; reconcile(); }, Math.max(1, nextAt - Date.now()));
  timer.unref?.();
}

function reconcile(notify = true) {
  if (!running) return;
  const now = Date.now();
  const expired = temporary && (temporary.until <= now || temporary.until > now + EVENT_MS) ? temporary : null;
  if (expired) temporary = null;
  let changed = false;
  if (base().since > now) {
    // Tizim vaqti orqaga o'zgarsa, kelajakdagi muddatda qotib qolmasin.
    C.ctx.settings.persona = record(base().id, now); changed = true;
  } else if (base().nextAt <= now) {
    const next = ORDER[(ORDER.indexOf(base().id) + 1) % ORDER.length];
    // Ilova yopiq/OS uyquda o'tgan muddat uchun bitta yangi fe'l; gaplar navbati yig'ilmaydi.
    C.ctx.settings.persona = record(next, now); changed = true;
  }
  if (changed) settings.save();
  if (notify) publish(expired && expired.baseId === base().id ? 'event' : 'timer');
  schedule();
}

function stop() {
  running = false; clearTimeout(timer); timer = null;
  temporary = null; petTimes = []; selected = null; lastId = null;
  powerMonitor.removeListener('resume', onResume);
}

function onResume() { reconcile(); }

function start() {
  stop();
  C.ctx.settings.persona = normalize(C.ctx.settings.persona);
  selected = character(); running = true;
  reconcile(false); lastId = current().id;
  settings.save();
  powerMonitor.on('resume', onResume);
}

function initial() {
  reconcile(false);
  const payload = current('start'); lastId = payload.id;
  // Renderer qayta yuklanayotganda muddat o'tgan bo'lsa, tray radiosi ham shu holatni ko'rsatsin.
  require('./menu').refreshTray();
  return payload;
}

function appearanceChanged() {
  const next = character();
  if (next === selected) return;
  selected = next; temporary = null; petTimes = [];
  reconcile(false); publish('start', true);
}

function set(id) {
  if (!running || !isMidori() || !ORDER.includes(id)) return false;
  temporary = null; petTimes = [];
  C.ctx.settings.persona = record(id, Date.now());
  settings.save(); schedule(); publish('menu', true);
  return true;
}

function event(id) {
  if (!running || !isMidori()) return;
  reconcile(false);
  // Qayta silash/otish muddatni uzaytirsa ham, yashirin taymer almashuvi yo'qolmasin.
  temporary = { id, until: Date.now() + EVENT_MS, baseId: temporary?.baseId ?? base().id };
  schedule(); publish('event');
}

function thrown() {
  petTimes = [];
  event('tsundere');
}

function petted() {
  if (!running || !isMidori()) return;
  const now = Date.now();
  petTimes = petTimes.filter(time => time <= now && now - time <= PET_WINDOW_MS);
  petTimes.push(now);
  if (petTimes.length >= PET_COUNT) { petTimes = []; event('shy'); }
}

Object.assign(module.exports, { ORDER, LABELS, normalize, start, stop, initial, current,
  appearanceChanged, set, thrown, petted });
