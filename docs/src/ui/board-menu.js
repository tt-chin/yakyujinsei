// Header disclosure only: no game model, persistence or RNG access.
export function initializeBoardMenu({documentRef=document}={}) {
  const root=documentRef.getElementById('board-menu');
  if(!root)return;
  const toggle=root.querySelector('#board-menu-toggle'),panel=root.querySelector('#board-menu-panel');
  let dialogAction=null;
  const items=()=>[...panel.querySelectorAll('button,a[href]')].filter(item=>!item.disabled);
  const close=(restore=false)=>{
    panel.hidden=true;toggle.setAttribute('aria-expanded','false');
    if(restore)toggle.focus({preventScroll:true});
  };
  const open=()=>{
    panel.hidden=false;toggle.setAttribute('aria-expanded','true');
  };
  toggle.addEventListener('click',()=>panel.hidden?open():close(true));
  toggle.addEventListener('keydown',event=>{
    if(!['ArrowDown','ArrowUp'].includes(event.key))return;
    event.preventDefault();event.stopPropagation();open();const all=items();
    (event.key==='ArrowDown'?all[0]:all.at(-1))?.focus();
  });
  root.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!panel.hidden){event.preventDefault();close(true);}
    if(panel.hidden||!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return;
    event.preventDefault();const all=items(),at=all.indexOf(documentRef.activeElement);
    const index=event.key==='Home'?0:event.key==='End'?all.length-1:
      (at+(event.key==='ArrowDown'?1:-1)+all.length)%all.length;
    all[index]?.focus();
  });
  // Close before the existing action runs; never delay share behind an async task.
  panel.addEventListener('click',event=>{
    const item=event.target.closest('button,a[href]');
    if(!item)return;
    dialogAction=item.id==='board-preferences'?'display-preferences':item.id==='board-share'?'seed-share':null;
    close(true);
  },true);
  documentRef.addEventListener('pointerdown',event=>{if(!root.contains(event.target))close();});
  documentRef.addEventListener('focusin',event=>{if(!root.contains(event.target))close();});
  // Existing dialogs keep their own behavior; return to the visible disclosure.
  for(const id of ['display-preferences','seed-share']){
    documentRef.getElementById(id)?.addEventListener('close',()=>{
      if(dialogAction===id){dialogAction=null;toggle.focus({preventScroll:true});}
    });
  }
}
