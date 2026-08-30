import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = await readFile(path.join(root, 'docs/src/engine/game.js'), 'utf8');
const evaluationPolicy = await readFile(path.join(root, 'docs/src/engine/salary-evaluation-policy.js'), 'utf8');
const contractPolicy = await readFile(path.join(root, 'docs/src/engine/contract-policy.js'), 'utf8');
const controlPolicy = await readFile(path.join(root, 'docs/src/engine/control-period-policy.js'), 'utf8');
const injuryPolicy = await readFile(path.join(root, 'docs/src/engine/injury-market-policy.js'), 'utf8');
const arbitrationPolicy = await readFile(path.join(root, 'docs/src/engine/arbitration-policy.js'), 'utf8');

assert.match(game, /lastSalaryPaidYear:null/);
assert.match(game, /salaryEvaluationHistory:\[\],lastSalaryEvaluation:null,lastSalaryDecision:null,salaryDecisionHistory:\[\]/);
assert.match(game, /salaryDueForYear\(S\.ct,S\.year\)/);
assert.match(game, /markSalaryPaid\(S\.ct,S\.year\)/);
assert.match(game, /PRO_PLAYER_WITHOUT_CONTRACT/);
assert.match(game, /stage==='IND'.*salaryCandidate\(\{sourceLevel:'IND',targetLevel:'IND'/s);
assert.match(game, /S\.ct=null;if\(S\.lastSalaryPaidYear===S\.year\)/);

assert.match(game, /convertRatingBetweenLevels\(rating,sourceLevel,targetLevel,LV\)/);
assert.match(game, /salaryCandidate\(\{sourceLevel:fromLv,targetLevel:toLv/);
assert.match(game, /applyDemotionSalary\(fromLv,targetLevel\)/);
assert.match(game, /const sourceLevel=S\.lv,sourceStage=S\.stage,sourceOrg=S\.org/);
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
assert.equal((game.match(/\bri\(/g) || []).length, 78);
assert.equal((game.match(/\bchance\(/g) || []).length, 62);
assert.equal((game.match(/\bpick\(/g) || []).length, 25);

assert.match(game, /S\.ct=fixedContract/);
assert.match(game, /createContract\(/);
assert.doesNotMatch(game, /S\.ct\.annualSalary=S\.currentSalary/);
assert.match(game, /applyLevelMinimumToUnpaidSchedule/);
assert.match(game, /transferContract/);
assert.match(game, /appendExtension/);

assert.match(game, /calculateScheduledBuyout\(S\.ct,rate\)/);
assert.doesNotMatch(game, /calculateLegacyContractBuyout/);
assert.doesNotMatch(game, /const yearly=Math\.round\(salaryFor\(S\.lv,S\.lastD\|\|0\)/);
assert.match(game, /S\.careerBuyout=\(S\.careerBuyout\|\|0\)\+result\.buyoutAmount/);
assert.match(game, /S\.ct=null;\s*S\.currentSalary=0/);

assert.match(game, /NPB_DEV:\{n:'NPB育成',par:35/);
assert.match(game, /NPB2:\{n:'NPB二軍',par:52/);
assert.match(game, /NPB1:\{n:'NPB一軍',par:58/);
assert.match(game, /A3:\{n:'3A',par:56/);
assert.match(game, /MLB:\{n:'メジャーリーグ',par:63/);

assert.doesNotMatch(contractPolicy, /\b(?:R|ri|chance|pick)\s*\(/);
assert.doesNotMatch(controlPolicy+injuryPolicy+arbitrationPolicy, /\b(?:R|ri|chance|pick)\s*\(/);
assert.equal((game.match(/chance\(terms\.winChance\)/g)||[]).length,1,'仲裁結果のRNGは選択後の1回だけ');
assert.match(game,/contractType:'CONTROL'/);assert.match(game,/contractType:'ARBITRATION'/);assert.match(game,/contractType:'PROOF'/);
assert.match(game,/S\.serviceTime\.MLB\+\+/);assert.doesNotMatch(game,/S\.serviceTime\.MLB.*MINOR/);
console.log('Salary flow v1.3.0 checks passed.');
