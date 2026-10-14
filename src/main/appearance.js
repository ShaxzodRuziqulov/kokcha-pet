// Personaj ko'rinishi: tayyor personajlar, ranglar va "O'z rasmim" (tekshirish, qirqish, nusxalash)

const { app, dialog, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { ctx, send } = require('./context');
const settings = require('./settings');
const menu = require('./menu');
const win = require('./window');
const activity = require('./activity');

// Tayyor personajlar (ko'rinishi — renderer/characters.js) va ranglar (renderer/style.css)
const CHARACTERS = { 'chibi-girl': 'Yashil qizcha', kokcha: "Ko'kcha", cat: 'Mushukcha', dog: 'Kuchukcha', penguin: 'Pingvin' };
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
const SPRITE_EXTS = ['png', 'gif', 'webp'];
const MAX_IMAGE_PX = 600; // bundan kattasi kichraytiriladi (ekranda ~150–400 px bo'ladi)

// Har holat uchun alohida rasmlar (idle/walk/sleep/talk) qo'yiladigan papka:
//  - dasturlash rejimida: assets/custom/
//  - portable exe:        exe yonidagi custom/ (portable o'zini Temp'ga ochadi — asl joyi PORTABLE_EXECUTABLE_DIR)
//  - o'rnatilgan dastur:  %APPDATA%/kokcha-desktop-pet/custom/ (yangilanishda o'chib ketmaydi)
function customDir() {
  if (!app.isPackaged) return path.join(app.getAppPath(), 'assets', 'custom');
  if (process.env.PORTABLE_EXECUTABLE_DIR) return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'custom');
  return path.join(app.getPath('userData'), 'custom');
}

function fileUrl(p) {
  // ?v= — rasm almashtirilganda eski nusxa keshdan chiqmasligi uchun
  return `${pathToFileURL(p).href}?v=${Math.round(fs.statSync(p).mtimeMs)}`;
}

function findCustomSprites() {
  const dir = customDir();
  const sprites = {};
  for (const s of ['idle', 'walk', 'sleep', 'talk']) {
    for (const ext of SPRITE_EXTS) {
      const p = path.join(dir, `${s}.${ext}`);
      if (fs.existsSync(p)) {
        sprites[s] = fileUrl(p);
        break;
      }
    }
  }
  return sprites;
}

// Yuklangan sozlamalarni tekshiradi (eski versiyalardan qolganlarini ham)
function normalize() {
  const s = ctx.settings;
  if (!COLORS[s.color]) s.color = 'original';
  if (!CHARACTERS[s.character] && s.character !== 'custom') {
    // Avval custom/ papkaga rasm qo'yganlar uchun — o'sha rasm qoladi
    s.character = findCustomSprites().idle ? 'custom' : 'chibi-girl';
  }
  // Eski standart Ko'kcha bir marta yangi qiyofaga o'tadi; keyingi tanlov eslab qolinadi.
  if (!s.chibiIntroduced) {
    if (s.character === 'kokcha') s.character = 'chibi-girl';
    s.chibiIntroduced = true;
  }
}

function current() {
  let character = ctx.settings.character;
  let sprites = {};
  if (character === 'chibi-girl') {
    const image = path.join(app.getAppPath(), 'src', 'renderer', 'chibi', 'standing.png');
    if (fs.existsSync(image)) sprites.idle = fileUrl(image);
    else character = 'kokcha';
  }
  if (character === 'custom') {
    sprites = findCustomSprites();
    const img = ctx.settings.customImage;
    if (img && fs.existsSync(img)) sprites.idle = fileUrl(img);
    if (!sprites.idle) {
      character = 'kokcha'; // rasm topilmasa — Ko'kcha
      sprites = {};
    }
  }
  const name = character === 'custom' ? CUSTOM_NAME : CHARACTERS[character];
  return { character, color: ctx.settings.color, sprites, name };
}

function apply(change, report = null) {
  const a = current();
  send('appearance', { ...a, change, report });
  if (ctx.tray) ctx.tray.setToolTip(a.name);
  settings.save();
  menu.refreshTray();
}

function setCharacter(character) {
  ctx.settings.character = character;
  apply('character');
}

function setColor(color) {
  ctx.settings.color = color;
  apply('color');
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
  win.setUserHidden(false);
  if (ctx.state === 'sleep') activity.wakeUp('click');
  send('say', 'image-tips');

  const res = await dialog.showOpenDialog({
    title: 'Personaj uchun rasm tanlang — eng yaxshisi foni shaffof PNG',
    properties: ['openFile'],
    filters: [{ name: 'Rasmlar (PNG, GIF, WebP, JPG)', extensions: IMAGE_EXTS }],
  });
  if (res.canceled || !res.filePaths.length) {
    send('say', 'image-cancel');
    return menu.refreshTray();
  }

  const dir = app.getPath('userData');
  try {
    // Avval yangisini tayyorlaymiz — xato bo'lsa, eski rasm o'z joyida qoladi
    const { dest: tmp, report } = prepareImage(res.filePaths[0], path.join(dir, 'my-pet-new'));
    for (const e of IMAGE_EXTS) fs.rmSync(path.join(dir, `my-pet.${e}`), { force: true });
    const dest = path.join(dir, `my-pet${path.extname(tmp)}`);
    fs.renameSync(tmp, dest);
    ctx.settings.customImage = dest;
    ctx.settings.character = 'custom';
    apply('custom', report);
  } catch (err) {
    send('say', 'image-error');
    dialog.showErrorBox("Rasmni o'rnatib bo'lmadi", String(err.message || err));
    menu.refreshTray();
  }
}

Object.assign(module.exports, {
  CHARACTERS,
  COLORS,
  normalize,
  current,
  setCharacter,
  setColor,
  chooseImage,
  prepareImage,
});
