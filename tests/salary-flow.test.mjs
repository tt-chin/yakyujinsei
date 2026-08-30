import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = await readFile(path.join(root, 'docs/src/engine/game.js'), 'utf8');
const evaluationPolicy = await readFile(path.join(root, 'docs/src/engine/salary-evaluation-policy.js'), 'utf8');

assert.match(game, /lastSalaryPaidYear:null/);
assert.match(game, /salaryEvaluationHistory:\[\],lastSalaryEvaluation:null/);
assert.match(game, /recordAnnualSalaryPayment\(S,S\.year,paid\)/);
assert.match(game, /recordAnnualSalaryPayment\(S,S\.year,pay\)/);
assert.match(game, /SALARY_ALREADY_PAID_FOR_YEAR|recordAnnualSalaryPayment/);
assert.match(game, /stage==='IND'.*salaryCandidate\(\{sourceLevel:'IND',targetLevel:'IND'/s);
assert.match(game, /S\.ct=null;S\.careerEarnings=payment\.careerEarnings/);

assert.match(game, /convertRatingBetweenLevels\(rating,sourceLevel,targetLevel,LV\)/);
assert.match(game, /salaryCandidate\(\{sourceLevel:fromLv,targetLevel:toLv/);
assert.match(game, /applyDemotionSalary\(fromLv,targetLevel\)/);
assert.match(game, /const sourceLevel=S\.lv,sourceStage=S\.stage/);
assert.match(game, /sourceLevel:sourceStage==='PRO'&&LV\[sourceLevel\]\?sourceLevel:lv/);
assert.match(game, /rating:sourceStage==='PRO'\?currentMarketRating\(\):0/);
assert.match(game, /recordSalaryEvaluation\(st\)/);
assert.match(game, /if\(S\.stage==='IND'\)recordIndependentSalaryEvaluation\(results\)/);
assert.match(game, /LEGACY_RATING_FALLBACK/);
assert.match(evaluationPolicy, /LEGACY_NO_INDIVIDUAL_STATS/);
assert.doesNotMatch(game, /Math\.floor\(Number\(d\)\|\|0\)/);
assert.equal((game.match(/baseSalary\*contractMult\*positionMult/g) || []).length, 1, '守備位置倍率は候補年俸へ一度だけ適用');
assert.doesNotMatch(evaluationPolicy, /\b(?:R|ri|chance|pick)\s*\(/);
assert.equal((game.match(/\bR\(/g) || []).length, 36);
assert.equal((game.match(/\bri\(/g) || []).length, 80);
assert.equal((game.match(/\bchance\(/g) || []).length, 61);
assert.equal((game.match(/\bpick\(/g) || []).length, 25);

assert.match(game, /S\.ct=synchronizeContractSalary\(S\.ct,S\.currentSalary\)/);
assert.match(game, /S\.currentSalary=candidate\.annualSalary/);
assert.doesNotMatch(game, /S\.ct\.annualSalary=S\.currentSalary/);
assert.match(game, /pendingOffseasonSalary=!S\.ct\|\|Math\.max\(0,Number\(S\.ct\.remainingYears\?\?S\.ct\.yrs\)\|\|0\)<=1/);

assert.match(game, /calculateLegacyContractBuyout\(\{contract:S\.ct,currentSalary:S\.currentSalary/);
assert.doesNotMatch(game, /const yearly=Math\.round\(salaryFor\(S\.lv,S\.lastD\|\|0\)/);
assert.match(game, /S\.careerBuyout=\(S\.careerBuyout\|\|0\)\+result\.buyoutAmount/);
assert.match(game, /S\.ct=null;\s*S\.currentSalary=0/);

assert.match(game, /NPB_DEV:\{n:'NPB育成',par:35/);
assert.match(game, /NPB2:\{n:'NPB二軍',par:52/);
assert.match(game, /NPB1:\{n:'NPB一軍',par:58/);
assert.match(game, /A3:\{n:'3A',par:56/);
assert.match(game, /MLB:\{n:'メジャーリーグ',par:63/);

console.log('Salary flow v1.1.0 checks passed.');
