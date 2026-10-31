// Season trade and demotion checks, the demotion route, buyout, offer routes and the FA market (OOP plan §2aa).
// The career state is read through getState; closures that run after the render read it again, so they see the live state.
// LV and careerSession are passed by reference. faMarket is implemented here as faMarketRule while its bare name stays an
// injected late-binding lambda: E2E hooks rebind the game.js name, so faFlow must keep going through game.js to reach it.
// applyKboForeignPackageCap is injected for the same reason.
import { calculateScheduledBuyout, contractNeedsRenewal } from './contract-policy.js';
import { crossOfferTitle, crossOfferType, demotionChoiceText, findDemotionTarget, isBelowActiveMinimum } from './career-policy.js';
import { convertRatingBetweenLevels, roundToTenThousandYen } from './salary-promotion-policy.js';
import { injurySalaryMultiplier, isRecentStar } from './injury-market-policy.js';
import { baseFaOfferCount, buildFaOffer, buildMarketContext, competitionMultiplier, contractTypeMultiplier, generateBidJitters } from './market-policy.js';
import { createIncentiveTerms } from './incentive-policy.js';
import { playerMarketCategory, rankTeamsByDemand, teamDemandLabel, teamDemandMultiplier } from './team-demand-policy.js';
import { contractTypeLabel } from '../ui/contract-labels.js';

