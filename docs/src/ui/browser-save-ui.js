export function createBrowserSaveUI({documentRef=document,onContinue,onDelete,onHome,onRetry}){
 const panel=documentRef.createElement('section');panel.id='browser-save-panel';panel.className='browser-save-panel';
 const heading=documentRef.createElement('h2');heading.textContent='このブラウザーのセーブ';
 const summary=documentRef.createElement('p');summary.id='save-summary';const message=documentRef.createElement('p');message.id='save-message';message.setAttribute('role','status');
 const explain=documentRef.createElement('p');explain.className='save-explanation';explain.textContent='ページを閉じたり再読み込みしたりすると、最後にセーブに成功した年の最初から再開します。その年の未保存の操作は、もう一度プレイする必要があります。データはこのブラウザーだけに保存され、サイトデータを消去すると失われることがあります。';
 const actions=documentRef.createElement('div');actions.className='save-actions';
 const button=(id,text,action)=>{const b=documentRef.createElement('button');b.id=id;b.type='button';b.className='btn';b.textContent=text;b.onclick=()=>action();actions.append(b);return b;};
 const resume=button('save-continue','続きから',onContinue),remove=button('save-delete','セーブデータを削除',onDelete),retry=button('save-retry','もう一度読み込む',onRetry),home=button('save-home','タイトルに戻る',onHome);
 panel.append(heading,summary,message,actions,explain);documentRef.querySelector('#start .field').before(panel);
 const live=documentRef.createElement('div');live.id='save-live';const status=documentRef.createElement('p');status.setAttribute('role','status');const back=documentRef.createElement('button');back.type='button';back.id='save-return-title';back.textContent='タイトルへ';back.onclick=onHome;const unsaved=documentRef.createElement('button');unsaved.type='button';unsaved.id='save-continue-unsaved';unsaved.textContent='セーブせずに続ける';unsaved.hidden=true;unsaved.onclick=()=>documentRef.querySelector('#act button:not(:disabled),#act .abrow')?.focus({preventScroll:true});live.append(status,unsaved,back);documentRef.getElementById('board').append(live);
 return state=>{
  const saved=state.slot,loading=['loading','restoring','deleting'].includes(state.phase),error=state.phase==='restore-error';
  message.textContent=state.message;status.textContent=state.message;unsaved.hidden=!state.message.includes('以後セーブされません');back.textContent=unsaved.hidden?'タイトルへ':'タイトルで最新データを読む';
  const pos={P:'投手',C:'捕手',IF:'内野手',OF:'外野手'};
  summary.textContent=saved? saved.state.year+'年・'+saved.state.age+'歳／'+pos[saved.state.pos]+'／'+saved.state.name+'　保存日時：'+new Date(saved.savedAt).toLocaleString('ja-JP')+'（引退時も保存年度の最初から再開）':'';
  resume.hidden=!saved||error;resume.disabled=loading||state.phase!=='ready';remove.hidden=!saved||error;remove.disabled=loading||state.phase!=='ready';retry.hidden=!error;home.hidden=!error;
  const start=documentRef.getElementById('btn-start');start.disabled=loading||error;start.textContent=state.phase==='unavailable'?'セーブせずに始める':'野球人生を始める ▸ 高校1年春';
  if(error)documentRef.getElementById('start').style.display='';
 };
}
