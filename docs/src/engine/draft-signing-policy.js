import { createSigningBonusTerms, applySigningPayment } from './signing-bonus-policy.js';

export function draftSigningTerms(type,round){
  const development=type==='DEVELOPMENT';
  return{level:development?'NPB_DEV':'NPB2',contractType:development?'DEVELOPMENT':'CONTROL',rookieSalary:development?3_000_000:Number(round)<=2?16_000_000:12_000_000};
}

export function assertSignedDraftState(state,{teamId,level,contractType,rookieSalary}){
  if(state.stage!=='PRO'||state.org!=='NPB'||state.lv!==level||state.orgTeamId!==teamId||state.draftRights?.status!=='SIGNED'||!state.ct||state.ct.contractType!==contractType||state.currentSalary!==rookieSalary)throw new Error('INVALID_SIGNED_DRAFT_STATE');
  return true;
}

export function acceptDraftSelection({state,type,round,teamId,bonus,sign}){
  if(state.draftRights?.status==='SIGNED')return 'signed';
  const terms=draftSigningTerms(type,round);
  sign(terms);
  const payment=createSigningBonusTerms({route:'NPB_DRAFT',draftType:type,bonus});
  if(state.ct.signingPaymentStatus==='PENDING')Object.assign(state.ct,{signingBonus:payment.signingBonus,signingBonusType:payment.signingBonusType,developmentStipend:payment.developmentStipend});
  applySigningPayment(state,state.ct);state.draftRights.status='SIGNED';
  assertSignedDraftState(state,{teamId,...terms});
  return'signed';
}

export function declineDraftSelection(state){
  if(state.draftRights)state.draftRights.status='DECLINED';
  state.draftRights=null;
  return'declined';
}

export function isDraftFallbackResult(result){return result==='fail'||result==='declined';}
