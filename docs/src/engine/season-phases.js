// Pre-season and mid-season year steps (OOP plan §2mm): age-limit exit, decline, rehabilitation year, training dice,
// the genius unlock, the pitcher's effort plan and the veteran's spring choice; then the mid-season events, health
// check and season dispatch. The bodies are the former game.js phasePre/phaseMid. The career state is read at the start
// of each method and again in every deferred handler through getState. POS_AB, ABL, LV and clamp are passed by
// reference; every game.js function, declineForSeason and the R/ri/chance RNG bridge are injected late-binding lambdas,
// so E2E hooks that rebind allocUI, nextStep, R and the other names still reach these bodies.
export class SeasonPhases {
  #rules;
  constructor(deps){this.#rules=seasonPhaseRules(deps);}
  phasePre(){return this.#rules.phasePre();}
  phaseMid(){return this.#rules.phaseMid();}
}

function seasonPhaseRules({getState,POS_AB,ABL,LV,clamp,board,card,choose,buyoutRemaining,reportFlowOutcome,declineForSeason,checkGoldclothSeason,stageLabel,addAb,dposReview,allocUI,nextStep,tjCap,ovr,signTo,daibaFarewell,loveEvent,drawEvents,rollInjury,proSeason,amateurSeason,rng:{R,ri,chance}}){
  function phasePre(){
    const S=getState();
    board(0); S.tmpInj=0; S.seasonFactor=1; S.skipMid=false; S._majorInjuryThisSeason=false; S.prevD=S.lastD||0; S.lastD=0; /* 先保持上季 d 供投手定位判定。 */
    if(S.age>=48){ buyoutRemaining(1); reportFlowOutcome({kind:'PRESEASON_AGE_LIMIT_RETIRED',reason:'体はもう限界。'+S.year+' 年の春季キャンプ後に引退を発表した。'}); return; }
    const declAge=S.age-(S.traits.disc?2:0); /* 自律狂：衰えの開始を2年遅らせる。 */
    if(declAge>=32){ const dec=declineForSeason(S,declAge>=35?5+(declAge-35):2);
      POS_AB[S.pos].forEach(k=>S.ab[k]=clamp(S.ab[k]-dec,1,80));
      card('bad','寄る年波には勝てない',`${declAge>=35?'第2段階（年々加速）':'第1段階'}の衰え：全能力<b class="dn">−${dec}</b>${S.traits.disc?'（自律の鬼：キャリアの衰えが2年遅延）':''}。これまでどおり追加トレーニングはできますが、体が元に戻ることはありません。`); board(0); }
    if(S.rehab>0){ S.rehab--; S.skipMid=true; S.seasonFactor=0;
      if(S.stage==='PRO'&&S.lv==='NPB1')checkGoldclothSeason();
      card('bad','リハビリ年',`大けがが治らず、今季は<b class="dn">全休確定</b>。リハビリ施設で過ごすしかない。（サイコロは2個に減少）`);
      const dummySt = {G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,avg:0,era:0,WHIP:0,DEF:0};
      S.log.push({y:S.year,age:S.age,tm:S.stage==='PRO'?S.teamName():(S.team||stageLabel()),line:'リハビリ年・シーズン全休', inj: true, st: S.stage==='PRO'?dummySt:null}); }
    let afterAsk=()=>{const S=getState();
      let n=S.skipMid?2:(()=>{const r=R();return r<0.35?3:r<0.75?4:r<0.95?5:6;})();
      if(S.traits.distract&&!S.skipMid)n=Math.max(2,n-1); /* 私生活多忙。 */
      if(S.traits.academy&&!S.skipMid&&chance(35))n++; /* 理論派：期望値略升。 */
      
      const dice=[]; let newSix=0;
      for(let i=0;i<n;i++){ const v=S.traits.genius?ri(4,6):S.traits.late?ri(3,6):ri(1,6); dice.push(v);
        if(v===6&&S.age<22&&!S.traits.genius){S.six++;newSix++;} }
        
      let msg=`自主トレで <b class="hl">${n}</b> 個のサイコロを振った。`;
      if(newSix&&!S.traits.genius)msg+=` 最高値「6」の累計：<b class="hl">${S.six}/5</b>回。`;
      
      /* 小細工無用：自動でダイスを振って能力へ加算し、上限超済み分は成績ボーナスへ回す。 */
      if(S.traits.combo && !S.skipMid && (S.comboKey||S.samePickKey)) {
        const ck = S.comboKey||S.samePickKey; /* 永遠用解鎖當下鎖定的能力。 */
        const cv = S.traits.genius?ri(4,6):S.traits.late?ri(3,6):ri(1,6);
        const gained = addAb(ck, cv);
        const overflow = S.lastOverflow || 0;

        if(overflow > 0) S.pendStat = (S.pendStat || 0) + overflow;

        let cmsg = `<br>小細工無用が発動：自動で<b class="hl">${cv}</b>ポイントを<b class="hl">${ABL[ck]}</b>へ投入`;
        if(gained > 0) cmsg += `（能力<b class="up">+${gained}</b>）`;
        if(overflow > 0) cmsg += `（頂点到達：余った ${overflow} ポイントを<b class="up">今季の成績ボーナス</b>へ変換）`;
        if(gained===0 && overflow===0) cmsg += `（能力ポイントは加算されたが、1段階上げるには足りなかった）`;
        msg += cmsg + `。`;
      }
      
      card('','シーズン前特訓',msg);
      if(S.six>=5&&!S.traits.genius&&S.age<22){ S.traits.genius=true;
        {
        const exDef=S.pos==='C'?['rng','fld','arm','cat']:[];
        const cands=POS_AB[S.pos].filter(k=>S.ab[k]<70&&!exDef.includes(k));
        for(let i=cands.length-1;i>0;i--){const j=Math.floor(R()*(i+1));const t=cands[i];cands[i]=cands[j];cands[j]=t;}
        const boost=cands.slice(0,2), bl=[];
        boost.forEach(k=>{ S.pot[k]=Math.min(80,(S.pot[k]||62)+10);
          S.ab[k]=clamp(S.ab[k]+5,1,80); bl.push(`${ABL[k]} <b class="up">+5</b>（潜在能力上限 +10 → ${S.pot[k]}）`); });
        card('gold','隠し特性解放：天才','22歳までに最高値を5回出した！ 今後、すべてのトレーニングダイスが<b class="hl">永久に4以上</b>となり、イベントカードの成功率が <b class="hl">70%</b>に上昇。'+(bl.length?`才能が覚醒し、潜在能力が再評価された：${bl.join('、')}。`:'')+'才能は隠せない。');
        board(1);
      } }
      choose('',[{t:`▸ トレーニング成果を割り振る（サイコロ${dice.length}個）`,main:true,f:()=>dposReview(()=>allocUI({dice},'能力の項目を選んで、サイコロを割り当てます。能力値が高くなるほど、成長に必要なポイントが増えます。潜在能力を超える場合は、さらにポイントが必要です。能力値の上限は80です。',()=>nextStep()))}]);
    };
    /* 投手の開幕前：投球強度(持久力+TJ ゲージ)。 */
    const preAsk=afterAsk;
    if(S.pos==='P'&&S.stage==='PRO'&&!S.skipMid){
      afterAsk=()=>{const S=getState();
        choose(`開幕前の投球プラン（腕の状態：${(function(){const r=S.tj/tjCap();return S.rehab>0?'リハビリ中':r>=0.85?'肘に鈍い痛み':r>=0.6?'腕にやや疲労':r>=0.35?'まずまず':'腕が軽い';})()}）`,[
          {t:'全力投球',warn:true,s:'成績重視｜腕への負担：最大（TJゲージ ×1.25）',f:()=>{const S=getState();S.effort='全力投球';preAsk();}},
          {t:'通常投球',main:true,s:'標準強度｜TJゲージ増加：通常',f:()=>{const S=getState();S.effort='通常投球';preAsk();}},
          {t:'省エネ投球',s:'成績は控えめ｜腕を温存（TJゲージ ×0.65）',f:()=>{const S=getState();S.effort='省エネ投球';preAsk();}}]);
      };
    }
    if(S.stage==='PRO'&&S.age>=36&&S.rehab===0){
      const oldOpts=[{t:'もう一年挑戦する',main:true,f:afterAsk}];
      /* 海外所属のベテラン(衰退期)：現契約を破棄、台湾球界へ復帰;ovr<30(実力不足)対象外。 */
      if(['MLB','MiLB','KBO','CPBL'].includes(S.org)&&ovr()>=LV.NPB2.min){
        oldOpts.push({t:'契約を断り、日本球界へ戻る',s:'全盛期は過ぎた。それでも最後のプレーを故郷のファンに見せたい',f:()=>{const S=getState();
          const returnLv=ovr()>=LV.NPB1.min?'NPB1':'NPB2';
          buyoutRemaining();signTo('NPB',returnLv);card('good','日本球界復帰',`海外で積み上げた経験を携え、<b class="hl">${S.teamName()}</b>で日本球界へ復帰した。`);reportFlowOutcome({kind:'PRESEASON_RETURNED_NPB'});
        }});
      }
      oldOpts.push({t:'引退記者会見を開く',warn:true,s:'現役を引退する',f:()=>{const S=getState();buyoutRemaining();daibaFarewell(()=>reportFlowOutcome({kind:'PRESEASON_RETIRED',reason:'功成り名を遂げ、 '+S.year+' 年に現役引退を発表。'}));}});
      choose('今年も春季キャンプを迎えたが、体は明らかに衰えている',oldOpts);
      return;
    }
    afterAsk();
  }
  function phaseMid(){
    const S=getState();
    board(1);
    if(S.skipMid){ S.ironStreak=0; nextStep(); return; }
    const nEv=S.stage==='PRO'?3:2;
    loveEvent(()=>drawEvents(nEv,()=>{
      choose('',[{t:'▸ シーズン半ばの健康診断',main:true,f:()=>{ rollInjury();
        choose('',[{t:'▸ 今季の成績を見る',main:true,f:()=>{const S=getState();
          if(S.stage==='PRO')proSeason();
          else amateurSeason(); }}]); }}]);
    }));
  }
  return {phasePre,phaseMid};
}
