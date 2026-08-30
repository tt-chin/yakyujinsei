import assert from'node:assert/strict';
import{classifyMarketInjury,INJURY_WEIGHTS,injuryMarketLimits,injurySalaryMultiplier,isRecentStar}from'../docs/src/engine/injury-market-policy.js';
import{calculateMarketRating}from'../docs/src/engine/salary-evaluation-policy.js';
import{buildMarketContext,createProofOffer}from'../docs/src/engine/market-policy.js';
assert.equal(classifyMarketInjury({seasonFactor:1}),'HEALTHY');assert.equal(classifyMarketInjury({seasonFactor:.8}),'MINOR');assert.equal(classifyMarketInjury({seasonFactor:.3}),'MAJOR');assert.equal(classifyMarketInjury({seasonFactor:0,skipMid:true}),'REHAB');
const h=[{year:1,payD:1},{year:2,payD:2},{year:3,payD:3}];for(const status of Object.keys(INJURY_WEIGHTS)){const r=calculateMarketRating(h,{marketInjury:status});assert.deepEqual(r.components.map(x=>x.rawWeight),INJURY_WEIGHTS[status]);}
assert.equal(calculateMarketRating(h.slice(1),{marketInjury:'MAJOR'}).components.reduce((s,x)=>s+x.normalizedWeight,0),1);
const star=[{year:1,payD:7,marketInjury:'HEALTHY'},{year:2,payD:8,marketInjury:'MINOR'}];assert.equal(isRecentStar(star),true);assert.equal(injurySalaryMultiplier('MAJOR',true),.82);assert.equal(injurySalaryMultiplier('MAJOR',false),.70);
assert.deepEqual(injuryMarketLimits('MAJOR',4),{offerAdjustment:-1,maxYears:3,preferProof:true});assert.deepEqual(injuryMarketLimits('REHAB',4),{offerAdjustment:-2,maxYears:2,preferProof:true});
assert.equal(buildMarketContext({marketSalary:100,marketInjury:'REHAB',history:star,baseOfferCount:3}).offerCount,1);const proof=createProofOffer({marketSalary:100,injuryMultiplier:.55,levelMinimum:60});assert.equal(proof.years,1);assert.equal(proof.annualSalary,60);assert.equal(proof.forcedCutProtectionApplied,false);
console.log('injury market policy tests passed');
