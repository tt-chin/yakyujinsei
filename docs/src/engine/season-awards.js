// Annual awards: the award transaction flow and the legacy award plan with its native Journal draws (OOP plan §2w).
// The career state and seed are read through getState/getSeed; LV, clamp, traitPresentation and teamNick are passed by
// reference, the award transaction/identity/consumer policies by reference from game.js (the vm harnesses replace them to
// inject faults), and isSP, renderCheckpointCard and the R bridge as late-binding lambdas.
// The rule bodies are the former game.js awards/collectLegacyAwardPlan.
import { TRAIT_TEXT, traitLabel, awardTraitUnlocks } from './trait-policy.js';

export class SeasonAwards {
  #rules;
  constructor(deps){this.#rules=seasonAwardRules(deps);}
  awards(bucket,st){this.#rules.awards(bucket,st);}
}

function seasonAwardRules({getState,getSeed,LV,clamp,traitPresentation,isSP,teamNick,renderCheckpointCard,journalRng:{R},annualAwardTransaction,preallocateAwardSlots,captureAwardSlot,prepareAwardReceipt,commitAwardReceipt,awardPlan,awardInputs,prepareD2AwardDecisions,recordAwardDecisions,completeAwardDecisions,getAwardDefinition,hasCurrentAwardEffect}){
  function awards(bucket,st){
    const S=getState();
    if(!LV[S.lv].top||S.seasonFactor===0)return;
    const tx=annualAwardTransaction(S,{league:bucket,level:S.lv,role:S.role??null,metrics:st});
    preallocateAwardSlots(tx,['ALL_STAR','ROOKIE','LEGACY_BEST_PITCHER','PITCH_SAVES','PITCH_RELIEF','PITCH_STRIKEOUTS','BATTING_AVG','BATTING_HR','BATTING_SB','BATTING_RBI','BATTING_OBP','GOLD_GLOVE','DEFENSE_BEST','MVP']);
    const plan=awardPlan(tx,()=>collectLegacyAwardPlan(bucket,st,tx,S));
    recordAwardDecisions(tx);
    const groups=[['legacy-honors',plan.writes.filter(w=>w.path[0]==='honors')],
      ['legacy-all-star',plan.writes.filter(w=>w.path[0]==='stats')],
      ['legacy-triple-crown-history',plan.writes.filter(w=>w.path[0]==='tripleCrownHistory')],
      ['legacy-traits',plan.writes.filter(w=>!['honors','stats','tripleCrownHistory'].includes(w.path[0]))]];
    // Prepare every independent effect family before writing any of them.
    for(const [id,writes] of groups)prepareAwardReceipt(tx,id,writes);
    for(const [id] of groups)commitAwardReceipt(tx,id);
    completeAwardDecisions(tx);
    for(const key of plan.removedTraits)traitPresentation.get(S)?.delete(key);
    while(plan.renderIndex<plan.cards.length){renderCheckpointCard(plan,plan.renderIndex,plan.cards[plan.renderIndex]);plan.renderIndex++;}
  }
  function collectLegacyAwardPlan(bucket,st,tx,realState){
    const SEED=getSeed();
    const cards=[],removedTraits=[];
    // Narrow preparation projection only; never clone/rollback the whole state or RNG.
    const before=awardInputs(tx,()=>({year:realState.year,age:realState.age,pos:realState.pos,role:realState.role,dpos:realState.dpos,
      lv:realState.lv,seasonFactor:realState.seasonFactor,orgTeamId:realState.orgTeamId,
      stats:Object.fromEntries(Object.entries(realState.stats).map(([k,v])=>[k,{...v}])),
      honors:realState.honors.slice(),traits:{...realState.traits},removed:realState.removed.slice(),
      pool:realState.pool,oldGhostUsed:realState.oldGhostUsed,oldGhostPending:realState.oldGhostPending,
      tripleCrownHistory:realState.tripleCrownHistory===undefined?undefined:structuredClone(realState.tripleCrownHistory)}));
    const S=structuredClone(before);
    const displayTrait=key=>traitLabel(key,S,teamNick);
    const draw=(id,p)=>captureAwardSlot(tx,id,p,()=>R(),()=>realState.rngState);
    const card=(...args)=>cards.push(args);
    const removeTrait=(key,label)=>{if(S.traits[key]){S.traits[key]=false;removedTraits.push(key);if(!S.removed.includes(label))S.removed.push(label);}};
    if(!LV[S.lv].top||S.seasonFactor===0)return;
    const y=S.year,h=S.honors,lgN={CPBL:'台湾プロ野球',KBO:'KBO',NPB:'NPB',MLB:'メジャーリーグ'}[bucket];

    /* 建立適合 simSeason 数學邏輯的基準表 [基礎基準、 鬼神保底基準]。 */
    /* 比率成績(ERA/AVG/OBP)と非試合数連動作成績(SV/HLD/SB)3リーグで基準を統一。 */
    /* 打席・投球回に連動作する(HR/RBI/SO)に応じて 120：143：162 試合数試合数比で拡大。 */
    const TH = {
      CPBL: { g: 120, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [130, 180], avg: [0.300, 0.360], hr: [20, 32], rbi: [75, 105], obp: [0.370, 0.430] },
      KBO:  { g: 144, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [156, 216], avg: [0.300, 0.360], hr: [24, 38], rbi: [90, 126], obp: [0.370, 0.430] },
      NPB:  { g: 143, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [155, 215], avg: [0.300, 0.360], hr: [24, 38], rbi: [90, 125], obp: [0.370, 0.430] },
      MLB:  { g: 162, era: [3.20, 2.20], sv: [22, 35], hld: [18, 30], so: [175, 240], avg: [0.300, 0.360], hr: [27, 43], rbi: [100, 140], obp: [0.370, 0.430] }
    };
    const th = TH[bucket] || TH.CPBL;

    /* 1. オールスター入選：隨成績 (d値) 動作態提升確率。 */
    { const d=st.d;
      let asP=clamp(28+d*7,3,92);
      if(bucket==='CPBL'&&S.orgTeamId==='CPBL_TAICHUNG_MAMMOTHS')asP=clamp(asP+30,3,97); /* 人気球団補正。 */
      if(draw('ALL_STAR',asP)){ S.stats[bucket].AS++;
        h.push(`${y} ${lgN}オールスターゲーム`+((bucket==='CPBL'&&S.orgTeamId==='CPBL_TAICHUNG_MAMMOTHS'&&d<2)?'(ファン投票選出)':'')); } }

    /* 2. 新人王：に応じて d 値成長確率。 */
    const rookieOK=bucket!=='CPBL'||!(S.stats.NPB||S.stats.MLB||S.stats.MINOR);
    if(S.stats[bucket].yr===1&&rookieOK&&st.d>=4){
      const rkP = clamp(30 + (st.d - 4) * 15, 30, 95);
      if(draw('ROOKIE',rkP)) h.push(`${y} ${lgN}新人王`);
    }

    /* 3. 投手個人タイトル。 */
    if(S.pos==='P'){
      const aw='最優秀防御率投手賞';
      if(isSP() && st.era <= th.era[0] && st.IP >= th.g){ 
        const god = st.era <= th.era[1] && st.IP >= 150;
        const p = god ? 100 : clamp(30 + Math.round((th.era[0] - st.era) * 35 + (st.IP - th.g) * 0.4), 30, 95);
        if(draw('LEGACY_BEST_PITCHER',p)) h.push(`${y} ${lgN}${aw}`);
      }
      if(S.role==='CL' && st.SV >= th.sv[0]){
        const god = st.SV >= th.sv[1];
        const p = god ? 100 : clamp(28 + (st.SV - th.sv[0]) * 5, 28, 95);
        if(draw('PITCH_SAVES',p)) h.push(`${y} ${lgN}最多セーブ投手賞`);
      }
      if(S.role==='MR' && (st.HLD||0) >= th.hld[0]){
        const god = (st.HLD||0) >= th.hld[1];
        const p = god ? 100 : clamp(28 + ((st.HLD||0) - th.hld[0]) * 4, 28, 95);
        if(draw('PITCH_RELIEF',p)) h.push(`${y} ${lgN}最優秀中継ぎ投手賞`);
      }
      if(st.SO >= th.so[0]){
        const god = st.SO >= th.so[1];
        const p = god ? 100 : clamp(25 + Math.round((st.SO - th.so[0]) * 1.2), 25, 95);
        if(draw('PITCH_STRIKEOUTS',p)) h.push(`${y} ${lgN}最多三振奪取投手賞`);
      }
    }
    /* 4. 野手個人タイトル。 */
    else{
      if(st.PA >= 350 && st.avg >= th.avg[0]){
        const god = st.avg >= th.avg[1];
        const p = god ? 100 : clamp(25 + Math.floor((st.avg - th.avg[0]) / 0.005) * 6, 25, 95);
        if(draw('BATTING_AVG',p)) h.push(`${y} ${lgN}首位打者`);
      }
      if(st.PA >= 300 && st.HR >= th.hr[0]){
        const god = st.HR >= th.hr[1];
        const p = god ? 100 : clamp(25 + (st.HR - th.hr[0]) * 5, 25, 95);
        if(draw('BATTING_HR',p)) h.push(`${y} ${lgN}本塁打王`);
      }
      if(st.PA >= 300 && st.SB >= 25){ // SB不隨試合数放大、全リーグ標準一致。
        const god = st.SB >= 45;
        const p = god ? 100 : clamp(25 + (st.SB - 25) * 4, 25, 95);
        if(draw('BATTING_SB',p)) h.push(`${y} ${lgN}盗塁王`);
      }
      if(st.PA >= 300 && st.RBI >= th.rbi[0]){
        const god = st.RBI >= th.rbi[1];
        const p = god ? 100 : clamp(25 + (st.RBI - th.rbi[0]) * 2, 25, 95);
        if(draw('BATTING_RBI',p)) h.push(`${y} ${lgN}打点王`);
      }
      const obp = st.PA > 0 ? (st.H + st.BB) / st.PA : 0;
      if(st.PA >= 350 && obp >= th.obp[0]){
        const god = obp >= th.obp[1];
        const p = god ? 100 : clamp(25 + Math.floor((obp - th.obp[0]) / 0.005) * 5, 25, 95);
        if(draw('BATTING_OBP',p)) h.push(`${y} ${lgN}最高出塁率`);
      }
      const def1 = st.DEF || 0;
      if(S.dpos !== 'DH' && S.seasonFactor >= 0.7){
        if(def1 >= 6){
          const pGlove = clamp(38 + (def1 - 6) * 5, 38, 95);
          if(draw('GOLD_GLOVE',pGlove)) h.push(`${y} ${lgN}ゴールデングラブ賞`);
        }
        if(def1 >= 11){
          const pDef = clamp(30 + (def1 - 11) * 6, 30, 95);
          if(draw('DEFENSE_BEST',pDef)) h.push(`${y} ${lgN}年間最優秀守備選手`);
        }
      }
    }

    /* 5. 年度 MVP（最大栄誉）。 */
    const mvpQual = S.pos==='P'
      ? (isSP() ? st.IP >= 120 : st.G >= 45)
      : st.PA >= LV[S.lv].g * 3.4;

    if(st.d >= 6 && mvpQual && S.seasonFactor >= 0.9){
      const god = st.d >= 15;
      const baseMult = (S.pos === 'P' && S.role !== 'SP') ? 5 : 12; 
      const pMVP = god ? 100 : clamp(baseMult + (st.d - 6) * 11, baseMult, 95);
      if(draw('MVP',pMVP)) h.push(`${y} ${lgN}年間MVP`);
    }

    // All original qualified slots have already consumed precisely their native draws.
    // New awards are derived from this transaction's frozen input, never old strings.
    const d2=prepareD2AwardDecisions(tx,SEED);
    for(const decision of d2.decisions)if(decision.awarded){
      const text=`${y} ${lgN}${getAwardDefinition(decision.awardId).displayName}`;
      if(!h.includes(text))h.push(text);
    }
    if(d2.triple){
      S.tripleCrownHistory??={};S.tripleCrownHistory.pitcherTC??=[];
      const history=S.tripleCrownHistory.pitcherTC,newLeague=!history.some(r=>r.bucket===bucket);
      if(!history.some(r=>r.year===y&&r.bucket===bucket))history.push({year:y,bucket,league:lgN});
      if(!h.includes(`${y} ${lgN}年間MVP`))h.push(`${y} ${lgN}年間MVP`);
      if(!S.traits.pitcherTC||newLeague){S.traits.pitcherTC=true;card('gold','隠し特性解放：'+displayTrait('pitcherTC'),TRAIT_TEXT.pitcherTC);}
    }
    const sawamura=d2.decisions.some(d=>d.awardId==='PITCH_SAWAMURA'&&d.awarded);
    // Preserve the original MVP draw above, even when either triple crown guarantees MVP.
    for(const key of awardTraitUnlocks(S,bucket,lgN))card('gold','隠し特性解放：'+displayTrait(key),TRAIT_TEXT[key]);
    /* 6. 後続の受賞で特性を発動作。 */
    const added=h.filter(x=>x.startsWith(String(y)));
    if(added.length){ card('gold','年間賞',added.map(x=>x.slice(5)).join('｜'));
      if(S.traits.yips){ removeTrait('yips','イップス'); card('good','イップス克服','大舞台で結果を残したことで迷いが消え、<b class="hl">イップスを克服した</b>。'); }
      // Exact additions only: preserve existing legacy/out-of-scope effects without guessing new award names.
      if(S.traits.glass&&!S.traits.phoenix){ const big=hasCurrentAwardEffect(S,'phoenix',bucket)||sawamura;
        if(big){ S.traits.phoenix=true; removeTrait('glass','スペランカー');
          S.pool+=8;
          card('gold','隠し特性解放：復活','大けがを乗り越え、以前より強くなって帰ってきた――<b class="hl">スペランカーのペナルティを解除。故障率が通常に戻り、大量の能力ポイントを獲得</b>。'); } }
    }
    const writes=[];
    for(const key of ['honors','removed','pool','tripleCrownHistory','oldGhostPending']){
      if(JSON.stringify(before[key])!==JSON.stringify(S[key]))writes.push({path:[key],before:before[key],after:S[key]});
    }
    for(const key of Object.keys(S.traits))if(!Object.is(before.traits[key],S.traits[key]))writes.push({path:['traits',key],before:before.traits[key],after:S.traits[key]});
    if(before.stats[bucket].AS!==S.stats[bucket].AS)writes.push({path:['stats',bucket,'AS'],before:before.stats[bucket].AS,after:S.stats[bucket].AS});
    return {cards,removedTraits,writes,renderIndex:0};
  }
  return {awards};
}
