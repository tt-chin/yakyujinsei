import assert from 'node:assert/strict';
import { appendSalaryDecision, buildSalaryDecision, deriveSalaryReasonCodes, salaryReasonLabel } from '../docs/src/engine/salary-explanation-policy.js';

const base={decisionYear:2027,salaryYear:2028,decisionType:'PROMOTION',sourceLevel:'NPB2',targetLevel:'NPB1',previousSalary:12_000_000,finalSalary:18_000_000,sourceMarketRating:5.2,convertedMarketRating:-0.8,baseSalary:16_000_000,contractMultiplier:1,positionMultiplier:1.05,decreaseProtectionApplied:true,marketComponents:[{year:2027,payD:6,normalizedWeight:1,contribution:6}],currentEvaluation:{baseD:3.2,performanceAdjustment:1.4,workloadAdjustment:.3,awardAdjustment:.35,payD:5.25,source:'ACTUAL_PERFORMANCE'}};
const raised=buildSalaryDecision(base);
assert.equal(raised.changeAmount,6_000_000);assert.equal(raised.changeRate,.5);
assert.ok(raised.reasonCodes.includes('STRONG_PERFORMANCE'));assert.ok(raised.reasonCodes.includes('FULL_WORKLOAD'));assert.ok(raised.reasonCodes.includes('AWARD_BONUS'));assert.ok(raised.reasonCodes.includes('LEVEL_PAR_DOWNWARD_CONVERSION'));assert.ok(raised.reasonCodes.includes('PREMIUM_POSITION'));assert.ok(raised.reasonCodes.includes('NO_DECREASE_PROTECTION'));assert.ok(raised.reasonCodes.includes('ONE_YEAR_MARKET_SAMPLE'));
const lowered=deriveSalaryReasonCodes({...base,currentEvaluation:{performanceAdjustment:-.75,workloadAdjustment:-.5,awardAdjustment:0},sourceMarketRating:2,convertedMarketRating:3,positionMultiplier:.9,contractMultiplier:.8,decreaseProtectionApplied:false,marketComponents:[{},{}]});
assert.ok(lowered.includes('POOR_PERFORMANCE'));assert.ok(lowered.includes('LIMITED_WORKLOAD'));assert.ok(lowered.includes('LEVEL_PAR_UPWARD_CONVERSION'));assert.ok(lowered.includes('DH_DISCOUNT'));assert.ok(lowered.includes('CONTRACT_DISCOUNT'));
assert.equal(buildSalaryDecision({...base,previousSalary:0}).changeRate,null);
assert.equal(new Set(deriveSalaryReasonCodes({...base,positionMultiplier:1.2,contractMultiplier:1.2})).size,deriveSalaryReasonCodes({...base,positionMultiplier:1.2,contractMultiplier:1.2}).length);
assert.equal(salaryReasonLabel('UNKNOWN_CODE'),'その他の契約条件');
let history=[];for(let i=0;i<12;i++)history=appendSalaryDecision(history,buildSalaryDecision({...base,salaryYear:2020+i,decisionYear:2019+i,decisionType:'RENEWAL'}));
assert.equal(history.length,10);history=appendSalaryDecision(history,buildSalaryDecision({...base,salaryYear:2031,decisionYear:2030,decisionType:'RENEWAL',finalSalary:99}));assert.equal(history.length,10);assert.equal(history.at(-1).finalSalary,99);
console.log('salary explanation policy tests passed');