export class CareerMovement {
  #rules;
  constructor(deps){this.#rules=careerMovementRules(deps);}
  demotionAudit(cont){return this.#rules.demotionAudit(cont);}
  tradeCheck(cont){return this.#rules.tradeCheck(cont);}
  buyoutRemaining(rate){return this.#rules.buyoutRemaining(rate);}
  handleDemotion(o,path,idx){return this.#rules.handleDemotion(o,path,idx);}
  retireBelowActiveMinimum(){return this.#rules.retireBelowActiveMinimum();}
  daibaFarewell(cont){return this.#rules.daibaFarewell(cont);}
  overseasOffer(org,lv,label,o,minD,finish){return this.#rules.overseasOffer(org,lv,label,o,minD,finish);}
  crossOffers(o){return this.#rules.crossOffers(o);}
  faFlow(o){return this.#rules.faFlow(o);}
  faMarket(o,d){return this.#rules.faMarket(o,d);}
  outOfOrg(o){return this.#rules.outOfOrg(o);}
}

function careerMovementRules({getState,LV,careerSession,faMarket,applyKboForeignPackageCap,salaryCandidate,salaryFor,fixedContract,signTo,saveSalaryDecision,renewAndAdvance,arbitrationFlow,kboPreviousPackage,currentMarketRating,contractStageFor,serviceYearsFor,migrateSalaryV130State,migrateSalaryV140State,applyDemotionSalary,ageGateJP,doTradeExec,dpMult,ovr,fmtMoney,card,board,choose,escapeHTML,teamRec,listByOrg,pickRecord,removeTrait,traitCard,reportFlowOutcome,rng:{R,ri,chance}}){
  function demotionAudit(cont){
    const S=getState();
    if(!S.demotionRefused){ cont(); return; }
    S.demotionRefused=false;
    /* 契約額に見合う成績：d >= 契約の年俸係数に必要な水準(mult 高額ほど基準も上げる)。 */
    const need=Math.round((S.ct&&S.ct.contractMultiplier?S.ct.contractMultiplier:1)*2)-1; /* mult1→1、 mult1.2→1.4→1、 mult2→3 */
    if((S.lastD||0)>=need){
      if(S.traits.cancer){ removeTrait('cancer','チームの癌');
        card('good','結果で黙らせる','シーズンを通した活躍で周囲を黙らせた――<b class="hl">「チームの癌」を返上</b>。降格を拒否した判断が正しかったと証明した。'); board(1); }
      else card('good','自分の価値を維持する','あなたはこの契約にふさわしい人物であることを証明しました。');
    } else {
      if(!S.traits.thief){ S.traits.thief=true;
        card('bad','隠し特性解放：給料泥棒','降格を拒否したのに成績は上がらない。ファンから「給料泥棒」と呼ばれ始めた――<b class="dn">イベントカード失敗率が永久に+10%</b>。この悪評は引退まで消えない。'); board(1); }
      else card('bad','給料泥棒','また無駄な一年だった。スタンドのブーイングはさらに大きくなった。');
    }
    cont();
  }
  function tradeCheck(cont){
    const S=getState();
    if(S.stage!=='PRO'||!LV[S.lv].top||S.seasonFactor<=0){ cont(); return; }
    const star = ovr()>=LV[S.lv].par+4; /* スター：総合≥リーグ平均+4。 */
    let p=15+ (S.tradeHeat||0); /* 基礎 15% + 累積怨氣。 */
    if(S.traits.cancer)p+=25; if(S.traits.ambience)p+=20;
    if(!chance(p)){ cont(); return; }
    /* 一人一城：神主牌/◯◯先生是城市的象徵、球団決して不放人(非賣品)。 */
    if(S.traits.franchise||S.traits.mrteam){
      card('info','非売品',`他球団が魅力的な交換要員をそろえて打診したが、フロントは会議すら開かず拒否――<b class="hl">「彼はこの街の象徴。非売品だ」</b>`);
      board(1); cont(); return;
    }
    if(star){
      /* スター：否決權詢問(同旧設定)。 */
      if(S.traits.cancer){ doTradeExec(); card('bad','厄介払いトレード','球団はロッカールームの空気に耐えかね、問答無用で放出した。'); board(1); cont(); return; }
      choose('トレード期限直前、他球団からオファー。球団が拒否権を行使するか確認してきた',[
        {t:'同意してうなずき、環境を変える',main:true,f:()=>{ doTradeExec(); card('info','移籍する','荷物をまとめて新しい街へ向かいます。'); board(1); cont(); }},
        {t:'拒否権を行使して残留する',warn:true,s:'今後2年間は優勝確率がやや低下し、次回契約の年俸が−15%',f:()=>{const S=getState();
          S.tradeRefuse=2; card('info','トレード拒否',`トレード拒否権を行使した。残留を選んだ代償に球団の再建計画は狂い、短期的な戦力と次回契約には悪影響が出る。それでも、このユニフォームを着続ける。`); board(1); cont(); }}]);
      return;
    }
    /* 非スター：交易傳言、可抱怨または沉默。 */
    choose('トレードの噂：メディアが「放出の可能性あり」と報道',[
      {t:'メディアの前で不満をぶちまける',warn:true,s:'今度は取引される可能性が高まります',f:()=>{const S=getState();
        S.complainCount=(S.complainCount||0)+1;
        if(S.complainCount>=2&&!S.traits.ambience){ S.traits.ambience=true;
          card('bad','隠し特性解放：問題児','またメディアに不満をぶちまけた。フロントも「抱えておくには危険すぎる」と判断――<b class="dn">今後のトレード発生率が永久に上昇</b>。'); board(1); }
        if(chance(60)){ doTradeExec(); card('bad','噂が現実に',`不満発言が一面を飾り、球団はそのまま放出を決断。新天地で結果を出すしかない。`); board(1); }
        else card('info','騒いだだけで何もなし','苦情は苦情、この取引は結局実現しませんでした。あなたはまだ元のチームにいますが、雰囲気は少し緊張しています。');
        cont(); }},
      {t:'黙ってプレーに集中する',main:true,s:'トレード確率は変わらない',f:()=>{
        if(chance(35)){ doTradeExec(); card('info','取引は完了しました',`あなたの沈黙にもかかわらず、チームは取引を完了しました。 '`); board(1); }
        else card('info','泊まった','噂はあくまで噂です。新しい野球シーズンでも、同じジャージを着ます。');
        cont(); }}]);
  }
  function buyoutRemaining(rate){ /* 残契約の支払いは選手都合の解除で70%、球団都合なら100%。 */
    const S=getState();
    S.transferSalarySnapshot={annualSalary:S.currentSalary||S.ct?.annualSchedule?.at(-1)?.amount||0,contract:S.ct,org:S.org,level:S.lv,teamId:S.orgTeamId};
    rate=rate||0.7;
    if(!S.ct||(!LV[S.lv].top&&rate<1))return 0; /* 球団都合の解除は下位階級でも保証する。 */
    const result=calculateScheduledBuyout(S.ct,rate);
    if(result.buyoutAmount>0){
      S.careerBuyout=(S.careerBuyout||0)+result.buyoutAmount;
      S.careerEarnings+=result.buyoutAmount;
      card('gold',rate>=1?'契約金全額支払い':'契約買い取り',`契約残年数：<b class="hl">${result.unpaidSchedule.length}年</b><br>残契約総額：<b class="hl">${fmtMoney(result.remainingValue)}</b><br>買い取り率：<b class="hl">${Math.round(rate*100)}%</b><br>買い取り支払額：<b class="hl">${fmtMoney(result.buyoutAmount)}</b>`);
    }
    S.ct=null;
    S.currentSalary=0;
    return result.buyoutAmount;
  }
  function handleDemotion(o,path,idx){
    const S=getState();
    if((S.lv==='CPBL1'||S.lv==='NPB1'||S.lv==='MLB')&&(S.lastD||0)<=-6&&!S.traits.yips&&S.seasonFactor>=0.5){
      traitCard('yips','イップス',`体にけがはなかったが、グラウンドに立つと昨季の失敗がよみがえる――。<b class="dn">評価が一時的に−3となり、再昇格または年間表彰まで解除されない。</b>`,'bad'); }
    const targetLevel=findDemotionTarget(path,idx,o,LV);
    const acceptText=demotionChoiceText(targetLevel,LV);
    const doDemote=()=>{const S=getState();
      /* 同じ組織内で条件を満たす階級を探す。 */
      if(targetLevel){
        /* 海外組織で降格時、アジア球団も同時にオファー。 */
        const alts=[];
        if(S.org==='MiLB'){
          if(o>=LV.NPB1.min&&chance(Math.round(60*ageGateJP()))){
            const candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:'NPB1',contractMult:1}),annualSalary=candidate.annualSalary;
            alts.push({t:'NPB一軍への移籍',s:`NPB移籍契約｜年俸${fmtMoney(annualSalary)}`,f:()=>{buyoutRemaining();signTo('NPB','NPB1',undefined,undefined,undefined,undefined,{annualSalary,candidate});reportFlowOutcome({kind:'DEMOTION_TRANSFER_NPB1'});}});
          }else if(o>=LV.NPB2.min&&chance(50)){
            const candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:'NPB2',contractMult:1}),annualSalary=candidate.annualSalary;
            alts.push({t:'日本の二軍（支配下）へ移籍',s:`NPB二軍（支配下）契約｜年俸${fmtMoney(annualSalary)}`,f:()=>{buyoutRemaining();signTo('NPB','NPB2',undefined,undefined,undefined,undefined,{annualSalary,candidate});reportFlowOutcome({kind:'DEMOTION_TRANSFER_NPB2'});}});
          }
        }else if(S.org==='NPB'&&o>=LV.CPBL1.min&&chance(70)){
          const annualSalary=salaryCandidate({sourceLevel:S.lv,targetLevel:'CPBL1',contractMult:1}).annualSalary;
          alts.push({t:'台湾プロ野球からのオファーを受ける',s:`台湾プロ野球一軍契約｜年俸${fmtMoney(annualSalary)}`,f:()=>{buyoutRemaining();signTo('CPBL','CPBL1',undefined,undefined,undefined,undefined,{annualSalary});reportFlowOutcome({kind:'DEMOTION_TRANSFER_CPBL1'});}});
        }
        if(alts.length){
          card('bad','降格通告',`成績が基準に届かず、球団は<b class="dn">${LV[targetLevel].n}</b>への降格を通告。しかし同時に、他リーグからオファーが届いた。`);
          choose('降格を受け入れるか、新天地を選ぶか？',[
            {t:LV[targetLevel].n+'への降格を受け入れる',main:true,f:()=>{const S=getState();const fromLv=S.lv;S.lv=targetLevel;applyDemotionSalary(fromLv,targetLevel);board(2);reportFlowOutcome({kind:'DEMOTION_ACCEPTED'});}},...alts]);
        }else{ const fromLv=S.lv;S.lv=targetLevel;applyDemotionSalary(fromLv,targetLevel);card('bad','降格通告',`成績が基準に届かず、<b class="dn">${LV[targetLevel].n}</b>への降格が決まった。`); board(2); reportFlowOutcome({kind:'DEMOTION_ACCEPTED'}); }
      }
      else outOfOrg(o);
    };
    const longContract = S.ct && S.ct.remainingYears>1 && LV[S.lv].top;
    if(longContract){
      choose('球団面談：成績が現レベルの基準に届かず、降格させる方針だという',[
        {t:acceptText,main:true,f:doDemote},
        {t:'長期契約の条項を盾に降格を拒否する',warn:true,s:'「チームの癌」が発動。翌年に結果を出せば返上、出せなければ悪評がさらに悪化',f:()=>{const S=getState();
          S.demotionRefused=true;
          if(!S.traits.cancer&&!S.traits.franchise&&!S.traits.intlace){ S.traits.cancer=true;
            card('bad','隠し特性解放：チームの癌','契約条項を持ち出して降格を拒否。首脳陣は呆れ、仲間も陰でざわつく――居場所は守ったが、ロッカールームの信頼を失った。'); }
          else card('info','降格を拒否する','契約条項を盾に一軍残留を勝ち取った。球団はこの一件を忘れない。');
          board(1); reportFlowOutcome({kind:'DEMOTION_REFUSED'}); }},
        {t:'このまま現役を引退する',warn:true,s:'現役として名誉ある引退をする',f:()=>{const S=getState();buyoutRemaining();daibaFarewell(()=>reportFlowOutcome({kind:'DEMOTION_RETIRED',reason:'降格を受け入れず、'+S.year+' 年に引退を発表。'}));}}]);
    } else if(S.age>=33){
      choose('球団面談：成績が現レベルの最低基準にも届いていない',[
        {t:acceptText,f:doDemote},
        {t:'引退を選択する',warn:true,s:'現役として名誉ある引退をする',f:()=>{const S=getState();buyoutRemaining();daibaFarewell(()=>reportFlowOutcome({kind:'DEMOTION_RETIRED',reason:'下位リーグへの降格を拒み、'+S.year+' 年に引退を発表。'}));}}]);
    } else doDemote();
  }
  function retireBelowActiveMinimum(){
    const S=getState();
    card('bad','現役続行を断念','総合力が現役続行の最低基準を下回ったため、ユニフォームを脱ぐことを決断した。');
    reportFlowOutcome({kind:'ACTIVE_MINIMUM_RETIRED',reason:`総合力が現役続行の最低基準を下回り、${S.year}年に現役を引退した。`});
  }
  function daibaFarewell(cont){const S=getState();const npb=S.stats&&S.stats.NPB,playedNPB=!!(npb&&npb.yr>0);if(S.stage==='PRO'&&playedNPB&&['MLB','MiLB','KBO','CPBL'].includes(S.org)&&!S._daiba){S._daiba=true;card('gold','日本球界への別れ',`かつてプレーした日本プロ野球から招待を受け、古巣の本拠地で始球式を務めた。日本のファンへ感謝を伝え、キャリア最後の一球を投じた。`);}cont();}
  function overseasOffer(org,lv,label,o,minD,finish){
    const S=getState();
    const min={KBO:47,CPBL:45,MiLB:60}[org]||99;
    if(o<min||(S.lastD||0)<minD)return null;
    const rec=pickRecord(listByOrg(org)),candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1});lv=candidate.targetLevel;const annual=candidate.annualSalary;
    return{t:`${label}：${rec.name}`,s:`${LV[lv].n}｜年俸${fmtMoney(annual)}${candidate.signingTerms.signingBonus>0?'｜契約金'+fmtMoney(candidate.signingTerms.signingBonus):''}`,f:()=>{buyoutRemaining();signTo(org,lv,rec.teamId,ri(1,3),1.3,'OVERSEAS',{contractType:'OVERSEAS_FA'});finish();}};
  }
  function crossOffers(o){
    const S=getState();
    const finish=()=>reportFlowOutcome({kind:'CROSS_OFFER_RESOLVED'}),opts=[];
    let offerType='transfer';
    if(S.org==='NPB'&&S.lv==='NPB1'){
      offerType=crossOfferType(S.org,'MiLB');
      const k=overseasOffer('KBO','KBO1','韓国プロ野球への海外移籍',o,1,finish);
      const c=overseasOffer('CPBL','CPBL1','台湾プロ野球への海外移籍',o,0,finish);
      const m=overseasOffer('MiLB','MLB','MLBへの海外移籍',o,2,finish);
      if(k)opts.push(k);if(c)opts.push(c);if(m)opts.push(m);
    }else if(['KBO','CPBL','MiLB','MLB'].includes(S.org)&&o>=47&&contractNeedsRenewal(S.ct)){
      // Keep the expired contract until selection; continuing/extended contracts never draw a team.
      if(careerSession.npbReturnOfferContext?.state===S&&careerSession.npbReturnOfferContext.year===S.year&&careerSession.npbReturnOfferContext.contract===S.ct){
        if(!careerSession.npbReturnOfferContext.completed)choose(careerSession.npbReturnOfferContext.title,careerSession.npbReturnOfferContext.options);
        return;
      }
      offerType=crossOfferType(S.org,'NPB');
      const context={state:S,year:S.year,contract:S.ct,completed:false,running:false,actionCompleted:false,years:null,transaction:{state:S,year:S.year,contract:null}};
      const complete=action=>{
        if(context.completed||context.running||context.state!==getState()||context.year!==getState().year)return;
        context.running=true;
        try{if(!context.actionCompleted){action?.();context.actionCompleted=true;}finish();context.completed=true;}
        finally{context.running=false;if(getState().year!==context.year)context.completed=true;}
      };
      const rec=pickRecord(listByOrg('NPB')),lv=o>=53?'NPB1':'NPB2',candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1}),annualSalary=candidate.annualSalary;
      opts.push({t:`NPBへ復帰：${rec.name}`,s:`${LV[lv].n}契約｜年俸${fmtMoney(annualSalary)}`,f:()=>complete(()=>{context.years??=ri(1,3);signTo('NPB',lv,rec.teamId,context.years,1,'RETURN',{annualSalary,candidate,transaction:context.transaction});})});
      opts.push({t:'現在の球団に残留',main:true,f:()=>complete()});
      careerSession.npbReturnOfferContext=context;context.title=crossOfferTitle(offerType);context.options=opts;
      choose(context.title,opts);return;
    }
    if(!opts.length){finish();return;}
    opts.splice(4);opts.push({t:'現在の球団に残留',main:true,f:finish});choose(crossOfferTitle(offerType),opts);
  }
  function faFlow(o){
    const S=getState();
    migrateSalaryV130State();const stage=contractStageFor(S.org);
    if(stage==='CONTROL'){renewAndAdvance(1,false,'CONTROL');return;}
    if(stage==='ARBITRATION'){arbitrationFlow();return;}
    if(S.org!=='NPB'){S.faType='OVERSEAS';faMarket(o,S.lastD||0);return;}
    if(serviceYearsFor('NPB')<8){renewAndAdvance(1,false,'CONTROL');return;}
    const declareFA=type=>{const S=getState();S.faType=type;S.faUsed=true;S.npbFaSeasons=0;faMarket(o,S.lastD||0);};
    const opts=[{t:'権利を行使せず残留',main:true,f:()=>renewAndAdvance(1)},{t:'国内FAを宣言',warn:true,f:()=>declareFA('DOMESTIC')}];
    if(serviceYearsFor('NPB')>=9)opts.push({t:'海外FAを宣言',warn:true,f:()=>declareFA('OVERSEAS')});
    choose(`FA権取得・登録${serviceYearsFor('NPB')}シーズン`,opts);
  }
  const faOfferText=offer=>`契約：${offer.years}年｜年俸：${fmtMoney(offer.annualSalary)}${offer.priceCandidate?.signingTerms?.signingBonus>0?'｜契約金：'+fmtMoney(offer.priceCandidate.signingTerms.signingBonus):''}<br>保証年俸総額：${fmtMoney(offer.guaranteedTotal)}｜出来高：最大${fmtMoney(offer.incentiveAnnualMax)}／年<br>球団の需要度：${teamDemandLabel(offer.demandScore)}｜契約種別：${contractTypeLabel(offer.contractType)}<br><small>市場基準額 ${fmtMoney(offer.breakdown.marketSalary)}／故障補正 ×${offer.breakdown.injuryMultiplier.toFixed(2)}／守備位置係数 ×${offer.breakdown.positionMultiplier.toFixed(2)}／契約種別係数 ×${offer.breakdown.contractTypeMultiplier.toFixed(2)}／球団の需要度 ×${offer.breakdown.teamDemandMultiplier.toFixed(3)}／競合補正 ×${offer.breakdown.competitionMultiplier.toFixed(3)}／最終年俸 ${fmtMoney(offer.annualSalary)}</small>`;
  function priceFaOffer(offer){const S=getState();const candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:offer.level,marketSalary:offer.annualSalary,positionMult:1,transferType:'FA'});if(candidate.crossLeague){offer.annualSalary=candidate.annualSalary;offer.level=candidate.targetLevel;offer.guaranteedTotal=offer.annualSalary*offer.years;offer.breakdown={...offer.breakdown,crossLeague:candidate.crossLeague,finalAnnualSalary:offer.annualSalary};if(candidate.crossLeague.eligibilityType==='MLB_INTL_RESTRICTED'){offer.contractType='ROOKIE';offer.breakdown.marketSalary=candidate.baseSalary;}}offer.priceCandidate=candidate;}
  function acceptFaOffer(offer){const S=getState();S.lastFaMarket.acceptedOfferId=offer.offerId;const rec=teamRec(offer.teamId);signTo(offer.org,offer.level,offer.teamId,offer.years,1,'FA',{annualSalary:offer.annualSalary,contractType:offer.contractType,incentive:offer.incentive,offerBreakdown:offer.breakdown,candidate:offer.priceCandidate});card('gold','FA契約成立',`${escapeHTML(rec.name)}と${offer.years}年契約。保証年俸総額${fmtMoney(offer.guaranteedTotal)}、出来高は年最大${fmtMoney(offer.incentiveAnnualMax)}。`);reportFlowOutcome({kind:'FA_SIGNED'});}
  function showFaMarket(market){
    const S=getState();
    if(!market.offers.length){const rating=market.marketRating,injury=injurySalaryMultiplier(S.marketInjury,isRecentStar(S.salaryEvaluationHistory||[])),marketAnnual=salaryFor(S.lv,rating)*dpMult()*.9*injury,levelMinimum=salaryFor(S.lv,0),floorApplied=levelMinimum>marketAnnual,annual=S.org==='KBO'?applyKboForeignPackageCap({annualSalary:Math.max(marketAnnual,levelMinimum),isRenewal:true,previousPackage:kboPreviousPackage(),levelMinimum}).annualSalary:roundToTenThousandYen(Math.max(marketAnnual,levelMinimum)),incentive=createIncentiveTerms({org:S.org,annualSalary:annual});choose('FA市場・獲得オファーなし',[{t:`元球団と1年契約（年俸${fmtMoney(annual)}）`,main:true,s:'市場価×0.90。減俸保護は適用されない',f:()=>{const S=getState();const previousSalary=S.currentSalary,base=salaryCandidate(),candidate={...base,contractMult:.9*injury,annualSalary:annual};S.ct=fixedContract({org:S.org,teamId:S.orgTeamId,years:1,annualSalary:annual,contractType:'FA_RETURN',candidate,incentive});S.currentSalary=S.ct.annualSalary;market.acceptedOfferId='RETURN_NO_BID';saveSalaryDecision('RENEWAL',candidate,previousSalary,S.currentSalary,{floorApplied});reportFlowOutcome({kind:'FA_NO_BID_RETURNED'});}},{t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'FA_RETIRED',reason:'FA市場で獲得オファーがなく、現役を引退した。'})}]);return;}
    const choices=market.offers.map(offer=>({t:`${teamRec(offer.teamId).name}（${LV[offer.level].n}）`,s:faOfferText(offer),f:()=>acceptFaOffer(offer)}));
    if(market.stayOffer)choices.push({t:`宣言残留：${teamRec(market.stayOffer.teamId).name}`,main:true,s:faOfferText(market.stayOffer),f:()=>acceptFaOffer(market.stayOffer)});
    choose('FA市場オファー比較',choices);
  }
  function faMarketRule(o,d){
    const S=getState();
    migrateSalaryV140State();const key=`FA:${S.year}:${S.faType}`;
    if(S.lastFaMarket?.marketKey===key){showFaMarket(S.lastFaMarket);return;}
    S.faMarketKey=key;const rating=currentMarketRating(),baseCount=baseFaOfferCount(rating),context=buildMarketContext({marketSalary:0,marketInjury:S.marketInjury,history:S.salaryEvaluationHistory||[],normalMaxYears:4,baseOfferCount:Math.max(0,baseCount-(S.traits.cancer?1:0))}),offerCount=context.offerCount,category=playerMarketCategory({pos:S.pos,role:S.role,dpos:S.dpos});
    const routes=S.faType==='DOMESTIC'?[{org:'NPB',level:'NPB1'}]:[{org:'NPB',level:'NPB1'},...(o>=47&&d>=1?[{org:'KBO',level:'KBO1'}]:[]),...(o>=45&&d>=0?[{org:'CPBL',level:'CPBL1'}]:[]),...(o>=60&&d>=2?[{org:'MiLB',level:'MLB'}]:[])];
    const candidates=routes.flatMap(route=>listByOrg(route.org).filter(team=>team.teamId!==S.orgTeamId).map(team=>({team,...route}))),ranked=rankTeamsByDemand({teams:candidates.map(x=>x.team),seed:S.seed,year:S.year,category});
    const routeByTeam=new Map(candidates.map(x=>[x.team.teamId,x])),selected=ranked.slice(0,offerCount).map(x=>({...x,...routeByTeam.get(x.team.teamId)})).sort((a,b)=>a.team.teamId.localeCompare(b.team.teamId)),comp=competitionMultiplier(selected.length),offers=[],jitterByTeam=new Map(generateBidJitters(selected.map(x=>x.team.teamId),R).map(x=>[x.teamId,x.multiplier]));
    selected.forEach((entry,index)=>{const proof=context.preferProof,contractType=proof?'PROOF':index%2===0&&context.maxYears>=3?'LONG':'SHORT',years=proof?1:contractType==='LONG'?context.maxYears:Math.min(2,context.maxYears),converted=convertRatingBetweenLevels(rating,S.lv,entry.level,LV),marketSalary=salaryFor(entry.level,converted),breakdown={injuryMultiplier:context.injuryMultiplier,positionMultiplier:dpMult(),contractTypeMultiplier:contractTypeMultiplier(contractType),teamDemandMultiplier:teamDemandMultiplier(entry.demandScore),franchiseMultiplier:1,competitionMultiplier:comp,bidJitterMultiplier:jitterByTeam.get(entry.team.teamId)},incentive=createIncentiveTerms({org:entry.org,annualSalary:marketSalary});const offer=buildFaOffer({offerId:`${key}:${entry.team.teamId}`,teamId:entry.team.teamId,org:entry.org,level:entry.level,category,demandScore:entry.demandScore,years,contractType,marketSalary,levelMinimum:salaryFor(entry.level,0),breakdown,incentiveTerms:incentive});priceFaOffer(offer);offer.incentive=createIncentiveTerms({org:entry.org,annualSalary:offer.annualSalary});offer.incentiveAnnualMax=offer.incentive?.annualMax||0;offers.push(offer);});
    let stayOffer=null;if(offers.length&&S.orgTeamId){const demand=rankTeamsByDemand({teams:[teamRec(S.orgTeamId)],seed:S.seed,year:S.year,category})[0]?.demandScore||0,contractType=context.preferProof?'PROOF':'SHORT',years=context.preferProof?1:Math.min(2,context.maxYears),marketSalary=salaryFor(S.lv,rating),breakdown={injuryMultiplier:context.injuryMultiplier,positionMultiplier:dpMult(),contractTypeMultiplier:contractTypeMultiplier(contractType),teamDemandMultiplier:teamDemandMultiplier(demand),franchiseMultiplier:S.traits.franchise?1.04:1,competitionMultiplier:comp,bidJitterMultiplier:1},incentive=createIncentiveTerms({org:S.org,annualSalary:marketSalary});stayOffer=buildFaOffer({offerId:`${key}:STAY`,teamId:S.orgTeamId,org:S.org,level:S.lv,category,demandScore:demand,years,contractType:'RETURN',marketSalary,levelMinimum:salaryFor(S.lv,0),breakdown,incentiveTerms:incentive});priceFaOffer(stayOffer);stayOffer.incentive=createIncentiveTerms({org:S.org,annualSalary:stayOffer.annualSalary});stayOffer.incentiveAnnualMax=stayOffer.incentive?.annualMax||0;}
    S.lastFaMarket={marketKey:key,generatedYear:S.year,marketRating:rating,injuryStatus:S.marketInjury,offerCount:offers.length,offers,stayOffer,acceptedOfferId:null};showFaMarket(S.lastFaMarket);
  }
  function outOfOrg(o){
    const S=getState();
    if(isBelowActiveMinimum(o)){retireBelowActiveMinimum();return;}
    buyoutRemaining(1);
    const candidates=[];
    const pushPro=(org,lv,label)=>{const rec=pickRecord(listByOrg(org)),score=LV[lv].par,candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1,transferType:'RELEASE_RECONTRACT'});lv=candidate.targetLevel;const annualSalary=candidate.annualSalary;candidates.push({score,t:`${label}・${rec.name}`,s:`${LV[lv].n}契約｜年俸${fmtMoney(annualSalary)}${candidate.signingTerms.signingBonus>0?'｜契約金'+fmtMoney(candidate.signingTerms.signingBonus):''}`,f:()=>{signTo(org,lv,rec.teamId,1,1,'RELEASE_RECONTRACT',{annualSalary,candidate});reportFlowOutcome({kind:'RELEASE_SIGNED_PRO'});}});};
    const pushAma=stage=>{const rec=pickRecord(listByOrg(stage));candidates.push({score:LV[stage].par,t:`${stage==='CORP'?'社会人野球':'独立リーグ'}・${rec.name}`,f:()=>{const S=getState();S.stage=stage;S.stageYr=0;S.lv=stage;S.org=stage;S.orgTeamId=rec.teamId;S.team=rec.name;if(stage==='CORP')S.corpYears=0;else S.indYears=0;reportFlowOutcome({kind:'RELEASE_JOINED_AMATEUR'});}});};
    if(o>=30)pushAma('IND');if(o>=32)pushAma('CORP');
    const npbDevEligible=S.age<=26||(S.age<=29&&chance(30))||(S.npbYears||0)>0;
    if(o>=30&&npbDevEligible)pushPro('NPB','NPB_DEV','NPB育成再契約');
    if(o>=47)pushPro('KBO','KBO1','韓国プロ野球への海外移籍オファー');else if(o>=35)pushPro('KBO','KBO2','韓国プロ野球への海外移籍オファー');
    if(o>=45)pushPro('CPBL','CPBL1','台湾プロ野球への海外移籍オファー');else if(o>=35)pushPro('CPBL','CPBL2','台湾プロ野球への海外移籍オファー');
    if(o>=52)pushPro('MiLB','A3','米国プロ野球への海外移籍オファー');
    else {
      const milbAgeOK=S.age<=26||(S.age<=29&&chance(30));
      if(milbAgeOK){if(o>=47)pushPro('MiLB','A2','米国プロ野球への海外移籍オファー');else if(o>=43)pushPro('MiLB','A1','米国プロ野球への海外移籍オファー');else if(o>=39)pushPro('MiLB','R','米国プロ野球への海外移籍オファー');}
    }
    candidates.sort((a,b)=>b.score-a.score);const offers=candidates.slice(0,4).map(({score,...x})=>x);
    if(!offers.length){reportFlowOutcome({kind:'RELEASE_RETIRED',reason:`戦力外通告後に獲得オファーがなく、${S.year}年に現役を引退した。`});return;}
    offers.push({t:'現役を退く',warn:true,f:()=>reportFlowOutcome({kind:'RELEASE_RETIRED',reason:'戦力外通告を受け、現役を引退した。'})});
    choose('戦力外・再起オファー（最大4球団）',offers);
  }
  return {demotionAudit,tradeCheck,buyoutRemaining,handleDemotion,retireBelowActiveMinimum,daibaFarewell,overseasOffer,crossOffers,faFlow,faMarket:faMarketRule,outOfOrg};
}
