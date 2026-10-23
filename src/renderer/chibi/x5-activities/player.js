// Isolated X5 review player. Production does not import this module.
(() => {
  const W = 399, H = 400, SIZE = 180, SCALE = 176 / H;
  const CONFIG = Object.freeze({
    wave: { title: 'Qo‘l silkitish', duration: 3, start: .5, end: 2.5 },
    read: { title: 'Kitob o‘qish', duration: 13, start: .5, end: 12 },
    water: { title: 'Gul sug‘orish', duration: 6.5, start: .7, end: 5.6 },
    stretch: { title: 'Cho‘zilish', duration: 4.5, start: 1.35, end: 2.35 },
  });
  const ease = v => { const x = Math.max(0, Math.min(1, v)); return x * x * (3 - 2 * x); };
  const radians = degrees => degrees * Math.PI / 180;
  async function load(name) {
    const image = new Image(); image.src = `keys/${name}.png`; await image.decode(); return image;
  }
  function transformed(ctx, image, x, y, degrees, dx = 0, dy = 0, scale = 1) {
    ctx.save(); ctx.translate(x + dx, y + dy); ctx.rotate(radians(degrees));
    ctx.scale(scale, scale);
    ctx.translate(-x, -y); ctx.drawImage(image, 0, 0); ctx.restore();
  }
  class ActivityPreview {
    constructor(canvas, name, { ratio = 1, onBusy = () => {} } = {}) {
      if (!Object.hasOwn(CONFIG, name)) throw new Error('Unknown X5 activity');
      if (!Number.isFinite(ratio) || ratio < 1 || ratio > 4) throw new Error('Invalid canvas ratio');
      this.name = name; this.config = CONFIG[name]; this.duration = this.config.duration;
      this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.ratio = ratio;
      canvas.width = canvas.height = SIZE * ratio;
      canvas.style.width = canvas.style.height = `${SIZE}px`;
      this.run = null; this.visible = true; this.onBusy = onBusy;
      this.ready = this.prepare().then(() => { this.loaded = true; this.renderAt(0); });
    }
    async prepare() {
      const common = ['stand', 'head', 'eyes', 'face-happy', 'face-sleeping', `${this.name}-body`];
      const extra = this.name === 'stretch' ? ['stretch-left', 'stretch-right']
        : this.name === 'water' ? ['water-arms', 'water-stream', 'water-drops', 'water-pot', 'water-flower']
        : this.name === 'read' ? ['read-arms', 'read-page'] : ['wave-arms'];
      this.images = Object.fromEntries(await Promise.all([...common, ...extra].map(async n => [n, await load(n)])));
      if (this.name === 'water') {
        this.flowCanvas = Object.assign(document.createElement('canvas'), { width: W, height: H });
        this.flowContext = this.flowCanvas.getContext('2d');
      }
    }
    sample(seconds) {
      const t = Math.max(0, Math.min(this.duration, seconds)), c = this.config;
      const entryEnd = this.name === 'stretch' ? 1.35 : c.start;
      const exitEnd = this.name === 'stretch' ? 3.85 : this.name === 'read' ? 12.4
        : this.name === 'water' ? 6.1 : 2.85;
      const active = t >= .15 && t < exitEnd;
      const amount = t < entryEnd ? ease((t - .15) / (entryEnd - .15))
        : t > c.end ? 1 - ease((t - c.end) / (exitEnd - c.end)) : 1;
      return { t, active, amount, phase: !active ? 'rest' : t < entryEnd ? 'entry' : t < c.end ? 'main' : 'return', elapsed: Math.max(0, t - c.start) };
    }
    renderAt(seconds) {
      if (!this.loaded) return;
      const s = this.sample(seconds), { t, amount: a } = s;
      const ctx = this.ctx, im = this.images, name = this.name;
      ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0); ctx.clearRect(0, 0, SIZE, SIZE);
      ctx.save(); ctx.translate((SIZE - W * SCALE) / 2, SIZE - H * SCALE); ctx.scale(SCALE, SCALE);
      if (!s.active) {
        ctx.drawImage(im.stand, 0, 0); ctx.restore(); this.state = { ...s, rise: 0 }; return;
      }
      // A single uninterrupted body layer, anchored at the sole. Never split at
      // y300: the tea review found that split exposed a horizontal hem gap.
      const rise = a * .55 * (1 - Math.cos(s.elapsed * Math.PI * 2 / 3.2));
      let headAngle = 0, face = null, armAngle = 0;
      if (name === 'wave') {
        armAngle = -65 * (1 - a) + (s.phase === 'main' ? 7 * Math.sin(s.elapsed * Math.PI * 3) : 0);
        transformed(ctx, im['wave-arms'], 169, 215, armAngle, 0, -rise, .85 + .15 * a);
        if (s.phase === 'main') face = 'happy';
      } else if (name === 'stretch') {
        armAngle = 100 * (1 - a);
        transformed(ctx, im['stretch-left'], 170, 215, -armAngle, 0, -rise, .58 + .42 * a);
        transformed(ctx, im['stretch-right'], 229, 215, armAngle, 0, -rise, .58 + .42 * a);
        if (a > .85) face = 'sleeping';
      } else if (name === 'water') {
        armAngle = 35 * (1 - a);
        transformed(ctx, im['water-arms'], 236, 218, armAngle, 0, -rise);
        const plantX = 62 * (1 - a);
        ctx.drawImage(im['water-pot'], plantX, 0);
        transformed(ctx, im['water-flower'], 326, 350, a * Math.sin(s.elapsed * 4.2) * 2, plantX);
        if (s.phase === 'main') {
          const flow = this.flowContext, travel = (s.elapsed * 52) % 76;
          flow.clearRect(0, 0, W, H); flow.drawImage(im['water-stream'], 0, 0);
          for (const dy of [travel - 76, travel, travel + 76]) flow.drawImage(im['water-drops'], dy * .24, dy);
          flow.globalCompositeOperation = 'destination-in'; flow.drawImage(im['water-stream'], 0, 0);
          flow.globalCompositeOperation = 'source-over';
          // Existing painted stream, stretched from the nozzle to fixed soil.
          // The top anchor follows the same breathing displacement as the can.
          const pulse = Math.sin(s.elapsed * Math.PI * 4) * .012;
          ctx.save(); ctx.translate(337, 276 - rise); ctx.scale(1 + pulse, (76 + rise) / 76);
          ctx.translate(-337, -276); ctx.drawImage(this.flowCanvas, 0, 0); ctx.restore();
        }
      }
      // Keep the source head's angle: complete arms pass behind the hair.
      // Breathing raises it with the uninterrupted body; no synthetic shoulder
      // patch is exposed when the overhead sleeves move out of the way.
      ctx.save(); ctx.translate(0, 398); ctx.scale(1, 1 + rise / 214); ctx.translate(0, -398);
      ctx.drawImage(im[`${name}-body`], 0, 0); ctx.restore();
      if (name === 'read') {
        // Complete raster sleeves move behind the collar/hair, with their
        // natural alpha contour. No rectangular sleeve extension patches.
        ctx.drawImage(im['read-arms'], 0, 12 * (1 - a) - rise);
      }
      // Original collar underlap covers the seam under a tilting head.
      ctx.drawImage(im.stand, 176, 185, 49, 10, 176, 182 - rise, 49, 13);
      ctx.save(); ctx.translate(199.5, 184 - rise); ctx.rotate(radians(headAngle)); ctx.translate(-199.5, -184);
      ctx.drawImage(im.head, 0, 0);
      let gaze = null, pageTurn = false;
      if (name === 'read') {
        const scan = (s.elapsed % 2.4) / 2.4;
        const x = a * (scan < .88 ? -1.6 + 3.2 * scan / .88 : 1.6 - 3.2 * ease((scan - .88) / .12));
        const y = a * (1.2 + Math.floor((s.elapsed % 4.8) / 1.2) * .3);
        ctx.drawImage(im.eyes, x, y); gaze = { x, y };
        if (s.phase === 'main' && s.elapsed % 3.6 > 3.47) face = 'sleeping';
      } else if (name === 'water') { ctx.drawImage(im.eyes, a * 1.3, a * 1.4); }
      if (face) ctx.drawImage(im[`face-${face}`], 0, 0);
      ctx.restore();
      if (name === 'read') {
        const dy = 12 * (1 - a) - rise;
        const turning = [3.3, 7.5].find(start => s.elapsed >= start && s.elapsed < start + .9);
        if (turning !== undefined) {
          const p = (s.elapsed - turning) / .9;
          ctx.save(); ctx.translate(200, 225 + dy); ctx.scale(Math.max(.06, Math.sin(p * Math.PI)), 1);
          ctx.translate(-200, -225); ctx.drawImage(im['read-page'], 0, 0); ctx.restore(); pageTurn = true;
        }
      }
      ctx.restore(); this.state = { ...s, rise, armAngle, headAngle, gaze, pageTurn };
      this.canvas.dataset.phase = s.phase;
    }
    async play() {
      await this.ready;
      if (this.run || !this.visible) return false;
      return new Promise(resolve => {
        const run = { started: performance.now(), resolve }; this.run = run;
        this.onBusy(1500); run.heartbeat = setInterval(() => this.onBusy(1500), 750);
        const tick = () => {
          if (this.run !== run) return;
          const t = (performance.now() - run.started) / 1000; this.renderAt(t);
          if (t >= this.duration) { this.finish(true); return; }
          run.timer = setTimeout(tick, 50);
        }; tick();
      });
    }
    finish(completed) {
      const run = this.run; if (!run) return;
      this.run = null; clearTimeout(run.timer); clearInterval(run.heartbeat);
      this.renderAt(0); run.resolve(completed);
    }
    cancel() { this.finish(false); }
    setVisible(visible) { this.visible = Boolean(visible); if (!visible) this.cancel(); }
  }
  window.X5Activities = { ActivityPreview, CONFIG };
})();
