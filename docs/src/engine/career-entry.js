// キャリアの開始と再開（物件導向化 第37期）。新規開始（startNew）と保存データからの再開（resume）は同じ画面切替・ナビゲーション初期化（enter）を通る。
// 本体は旧 game.js の startJapanese と browserSave の restore callback（hydrateSavedState の後）。history.replaceState は各経路の元の位置に残す。
// S と SEED は game.js の let なので getState/setState/getSeed/setSeed で読み書きし、読むたびに取得する。careerSession は参照で渡し、その場で作り直す。
// game.js の関数はすべて遅延束縛の lambda で注入する。E2E は card・startYear・R などを差し替えるため、ここから GameView や Rng を直接呼ばない。
export class CareerEntry {
  #rules;
  constructor(deps){this.#rules=careerEntryRules(deps);}
  startNew(){this.#rules.startNew();}
  resume(candidate){this.#rules.resume(candidate);}
}

function careerEntryRules({getState,setState,getSeed,setSeed,careerSession,CareerSession,POSN,$,getNavigation,normalizeSeed,generateSeed,normalizePlayerName,seedInit,newState,escapeHTML,card,actClear,startYear}){
  function enter(){$('start').style.display='none';$('board').style.display='';$('act').style.display='';const navigation=getNavigation();navigation.reset();navigation.show();}
  function startNew(){let params=new URLSearchParams(location.search);let sv=normalizeSeed($('seed-show').value||params.get('seed'));if(!sv)sv=generateSeed();setSeed(sv);const pos=document.querySelector('#seg-pos button.on')?.dataset.v||'P';const nm=normalizePlayerName($('in-name').value,getSeed(),pos);setState({rngState:0});seedInit(getSeed());setState(newState(nm,pos));history.replaceState(null,'',`?seed=${encodeURIComponent(getSeed())}`);enter();const S=getState();card('info','選手誕生',`${S.year}年春、${POSN[S.pos]} <b class="hl">${escapeHTML(S.name)}</b>は<b class="hl">${escapeHTML(S.team)}</b>${S.schoolTier==='C'?'（C級・弱小校）':''}野球部に入部した。ここから、すべての選択が野球人生を変える。`);startYear();}
  function resume(candidate){const generation=careerSession.choiceGeneration+1;for(const k of Object.keys(careerSession))delete careerSession[k];Object.assign(careerSession,new CareerSession(),{choiceGeneration:generation});setState(candidate);setSeed(getState().seed);$('log').replaceChildren();actClear();$('app').style.display='flex';enter();history.replaceState(null,'',`?seed=${encodeURIComponent(getSeed())}`);startYear();}
  return {startNew,resume};
}
