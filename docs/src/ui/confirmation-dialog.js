import {lockBackground,watchScrollPosition} from './information-dialog.js';

// The same header/content/footer and viewport handling as the information dialogs.
// A second request is cancelled rather than sharing an approval with two actions.
let request;
export function confirmAction({title='確認',message,confirmLabel='OK',cancelLabel='キャンセル'}={}){
  if(!request)request=createConfirmationDialog();
  return request({title,message,confirmLabel,cancelLabel});
}
function createConfirmationDialog(){
  const dialog=document.createElement('dialog');dialog.id='confirmation-dialog';dialog.className='information-dialog confirmation-dialog';
  dialog.setAttribute('aria-labelledby','confirmation-title');dialog.setAttribute('aria-describedby','confirmation-message');
  const header=document.createElement('header');header.className='information-header';
  const heading=document.createElement('h2');heading.id='confirmation-title';header.append(heading);
  const frame=document.createElement('div');frame.className='information-scroll-frame';
  const viewport=document.createElement('div');viewport.className='information-content';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-labelledby',heading.id);
  const article=document.createElement('div');article.className='information-article';
  const message=document.createElement('p');message.id='confirmation-message';article.append(message);viewport.append(article);
  const track=document.createElement('div');track.className='information-scroll-track';track.hidden=true;track.setAttribute('aria-hidden','true');
  const thumb=document.createElement('div');thumb.className='information-scroll-thumb';track.append(thumb);frame.append(viewport,track);
  const footer=document.createElement('footer');footer.className='information-footer';
  const cancel=document.createElement('button');cancel.id='confirmation-cancel';cancel.type='button';
  const accept=document.createElement('button');accept.id='confirmation-ok';accept.type='button';footer.append(cancel,accept);
  dialog.append(header,frame,footer);document.body.append(dialog);
  let pending=null;
  const finish=approved=>{
    if(!pending)return;
    const active=pending;pending=null;active.unwatch?.();
    if(dialog.open)dialog.close();active.unlock?.();
    if(active.opener?.isConnected&&!active.opener.disabled)active.opener.focus({preventScroll:true});
    active.resolve(approved);
  };
  cancel.addEventListener('click',()=>finish(false));accept.addEventListener('click',()=>finish(true));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(false);});
  dialog.addEventListener('close',()=>{if(!dialog.open)finish(false);});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)finish(false);});
  return options=>{
    if(pending||document.querySelector('dialog[open]'))return Promise.resolve(false);
    heading.textContent=options.title;message.textContent=options.message;cancel.textContent=options.cancelLabel;accept.textContent=options.confirmLabel;
    return new Promise(resolve=>{
      pending={resolve,opener:document.activeElement};
      try{pending.unlock=lockBackground();dialog.showModal();viewport.scrollTop=0;pending.unwatch=watchScrollPosition(dialog,viewport,article,track,thumb,header,footer);cancel.focus({preventScroll:true});}
      catch{finish(false);}
    });
  };
}
