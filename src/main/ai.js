// AI suhbat (Google Gemini, bepul kalit): kalit, suhbat oynasi va so'rovlar.
// Kalit faqat shu modulda; safeStorage (Windows DPAPI) bilan shifrlanib settings.json'da saqlanadi.
// Renderer'lar kalitni hech qachon ko'rmaydi — faqat "bor/yo'q".
const { BrowserWindow, ipcMain, net, safeStorage, shell } = require('electron');
const path = require('path');
const C = require('./context');
const settings = require('./settings');

// Avval eng tez/arzon model; u yo'qolib qolsa (404) — Google'ning "eng so'nggi Flash" taxallusi.
const MODELS = ['gemini-3.5-flash-lite', 'gemini-flash-latest'];
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
const TIMEOUT_MS = 25000;
const MAX_INPUT = 500, MAX_REPLY = 400, HISTORY_TURNS = 10;

let chatWin = null, running = false, activeRequest = null;
let history = []; // faqat shu sessiya: [{ role: 'user'|'model', text }]

// ---- Kalit ----
function readKey() {
  const stored = C.ctx.settings.aiKey;
  if (typeof stored !== 'string' || !stored || !safeStorage.isEncryptionAvailable()) return null;
  try { return safeStorage.decryptString(Buffer.from(stored, 'base64')); } catch { return null; }
}

const hasKey = () => Boolean(readKey());

function setKey(input) {
  const key = typeof input === 'string' ? input.trim() : '';
  // Eski "AIza…" va yangi "AQ.…" formatlari (nuqta bor)
  if (!/^[\w.-]{20,300}$/.test(key)) return { error: 'Kalit notoʻgʻri koʻrinyapti. AI Studio’dan nusxa olib qayta qoʻying.' };
  if (!safeStorage.isEncryptionAvailable()) return { error: 'Bu kompyuterda kalitni xavfsiz saqlab boʻlmaydi.' };
  const before = C.ctx.settings.aiKey;
  C.ctx.settings.aiKey = safeStorage.encryptString(key).toString('base64');
  if (!settings.save(true)) { C.ctx.settings.aiKey = before; return { error: 'Saqlab boʻlmadi. Diskdagi boʻsh joyni tekshiring.' }; }
  return { ok: true };
}

function clearKey() {
  cancelRequest();
  C.ctx.settings.aiKey = null;
  history = [];
  settings.save(true);
  return { ok: true };
}

// ---- Personaj xarakteri ----
const MOODS = {
  cheerful: 'Hozir kayfiyating quvnoq: iliq, xushchaqchaq, ragʻbatlantiruvchi.',
  shy: 'Hozir uyatchansan: biroz tortinchoq, yumshoq gapirasan, baʼzan "e-e…" deb qolasan.',
  tsundere: 'Hozir qaysarsan (tsundere): sirtdan "hmph, senga yordam bermoqchi emasman" deysan, lekin baribir gʻamxoʻrlik qilasan.',
  playful: 'Hozir shoʻxsan: hazilkash, erkalanib gapirasan, oʻyinqaroq.',
  curious: 'Sen qiziquvchansan: hamma narsani soʻraysan, hayratlanasan.',
};

function systemPrompt() {
  const { name } = require('./appearance').current();
  const mood = require('./persona').current().id;
  const now = new Date().toLocaleString('uz-Latn', { weekday: 'long', hour: '2-digit', minute: '2-digit' });
  return [
    `Sen ${name}san — foydalanuvchining Windows ish stolida yashaydigan kichkina yordamchi personaj (desktop pet).`,
    'Foydalanuvchi — sening egang va doʻsting. Unga "sen" deb murojaat qil.',
    MOODS[mood] || MOODS.cheerful,
    'Faqat oʻzbek tilida (lotin yozuvida, oʻ va gʻ harflari bilan) javob ber, agar foydalanuvchi boshqa tilda yozmasa.',
    'Javobing qisqa boʻlsin: 1–3 gap, kichik gap bulutchasiga sigʻadi. Markdown, roʻyxat va kod blokini ishlatma. 1 ta emoji qoʻyishing mumkin.',
    'Oʻzingni AI yoki til modeli deb atama — sen personajsan. Lekin bilmagan narsangni toʻqib chiqarma.',
    `Hozirgi vaqt: ${now}.`,
  ].join('\n');
}

