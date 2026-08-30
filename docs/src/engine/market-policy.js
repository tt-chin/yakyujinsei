import { injuryMarketLimits, injurySalaryMultiplier, isRecentStar } from './injury-market-policy.js';

export function buildMarketContext({marketSalary,marketInjury='HEALTHY',history=[],normalMaxYears=4,baseOfferCount=0}){
  const isStar=isRecentStar(history),injuryMultiplier=injurySalaryMultiplier(marketInjury,isStar),limits=injuryMarketLimits(marketInjury,normalMaxYears);
  return{marketInjury,isStar,injuryMultiplier,adjustedMarketSalary:(Number(marketSalary)||0)*injuryMultiplier,offerCount:Math.max(0,Math.min(4,(Number(baseOfferCount)||0)+limits.offerAdjustment)),maxYears:limits.maxYears,preferProof:limits.preferProof};
}

export function createProofOffer({marketSalary,injuryMultiplier,levelMinimum}){
  return{contractType:'PROOF',years:1,annualSalary:Math.max((Number(marketSalary)||0)*(Number(injuryMultiplier)||0)*1.05,Number(levelMinimum)||0),forcedCutProtectionApplied:false,label:'再起を懸ける1年契約（証明契約）'};
}

export function baseFaOfferCount(marketRating){const rating=Number(marketRating)||0;return rating>=6?4:rating>=3?3:rating>=1?2:rating>=-1?1:0;}
export function competitionMultiplier(offerCount){return 1+Math.min(3,Math.max(0,(Number(offerCount)||0)-1))*.025;}
export function contractTypeMultiplier(contractType){return contractType==='LONG'?.95:(contractType==='SHORT'||contractType==='PROOF')?1.05:1;}
export function calculateOfferAnnualSalary({marketSalary,levelMinimum=0,breakdown={}}){const keys=['injuryMultiplier','positionMultiplier','contractTypeMultiplier','teamDemandMultiplier','franchiseMultiplier','competitionMultiplier','bidJitterMultiplier'];const raw=keys.reduce((value,key)=>value*(Number(breakdown[key])||1),Number(marketSalary)||0);return Math.max(Number(levelMinimum)||0,Math.round(raw/10000)*10000);}

export function buildFaOffer({offerId,teamId,org,level,category,demandScore,years,contractType,marketSalary,levelMinimum,breakdown,incentiveTerms}){
  const annualSalary=calculateOfferAnnualSalary({marketSalary,levelMinimum,breakdown});
  return{offerId,teamId,org,level,category,demandScore,years,contractType,annualSalary,guaranteedTotal:annualSalary*years,incentiveAnnualMax:incentiveTerms?.annualMax||0,incentive:incentiveTerms||null,breakdown:{marketSalary,...breakdown,finalAnnualSalary:annualSalary}};
}

export function generateBidJitters(teamIds,random){return [...teamIds].sort((a,b)=>a.localeCompare(b)).map(teamId=>({teamId,multiplier:.96+random()*.08}));}
export function resolveFaMarket(existing,marketKey,generate){return existing?.marketKey===marketKey?existing:generate();}
