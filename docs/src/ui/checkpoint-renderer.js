// 結果カードの描画レシート（物件導向化 第36期）。owner ごと・key ごとに一度だけ描画し、失敗時に曖昧な DOM 書き込みを検出する。
// レシートは owner を鍵とする WeakMap に持ち、owner（賞の計画・シーズン終了の entry）へ描画状態を書き込まない。
// card と logTarget は game.js から遅延束縛の lambda で注入する。E2E とテストは game.js の card を差し替えて故障を注入するため、GameView.card を直接呼ばない。
export class CheckpointRenderer {
  #receipts = new WeakMap();
  #card;
  #logTarget;
  constructor({ card, logTarget }) {
    this.#card = card; this.#logTarget = logTarget;
  }
  render(owner,key,args){
    let receipts=this.#receipts.get(owner);if(!receipts){receipts=new Map();this.#receipts.set(owner,receipts);}let receipt=receipts.get(key);
    if(receipt?.status==='COMMITTED')return;
    if(receipt?.status==='AMBIGUOUS')throw new Error('RESULT_RENDER_AMBIGUOUS');
    if(!receipt){receipt={status:'PLANNED'};receipts.set(key,receipt);}
    const target=typeof document!=='undefined'?this.#logTarget():null,count=target?.children.length;
    try{this.#card(...args);receipt.node=target?.lastElementChild;receipt.status='COMMITTED';}
    catch(error){
      // card appends synchronously before scrollBottom. An already appended owned card
      // may be acknowledged, but unexplained extra DOM writes must not be guessed.
      if(target&&target.children.length===count+1&&target.lastElementChild.classList.contains('card')){receipt.node=target.lastElementChild;receipt.status='COMMITTED';}
      else if(target&&target.children.length!==count)receipt.status='AMBIGUOUS';
      throw error;
    }
  }
}
