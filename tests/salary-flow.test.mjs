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
assert.match(game, /salaryDueForYear\(S\.ct,S\.year\)/);assert.match(game,/contractContinuationForNextYear\(S\.ct,S\.year\)/);
assert.match(game, /markSalaryPaid\(S\.ct,S\.year\)/);
assert.match(game, /PRO_PLAYER_WITHOUT_CONTRACT/);
assert.match(game, /stage==='IND'.*salaryCandidate\(\{sourceLevel:'IND',targetLevel:'IND'/s);
assert.match(game, /S\.ct=null;if\(S\.lastSalaryPaidYear===S\.year\)/);

assert.match(game, /convertRatingBetweenLevels\(rating,sourceLevel,targetLevel,LV\)/);
assert.match(game, /let salaryDForContract=d=>d, salaryCandidate;/);
assert.match(game, /salaryCandidate=\(\{sourceLevel=S\.lv,targetLevel=S\.lv/);
assert.doesNotMatch(game, /const salaryCandidate=/);
assert.match(game, /salaryCandidate\(\{sourceLevel:fromLv,targetLevel:toLv/);
assert.match(game, /applyDemotionSalary\(fromLv,targetLevel\)/);
assert.match(game, /applyDemotionSalary=function\(fromLv,toLv\)\{const renewalRequired=contractNeedsRenewal\(S\.ct\);applyLevelSalary\(fromLv,toLv,false\);if\(renewalRequired\)markClubInitiatedRenewal\(1\);\}/);
assert.match(game, /if\(S\.skipMid\)\{if\(contractNeedsRenewal\(S\.ct\)\)markClubInitiatedRenewal\(1\);advance\(\);return;\}/);
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
assert.equal((game.match(/\bR\(/g) || []).length, 35);
assert.equal((game.match(/\bri\(/g) || []).length, 77);
// Event RNG now lives in applyEvent: one outcome and, only when needed, one target.
assert.equal((game.match(/\bchance\(/g) || []).length, 57);
assert.equal((game.match(/\bpick\(/g) || []).length, 23);

// v1.4.5: NPB復帰候補は表示額を契約へ引き継ぎ、候補表示でRNGを追加消費しない。
assert.match(game, /annualSalary=salaryCandidate\(\{sourceLevel:S\.lv,targetLevel:lv,contractMult:1\}\)\.annualSalary/);
assert.match(game, /signTo\('NPB',lv,rec\.teamId,ri\(1,3\),1,'RETURN',\{annualSalary\}\)/);
assert.doesNotMatch(game, /annualSalary=salaryCandidate\([^\n]*\b(?:R|ri|chance|pick)\s*\(/);

// 降格時と戦力外後の海外候補でも、表示時の計算はRNGを呼ばず、表示額をsignToへ渡す。
assert.match(game, /sourceLevel:S\.lv,targetLevel:'CPBL1',contractMult:1/);
assert.match(game, /sourceLevel:S\.lv,targetLevel:lv,contractMult:1/);
assert.match(game, /signTo\('CPBL','CPBL1'[^\n]*\{annualSalary\}/);
assert.match(game, /signTo\(org,lv,rec\.teamId,1,1,'RELEASE_RECONTRACT',\{annualSalary\}\)/);

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
assert.match(game,/contractType:'CONTROL'/);assert.match(game,/contractType:'ARBITRATION'/);assert.match(game,/proof\?'PROOF'/);
assert.match(game,/S\.serviceTime\.MLB\+\+/);assert.doesNotMatch(game,/S\.serviceTime\.MLB.*MINOR/);
assert.match(game,/careerBaseSalary:0/);assert.match(game,/careerIncentive:0/);assert.match(game,/yearlyIncentivePaid:\{\}/);assert.match(game,/lastFaMarket:null/);
assert.match(game,/generateBidJitters\(selected\.map\(x=>x\.team\.teamId\),R\)/);assert.match(game,/S\.lastFaMarket\?\.marketKey===key/);assert.match(game,/applyIncentivePayment/);
assert.match(game,/現契約を継続/);assert.match(game,/来季年俸/);assert.match(game,/契約残り/);assert.match(game,/年俸の再計算はありません/);assert.match(game,/今季の実績は次回の契約評価へ反映されます/);assert.doesNotMatch(game,/今季の好成績は次回の契約評価へ反映されます/);
assert.match(game,/floorApplied:contractType==='CONTROL'&&control\.floorApplied/);
console.log('Salary flow v1.4.5 checks passed.');
