// Yurish: asl walk-a / walk-b rasmlaridan cutout animatsiya. Yangi chizilgan piksel yo'q.
// - Ustki qism (bosh, gavda, yubka) doim walk-a — bosh va tana bir bo'lak, bo'yin "sinmaydi".
// - Oyoqlar: yerga tegishda walk-a, oraliq fazada walk-b. Oyoqlar doim yerda, tana esa
//   qadamga mos ko'tariladi (walk-b'da tik oyoq tanani 12 px yuqori ushlaydi).
// - Qo'llar oyoqlarga qarama-qarshi ±5° siltanadi.
// Sikl 1 s: ekranda 100 px/s tezlikda qadam uzunligiga mos — oyoqlar sirpanmaydi.
(() => {
  const W = 271, H = 400, PERIOD = 1.0, BOB = 12;
  // walk-a koordinatalari. Yubka etagidan pastdagi hamma narsa — oyoqlar.
  const HEM = [[20,330],[70,330],[84,306],[100,311],[120,313],[140,314],[160,313],[178,310],[196,304],[206,300],[271,300],[271,400],[20,400]];
  // Yenglar o'z konturi bo'ylab, yubkasiz; aylanish nuqtasi — yelka.
  const BACK_ARM = [[44,262],[52,252],[70,240],[100,228],[126,225],[128,250],[106,262],[92,274],[82,284],[68,290],[54,292],[44,284]];
  const FRONT_ARM = [[174,232],[205,226],[240,234],[254,248],[252,272],[232,280],[205,284],[190,281],[178,268],[172,250]];
  const BACK_PIVOT = [124, 244], FRONT_PIVOT = [182, 236];
  // Tanadan faqat fon ustidagi yeng/qo'l o'chiriladi (yubka burchaklariga tegmaydi).
  const BACK_OUTER = [[0,226],[104,222],[104,256],[86,272],[74,296],[0,300]];
  const FRONT_OUTER = [[205,226],[271,226],[271,300],[200,300],[198,282]];
  // Orqa yeng ostida yubka chizilmagan: qo'l burilganda ochiladigan joy uchun yubka rangidagi taglik.
  const SKIRT_FILL = [[80,296],[90,280],[104,268],[120,262],[124,292]];
  const B_DX = -4;   // walk-b tik oyog'i walk-a soni ostiga tushadi

  const canvas = () => Object.assign(document.createElement('canvas'), { width: W, height: H });
  function path(ctx, points) {
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (const point of points.slice(1)) ctx.lineTo(...point);
    ctx.closePath();
  }
  function mask(points, blur = 0.8) {
    const c = canvas(), ctx = c.getContext('2d');
    ctx.filter = `blur(${blur}px)`; ctx.fillStyle = '#fff'; path(ctx, points); ctx.fill(); return c;
  }
  function composite(source, maskCanvas, operation) {
    const c = canvas(), ctx = c.getContext('2d');
    ctx.drawImage(source, 0, 0); ctx.globalCompositeOperation = operation; ctx.drawImage(maskCanvas, 0, 0); return c;
  }
  const keep = (source, points, blur) => composite(source, mask(points, blur), 'destination-in');
  const cut = (source, points) => composite(source, mask(points), 'destination-out');
  // Son yuqorisini yubka ostiga cho'zadi: tana ko'tarilganda etak ostida bo'shliq ochilmaydi.
  function extendThighs(legs, source, fromY, toY) {
    const ctx = legs.getContext('2d');
    ctx.globalCompositeOperation = 'destination-over';
    ctx.drawImage(source, 112, fromY, 52, 6, 112, toY, 52, fromY - toY + 6);
  }

  class WalkRig {
    constructor(a, b) {
      if (a.naturalWidth !== W || a.naturalHeight !== H) throw new Error('Walk rig uchun original 271×400 walk-a.png kerak');
      const bAligned = canvas(); bAligned.getContext('2d').drawImage(b, B_DX, 0);
      this.legsA = keep(a, HEM);
      extendThighs(this.legsA, a, 313, 296);
      this.legsB = keep(bAligned, [[0,299],[W,299],[W,H],[0,H]], 0.6);
      extendThighs(this.legsB, bAligned, 300, 284);
      const upper = cut(a, HEM);
      const body = cut(cut(upper, BACK_OUTER), FRONT_OUTER);
      this.body = canvas();
      const ctx = this.body.getContext('2d');
      ctx.fillStyle = '#2b2729'; path(ctx, SKIRT_FILL); ctx.fill();
      ctx.drawImage(body, 0, 0);
      this.backArm = keep(upper, BACK_ARM);
      this.frontArm = keep(upper, FRONT_ARM);
    }

    // seconds — sikl ichidagi vaqt; blinkPatch — walk-a koordinatalaridagi yopiq ko'z (tana bilan birga chiziladi)
    draw(ctx, seconds, x = 0, y = 0, width = W, height = H, blinkPatch = null) {
      const phase = ((seconds / PERIOD) % 1 + 1) % 1;
      const s = Math.sin(2 * Math.PI * phase);
      const lift = BOB * s * s;                             // 0 — yerga tegish, 12 — oraliq
      const legs = (phase * 4 + 0.5) % 2 < 1 ? this.legsA : this.legsB;
      const swing = Math.cos(2 * Math.PI * phase) * 0.09;
      ctx.save(); ctx.translate(x, y); ctx.scale(width / W, height / H);
      ctx.drawImage(legs, 0, 0);
      ctx.translate(0, -lift);
      ctx.drawImage(this.body, 0, 0);
      if (blinkPatch) ctx.drawImage(blinkPatch, 0, 0);
      for (const [arm, [px, py], angle] of [[this.backArm, BACK_PIVOT, swing], [this.frontArm, FRONT_PIVOT, -swing]]) {
        ctx.save(); ctx.translate(px, py); ctx.rotate(angle); ctx.translate(-px, -py); ctx.drawImage(arm, 0, 0); ctx.restore();
      }
      ctx.restore();
    }
  }
  window.ChibiWalkRig = WalkRig;
})();
