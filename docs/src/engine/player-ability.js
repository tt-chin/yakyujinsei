// Ability growth, the annual allocation panel and its combo/late-bloomer trait checks (OOP plan §2u).
// The career state is read through getState; clamp, the POS_AB/ABL tables, careerSession and choiceViews are passed by
// reference, and the game.js UI/rating helpers and the R RNG bridge as late-binding lambdas. The bodies are the former
// game.js addAb/addAbStat/allocDone/allocUI; allocUI reaches allocDone through the injected game.js binding so that
// overlay wrappers still apply, and its deferred handlers act only after live() has checked getState() against state.
export class PlayerAbility {
  #rules;
  #view;
  constructor({allocDone,...deps}){this.#rules=abilityRules(deps);this.#view=allocationView({...deps,addAb:(k,v)=>this.#rules.addAb(k,v),allocDone});}
  addAb(k,v){return this.#rules.addAb(k,v);}
  addAbStat(k,amt){return this.#rules.addAbStat(k,amt);}
  allocDone(touched,isDice){this.#rules.allocDone(touched,isDice);}
  allocUI(mode,label,done){this.#view.allocUI(mode,label,done);}
}

function allocationView({getState,$,careerSession,choiceViews,POS_AB,ABL,abCost,addAb,allocDone,archiveTraitResults,board,actClear,actToggleSync,runWithResultView}){
  function allocUI(mode,label,done){
    const S=getState();
    actClear(); ++careerSession.choiceGeneration; const generation=careerSession.choiceGeneration, state=S; careerSession.activeChoiceToken=null; const a=$('act'); const keys=POS_AB[S.pos];
    let completed=false;
    const year=S.year;choiceViews.set(S,{kind:'ALLOCATION',state,year,generation});
    const live=element=>!completed&&getState()===state&&S.year===year&&careerSession.choiceGeneration===generation&&element.isConnected&&a.contains(element);
    let dice=mode.dice?mode.dice.slice():null, pool=mode.pool||0, idx=0, hist=[];
    a.innerHTML=`<div class="title">${label}</div><div id="al-top"></div><div id="al-rows"></div><div class="row2" id="al-btm"></div>`;
    const touchedKeys={};
    const copyTouched=()=>({...touchedKeys});
    const restoreTouched=value=>{Object.keys(touchedKeys).forEach(k=>delete touchedKeys[k]);Object.assign(touchedKeys,value);};
    const sessionStart={abilities:{...S.ab},carry:{...(S.carry||{})},pool,diceIndex:idx,touchedKeys:copyTouched()};
    const top=$('al-top'),rows=$('al-rows'),btm=$('al-btm');
    function remaining(){ return dice?dice.length-idx:pool; }
    function render(focusKey){
      if(dice){ top.innerHTML='<div id="dice">'+dice.map((v,i)=>`<div class="die ${i<idx?'used':''} ${i===idx?'active':''} ${v===6?'six':''}">${v}</div>`).join('')+'</div>'; }
      else top.innerHTML=`<div class="pool" aria-live="polite">残り配分ポイント：${pool}</div>`;
      rows.innerHTML='';
      keys.forEach(k=>{ const v=S.ab[k],cap=v>=80;
        const available=!cap&&remaining()>0;
        const r=document.createElement('div'); r.className='abrow'+(cap?' capped':'');r.dataset.abilityKey=k;r.setAttribute('role','button');r.setAttribute('aria-label',dice?`${ABL[k]}に現在のサイコロを割り当てる`:`${ABL[k]}に1ポイント配分`);r.setAttribute('aria-disabled',String(!available));r.tabIndex=available?0:-1;
        const pk=(S.pot&&S.pot[k])||62, cst=abCost(k), cr=(S.carry&&S.carry[k])||0;
        const info=document.createElement('div');info.className='abrow-info';info.innerHTML=`<span class="nm">${ABL[k]}</span><span class="bar"><i style="width:${v/80*100}%"></i><em style="left:${pk/80*100}%"></em></span><span class="val" style="line-height:1.1">${v}<small style="opacity:.5">/${pk}</small><span class="progress">${cr}/${cst}</span></span>`;r.appendChild(info);
        const allocate=()=>{if(!live(r)||S.ab[k]>=80||remaining()<=0)return;const before={abilityKey:k,beforeAbility:S.ab[k],beforeCarry:(S.carry&&S.carry[k])||0,beforePool:pool,beforeDiceIndex:idx,beforeTouched:copyTouched()};const spend=dice?dice[idx]:1;if(spend<=0)return;archiveTraitResults();const got=addAb(k,spend);touchedKeys[k]=(touchedKeys[k]||0)+spend;hist.push({...before,spent:spend,gained:got});if(dice)idx++;else pool--;render(k);board(0);};
        if(available){r.onclick=allocate;r.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();allocate();}};}
        rows.appendChild(r); });
      btm.innerHTML='';
      /* 復原鈕固定占める位：なし可復原時 disabled 而非消失、防止版面跳動作誤觸。 */
      const u=document.createElement('button'); u.className='btn'; u.style.textAlign='center';
      u.textContent='↩ 元に戻す'; u.disabled=!hist.length;
      u.style.opacity=hist.length?'1':'0.35'; u.style.cursor=hist.length?'pointer':'default';
      if(hist.length)u.onclick=()=>{if(!live(u)||!hist.length)return;const entry=hist.pop();S.ab[entry.abilityKey]=entry.beforeAbility;if(!S.carry)S.carry={};S.carry[entry.abilityKey]=entry.beforeCarry;pool=entry.beforePool;idx=entry.beforeDiceIndex;restoreTouched(entry.beforeTouched);render(entry.abilityKey);board(0);};
      btm.appendChild(u);
      const reset=document.createElement('button');reset.type='button';reset.className='btn warn';reset.textContent='すべてリセット';reset.disabled=!hist.length;reset.onclick=()=>{if(!live(reset)||!hist.length)return;Object.assign(S.ab,sessionStart.abilities);S.carry={...sessionStart.carry};pool=sessionStart.pool;idx=sessionStart.diceIndex;restoreTouched(sessionStart.touchedKeys);hist=[];render();board(0);};btm.appendChild(reset);
      const allCap=keys.every(k=>S.ab[k]>=80);
      if(remaining()===0||allCap){ const c=document.createElement('button'); c.className='btn main';
        c.textContent=(remaining()>0&&allCap)?'能力が上限に達しました。残ったサイコロを捨てます ▸':'確定 ▸';
        c.onclick=()=>{if(!live(c)||!(remaining()===0||keys.every(k=>S.ab[k]>=80)))return;completed=true;return runWithResultView(()=>{ archiveTraitResults();actClear(); allocDone(touchedKeys,dice?true:false); done(); });}; btm.appendChild(c); }
      actToggleSync();
      if(focusKey){const target=a.querySelector(`[data-ability-key="${focusKey}"]`);(target?.getAttribute('aria-disabled')==='false'?target:a.querySelector('.abrow[aria-disabled="false"], #al-btm button:not(:disabled)'))?.focus();}
    }
    render();
  }
  return {allocUI};
}

function abilityRules({getState,clamp,POS_AB,ABL,ovr,traitCard,card,board,rng:{R}}){
  function addAb(k,v){ const S=getState(); if(!(k in S.ab))return 0; const o=S.ab[k];
    S.lastOverflow=0; /* 【修正】紀錄真正溢出的ポイント。 */
    if(v<0){ S.ab[k]=clamp(o+v,1,80); return S.ab[k]-o; } /* 扣値 1：1、不吃ゲージ成本。 */
    if(!S.carry)S.carry={};
    let cur=o,bud=v+(S.carry[k]||0); /* 次の段階に未到達的ポイント進出捗ゲージへ蓄積、消滅させない。 */
    const pk=(S&&S.pot&&S.pot[k])||62;
    const isP=S&&S.pos==='P';
    while(bud>0&&cur<80){
      let cost=isP?(cur>=66?7:cur>=60?4:cur>=55?2:1)      /* 投手のみ有4項、養成成本最陡。 */
                :(cur>=72?3:cur>=64?2:1);                    /* 野手9項、中高段変化貴。 */
      if(cur>=pk)cost*=isP?4:3; /* 天花板之上：投手×4、野手×3。 */
      if(bud>=cost){bud-=cost;cur++;} else break; }
    if(cur>=80) S.lastOverflow=bud; /* 80到達後、残りのポイントが実際の超済み分。 */
    S.carry[k]=cur>=80?0:bud;
    S.ab[k]=cur; return cur-o; }
  function addAbStat(k,amt){ 
    const S=getState();
    if(amt<=0)return addAb(k,amt);
    const pk=(S.pot&&S.pot[k])||62;
    const isP=S.pos==='P';
    let cur=S.ab[k], bud=amt, cr=(S.carry&&S.carry[k])||0, gained=0;
    /* 能力上限到達後はポイント全額をシーズン成績ボーナスへ変換。 */
    if(cur>=pk){ S.pendStat=(S.pendStat||0)+bud; return 0; }
    
    /* 能力上限未到達なら通常コストで加算し、上限に達した時点で止める。 */
    while(bud>0 && cur<pk){
      let c = isP ? (cur>=66?7:cur>=60?4:cur>=55?2:1) : (cur>=72?3:cur>=64?2:1);
      bud--; cr++; if(cr>=c){ cr-=c; cur++; gained++; }
    }
    
    if(!S.carry) S.carry={}; S.carry[k]=cr; S.ab[k]=cur;
    
    /* 能力上限到達後の残りポイントは成績ボーナスへ変換。 */
    if(bud>0) S.pendStat=(S.pendStat||0)+bud;
    return gained;
  }
  function allocDone(touched,isDice){
    const S=getState();
    const keys=Object.keys(touched);
    if(isDice&&S.stage!=='HS'&&keys.length){ /* 高校以外（大学・社会人・独立・プロ）の開幕前ダイスだけを集中育成判定へ使用。 */
      const tot=Object.values(touched).reduce((a,b)=>a+b,0);
      let mk=keys[0]; keys.forEach(k=>{ if(touched[k]>touched[mk])mk=k; });
      const focused=(touched[mk]/tot>=0.75)?mk:null; /* 75%以上を同じ能力へ投入した場合に集中育成と判定。 */
      if(focused&&focused===S.samePickKey)S.samePick++;
      else if(focused){ S.samePickKey=focused; S.samePick=1; }
      else { S.samePickKey=null; S.samePick=0; }
      if(S.samePick>=3&&!S.traits.combo){ S.traits.combo=true; S.samePickBonus=true;
        S.comboKey=S.samePickKey; /* 鎖定解鎖當下的能力、之後以後はしない変化動作。 */
        traitCard('combo','小細工無用',`3年連続、ひとつの武器だけを磨き続けた――<b class="hl">シーズン前にダイスを1個自動で振り、得点を得意能力「${ABL[S.comboKey]}」へ必ず加算する</b>。一点突破こそ正義や。`); }
    }
    /* 遅咲き：25歳以降の単年能力増加合計 >=8。 */
    const gain=Object.values(touched).reduce((a,b)=>a+b,0);
    if(!S.traits.late&&!S.traits.genius&&ovr()<47&&S.age>=25&&S.age<32&&isDice&&gain>=16){
      S.traits.late=true;
      const exDef=S.pos==='C'?['rng','fld','arm','cat']:[];
      const cands=POS_AB[S.pos].filter(k=>S.ab[k]<70&&!exDef.includes(k));
      for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=cands[i];cands[i]=cands[j];cands[j]=t;}
      const boost=cands.slice(0,2), bl=[];
      boost.forEach(k=>{ S.pot[k]=Math.min(80,(S.pot[k]||62)+10); S.ab[k]=clamp(S.ab[k]+5,1,80);
        bl.push(`${ABL[k]} <b class="up">+5</b>(最大潜在力+10 →${S.pot[k]}）`); });
      card('gold','隠し特性解放：大器晩成',`周囲はもう伸びしろがないと思っていた。だが、今季のあなたは別人だった――今後、トレーニングダイスは<b class="hl">永久に3以上</b>、イベントカード成功率は<b class="hl">70%</b>になる。`+(bl.length?`潜在能力を再評価：${bl.join('、')}。`:'')+'物語は、ここからや。');
      board(1); }
  }
  return {addAb,addAbStat,allocDone};
}
