// Kokcha — ko'rinish va o'zaro ta'sir (renderer)

const PHRASES = [
  "Bugun nima kod yozamiz?",
  "Commit qilishni unutmang!",
  "Biroz suv iching 💧",
  "Bug topdingizmi? Birga tuzatamiz!",
  "Men shu yerdaman, ishlayvering.",
  "Bir oz cho'zilib oling, qotib qoldingiz.",
  "Kod ishladimi? Zo'r!",
];
const WAKE_IDLE = "Mm... uxlab qolibman.";
const WAKE_CLICK = "Hm? Uyg'otib yubordingiz-ku!";
const WAKE_DRAG = "Voy! Qayoqqa olib ketyapsiz?";
const BREAK_REMINDER = "Ancha bo'ldi, ko'zlaringizga dam bering 👀";
const HERE = "Men shu yerdaman! 🌱";
const WELCOME_BACK = "Qaytdingizmi? Sog'indim! 🌱";
const PETTED = ["Hihi 😊", "Yana! Yana!", "Qitiq bo'lyapti-ku 😄", "Mm, yoqdi 💚"];

// Birinchi ochilganda — qisqa tanishtirish
const ONBOARDING = [
  "Salom! Men Ko'kchaman 🌱 Endi shu yerda yashayman.",
  "Meni sudrab ko'chirsangiz bo'ladi. Ctrl bosib tursangiz — orqamdagini bosasiz.",
  "Sozlamalar uchun ustimda o'ng tugmani bosing ⚙️",
];

// Soatga qarab salomlashish
function greeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "Xayrli tong! Men Ko'kchaman 🌱";
  if (h >= 11 && h < 17) return "Salom! Men Ko'kchaman 🌱";
  if (h >= 17 && h < 22) return "Xayrli kech! Men Ko'kchaman 🌱";
  return "Hali ham ishlayapsizmi? Men Ko'kchaman 🌙";
}

// Soatga qarab qo'shimcha gaplar
function timePhrases() {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return ["Kun yaxshi boshlansin! ☀️", "Nonushta qildingizmi?"];
  if (h >= 12 && h < 14) return ["Tushlik vaqti! Ovqatlanib oling 🍲"];
  if (h >= 22 || h < 5) return ["Kech bo'ldi, dam oling 🌙", "Ertaga davom ettirsak ham bo'ladi."];
  return [];
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
const pupils = document.getElementById('pupils');

let sprites = {};
let quiet = false;
let state = 'idle';
let talking = false;
let bubbleTimer = null;
let lastPettedTalk = 0;

// ---- Ko'rinish ----
function render() {
  body.classList.remove('idle', 'walk', 'sleep');
  body.classList.add(state);
  body.classList.toggle('talk', talking);

  const key = talking && sprites.talk ? 'talk' : state;
  const src = sprites[key] || sprites.idle;
  if (src) {
    if (sprite.src !== src) sprite.src = src;
    sprite.classList.remove('hidden');
    mascot.classList.add('hidden');
  } else {
    sprite.classList.add('hidden');
    mascot.classList.remove('hidden');
  }
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
  bodyTimers[cls] = setTimeout(() => body.classList.remove(cls), ms);
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
  clearTimeout(bubbleTimer);
  talking = false;
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

function say(text) {
  if (state === 'sleep') return;
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

// Bir nechta gapni ketma-ket aytadi
function sayAll(lines) {
  let delay = 0;
  for (const line of lines) {
    setTimeout(() => say(line), delay);
    delay += bubbleTime(line) + 400;
  }
}

let lastPhrase = '';
function sayRandom() {
  const extra = timePhrases();
  const pool = extra.length && Math.random() < 0.35 ? extra : PHRASES;
  let text;
  do { text = pool[Math.floor(Math.random() * pool.length)]; } while (text === lastPhrase && pool.length > 1);
  lastPhrase = text;
  say(text);
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
  say(reason === 'morning' ? greeting() : WELCOME_BACK);
}

// Vaqti-vaqti bilan esnaydi yoki qo'l silkitadi
function scheduleFidget() {
  setTimeout(() => {
    const free = state === 'idle' && !talking && !body.classList.contains('hover');
    if (free) {
      if (Math.random() < 0.5) mood('yawn', 1800);
      else mood('wave', 1600);
    }
    scheduleFidget();
  }, 40000 + Math.random() * 50000);
}

// ---- Asosiy jarayondan kelgan xabarlar ----
window.pet.on('state', ({ state: s, dir }) => {
  state = s;
  body.classList.toggle('dir-left', s === 'walk' && dir < 0);
  if (s === 'sleep') hideBubble(true);
  render();
});

window.pet.on('woke', ({ reason }) => {
  play('stretch', 1000);
  if (reason === 'click') say(WAKE_CLICK);
  else if (reason === 'drag') say(WAKE_DRAG);
  else if (reason === 'morning' || reason === 'back') setTimeout(() => welcome(reason), 900);
  else if (!quiet) say(WAKE_IDLE);
});

window.pet.on('welcome', welcome);

// Silashsa — yurakchalar
window.pet.on('petted', () => {
  burst(['♥'], 3);
  if (state === 'sleep') return; // uxlab yotgan bo'lsa ham yoqadi, lekin uyg'onmaydi
  mood('happy', 1500);
  const now = Date.now();
  if (now - lastPettedTalk > 10000) {
    lastPettedTalk = now;
    say(PETTED[Math.floor(Math.random() * PETTED.length)]);
  }
});

window.pet.on('say', (kind) => {
  if (kind === 'break') say(BREAK_REMINDER);
  else if (kind === 'here') { play('boing', 450); say(HERE); }
  else sayRandom();
});

window.pet.on('clicked', () => {
  play('boing', 450);
  sayRandom();
});

window.pet.on('landed', () => play('land', 350));
window.pet.on('hover', (over) => body.classList.toggle('hover', over));
window.pet.on('ghost', (on) => body.classList.toggle('ghost', on));
window.pet.on('settings', (s) => { quiet = s.quiet; });

// Ko'zlar kursorga qaraydi
window.pet.on('look', ({ dx, dy }) => {
  const flip = body.classList.contains('dir-left') ? -1 : 1;
  const dist = Math.hypot(dx, dy) || 1;
  const k = Math.min(1, dist / 200);   // yaqin bo'lsa — kamroq buriladi
  const ex = (dx / dist) * 4 * k * flip;
  const ey = (dy / dist) * 3 * k;
  pupils.style.transform = `translate(${ex.toFixed(1)}px, ${ey.toFixed(1)}px)`;
});

// ---- Boshlash ----
(async () => {
  const init = await window.pet.getInit();
  sprites = init.sprites;
  quiet = init.quiet;
  render();
  scheduleFidget();
  if (init.firstRun) setTimeout(() => { mood('wave', 1600); sayAll(ONBOARDING); }, 600);
  else if (!quiet) setTimeout(() => say(greeting()), 600);
})();
