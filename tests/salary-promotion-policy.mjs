import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import { promotionSalaryUpdate } from '../docs/src/engine/salary-promotion-policy.js';

const salaryFor = (level, lastD) => {
  const base = {
    NPB_DEV: 3_000_000, NPB2: 5_000_000, NPB1: 16_000_000,
    KBO2: 8_000_000, KBO1: 40_000_000,
    CPBL2: 4_000_000, CPBL1: 12_000_000,
    R: 3_000_000, A1: 4_000_000, A2: 6_000_000,
    A3: 10_000_000, MLB: 120_000_000,
  }[level];
  const step = { NPB1: 4_000_000 }[level] || 0;
  return base + Math.max(0, Math.floor(lastD)) * step;
};

// Test 1: NPB二軍で年俸1,600万円の選手が、評価3で一軍昇格しても減俸されない。
const npbCandidate = salaryFor('NPB1', 3);
const npb = promotionSalaryUpdate(16_000_000, npbCandidate, {
  yrs: 2, remainingYears: 2, annualSalary: 16_000_000,
  totalValue: 32_000_000, contractType: 'ROOKIE',
});
assert.ok(npb.currentSalary >= 16_000_000);
assert.ok(npb.currentSalary >= npbCandidate);
assert.equal(npb.currentSalary, 28_000_000);

// Test 2: 現行PATHSに存在するすべての同一組織内昇格で、昇格前年俸を下回らない。
const promotions = [
  ['NPB_DEV', 'NPB2'], ['NPB2', 'NPB1'], ['KBO2', 'KBO1'],
  ['CPBL2', 'CPBL1'], ['R', 'A1'], ['A1', 'A2'],
  ['A2', 'A3'], ['A3', 'MLB'],
];
for (const [, to] of promotions) {
  const before = 16_000_000;
  const result = promotionSalaryUpdate(before, salaryFor(to, 3), null);
  assert.ok(result.currentSalary >= before, `${to}昇格後に減俸しない`);
}

// Test 3: 年額と契約総額を同期し、契約年数・種類を変更しない。
assert.equal(npb.contract.annualSalary, npb.currentSalary);
assert.equal(npb.contract.totalValue, npb.currentSalary * 2);
assert.equal(npb.contract.yrs, 2);
assert.equal(npb.contract.remainingYears, 2);
assert.equal(npb.contract.contractType, 'ROOKIE');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = await readFile(path.join(root, 'docs/src/engine/game.js'), 'utf8');
assert.match(game, /次年度年俸：オフシーズン確定後/);
assert.doesNotMatch(game, /次年度年俸：\$\{fmtMoney\(S\.currentSalary\)\}/);
assert.match(game, /const fromLv=S\.lv;\s*S\.lv=to; applyPromotionSalary\(fromLv,to\);/);
assert.match(game, /Object\.values\(PATHS\)\.some\(path=>path\.includes\(fromLv\)&&path\.includes\(toLv\)\)/);
assert.match(game, /salaryFor\(toLv,S\.lastD\|\|0\)\*\(S\.ct\?\.mult\|\|1\)\*dpMult\(\)/);

console.log('Salary promotion policy checks passed.');
