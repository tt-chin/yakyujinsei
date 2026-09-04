import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  contractSalaryUpdate,
  convertRatingBetweenLevels,
  promotionSalaryUpdate,
  salaryAwardBonus,
  salaryEvaluationD,
} from '../docs/src/engine/salary-promotion-policy.js';

const salaryFor = (level, lastD) => {
  const m = {
    NPB_DEV: [3_000_000, 0, 0, 3_000_000, 5_000_000], NPB2: [5_000_000, 300_000, 0, 5_000_000, 16_000_000], NPB1: [16_000_000, 4_000_000, 3_000_000, 16_000_000, 600_000_000],
    KBO2: [8_000_000, 400_000, 0, 8_000_000, 30_000_000], KBO1: [40_000_000, 8_000_000, 2_000_000, 40_000_000, 1_500_000_000],
    CPBL2: [4_000_000, 200_000, 0, 4_000_000, 12_000_000], CPBL1: [12_000_000, 3_000_000, 800_000, 12_000_000, 400_000_000],
    R: [3_000_000, 0, 0, 3_000_000, 3_000_000], A1: [4_000_000, 0, 0, 4_000_000, 4_000_000], A2: [6_000_000, 0, 0, 6_000_000, 6_000_000],
    A3: [10_000_000, 500_000, 0, 10_000_000, 30_000_000], MLB: [120_000_000, 30_000_000, 12_000_000, 120_000_000, 6_000_000_000],
  }[level];
  const p = Math.max(0, Math.floor(lastD));
  const star = Math.max(0, p - 7);
  return Math.max(m[3], Math.min(m[4], m[0] + p * m[1] + star * star * m[2]));
};

// v1.4.5越境回帰: NPB一軍→CPBL一軍はpar差を1回だけ適用し、現契約年俸を評価に混ぜない。
const crossBorderLevels = { NPB1: { par: 58 }, CPBL1: { par: 48 } };
assert.equal(convertRatingBetweenLevels(6, 'NPB1', 'CPBL1', crossBorderLevels), 16);
assert.equal(convertRatingBetweenLevels(6, 'CPBL1', 'NPB1', crossBorderLevels), -4);
const currentFixedSalary = 5_000_000;
const newMarketSalary = salaryFor('CPBL1', convertRatingBetweenLevels(6, 'NPB1', 'CPBL1', crossBorderLevels));
assert.equal(newMarketSalary, 124_800_000);
assert.notEqual(newMarketSalary, currentFixedSalary);

// Test 1: NPB二軍で年俸1,600万円の選手が、評価3で一軍昇格しても減俸されない。
const npbCandidate = salaryFor('NPB1', 3);
const npb = promotionSalaryUpdate(16_000_000, npbCandidate, {
  yrs: 2, remainingYears: 2, annualSalary: 16_000_000,
  totalValue: 32_000_000, contractType: 'ROOKIE',
});
assert.ok(npb.currentSalary >= 16_000_000);
assert.ok(npb.currentSalary >= npbCandidate);
assert.equal(npb.currentSalary, 28_000_000);

// Test 1追加: 延長係数は最終額へ反映し、球団主導延長では減俸させない。
const extensionHonors = ['2032 NPB最優秀投手賞'];
assert.equal(salaryAwardBonus(extensionHonors, 2032), 2);
assert.equal(salaryEvaluationD(6, extensionHonors, 2032), 8);
const extensionCandidate = Math.round(salaryFor('NPB1', 8) * 1.34 / 10_000) * 10_000;
const extension = contractSalaryUpdate(64_000_000, extensionCandidate, { yrs: 2, remainingYears: 2, mult: 1.34 }, true);
assert.equal(extension.currentSalary, 68_340_000);
assert.equal(extension.contract.annualSalary, 68_340_000);
assert.equal(extension.contract.totalValue, 136_680_000);

// 球団主導更新は候補額が低くても現年俸を維持する。
assert.equal(contractSalaryUpdate(64_000_000, 53_600_000, null, true).currentSalary, 64_000_000);

// Test 4: FAオファーなし等、明示的に減俸可能な契約は下限保証を適用しない。
assert.equal(contractSalaryUpdate(64_000_000, 25_200_000, null, false).currentSalary, 25_200_000);

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

// Test 5: 先発・中継ぎ・抑え・野手の主要タイトルを同じ上限付き加点で評価する。
for (const honor of ['最優秀投手賞', 'NPB最優秀中継ぎ', 'NPB最多セーブ', 'NPB本塁打王']) {
  assert.ok(salaryAwardBonus([`2032 ${honor}`], 2032) >= 1, honor);
}
assert.equal(salaryAwardBonus(['2032 NPB年間MVP', '2032 NPB本塁打王', '2032 NPB打点王'], 2032), 3);
assert.equal(salaryAwardBonus(['2031 NPB年間MVP'], 2032), 0);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = await readFile(path.join(root, 'docs/src/engine/game.js'), 'utf8');
assert.doesNotMatch(game, /次年度年俸：オフシーズン確定後/);
assert.match(game, /今季支給年俸：<b class="hl">\$\{fmtMoney\(paid\)\}<\/b>｜出来高：/);
assert.match(game, /card\('info','来季年俸決定',`所属先の確定に伴い、来季の年俸は/);
assert.match(game, /\$\{preventDecrease\?'昇格後の最低保証を確認':'降格後も現契約を維持'\}し、来季の年俸は/);
assert.doesNotMatch(game, /次年度年俸：\$\{fmtMoney\(S\.currentSalary\)\}/);
assert.match(game, /const fromLv=S\.lv;\s*S\.lv=to; applyPromotionSalary\(fromLv,to\);/);
assert.match(game, /Object\.values\(PATHS\)\.some\(path=>path\.includes\(fromLv\)&&path\.includes\(toLv\)\)/);
assert.match(game, /applyLevelMinimumToUnpaidSchedule\(S\.ct,minimumSalary,S\.year\+1\)/);
assert.match(game, /if\(normalizeContract\(S\.ct\)\.remainingYears===0\)return/);
assert.match(game, /markClubInitiatedRenewal\(renewalYears\)/);
assert.match(game, /市場価×0\.90。減俸保護は適用されない/);

console.log('Salary promotion policy checks passed.');
