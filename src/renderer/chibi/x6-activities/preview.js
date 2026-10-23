(() => {
  const old=document.getElementById('old'),oldCtx=old.getContext('2d');old.width=old.height=180;
  const target=document.getElementById('new'),play=document.getElementById('play'),status=document.getElementById('status');
  const frame=document.createElement('iframe');frame.hidden=true;frame.src='../x5-activities/preview.html';document.body.append(frame);
  let player,previous,oldWindow,serial=0;
  async function select(name){
    if(!oldWindow)return;
    const token=++serial;player?.cancel();previous?.cancel();play.disabled=true;
    player=new X6Activities.ActivityPreview(target,name);
    // X5 image URLs belong to its own iframe document.
    previous=new oldWindow.X5Activities.ActivityPreview(oldWindow.document.createElement('canvas'),name);
    await Promise.all([player.ready,previous.ready]);if(token!==serial)return;
    oldCtx.clearRect(0,0,180,180);oldCtx.drawImage(previous.canvas,0,0);play.disabled=false;status.textContent='Ko‘rishga tayyor.';
    document.getElementById('title').textContent=`X6 · ${player.config.title}`;
    window.x6Review={player,previous,ready:player.ready,select};
  }
  async function run(){if(!player||player.run)return;const current=player,before=previous;play.disabled=true;
    const start=performance.now(),timer=setInterval(()=>{before.renderAt((performance.now()-start)/1000);oldCtx.clearRect(0,0,180,180);oldCtx.drawImage(before.canvas,0,0);},50);
    const done=await current.play();clearInterval(timer);if(current!==player)return;before.renderAt(0);oldCtx.clearRect(0,0,180,180);oldCtx.drawImage(before.canvas,0,0);play.disabled=false;status.textContent=done?'Tugadi.':'To‘xtatildi.';
  }
  frame.addEventListener('load',async()=>{oldWindow=frame.contentWindow;oldWindow.x5ActivitiesReview?.stop();await select('wave');});
  document.querySelectorAll('[data-activity]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.activity).catch(console.error)));
  play.addEventListener('click',run);document.getElementById('stop').addEventListener('click',()=>player?.cancel());target.addEventListener('pointerdown',()=>player?.cancel());
  document.addEventListener('visibilitychange',()=>player?.setVisible(!document.hidden));
})();
