// Sozlamalarni saqlash va yuklash (%APPDATA%/kokcha-desktop-pet/settings.json)

const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const { ctx, SIZES } = require('./context');

const DEFAULTS = {
  autoWalk: true,     // o'zi harakat qilsin
  climb: true,        // oynalar ustiga chiqsin, devorga tirmashsin
  quiet: false,
  size: 'medium',
  breakMinutes: 45,
  position: null,
  character: null,    // chibi-girl | kokcha | custom (cat/dog/penguin 1.8.0 da olib tashlangan)
  chibiIntroduced: false, // standart Ko'kcha yangi qiyofaga bir marta o'tadi
  color: 'original',
  customImage: null,  // "O'z rasmim" — userData ichidagi nusxa
  onboarded: false,   // birinchi ochilishdagi tanishtirish ko'rsatilganmi
  lastSeenDay: null,  // "xayrli tong" kuniga bir marta
  reminders: [],     // bir martalik eslatmalar, vaqt epoch ms
  persona: null,     // Midori asosiy fe'li: { id, since, nextAt }; vaqtlar epoch ms
};

let timer = null;

const file = () => path.join(app.getPath('userData'), 'settings.json');

function load() {
  let s;
  try {
    s = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file(), 'utf8')) };
  } catch {
    s = { ...DEFAULTS };
  }
  if (!SIZES[s.size]) s.size = DEFAULTS.size;
  s.reminders = require('./reminders').normalize(s.reminders);
  s.persona = require('./persona').normalize(s.persona);
  ctx.settings = s;
}

function save(now = false) {
  clearTimeout(timer);
  const write = () => {
    try {
      fs.writeFileSync(file(), JSON.stringify(ctx.settings, null, 2));
      return true;
    } catch {
      /* muhim emas */
      return false;
    }
  };
  if (now) return write();
  else timer = setTimeout(write, 500);
}

Object.assign(module.exports, { DEFAULTS, load, save });
