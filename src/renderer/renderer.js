// Kokcha — ko'rinish va o'zaro ta'sir (renderer)

// Gaplar — phrases.js: har bir personaj/fe'l o'z ovozi bilan gapiradi.
// Midori (chibi-girl) fe'li main'dan `persona` kanali orqali keladi; Ko'kcha doim qiziquvchan.
const MIDORI_VOICES = ['cheerful', 'shy', 'tsundere', 'playful'];
let persona = null;
function voice() {
  if (character === 'chibi-girl') return MIDORI_VOICES.includes(persona) ? persona : 'cheerful';
  if (character === 'kokcha') return 'curious';
  return 'default';
}
const line = (key) => window.Phrases.pick(voice(), key, { name: petName });

// Birinchi ochilganda — qisqa tanishtirish
const onboarding = () => [
  `Salom! Men ${petName}man 🌱 Endi shu yerda yashayman.`,
  "Meni sudrab koʻchirsangiz boʻladi. Ctrl bosib tursangiz — orqamdagini bosasiz.",
  "Sozlamalar va boshqa personajlar — ustimda oʻng tugma ⚙️",
];

// "O'z rasmim..." — rasm tanlanayotganda maslahatlar
const IMAGE_TIPS = [
  "Rasm tanlaymizmi? 🖼️ Eng yaxshisi — foni shaffof PNG.",
  "Personaj rasmning oʻrtasida, pastga tegib tursa — yerda turgandek koʻrinaman.",
  "Kamida 256×256 piksel boʻlsa tiniq chiqaman. GIF boʻlsa — jonli!",
];
const IMAGE_CANCEL = "Mayli, keyinroq tanlarmiz 😊";
const IMAGE_ERROR = "Voy, bu rasm bilan ishlay olmadim 😕 Boshqasini sinab koʻramizmi?";

// Rasm tekshirilgandan keyin — natijaga qarab maslahat
function imageFeedback({ issues, cropped, w, h }) {
  const lines = ["Yangi qiyofa! Qalay, yarashdimi? ✨"];
  if (cropped) lines.push("Atrofidagi boʻsh joyni oʻzim qirqib oldim ✂️");
  if (issues.includes('gif')) lines.push("GIF ekan — jonli boʻldim! 🎉");
  if (issues.includes('background')) {
    lines.push("Rasmda fon bor ekan — atrofimda toʻrtburchak koʻrinadi 🙈");
    lines.push("remove.bg saytida fonni bir bosishda olib tashlasa boʻladi.");
  }
  if (issues.includes('jpg')) {
    lines.push("JPG rasmda shaffof fon boʻlmaydi — atrofimda toʻrtburchak koʻrinadi 🙈");
    lines.push("Foni shaffof PNG tanlasangiz, ancha chiroyli chiqaman.");
  }
  if (issues.includes('small')) lines.push(`Rasm biroz kichik (${w}×${h}) — xira koʻrinishim mumkin. 256 pikseldan kattasi yaxshi.`);
  if (issues.includes('shape')) lines.push("Rasm juda choʻzinchoq, shuning uchun kichik koʻrinaman. Kvadratga yaqini yaxshi.");

  const problems = issues.filter((i) => i !== 'gif');
  if (problems.length) lines.push("Boshqasini tanlash: oʻng tugma → Personaj → Boshqa rasm tanlash.");
  else lines.push("Zoʻr rasm tanladingiz! 👍");
  return lines;
}

// Kun vaqti: salomlashish va vaqtga oid gaplar uchun
function dayPart() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 17) return 'day';
  if (h >= 17 && h < 22) return 'evening';
  return 'night';
}
const greeting = () => line('greet.' + dayPart());
function timeKey() {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return 'time.morning';
  if (h >= 12 && h < 14) return 'time.lunch';
  if (h >= 22 || h < 5) return 'time.night';
  return null;
}

const FADE_MS = 200;
const DOUBLE_CLICK_MS = 250;

const body = document.body;
const petEl = document.getElementById('pet');
const petInner = document.getElementById('pet-inner');
const bubble = document.getElementById('bubble');
const bubbleActions = document.getElementById('bubble-actions');
const bubbleText = document.getElementById('bubble-text');
const sprite = document.getElementById('sprite');
const mascot = document.getElementById('mascot');
const bubbleName = document.getElementById('bubble-name');

