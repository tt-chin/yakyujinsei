import assert from 'node:assert/strict';

import {
  calculateLegacyContractBuyout,
  convertRatingBetweenLevels,
  migrateLegacySalaryState,
  recordAnnualSalaryPayment,
  roundToTenThousandYen,
  synchronizeContractSalary,
} from '../docs/src/engine/salary-promotion-policy.js';

const levels = {
  IND: { par: 35 },
  NPB_DEV: { par: 35 }, NPB2: { par: 52 }, NPB1: { par: 58 },
  KBO2: { par: 39 }, KBO1: { par: 50 },
  CPBL2: { par: 39 }, CPBL1: { par: 48 },
  R: { par: 43 }, A1: { par: 47 }, A2: { par: 51 }, A3: { par: 56 }, MLB: { par: 63 },
};

assert.equal(convertRatingBetweenLevels(8, 'NPB2', 'NPB1', levels), 2);
assert.equal(convertRatingBetweenLevels(8, 'A3', 'MLB', levels), 1);
assert.equal(convertRatingBetweenLevels(8.5, 'NPB1', 'NPB1', levels), 8.5);
assert.throws(
  () => convertRatingBetweenLevels(8, 'UNKNOWN', 'NPB1', levels),
  /UNKNOWN_LEVEL_FOR_RATING_CONVERSION/,
);

for (const [from, to] of [
  ['NPB_DEV', 'NPB2'], ['NPB2', 'NPB1'], ['KBO2', 'KBO1'],
  ['CPBL2', 'CPBL1'], ['R', 'A1'], ['A1', 'A2'], ['A2', 'A3'], ['A3', 'MLB'],
  ['NPB1', 'KBO1'], ['KBO1', 'CPBL1'], ['CPBL1', 'MLB'], ['MLB', 'NPB1'],
  ['IND', 'NPB_DEV'],
]) {
  assert.equal(convertRatingBetweenLevels(8, from, to, levels), 8 + levels[from].par - levels[to].par);
}

assert.equal(roundToTenThousandYen(12_345_678), 12_350_000);
assert.equal(roundToTenThousandYen(Number.NaN), 0);
assert.equal(roundToTenThousandYen(-100), 0);

const sourceContract = {
  yrs: 3, remainingYears: 2, annualSalary: 10_000_000,
  totalValue: 30_000_000, contractType: 'ROOKIE', mult: 1,
};
const synchronized = synchronizeContractSalary(sourceContract, 16_004_999);
assert.notEqual(synchronized, sourceContract);
assert.equal(sourceContract.annualSalary, 10_000_000);
assert.deepEqual(
  { yrs: synchronized.yrs, remainingYears: synchronized.remainingYears, annualSalary: synchronized.annualSalary, totalValue: synchronized.totalValue },
  { yrs: 2, remainingYears: 2, annualSalary: 16_000_000, totalValue: 32_000_000 },
);

const beforePayment = calculateLegacyContractBuyout({
  contract: synchronized, currentSalary: 99_000_000, currentYear: 2030,
  lastSalaryPaidYear: 2029, rate: 0.7,
});
assert.deepEqual(beforePayment, {
  annualSalary: 16_000_000,
  unpaidYears: 2,
  fullRemainingValue: 32_000_000,
  buyoutAmount: 22_400_000,
  currentSeasonPaid: false,
});

const afterPayment = calculateLegacyContractBuyout({
  contract: synchronized, currentSalary: 99_000_000, currentYear: 2030,
  lastSalaryPaidYear: 2030, rate: 1,
});
assert.deepEqual(afterPayment, {
  annualSalary: 16_000_000,
  unpaidYears: 1,
  fullRemainingValue: 16_000_000,
  buyoutAmount: 16_000_000,
  currentSeasonPaid: true,
});

const paid = recordAnnualSalaryPayment({ careerEarnings: 5_000_000, lastSalaryPaidYear: null }, 2030, 2_403_000);
assert.equal(paid.careerEarnings, 7_400_000);
assert.equal(paid.lastSalaryPaidYear, 2030);
assert.throws(() => recordAnnualSalaryPayment(paid, 2030, 2_400_000), /SALARY_ALREADY_PAID_FOR_YEAR/);

const migrated = migrateLegacySalaryState({
  year: 2030,
  currentSalary: 12_000_000,
  ct: { yrs: 2, contractType: 'ROOKIE' },
});
assert.equal(migrated.lastSalaryPaidYear, null);
assert.equal(migrated.careerBuyout, 0);
assert.equal(migrated.ct.annualSalary, 12_000_000);
assert.equal(migrated.ct.guaranteedTotal, 24_000_000);
assert.equal(migrated.ct.schemaVersion, 3);
assert.equal(migrated.ct.remainingYears, 2);
assert.deepEqual(migrated.salaryEvaluationHistory, []);
assert.equal(migrated.lastSalaryDecision, null);
assert.deepEqual(migrated.salaryDecisionHistory, []);
assert.equal(migrated.lastSalaryEvaluation, null);

const fullHistory=Array.from({length:25},(_,i)=>({salaryYear:2029+i,decisionType:'RENEWAL',finalSalary:12_000_000+i*10_000}));
const oldState={year:2054,salaryDecisionHistory:fullHistory,careerEarnings:123456789,stats:{NPB:{G:999}},log:[{y:2029,line:'保存済み成績'}]};
const fullMigration=migrateLegacySalaryState(oldState);
assert.deepEqual(fullMigration.salaryDecisionHistory,fullHistory);
assert.notEqual(fullMigration.salaryDecisionHistory,fullHistory);
assert.equal(fullMigration.salaryDecisionHistory[0].salaryYear,2029);
assert.equal(fullMigration.careerEarnings,oldState.careerEarnings);
assert.deepEqual(fullMigration.stats,oldState.stats);assert.deepEqual(fullMigration.log,oldState.log);
assert.deepEqual(migrateLegacySalaryState(fullMigration).salaryDecisionHistory,fullHistory);
const truncated=fullHistory.slice(-10);
assert.deepEqual(migrateLegacySalaryState({...oldState,salaryDecisionHistory:truncated}).salaryDecisionHistory,truncated);
for(const missing of [undefined,null,{}])assert.deepEqual(migrateLegacySalaryState({salaryDecisionHistory:missing}).salaryDecisionHistory,[]);

console.log('Salary policy migration checks passed.');
