// Isolated X6 tea preview. No production imports or runtime pixel scans.
(() => {
  const W = 239, H = 400, DURATION = 6.5;
  const KEYS = ['stand','head','head-alpha','back-hair','collar','torso','skirt','legs','lower','irises','sclera-alpha',
    'arms-K1','arms-side','arms-K2','arms-K3','arms-K5','sip-front',
    'face-sleeping','face-happy'];
  const clamp = x => Math.max(0, Math.min(1, x));
  const smooth = (a,b,t) => { const x=clamp((t-a)/(b-a)); return x*x*(3-2*x); };
  const pulse = (a,b,c,d,t) => smooth(a,b,t)*(1-smooth(c,d,t));
  const point = (m,x,y) => { const p=m.transformPoint({x,y}); return {x:p.x,y:p.y}; };
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const pivot = (x,y,angle,sx=1,sy=1,dx=0,dy=0) => new DOMMatrix().translate(x+dx,y+dy).rotate(angle).scale(sx,sy).translate(-x,-y);
  const canvas = () => Object.assign(document.createElement('canvas'),{width:W,height:H});
  function pose(t) {
    const envelope=pulse(.015,.32,5.55,6.48,t);
    const sip=pulse(1.1,1.52,3.92,4.25,t);
    const relax=pulse(4.06,4.4,4.93,5.48,t);
    const prep=pulse(.07,.25,.75,1.1,t);
    const breath=Math.sin((t-.12)*2*Math.PI/1.8)*envelope;
    const bodyAngle=-.65*prep+1.3*sip-1.05*relax+.18*breath;
    const bodyScale=Math.max(.97,1-.025*relax+.006*breath);
    const headAngle=7.1*sip-2.1*relax-.65*prep+.22*Math.sin(t*5.1)*sip;
    const headDown=3.1*sip-.45*relax;
    const shoulder=1.7*pulse(1.2,1.62,3.99,4.34,t);
    const body=pivot(119.5,251,bodyAngle,1,bodyScale);
    const head=body.multiply(pivot(119.5,184,headAngle,1,1,.3*prep,headDown));
    return {body,head,bodyAngle,bodyScale,headAngle,headDown,shoulder,sip,relax,envelope};
  }
  function keyAt(t) {
    if(t<.15)return 'K1'; if(t<.3)return 'side'; if(t<1.22)return 'K2';
    if(t<4.02)return 'K3'; if(t<5)return 'K5'; if(t<5.2)return 'K2';
    if(t<5.45)return 'side'; return 'K1';
  }
  class TeaPreview {
    constructor(target,{ratio=1,size=1,onBusy=()=>{}}={}) {
      if(!Number.isFinite(ratio)||ratio<1||ratio>4)throw new Error('Invalid ratio');
      if(![.75,1,1.3].includes(size))throw new Error('Invalid pet size');
      this.canvas=target;this.ctx=target.getContext('2d');this.size=size;this.ratio=ratio;
      this.cssSize=180*size;target.width=target.height=Math.round(this.cssSize*ratio);
      target.style.width=target.style.height=`${this.cssSize}px`;
      this.duration=DURATION;this.onBusy=onBusy;this.visible=true;this.run=null;
      this.ready=this.prepare().then(()=>{this.loaded=true;this.renderAt(0);});
    }
    async prepare() {
      this.images=Object.fromEntries(await Promise.all(KEYS.map(async name=>{
        const im=new Image();im.src=`keys/${name}.png`;await im.decode();return [name,im];
      })));
      // Extend the existing hidden collar by three source pixels, using only
      // its own raster. Cache once; the unshifted artwork is drawn over it.
      this.collarUnder=canvas();const uc=this.collarUnder.getContext('2d');
      uc.beginPath();uc.rect(62,157,115,54);uc.clip();
      for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)uc.drawImage(this.images.collar,x,y);
      uc.drawImage(this.images.collar,0,0);
      // A complete source-head underlay covers the split masks' AA seam.
      // It uses the original alpha, without expanding exposed hair contours.
      this.headUnder=canvas();const hu=this.headUnder.getContext('2d');hu.drawImage(this.images.stand,0,0);
      hu.globalCompositeOperation='destination-in';hu.drawImage(this.images['head-alpha'],0,0);
      // Rasterize stand once at the exact target resolution. Copying this
      // bitmap 1:1 avoids repeated downsampling and readback/backend rounding
      // changes in stationary feet and in the first/last frames.
      this.standCanvas=Object.assign(document.createElement('canvas'),{width:this.canvas.width,height:this.canvas.height});
      const sc=this.standCanvas.getContext('2d'),r=this.canvas.width/this.cssSize,s=.44*this.size;
      sc.setTransform(r,0,0,r,0,0);sc.drawImage(this.images.stand,(this.cssSize-W*s)/2,this.cssSize-H*s,W*s,H*s);
      this.heads=[];
      // Cache the twelve small gaze steps once; no per-tick masking/scanning.
      for(let i=0;i<=12;i++) {
        const iris=canvas(),ic=iris.getContext('2d');
        ic.drawImage(this.images.irises,i/12*.35,i/12*1.1);
        ic.globalCompositeOperation='destination-in';ic.drawImage(this.images['sclera-alpha'],0,0);
        const h=canvas(),hc=h.getContext('2d');hc.drawImage(this.images.head,0,0);hc.drawImage(iris,0,0);
        this.heads.push(h);
      }
      this.faces={};
      for(const name of ['sleeping','happy']){
        const h=canvas(),c=h.getContext('2d');c.drawImage(this.heads[0],0,0);c.drawImage(this.images[`face-${name}`],0,0);this.faces[name]=h;
      }
    }
    renderAt(seconds) {
      if(!this.loaded)return;
      const t=Math.max(0,Math.min(DURATION,seconds)),key=keyAt(t),p=pose(t),im=this.images,ctx=this.ctx;
      const css=this.cssSize,scale=176/400*this.size,ratio=this.canvas.width/css;
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      ctx.drawImage(this.standCanvas,0,0);
      ctx.setTransform(ratio,0,0,ratio,0,0);
      if(t===0||t>=DURATION){
        this.state={t,key:'K1',phase:'rest',exactStand:true,bodyAngle:0,headAngle:0,bodyScale:1};return;
      }
      ctx.save();ctx.translate((css-W*scale)/2,css-H*scale);ctx.scale(scale,scale);
      const draw=(image,m=new DOMMatrix())=>{ctx.save();ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);ctx.drawImage(image,0,0);ctx.restore();};
      // Keep the strand roots registered with the front hair. Delaying the
      // whole raster separated the outer contours and opened enclosed slits.
      const hair=p.head;
      const collar=p.body.multiply(new DOMMatrix().translate(0,-p.shoulder));
      let arms=p.body.multiply(new DOMMatrix().translate(0,-p.shoulder));
      // Measured source pixels: lower lip y164, clean cup's rim y167.
      const mouth=point(p.head,119.5,164);
      if(key==='K3'){
        const mouthLocal=point(p.body.inverse(),mouth.x,mouth.y);
        const lock=smooth(1.22,1.5,t)*(1-smooth(3.9,4.02,t));
        arms=p.body.multiply(new DOMMatrix().translate((mouthLocal.x-119.5)*lock,
          -p.shoulder+(mouthLocal.y-167+p.shoulder)*lock));
      }
      // Fixed leg and skirt artwork is never scaled with the upper torso.
      // Preserve the exact full-source leg sampling, including 0.75x/DPR1.
      // The boundary is an integer DEVICE row, so two resampled alpha edges
      // cannot open a seam. Every subsequent layer is clipped above the legs.
      const sourceTransform=ctx.getTransform();
      const fixedLegRow=Math.ceil((4+305*.44)*this.size*ratio);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0,0,this.canvas.width,fixedLegRow);
      ctx.beginPath();ctx.rect(0,0,this.canvas.width,fixedLegRow);ctx.clip();
      ctx.setTransform(sourceTransform);draw(im.lower);
      draw(this.headUnder,hair);draw(im['back-hair'],hair);
      draw(im.torso,p.body);
      draw(this.collarUnder,collar);
      draw(im.collar,collar);
      draw(im[`arms-${key}`],arms);
      // All face pixels (including lids/mouth) share the exact head matrix.
      const gaze=Math.round(12*pulse(.035,.18,1.1,1.28,t));
      const face=t>=1.26&&t<4.02?'sleeping':t>=4.04&&t<5.03?'happy':null;
      draw(face?this.faces[face]:this.heads[gaze],p.head);
      if(key==='K3'){
        draw(im['sip-front'],arms);
        // Steam omitted: the old sheared raster crossed the face and hair.
      }
      ctx.restore();ctx.restore();
      const cup=key==='K3'?point(arms,119.5,167):null;
      const phase=t<.3?'entry':t<1.1?'anticipation':t<1.5?'raise':t<3.9?'sip':t<4.3?'lower':t<5?'satisfied':t<5.6?'return':'settle';
      this.state={t,key,phase,bodyAngle:p.bodyAngle,headAngle:p.bodyAngle+p.headAngle,bodyScale:p.bodyScale,
        headDown:p.headDown,shoulderLift:p.shoulder,hairDelayMs:0,gaze,face,
        mouth,cup,cupMouthDistance:cup?distance(cup,mouth):null,
        landmarks:{neck:point(collar,119.5,184),headBase:point(p.head,119.5,184),
          leftSleeve:point(arms,80,211),rightSleeve:point(arms,159,211),
          leftShoulder:point(collar,80,211),rightShoulder:point(collar,159,211),
          leftHand:point(arms,99,184),rightHand:point(arms,141,184),cupGripLeft:point(arms,100,184),cupGripRight:point(arms,140,184)},
        matrices:{body:Array.from(p.body.toFloat64Array()),head:Array.from(p.head.toFloat64Array()),hair:Array.from(hair.toFloat64Array()),arms:Array.from(arms.toFloat64Array())}};
      this.canvas.dataset.phase=phase;this.canvas.dataset.key=key;
    }
    async play(){
      await this.ready;if(this.run||!this.visible)return false;
      return new Promise(resolve=>{
        const run={started:performance.now(),resolve};this.run=run;this.onBusy(1500);
        run.heartbeat=setInterval(()=>this.onBusy(1500),750);
        const tick=()=>{if(this.run!==run)return;const t=(performance.now()-run.started)/1000;this.renderAt(t);
          if(t>=this.duration){this.finish(true);return;}run.timer=setTimeout(tick,50);};tick();
      });
    }
    finish(completed){const r=this.run;if(!r)return;this.run=null;clearTimeout(r.timer);clearInterval(r.heartbeat);this.renderAt(0);r.resolve(completed);}
    cancel(){this.finish(false);}
    setVisible(v){this.visible=Boolean(v);if(!v)this.cancel();}
  }
  window.X6Tea={TeaPreview,DURATION};
})();
