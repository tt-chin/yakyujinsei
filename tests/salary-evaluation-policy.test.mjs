import assert from 'node:assert/strict';

import { MARKET_BASELINES } from '../docs/src/data/salary-market-data.js';
import {
  appendSalaryEvaluation,
  buildIndependentLeagueFallbackEntry,
  buildSalaryEvaluationEntry,
  calculateHitterPerformanceAdjustment,
  calculateIndependentLeagueAwardBonus,
  calculateMarketAwardAdjustment,
  calculateMarketRating,
  calculatePayD,
  calculatePitcherPerformanceAdjustment,
  calculateRateStats,
  calculateSampleStatus,
  calculateWorkloadAdjustment,
  hasActualPerformanceData,
} from '../docs/src/engine/salary-evaluation-policy.js';
import { calculateSalaryCurve, salaryEvaluationD } from '../docs/src/engine/salary-promotion-policy.js';
import { convertRatingBetweenLevels } from '../docs/src/engine/salary-promotion-policy.js';

assert.deepEqual(calculateRateStats('P', { IP: 180, ER: 60, H: 150, BB: 50 }), { ERA: 3, WHIP: 200 / 180 });
assert.deepEqual(calculateRateStats('P', { IP: 0, ER: 1, H: 1, BB: 1 }), { ERA: 0, WHIP: 0 });
assert.deepEqual(calculateRateStats('H', { PA: 600, AB: 540, H: 162, BB: 60, SLG: .5 }), { AVG: .3, OBP: .37, SLG: .5, OPS: .87 });

assert.equal(calculateSampleStatus({ playerType: 'H', stats: { PA: 400 }, gamesInLevel: 143 }).sampleStatus, 'FULL');
assert.equal(calculateSampleStatus({ playerType: 'P', role: 'SP', stats: { IP: 60 }, gamesInLevel: 143 }).sampleStatus, 'PARTIAL');
assert.equal(calculateSampleStatus({ playerType: 'P', role: 'RP', stats: { G: 10 }, gamesInLevel: 143 }).sampleStatus, 'INSUFFICIENT');
assert.equal(calculateWorkloadAdjustment(0), -1);
assert.equal(calculateWorkloadAdjustment(1.5), .75);
assert.equal(calculatePitcherPerformanceAdjustment({ era: 4, whip: 1.32, baseline: MARKET_BASELINES.NPB1, sampleStatus: 'FULL' }), 0);
assert.equal(calculateHitterPerformanceAdjustment({ avg: .255, ops: .72, baseline: MARKET_BASELINES.NPB1, sampleStatus: 'FULL' }), 0);
assert.equal(calculatePitcherPerformanceAdjustment({ era: 0, whip: 0, baseline: MARKET_BASELINES.NPB1, sampleStatus: 'INSUFFICIENT' }), 0);
assert.equal(calculateMarketAwardAdjustment(['2030 年間MVP', '2030 年間MVP', '2030 本塁打王', '2029 沢村賞'], 2030), 1.1);
assert.equal(calculateMarketAwardAdjustment(['2030 年間MVP', '2030 沢村賞', '2030 本塁打王', '2030 打点王'], 2030), 1.5);
assert.equal(calculateMarketAwardAdjustment(['2030 首位打者', '2030 本塁打王', '2030 打点王', '2030 三冠王'], 2030), 1.05, '三冠王文字列は追加加点しない');
assert.equal(calculatePayD({ baseD: 25, performanceAdjustment: 2.5, workloadAdjustment: .75, awardAdjustment: 1.5 }), 29.75);

const one = calculateMarketRating([{ year: 2030, payD: 10 }]);
assert.equal(one.marketRating, 10);
assert.equal(one.components[0].normalizedWeight, 1);
const two = calculateMarketRating([{ year: 2029, payD: 10 }, { year: 2031, payD: 20 }]);
assert.equal(two.marketRating, 16.67);
assert.deepEqual(two.components.map(x => +x.normalizedWeight.toFixed(4)), [.3333, .6667]);
const three = calculateMarketRating([{ year: 2028, payD: 10 }, { year: 2029, payD: 20 }, { year: 2030, payD: 30 }]);
assert.equal(three.marketRating, 25);
assert.deepEqual(three.components.map(x => x.rawWeight), [.1, .3, .6]);
assert.deepEqual(appendSalaryEvaluation([{ year: 2028, payD: 1 }, { year: 2029, payD: 2 }, { year: 2030, payD: 3 }], { year: 2029, payD: 20 }), [{ year: 2028, payD: 1 }, { year: 2029, payD: 20 }, { year: 2030, payD: 3 }]);
assert.deepEqual(appendSalaryEvaluation([{ year: 2027, payD: 0 }, { year: 2028, payD: 1 }, { year: 2029, payD: 2 }], { year: 2030, payD: 3 }).map(x => x.year), [2028, 2029, 2030]);