let sprites = {};
let petName = "Koʻkcha";
let character = null;
let quiet = false;
let state = 'idle';
let currentPose = 'stand';
let currentSide = null;
let currentDir = 1;
let chibiReady = false;
let talking = false;
let speechFace = 'talking';   // gap aytilayotgandagi yuz — gapning ma'nosiga mos (Phrases.faceOf)
let speechMood = null;        // Ko'kcha uchun: gap davomida qo'yilgan body klassi (happy | angry)
let bubbleTimer = null;
let lastPettedTalk = 0;
let reminderActive = false;
const reminderQueue = [];

// ---- Ko'rinish ----
function render() {
  body.classList.remove('idle', 'walk', 'sleep');
  body.classList.add(state);
  body.classList.toggle('talk', talking);

  const isChibi = character === 'chibi-girl';
  body.classList.toggle('chibi-mode', isChibi);
  window.Chibi.setActive(isChibi && chibiReady && !document.hidden);
  document.getElementById('chibi').classList.toggle('hidden', !isChibi || !chibiReady);
  if (isChibi && chibiReady) {
    body.classList.remove('sprite-mode');
    sprite.classList.add('hidden');
    mascot.classList.add('hidden');
    window.Chibi.paint({ state, pose: currentPose, side: currentSide, dir: currentDir,
      dancing: body.classList.contains('dancing'),
      dragging: body.classList.contains('dragging'),
      expression: body.classList.contains('angry') ? 'angry' :
        body.classList.contains('surprised') ? 'surprised' :
        body.classList.contains('sad') ? 'sad' : talking ? speechFace :
        body.classList.contains('yawn') ? 'sleeping' :
        body.classList.contains('love') ? 'love' :
        body.classList.contains('happy') ? 'happy' : body.classList.contains('hover') ? 'embarrassed' : 'neutral' });
    return;
  }

  const key = talking && sprites.talk ? 'talk' : state;
  const src = sprites[key] || sprites.idle;
  body.classList.toggle('sprite-mode', !!src);
  if (src) {
    if (sprite.src !== src) sprite.src = src;
    sprite.classList.remove('hidden');
    mascot.classList.add('hidden');
  } else {
    sprite.classList.add('hidden');
    mascot.classList.remove('hidden');
  }
}

// Personaj, rang yoki o'z rasmini qo'llaydi
function applyAppearance(a) {
  sprites = a.sprites || {};
  petName = a.name;
  if (!reminderActive) bubbleName.textContent = a.name;
  document.title = a.name;
  body.dataset.char = a.character;
  body.dataset.color = a.color;
  if (a.character !== character && window.CHARACTERS[a.character]) {
    mascot.innerHTML = window.CHARACTERS[a.character];
  }
  character = a.character;
  render();
}

// Qisqa animatsiyani (boing, land, stretch) qayta ishga tushiradi
function play(effect, ms) {
  petInner.classList.remove(effect);
  void petInner.offsetWidth;
  petInner.classList.add(effect);
  setTimeout(() => petInner.classList.remove(effect), ms);
}

// Tana holatini (happy, yawn, wave, dancing) vaqtincha yoqadi
const bodyTimers = {};
function mood(cls, ms) {
  clearTimeout(bodyTimers[cls]);
  body.classList.add(cls);
  bodyTimers[cls] = setTimeout(() => { body.classList.remove(cls); render(); }, ms);
  render();
}

// Qo'l silkitish: Ko'kchada CSS qo'l, Midori'da kadrli harakat (faqat tinch turganda).
// X6 qo'l silkitish 3 s — runActivity orqali, shu vaqt ichida main yurishni boshlamaydi.
function wave() {
  mood('wave', 1600);
  if (character === 'chibi-girl') runActivity('wave');
}

