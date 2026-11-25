// Native modal supplies background inertness and top-layer stacking. No S/persistence/RNG.
export function initializeBoardMenu({documentRef=document}={}) {
  const root=documentRef.getElementById('board-menu');if(!root)return;
  const toggle=root.querySelector('#board-menu-toggle'),panel=root.querySelector('#board-menu-panel');
  let dialogAction=null;
  const items=()=>[...panel.querySelectorAll('button,a[href]')].filter(item=>!item.disabled);
  const close=(restore=true)=>{
    if(panel.open)panel.close();panel.hidden=true;toggle.setAttribute('aria-expanded','false');
    if(restore)toggle.focus({preventScroll:true});
  };
  const open=()=>{
    if(panel.open)return;
    panel.hidden=false;panel.showModal();toggle.setAttribute('aria-expanded','true');
    documentRef.getElementById('board-menu-close').focus({preventScroll:true});
  };
  toggle.addEventListener('click',()=>panel.open?close():open());
  toggle.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp'].includes(event.key))return;
    event.preventDefault();open();const all=items();(event.key==='ArrowDown'?all[0]:all.at(-1))?.focus();
  });
  panel.addEventListener('cancel',event=>{event.preventDefault();close();});
  panel.addEventListener('keydown',event=>{
    const all=items(),at=all.indexOf(documentRef.activeElement);
    if(event.key==='Tab'){
      if(event.shiftKey&&at<=0){event.preventDefault();all.at(-1)?.focus();}
      else if(!event.shiftKey&&at===all.length-1){event.preventDefault();all[0]?.focus();}
    }
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();const index=event.key==='Home'?0:event.key==='End'?all.length-1:(at+(event.key==='ArrowDown'?1:-1)+all.length)%all.length;
    all[index]?.focus();
  });
  // Close synchronously before existing action handlers, including native share.
  panel.addEventListener('click',event=>{
    const item=event.target.closest('button,a[href]');if(!item)return;
    dialogAction=item.id==='board-preferences'?'display-preferences':item.id==='board-share'?'seed-share':null;
    close();
  },true);
  panel.addEventListener('click',event=>{
    if(event.target!==panel)return;
    const r=panel.getBoundingClientRect();
    if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)close();
  });
  for(const id of ['display-preferences','seed-share'])documentRef.getElementById(id)?.addEventListener('close',()=>{
    if(dialogAction===id){dialogAction=null;toggle.focus({preventScroll:true});}
  });
}
