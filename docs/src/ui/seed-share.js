// Sharing is presentation only: no game state, storage or RNG writes.
export function replayURL(seed,href) {
  const url=new URL(href);url.search='';url.hash='';
  return url.href+'?seed='+encodeURIComponent(seed);
}
export async function copyShareText(text,{windowRef=window,documentRef=document}={}) {
  let copied=false,timer;
  try {
    if(windowRef.isSecureContext&&windowRef.navigator.clipboard?.writeText){
      copied=await Promise.race([windowRef.navigator.clipboard.writeText(text).then(()=>true).catch(()=>false),new Promise(resolve=>{timer=setTimeout(()=>resolve(false),1200);})]);
    }
  } catch { /* Manual selection remains available. */ }
  finally {clearTimeout(timer);}
  if(!copied){
    const active=documentRef.activeElement,ta=documentRef.createElement('textarea');ta.value=text;ta.readOnly=true;ta.style.position='fixed';ta.style.opacity='0';documentRef.body.appendChild(ta);ta.select();
    try{copied=Boolean(documentRef.execCommand('copy'));}catch { /* Unsupported legacy copy. */ }
    ta.remove();active?.focus({preventScroll:true});
  }
  return copied;
}
export function createSeedShareController({trigger,getSeed,documentRef=document,windowRef=window}) {
  const dialog=documentRef.createElement('dialog');dialog.id='seed-share';dialog.setAttribute('aria-labelledby','seed-share-title');
  dialog.innerHTML='<h2 id="seed-share-title" tabindex="-1">共有</h2><label for="share-seed-value">現在のSeed</label><input id="share-seed-value" readonly><button type="button" id="share-copy-seed">Seedをコピー</button><label for="share-url-value">リプレイURL</label><input id="share-url-value" readonly><button type="button" id="share-copy-url">リプレイURLを共有</button><p>同じSeedでも選択やバージョンが異なると結果は変わります。</p><p id="seed-share-status" role="status" aria-live="polite"></p><button type="button" id="seed-share-close">閉じる</button>';
  documentRef.body.appendChild(dialog);
  const seedInput=dialog.querySelector('#share-seed-value'),urlInput=dialog.querySelector('#share-url-value'),status=dialog.querySelector('#seed-share-status');
  let scrollPosition;
  trigger.addEventListener('click',()=>{
    if(dialog.open)return;
    const seed=String(getSeed()||'');if(!seed)return;
    seedInput.value=seed;urlInput.value=replayURL(seed,windowRef.location.href);status.textContent='';
    scrollPosition=[windowRef.scrollX,windowRef.scrollY];dialog.showModal();documentRef.body.classList.add('seed-share-open');dialog.querySelector('h2').focus({preventScroll:true});
  });
  let generation=0;
  trigger.addEventListener('click',()=>{generation++;});
  for(const [id,input,label] of [['share-copy-seed',seedInput,'Seed']]){
    const button=dialog.querySelector('#'+id);
    button.addEventListener('click',async()=>{
      if(button.disabled)return;button.disabled=true;
      try{const copied=await copyShareText(input.value,{windowRef,documentRef});status.textContent=copied?label+'をコピーしました。':'コピーできませんでした。'+label+'の文字列を長押し／選択してコピーしてください。';if(!copied&&dialog.open){input.focus();input.select();}}
      finally{button.disabled=false;}
    });
  }
  const shareButton=dialog.querySelector('#share-copy-url');
  shareButton.addEventListener('click',async()=>{
    if(shareButton.disabled)return;
    const current=generation;shareButton.disabled=true;status.textContent='';
    try{
      const result=await shareReplayURL(urlInput.value,{windowRef,documentRef});
      if(dialog.open&&current===generation){status.textContent=result.message;if(result.manual){urlInput.focus();urlInput.select();}}
    }finally{shareButton.disabled=false;}
  });
  dialog.querySelector('#seed-share-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('cancel',event=>{event.preventDefault();dialog.close();});
  dialog.addEventListener('close',()=>{documentRef.body.classList.remove('seed-share-open');trigger.focus({preventScroll:true});if(scrollPosition)windowRef.scrollTo(...scrollPosition);});
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const controls=[...dialog.querySelectorAll('input,button')].filter(node=>!node.disabled),first=controls[0],last=controls.at(-1),active=documentRef.activeElement;
    if(event.shiftKey&&(active===first||active===dialog.querySelector('h2'))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&active===last){event.preventDefault();first.focus();}
  });
}

// Invoke share before the first await to preserve Safari user activation.
export async function shareReplayURL(url,{windowRef=window,documentRef=document}={}) {
  if(typeof windowRef.navigator.share==='function'){
    try{await windowRef.navigator.share({title:'野球人生シミュレーター',text:'この野球人生をプレイしてみよう！',url});return {kind:'shared',message:''};}
    catch(error){if(error?.name==='AbortError')return {kind:'cancelled',message:''};return {kind:'failed',manual:true,message:'共有できませんでした。URLを長押し／選択してコピーしてください。'};}
  }
  const copied=await copyShareText(url,{windowRef,documentRef});
  return copied?{kind:'copied',message:'リプレイURLをコピーしました。'}:{kind:'failed',manual:true,message:'URLを長押し／選択してコピーしてください。'};
}