// Midori'ning o'z mashg'ulotlari (MaoMao'dagi kabi). Main'ga "bandman" deyiladi: yurmaydi,
// o'tirgan bo'lsa turadi; keyin kadrli harakat o'ynaydi. Menyudan ham chaqiriladi (`activity` kanali).
const ACTIVITIES = ['read', 'tea', 'water', 'stretch'];
let activityBusy = false;
function runActivity(name, manual = false) {
  if (character !== 'chibi-girl' || activityBusy || state === 'sleep' || body.classList.contains('dragging')) return;
  activityBusy = true;
  // Kadrlar birinchi yuklanayotganda ham, sekinroq harakat tugaguncha ham yurmaydi.
  window.pet.busy(1500);
  const busyTimer = setInterval(() => window.pet.busy(1500), 750);
  // main pozani "stand" ga qaytargach boshlanadi
  setTimeout(async () => {
    const shouldTalk = name !== 'wave' && (manual || (!quiet && Math.random() < 0.6));
    if (shouldTalk) setTimeout(() => { if (!talking) say(line('activity.' + name)); }, 400);
    try { await window.Chibi.playActivity(name); } finally {
      clearInterval(busyTimer);
      activityBusy = false;
    }
  }, 250);
}
window.pet.on('activity', (name) => {
  if (name === 'wave' || ACTIVITIES.includes(name)) runActivity(name, true);
});
// O'zi: har 45–90 soniyada (siz kursorni ustiga qo'yib turmasangiz va u gapirmayotgan bo'lsa)
function scheduleActivity() {
  setTimeout(() => {
    if (state !== 'sleep' && !talking && !body.classList.contains('hover') && !document.hidden) {
      runActivity(ACTIVITIES[Math.floor(Math.random() * ACTIVITIES.length)]);
    }
    scheduleActivity();
  }, 45000 + Math.random() * 45000);
}

// Bosh ustidagi belgi (❗ 💢 💗 ❓ 💫) — his-tuyg'uni bir qarashda ko'rsatadi
function emote(ch) {
  document.querySelector('.emote')?.remove();
  const el = document.createElement('div');
  el.className = 'emote';
  el.textContent = ch;
  el.addEventListener('animationend', () => el.remove());
  body.appendChild(el);
}

// Ko'tarib sudralganda — mayatnikdek tebranadi (tezlikka qarab), qo'yib yuborilsa asta to'xtaydi.
// Burchak tushgan tomonga: o'ngga tortilsa, oyoqlari chapda qoladi.
const swing = { a: 0, v: 0, target: 0, lastX: null, lastT: 0, raf: null };
function swingTo(screenX) {
  const now = performance.now();
  if (swing.lastX !== null && now > swing.lastT) {
    const vx = (screenX - swing.lastX) / (now - swing.lastT);       // px/ms
    swing.target = Math.max(-32, Math.min(32, vx * 26));
  }
  swing.lastX = screenX;
  swing.lastT = now;
  if (!swing.raf) swing.raf = requestAnimationFrame(swingStep);
}
function swingStep() {
  const held = body.classList.contains('dragging');
  swing.target *= held ? 0.9 : 0;                                    // sichqoncha to'xtasa — tik osiladi
  swing.v = (swing.v + (swing.target - swing.a) * 0.12) * 0.86;
  swing.a += swing.v;
  const flip = body.classList.contains('dir-left') && !body.classList.contains('chibi-mode') ? -1 : 1;
  if (!held && Math.abs(swing.a) < 0.2 && Math.abs(swing.v) < 0.05) {
    petInner.style.transform = petInner.style.transformOrigin = petInner.style.transition = '';
    swing.a = swing.v = 0; swing.lastX = null; swing.raf = null;
    return;
  }
  petInner.style.transition = 'none';
  petInner.style.transformOrigin = '50% 6%';
  petInner.style.transform = `rotate(${(swing.a * flip).toFixed(2)}deg)`;
  swing.raf = requestAnimationFrame(swingStep);
}

// Yurakcha, nota kabi uchib chiqadigan zarrachalar
function burst(chars, count) {
  for (let i = 0; i < count; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = chars[Math.floor(Math.random() * chars.length)];
    el.style.left = `${100 + Math.random() * 40}px`;
    el.style.setProperty('--dx', `${(Math.random() - 0.5) * 50}px`);
    el.style.animationDelay = `${i * 120}ms`;
    el.addEventListener('animationend', () => el.remove());
    body.appendChild(el);
  }
}

// ---- Gap pufakchasi ----
// Matn harfma-harf chiqadi (gapirayotgandek). Qolgan qismi ko'rinmas holda joy egallab turadi —
// bulutcha o'lchami boshidan to'g'ri, satrlar "sakramaydi". Tinish belgilarida biroz to'xtaydi.
const TYPE_MS = 28;
let typeTimer = null;
function typeText(text) {
  clearInterval(typeTimer);
  const chars = Array.from(text);
  const shown = document.createElement('span');
  const rest = document.createElement('span');
  rest.className = 'rest';
  rest.textContent = text;
  bubbleText.replaceChildren(shown, rest);
  let i = 0, pause = 0;
  typeTimer = setInterval(() => {
    if (pause > 0) { pause--; return; }
    i++;
    shown.textContent = chars.slice(0, i).join('');
    rest.textContent = chars.slice(i).join('');
    if ('.!?…'.includes(chars[i - 1]) && chars[i] === ' ') pause = 6;
    else if (chars[i - 1] === ',' ) pause = 3;
    if (i >= chars.length) { clearInterval(typeTimer); typeTimer = null; bubbleText.textContent = text; }
  }, TYPE_MS);
}

