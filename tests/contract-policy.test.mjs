import assert from 'node:assert/strict';
import { appendExtension, applyLevelMinimumToUnpaidSchedule, calculateScheduledBuyout, createContract, markSalaryPaid, normalizeContract, salaryDueForYear, transferContract } from '../docs/src/engine/contract-policy.js';

const base=createContract({contractId:'NPB:T1:2028:001',org:'NPB',teamId:'T1',signedYear:2028,startYear:2029,years:3,annualSalary:50_000_000,contractType:'NORMAL',signedMarketRating:5.25,positionMultiplierAtSigning:1.15,contractMultiplier:1.1});
assert.equal(base.schemaVersion,2);assert.equal(base.annualSchedule.length,3);assert.equal(base.guaranteedTotal,150_000_000);assert.equal(base.remainingYears,3);
const paid=markSalaryPaid(base,2029);assert.equal(paid.amount,50_000_000);assert.equal(paid.contract.remainingYears,2);assert.equal(paid.contract.paidTotal,50_000_000);assert.equal(paid.contract.remainingValue,100_000_000);assert.throws(()=>markSalaryPaid(paid.contract,2029),/CONTRACT_SALARY_ALREADY_PAID/);
const traded=transferContract(paid.contract,{org:'NPB',teamId:'T2'});assert.equal(traded.teamId,'T2');assert.deepEqual(traded.annualSchedule,paid.contract.annualSchedule);assert.deepEqual(traded.segments,paid.contract.segments);
const demoted=paid.contract;assert.deepEqual(demoted.annualSchedule,paid.contract.annualSchedule);
const promoted=applyLevelMinimumToUnpaidSchedule(paid.contract,60_000_000,2030);assert.equal(promoted.annualSchedule[0].amount,50_000_000);assert.equal(promoted.annualSchedule[1].amount,60_000_000);assert.equal(promoted.annualSchedule[2].amount,60_000_000);
const extended=appendExtension(paid.contract,{signedYear:2029,startYear:2030,years:3,annualSalary:65_000_000,contractType:'EXTENSION'});assert.deepEqual(extended.annualSchedule.slice(0,3),paid.contract.annualSchedule);assert.equal(extended.annualSchedule[3].year,2032);assert.equal(extended.segments.length,2);assert.equal(extended.guaranteedTotal,345_000_000);
assert.equal(calculateScheduledBuyout(paid.contract,.7).buyoutAmount,70_000_000);assert.equal(calculateScheduledBuyout(paid.contract,1).buyoutAmount,100_000_000);
const legacy=normalizeContract({yrs:2,mult:1,annualSalary:12_000_000,org:'NPB',teamId:'T1'},{currentYear:2030,currentSalary:9_000_000});assert.equal(legacy.schemaVersion,2);assert.deepEqual(legacy.annualSchedule.map(x=>x.year),[2030,2031]);assert.equal(legacy.guaranteedTotal,24_000_000);
const rookie=createContract({contractId:'R',org:'NPB',teamId:'T1',signedYear:2028,startYear:2028,years:2,annualSalary:16_000_000,contractType:'ROOKIE'});assert.equal(rookie.annualSalary,16_000_000);assert.equal(rookie.guaranteedTotal,32_000_000);
let ended=markSalaryPaid(markSalaryPaid(rookie,2028).contract,2029).contract;assert.equal(ended.annualSalary,0);assert.equal(ended.remainingYears,0);assert.equal(salaryDueForYear(ended,2030).contractEnded,true);
console.log('contract policy tests passed');
