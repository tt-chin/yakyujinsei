import { injuryMarketLimits, injurySalaryMultiplier, isRecentStar } from './injury-market-policy.js';

export function buildMarketContext({marketSalary,marketInjury='HEALTHY',history=[],normalMaxYears=4,baseOfferCount=0}){
  const isStar=isRecentStar(history),injuryMultiplier=injurySalaryMultiplier(marketInjury,isStar),limits=injuryMarketLimits(marketInjury,normalMaxYears);
  return{marketInjury,isStar,injuryMultiplier,adjustedMarketSalary:(Number(marketSalary)||0)*injuryMultiplier,offerCount:Math.max(0,Math.min(4,(Number(baseOfferCount)||0)+limits.offerAdjustment)),maxYears:limits.maxYears,preferProof:limits.preferProof};
}

export function createProofOffer({marketSalary,injuryMultiplier,levelMinimum}){
  return{contractType:'PROOF',years:1,annualSalary:Math.max((Number(marketSalary)||0)*(Number(injuryMultiplier)||0)*1.05,Number(levelMinimum)||0),forcedCutProtectionApplied:false,label:'再起を懸ける1年契約（証明契約）'};
}