function hideBubble(immediate = false) {
  if (reminderActive) { talking = state !== 'sleep'; return; }
  clearInterval(typeTimer);
  clearTimeout(bubbleTimer);
  talking = false;
  clearSpeechMood();
  setActions(null);
  render();
  if (immediate || bubble.classList.contains('hidden')) {
    bubble.classList.add('hidden');
    bubble.classList.remove('closing');
    return;
  }
  bubble.classList.add('closing');
  bubbleTimer = setTimeout(() => {
    bubble.classList.add('hidden');
    bubble.classList.remove('closing');
  }, FADE_MS);
}

// Ko'kcha'da faqat quvnoq va jahldor yuz bor — gap davomida shularni ko'rsatamiz
function clearSpeechMood() {
  if (!speechMood) return;
  clearTimeout(bodyTimers[speechMood]);
  body.classList.remove(speechMood);
  speechMood = null;
}

// Bulutchadagi tugmalar: [{ label, id?, run?, primary? }]. id — main'dagi ruxsat etilgan amal.
let actionsHold = false;   // kursor tugmali bulutcha ustida — yopilmaydi
function setActions(actions) {
  bubbleActions.replaceChildren();
  const has = !!actions?.length;
  bubble.classList.toggle('has-actions', has);
  bubbleActions.classList.toggle('hidden', !has);
  if (!has) { actionsHold = false; window.pet.hitArea(null); return; }
  for (const a of actions) {
    const btn = document.createElement('button');
    btn.textContent = a.label;
    if (a.primary) btn.className = 'primary';
    btn.addEventListener('click', () => {
      if (a.id) window.pet.action(a.id);
      hideBubble();
      a.run?.();
    });
    bubbleActions.appendChild(btn);
  }
  // Joy pop-animatsiyasidan keyin o'lchanadi
  setTimeout(reportBubbleArea, 220);
}
function reportBubbleArea() {
  if (!bubble.classList.contains('has-actions') || bubble.classList.contains('hidden')) return;
  const r = bubble.getBoundingClientRect();
  window.pet.hitArea({ x: r.left, y: r.top, w: r.width, h: r.height + 4 });
}
bubble.addEventListener('mouseenter', () => {
  if (!bubble.classList.contains('has-actions')) return;
  actionsHold = true;
  clearTimeout(bubbleTimer);
});
bubble.addEventListener('mouseleave', () => {
  if (!actionsHold) return;
  actionsHold = false;
  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => hideBubble(), 4000);
});

// opts: { actions, force (uxlayotgan bo'lsa ham), hold (ms) }
function say(text, opts = {}) {
  if (reminderActive) return;
  if (state === 'sleep' && !opts.force) return;
  speechFace = window.Phrases.faceOf(voice(), text);
  bubble.dataset.face = speechFace;
  clearSpeechMood();
  // Ko'kchada faqat quvnoq va jahl yuzi bor: sho'x/sevgi/hayajon — quvnoq
  const kokchaFace = ['smug', 'love', 'excited'].includes(speechFace) ? 'happy' : speechFace;
  if (character !== 'chibi-girl' && (kokchaFace === 'happy' || kokchaFace === 'angry') && !body.classList.contains(kokchaFace)) {
    speechMood = kokchaFace;
    mood(kokchaFace, bubbleTime(text));
  }
  typeText(text);
  bubble.classList.remove('hidden', 'closing');
  bubble.style.animation = 'none';     // "pop" animatsiyasini qaytadan boshlash
  void bubble.offsetWidth;
  bubble.style.animation = '';
  talking = true;
  render();

  setActions(opts.actions);

  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => hideBubble(), opts.hold || (opts.actions ? 20000 : bubbleTime(text)));
}

// Uzun gap ko'proq turadi
function bubbleTime(text) {
  return text.length * TYPE_MS + Math.max(2600, 1400 + text.length * 50);   // yozilish + o'qish
}

