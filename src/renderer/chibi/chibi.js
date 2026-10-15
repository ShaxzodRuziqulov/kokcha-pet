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
  const FACE_FALLBACK = { embarrassed: 'happy' };
  let lookTarget = 0, facing = 0, previous = '', previousTime = 0;
  let turnTimer = null, blinkTimer = null, blinkEnd = null;
  let blinking = false;
  let slots = {}, clock = null, cache = null, animationTimer = null;
  const rigs = {};   // procedural slotlar: idle (idle-rig.js), walk (walk-rig.js)
  const blinkPatches = {};
  const disabledSlots = new Set();

  // Faqat ko'z hududi: original bosh/soch/og'iz va siluet almashtirilmaydi.
  // Original stand/walk-a koordinatalari; patch ishga tushishda bir marta tayyorlanadi.
  function makeBlinkPatch(width, height, skin, eyes) {
    const patch = document.createElement('canvas'); patch.width = width; patch.height = height;
    const ctx = patch.getContext('2d');
    const mask = document.createElement('canvas'); mask.width = width; mask.height = height;
    const maskContext = mask.getContext('2d');
    maskContext.filter = 'blur(0.6px)'; maskContext.fillStyle = '#fff';
    for (const { outline } of eyes) {
      maskContext.beginPath(); maskContext.moveTo(...outline[0]);
      for (const point of outline.slice(1)) maskContext.lineTo(...point);
      maskContext.closePath(); maskContext.fill();
    }
    ctx.fillStyle = skin; ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'destination-in'; ctx.drawImage(mask, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#171c14'; ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    for (const { lid } of eyes) {
      const [x, y, cx, cy, endX, endY] = lid;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, endX, endY); ctx.stroke();
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(x + 3, y + 2); ctx.lineTo(x + 1, y + 5);
      ctx.moveTo(x + 8, y + 4); ctx.lineTo(x + 7, y + 7); ctx.stroke(); ctx.lineWidth = 3.6;
    }
    return patch;
  }

  function draw(name, mirrored = false, seconds = null, blink = false, procedural = null) {
    const frame = { ...frames[name], image: frames[name].image || cache?.get(name) };
    const maxHeight = name.startsWith('walk-') ? 164 : SIZE - 4;
    const scale = Math.min(HEAD / frame.head, (SIZE - 4) / frame.width, maxHeight / frame.height);
    const width = frame.width * scale, height = frame.height * scale;
    const x = (SIZE - width) / 2, y = SIZE - height;
    context.save();
    if (mirrored) { context.translate(SIZE, 0); context.scale(-1, 1); }
    const rig = procedural && rigs[procedural];
    // Rig kadr nomidagi (stand / walk-a) koordinatalarda; yopiq ko'z tana harakati bilan birga chiziladi.
    if (seconds !== null && rig) rig.draw(context, seconds, x, y, width, height, blink ? blinkPatches[name] : null);
    else {
      context.drawImage(frame.image, x, y, width, height);
      const anchor = blink && frame.blink;
      const patch = anchor && blinkPatches[anchor.source];
      if (patch) context.drawImage(patch, x + anchor.x * scale, y + anchor.y * scale,
        patch.width * scale, patch.height * scale);
    }
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
      if (latest.state !== 'sleep' && latest.expression === 'neutral' &&
          (frames[canvas.dataset.frame]?.face || canvas.dataset.slot === 'walk')) {
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
    else if (pose === 'climb') { name = 'climb-a'; mirrored = side === 'left'; }
    else if (state === 'walk') { name = facing === 0 ? 'stand' : 'walk-a'; mirrored = facing < 0; }
    else if (facing !== 0) { name = Math.abs(facing) === 2 ? 'profile' : 'quarter'; mirrored = facing < 0; }
    let requested = expression;
    let slotName = null;
    if (pose === 'climb' && state !== 'sleep') slotName = 'climb';
    else if (requested === 'neutral' && !latest.dancing && pose === 'stand') {
      if (state === 'walk' && facing !== 0) slotName = 'walk';
      else if (state === 'idle' && facing === 0) slotName = 'idle';
    }
    const procedural = slots[slotName]?.procedural;
    if (!slots[slotName] || disabledSlots.has(slotName) || (procedural && !rigs[procedural])) slotName = null;
    clock.request(slotName);
    const phase = slotName ? clock.sample() : null;
    if (phase) name = phase.frame;
    const sequenceBlink = blinking && expression === 'neutral' &&
      ((phase?.slot.procedural && blinkPatches[name]) ||
       (phase && blinkPatches[frames[name].blink?.source]));
    if (blinking && expression === 'neutral' && !sequenceBlink) requested = 'sleeping';
    const head = frames[name].face;
    const faceFor = (expr) => head ? `face-${head.group === 'front' ? '' : `${head.group}-`}${expr}` : '';
    // Yon (profile/quarter) boshlarda uyalgan yuz yo'q — eng yaqini quvnoq yuz
    if (head && !frames[faceFor(requested)] && FACE_FALLBACK[requested]) requested = FACE_FALLBACK[requested];
    const faceName = faceFor(requested);
    const emotion = head && frames[faceName] ? requested : 'neutral';
    const key = `${name}:${mirrored}:${emotion}:${Boolean(sequenceBlink)}:${phase ? `${phase.name}:${phase.tick}:${phase.running}` : ''}`;
    if (key !== previous) {
      previous = key;
      context.clearRect(0, 0, SIZE, SIZE);
      const base = draw(name, mirrored, phase?.slot.procedural ? phase.seconds : null, Boolean(sequenceBlink),
        phase?.slot.procedural || null);
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
      canvas.dataset.slot = phase?.name || '';
      canvas.dataset.animated = String(Boolean(phase?.running));
      canvas.dataset.blink = String(Boolean(sequenceBlink));
    }
    clearTimeout(animationTimer); animationTimer = null;
    if (phase?.running) animationTimer = setTimeout(() => paint(), phase.delay);
    turn();
  }

  const ready = fetch('chibi/frames/manifest.json').then(r => {
    if (!r.ok) throw new Error('Kadrlar ro‘yxati yuklanmadi');
    return r.json();
  }).then(async manifest => {
    const normalized = window.ChibiSequences.normalizeManifest(manifest);
    frames = normalized.frames; slots = normalized.slots;
    clock = new window.ChibiSequences.SequenceClock(slots);
    await Promise.all(Object.entries(frames).filter(([, frame]) => !frame.sequenceOnly).map(async ([name, frame]) => {
      const image = new Image(); image.src = `chibi/frames/${name}.png`; await image.decode();
      if (image.naturalWidth !== frame.width || image.naturalHeight !== frame.height) throw new Error(`Kadr o‘lchami noto‘g‘ri: ${name}`);
      frames[name] = { ...frame, image };
    }));
    // Kadrli (sequenceOnly) slotlar uchun: bir martalik decode; slot almashganda kutish va qayta decode yo'q.
    cache = new window.ChibiSequences.FrameCache({ mode: 'all', load: async name => {
      const frame = frames[name];
      const response = await fetch(`chibi/${frame.src}`);
      if (!response.ok) throw new Error(`Kadr yuklanmadi: ${name}`);
      const image = await createImageBitmap(await response.blob());
      if (image.width !== frame.width || image.height !== frame.height) { image.close(); throw new Error(`Kadr o‘lchami noto‘g‘ri: ${name}`); }
      return image;
    } });
    const optional = Object.keys(frames).filter(name => frames[name].sequenceOnly);
    try { await cache.prepare(optional); }
    catch (error) {
      cache.clear();
      for (const [name, slot] of Object.entries(slots)) if (slot.frames.some(id => frames[id].sequenceOnly)) disabledSlots.add(name);
      console.warn('Animatsiya yuklanmadi, asl poza ishlatiladi:', error);
    }
    try { if (window.PilotIdleRig) rigs.idle = new window.PilotIdleRig(frames.stand.image); }
    catch (error) { console.warn('Idle qatlamlari tayyorlanmadi:', error); }
    try { if (window.ChibiWalkRig) rigs.walk = new window.ChibiWalkRig(frames['walk-a'].image, frames['walk-b'].image); }
    catch (error) { console.warn('Yurish qatlamlari tayyorlanmadi, oddiy poza ishlatiladi:', error); }
    blinkPatches.stand = makeBlinkPatch(239, 400, '#fbe3d2', [
      { outline: [[58,137],[64,129],[72,123],[86,122],[96,126],[103,134],[104,150],[100,158],[88,162],[74,162],[65,156],[61,148]],
        lid: [63,143,82,155,101,141] },
      { outline: [[128,130],[134,123],[144,119],[157,118],[169,123],[175,131],[175,145],[168,154],[156,158],[142,158],[133,153],[129,144]],
        lid: [132,141,151,152,171,139] }
    ]);
    blinkPatches['walk-a'] = makeBlinkPatch(271, 400, '#fbe2d4', [
      { outline: [[118,144],[125,134],[137,128],[151,127],[162,133],[168,144],[168,158],[162,168],[148,173],[133,171],[122,161]],
        lid: [123,150,145,164,165,146] },
      { outline: [[189,134],[196,127],[205,124],[213,126],[218,133],[220,146],[217,158],[210,165],[199,165],[191,157],[188,146]],
        lid: [192,146,205,157,217,143] }
    ]);
    loaded = true; paint();
  });
  window.Chibi = { ready, paint,
    setActive(on) {
      if (active === on) return;
      active = on;
      clearTimeout(turnTimer); clearTimeout(animationTimer); animationTimer = null;
      clock?.pause();
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
