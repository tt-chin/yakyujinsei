import { applyForcedCutProtection } from './control-period-policy.js';

const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));
export function calculateArbitrationTerms({marketSalary,previousSalary,marketRating,serviceYears,levelMinimum=0}){
  const rating=Number(marketRating)||0,years=Math.max(0,Number(serviceYears)||0),market=Number(marketSalary)||0,previous=Number(previousSalary)||0;
  const clubMult=clamp(.91+rating*.045+Math.min(years,6)*.045,.80,1.45);
  const playerMult=clamp(clubMult+.08+Math.max(0,rating)*.018,.92,1.70);
  const middleMult=(clubMult+playerMult)/2;
  const minimum=Number(levelMinimum)||0,protect=value=>{const beforeMinimum=applyForcedCutProtection(market*value,previous);return{salary:Math.max(beforeMinimum,minimum),floorApplied:minimum>beforeMinimum};};
  const club=protect(clubMult),player=protect(playerMult),middle=protect(middleMult);
  return{clubMult,playerMult,middleMult,winChance:clamp(47+rating*8+Math.min(years,6)*2,15,88),clubSalary:club.salary,playerSalary:player.salary,middleSalary:middle.salary,clubFloorApplied:club.floorApplied,playerFloorApplied:player.floorApplied,middleFloorApplied:middle.floorApplied,marketSalary:market,previousSalary:previous,marketRating:rating,serviceYears:years,levelMinimum:minimum};
}
