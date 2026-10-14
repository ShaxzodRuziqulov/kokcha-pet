// PNG atlaslar bir marta o'qiladi. Canvas faqat poza/ifoda o'zgarganda chiziladi.
(() => {
  const SIZE = 150;
  const HEAD = 88;
  const canvas = document.getElementById('chibi');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.height = SIZE * ratio;
  const context = canvas.getContext('2d');
  context.scale(ratio, ratio);
  const atlases = {};
  let loaded = false;
  let latest = { state: 'idle', pose: 'stand', expression: 'neutral' };
  let lookX = 0;
  let previous = '';

  // Alfa bo'yicha chegara: generator qoldirgan juda xira piksel chetlari o'lchamni buzmaydi.
  function bounds(pixels, width, x, y, w, h) {
    let left = x + w, top = y + h, right = x, bottom = y;
    for (let py = y; py < y + h; py++) for (let px = x; px < x + w; px++) {
      if (pixels[(py * width + px) * 4 + 3] <= 24) continue;
      left = Math.min(left, px); top = Math.min(top, py);
      right = Math.max(right, px + 1); bottom = Math.max(bottom, py + 1);
    }
    if (left >= right || top >= bottom) throw new Error('Atlas katagi bo‘sh');
    return { x: left, y: top, w: right - left, h: bottom - top };
  }

  async function load(name, columns, rows, headFraction) {
    const image = new Image();
    image.src = `chibi/${name}.png`;
    await image.decode();
    const scan = document.createElement('canvas');
    scan.width = image.width; scan.height = image.height;
    const reader = scan.getContext('2d', { willReadFrequently: true });
    reader.drawImage(image, 0, 0);
    const pixels = reader.getImageData(0, 0, image.width, image.height).data;
    const frames = [];
    for (let row = 0; row < rows; row++) for (let column = 0; column < columns; column++) {
      const x = Math.floor(column * image.width / columns), y = Math.floor(row * image.height / rows);
      const w = Math.floor((column + 1) * image.width / columns) - x;
      const h = Math.floor((row + 1) * image.height / rows) - y;
      frames.push({ ...bounds(pixels, image.width, x, y, w, h), head: w * headFraction });
    }
    atlases[name] = { image, frames };
    scan.width = scan.height = 0; // Alfa skaneri va katta bitmap vaqtinchalik.
  }

  function draw(name, index, mirrored = false) {
    const { image, frames } = atlases[name];
    const frame = frames[index];
    const scale = Math.min(HEAD / frame.head, (SIZE - 4) / frame.w, (SIZE - 4) / frame.h);
    const width = frame.w * scale, height = frame.h * scale;
    const x = (SIZE - width) / 2, y = SIZE - height;
    context.save();
    if (mirrored) { context.translate(SIZE, 0); context.scale(-1, 1); }
    context.drawImage(image, frame.x, frame.y, frame.w, frame.h, x, y, width, height);
    context.restore();
    return { frame, image, scale, x, y };
  }

  const expressions = { neutral: 0, happy: 1, sad: 2, angry: 3, sleeping: 4, surprised: 5, talking: 6, embarrassed: 7 };
  function paint(options = latest) {
    latest = options;
    if (!loaded) return;
    const { state, pose, side, expression } = options;
    let name = 'standing', index = 0, mirrored = false;
    if (state === 'sleep' || pose === 'lie') { name = 'poses'; index = 2; }
    else if (pose === 'sit' || pose === 'ledge') { name = 'poses'; index = 1; }
    else if (pose === 'hang') { name = 'poses'; index = 3; mirrored = side === 'left'; }
    else if (pose === 'jump') { name = 'poses'; index = 4; }
    else if (pose === 'fall') { name = 'poses'; index = 5; }
    else if (pose === 'climb') { name = 'turnaround'; index = 3; }
    else if (state === 'walk') { name = 'poses'; index = 0; }
    else if (expression === 'neutral' && Math.abs(lookX) > 250) {
      name = 'turnaround'; index = Math.abs(lookX) > 1000 ? 2 : 1; mirrored = lookX < 0;
    }
    const emotion = name === 'standing' ? expression : 'neutral';
    const key = `${name}:${index}:${mirrored}:${emotion}`;
    if (key === previous) return;
    previous = key;
    context.clearRect(0, 0, SIZE, SIZE);
    const base = draw(name, index, mirrored);
    if (emotion !== 'neutral' && expressions[emotion] !== undefined) {
      // Yuz ifodasi o'sha PNG sheet'dan; tananing pastki qismi original rasmdan qoladi.
      const neck = Math.round(base.image.height * 0.48);
      context.clearRect(0, 0, SIZE, base.y + (neck - base.frame.y) * base.scale);
      const atlas = atlases.expressions, face = atlas.frames[expressions[emotion]];
      const width = HEAD * 1.04, height = width * face.h / face.w;
      context.drawImage(atlas.image, face.x, face.y, face.w, face.h,
        (SIZE - width) / 2, base.y, width, height);
    }
    canvas.dataset.frame = `${name}:${index}`;
    canvas.dataset.expression = emotion;
  }

  const ready = Promise.all([load('standing', 1, 1, 0.59), load('poses', 3, 2, 0.66),
    load('expressions', 4, 2, 0.98), load('turnaround', 4, 1, 0.92)]).then(() => { loaded = true; paint(); });
  window.Chibi = { ready, paint, look(dx) { lookX = dx; paint(); } };
})();