// Bir nechta gapni ketma-ket aytadi (yangisi boshlansa — eskisi to'xtaydi)
let sayQueue = [];
function sayAll(lines) {
  sayQueue.forEach(clearTimeout);
  sayQueue = [];
  let delay = 0;
  for (const line of lines) {
    sayQueue.push(setTimeout(() => say(line), delay));
    delay += bubbleTime(line) + 400;
  }
}

// Eslatma jim rejimda va uxlayotganda ham ko'rinadi; oddiy gaplar uni yopmaydi.
function showReminder() {
  if (reminderActive || !reminderQueue.length) return;
  reminderActive = true;
  sayQueue.forEach(clearTimeout); sayQueue = [];
  clearTimeout(bubbleTimer);
  setActions(null);   // oldingi bulutchaning tugmalari (masalan, "Yangilash") eslatmaga o'tmasin (Codex review P2)
  const text = reminderQueue.shift();
  bubbleName.textContent = '⏰ Eslatma';
  clearInterval(typeTimer);
  bubbleText.textContent = text;
  bubble.classList.add('reminder');
  delete bubble.dataset.face;
  bubble.classList.remove('hidden', 'closing');
  talking = state !== 'sleep';
  speechFace = 'talking';
  clearSpeechMood();
  render();
  bubbleTimer = setTimeout(() => {
    reminderActive = false;
    bubble.classList.remove('reminder');
    bubbleName.textContent = petName;
    hideBubble();
    showReminder();
  }, Math.min(18000, Math.max(8000, bubbleTime(text))));
}

window.pet.on('remind', data => {
  if (typeof data?.text !== 'string' || !data.text.trim()) return;
  reminderQueue.push(data.text.slice(0, 200));
  showReminder();
});

function sayRandom() {
  const time = timeKey();
  say(time && Math.random() < 0.35 ? line(time) : line('random'));
}

// ---- Sudrash va bosish ----
// Oyna joyini asosiy jarayon kursorga qarab hisoblaydi — bu yerda faqat boshlanish/tugashni aytamiz.
let dragState = null;

petEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  dragState = { startX: e.screenX, startY: e.screenY, moved: false };
});

window.addEventListener('mousemove', (e) => {
  if (!dragState) return;
  const dx = Math.abs(e.screenX - dragState.startX);
  const dy = Math.abs(e.screenY - dragState.startY);
  if (!dragState.moved && dx + dy > 4) {
    dragState.moved = true;
    body.classList.add('dragging');
    mood('surprised', 1100);
    emote('❗');
    window.pet.dragStart();
  }
  if (dragState.moved) { window.pet.dragMove(); swingTo(e.screenX); }
});

// Bitta bosish — gapiradi, ikki marta — raqs tushadi
let clickTimer = null;
function handleClick() {
  if (state === 'sleep') return window.pet.click();
  if (clickTimer) {
    clearTimeout(clickTimer);
    clickTimer = null;
    dance();
    return;
  }
  clickTimer = setTimeout(() => {
    clickTimer = null;
    window.pet.click();
  }, DOUBLE_CLICK_MS);
}

window.addEventListener('mouseup', () => {
  if (!dragState) return;
  const wasDrag = dragState.moved;
  dragState = null;
  body.classList.remove('dragging');
  render();
  if (wasDrag) window.pet.dragEnd();
  else handleClick();
});

// O'ng tugma — sozlamalar menyusi
petEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.pet.menu();
});

// ---- Zavqli harakatlar ----
function dance() {
  window.pet.dance();
  play('dance', 1700);
  mood('dancing', 1700);
  mood('happy', 1700);
  burst(['♪', '♫', '♬'], 4);
}

function welcome(reason) {
  wave();
  if (quiet) return;
  say(reason === 'morning' ? greeting() : line('welcomeBack'));
}

// Vaqti-vaqti bilan esnaydi yoki qo'l silkitadi
function scheduleFidget() {
  setTimeout(() => {
    const free = state === 'idle' && !talking && !body.classList.contains('hover');
    if (free) {
      const r = Math.random();
      if (r < 0.35) mood('yawn', 1800);
      else if (r < 0.6) wave();
      else mood('glance', 2600);
    }
    scheduleFidget();
  }, 25000 + Math.random() * 35000);
}

