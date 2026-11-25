// INJ-UI-01: the mid-season health check injury probability as an ordered breakdown. player-injury.js injuryProb
// returns injuryRiskBreakdown(state).total (the former injuryProb body), and the コンディション panel reads the
// same steps, so the judged and the displayed value come from one function. No state writes, no RNG.
// The check record and the season-start mark live only in this page session (WeakMap keyed by the career state):
// saves are taken at YEAR_START_READY, before phasePre and the health check, so neither window crosses a resume.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const freezeSteps=steps=>Object.freeze(steps.map(step=>Object.freeze({...step})));

export function injuryRiskBreakdown(state,{resetTmpInj=false}={}){
  const steps=[];
  let p=15;steps.push({kind:'BASE',delta:15,value:p});
  p+=state.injNext;steps.push({kind:'CARRY',delta:state.injNext,value:p});
  if(state.age>=35){p+=12;steps.push({kind:'AGE',delta:12,minAge:35,value:p});}
  else if(state.age>=32){p+=6;steps.push({kind:'AGE',delta:6,minAge:32,value:p});}
  if(state.traits.academy&&state.age<25){p-=5;steps.push({kind:'ACADEMY',delta:-5,value:p});}
  steps.push({kind:'PRE_TRAIT',value:p});
  if(state.traits.iron&&state.traits.glass){p=25;steps.push({kind:'TRAIT',rule:'IRON_GLASS',value:p});}
  else if(state.traits.iron){p=Math.min(p,10);steps.push({kind:'TRAIT',rule:'IRON',value:p});}
  else if(state.traits.glass){p=Math.max(p,40);steps.push({kind:'TRAIT',rule:'GLASS',value:p});}
  const tmp=resetTmpInj?0:(state.tmpInj||0);
  p+=tmp;steps.push({kind:'TMP',delta:tmp,reset:resetTmpInj,value:p});
  const total=clamp(p,3,95);
  steps.push({kind:'CLAMP',clamped:total!==p,value:total});
  return Object.freeze({total,steps:freezeSteps(steps)});
}

const checks=new WeakMap(),seasonStarts=new WeakMap();
export function recordInjuryCheck(state){
  const breakdown=injuryRiskBreakdown(state);
  checks.set(state,Object.freeze({year:state.year,breakdown}));
  return breakdown;
}
export function markInjurySeasonStart(state){if(checks.get(state)?.year===state.year)checks.delete(state);seasonStarts.set(state,state.year);}
export function injuryRiskStatus(state){
  const check=checks.get(state);
  if(check&&check.year===state.year)return Object.freeze({kind:'CHECKED',breakdown:check.breakdown});
  const started=seasonStarts.has(state)&&seasonStarts.get(state)===state.year;
  // phasePre turns rehab>0 into a skipMid season, so before the mark a pending rehab already means no check this season.
  if(started?state.skipMid:state.rehab>0)return Object.freeze({kind:'NO_CHECK',breakdown:null});
  return Object.freeze({kind:'FORECAST',breakdown:injuryRiskBreakdown(state,{resetTmpInj:!started})});
}
