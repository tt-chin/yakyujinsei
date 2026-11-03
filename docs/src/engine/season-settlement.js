// Season-end settlement (OOP plan §2jj): championship, season payment and its Receipt, the result card,
// the season ability-point allocation and the hand-off to movement, plus the IND/CORP year-end pay.
// The career state is read at the start of each method through getState; go reads it again because it can run
// after the allocation UI. careerSession and choiceViews are the game.js objects, passed by reference. Every other
// game.js function is an injected late-binding lambda (E2E hooks rebind board, card, choose, allocUI, movement,
// salaryCandidate, salaryFor and R). No draw site here: settleChampionship draws through random, game.js R.
import { annualStateTransaction, prepareAwardReceipt, commitAwardReceipt } from './award-transaction-policy.js';
import { prepareSeasonPayment } from './season-payment-policy.js';
import { contractContinuationForNextYear } from './contract-policy.js';
import { classifyMarketInjury } from './injury-market-policy.js';
import { normalizeChampionshipState, settleChampionship, maintainSeasonEnd } from './championship-policy.js';

export class SeasonSettlement {
  #deps;
  #professionalEnds=new WeakMap();
  constructor(deps){this.#deps=deps;}
  resumeSeasonEnd(){const S=this.#deps.getState(),professionalEnds=this.#professionalEnds;
    const entry=professionalEnds.get(S);
    if(entry?.year!==S.year)return false;
    this.settleProfessionalEnd();return true;
  }
  settleProfessionalEnd(){const S=this.#deps.getState(),professionalEnds=this.#professionalEnds,{getState,careerSession,choiceViews,board,migrateSalaryV140State,teamRec,random:R,renderCheckpointCard,escapeHTML,fmtMoney,movement,choose,allocUI,restorePendingChoice,$}=this.#deps;
    board(2);migrateSalaryV140State();
    let entry=professionalEnds.get(S);
    if(entry?.year!==S.year){
      normalizeChampionshipState(S,teamRec);
      // An old paid year without a live receipt is read-only, not a retry candidate.
      if(S.lastSalaryPaidYear===S.year||S.ct?.annualSchedule?.some(row=>row.year===S.year&&row.paid===true))return;
      entry={state:S,year:S.year,phase:'CHAMPIONSHIP',tx:annualStateTransaction(S)};professionalEnds.set(S,entry);
    }
    if(entry.state!==S||entry.year!==S.year)throw new Error('STALE_SETTLEMENT');
    careerSession.seasonEndContext=entry;
    if(entry.phase==='CHAMPIONSHIP'){
      const {result,created}=settleChampionship(S,{teamById:teamRec,random:R});maintainSeasonEnd(S);
      entry.championship=result;entry.showChampionship=created&&result.won;entry.phase='CHAMPIONSHIP_RENDER';
    }
    if(entry.phase==='CHAMPIONSHIP_RENDER'){
      if(entry.showChampionship){const result=entry.championship,team=teamRec(result.teamId);renderCheckpointCard(entry,'championship',['gold',result.title+'達成',`${escapeHTML(team.name)}が<b class="hl">${result.title}</b>に輝いた。今季の優勝をキャリアの実績に追加した。`]);}
      entry.phase='PAYMENT_PREPARED';
    }
    if(entry.phase==='PAYMENT_PREPARED'){
      S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});
      if(!entry.payment){entry.payment=prepareSeasonPayment(S);prepareAwardReceipt(entry.tx,'season-payment',entry.payment.writes);}
      commitAwardReceipt(entry.tx,'season-payment');careerSession.pendingOffseasonSalary=null;entry.phase='PAYMENT_COMMITTED';
    }
    if(entry.phase==='PAYMENT_COMMITTED'){
      const {paid,incentive}=entry.payment,continuation=contractContinuationForNextYear(S.ct,S.year),continuationText=continuation?`<br><b>現契約を継続</b><br>来季年俸：<b class="hl">${fmtMoney(continuation.nextSalary)}</b><br>契約残り：${continuation.remainingYears}年<br>年俸の再計算はありません<br>今季の実績は次回の契約評価へ反映されます。`:'';
      if(!entry.resultHTML)entry.resultHTML=`今季支給年俸：<b class="hl">${fmtMoney(paid)}</b>｜出来高：<b class="hl">${fmtMoney(incentive.amount||0)}</b>（${incentive.level}）<br>スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}<br>今季受取総額：<b class="hl">${fmtMoney(paid+(incentive.amount||0)+(S.yearOutsideIncome||0))}</b>｜生涯収入：${fmtMoney(S.careerEarnings)}${continuationText}`;
      renderCheckpointCard(entry,'payment',['','シーズン終了',entry.resultHTML]);entry.phase='RESULT_RENDERED';
    }
    const go=()=>{const S=getState();if(entry.state!==S||entry.year!==S.year)return;entry.phase='MOVEMENT';movement();entry.phase='WAIT_CHOICE';};
    if(entry.phase==='RESULT_RENDERED'){
      entry.pool=S.pool;
      if(entry.pool>0){prepareAwardReceipt(entry.tx,'allocation-payload',[{path:['pool'],before:entry.pool,after:0}]);commitAwardReceipt(entry.tx,'allocation-payload');entry.phase='WAIT_ALLOCATION';}
      else go();
    }
    if(entry.phase==='WAIT_ALLOCATION'){
      const live=choiceViews.get(S);
      if(live?.year===S.year&&live.kind==='ALLOCATION'&&live.generation===careerSession.choiceGeneration)return;
      if(entry.allocationChoice&&restorePendingChoice(S,entry.allocationChoice)){entry.allocationChoice=choiceViews.get(S);return;}
      choose('',[{t:`能力点を分配（${entry.pool}点）`,main:true,f:()=>{entry.phase='ALLOCATION_STARTED';allocUI({pool:entry.pool},'シーズン成果の能力点',()=>{entry.phase='ALLOCATION_COMMITTED';go();});}}]);entry.allocationChoice=choiceViews.get(S);return;
    }
    if(entry.phase==='ALLOCATION_STARTED'){
      const live=choiceViews.get(S);if(live?.kind==='ALLOCATION'&&live.year===S.year&&live.generation===careerSession.choiceGeneration&&$('act').children.length)return;
      throw new Error('ALLOCATION_CONTINUATION_AMBIGUOUS');
    }
    if(entry.phase==='ALLOCATION_COMMITTED'||entry.phase==='MOVEMENT')go();
    else if(entry.phase==='WAIT_CHOICE')restorePendingChoice();
  }
  // Payment and successful completion are separate: a display failure must not repay.
  phaseEnd(){const S=this.#deps.getState(),{careerSession}=this.#deps;
    if(S.stage!=='CORP')return this.settlePhaseEnd();
    const state=S,year=S.year;
    let entry=careerSession.corpSettlements.get(state);
    if(!entry||entry.year!==year){entry={year,paid:false,complete:false,running:false};careerSession.corpSettlements.set(state,entry);}
    if(entry.complete||entry.running)return;
    entry.running=true;
    try{this.settlePhaseEnd();entry.complete=true;}finally{entry.running=false;}
  }
  settlePhaseEnd(){const S=this.#deps.getState(),{careerSession,board,migrateSalaryV140State,teamRec,salaryCandidate,currentMarketRating,saveSalaryDecision,card,fmtMoney,salaryDecisionLink,bindLatestSalaryDetailLink,salaryFor,movement,choose,allocUI}=this.#deps;
    if(S.stage==='PRO')return this.settleProfessionalEnd();
    board(2);migrateSalaryV140State();
    normalizeChampionshipState(S,teamRec);
    careerSession.seasonEndContext={state:S,year:S.year};
    S.marketInjury=classifyMarketInjury({seasonFactor:S.seasonFactor,rehab:S.rehab,skipMid:S.skipMid,majorInjuryOccurred:S._majorInjuryThisSeason});if(S.stage==='IND'){const candidate=salaryCandidate({sourceLevel:'IND',targetLevel:'IND',rating:currentMarketRating(),contractMult:1}),pay=candidate.annualSalary,previousSalary=S.currentSalary;S.currentSalary=pay;S.ct=null;if(S.lastSalaryPaidYear===S.year)throw new Error('SALARY_ALREADY_PAID_FOR_YEAR');S.careerBaseSalary+=pay;S.careerEarnings+=pay;S.lastSalaryPaidYear=S.year;saveSalaryDecision('RENEWAL',candidate,previousSalary,pay);card('','独立リーグ年間報酬',`今季年俸${fmtMoney(pay)}を受領した。スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}。今季受取総額：${fmtMoney(pay+(S.yearOutsideIncome||0))}。生涯収入：${fmtMoney(S.careerEarnings)} ${salaryDecisionLink()}`);bindLatestSalaryDetailLink();}else if(S.stage==='CORP'){const entry=careerSession.corpSettlements.get(S),pay=entry.paid?entry.pay:salaryFor('CORP',S.lastD||0);if(!entry.paid){S.corpIncome+=pay;S.careerEarnings+=pay;entry.pay=pay;entry.paid=true;}card('','社会人給与',`企業給与${fmtMoney(pay)}を受領した。スポンサー収入：${fmtMoney(S.yearOutsideIncome||0)}。今季受取総額：${fmtMoney(pay+(S.yearOutsideIncome||0))}。`);}const go=()=>movement();if(S.pool>0){const p=S.pool;S.pool=0;choose('',[{t:`能力点を分配（${p}点）`,main:true,f:()=>allocUI({pool:p},'シーズン成果の能力点',go)}]);}else go();}
}
