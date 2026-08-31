export function draftSigningTerms(type,round){
  const development=type==='DEVELOPMENT';
  return{level:development?'NPB_DEV':'NPB2',contractType:development?'DEVELOPMENT':'CONTROL',rookieSalary:development?3_000_000:Number(round)<=2?16_000_000:12_000_000};
}

export function assertSignedDraftState(state,{teamId,level,contractType,rookieSalary}){
  if(state.stage!=='PRO'||state.org!=='NPB'||state.lv!==level||state.orgTeamId!==teamId||state.draftRights?.status!=='SIGNED'||!state.ct||state.ct.contractType!==contractType||state.currentSalary!==rookieSalary)throw new Error('INVALID_SIGNED_DRAFT_STATE');
  return true;
}

export function acceptDraftSelection({state,type,round,teamId,bonus,sign}){
  const terms=draftSigningTerms(type,round);
  sign(terms);
  state.draftRights.status='SIGNED';state.careerSigningBonus=(Number(state.careerSigningBonus)||0)+bonus;state.careerEarnings=(Number(state.careerEarnings)||0)+bonus;
  assertSignedDraftState(state,{teamId,...terms});
  return'signed';
}

export function declineDraftSelection(state){
  if(state.draftRights)state.draftRights.status='DECLINED';
  state.draftRights=null;
  return'declined';
}

export function isDraftFallbackResult(result){return result==='fail'||result==='declined';}