const curve = { base: 16_000_000, linear: 4_000_000, quadratic: 3_000_000, min: 16_000_000, max: 600_000_000 };
assert.equal(calculateSalaryCurve(7.5, curve), 46_750_000);
assert.notEqual(calculateSalaryCurve(7.5, curve), calculateSalaryCurve(7, curve));
assert.ok(calculateSalaryCurve(7.1, curve) > calculateSalaryCurve(6.9, curve));

const hitterStats = { G: 143, PA: 600, AB: 540, H: 162, BB: 60, SLG: .5 };
const actual = buildSalaryEvaluationEntry({ year: 2030, age: 24, level: 'NPB1', org: 'NPB', position: 'SS', playerType: 'H', baseD: 8, stats: hitterStats, gamesInLevel: 143, baseline: MARKET_BASELINES.NPB1, honors: [] });
assert.equal(actual.source, 'ACTUAL_PERFORMANCE');
assert.equal(actual.actualPerformanceAvailable, true);
assert.ok(actual.payD > 8);
assert.equal(hasActualPerformanceData('H', { G: 0, PA: 0, AB: 0, H: 0, BB: 0 }), true, '0打席は欠損ではない');
assert.equal(hasActualPerformanceData('H', { G: 0, AB: 0, H: 0, BB: 0 }), false);
assert.equal(hasActualPerformanceData('P', { G: 0, IP: 0, ER: 0, H: 0, BB: 0 }), true, '0投球回は欠損ではない');

for (const level of ['NPB_DEV', 'NPB2', 'NPB1', 'KBO2', 'KBO1', 'CPBL2', 'CPBL1', 'R', 'A1', 'A2', 'A3', 'MLB']) {
  const entry = buildSalaryEvaluationEntry({ year: 2030, age: 24, level, org: level.startsWith('NPB') ? 'NPB' : 'PRO', role: 'SP', playerType: 'P', baseD: 5, stats: { G: 25, IP: 140, ER: 50, H: 120, BB: 40 }, gamesInLevel: 143, baseline: MARKET_BASELINES[level], honors: [] });
  assert.equal(entry.source, 'ACTUAL_PERFORMANCE', `${level}は実績評価`);
}

