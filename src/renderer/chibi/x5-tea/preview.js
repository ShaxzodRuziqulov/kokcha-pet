(() => {
  const oldCanvas = document.getElementById('old'), canvas = document.getElementById('new');
  const play = document.getElementById('play'), status = document.getElementById('status');
  const player = new X5Tea.TeaPreview(canvas, { onBusy: ms => window.pet?.busy(ms) });
  oldCanvas.width = oldCanvas.height = 180;
  const oldFrames = [];
  const load = async name => {
    const image = new Image(); image.src = `../frames/${name}`; await image.decode(); return image;
  };
  const ready = Promise.all([
    player.ready,
    Promise.all(['stand.png', ...Array.from({ length: 22 }, (_, i) => `tea-${String(i + 2).padStart(2, '0')}.webp`), 'stand.png']
      .map(async (name, index) => { oldFrames[index] = await load(name); })),
  ]);
  function drawOld(seconds) {
    const frame = seconds >= 2 ? oldFrames[0] : oldFrames[Math.min(23, Math.floor(seconds * 12))];
    const ctx = oldCanvas.getContext('2d'), scale = 176 / 400;
    ctx.clearRect(0, 0, 180, 180); ctx.drawImage(frame, (180 - 239 * scale) / 2, 4, 239 * scale, 176);
  }
  async function run() {
    if (player.run) return;
    play.disabled = true; status.textContent = 'Ijro etilmoqda…';
    const start = performance.now();
    const timer = setInterval(() => drawOld((performance.now() - start) / 1000), 50);
    const completed = await player.play();
    clearInterval(timer); drawOld(2); play.disabled = false;
    status.textContent = completed ? 'Tugadi. Yana ko‘rishingiz mumkin.' : 'To‘xtatildi.';
  }
  play.addEventListener('click', run);
  document.getElementById('stop').addEventListener('click', () => player.cancel());
  canvas.addEventListener('pointerdown', () => player.cancel());
  document.addEventListener('visibilitychange', () => player.setVisible(!document.hidden));
  ready.then(() => { play.disabled = false; drawOld(0); return run(); }).catch(error => {
    status.textContent = 'Rasmlar yuklanmadi.'; console.error(error);
  });
  // Exposed only on this isolated review page; production has no X5 import.
  window.x5Review = { player, ready, drawOld };
})();