// ---- So'rov ----
function errorText(status, body) {
  if (status === 400 && /api key/i.test(body)) return 'Kalit ishlamayapti. “Kalitni oʻchirish”ni bosib, toʻgʻri kalitni qayta kiriting.';
  if (status === 401 || status === 403) return 'Kalit ishlamayapti yoki ruxsat yoʻq. “Kalitni oʻchirish”ni bosib, qayta kiriting.';
  if (status === 429) return 'Bepul limit tugadi. Biroz kutib (yoki ertaga) qayta yozing.';
  if (status >= 500) return 'Google serveri hozir javob bermayapti. Birozdan keyin urinib koʻring.';
  return `Javob olib boʻlmadi (xato ${status}).`;
}

function cancelRequest() {
  const pending = activeRequest;
  activeRequest = null;
  pending?.abort();
}

async function request(model, key, contents, signal) {
  return await net.fetch(`${ENDPOINT}${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt() }] },
      contents,
      generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
    }),
    signal,
  });
}

async function ask(input) {
  const text = typeof input === 'string' ? input.trim() : '';
  if (!text || text.length > MAX_INPUT) return { error: `Xabar 1–${MAX_INPUT} belgidan iborat boʻlsin.` };
  const key = readKey();
  if (!key) return { error: 'Avval Gemini kalitini kiriting.', needKey: true };
  if (activeRequest) return { error: 'Hali oldingi savolga javob yozyapman…' };
  const controller = new AbortController();
  activeRequest = controller;
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const contents = [...history, { role: 'user', text }].map(m => ({ role: m.role, parts: [{ text: m.text }] }));
    let res = null;
    for (const model of MODELS) {
      res = await request(model, key, contents, controller.signal);
      controller.signal.throwIfAborted();
      if (activeRequest !== controller) return { cancelled: true };
      if (res.status !== 404) break;
    }
    if (!res.ok) {
      const body = await res.text();
      controller.signal.throwIfAborted();
      if (activeRequest !== controller) return { cancelled: true };
      return { error: errorText(res.status, body) };
    }
    const data = await res.json();
    controller.signal.throwIfAborted();
    if (activeRequest !== controller) return { cancelled: true };
    const reply = (data?.candidates?.[0]?.content?.parts || []).map(p => p?.text || '').join('').trim();
    if (!reply) return { error: 'Bunga javob bera olmayman. Boshqacha soʻrab koʻr.' };
    const short = reply.length > MAX_REPLY ? reply.slice(0, MAX_REPLY - 1).trimEnd() + '…' : reply;
    history = [...history, { role: 'user', text }, { role: 'model', text: short }].slice(-HISTORY_TURNS * 2);
    C.send('chat-say', short); // personaj bulutchasida ham aytadi
    return { ok: true, reply: short };
  } catch (err) {
    if (activeRequest !== controller) return { cancelled: true };
    return { error: err?.name === 'AbortError' ? 'Javob juda kechikdi. Qayta urinib koʻring.' : 'Internetga ulanib boʻlmadi.' };
  } finally {
    clearTimeout(timer);
    if (activeRequest === controller) activeRequest = null;
  }
}

function reset() { cancelRequest(); history = []; return { ok: true }; }

// ---- Oyna ----
function open() {
  if (chatWin && !chatWin.isDestroyed()) { chatWin.show(); chatWin.focus(); return; }
  chatWin = new BrowserWindow({ width: 440, height: 600, minWidth: 360, minHeight: 420,
    title: 'Suhbat', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, '..', 'chat-preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true } });
  chatWin.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  chatWin.webContents.on('will-navigate', event => event.preventDefault());
  chatWin.once('ready-to-show', () => { if (chatWin && !chatWin.isDestroyed()) chatWin.show(); });
  chatWin.on('closed', () => { chatWin = null; });
  chatWin.loadFile(path.join(__dirname, '..', 'renderer', 'chat.html'));
}

function start() {
  if (running) return;
  running = true;
  const name = () => require('./appearance').current().name;
  const handlers = {
    state: () => ({ hasKey: hasKey(), name: name(), history }),
    'set-key': setKey, 'clear-key': clearKey, ask, reset,
    // Faqat shu bitta manzil — renderer ixtiyoriy havola ocha olmaydi
    'open-studio': () => shell.openExternal('https://aistudio.google.com/apikey'),
  };
  // Faqat suhbat oynasining o'z preload'i ushbu kanallardan foydalanishi mumkin.
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.handle(`chat:${channel}`, (event, input) => {
      if (!chatWin || chatWin.isDestroyed() || event.sender !== chatWin.webContents ||
          event.senderFrame !== chatWin.webContents.mainFrame) throw new Error('Suhbat oynasi talab qilinadi.');
      return handler(input);
    });
  }
}

Object.assign(module.exports, { start, open, hasKey });
