import { applyForcedCutProtection } from './control-period-policy.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
export function calculateArbitrationTerms({marketSalary,previousSalary,marketRating,serviceYears,levelMinimum=0}){
  const rating=Number(marketRating)||0,years=Math.max(0,Number(serviceYears)||0),market=Number(marketSalary)||0,previous=Number(previousSalary)||0;
  const clubMult=clamp(.91+rating*.045+Math.min(years,6)*.045,.80,1.45);
  const playerMult=clamp(clubMult+.08+Math.max(0,rating)*.018,.92,1.70);
  const middleMult=(clubMult+playerMult)/2;
  const protect=value=>Math.max(applyForcedCutProtection(market*value,previous),Number(levelMinimum)||0);
  return{clubMult,playerMult,middleMult,winChance:clamp(47+rating*8+Math.min(years,6)*2,15,88),clubSalary:protect(clubMult),playerSalary:protect(playerMult),middleSalary:protect(middleMult),marketSalary:market,previousSalary:previous,marketRating:rating,serviceYears:years,levelMinimum:Number(levelMinimum)||0};
}
