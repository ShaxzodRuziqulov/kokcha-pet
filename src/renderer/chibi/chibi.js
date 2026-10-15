// Oldindan kesilgan PNG kadrlar; ishga tushishda piksel skaneri kerak emas.
(() => {
  const SIZE = 180;
  const HEAD = 110;
  const canvas = document.getElementById('chibi');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.height = SIZE * ratio;
  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);
  let frames = {}, loaded = false, active = false;
  let latest = { state: 'idle', pose: 'stand', expression: 'neutral', dir: 1 };
  let lookTarget = 0, facing = 0, previous = '', previousTime = 0;
  let turnTimer = null, stepTimer = null, blinkTimer = null, blinkEnd = null;
  let step = 0, blinking = false;

  function draw(name, mirrored = false) {
    const frame = frames[name];
    const maxHeight = name.startsWith('walk-') ? 164 : SIZE - 4;
    const scale = Math.min(HEAD / frame.head, (SIZE - 4) / frame.width, maxHeight / frame.height);
    const width = frame.width * scale, height = frame.height * scale;
    const x = (SIZE - width) / 2, y = SIZE - height;
    context.save();
    if (mirrored) { context.translate(SIZE, 0); context.scale(-1, 1); }
    context.drawImage(frame.image, x, y, width, height);
    context.restore();
    return { frame, scale, x, y, width, height };
  }

  // Har safar bitta ko'rinishdan o'tiladi: chap yon → chap ¾ → old → o'ng ¾ → o'ng yon.
  function targetFacing() {
    if (latest.state === 'walk' || ['jump', 'ledge'].includes(latest.pose)) return latest.dir < 0 ? -1 : 1;
    if (latest.pose !== 'stand') return 0;
    return lookTarget;
  }
  function turn() {
    clearTimeout(turnTimer); turnTimer = null;
    if (!active || !loaded) return;
    const target = targetFacing();
    if (facing === target) return;
    const delay = Math.max(0, 95 - (performance.now() - previousTime));
    turnTimer = setTimeout(() => {
      facing += Math.sign(targetFacing() - facing);
      previousTime = performance.now();
      paint();
    }, delay);
  }

  function scheduleBlink() {
    clearTimeout(blinkTimer);
    if (!active) return;
    blinkTimer = setTimeout(() => {
      if (latest.state !== 'sleep' && latest.expression === 'neutral' && frames[canvas.dataset.frame]?.face) {
        blinking = true; paint();
        blinkEnd = setTimeout(() => { blinking = false; paint(); scheduleBlink(); }, 135);
      } else scheduleBlink();
    }, 3200 + Math.random() * 2800);
  }

  function paint(options = latest) {
    latest = options;
    if (!loaded || !active) return;
    const { state, pose, side, expression = 'neutral' } = latest;
    let name = 'stand', mirrored = false;
    if (state === 'sleep' || pose === 'lie') name = 'lie';
    else if (pose === 'sit') name = 'sit';
    else if (pose === 'ledge') { name = 'ledge'; mirrored = facing < 0; }
    else if (pose === 'hang') { name = 'hang'; mirrored = side === 'left'; }
    else if (pose === 'jump') { name = 'jump'; mirrored = facing < 0; }
    else if (pose === 'fall') name = 'fall';
    else if (pose === 'climb') { name = step ? 'climb-b' : 'climb-a'; mirrored = side === 'left'; }
    else if (state === 'walk') { name = facing === 0 ? 'stand' : step ? 'walk-b' : 'walk-a'; mirrored = facing < 0; }
    else if (facing !== 0) { name = Math.abs(facing) === 2 ? 'profile' : 'quarter'; mirrored = facing < 0; }
    const head = frames[name].face;
    const requested = blinking && expression === 'neutral' ? 'sleeping' : expression;
    const faceName = head ? `face-${head.group === 'front' ? '' : `${head.group}-`}${requested}` : '';
    const emotion = head && frames[faceName] ? requested : 'neutral';
    const key = `${name}:${mirrored}:${emotion}`;
    if (key !== previous) {
      previous = key;
      context.clearRect(0, 0, SIZE, SIZE);
      const base = draw(name, mirrored);
      if (emotion !== 'neutral') {
        const face = frames[faceName];
        // Har pozaning o'z bosh/yoqa chegarasi bor. Chap kadrga yuz ham birga akslanadi.
        context.save();
        if (mirrored) { context.translate(SIZE, 0); context.scale(-1, 1); }
        context.clearRect(0, 0, SIZE, base.y + head.cut * base.scale);
        if (head.join) {
          // Eski boshning soch uchlarini qoldirmasdan, yoqa ostini tananing o'z PNG'si bilan tutashtiradi.
          context.clearRect(0, base.y + (head.cut - head.join) * base.scale, SIZE, head.join * 3 * base.scale);
          context.drawImage(base.frame.image, 0, head.cut, base.frame.width, head.join * 2,
            base.x, base.y + (head.cut - head.join) * base.scale, base.width, head.join * 3 * base.scale);
        }
        context.drawImage(face.image, base.x + head.x * base.scale, base.y + head.y * base.scale,
          head.w * base.scale, head.h * base.scale);
        context.restore();
      }
      canvas.dataset.frame = name;
      canvas.dataset.expression = emotion;
      canvas.dataset.facing = String(facing);
    }
    const moving = (state === 'walk' && pose === 'stand') || (state !== 'sleep' && pose === 'climb');
    if (moving && !stepTimer) stepTimer = setInterval(() => { step ^= 1; paint(); }, 250);
    if (!moving && stepTimer) { clearInterval(stepTimer); stepTimer = null; step = 0; }
    turn();
  }

  const ready = fetch('chibi/frames/manifest.json').then(r => {
    if (!r.ok) throw new Error('Kadrlar ro‘yxati yuklanmadi');
    return r.json();
  }).then(async manifest => {
    await Promise.all(Object.entries(manifest).map(async ([name, frame]) => {
      const image = new Image(); image.src = `chibi/frames/${name}.png`; await image.decode();
      if (image.naturalWidth !== frame.width || image.naturalHeight !== frame.height) throw new Error(`Kadr o‘lchami noto‘g‘ri: ${name}`);
      frames[name] = { ...frame, image };
    }));
    loaded = true; paint();
  });
  window.Chibi = { ready, paint,
    setActive(on) {
      if (active === on) return;
      active = on;
      clearTimeout(turnTimer); clearInterval(stepTimer); stepTimer = null;
      clearTimeout(blinkTimer); clearTimeout(blinkEnd); blinking = false;
      if (on) { previous = ''; paint(); scheduleBlink(); }
    },
    look(dx) {
      if (!Number.isFinite(dx)) return;
      // Kirish/chiqish chegaralari turlicha: 250 px atrofidagi kursor sakramaydi.
      const sign = Math.sign(dx), distance = Math.abs(dx);
      if (lookTarget && sign !== Math.sign(lookTarget)) lookTarget = 0;
      const level = Math.abs(lookTarget);
      if (distance > (level === 2 ? 880 : 1050)) lookTarget = sign * 2;
      else if (distance > (level ? 190 : 300)) lookTarget = sign;
      else lookTarget = 0;
      paint();
    }
  };
  document.addEventListener('visibilitychange', () => {
    window.Chibi.setActive(!document.hidden && document.body.classList.contains('chibi-mode'));
  });
})();
