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
  "Meni sudrab ko'chirsangiz bo'ladi. Ctrl bosib tursangiz — orqamdagini bosasiz.",
  "Sozlamalar va boshqa personajlar — ustimda o'ng tugma ⚙️",
];

// "O'z rasmim..." — rasm tanlanayotganda maslahatlar
const IMAGE_TIPS = [
  "Rasm tanlaymizmi? 🖼️ Eng yaxshisi — foni shaffof PNG.",
  "Personaj rasmning o'rtasida, pastga tegib tursa — yerda turgandek ko'rinaman.",
  "Kamida 256×256 piksel bo'lsa tiniq chiqaman. GIF bo'lsa — jonli!",
];
const IMAGE_CANCEL = "Mayli, keyinroq tanlarmiz 😊";
const IMAGE_ERROR = "Voy, bu rasm bilan ishlay olmadim 😕 Boshqasini sinab ko'ramizmi?";

// Rasm tekshirilgandan keyin — natijaga qarab maslahat
function imageFeedback({ issues, cropped, w, h }) {
  const lines = ["Yangi qiyofa! Qalay, yarashdimi? ✨"];
  if (cropped) lines.push("Atrofidagi bo'sh joyni o'zim qirqib oldim ✂️");
  if (issues.includes('gif')) lines.push("GIF ekan — jonli bo'ldim! 🎉");
  if (issues.includes('background')) {
    lines.push("Rasmda fon bor ekan — atrofimda to'rtburchak ko'rinadi 🙈");
    lines.push("remove.bg saytida fonni bir bosishda olib tashlasa bo'ladi.");
  }
  if (issues.includes('jpg')) {
    lines.push("JPG rasmda shaffof fon bo'lmaydi — atrofimda to'rtburchak ko'rinadi 🙈");
    lines.push("Foni shaffof PNG tanlasangiz, ancha chiroyli chiqaman.");
  }
  if (issues.includes('small')) lines.push(`Rasm biroz kichik (${w}×${h}) — xira ko'rinishim mumkin. 256 pikseldan kattasi yaxshi.`);
  if (issues.includes('shape')) lines.push("Rasm juda cho'zinchoq, shuning uchun kichik ko'rinaman. Kvadratga yaqini yaxshi.");

  const problems = issues.filter((i) => i !== 'gif');
  if (problems.length) lines.push("Boshqasini tanlash: o'ng tugma → Personaj → Boshqa rasm tanlash.");
  else lines.push("Zo'r rasm tanladingiz! 👍");
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
const bubbleText = document.getElementById('bubble-text');
const sprite = document.getElementById('sprite');
const mascot = document.getElementById('mascot');
const bubbleName = document.getElementById('bubble-name');

let sprites = {};
let petName = "Ko'kcha";
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
      expression: body.classList.contains('angry') ? 'angry' :
        body.classList.contains('surprised') ? 'surprised' :
        body.classList.contains('sad') ? 'sad' : talking ? speechFace :
        body.classList.contains('yawn') ? 'sleeping' :
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
function hideBubble(immediate = false) {
  if (reminderActive) { talking = state !== 'sleep'; return; }
  clearTimeout(bubbleTimer);
  talking = false;
  clearSpeechMood();
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

function say(text) {
  if (reminderActive) return;
  if (state === 'sleep') return;
  speechFace = window.Phrases.faceOf(voice(), text);
  clearSpeechMood();
  if (character !== 'chibi-girl' && (speechFace === 'happy' || speechFace === 'angry') && !body.classList.contains(speechFace)) {
    speechMood = speechFace;
    mood(speechFace, bubbleTime(text));
  }
  bubbleText.textContent = text;
  bubble.classList.remove('hidden', 'closing');
  bubble.style.animation = 'none';     // "pop" animatsiyasini qaytadan boshlash
  void bubble.offsetWidth;
  bubble.style.animation = '';
  talking = true;
  render();

  clearTimeout(bubbleTimer);
  bubbleTimer = setTimeout(() => hideBubble(), bubbleTime(text));
}

// Uzun gap ko'proq turadi
function bubbleTime(text) {
  return Math.max(3000, 1800 + text.length * 55);
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
  const text = reminderQueue.shift();
  bubbleName.textContent = '⏰ Eslatma';
  bubbleText.textContent = text;
  bubble.classList.remove('hidden', 'closing');
  talking = state !== 'sleep';
  speechFace = 'talking';
  clearSpeechMood();
  render();
  bubbleTimer = setTimeout(() => {
    reminderActive = false;
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
    window.pet.dragStart();
  }
  if (dragState.moved) window.pet.dragMove();
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
  mood('wave', 1600);
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
      else if (r < 0.6) mood('wave', 1600);
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
  if (reason === 'click') say(line('wake.click'));
  else if (reason === 'drag') say(line('wake.drag'));
  else if (reason === 'morning' || reason === 'back') setTimeout(() => welcome(reason), 900);
  else if (!quiet) say(line('wake.idle'));
});

window.pet.on('welcome', welcome);

// Silashsa — yurakchalar
window.pet.on('petted', () => {
  burst(['♥'], 3);
  if (state === 'sleep') return; // uxlab yotgan bo'lsa ham yoqadi, lekin uyg'onmaydi
  mood('happy', 1500);
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
  else if (kind === 'image-tips') { mood('wave', 1600); sayAll(IMAGE_TIPS); }
  else if (kind === 'image-cancel') sayAll([IMAGE_CANCEL]);
  else if (kind === 'image-error') { mood('sad', 2400); sayAll([IMAGE_ERROR]); }
  else sayRandom();
});

window.pet.on('clicked', () => {
  play('boing', 450);
  sayRandom();
});

window.pet.on('landed', () => play('land', 350));
window.pet.on('hover', (over) => { body.classList.toggle('hover', over); render(); });
window.pet.on('mood', (data) => {
  if (!['angry', 'sad', 'surprised'].includes(data?.mood) || state === 'sleep') return;
  if (character !== 'chibi-girl' && data.mood !== 'angry') return; // Ko'kchada faqat jahl yuzi bor
  const level = [1, 2, 3].includes(data.level) ? data.level : 1;
  mood(data.mood, 1500 + level * 700);
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
window.pet.on('update', ({ version, portable }) => {
  mood('wave', 1600);
  burst(['✦', '✧', '★'], 4);
  sayAll(portable
    ? [`Yangi versiya chiqdi (${version})! ✨`, "Yuklab olish: o'ng tugma → Yangi versiya."]
    : [`Yangi versiya tayyor (${version})! ✨ Keyingi safar o'zi yangilanadi.`, "Hoziroq yangilash: o'ng tugma → Yangilash."]);
});

// Oyna ekran chetidan chiqib tursa — pufakcha ichkariga suriladi
window.pet.on('bubble-shift', (px) => {
  bubble.style.left = `${10 + px}px`;
  bubble.style.right = `${10 - px}px`;
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
  scheduleBlink();
  if (init.firstRun) setTimeout(() => { mood('wave', 1600); sayAll(onboarding()); }, 600);
  else if (!quiet) setTimeout(() => say(greeting()), 600);
})();
