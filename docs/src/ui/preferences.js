export const PREFERENCES_STORAGE_KEY = 'yakyujinsei.display.v1';
export const DEFAULT_PREFERENCES = Object.freeze({schemaVersion:1,theme:'standard',fontSize:'medium',density:'standard'});
const allowed = {theme:['standard','night','classic','scoreboard'],fontSize:['small','medium','large'],density:['standard','compact']};
let preferences = {...DEFAULT_PREFERENCES};

export function normalizeDisplayPreferences(value) {
  if (!value || value.schemaVersion !== 1) return {...DEFAULT_PREFERENCES};
  return Object.fromEntries(Object.entries(DEFAULT_PREFERENCES).map(([key,fallback])=>[key,key==='schemaVersion'?1:allowed[key].includes(value[key])?value[key]:fallback]));
}

export function readDisplayPreferences(storage) {
  try { return normalizeDisplayPreferences(JSON.parse(storage.getItem(PREFERENCES_STORAGE_KEY))); }
  catch { return {...DEFAULT_PREFERENCES}; }
}

export function saveDisplayPreferences(storage,value) {
  try { storage.setItem(PREFERENCES_STORAGE_KEY,JSON.stringify(normalizeDisplayPreferences(value)));return true; }
  catch { return false; }
}

export function getDisplayPreferences() { return {...preferences}; }

export function initializeDisplayPreferences({documentRef=document,windowRef=window}={}) {
  let storage;
  try { storage=windowRef.localStorage; } catch { /* Display preferences remain usable in memory. */ }
  preferences=readDisplayPreferences(storage);
  const apply=()=>{
    const root=documentRef.documentElement;
    root.dataset.theme=preferences.theme;
    root.dataset.fontSize=preferences.fontSize;
    root.dataset.density=preferences.density;
  };
  apply();
  // Only geometry is observed; no game model or game render callback is involved.
  const board=documentRef.getElementById('board'),nav=documentRef.getElementById('main-nav');
  const syncStickyHeight=()=>documentRef.documentElement.style.setProperty('--display-sticky-height',`${board.getBoundingClientRect().height+nav.getBoundingClientRect().height}px`);
  if(windowRef.ResizeObserver){const observer=new windowRef.ResizeObserver(syncStickyHeight);observer.observe(board);observer.observe(nav);}
  const dialog=documentRef.createElement('dialog');
  dialog.id='display-preferences';
  dialog.setAttribute('role','dialog');
  dialog.setAttribute('aria-modal','true');
  dialog.setAttribute('aria-labelledby','display-preferences-title');
  const groups=[['theme','テーマ',['スタンダード','ナイター','クラシック','スコアボード']],['fontSize','文字サイズ',['小さめ','標準','大きめ']],['density','表示密度',['標準','コンパクト']]];
  dialog.innerHTML=`<h2 id="display-preferences-title" tabindex="-1">表示設定</h2>${groups.map(([key,title,labels])=>`<fieldset><legend>${title}</legend><div class="preference-options">${allowed[key].map((value,index)=>`<label><input type="radio" name="${key}" value="${value}"><span>${labels[index]}</span></label>`).join('')}</div></fieldset>`).join('')}<p id="preferences-save-status" role="status" aria-live="polite"></p><div class="preferences-actions"><button type="button" id="preferences-reset">初期設定に戻す</button><button type="button" id="preferences-close">閉じる</button></div>`;
  documentRef.body.append(dialog);
  const inputs=[...dialog.querySelectorAll('input')],status=dialog.querySelector('#preferences-save-status');
  const sync=()=>inputs.forEach(input=>{input.checked=preferences[input.name]===input.value;});
  sync();
  const update=value=>{
    const x=windowRef.scrollX,y=windowRef.scrollY;
    preferences=normalizeDisplayPreferences(value);
    apply();sync();
    status.textContent=saveDisplayPreferences(storage,preferences)?'':'この端末には設定を保存できませんでした。';
    syncStickyHeight();windowRef.scrollTo(x,y);
    windowRef.dispatchEvent(new windowRef.CustomEvent('yakyujinsei:displaychange',{detail:getDisplayPreferences()}));
  };
  inputs.forEach(input=>input.addEventListener('change',()=>{if(input.checked)update({...preferences,[input.name]:input.value});}));
  dialog.querySelector('#preferences-reset').addEventListener('click',()=>update(DEFAULT_PREFERENCES));
  let opener=null,scrollPosition=null;
  const close=()=>dialog.close();
  dialog.querySelector('#preferences-close').addEventListener('click',close);
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  dialog.addEventListener('close',()=>{
    documentRef.body.classList.remove('display-preferences-open');
    opener?.focus({preventScroll:true});
    if(scrollPosition)windowRef.scrollTo(...scrollPosition);
  });
  dialog.addEventListener('keydown',event=>{
    if(event.key!=='Tab')return;
    const focusable=[...dialog.querySelectorAll('input:checked,button')];
    const first=focusable[0],last=focusable.at(-1),active=documentRef.activeElement;
    if(event.shiftKey&&(active===first||active===dialog.querySelector('h2'))){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&active===last){event.preventDefault();first.focus();}
  });
  documentRef.querySelectorAll('[data-open-preferences]').forEach(button=>button.addEventListener('click',()=>{
    if(dialog.open)return;
    opener=button;scrollPosition=[windowRef.scrollX,windowRef.scrollY];
    sync();dialog.showModal();documentRef.body.classList.add('display-preferences-open');
    dialog.querySelector('h2').focus({preventScroll:true});
  }));
  return {get:getDisplayPreferences};
}
