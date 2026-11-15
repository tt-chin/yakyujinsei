import {lockBackground,watchScrollPosition} from './information-dialog.js';
import {JERSEY_NUMBERS} from '../engine/jersey-policy.js';

// PLY-01 number picker: the same header/content/footer as the confirmation dialog, with one select.
// Resolves the chosen number string, or null on cancel/Esc/backdrop. Writes no state and draws no RNG.
let request;
export function chooseJerseyNumber({title,summary,note,selected,confirmLabel,cancelLabel='キャンセル'}={}){
  if(!request)request=createJerseyDialog();
  return request({title,summary,note,selected,confirmLabel,cancelLabel});
}
function createJerseyDialog(){
  const dialog=document.createElement('dialog');dialog.id='jersey-dialog';dialog.className='information-dialog confirmation-dialog jersey-dialog';
  dialog.setAttribute('aria-labelledby','jersey-title');dialog.setAttribute('aria-describedby','jersey-note');
  const header=document.createElement('header');header.className='information-header';
  const heading=document.createElement('h2');heading.id='jersey-title';header.append(heading);
  const frame=document.createElement('div');frame.className='information-scroll-frame';
  const viewport=document.createElement('div');viewport.className='information-content';viewport.tabIndex=0;viewport.setAttribute('role','region');viewport.setAttribute('aria-labelledby',heading.id);
  const article=document.createElement('div');article.className='information-article';
  const summary=document.createElement('p');summary.id='jersey-summary';
  const label=document.createElement('label');label.className='jersey-field';label.htmlFor='jersey-select';label.textContent='新しい背番号';
  const select=document.createElement('select');select.id='jersey-select';
  for(const number of JERSEY_NUMBERS){const option=document.createElement('option');option.value=number;option.textContent=number;select.append(option);}
  const field=document.createElement('p');field.className='jersey-field-row';field.append(label,select);
  const note=document.createElement('p');note.id='jersey-note';note.className='sub';
  article.append(summary,field,note);viewport.append(article);
  const track=document.createElement('div');track.className='information-scroll-track';track.hidden=true;track.setAttribute('aria-hidden','true');
  const thumb=document.createElement('div');thumb.className='information-scroll-thumb';track.append(thumb);frame.append(viewport,track);
  const footer=document.createElement('footer');footer.className='information-footer';
  const cancel=document.createElement('button');cancel.id='jersey-cancel';cancel.type='button';
  const accept=document.createElement('button');accept.id='jersey-ok';accept.type='button';footer.append(cancel,accept);
  dialog.append(header,frame,footer);document.body.append(dialog);
  let pending=null;
  const finish=value=>{
    if(!pending)return;
    const active=pending;pending=null;active.unwatch?.();
    if(dialog.open)dialog.close();active.unlock?.();
    if(active.opener?.isConnected&&!active.opener.disabled)active.opener.focus({preventScroll:true});
    active.resolve(value);
  };
  cancel.addEventListener('click',()=>finish(null));accept.addEventListener('click',()=>finish(select.value));
  dialog.addEventListener('cancel',event=>{event.preventDefault();finish(null);});
  dialog.addEventListener('close',()=>{if(!dialog.open)finish(null);});
  dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)finish(null);});
  return options=>{
    if(pending||document.querySelector('dialog[open]'))return Promise.resolve(null);
    heading.textContent=options.title;summary.textContent=options.summary;note.textContent=options.note;
    cancel.textContent=options.cancelLabel;accept.textContent=options.confirmLabel;
    select.value=JERSEY_NUMBERS.includes(options.selected)?options.selected:JERSEY_NUMBERS[0];
    return new Promise(resolve=>{
      pending={resolve,opener:document.activeElement};
      try{pending.unlock=lockBackground();dialog.showModal();viewport.scrollTop=0;pending.unwatch=watchScrollPosition(dialog,viewport,article,track,thumb,header,footer);select.focus({preventScroll:true});}
      catch{finish(null);}
    });
  };
}