// 固定成績だけを使う平衡マトリクス。評価処理がRNGに依存しないことも同時に保証する。
const pitcherCases = [
  { ER: 80, H: 180, BB: 70 }, { ER: 60, H: 150, BB: 50 }, { ER: 40, H: 120, BB: 35 },
];
const hitterCases = [
  { H: 120, BB: 35, SLG: .34 }, { H: 145, BB: 50, SLG: .43 }, { H: 175, BB: 70, SLG: .55 },
];
const pitcherMatrix = (level, role, count = 3) => Array.from({ length: count }, (_, index) => {
  const values = pitcherCases[index % pitcherCases.length];
  return buildSalaryEvaluationEntry({ year: 2030, age: 27, level, org: 'PRO', role, playerType: 'P', baseD: 8, stats: { G: role === 'SP' ? 28 : 60, IP: role === 'SP' ? 180 : 65, ...values }, gamesInLevel: level === 'MLB' ? 162 : 143, baseline: MARKET_BASELINES[level], honors: [] });
});
const hitterMatrix = (level, count = 3) => Array.from({ length: count }, (_, index) => {
  const values = hitterCases[index % hitterCases.length];
  return buildSalaryEvaluationEntry({ year: 2030, age: 27, level, org: 'PRO', playerType: 'H', baseD: 8, stats: { G: 140, PA: 600, AB: 540, ...values }, gamesInLevel: level === 'MLB' ? 162 : 143, baseline: MARKET_BASELINES[level], honors: [] });
});
const npbStarters = pitcherMatrix('NPB1', 'SP');
assert.ok(npbStarters[0].payD < npbStarters[1].payD && npbStarters[1].payD < npbStarters[2].payD);
assert.equal(pitcherMatrix('NPB1', 'CL').length + pitcherMatrix('NPB1', 'MR').length, 6);
assert.equal(hitterMatrix('NPB1', 9).length, 9);
assert.equal(pitcherMatrix('MLB', 'SP', 6).length, 6);
assert.equal(hitterMatrix('MLB', 6).length, 6);
assert.equal(pitcherMatrix('KBO1', 'SP', 3).length + hitterMatrix('KBO1', 3).length, 6);
assert.equal(pitcherMatrix('CPBL1', 'SP', 3).length + hitterMatrix('CPBL1', 3).length, 6);
const goodOnce = calculateMarketRating([{ year: 2028, payD: 4 }, { year: 2029, payD: 4 }, { year: 2030, payD: 10 }]).marketRating;
const goodTwice = calculateMarketRating([{ year: 2028, payD: 4 }, { year: 2029, payD: 10 }, { year: 2030, payD: 10 }]).marketRating;
assert.ok(goodTwice > goodOnce);
assert.ok(calculateMarketRating([{ year: 2028, payD: 10 }, { year: 2029, payD: 10 }, { year: 2030, payD: 1 }]).marketRating > 1);
const tinySample = buildSalaryEvaluationEntry({ year: 2030, age: 27, level: 'NPB1', org: 'NPB', playerType: 'H', baseD: 1, stats: { G: 1, PA: 4, AB: 3, H: 3, BB: 1, SLG: 2 }, gamesInLevel: 143, baseline: MARKET_BASELINES.NPB1, honors: [] });
assert.equal(tinySample.performanceAdjustment, 0);
const levelPars = { NPB2: { par: 52 }, NPB1: { par: 58 }, A3: { par: 56 }, MLB: { par: 63 } };
for (const rating of [0, 2, 4, 6, 8, 10]) {
  assert.equal(convertRatingBetweenLevels(rating, 'NPB2', 'NPB1', levelPars), rating - 6);
  assert.equal(convertRatingBetweenLevels(rating, 'A3', 'MLB', levelPars), rating - 7);
}

const indBase = buildIndependentLeagueFallbackEntry({ year: 2030, age: 22, level: 'IND', baseD: 6.25, legacyRating: 99, tournamentResults: [] });
assert.equal(indBase.payD, 6.25);
assert.equal(indBase.seasonPayD, 6.25);
assert.equal(indBase.source, 'LEGACY_NO_INDIVIDUAL_STATS');
assert.equal(indBase.actualPerformanceAvailable, false);
assert.equal(indBase.workloadAvailable, false);
assert.equal(indBase.fallbackReason, 'INDIVIDUAL_STATS_NOT_IMPLEMENTED');
for (const forbidden of ['PA', 'IP', 'ERA', 'WHIP', 'OPS', 'statSummary']) assert.equal(Object.hasOwn(indBase, forbidden), false, `${forbidden}を捏造しない`);

const legacy = salaryEvaluationD(4, ['2030 年間MVP'], 2030);
const indLegacy = buildIndependentLeagueFallbackEntry({ year: 2030, age: 22, legacyRating: legacy, tournamentResults: [] });
assert.equal(indLegacy.baseD, legacy);
assert.equal(indLegacy.payD, legacy);
assert.equal(calculateIndependentLeagueAwardBonus([{ key: 'IND_REGULAR', isChampion: true }, { key: 'IND_CHAMP', isChampion: true }]), .5);
assert.equal(calculateIndependentLeagueAwardBonus([{ key: 'IND_CHAMP', resultIndex: 1 }]), .15);
assert.equal(calculateIndependentLeagueAwardBonus([{ result: '優勝', html: '独立リーグ優勝' }]), 0, '表示文字から推測しない');
assert.equal(buildIndependentLeagueFallbackEntry({ year: 2030, age: 22, baseD: 25.8, tournamentResults: [{ key: 'IND_REGULAR', isChampion: true }, { key: 'IND_CHAMP', isChampion: true }] }).payD, 26, '大会加算後は上限26');

const indHistory = calculateMarketRating([
  { year: 2028, payD: 4, source: 'LEGACY_NO_INDIVIDUAL_STATS' },
  { year: 2029, payD: 6, source: 'LEGACY_NO_INDIVIDUAL_STATS' },
  { year: 2030, payD: 8, source: 'LEGACY_NO_INDIVIDUAL_STATS' },
]);
assert.equal(indHistory.marketRating, 7);
assert.deepEqual(indHistory.components.map(x => x.rawWeight), [.1, .3, .6]);

console.log('salary evaluation policy tests passed');
