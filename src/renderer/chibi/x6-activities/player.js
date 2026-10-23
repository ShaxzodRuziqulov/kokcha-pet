// Isolated X6 activity previews. No production imports or runtime pixel scans.
(() => {
  const W=399,H=400;
  const CONFIG=Object.freeze({
    wave:{title:'Qo‘l silkitish',duration:3,start:.5,end:2.5,exit:2.85},
    read:{title:'Kitob o‘qish',duration:13,start:.5,end:12,exit:12.4},
    water:{title:'Gul sug‘orish',duration:6.5,start:.7,end:5.6,exit:6.1},
    stretch:{title:'Cho‘zilish',duration:4.5,start:1.35,end:2.35,exit:3.85},
  });
  const clamp=x=>Math.max(0,Math.min(1,x));
  const smooth=(a,b,t)=>{const x=clamp((t-a)/(b-a));return x*x*(3-2*x);};
  const pulse=(a,b,c,d,t)=>smooth(a,b,t)*(1-smooth(c,d,t));
  const canvas=()=>Object.assign(document.createElement('canvas'),{width:W,height:H});
  const pivot=(x,y,angle,sx=1,sy=1,dx=0,dy=0)=>new DOMMatrix().translate(x+dx,y+dy).rotate(angle).scale(sx,sy).translate(-x,-y);
  const point=(m,x,y)=>{const p=m.transformPoint({x,y});return {x:p.x,y:p.y};};
  const flat=m=>[m.a,m.b,m.c,m.d,m.e,m.f];
  function sample(name,t){
    const c=CONFIG[name],active=t>=.15&&t<c.exit;
    const a=t<c.start?smooth(.15,c.start,t):1-smooth(c.end,c.exit,t);
    return {t,active,amount:a,elapsed:Math.max(0,t-c.start),phase:!active?'rest':t<c.start?'entry':t<c.end?'main':'return'};
  }
  function pose(name,t){
    const c=CONFIG[name],s=sample(name,t),a=s.amount;
    const env=pulse(.02,.36,c.duration-.38,c.duration-.02,t);
    const prep=pulse(.04,.15,.28,.5,t),breath=Math.sin((t-.12)*2*Math.PI/2.6)*env;
    const relax=pulse(c.exit-.12,c.exit+.08,c.duration-.18,c.duration-.01,t);
    let bodyAngle=0,headAngle=0,headDown=0,shoulder=0,scale=1;
    if(name==='wave'){
      const sway=Math.sin(s.elapsed*Math.PI*3);
      bodyAngle=.65*prep+(-1.25+.5*sway)*a+.16*breath;
      headAngle=(-2.4+.55*Math.sin((s.elapsed-.08)*Math.PI*3))*a;
      headDown=-.6*a;shoulder=.85*a;scale=1+.004*breath-.009*relax;
    }else if(name==='read'){
      const page=pulse(3.72,3.95,4.45,4.7,t)+pulse(7.92,8.15,8.65,8.9,t);
      bodyAngle=.55*a+.28*Math.sin(s.elapsed*1.2)*a+.3*page;
      headAngle=3.35*a+.5*Math.sin(s.elapsed*1.55)*a+.7*page;
      headDown=1.1*a+.3*page;shoulder=.45*a;scale=1+.005*breath-.006*relax;
    }else if(name==='water'){
      bodyAngle=1.7*a+.25*Math.sin(s.elapsed*1.8)*a+.15*breath;
      headAngle=3.6*a+.45*Math.sin(s.elapsed*1.2)*a;
      headDown=1.2*a;shoulder=.65*a;scale=1+.006*breath-.008*relax;
    }else{
      const lift=pulse(.07,1.28,2.48,4.05,t);
      bodyAngle=.45*Math.sin(s.elapsed*1.4)*a-.5*prep;
      headAngle=-3.6*lift+.45*Math.sin(t*2.1)*a;
      headDown=-1.25*lift;shoulder=1.8*lift;
      scale=1+.024*lift+.004*breath-.018*relax;
    }
    scale=Math.max(.97,Math.min(1.03,scale));
    const body=pivot(199.5,251,bodyAngle,1,scale);
    const head=body.multiply(pivot(199.5,184,headAngle,1,1,.3*prep,headDown));
    return {...s,env,body,head,bodyAngle,headAngle,headDown,shoulder,bodyScale:scale};
  }
  class ActivityPreview{
    constructor(target,name,{ratio=1,size=1,onBusy=()=>{}}={}){
      if(!Object.hasOwn(CONFIG,name))throw new Error('Unknown X6 activity');
      if(!Number.isFinite(ratio)||ratio<1||ratio>4)throw new Error('Invalid ratio');
      if(![.75,1,1.3].includes(size))throw new Error('Invalid pet size');
      this.name=name;this.config=CONFIG[name];this.duration=this.config.duration;
      this.canvas=target;this.ctx=target.getContext('2d');this.size=size;this.cssSize=180*size;
      target.width=target.height=Math.round(this.cssSize*ratio);target.style.width=target.style.height=`${this.cssSize}px`;
      this.visible=true;this.run=null;this.onBusy=onBusy;
      this.ready=this.prepare().then(()=>{this.loaded=true;this.renderAt(0);});
    }
    async prepare(){
      const common=['stand','head','head-alpha','back-hair','torso','collar','lower','irises','sclera-alpha','face-sleeping','face-happy','arms-K1','neutral-left','neutral-right'];
      const extra=this.name==='stretch'?['stretch-left','stretch-right']:this.name==='water'?['water-arms','water-stream','water-drops','water-pot','water-flower']:this.name==='read'?['read-arms','read-page']:['wave-arms'];
      this.images=Object.fromEntries(await Promise.all([...common,...extra].map(async n=>{const im=new Image();im.src=`keys/${n}.png`;await im.decode();return [n,im];})));
      // Three-pixel hidden overlap from the existing collar raster, cached
      // once. Original collar and head cover the expanded inner join.
      this.collarUnder=canvas();const uc=this.collarUnder.getContext('2d');
      uc.beginPath();uc.rect(142,157,115,54);uc.clip();
      for(let y=-3;y<=3;y++)for(let x=-3;x<=3;x++)uc.drawImage(this.images.collar,x,y);
      uc.drawImage(this.images.collar,0,0);
      this.headUnder=canvas();const hu=this.headUnder.getContext('2d');hu.drawImage(this.images.stand,0,0);
      hu.globalCompositeOperation='destination-in';hu.drawImage(this.images['head-alpha'],0,0);
      this.standCanvas=Object.assign(document.createElement('canvas'),{width:this.canvas.width,height:this.canvas.height});
      const sc=this.standCanvas.getContext('2d'),r=this.canvas.width/this.cssSize,scale=.44*this.size;
      sc.setTransform(r,0,0,r,0,0);sc.drawImage(this.images.stand,(this.cssSize-W*scale)/2,this.cssSize-H*scale,W*scale,H*scale);
      this.heads=[];
      for(const y of [-.6,0,.6,1.2])for(const x of [-.8,-.4,0,.4,.8]){
        const iris=canvas(),ic=iris.getContext('2d');ic.drawImage(this.images.irises,x,y);
        ic.globalCompositeOperation='destination-in';ic.drawImage(this.images['sclera-alpha'],0,0);
        const h=canvas(),hc=h.getContext('2d');hc.drawImage(this.images.head,0,0);hc.drawImage(iris,0,0);this.heads.push(h);
      }
      this.faces={};for(const n of ['sleeping','happy']){const h=canvas(),c=h.getContext('2d');c.drawImage(this.heads[7],0,0);c.drawImage(this.images[`face-${n}`],0,0);this.faces[n]=h;}
      if(this.name==='water'){this.flowCanvas=canvas();this.flowContext=this.flowCanvas.getContext('2d');}
    }
    renderAt(seconds){
      if(!this.loaded)return;
      const t=Math.max(0,Math.min(this.duration,seconds)),name=this.name,p=pose(name,t),a=p.amount,im=this.images,ctx=this.ctx;
      const css=this.cssSize,scale=.44*this.size,ratio=this.canvas.width/css;
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,this.canvas.width,this.canvas.height);ctx.drawImage(this.standCanvas,0,0);
      if(t===0||t>=this.duration){this.state={t,name,phase:'rest',exactStand:true};return;}
      ctx.setTransform(ratio,0,0,ratio,0,0);ctx.save();ctx.translate((css-W*scale)/2,css-H*scale);ctx.scale(scale,scale);
      const draw=(image,m=new DOMMatrix())=>{ctx.save();ctx.transform(m.a,m.b,m.c,m.d,m.e,m.f);ctx.drawImage(image,0,0);ctx.restore();};
      // Include a few fixed hem rows above the legs: the compositor's DPR
      // upsampling kernel must never mix moving row305 with a stationary leg.
      const source=ctx.getTransform(),fixedRow=Math.ceil((4+300*.44)*this.size*ratio);
      const fixedLeft=Math.floor(((css-W*scale)/2+150*scale)*ratio),fixedRight=Math.ceil(((css-W*scale)/2+250*scale)*ratio);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,this.canvas.width,fixedRow);
      // Protect the actual leg rectangle, while allowing the watering can
      // and outward hands below the hem on either side of the character.
      ctx.beginPath();ctx.rect(0,0,this.canvas.width,fixedRow);
      ctx.rect(0,fixedRow,fixedLeft,this.canvas.height-fixedRow);
      ctx.rect(fixedRight,fixedRow,this.canvas.width-fixedRight,this.canvas.height-fixedRow);
      ctx.clip();ctx.setTransform(source);
      // Strand roots share the front-hair matrix; delaying the entire raster
      // opened one-pixel enclosed slits along their outer join.
      const hair=p.head;
      const collar=p.body.multiply(new DOMMatrix().translate(0,-p.shoulder));
      let arms=p.body,left=null,right=null,armAngle=0,pageTurn=false,page=null,flowMatrix=null;
      draw(im.lower);draw(this.headUnder,hair);draw(im['back-hair'],hair);
      if(!p.active){draw(im['arms-K1'],p.body);}
      else if(name==='wave'){
        armAngle=-65*(1-a)+(p.phase==='main'?7*Math.sin(p.elapsed*Math.PI*3):0);
        // Preserve X5's approved complete arm artwork and gesture.
        arms=p.body.multiply(pivot(169,215,armAngle,.85+.15*a,.85+.15*a,0,-p.shoulder));
        draw(im['wave-arms'],arms);draw(im['neutral-right'],p.body);
      }else if(name==='stretch'){
        armAngle=100*(1-a);
        left=p.body.multiply(pivot(170,215,-armAngle,.58+.42*a,.58+.42*a,0,-p.shoulder));
        right=p.body.multiply(pivot(229,215,armAngle,.58+.42*a,.58+.42*a,0,-p.shoulder));
        draw(im['stretch-left'],left);draw(im['stretch-right'],right);
      }else if(name==='water'){draw(im['neutral-left'],p.body);}
      draw(im.torso,p.body);draw(this.collarUnder,collar);draw(im.collar,collar);
      if(p.active&&name==='read'){
        arms=p.body.multiply(new DOMMatrix().translate(0,12*(1-a)-p.shoulder));draw(im['read-arms'],arms);
      }else if(p.active&&name==='water'){
        armAngle=35*(1-a);arms=p.body.multiply(pivot(236,218,armAngle,1,1,0,-p.shoulder));draw(im['water-arms'],arms);
      }
      let gx=0,gy=0,face=null;
      if(name==='wave'){gx=-.8*pulse(.025,.13,.35,.55,t);if(p.phase==='main')face='happy';}
      else if(name==='read'){
        const scan=(p.elapsed%2.4)/2.4;gx=a*(scan<.88?-.8+1.6*scan/.88:.8-1.6*smooth(.88,1,scan));gy=1.2*pulse(.035,.25,this.config.exit,this.duration,t);
        if(p.phase==='main'&&p.elapsed%3.6>3.47)face='sleeping';
      }else if(name==='water'){gx=.8*pulse(.025,.2,this.config.exit,this.duration,t);gy=1.2*a;if(p.phase==='main'&&p.elapsed%2.8>2.68)face='sleeping';}
      else{gy=-.6*a;if(a>.85)face='sleeping';else if(t>2.5&&t<3.45)face='happy';}
      const xi=Math.round(clamp((gx+.8)/1.6)*4),yi=Math.round(clamp((gy+.6)/1.8)*3),gaze=yi*5+xi;
      draw(face?this.faces[face]:this.heads[gaze],p.head);
      if(p.active&&name==='read'){
        const turning=[3.3,7.5].find(start=>p.elapsed>=start&&p.elapsed<start+.9);
        if(turning!==undefined){const q=(p.elapsed-turning)/.9;page=arms.multiply(pivot(200,225,0,Math.max(.06,Math.sin(q*Math.PI)),1));draw(im['read-page'],page);pageTurn=true;}
      }
      ctx.restore(); // fixed-leg clip
      let nozzle=null,flowTop=null,soil=null;
      if(p.active&&name==='water'){
        // Props remain outside the leg clip and never overlap the character's
        // fixed leg rectangle. Small entry offset stays inside the canvas.
        const plantX=20*(1-a);draw(im['water-pot'],new DOMMatrix().translate(plantX,0));
        draw(im['water-flower'],pivot(326,350,a*Math.sin(p.elapsed*4.2)*2,1,1,plantX));
        if(p.phase==='main'){
          const flow=this.flowContext,travel=(p.elapsed*52)%76;flow.clearRect(0,0,W,H);flow.drawImage(im['water-stream'],0,0);
          for(const dy of [travel-76,travel,travel+76])flow.drawImage(im['water-drops'],dy*.24,dy);
          flow.globalCompositeOperation='destination-in';flow.drawImage(im['water-stream'],0,0);flow.globalCompositeOperation='source-over';
          nozzle=point(arms,337,276);soil={x:355,y:348};const c=(soil.x-nozzle.x-18)/72,d=(soil.y-nozzle.y)/72;
          flowMatrix=new DOMMatrix([1,0,c,d,nozzle.x-337-c*276,nozzle.y-d*276]);
          draw(this.flowCanvas,flowMatrix);flowTop=point(flowMatrix,337,276);
        }
      }
      ctx.restore();
      const m={body:flat(p.body),head:flat(p.head),hair:flat(hair),collar:flat(collar),arms:flat(arms)};
      if(left){m.left=flat(left);m.right=flat(right);}if(page)m.page=flat(page);if(flowMatrix)m.flow=flat(flowMatrix);
      this.state={t,name,phase:p.phase,active:p.active,amount:a,pageTurn,face,gaze,armAngle,
        inheritedArmScale:p.active?(name==='stretch'?.58+.42*a:name==='wave'?.85+.15*a:1):1,
        bodyAngle:p.bodyAngle,headAngle:p.bodyAngle+p.headAngle,bodyScale:p.bodyScale,headDown:p.headDown,shoulderLift:p.shoulder,hairDelayMs:0,
        matrices:m,nozzle,flowTop,soil,
        landmarks:{headBase:point(p.head,199.5,184),neck:point(collar,199.5,184),
          leftShoulder:point(collar,170,215),rightShoulder:point(collar,229,215),
          leftSleeve:point(left||arms,170,215),rightSleeve:point(right||arms,229,215),
          bookLeft:point(arms,153,245),bookRight:point(arms,245,245)}};
      this.canvas.dataset.phase=p.phase;
    }
    async play(){await this.ready;if(this.run||!this.visible)return false;
      return new Promise(resolve=>{const run={started:performance.now(),resolve};this.run=run;this.onBusy(1500);run.heartbeat=setInterval(()=>this.onBusy(1500),750);
        const tick=()=>{if(this.run!==run)return;const t=(performance.now()-run.started)/1000;this.renderAt(t);if(t>=this.duration){this.finish(true);return;}run.timer=setTimeout(tick,50);};tick();});}
    finish(done){const r=this.run;if(!r)return;this.run=null;clearTimeout(r.timer);clearInterval(r.heartbeat);this.renderAt(0);r.resolve(done);}
    cancel(){this.finish(false);}
    setVisible(v){this.visible=Boolean(v);if(!v)this.cancel();}
  }
  window.X6Activities={ActivityPreview,CONFIG};
})();
