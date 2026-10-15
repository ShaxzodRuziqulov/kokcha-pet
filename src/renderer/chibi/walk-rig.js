// Yurish: asl walk-a / walk-b rasmlaridan cutout animatsiya. Yangi chizilgan piksel yo'q.
// - Ustki qism (bosh, gavda, yubka) doim walk-a — bosh va tana bir bo'lak, bo'yin "sinmaydi".
// - Oyoqlar: yerga tegishda walk-a, oraliq fazada walk-b. Oyoqlar doim yerda, tana esa
//   qadamga mos ko'tariladi (walk-b'da tik oyoq tanani 12 px yuqori ushlaydi).
// - Qo'llar oyoqlarga qarama-qarshi ±5° siltanadi.
// - Yerda turgan oyoq son bo'g'imi atrofida orqaga tebranadi (oyna oldinga yuradi): sirpanish ~yarmiga kamayadi.
//   Surish emas, aylantirish: son tepasi yubka ostida qoladi, asl rasmdagi kesik chiziqlar ochilmaydi.
// Sikl 1 s: qadam 127 px, ya'ni o'rta o'lchamda ekrandagi 100 px/s ga mos.
(() => {
  const W = 271, H = 400, PERIOD = 1.0, BOB = 12;
  // walk-a koordinatalari. Yubka etagidan pastdagi hamma narsa — oyoqlar.
  // Etakdan 3 px pastroq: yubka konturi oyoqlar qatlamiga tushmasin (oyoqlar aylanganda ajralib chiqardi).
  const HEM = [[20,333],[70,333],[84,309],[100,314],[120,316],[140,317],[160,316],[178,313],[196,307],[206,303],[271,303],[271,400],[20,400]];
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
  // Oyoqlarning yerdagi joyi (walk-a koordinatalari): A old etik 207, A orqa etik 80, B tik etik 156.
  const STEP = 207 - 80, SPEED = 2 * STEP / PERIOD;      // to'liq yopishish uchun kerakli tezlik
  const HIP = [140, 300], LEG = 100;                     // son bo'g'imi va son→tagcharm uzunligi
  const MAX_TILT = 0.14;                                  // ~8°: etik sezilarli qiyshaymaydi
  // Faza markazidan dt vaqtda tayanch oyoq qancha orqaga ketishi kerak — burchak bilan, chegaralangan
  const tilt = dt => Math.max(-MAX_TILT, Math.min(MAX_TILT, Math.asin(Math.max(-1, Math.min(1, SPEED * dt / LEG)))));
  // walk-b oyoqlarini tik oyoq konturi (x≈127) bo'ylab ajratamiz: ko'tarilgan oyoqning tizzasi va etik tepasi butun qoladi.
  // Ikki qatlam 6 px ustma-ust (x 120–126): xira chetlar bir joyga tushib fonni ochmasin.
  // Tik oyoq oldinda chiziladi va ko'tarilgan tizzaning chetini yopadi.
  const B_LIFTED = [[0,294],[100,295],[112,298],[126,300],[126,333],[110,340],[100,354],[0,354]];
  const B_PLANTED = [[120,299],[W,299],[W,H],[116,H],[116,340],[120,333]];

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
    // Butun son kengligi (x 96–190): kesik chetidagi yarim shaffof qator ham to'ldiriladi.
    // Oyoqlar son bo'g'imi atrofida aylanadi, shuning uchun bu bo'lak yubka ostidan chiqmaydi.
    ctx.drawImage(source, 96, fromY, 94, 6, 96, toY, 94, fromY - toY + 6);
  }

  class WalkRig {
    constructor(a, b) {
      if (a.naturalWidth !== W || a.naturalHeight !== H) throw new Error('Walk rig uchun original 271×400 walk-a.png kerak');
      const bAligned = canvas(); bAligned.getContext('2d').drawImage(b, B_DX, 0);
      this.legsA = keep(a, HEM);
      extendThighs(this.legsA, a, 316, 296);
      this.liftedB = keep(bAligned, B_LIFTED, 0.6);
      this.plantedB = keep(bAligned, B_PLANTED, 0.6);
      extendThighs(this.plantedB, bAligned, 300, 284);
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
      const quarter = Math.round(phase * 4);                // juft — yerga tegish (A), toq — oraliq (B)
      const dt = (phase - quarter / 4) * PERIOD;           // faza markazidan vaqt, ±PERIOD/8
      const swing = Math.cos(2 * Math.PI * phase) * 0.09;
      ctx.save(); ctx.translate(x, y); ctx.scale(width / W, height / H);
      const rotated = (img, angle) => {
        ctx.save(); ctx.translate(...HIP); ctx.rotate(angle); ctx.translate(-HIP[0], -HIP[1]);
        ctx.drawImage(img, 0, 0); ctx.restore();
      };
      if (quarter % 2 === 0) rotated(this.legsA, tilt(dt));               // ikkala oyoq yerda — birga orqaga
      else {
        rotated(this.liftedB, -tilt(dt) * 0.6);                           // havodagi oyoq oldinga tebranadi
        rotated(this.plantedB, tilt(dt));                                 // tik oyoq orqaga
      }
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