// Ko'kchaning ko'z qisishi: abadiy CSS animatsiya o'rniga taymer — oradagi vaqtda hech narsa qayta chizilmaydi
function scheduleBlink() {
  setTimeout(() => {
    if (character !== 'chibi-girl' && state !== 'sleep' && !document.hidden) {
      body.classList.add('blink');
      setTimeout(() => body.classList.remove('blink'), 140);
    }
    scheduleBlink();
  }, 3000 + Math.random() * 3000);
}

// ---- Asosiy jarayondan kelgan xabarlar ----
const POSES = ['stand', 'sit', 'ledge', 'lie', 'climb', 'hang', 'jump', 'fall'];

window.pet.on('state', ({ state: s, dir, pose, side }) => {
  state = s;
  currentPose = pose || 'stand';
  currentSide = side;
  currentDir = dir < 0 ? -1 : 1;
  for (const p of POSES) body.classList.toggle(`pose-${p}`, p === pose);
  body.classList.toggle('side-left', side === 'left');
  body.classList.toggle('side-right', side === 'right');
  // Yurganda, sakraganda va chekkada o'tirganda — harakat tomonga qaraydi
  const faces = s === 'walk' || pose === 'jump' || pose === 'ledge';
  body.classList.toggle('dir-left', faces && dir < 0);
  if (s === 'sleep') hideBubble(true);
  render();
});

window.pet.on('woke', ({ reason }) => {
  play('stretch', 1000);
  if (reason === 'click' || reason === 'drag') emote('❓');
  if (reason === 'click') say(line('wake.click'));
  else if (reason === 'drag') say(line('wake.drag'));
  else if (reason === 'morning' || reason === 'back') setTimeout(() => welcome(reason), 900);
  else if (!quiet) say(line('wake.idle'));
});

window.pet.on('welcome', welcome);

// Silashsa — yurakchalar
window.pet.on('petted', () => {
  burst(['♥'], 2);
  emote('💗');
  if (state === 'sleep') return; // uxlab yotgan bo'lsa ham yoqadi, lekin uyg'onmaydi
  mood(character === 'chibi-girl' ? 'love' : 'happy', 1500);   // Midori'da — yurakchali ko'zlar
  if (Math.random() < 0.3) play('hop', 600);
  const now = Date.now();
  if (now - lastPettedTalk > 10000) {
    lastPettedTalk = now;
    say(line('petted'));
  }
});

window.pet.on('say', (kind) => {
  if (kind === 'break') say(line('breakTime'));
  else if (kind === 'here') { play('boing', 450); say(line('here')); }
  else if (window.Phrases.has(voice(), 'move.' + kind)) say(line('move.' + kind));
  else if (kind === 'image-tips') { wave(); sayAll(IMAGE_TIPS); }
  else if (kind === 'image-cancel') sayAll([IMAGE_CANCEL]);
  else if (kind === 'image-error') { mood('sad', 2400); sayAll([IMAGE_ERROR]); }
  else sayRandom();
});

// AI suhbat javobi (ai.js): foydalanuvchi o'zi so'ragan — jim rejimda va uyquda ham aytiladi
window.pet.on('chat-say', (text) => {
  if (typeof text !== 'string' || !text.trim()) return;
  sayQueue.forEach(clearTimeout); sayQueue = [];
  say(text.slice(0, 400), { force: true });
});

window.pet.on('clicked', () => {
  play('boing', 450);
  sayRandom();
});

window.pet.on('landed', () => { play('land', 350); emote('💫'); });
window.pet.on('hover', (over) => { body.classList.toggle('hover', over); render(); });
window.pet.on('mood', (data) => {
  if (!['angry', 'sad', 'surprised'].includes(data?.mood) || state === 'sleep') return;
  if (character !== 'chibi-girl' && data.mood !== 'angry') return; // Ko'kchada faqat jahl yuzi bor
  const level = [1, 2, 3].includes(data.level) ? data.level : 1;
  mood(data.mood, 1500 + level * 700);
  emote(data.mood === 'angry' ? '💢' : data.mood === 'sad' ? '💧' : '❗');
  if (data.mood === 'angry' && !quiet) say(line('angry.' + level));
  if (character !== 'chibi-girl') {
    body.style.setProperty('--shake', `${level * 2}px`); // kuchli otilsa — qattiqroq silkinadi
    play('shake', 500);
  }
});
window.pet.on('ghost', (on) => body.classList.toggle('ghost', on));

