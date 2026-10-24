import {releaseNotes} from '../data/release-notes.js';

// The body is fixed, rather than overflow-only, so iOS cannot pan the page behind
// the modal. Restore only the inline properties owned here, including priorities.
function lockBackground(){
  const position=[window.scrollX,window.scrollY],saved=[];
  const set=(element,name,value)=>{
    saved.push([element,name,element.style.getPropertyValue(name),element.style.getPropertyPriority(name)]);
    element.style.setProperty(name,value);
  };
  const gap=Math.max(0,window.innerWidth-document.documentElement.clientWidth);
  const padding=parseFloat(getComputedStyle(document.body).paddingRight)||0;
  set(document.documentElement,'scroll-behavior','auto');
  set(document.documentElement,'overflow','hidden');
  for(const [name,value] of Object.entries({position:'fixed',top:-position[1]+'px',left:-position[0]+'px',width:'100%',overflow:'hidden','padding-right':padding+gap+'px'}))set(document.body,name,value);
  return ()=>{
    // Keep scroll-behavior:auto until the saved scroll position has been restored.
    for(const [element,name,value,priority] of saved.slice(1).reverse())value?element.style.setProperty(name,value,priority):element.style.removeProperty(name);
    window.scrollTo(...position);
    const [element,name,value,priority]=saved[0];
    value?element.style.setProperty(name,value,priority):element.style.removeProperty(name);
  };
}

// All transient observers/listeners belong to one opening. No delayed focus work.
function watchScrollPosition(dialog,viewport,article,track,thumb,header,footer){
  let frame=0;
  const visual=window.visualViewport;
  const update=()=>{
    frame=0;
    if(!dialog.open)return;
    for(const [name,value] of Object.entries({height:visual?.height??window.innerHeight,width:visual?.width??window.innerWidth,top:visual?.offsetTop??0,left:visual?.offsetLeft??0}))dialog.style.setProperty('--information-viewport-'+name,value+'px');
    const distance=Math.max(0,viewport.scrollHeight-viewport.clientHeight);
    track.hidden=distance<=1;
    if(track.hidden)return;
    const height=track.clientHeight;
    const size=Math.min(height,Math.max(20,height*viewport.clientHeight/viewport.scrollHeight));
    const progress=Math.max(0,Math.min(1,viewport.scrollTop/distance));
    thumb.style.height=size+'px';thumb.style.transform='translateY('+(height-size)*progress+'px)';
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const listeners=[];
  for(const [target,type] of [[viewport,'scroll'],[window,'resize'],[visual,'resize'],[visual,'scroll']]){
    target?.addEventListener(type,schedule,{passive:true});
    if(target)listeners.push([target,type]);
  }
  const resize=new ResizeObserver(schedule);
  for(const element of [viewport,article,header,footer])resize.observe(element);
  const mutation=new MutationObserver(schedule);
  mutation.observe(article,{childList:true,subtree:true,characterData:true,attributes:true});
  update();
  return ()=>{
    if(frame)cancelAnimationFrame(frame);
    for(const [target,type] of listeners)target.removeEventListener(type,schedule);
    resize.disconnect();mutation.disconnect();track.hidden=true;
  };
}

export function initializeInformationDialogs(){
  const entries={
    help:{title:'遊び方',sections:[
      ['はじめに','選手名・ポジション・ワールドシードを選び、野球人生を始めます。同じSeedでも選択やバージョンによって結果は変わります。'],
      ['育成と選択','画面下の選択肢で進めます。育成では現在値と潜在能力、必要なポイントを確認して配分してください。潜在能力を超える成長には多くのポイントが必要です。'],
      ['選手とキャリア','「選手」で能力・コンディション・特性、「キャリア」で成績・実績・契約・年度別記録を確認できます。'],
      ['共有と表示設定','右上のメニューからSeed共有と表示設定を開けます。共有URLは途中の保存データではなく、そのSeedで新しい人生を始めるためのものです。'],
      ['再開について','このページを閉じたり再読み込みすると進行中の人生は失われます。「最初からやり直す」は確認後に新しく始めます。']]},
    updates:{title:'更新履歴',sections:releaseNotes.map(r=>[r.title,r.lines.join('\n')])}
  };
  let activeDialog=null;
  for(const [key,entry] of Object.entries(entries)){
    const dialog=document.createElement('dialog');dialog.id='information-'+key;dialog.className='information-dialog';
    dialog.setAttribute('aria-labelledby',dialog.id+'-title');
    const header=document.createElement('header');header.className='information-header';
    const heading=document.createElement('h2');heading.id=dialog.id+'-title';heading.tabIndex=-1;heading.textContent=entry.title;header.append(heading);
    const frame=document.createElement('div');frame.className='information-scroll-frame';
    const viewport=document.createElement('div');viewport.className='information-content';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-labelledby',heading.id);
    const article=document.createElement('div');article.className='information-article';
    for(const [title,body] of entry.sections){const section=document.createElement('section'),h=document.createElement('h3'),p=document.createElement('p');h.textContent=title;p.textContent=body;section.append(h,p);article.append(section);}
    viewport.append(article);
    const track=document.createElement('div');track.className='information-scroll-track';track.hidden=true;track.setAttribute('aria-hidden','true');
    const thumb=document.createElement('div');thumb.className='information-scroll-thumb';track.append(thumb);frame.append(viewport,track);
    const footer=document.createElement('footer');footer.className='information-footer';
    const close=document.createElement('button');close.type='button';close.textContent='閉じる';footer.append(close);dialog.append(header,frame,footer);document.body.append(dialog);
    let opener=null,unlock=null,unwatch=null;
    const restore=()=>{
      if(!unlock)return;
      const target=opener,release=unlock;opener=null;unlock=null;
      unwatch?.();unwatch=null;release();activeDialog=null;
      target?.focus({preventScroll:true});
    };
    const dismiss=()=>{dialog.close();restore();};
    close.addEventListener('click',dismiss);
    dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
    dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dismiss();});
    dialog.addEventListener('close',()=>{if(!dialog.open)restore();});
    document.querySelectorAll('[data-information="'+key+'"]').forEach(button=>button.addEventListener('click',()=>{
      if(dialog.open||activeDialog)return;
      opener=button.closest('#board-menu')?document.getElementById('board-menu-toggle'):button;
      activeDialog=dialog;unlock=lockBackground();
      try{
        dialog.showModal();viewport.scrollTop=0;
        unwatch=watchScrollPosition(dialog,viewport,article,track,thumb,header,footer);
        heading.focus({preventScroll:true});
      }catch(error){if(dialog.open)dialog.close();restore();throw error;}
    }));
  }
}
