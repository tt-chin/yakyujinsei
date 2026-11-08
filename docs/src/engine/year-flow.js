// Year skeleton (OOP plan §2kk): the step queue, the year hand-off (advance), the flow-outcome
// dispatch and the preseason international step. The career state is read at the start of each method through
// getState. careerSession, yearHandoffs and flowHooks are the game.js objects, passed by reference. Calls that leave
// a method go through injected late-binding lambdas, because E2E hooks rebind startYear, advance and nextStep
// (§3.17); yearSteps returns the game.js step functions so stepQ keeps their identity and names. No draw site.
import { resetEventYear } from './event-state-policy.js';

export class YearFlow {
  #deps;
  constructor(deps){this.#deps=deps;}
  nextStep(){const S=this.#deps.getState(),{careerSession}=this.#deps; if(S.done){ careerSession.stepQ=[]; return; } /* 已引退：クリア済み後継続步驟、以後はしない跑契約更新/結算。 */ const f=careerSession.stepQ.shift(); if(f)f(); }
  advance(){this.#deps.finalizePendingOffseasonSalary();this.advanceWithoutSalaryFinalization();}
  advanceWithoutSalaryFinalization(){const S=this.#deps.getState(),{careerSession,yearHandoffs,startYear,$}=this.#deps;
  const state=S,fromYear=careerSession.currentChoiceContext?.state===S?careerSession.currentChoiceContext.year:S.year;
  let years=yearHandoffs.get(state);if(!years){years=new Map();yearHandoffs.set(state,years);}
  if([...years.values()].some(h=>h.status==='STARTED'&&h.targetYear===state.year))throw new Error('NEXT_YEAR_AMBIGUOUS');
  let handoff=years.get(fromYear);
  if(handoff){if(handoff.status==='COMMITTED')return;if(state.year!==fromYear)throw new Error('NEXT_YEAR_AMBIGUOUS');}
  else {if(state.year!==fromYear)throw new Error('STALE_YEAR_HANDOFF');handoff={fromYear,targetYear:fromYear+1,age:state.age+1,stageYr:state.stageYr+1,status:'PREPARED'};years.set(fromYear,handoff);}
  state.age=handoff.age;state.year=handoff.targetYear;state.stageYr=handoff.stageYr;handoff.status='STARTED';
  try{resetEventYear(state);startYear();handoff.status='COMMITTED';}
  catch(error){++careerSession.choiceGeneration;careerSession.activeChoiceToken=null;const act=$('act');act.querySelectorAll('button').forEach(b=>{b.disabled=true;});act.style.pointerEvents='none';throw new Error('NEXT_YEAR_AMBIGUOUS',{cause:error});}
}
  reportFlowOutcome(outcome){const {flowHooks,advance,endGame}=this.#deps;
    switch(outcome.kind){
      case 'AMATEUR_STAY':
      case 'AMATEUR_ENTER_UNIVERSITY':
      case 'AMATEUR_JOIN_CORP':
      case 'AMATEUR_JOIN_IND':
      case 'AMATEUR_SIGNED_MILB':
      case 'AMATEUR_DRAFTED':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'AMATEUR_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
      case 'DEMOTION_TRANSFER_NPB1':
      case 'DEMOTION_TRANSFER_NPB2':
      case 'DEMOTION_TRANSFER_CPBL1':
      case 'DEMOTION_ACCEPTED':
      case 'DEMOTION_REFUSED':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'DEMOTION_RETIRED':
      case 'ACTIVE_MINIMUM_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
      case 'CROSS_OFFER_RESOLVED':
      case 'CONTRACT_RENEWED':
      case 'ARBITRATION_SETTLED':
      case 'FA_SIGNED':
      case 'FA_NO_BID_RETURNED':
      case 'RELEASE_SIGNED_PRO':
      case 'RELEASE_JOINED_AMATEUR':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'FA_RETIRED':
      case 'RELEASE_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
      case 'PRESEASON_RETURNED_NPB':
      case 'REHAB_YEAR_COMPLETED':return flowHooks.advance?flowHooks.advance(outcome):advance();
      case 'PRESEASON_AGE_LIMIT_RETIRED':
      case 'PRESEASON_RETIRED':return flowHooks.endGame?flowHooks.endGame(outcome):endGame(outcome.reason);
    }
    throw new Error('UNKNOWN_FLOW_OUTCOME:'+outcome.kind);
  }
  phaseIntlPre(){const {processIntlPhase,nextStep}=this.#deps;processIntlPhase('PRE',()=>nextStep());}
  // Persistent saves use this entry; the original entry remains for historical controls.
  startReadyYear(capture){
    const S=this.#deps.getState(),{careerSession,yearSteps,divider,stageLabel,nextStep,yearHandoffs}=this.#deps;
    const pending=[...(yearHandoffs.get(S)?.values()||[])].filter(h=>h.status==='STARTED');
    if(pending.some(h=>h.targetYear!==S.year))throw new Error('NEXT_YEAR_AMBIGUOUS');
    careerSession.stepQ=yearSteps();
    divider(`${S.year}年・${S.age}歳・${stageLabel()}`);
    for(const handoff of pending)handoff.status='COMMITTED';
    capture(S);
    nextStep();
  }
  startYear(){const S=this.#deps.getState(),{careerSession,yearSteps,divider,stageLabel,nextStep}=this.#deps;careerSession.stepQ=yearSteps();divider(`${S.year}年・${S.age}歳・${stageLabel()}`);nextStep();}
}