// Midori'ning fe'li almashdi. Bir xil fe'l qayta kelsa — jim; 'start' — salomlashish o'zi shu ovozda;
// 'event' (otish/silash) — gapni jahl/silash reaksiyasining o'zi aytadi.
window.pet.on('persona', (p) => {
  if (!p || typeof p.id !== 'string' || p.id === persona) return;
  persona = p.id;
  if ((p.reason === 'timer' || p.reason === 'menu') && character === 'chibi-girl' && !quiet && state !== 'sleep') say(line('intro'));
});

// Yangi versiya: o'rnatilganida — yuklab olindi, portable'da — chiqdi
// Yangilanish: o'zi topganda faqat "tayyor"ni aytadi; menyudan so'ralganda — har bir bosqichni
window.pet.on('update', ({ status, version, portable }) => {
  sayQueue.forEach(clearTimeout); sayQueue = [];
  const force = { force: true };
  if (status === 'checking') return say('Yangi versiya bormi, qarab chiqyapman… 🔍', force);
  if (status === 'downloading') return say(`Yangi versiya bor (${version})! Yuklab olyapman… ⏬`, force);
  if (status === 'latest') return say(`Sizda eng yangi versiya turibdi (${version}) ✨`, force);
  if (status === 'error') return say("Yangilanishni tekshira olmadim 😕 Internet bormi? Keyinroq yana urinib koʻraman.", force);
  if (status === 'dev') return say("Bu sinov nusxasi — yangilanish tekshirilmaydi.", force);
  if (status !== 'ready') return;
  wave();
  if (portable) {
    say(`Yangi versiya chiqdi (${version})! ✨`, { force: true, actions: [
      { label: 'Yuklab olish', id: 'update-install', primary: true }, { label: 'Keyinroq' }] });
  } else {
    say(`Yangi versiya tayyor (${version})! ✨`, { force: true, actions: [
      { label: 'Yangilash', id: 'update-install', primary: true },
      { label: 'Keyinroq', run: () => setTimeout(() => say("Mayli, dastur yopilganda oʻzi yangilanadi 😊"), 300) }] });
  }
});

// Oyna ekran chetidan chiqib tursa — pufakcha ichkariga suriladi
window.pet.on('bubble-shift', (px) => {
  // Faqat ekrandan chiqqan tomoni torayadi — bulutcha oynadan ham, ekrandan ham chiqmaydi
  bubble.style.left = `${10 + Math.max(px, 0)}px`;
  bubble.style.right = `${10 + Math.max(-px, 0)}px`;
  bubble.style.setProperty('--tail', `${-px / 2}px`);   // dum personajga qaraydi
  reportBubbleArea();
});
window.pet.on('settings', (s) => { quiet = s.quiet; });

// Menyudan personaj yoki rang almashtirildi
window.pet.on('appearance', (a) => {
  applyAppearance(a);
  play('land', 350);
  mood('happy', 1400);
  burst(['✦', '✧', '★'], 5);
  if (a.report) sayAll(imageFeedback(a.report));
  else sayAll([a.change === 'color' ? "Yangi rang! Yarashdimi? ✨" : line('newLook')]);
});

// Ko'zlar kursorga qaraydi
window.pet.on('look', ({ dx, dy }) => {
  if (character === 'chibi-girl') { window.Chibi.look(dx); return; }
  const flip = body.classList.contains('dir-left') ? -1 : 1;
  const dist = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, dist / 200);   // yaqin bo'lsa — kamroq buriladi
  const ex = (dx / dist) * 4 * k * flip;
  const ey = (dy / dist) * 3 * k;
  const pupils = document.getElementById('pupils');
  if (!pupils) return;
  pupils.style.transform = `translate(${ex.toFixed(1)}px, ${ey.toFixed(1)}px)`;
});

// ---- Boshlash ----
(async () => {
  window.Chibi.ready.then(() => { chibiReady = true; render(); }).catch(error => console.error('Personaj rasmlari yuklanmadi:', error));
  const init = await window.pet.getInit();
  quiet = init.quiet;
  if (typeof init.persona?.id === 'string') persona = init.persona.id;
  applyAppearance(init);
  scheduleFidget();
  scheduleActivity();
  scheduleBlink();
  if (init.firstRun) setTimeout(() => { wave(); sayAll(onboarding()); }, 600);
  else if (!quiet) setTimeout(() => say(greeting()), 600);
})();
