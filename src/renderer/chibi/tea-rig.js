// Choy ichish namunasi: original bosh/gavda/piyola, kodda chizilgan ikki bo'g'imli yenglar.
// Eski aralashtirilgan kadrlar ishlatilmaydi. Qatlamlar bir marta tayyorlanadi.
(() => {
  const W = 239, H = 400, DURATION = 8.4;
  const smooth = t => { t = Math.max(0, Math.min(1,t)); return t*t*t*(t*(t*6-15)+10); };
  const lerp = (a,b,t) => a+(b-a)*t;
  const canvas = () => Object.assign(document.createElement('canvas'), {width:W,height:H});
  function polygon(ctx, points) {
    ctx.beginPath(); ctx.moveTo(...points[0]);
    for (const p of points.slice(1)) ctx.lineTo(...p);
    ctx.closePath();
  }
  function solve(shoulder, wrist, upper, lower, sign) {
    const dx=wrist[0]-shoulder[0],dy=wrist[1]-shoulder[1];
    const distance=Math.max(.01,Math.min(upper+lower-.01,Math.hypot(dx,dy)));
    const a=Math.atan2(dy,dx)+sign*Math.acos(Math.max(-1,Math.min(1,(upper*upper+distance*distance-lower*lower)/(2*upper*distance))));
    return [shoulder[0]+Math.cos(a)*upper,shoulder[1]+Math.sin(a)*upper];
  }
  class TeaRig {
    constructor(stand, tea, blink) {
      this.blink=blink;
      this.stand=stand;
      this.body=canvas();const ctx=this.body.getContext('2d');
      ctx.save();
      polygon(ctx,[[86,205],[153,205],[161,239],[165,249],[155,256],[170,289],[170,400],[65,400],[65,289],[80,256],[73,249],[78,230]]);
      ctx.rect(0,0,W,213);
      ctx.clip();ctx.drawImage(stand,0,0);ctx.restore();
      this.arms=[
        {shoulder:[83,220],elbow:[61,252],wrist:[37,280],sign:1},
        {shoulder:[156,220],elbow:[178,252],wrist:[202,280],sign:-1},
      ];
      // Piyola asl tea-04'ning o'z konturidan; qo'l va eski gavda kiritilmaydi.
      this.cup=canvas();const cup=this.cup.getContext('2d');
      polygon(cup,[[102,211],[111,209],[130,209],[140,212],[141,223],[136,239],[130,244],[112,244],[105,238],[100,222]]);
      cup.clip();cup.drawImage(tea,0,0);
    }
    drawArm(ctx, arm, wrist) {
      const {shoulder,elbow,wrist:rest}=arm;
      const upper=Math.hypot(elbow[0]-shoulder[0],elbow[1]-shoulder[1]);
      const lower=Math.hypot(rest[0]-elbow[0],rest[1]-elbow[1])+28*smooth((260-wrist[1])/62);
      const joint=solve(shoulder,wrist,upper,lower,arm.sign);
      // Bitta yumaloq yeng: ikki alohida kesilgan bitmap tutashuvi yo'q.
      const path=()=>{ctx.beginPath();ctx.moveTo(...shoulder);ctx.quadraticCurveTo(...joint,(joint[0]+wrist[0])/2,(joint[1]+wrist[1])/2);ctx.lineTo(...wrist);};
      ctx.lineCap='round';ctx.lineJoin='round';
      path();ctx.lineWidth=29;ctx.strokeStyle='#34452a';ctx.stroke();
      path();ctx.lineWidth=25;ctx.strokeStyle='#9fc978';ctx.stroke();
      ctx.beginPath();ctx.moveTo(shoulder[0]-arm.sign*4,shoulder[1]+4);ctx.quadraticCurveTo(joint[0]-arm.sign*4,joint[1]+1,wrist[0],wrist[1]);
      ctx.lineWidth=8;ctx.strokeStyle='#b5d98b';ctx.stroke();
      const angle=Math.atan2(wrist[1]-joint[1],wrist[0]-joint[0]);
      ctx.save();ctx.translate(...wrist);ctx.rotate(angle);
      ctx.fillStyle='#a4cf7d';ctx.strokeStyle='#445631';ctx.lineWidth=1.3;
      ctx.beginPath();ctx.roundRect(-6,-12,10,24,3);ctx.fill();ctx.stroke();
      ctx.strokeStyle='#719650';ctx.lineWidth=1;
      for(let n=-7;n<=7;n+=5){ctx.beginPath();ctx.moveTo(-5,n);ctx.lineTo(3,n);ctx.stroke();}
      ctx.fillStyle='#fbe3d2';ctx.strokeStyle='#51452f';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.ellipse(8,0,8,5,0,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.restore();
    }
    draw(ctx, seconds, x=0,y=0,width=W,height=H,blinkPatch=null) {
      const t=Math.max(0,Math.min(DURATION,seconds));
      if(t<.001 || t>DURATION-.001) {
        ctx.drawImage(this.stand,x,y,width,height);return;
      }
      const gather=smooth((t-.4)/1.4),lift=smooth((t-2)/1.3),lower=smooth((t-5)/1.5),put=smooth((t-6.8)/1.2);
      const cx=lerp(178,120,gather)*(1-put)+178*put;
      const cy=lerp(278,247,gather)-49*lift*(1-lower)+31*put;
      const join=gather*(1-put);
      const left=[lerp(37,cx-23,join),lerp(280,cy,join)];
      const right=[lerp(cx+23,202,put),lerp(cy,280,put)];
      ctx.save();ctx.translate(x,y);ctx.scale(width/W,height/H);
      ctx.drawImage(this.body,0,0);
      const sipBlink = t>3.75 && t<4.55;
      const eyelids=blinkPatch || (sipBlink && this.blink);
      if(eyelids) ctx.drawImage(eyelids,0,0);
      this.drawArm(ctx,this.arms[0],left);this.drawArm(ctx,this.arms[1],right);
      ctx.save();ctx.globalAlpha=smooth(t/.4)*(1-smooth((t-7.9)/.5));
      ctx.translate(cx,cy);ctx.rotate(-(.045+.018*Math.sin((t-3.3)*Math.PI))*lift*(1-lower));ctx.translate(-121,-227);
      ctx.drawImage(this.cup,0,0);ctx.restore();
      ctx.restore();
    }
  }
  TeaRig.duration=DURATION;
  window.ChibiTeaRig=TeaRig;
})();
