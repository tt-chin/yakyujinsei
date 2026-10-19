// game.js の純DOM基本操作（物件導向化 第2期）。S と RNG に触れず、S に依存する処理は game.js から注入する。
export class GameView {
  constructor({ byId, logTarget, decorateCard, onTraitShown }) {
    this.byId = byId; this.logTarget = logTarget; this.decorateCard = decorateCard; this.onTraitShown = onTraitShown;
  }
  scrollBottom(){ /* iOS Safari iframe内でスムーズスクロールでは白画面が起きやすいため、同期スクロールへ変更+rAF。 */
    try{ requestAnimationFrame(function(){ window.scrollTo(0, document.body.scrollHeight); }); }
    catch(e){ try{ window.scrollTo(0, document.body.scrollHeight); }catch(_){} }
  }
  archiveTraitResults(){
    this.byId('log').querySelectorAll('[data-trait-result]').forEach(node=>{
      node.replaceChildren();const name=document.createElement('h4');name.textContent=node.dataset.traitName;node.appendChild(name);
      delete node.dataset.traitResult;
    });
  }
  card(cls,title,html){ const d=document.createElement('div'); d.className='card '+cls;
    ({title,html}=this.decorateCard(d,title,html));
    d.innerHTML=(title?`<h4>${title}</h4>`:'')+html; this.logTarget().appendChild(d);
    if(d.dataset.traitResult&&!d.dataset.traitResult.startsWith('removed:'))this.onTraitShown(d.dataset.traitResult);
    this.scrollBottom(); }
  divider(t,maxYears){ /* dividerごとに新しい年度の折りたたみ領域を開始し、その本文容器を返す。 */ const log=this.byId('log'); const blocks=log.querySelectorAll('.yr-block'); /* 終了した直前年へ展開アイコンを付けるが、collapsedは付けず開いたままにする。 */ const prev = blocks[blocks.length - 1]; if(prev){ const h = prev.querySelector('.yr-head'); if(h && prev.querySelector('.yr-body').children.length) h.classList.add('has-body'); } /* 二つ前の年度領域を見つけて折りたたむ。 */ const prevPrev = blocks[blocks.length - 2]; if(prevPrev){ prevPrev.classList.add('collapsed'); } /* 建新領域。 */ const block=document.createElement('div'); block.className='yr-block'; const head=document.createElement('div'); head.className='yr-head'; head.textContent=t; const body=document.createElement('div'); body.className='yr-body'; head.onclick=()=>block.classList.toggle('collapsed'); block.appendChild(head); block.appendChild(body); log.appendChild(block); /* 上限超える時は最古の年度領域を削除してDOMを解放。 */ const newBlocks=log.querySelectorAll('.yr-block'); if(newBlocks.length>maxYears){ for(let i=0;i<newBlocks.length-maxYears;i++)newBlocks[i].remove(); } return body; }
  actClear(){ const a=this.byId('act'); a.innerHTML=''; a.classList.remove('collapsed'); a.style.pointerEvents='';
    const t=this.byId('act-toggle'); if(t)t.style.display='none'; }
  actToggleSync(){
    const a=this.byId('act'), t=this.byId('act-toggle'); if(!t)return;
    const has=a.innerHTML.trim()!=='' && a.style.display!=='none';
    t.style.display=has?'block':'none';
    t.textContent=a.classList.contains('collapsed')?'⌃ 選択肢を展開':'⌄ 選択肢を閉じる';
  }
}
