export function createBrowserSaveUI({documentRef=document,onContinue,onNew,onHome,onRetry}){
 const panel=documentRef.createElement('section');panel.id='browser-save-panel';panel.className='browser-save-panel';
 const form=documentRef.getElementById('home-create');
 const message=documentRef.createElement('p');message.id='save-message';message.setAttribute('role','status');
 const actions=documentRef.createElement('div');actions.className='save-actions';
 const button=(id,text,action)=>{const b=documentRef.createElement('button');b.id=id;b.type='button';b.className='btn';b.textContent=text;b.onclick=()=>action();actions.append(b);return b;};
 const resume=button('save-continue','続きから',onContinue),fresh=button('save-new','新しく始める',async()=>{if(await onNew())documentRef.getElementById('in-name').focus();}),retry=button('save-retry','もう一度読み込む',onRetry),home=button('save-home','タイトルに戻る',onHome);
 panel.append(message,actions);form.before(panel);
 const live=documentRef.createElement('div');live.id='save-live';const status=documentRef.createElement('p');status.setAttribute('role','status');const back=documentRef.createElement('button');back.type='button';back.id='save-return-title';back.textContent='タイトルへ';back.onclick=onHome;const unsaved=documentRef.createElement('button');unsaved.type='button';unsaved.id='save-continue-unsaved';unsaved.textContent='セーブせずに続ける';unsaved.hidden=true;unsaved.onclick=()=>documentRef.querySelector('#act button:not(:disabled),#act .abrow')?.focus({preventScroll:true});live.append(status,unsaved,back);documentRef.getElementById('board').append(live);
 return state=>{
  const saved=state.slot,loading=['loading','restoring','deleting'].includes(state.phase),error=['restore-error','delete-error'].includes(state.phase);
  message.textContent=state.message;status.textContent=state.message;unsaved.hidden=!state.message.includes('以後セーブされません');back.textContent=unsaved.hidden?'タイトルへ':'タイトルで最新データを読む';
  const ready=state.phase==='ready',chooser=!!saved&&ready;
  // Successful inspection/deletion is silent; errors and recovery remain visible.
  message.textContent=ready?'':state.message;message.hidden=ready;
  panel.hidden=ready&&!chooser;form.hidden=chooser||loading||error;
  resume.hidden=!chooser;resume.disabled=loading||!ready;fresh.hidden=!chooser;fresh.disabled=loading||!ready;
  retry.hidden=!error;home.hidden=!error;
  const start=documentRef.getElementById('btn-start');start.disabled=loading||error;start.textContent=state.phase==='unavailable'?'セーブせずに始める':'野球人生を始める ▸ 高校1年春';
  if(error)documentRef.getElementById('start').style.display='';
 };
}
