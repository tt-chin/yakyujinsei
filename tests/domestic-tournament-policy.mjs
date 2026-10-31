import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  canPlayHighSchoolFall,
  canPlaySenbatsu,
  grantsSenbatsuEligibility,
  nextSenbatsuEligibleYear,
  qualificationResult,
  qualifiesForChampionship,
  qualifiesForCorporateJapan,
  qualifiesForUniversityJingu,
  tournamentResult,
} from '../docs/src/engine/domestic-tournament-policy.js';

const localResult = power => tournamentResult({ power, national: false, overall: 66 });
const nationalResult = power => tournamentResult({ power, national: true, overall: 66 });
const universityResult = (power, national = false) => tournamentResult({ power, national, overall: 99, pointMode: 'UNIVERSITY' });

const localChampion = localResult(58);
const localRunnerUp = localResult(52);
assert.equal(localChampion.result, '優勝');
assert.equal(localRunnerUp.result, '準優勝');
assert.equal(qualifiesForChampionship(localChampion), true);
assert.equal(qualifiesForChampionship(localRunnerUp), false);

// 高校の従来点数式を維持する。
assert.equal(localChampion.points, Math.min(10, 7 + Math.floor(66 / 22)));
assert.equal(localRunnerUp.points, Math.min(10, 5 + Math.floor(66 / 22)));
assert.equal(nationalResult(64).points, Math.min(10, 7 + Math.floor(66 / 22) + 1));

for (const [power, expectedResult, expectedPoints] of [
  [64, '優勝', 5], [58, '準優勝', 4], [52, 'ベスト4', 3], [46, 'ベスト8', 2], [45, '予選敗退', 1],
]) {
  const result = universityResult(power, true);
  assert.equal(result.result, expectedResult);
  assert.equal(result.points, expectedPoints);
  assert.ok(result.points >= 1 && result.points <= 5);
}
assert.equal(universityResult(100, true).points, 5, '総合能力や全国大会加算で5点を超えない');
assert.deepEqual(universityResult(58, true), universityResult(58, true), '同一入力の大会結果を再現する');

assert.equal(grantsSenbatsuEligibility(localChampion), true);
assert.equal(grantsSenbatsuEligibility(localRunnerUp), true);
assert.equal(grantsSenbatsuEligibility(localResult(46)), true);
assert.equal(grantsSenbatsuEligibility(localResult(40)), false);
assert.equal(grantsSenbatsuEligibility(localResult(39)), false);
assert.equal(nextSenbatsuEligibleYear(localResult(46), 2026), 2027);
assert.equal(nextSenbatsuEligibleYear(localResult(40), 2026), null);
assert.equal(canPlaySenbatsu(1, 2026, 2026), false);
assert.equal(canPlaySenbatsu(2, 2027, 2027), true);
assert.equal(canPlaySenbatsu(3, 2027, 2028), false, '使用済み資格を翌々年へ持ち越さない');
assert.equal(canPlayHighSchoolFall(1), true);
assert.equal(canPlayHighSchoolFall(2), true);
assert.equal(canPlayHighSchoolFall(3), false);

const autumnChampion = localChampion;
assert.equal(qualifiesForUniversityJingu(autumnChampion, 'DIRECT', null), true);
assert.equal(qualifiesForUniversityJingu(localRunnerUp, 'DIRECT', null), false);
assert.equal(qualifiesForUniversityJingu(autumnChampion, 'PLAYOFF', { isQualified: true }), true);
assert.equal(qualifiesForUniversityJingu(autumnChampion, 'PLAYOFF', { isQualified: false }), false);

const qualified = qualificationResult(58);
const eliminated = qualificationResult(57);
assert.deepEqual(qualified, { result: '代表資格獲得', isQualified: true, points: 0, amaD: 0, deemedGames: 1 });
assert.equal(eliminated.isQualified, false);
assert.equal(eliminated.points, 0);
assert.equal(qualifiesForCorporateJapan(localChampion, null, null), true);
assert.equal(qualifiesForCorporateJapan(localRunnerUp, localRunnerUp, qualified), true);
assert.equal(qualifiesForCorporateJapan(localRunnerUp, localRunnerUp, eliminated), false);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [game, amateurCareer, data, playerAbility] = await Promise.all([
  readFile(path.join(root, 'docs/src/engine/game.js'), 'utf8'),
  readFile(path.join(root, 'docs/src/engine/amateur-career.js'), 'utf8'),
  readFile(path.join(root, 'docs/src/data/jp-data.js'), 'utf8'),
  readFile(path.join(root, 'docs/src/engine/player-ability.js'), 'utf8'),
]);
assert.doesNotMatch(game, /includes\('優勝'\)/);
assert.doesNotMatch(amateurCareer, /includes\('優勝'\)/);
assert.match(playerAbility, /if\(isDice&&S\.stage!=='HS'&&keys\.length\)/);
assert.match(playerAbility, /touched\[mk\]\/tot>=0\.75/);
assert.match(playerAbility, /S\.samePick>=3&&!S\.traits\.combo/);
assert.match(playerAbility, /高校以外（大学・社会人・独立・プロ）の開幕前ダイスだけを集中育成判定へ使用/);
assert.match(game, /senbatsuEligibleYear:null/);
assert.match(amateurCareer, /S\.senbatsuEligibleYear=null/);
assert.match(amateurCareer, /pointMode:'UNIVERSITY'/);
assert.match(amateurCareer, /qualifierOnce\('U_JINGU_QUAL'/);
assert.match(amateurCareer, /qualifierOnce\('CORP_CITY_QUAL'/);
assert.match(amateurCareer, /qualifierOnce\('CORP_JAPAN_QUAL'/);
assert.equal((data.match(/"jinguRoute":"DIRECT"/g) || []).length, 10);
assert.equal((data.match(/"jinguRoute":"PLAYOFF"/g) || []).length, 15);

console.log('Domestic tournament policy checks passed.');
