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

const RANDOM_CHAT_MS = 6 * 60 * 1000;
const FADE_MS = 200;

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
  // Uzun gap ko'proq turadi
  bubbleTimer = setTimeout(() => hideBubble(), Math.max(3000, 1800 + text.length * 55));
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

window.addEventListener('mouseup', () => {
  if (!dragState) return;
  const wasDrag = dragState.moved;
  dragState = null;
  body.classList.remove('dragging');
  if (wasDrag) window.pet.dragEnd();
  else window.pet.click();
});

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
  else if (!quiet) say(WAKE_IDLE);
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

// ---- Vaqti-vaqti bilan gapirish (jim rejimda emas) ----
setInterval(() => { if (state === 'idle' && !quiet) sayRandom(); }, RANDOM_CHAT_MS);

// ---- Boshlash ----
(async () => {
  const init = await window.pet.getInit();
  sprites = init.sprites;
  quiet = init.quiet;
  render();
  if (!quiet) setTimeout(() => say(greeting()), 600);
})();
