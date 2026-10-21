// X5 preview only. Nothing in the production index imports this module.
(() => {
  const W = 239, H = 400, SIZE = 180, SCALE = 176 / H;
  const TEA_SIP_SECONDS = 2.4;
  const KEYS = ['K1', 'side', 'K2', 'K3', 'K4', 'K5'];
  const ease = value => { const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t); };
  const makeCanvas = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  async function load(src) {
    const image = new Image(); image.src = src; await image.decode(); return image;
  }
  function masked(image, mask, operation) {
    const canvas = makeCanvas(), ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0); ctx.globalCompositeOperation = operation;
    ctx.drawImage(mask, 0, 0); return canvas;
  }
  function expression(head, overlay) {
    const canvas = makeCanvas(), ctx = canvas.getContext('2d');
    ctx.drawImage(head, 0, 0); ctx.drawImage(overlay, 0, 0); return canvas;
  }
  function timeline(sip) {
    return [
      { key: 'K1', seconds: .15, phase: 'entry' },
      { key: 'side', seconds: .15, phase: 'entry' },
      { key: 'K2', seconds: .2, phase: 'entry' },
      { key: 'K2', seconds: .6, phase: 'anticipation' },
      { key: 'K2', seconds: .12, phase: 'raise' },
      { key: 'K3', seconds: .28, phase: 'raise', face: 'sleeping', tilt: 'in' },
      { key: 'K3', seconds: sip, phase: 'sip', face: 'sleeping', tilt: 'hold' },
      { key: 'K3', seconds: .12, phase: 'lower', face: 'sleeping', tilt: 'out' },
      { key: 'K5', seconds: .28, phase: 'lower', face: 'happy' },
      { key: 'K5', seconds: .7, phase: 'satisfied', face: 'happy' },
      { key: 'K2', seconds: .2, phase: 'return' },
      { key: 'side', seconds: .25, phase: 'return' },
      { key: 'K1', seconds: .15, phase: 'return' },
      { key: 'K1', seconds: .9, phase: 'rest' },
    ];
  }
  class TeaPreview {
    constructor(canvas, { ratio = 1, sipSeconds = TEA_SIP_SECONDS, onBusy = () => {} } = {}) {
      if (!Number.isFinite(sipSeconds) || sipSeconds < 1 || sipSeconds > 6) throw new Error('Invalid sip duration');
      this.canvas = canvas; this.ctx = canvas.getContext('2d');
      canvas.width = canvas.height = SIZE * ratio;
      canvas.style.width = canvas.style.height = `${SIZE}px`;
      this.ratio = ratio; this.parts = timeline(sipSeconds);
      this.duration = this.parts.reduce((sum, part) => sum + part.seconds, 0);
      this.onBusy = onBusy; this.run = null; this.visible = true;
      this.ready = this.prepare().then(() => { this.loaded = true; this.renderAt(0); });
    }
    async prepare() {
      this.images = {};
      await Promise.all(KEYS.map(async key => { this.images[key] = await load(`keys/${key}.png`); }));
      const [headMask, frontMask, sleep, happy, steam3, steam4] = await Promise.all([
        load('masks/head-alpha.png'), load('masks/sip-front-alpha.png'),
        load('keys/face-sleeping.png'), load('keys/face-happy.png'),
        load('keys/K3-steam.png'), load('keys/K4-steam.png'),
      ]);
      const head = masked(this.images.K1, headMask, 'destination-in');
      this.heads = { neutral: head, sleeping: expression(head, sleep), happy: expression(head, happy) };
      this.steam = { K3: steam3, K4: steam4 }; this.layers = {};
      for (const key of KEYS) {
        this.layers[key] = {
          body: masked(this.images[key], headMask, 'destination-out'),
          front: ['K3', 'K4'].includes(key) ? masked(this.images[key], frontMask, 'destination-in') : null,
        };
      }
    }
    sample(seconds) {
      let time = Math.max(0, seconds);
      for (const part of this.parts) {
        if (time < part.seconds) {
          const key = part.phase === 'sip' && Math.floor(time / .32) % 2 ? 'K4' : part.key;
          return { ...part, key, elapsed: time };
        }
        time -= part.seconds;
      }
      return { key: 'K1', phase: 'rest', elapsed: 0, seconds: 1 };
    }
    renderAt(seconds) {
      if (!this.loaded) return;
      const part = this.sample(seconds), { key } = part;
      const ctx = this.ctx, layer = this.layers[key];
      const sipping = part.phase === 'sip';
      const rise = sipping ? .75 * (1 - Math.cos(part.elapsed * Math.PI * 2 / 1.6)) : 0;
      const shoulder = key === 'K4' ? 1 : 0;
      const tilt = part.tilt === 'in' ? ease(part.elapsed / part.seconds)
        : part.tilt === 'out' ? 1 - ease(part.elapsed / part.seconds) : part.tilt === 'hold' ? 1 : 0;
      ctx.setTransform(this.ratio, 0, 0, this.ratio, 0, 0);
      ctx.clearRect(0, 0, SIZE, SIZE);
      if (key === 'K1') {
        ctx.drawImage(this.images.K1, (SIZE - W * SCALE) / 2, SIZE - H * SCALE, W * SCALE, H * SCALE);
        this.state = { key, phase: part.phase, elapsed: seconds, rise: 0, tiltDegrees: 0 };
        this.canvas.dataset.key = key; this.canvas.dataset.phase = part.phase;
        return;
      }
      ctx.save(); ctx.translate((SIZE - W * SCALE) / 2, SIZE - H * SCALE); ctx.scale(SCALE, SCALE);
      // Original feet stay on the original baseline; breathing transforms only existing layers.
      ctx.drawImage(layer.body, 0, 300, W, 100, 0, 300, W, 100);
      ctx.save(); ctx.translate(0, 300 - shoulder); ctx.scale(1, 1 + rise / 116); ctx.translate(0, -300);
      ctx.drawImage(layer.body, 0, 0, W, 300, 0, 0, W, 300); ctx.restore();
      // Small original collar overlap prevents a transparent seam under a nodding head.
      ctx.drawImage(this.images.K1, 96, 185, 49, 10, 96, 182 - rise, 49, 13);
      ctx.save(); ctx.translate(119.5, 184 - rise); ctx.rotate(tilt * 2.2 * Math.PI / 180);
      ctx.translate(-119.5, -184); ctx.drawImage(this.heads[part.face || 'neutral'], 0, 0); ctx.restore();
      if (layer.front) ctx.drawImage(layer.front, 0, -rise - shoulder);
      if (this.steam[key]) ctx.drawImage(this.steam[key], 0, -rise - shoulder);
      ctx.restore();
      this.state = { key, phase: part.phase, elapsed: seconds, rise, tiltDegrees: tilt * 2.2 };
      this.canvas.dataset.key = key; this.canvas.dataset.phase = part.phase;
    }
    async play() {
      await this.ready;
      if (this.run || !this.visible) return false;
      return new Promise(resolve => {
        const run = { started: performance.now(), resolve };
        this.run = run; this.onBusy(1500);
        run.heartbeat = setInterval(() => this.onBusy(1500), 750);
        const tick = () => {
          if (this.run !== run) return;
          const time = (performance.now() - run.started) / 1000;
          this.renderAt(time);
          if (time >= this.duration) { this.finish(true); return; }
          run.timer = setTimeout(tick, 50);
        };
        tick();
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
  window.X5Tea = { TeaPreview, TEA_SIP_SECONDS, KEYS };
})();
