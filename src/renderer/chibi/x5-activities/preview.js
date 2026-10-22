(() => {
  const canvas = document.getElementById('new'), oldCanvas = document.getElementById('old');
  const play = document.getElementById('play'), status = document.getElementById('status');
  oldCanvas.width = oldCanvas.height = 180;
  const players = {}, oldFrames = {}; let selected = 'wave', runToken = 0;
  const load = async src => { const im = new Image(); im.src = src; await im.decode(); return im; };
  for (const name of Object.keys(X5Activities.CONFIG)) {
    players[name] = new X5Activities.ActivityPreview(document.createElement('canvas'), name, { onBusy: ms => window.pet?.busy(ms) });
  }
  const ready = Promise.all(Object.keys(players).map(async name => {
    const count = name === 'wave' ? 16 : 24;
    oldFrames[name] = await Promise.all(Array.from({ length: count }, (_, i) => load(i === 0 || i === count-1 ? '../frames/stand.png' : `../frames/${name}-${String(i+1).padStart(2,'0')}.webp`)));
    await players[name].ready;
  }));
  function drawOld(seconds, name = selected) {
    const frames = oldFrames[name], c = oldCanvas.getContext('2d');
    const im = seconds >= frames.length / 12 ? frames[0] : frames[Math.floor(seconds * 12)];
    c.clearRect(0,0,180,180); c.drawImage(im, (180 - 239 * .44)/2, 4, 239 * .44, 176);
  }
  function drawNew() { const c = canvas.getContext('2d'); c.clearRect(0,0,180,180); c.drawImage(players[selected].canvas,0,0); }
  async function run() {
    const token = ++runToken, name = selected, player = players[name];
    if (player.run) return;
    play.disabled = true; status.textContent = 'Ijro etilmoqda…';
    const start = performance.now();
    const timer = setInterval(() => { drawOld((performance.now()-start)/1000,name); drawNew(); },50);
    const completed = await player.play(); clearInterval(timer);
    if (token !== runToken) return;
    drawOld(99); drawNew(); play.disabled = false;
    status.textContent = completed ? 'Tugadi. Yana ko‘rishingiz mumkin.' : 'To‘xtatildi.';
  }
  function stop() { players[selected].cancel(); }
  async function select(name) {
    ++runToken; stop(); selected = name; await ready;
    document.querySelectorAll('[data-activity]').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.activity===name)));
    document.getElementById('title').textContent = `${X5Activities.CONFIG[name].title} · ${players[name].duration} s`;
    players[name].renderAt(0); drawOld(0); drawNew(); play.disabled = false; status.textContent = 'Tayyor.';
  }
  canvas.width = canvas.height = 180;
  document.querySelectorAll('[data-activity]').forEach(b => b.addEventListener('click',async()=>{ await select(b.dataset.activity); run(); }));
  play.addEventListener('click', run); document.getElementById('stop').addEventListener('click',stop);
  canvas.addEventListener('pointerdown',stop);
  document.addEventListener('visibilitychange',()=>Object.values(players).forEach(p=>p.setVisible(!document.hidden)));
  ready.then(()=>select('wave')).catch(error=>{status.textContent='Rasmlar yuklanmadi.';console.error(error);});
  window.x5ActivitiesReview = { players, ready, drawOld, select, run, stop, drawNew, get selected() { return selected; } };
})();
