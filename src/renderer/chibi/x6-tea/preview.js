(() => {
  const current=new X6Tea.TeaPreview(document.getElementById('new'));
  const oldCanvas=document.getElementById('old');oldCanvas.width=oldCanvas.height=180;
  const oldCtx=oldCanvas.getContext('2d');
  const status=document.getElementById('status'),play=document.getElementById('play');
  // X5's relative key URLs are resolved by loading its independent player
  // in an iframe. The preview host below uses that frame's own document.
  const frame=document.createElement('iframe');frame.hidden=true;frame.src='../x5-tea/preview.html';document.body.append(frame);
  let previous;
  frame.addEventListener('load',async()=>{
    previous=frame.contentWindow.x5Review.player;await previous.ready;previous.cancel();
    oldCtx.drawImage(previous.canvas,0,0);
    await current.ready;play.disabled=false;status.textContent='Ko‘rishga tayyor.';
  });
  async function run(){
    if(current.run||!previous)return;play.disabled=true;const start=performance.now();
    const timer=setInterval(()=>{previous.renderAt((performance.now()-start)/1000);oldCtx.clearRect(0,0,180,180);oldCtx.drawImage(previous.canvas,0,0);},50);
    const done=await current.play();clearInterval(timer);previous.renderAt(0);oldCtx.clearRect(0,0,180,180);oldCtx.drawImage(previous.canvas,0,0);
    play.disabled=false;status.textContent=done?'Tugadi.':'To‘xtatildi.';
  }
  play.addEventListener('click',run);document.getElementById('stop').addEventListener('click',()=>current.cancel());
  current.canvas.addEventListener('pointerdown',()=>current.cancel());
  document.addEventListener('visibilitychange',()=>current.setVisible(!document.hidden));
  current.ready.catch(e=>{status.textContent='Rasmlar yuklanmadi.';console.error(e);});
  window.x6Review={player:current,ready:current.ready};
})();
