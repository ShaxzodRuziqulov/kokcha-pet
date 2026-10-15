// Sifat sinovi moduli. Runtime chibi.js'ga hali ulanmagan.
// Barcha qatlamlar original stand.png'dan olinadi; yangi chizilgan idle kadri yo'q.
(() => {
  const W = 239, H = 400;
  const head = [[0,0],[239,0],[239,212],[157,212],[150,190],[143,184],[96,184],[89,190],[81,212],[0,212]];
  const leftTip = [[0,158],[58,158],[64,184],[76,212],[0,212]];
  const rightTip = [[181,158],[239,158],[239,212],[163,212],[175,184]];
  function polygon(ctx, points) {
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
  }
  function layer(image, drawMask) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.save(); drawMask(ctx);
    ctx.drawImage(image, 0, 0, W, H); ctx.restore(); return c;
  }
  function headClip(ctx) { ctx.beginPath(); polygon(ctx, head); ctx.clip(); }
  class IdleRig {
    constructor(image) {
      if (image.naturalWidth !== W || image.naturalHeight !== H) throw new Error('Idle rig uchun original 239×400 stand.png kerak');
      this.lower = layer(image, ctx => { ctx.beginPath(); ctx.rect(0,300,W,100); ctx.clip(); });
      this.body = layer(image, ctx => {
        ctx.beginPath(); ctx.rect(0,0,W,300); ctx.clip();
        ctx.beginPath(); ctx.rect(0,0,W,H); polygon(ctx,head); ctx.clip('evenodd');
      });
      this.head = layer(image, ctx => {
        headClip(ctx);
        ctx.beginPath(); ctx.rect(0,0,W,H); polygon(ctx,leftTip); polygon(ctx,rightTip); ctx.clip('evenodd');
      });
      this.left = layer(image, ctx => { headClip(ctx); ctx.beginPath(); polygon(ctx,leftTip); ctx.clip(); });
      this.right = layer(image, ctx => { headClip(ctx); ctx.beginPath(); polygon(ctx,rightTip); ctx.clip(); });
      this.original = image;
    }
    draw(ctx, seconds, x = 0, y = 0, width = W, height = H) {
      const phase = seconds * Math.PI * 2 / 3.2;
      const breath = (1 - Math.cos(phase)) / 2;
      const rise = 1.4 * breath;
      ctx.save(); ctx.translate(x,y); ctx.scale(width/W,height/H);
      ctx.drawImage(this.lower,0,0);
      ctx.save(); ctx.translate(0,300); ctx.scale(1,1+rise/116); ctx.translate(0,-300);
      ctx.drawImage(this.body,0,0);
      // Yoqa ostida kichik overlap: bosh ko'tarilganda shaffof yoriq ochilmaydi.
      ctx.drawImage(this.original,96,185,49,10,96,182,49,13);
      ctx.restore();
      ctx.save(); ctx.translate(119.5,184-rise); ctx.rotate(Math.sin(phase)*0.006);
      ctx.translate(-119.5,-184);
      // Ildizdagi overlap qatlam ajralishini yopadi; siluet uchlari mustaqil tebranadi.
      ctx.save(); ctx.beginPath(); ctx.rect(53,158,16,55); ctx.rect(171,158,16,55); ctx.clip();
      ctx.drawImage(this.original,0,0); ctx.restore();
      ctx.drawImage(this.head,0,0);
      for (const [tip,px,angle] of [[this.left,58,Math.sin(phase+.6)*.014],
        [this.right,181,Math.sin(phase-.6)*-.014]]) {
        ctx.save(); ctx.translate(px,158); ctx.rotate(angle); ctx.translate(-px,-158);
        ctx.drawImage(tip,0,0); ctx.restore();
      }
      ctx.restore(); ctx.restore();
    }
  }
  window.PilotIdleRig = IdleRig;
})();
