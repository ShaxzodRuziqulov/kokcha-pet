// Qatlamli idle: chibi.js sequence soatidan vaqt oladi, o'z taymeri yo'q.
// Barcha qatlamlar original stand.png'dan olinadi; yangi chizilgan idle kadri yo'q.
(() => {
  const W = 239, H = 400;
  const head = [[0,0],[239,0],[239,212],[157,212],[150,190],[143,184],[96,184],[89,190],[81,212],[0,212]];
  // Harakatdan kattaroq overlap: yuqori/ichki ildizda ikkala qatlam ham qoplab turadi.
  const leftTip = [[-8,146],[64,146],[72,184],[84,218],[-8,218]];
  const rightTip = [[175,146],[247,146],[247,218],[155,218],[167,184]];
  const leftHole = [[-8,177],[46,177],[53,190],[64,218],[-8,218]];
  const rightHole = [[193,177],[247,177],[247,218],[175,218],[186,190]];
  function polygon(ctx, points) {
    ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
  }
  function mask(points, blur = 1.5) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.filter = `blur(${blur}px)`;
    ctx.fillStyle = '#fff'; ctx.beginPath(); polygon(ctx,points); ctx.fill(); return c;
  }
  function layer(image, drawMask) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const ctx = c.getContext('2d'); ctx.save(); drawMask(ctx);
    ctx.drawImage(image, 0, 0, W, H); ctx.restore(); return c;
  }
  class IdleRig {
    constructor(image) {
      if (image.naturalWidth !== W || image.naturalHeight !== H) throw new Error('Idle rig uchun original 239×400 stand.png kerak');
      this.lower = layer(image, ctx => { ctx.beginPath(); ctx.rect(0,300,W,100); ctx.clip(); });
      this.body = layer(image, ctx => {
        ctx.beginPath(); ctx.rect(0,0,W,300); ctx.clip();
        ctx.beginPath(); ctx.rect(0,0,W,H); polygon(ctx,head); ctx.clip('evenodd');
      });
      const headMask = mask(head, 1);
      const softLayer = points => {
        const c = layer(image, () => {}), ctx = c.getContext('2d');
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(headMask,0,0);
        if (points) ctx.drawImage(mask(points, 2.5),0,0);
        ctx.globalCompositeOperation = 'source-over'; return c;
      };
      this.head = softLayer();
      const headContext = this.head.getContext('2d');
      headContext.globalCompositeOperation = 'destination-out';
      headContext.drawImage(mask(leftHole,2.5),0,0);
      headContext.drawImage(mask(rightHole,2.5),0,0);
      headContext.globalCompositeOperation = 'source-over';
      this.left = softLayer(leftTip);
      this.right = softLayer(rightTip);
      this.original = image;
    }
    draw(ctx, seconds, x = 0, y = 0, width = W, height = H) {
      const phase = seconds * Math.PI * 2 / 3.2;
      const breath = (1 - Math.cos(phase)) / 2;
      const rise = 3.5 * breath;
      ctx.save(); ctx.translate(x,y); ctx.scale(width/W,height/H);
      ctx.drawImage(this.lower,0,0);
      ctx.save(); ctx.translate(0,300); ctx.scale(1,1+rise/116); ctx.translate(0,-300);
      ctx.drawImage(this.body,0,0);
      // Yoqa ostida kichik overlap: bosh ko'tarilganda shaffof yoriq ochilmaydi.
      ctx.drawImage(this.original,96,185,49,10,96,182,49,13);
      ctx.restore();
      ctx.save(); ctx.translate(119.5,184-rise); ctx.rotate(Math.sin(phase)*0.015);
      ctx.translate(-119.5,-184);
      // Feather maskalar keskin y=158 chokini almashtiradi; overlap harakatda ham qoladi.
      ctx.drawImage(this.head,0,0);
      for (const [tip,px,angle] of [[this.left,58,Math.sin(phase+.6)*.035],
        [this.right,181,Math.sin(phase-.6)*-.035]]) {
        ctx.save(); ctx.translate(px,158); ctx.rotate(angle); ctx.translate(-px,-158);
        ctx.drawImage(tip,0,0); ctx.restore();
      }
      ctx.restore(); ctx.restore();
    }
  }
  window.PilotIdleRig = IdleRig;
})();
