import assert from 'node:assert/strict';
import {seasonIncomeSnapshot,seasonContractSnapshot} from '../docs/src/ui/season-summary.js';

// Exact-year payment and contract fixtures; no growth, payment or RNG execution.
const state={year:2030,lastSalaryPaidYear:2030,yearOutsideIncome:80_000,careerEarnings:42_480_000};
const receipt={state,year:2030,payment:{year:2030,paid:10_000_000,incentive:{amount:200_000}}};
const income=seasonIncomeSnapshot(state,receipt,2030);
assert.deepEqual(income,{base:10_000_000,incentive:200_000,outside:80_000,lifetime:42_480_000,received:10_280_000});
const unchanged=structuredClone(state);
for(const [name,amount,type] of [['continuation',10_000_000,null],['promotion',120_000_000,'PROMOTION'],['demotion',10_000_000,null],['renewal',18_000_000,'RENEWAL'],['transfer',40_000_000,'OVERSEAS']]){
  const final={...state,year:2031,ct:{contractId:name,annualSchedule:[{year:2031,amount,paid:false}]},salaryDecisionHistory:type?[{decisionYear:2030,salaryYear:2031,decisionType:type,finalSalary:amount,reasonCodes:[]}]:[]};
  const before=structuredClone(final),result=seasonContractSnapshot(final,2030,income);
  assert.equal(result.salary,amount,name);assert.equal(result.change,amount-10_000_000,name+' compares to actual paid base');assert.deepEqual(final,before,name+' display is read-only');
  final.ct.annualSchedule[0].amount=999;assert.equal(result.salary,amount,name+' is a display snapshot');
}
assert.deepEqual(state,unchanged);
assert.equal(seasonIncomeSnapshot({...state,year:2031},receipt,2030),null,'never read a new year as old income');
assert.equal(seasonIncomeSnapshot(state,{...receipt,payment:{...receipt.payment,year:2029}},2030),null,'wrong-year receipt');
const absent={year:2031,currentSalary:999_999_999,lastSalaryDecision:{decisionYear:2030,salaryYear:2040,finalSalary:999},ct:null,salaryDecisionHistory:[{decisionYear:2028,salaryYear:2029,finalSalary:888}]};
assert.equal(seasonContractSnapshot(absent,2030,income).salary,null,'no current-salary or unrelated decision fallback');
assert.equal(seasonContractSnapshot({...absent,salaryDecisionHistory:[{decisionYear:2030,salaryYear:2031,finalSalary:0}]},2030,income).salary,0,'recorded zero is not missing');
assert.equal(seasonContractSnapshot({...state,ct:{annualSchedule:[{year:2031,amount:10_000_000}]}},2030,income).status,'unknown','uncompleted hand-off cannot seal an old salary');
assert.equal(seasonContractSnapshot(state,2030,income,{retired:true}).status,'retired');
assert.equal(seasonIncomeSnapshot({...state,yearOutsideIncome:undefined},{...receipt,state:{...state}},2030),null,'foreign owner receipt');
const missing={...state,yearOutsideIncome:undefined};
assert.equal(seasonIncomeSnapshot(missing,{...receipt,state:missing},2030).received,null,'missing income must not be silently treated as zero');
console.log('PASS season-summary: actual payment snapshots, continuation/promotion/demotion/renewal/transfer, missing/zero/retirement and exact-year isolation');
