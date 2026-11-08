// Professional season (OOP plan §2nn): the season stat line with its safety limits, event, effort and one-tool
// adjustments, the season card and log row, the iron-man and one-tool traits, then the resumable continuation (awards,
// salary evaluation, championship snapshot, TJ accrual) and the post-season pipeline. The bodies are the former game.js
// proSeason/resumeProfessionalSeason/runSeasonPipeline/portionOf; the per-state continuation map moved with them. The
// career state is read at the start of proSeason and resumeProfessionalSeason through getState. LV and clamp are passed by
// reference; every game.js function, the event/market/championship policies and the R bridge are injected late-binding
// lambdas, so E2E hooks that rebind accLevelStat, tjAccrue, awards, the pipeline steps, nextStep, card, board and R still
// reach these bodies. The policy imports cannot be rebound; their lambdas only keep the wiring uniform.
export class ProfessionalSeason {
  #rules;
  constructor(deps){this.#rules=professionalSeasonRules(deps);}
  proSeason(){return this.#rules.proSeason();}
}

function professionalSeasonRules({getState,LV,clamp,simSeason,applyEventSeason,consumeEventSeason,normalizeEventSeason,bucketOf,accStat,accLevelStat,card,statLine,isSP,toolGap,careerAllStars,traitCard,removeTrait,board,awards,classifyMarketInjury,recordSalaryEvaluation,captureSeasonChampionship,tjAccrue,tjGamble,demotionAudit,tradeCheck,maybeIntl,nextStep,resumeSeasonEnd,restorePendingChoice,seasonRng:{R}}){
  const seasonContinuations=new WeakMap();
  function portionOf(st,r){
    const p={...st};
    ['G','PA','AB','H','HR','RBI','SB','BB','W','L','SV','SO','ER'].forEach(k=>p[k]=Math.round(st[k]*r));
    p.IP=+(st.IP*r).toFixed(1);
    p.avg=p.AB>0?p.H/p.AB:0; p.era=p.IP>0?p.ER*9/p.IP:0;
    return p;
  }
  function proSeason(){
    const S=getState();
   const pending=seasonContinuations.get(S);
   if(pending?.year===S.year)return resumeProfessionalSeason(pending);
   const continuation={state:S,year:S.year,phase:'BUILDING'};seasonContinuations.set(S,continuation);
   const st=simSeason(S.lv); S.lastSt=st; S.lastD=st.d;
    
    /* 1. リーグ最大出場数の安全制限。 */
    const maxG = (LV[S.lv]&&LV[S.lv].g)||162;
    st.G = Math.min(st.G, maxG);

    /* 2. 投手進出階成績合理性防呆。 */
    if(S.pos==='P'){ 
      st.G = Math.max(st.G, Math.ceil(st.IP/9)); // 投球回から最低登板数を保証。
      st.SV = Math.min(st.SV || 0, st.G); // セーブ数は登板数を超えない。
      st.HLD = Math.min(st.HLD || 0, st.G - (st.SV || 0)); // ホールド数は登板数からセーブ数を引いた値を超えない。
      
      // 勝敗数の合計が登板数を超えたら同比率で縮小。
      if ((st.W + st.L) > st.G) {
        const ratio = st.G / (st.W + st.L);
        st.W = Math.floor(st.W * ratio);
        st.L = Math.floor(st.L * ratio);
      }
    } else {
      /* 野手防呆：打席数は出場数以上。 */
      st.PA = Math.max(st.PA, st.G); 
    }
    const eventPoints=(S.pendStat||0)*S.seasonFactor,eventOptions={pos:S.pos,role:S.role,maxGames:maxG};
    if(eventPoints!==0)Object.assign(st,applyEventSeason(st,{...eventOptions,points:S.pendStat,seasonFactor:S.seasonFactor}));
    consumeEventSeason(S);
    /* 投球強度による成績補正。 */
    if(S.pos==='P'&&S.seasonFactor>0){ const em={'全力投球':1,'通常投球':0,'省エネ投球':-1}[S.effort]||0;
      if(em!==0){ st.d+=em; st.era=clamp(st.era-em*0.25,1.40,9.90); st.ER=Math.round(st.era*st.IP/9);
        st.SO=Math.round(st.SO*(1+em*0.06)); } }
    if(S.traits.onetool&&S.seasonFactor>0){ /* ユーティリティー：得意能力によって代打・代走・守備固めの出試合機会を追加(ボーナス、半減ではなく加算)。 */
      const boost=1.25; /* 得意能力による追加出試合機会。 */
      ['G','PA','AB'].forEach(k=>{ if(typeof st[k]==='number')st[k]=Math.round(st[k]*boost); });
      /* 累積型成績隨打席等比小幅補正。 */
      ['H','HR','RBI','SB','BB'].forEach(k=>{ if(typeof st[k]==='number')st[k]=Math.round(st[k]*boost); });
      st.avg=st.AB>0?st.H/st.AB:0; }
    if(eventPoints!==0)Object.assign(st,normalizeEventSeason(st,eventOptions));
    const levelKey=S.lv,bucket=bucketOf(levelKey); accStat(bucket,st); accLevelStat(levelKey,st);
    if(S.seasonFactor===0){ card('bad','シーズン成績','（今季はけがで全休）'); }
    else if(S.tradeFrom){ /* シーズン途中の移籍：移籍前後の2区分を表示+合計。 */
      const r=0.35+R()*0.3, p1=portionOf(st,r), p2=portionOf(st,1-r);
      card('','シーズン成績（シーズン途中の移籍）',
        `<span class="tag">${S.tradeFrom}</span><div class="statline">${statLine(p1)}</div>`+
        `<span class="tag">${S.teamName()}</span><div class="statline">${statLine(p2)}</div>`+
        `<span class="tag">合計</span><div class="statline">${statLine(st)}</div>`);
    }
    else card('','シーズン成績',`<span class="tag">${S.teamName()}${S.dpos?'｜'+S.dpos:''}</span><div class="statline">${statLine(st)}</div>`);
    /* 不調整年・キャリアハイ年の説明カード。 */
    if(st.form===-1){
      card('bad','深刻なスランプ',`体調は万全だったが、思うような成績を残せず、長いスランプに苦しんだ。`);
    }else if(st.form===1){
      if(S.pos==='P') card('gold','キャリアハイ','指先の感覚が研ぎ澄まされ、投じる球は思いどおりに変化した。打者のバットは空を切り、ボールは捕手のミットへ吸い込まれた。');
      else card('gold','キャリアハイ','ボールが大きく、ゆっくり見えた。芯で捉えた打球は次々とスタンドへ消えていった。');
    }
    const isInj = S.seasonFactor <= 0.45; /* 重傷による全休年か判定。 */
    S.log.push({y:S.year,age:S.age,tm:S.tradeFrom?`${S.tradeFrom}→${S.teamName()}`:S.teamName(),p:S.dpos||'',line:S.seasonFactor===0?'怪我でシーズン全休':statLine(st), inj: isInj, st: st});
    S.tradeFrom=null;
    /* 鐵人累計。 */
    const healthy=S.seasonFactor>=0.95&&(S.pos==='P'?(isSP()?st.IP>=120:st.G>=42):st.G>=LV[S.lv].g*0.8);
    if(healthy){ S.ironStreak++;
      if(S.ironStreak>=5&&!S.traits.iron){ S.traits.iron=true;
        card('gold','隠し特性解放：鉄人','5年連続でほぼ全試合出場！ 鉄の体を手に入れ、今後は毎季の故障率が<b class="hl">10%以下</b>となる。'); } }
    else if(S.seasonFactor<0.95)S.ironStreak=0;
    /* 一芸特化：まずレギュラー基準を確認し、未達時だけ突出した能力の有無を見る。 */
    if(S.pos!=='P'){ const tg=toolGap();
      /* 主力判定：当該シーズンにリーグ試合数の60%以上出場した選手はレギュラー以上とし、ユーティリティー判定しない。 */
      const isRegular = S.seasonFactor>0 && st.G >= LV[S.lv].g*0.60;
      if(!S.traits.onetool && !isRegular && tg.gap>=22 && tg.val>=58 && careerAllStars()<4){ S.traits.onetool=true;
        const wasBefore=S.removed.includes('一芸特化');
        S.removed=S.removed.filter(x=>x!=='一芸特化'); /* 再発動作時：取り消し線の記録を消す。 */
        const role=tg.role;
        S.toolRole=role;
        if(wasBefore||S.age>=33)
          traitCard('onetool','一芸特化',`衰えで他の武器は失った。それでも<b class="hl">${role}</b>だけは健在。首脳陣はベンチの切り札として、勝負どころであなたを送り出す。`,'bad');
        else
          traitCard('onetool','一芸特化',`突出した一つの武器を買われ、首脳陣は重要な場面に役割を絞って起用することを決めた。<b class="hl">${role}</b>として出場機会は限られるが、その強みは他の追随を許さない。`,'bad'); }
      else if(S.traits.onetool && (tg.gap<18 || (S.seasonFactor>0 && st.G>=LV[S.lv].g*0.60))){ /* 能力を回復 または レギュラーへ復帰 → 解除。 */
        removeTrait('onetool','一芸特化'); S.toolRole=null;
        card('good','一芸特化を返上','ついに先発メンバーへ定着。ベンチの切り札だけではないことを結果で証明した――<b class="hl">「一芸特化」を解除</b>。もう立派なレギュラーや。'); board(1); } }
    Object.assign(continuation,{bucket,st,phase:'AWARDS'});
    return resumeProfessionalSeason(continuation);
  }
  function resumeProfessionalSeason(entry){
    const S=getState();
    if(entry.state!==S||entry.year!==S.year)throw new Error('STALE_SEASON_CONTINUATION');
    if(entry.phase==='BUILDING')throw new Error('PRO_SEASON_AMBIGUOUS');
    if(entry.phase==='AWARDS'){awards(entry.bucket,entry.st);entry.phase='EVALUATION';}
    if(entry.phase==='EVALUATION'){
      S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});
      recordSalaryEvaluation(entry.st);entry.phase='CHAMPIONSHIP';
    }
    if(entry.phase==='CHAMPIONSHIP'){captureSeasonChampionship(S);entry.phase='TJ_ACCRUAL';}
    if(entry.phase==='TJ_ACCRUAL'){if(S.pos==='P'&&S.seasonFactor>0)tjAccrue();entry.phase='PIPELINE_PREPARED';}
    if(entry.phase==='PIPELINE_PREPARED'){
      entry.phase='PIPELINE_STARTED';runSeasonPipeline(0);entry.phase='PIPELINE_WAIT';return;
    }
    if(resumeSeasonEnd())return;
    if(restorePendingChoice())return;
    throw new Error('SEASON_CONTINUATION_AMBIGUOUS');
  }
  function runSeasonPipeline(step){
    const steps=['TJ_GAMBLE','DEMOTION_AUDIT','TRADE_CHECK','INTL_POST'];
    if(step>=steps.length)return nextStep();
    const cont=()=>runSeasonPipeline(step+1);
    switch(steps[step]){
      case 'TJ_GAMBLE':return tjGamble(cont);
      case 'DEMOTION_AUDIT':return demotionAudit(cont);
      case 'TRADE_CHECK':return tradeCheck(cont);
      case 'INTL_POST':return maybeIntl(cont);
    }
  }
  return {proSeason};
}
