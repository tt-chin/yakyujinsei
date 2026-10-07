const yen = value => Math.max(0, Math.round((Number(value) || 0) / 10000) * 10000);
export const NPB_BONUS_RANGES = Object.freeze([[8000,10000],[5000,7500],[3500,5500],[2500,4500],[2000,3500],[1500,3000]].map(Object.freeze));
export function internationalBonus(overall) {
  const o=Math.max(40,Math.min(80,Number(overall)||40));
  const bands=[[40,50,300,1000],[50,60,1000,3000],[60,70,3000,8000],[70,80,8000,20000]];
  const [lo,hi,min,max]=bands.find(b=>o<b[1])||bands.at(-1);
  return yen((min+(max-min)*(o-lo)/(hi-lo))*10000);
}
export function createSigningBonusTerms({route,draftType,bonus=0,overall=40}={}) {
  const development=route==='NPB_DRAFT'&&draftType==='DEVELOPMENT';
  const amount=development?0:route==='INTERNATIONAL_AMATEUR'?internationalBonus(overall):route==='NPB_DRAFT'?yen(bonus):0;
  const developmentStipend=development?2_900_000:0;
  return {amount,signingBonus:amount,developmentStipend,type:amount>0?(route==='NPB_DRAFT'?'NPB_DRAFT':'MLB_INTL_AMATEUR'):'NONE',signingBonusType:amount>0?(route==='NPB_DRAFT'?'NPB_DRAFT':'MLB_INTL_AMATEUR'):'NONE',playerIncome:amount+developmentStipend,postingFee:0,rationale:development?'NPB_DEVELOPMENT_STIPEND':route||'NONE'};
}
export function calculatePostingFee({guaranteedTotal=0,signingBonus=0,major=false,eligible=false}={}) {
  if(!eligible)return 0;
  if(!major)return yen(signingBonus*.25);
  const g=Math.max(0,Number(guaranteedTotal)||0)+Math.max(0,Number(signingBonus)||0),step=25_000_000*150;
  return yen(Math.min(g,step)*.20+Math.min(Math.max(0,g-step),step)*.175+Math.max(0,g-step*2)*.15);
}
export function applySigningPayment(state,contract) {
  if(!contract?.contractId)throw Error('SIGNING_PAYMENT_CONTRACT_ID_REQUIRED');
  const id=contract.contractId;
  if(state.signingPayments?.[id]||contract.signingPaymentStatus!=='PENDING')return {paid:false,amount:0};
  const bonus=yen(contract.signingBonus),stipend=yen(contract.developmentStipend),amount=bonus+stipend;
  state.signingPayments={...(state.signingPayments||{}),[id]:{signingBonus:bonus,developmentStipend:stipend}};
  state.careerSigningBonus=(Number(state.careerSigningBonus)||0)+bonus;
  state.careerDevelopmentStipend=(Number(state.careerDevelopmentStipend)||0)+stipend;
  state.careerEarnings=(Number(state.careerEarnings)||0)+amount;
  contract.signingPaymentStatus='PAID';
  return {paid:true,amount};
}
