// Soat renderdan ajratilgan: paint/look chaqiruvi animatsiya fazasini qaytarmaydi.
(() => {
  class SequenceClock {
    constructor(slots) { this.slots = slots; this.current = null; this.requested = null; this.running = false; this.elapsed = 0; this.done = false; }
    pause(now = performance.now()) {
      if (this.running) this.elapsed = now - this.started;
      this.running = false;
    }
    request(name, now = performance.now()) {
      if (!name || !this.slots[name]) { this.pause(now); this.requested = null; return; }
      if (this.requested !== name) {
        if (this.current !== name) { this.current = name; this.elapsed = 0; this.done = false; this.running = false; }
        this.requested = name;
      }
      if (!this.running && !this.done) { this.started = now - this.elapsed; this.running = true; }
    }
    sample(now = performance.now()) {
      if (!this.current) return null;
      let elapsed = this.running ? now - this.started : this.elapsed;
      let slot = this.slots[this.current];
      // next zanjiri buzilgan konfiguratsiyada ham cheksiz siklga kirmaydi.
      for (let transitions = 0; transitions < 32; transitions++) {
        const duration = (slot.duration || slot.frames.length / slot.fps) * 1000;
        if (slot.loop || elapsed < duration) break;
        if (!slot.next || !this.slots[slot.next]) {
          elapsed = Math.max(0, duration - .001); this.elapsed = elapsed; this.running = false; this.done = true; break;
        }
        elapsed -= duration; this.current = slot.next; slot = this.slots[this.current];
        this.started = now - elapsed; this.elapsed = elapsed;
        if (transitions === 31) { this.running = false; this.done = true; }
      }
      const tick = Math.floor(elapsed * slot.fps / 1000);
      const index = slot.loop ? tick % slot.frames.length : Math.min(tick, slot.frames.length - 1);
      return { name: this.current, slot, frame: slot.frames[index], index, tick,
        seconds: elapsed / 1000, delay: Math.max(1, (tick + 1) * 1000 / slot.fps - elapsed), running: this.running };
    }
  }
  function normalizeManifest(manifest) {
    const frames = manifest.version === 2 ? manifest.frames : manifest;
    if (!frames || typeof frames !== 'object' || Array.isArray(frames)) throw new Error('Kadrlar ro‘yxati noto‘g‘ri');
    const slots = {};
    for (const [name, slot] of Object.entries(manifest.version === 2 ? manifest.slots || {} : {})) {
      if (!slot || !Array.isArray(slot.frames) || !slot.frames.length || !slot.frames.every(id => frames[id]) ||
          !Number.isFinite(slot.fps) || slot.fps < 1 || slot.fps > 60 || typeof slot.loop !== 'boolean' ||
          (slot.duration !== undefined && (!Number.isFinite(slot.duration) || slot.duration <= 0))) continue;
      slots[name] = { ...slot };
    }
    for (const slot of Object.values(slots)) if (!slots[slot.next]) slot.next = null;
    return { frames, slots };
  }
  class FrameCache {
    constructor({ load, release = image => image.close?.(), mode = 'all' }) {
      this.load = load; this.release = release; this.mode = mode; this.entries = new Map(); this.wanted = new Set();
    }
    get(id) { return this.entries.get(id)?.value || null; }
    async prepare(ids) {
      this.wanted = new Set(ids);
      if (this.mode === 'active') for (const [id, entry] of this.entries) {
        if (!this.wanted.has(id)) { if (entry.value) this.release(entry.value); this.entries.delete(id); }
      }
      return Promise.all(ids.map(id => {
        if (this.entries.has(id)) return this.entries.get(id).promise;
        const entry = {};
        entry.promise = Promise.resolve().then(() => this.load(id)).then(value => {
          if (this.entries.get(id) !== entry || (this.mode === 'active' && !this.wanted.has(id))) {
            this.release(value); return null;
          }
          entry.value = value; return value;
        }).catch(error => { if (this.entries.get(id) === entry) this.entries.delete(id); throw error; });
        this.entries.set(id, entry); return entry.promise;
      }));
    }
    clear() { for (const entry of this.entries.values()) if (entry.value) this.release(entry.value); this.entries.clear(); this.wanted.clear(); }
  }
  window.ChibiSequences = { SequenceClock, normalizeManifest, FrameCache };
})();
