import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = await readFile(path.join(root, 'docs/src/engine/game.js'), 'utf8');
const seasonPayment = await readFile(path.join(root, 'docs/src/engine/season-payment-policy.js'), 'utf8');
const seasonStats = await readFile(path.join(root, 'docs/src/engine/season-stats.js'), 'utf8');
const internationalTournament = await readFile(path.join(root, 'docs/src/engine/international-tournament.js'), 'utf8');
const playerInjury = await readFile(path.join(root, 'docs/src/engine/player-injury.js'), 'utf8');
const playerAbility = await readFile(path.join(root, 'docs/src/engine/player-ability.js'), 'utf8');
const playerRomance = await readFile(path.join(root, 'docs/src/engine/player-romance.js'), 'utf8');
const seasonEvents = await readFile(path.join(root, 'docs/src/engine/season-events.js'), 'utf8');
const seasonAwards = await readFile(path.join(root, 'docs/src/engine/season-awards.js'), 'utf8');
const careerRetirement = await readFile(path.join(root, 'docs/src/engine/career-retirement.js'), 'utf8');
const amateurCareer = await readFile(path.join(root, 'docs/src/engine/amateur-career.js'), 'utf8');
const careerContract = await readFile(path.join(root, 'docs/src/engine/career-contract.js'), 'utf8');
const careerMovement = await readFile(path.join(root, 'docs/src/engine/career-movement.js'), 'utf8');
const gameAndModules = game + '\n' + careerContract + '\n' + careerMovement;
const evaluationPolicy = await readFile(path.join(root, 'docs/src/engine/salary-evaluation-policy.js'), 'utf8');
const contractPolicy = await readFile(path.join(root, 'docs/src/engine/contract-policy.js'), 'utf8');
const controlPolicy = await readFile(path.join(root, 'docs/src/engine/control-period-policy.js'), 'utf8');
const injuryPolicy = await readFile(path.join(root, 'docs/src/engine/injury-market-policy.js'), 'utf8');
const arbitrationPolicy = await readFile(path.join(root, 'docs/src/engine/arbitration-policy.js'), 'utf8');

assert.match(game, /lastSalaryPaidYear:null/);
assert.match(game, /salaryEvaluationHistory:\[\],lastSalaryEvaluation:null,lastSalaryDecision:null,salaryDecisionHistory:\[\]/);
assert.match(seasonPayment, /salaryDueForYear\(contract,state\.year\)/);assert.match(game,/contractContinuationForNextYear\(S\.ct,S\.year\)/);
assert.match(seasonPayment, /markSalaryPaid\(contract,state\.year\)/);
assert.match(careerMovement, /PRO_PLAYER_WITHOUT_CONTRACT/);
assert.match(game, /stage==='IND'.*salaryCandidate\(\{sourceLevel:'IND',targetLevel:'IND'/s);
assert.match(game, /S\.ct=null;if\(S\.lastSalaryPaidYear===S\.year\)/);

assert.match(careerContract, /convertRatingBetweenLevels\(rating,sourceLevel,targetLevel,LV\)/);
assert.match(careerContract, /const salaryDForContract=d=>\{const S=getState\(\);return \(S\.salaryEvaluationHistory/);
assert.match(careerContract, /const salaryCandidateRule=\(\{sourceLevel=getState\(\)\.lv,targetLevel=getState\(\)\.lv/);
assert.doesNotMatch(gameAndModules, /const salaryCandidate=/);
assert.match(careerContract, /salaryCandidate\(\{sourceLevel:fromLv,targetLevel:toLv/);
assert.match(careerMovement, /applyDemotionSalary\(fromLv,targetLevel\)/);
assert.match(careerContract, /const applyDemotionSalary=function\(fromLv,toLv\)\{const S=getState\(\);const renewalRequired=contractNeedsRenewal\(S\.ct\);applyLevelSalary\(fromLv,toLv,false\);if\(renewalRequired\)markClubInitiatedRenewal\(1\);\}/);
assert.match(careerMovement, /if\(S\.skipMid\)\{if\(contractNeedsRenewal\(S\.ct\)\)markClubInitiatedRenewal\(1\);reportFlowOutcome\(\{kind:'REHAB_YEAR_COMPLETED'\}\);return;\}/);
assert.match(careerContract, /const sourceLevel=S\.lv,sourceStage=S\.stage,sourceOrg=S\.org/);
assert.match(careerContract, /sourceLevel:LV\[sourceLevel\]\?sourceLevel:lv/);
assert.match(careerContract, /rating:sourceStage==='PRO'\?currentMarketRating\(\):0/);
assert.match(game, /recordSalaryEvaluation\(entry\.st\)/);
assert.match(amateurCareer, /if\(S\.stage==='IND'\)recordIndependentSalaryEvaluation\(results\)/);
assert.match(careerContract, /LEGACY_RATING_FALLBACK/);
assert.match(evaluationPolicy, /LEGACY_NO_INDIVIDUAL_STATS/);
assert.doesNotMatch(gameAndModules, /Math\.floor\(Number\(d\)\|\|0\)/);
assert.equal((gameAndModules.match(/baseSalary\*\(cross\?1:contractMult\)\*positionMult/g) || []).length, 1, '守備位置倍率は候補年俸へ一度だけ適用');
assert.doesNotMatch(evaluationPolicy, /\b(?:R|ri|chance|pick)\s*\(/);
const journalBridge='captureAwardSlot(tx,id,p,()=>R(),()=>realState.rngState)';
assert.equal(seasonAwards.split(journalBridge).length,2,'one native Journal bridge, not a new independent draw');
assert.equal(game.split(journalBridge).length,1,'Journal bridge left game.js in phase 19');
// Phase 4-A deleted unreachable base bodies: R( -7 (35->28), ri( -31 (74->43), chance( -12 (57->45), pick( -9 (23->14); no site added.
// Phase 6 moved simSeason/applySeasonForm into SeasonStats: R( -5, ri( -1, chance( -1 in game.js, the same 5/1/1 in season-stats.js.
// Phase 7-A moved addIntlStats into SeasonStats: R( -1, ri( -3, chance( -2 in game.js, the same 1/3/2 in season-stats.js.
// Its game.js wiring only forwards to the current R/ri/chance (late binding) and is not a draw site.
const seasonStatsBridge='rng:{R:()=>R(),N0:sd=>N0(sd),chance:p=>chance(p),ri:(a,b)=>ri(a,b)}';
assert.equal(game.split(seasonStatsBridge).length,2,'one SeasonStats RNG bridge, not new independent draws');
// Phase 16 moved tjGamble/tjBigInjury/rollInjury/injStatLoss into PlayerInjury: ri( -7, chance( -6, pick( -2 in game.js, the same 0/7/6/2 in player-injury.js.
// Its game.js wiring only forwards to the current ri/chance/pick (late binding) and is not a draw site.
const injuryBridge='rng:{ri:(a,b)=>ri(a,b),chance:p=>chance(p),pick:keys=>pick(keys)}';
assert.equal(game.split(injuryBridge).length,2,'one PlayerInjury RNG bridge, not new independent draws');
// Phase 17 moved allocDone into PlayerAbility: R( -1 in game.js, the same 1 in player-ability.js.
// Its game.js wiring only forwards to the current R (late binding) and is not a draw site.
const abilityBridge='rng:{R:()=>R()}';
assert.equal(game.split(abilityBridge).length,2,'one PlayerAbility RNG bridge, not a new independent draw');
// Phase 18 moved the love events into PlayerRomance: R( -2, chance( -9, pick( -10 in game.js, the same 2/0/9/10 in player-romance.js.
// Its game.js wiring only forwards to the current R/chance/pick (late binding) and is not a draw site.
const romanceBridge='rng:{R:()=>R(),chance:p=>chance(p),pick:list=>pick(list)}';
assert.equal(game.split(romanceBridge).length,2,'one PlayerRomance RNG bridge, not new independent draws');
// Phase 18 moved drawEvents into SeasonEvents: pick( -1 in game.js, the same 1 in season-events.js.
// Its game.js wiring only forwards to the current chance/pick (late binding) and is not a draw site.
const eventsBridge='rng:{chance:p=>chance(p),pick:pool=>pick(pool)}';
assert.equal(game.split(eventsBridge).length,2,'one SeasonEvents RNG bridge, not a new independent draw');
// Phase 19 moved awards/collectLegacyAwardPlan into SeasonAwards: the Journal bridge R( and the 14 draw('…') slots now live in season-awards.js.
// Its game.js wiring only forwards to the current R (late binding) and is not a draw site.
const awardsBridge='journalRng:{R:()=>R()}';
assert.equal(game.split(awardsBridge).length,2,'one SeasonAwards RNG bridge, not a new independent draw');
// Phase 20 moved retireScene/endGame into CareerRetirement: R( -4, ri( -2 in game.js, the same 4/2/0/0 in career-retirement.js.
// Its game.js wiring only forwards to the current R/ri (late binding) and is not a draw site.
const retirementBridge='rng:{R:()=>R(),ri:(a,b)=>ri(a,b)}';
assert.equal(game.split(retirementBridge).length,2,'one CareerRetirement RNG bridge, not new independent draws');
// Phase 21 moved the amateur path and tournaments into AmateurCareer: R( -1, ri( -4 in game.js, the same 1/4/0/0 in amateur-career.js.
// Its game.js wiring only forwards to the current R/ri (late binding) and is not a draw site.
// Phase 26 moved runDraft into AmateurCareer: ri( -5 in game.js, +5 in amateur-career.js, through the same bridge.
const amateurBridge='rng:{ri:(a,b)=>ri(a,b),R:()=>R()}';
assert.equal(game.split(amateurBridge).length,2,'one AmateurCareer RNG bridge, not new independent draws');
// Phase 22 moved arbitrationFlow into CareerContract: chance( -1 in game.js, the same 0/0/1/0 in career-contract.js.
// Its game.js wiring only forwards to the current chance (late binding) and is not a draw site.
const contractBridge='rng:{chance:p=>chance(p)}';
assert.equal(game.split(contractBridge).length,2,'one CareerContract RNG bridge, not a new independent draw');
// Phase 23 moved the trade, demotion, offer and FA market rules into CareerMovement: ri( -2, chance( -8 in game.js, the same 0/2/8/0 in career-movement.js.
// Its game.js wiring only forwards to the current R/ri/chance (late binding) and is not a draw site. generateBidJitters takes R as a value.
const movementBridge='rng:{R:()=>R(),ri:(a,b)=>ri(a,b),chance:p=>chance(p)}';
assert.equal(game.split(movementBridge).length,2,'one CareerMovement RNG bridge, not new independent draws');
const gameSites=game.replace(movementBridge,'rng:{movementBridge}').replace(contractBridge,'rng:{contractBridge}').replace(seasonStatsBridge,'rng:{seasonStatsBridge}').replace(injuryBridge,'rng:{injuryBridge}').replace(abilityBridge,'rng:{abilityBridge}').replace(romanceBridge,'rng:{romanceBridge}').replace(eventsBridge,'rng:{eventsBridge}').replace(awardsBridge,'journalRng:{awardsBridge}').replace(retirementBridge,'rng:{retirementBridge}').replace(amateurBridge,'rng:{amateurBridge}');
assert.equal((gameSites.match(/\bR\(/g) || []).length,14,'all other native RNG call sites unchanged');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(seasonStats.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[6,4,3,0],'SeasonStats draw sites moved verbatim');
// Six round-specific bonus sites are consolidated; each draft still consumes one ri.
assert.equal((gameSites.match(/\bri\(/g) || []).length, 19);
// Event RNG now lives in applyEvent: one outcome and, only when needed, one target.
const legacyJournalSlots=[...seasonAwards.matchAll(/\bdraw\('([A-Z_]+)'/g)].map(m=>m[1]);
assert.deepEqual(legacyJournalSlots,['ALL_STAR','ROOKIE','LEGACY_BEST_PITCHER','PITCH_SAVES','PITCH_RELIEF','PITCH_STRIKEOUTS','BATTING_AVG','BATTING_HR','BATTING_SB','BATTING_RBI','BATTING_OBP','GOLD_GLOVE','DEFENSE_BEST','MVP']);
assert.equal((gameSites.match(/\bchance\(/g)||[]).length+legacyJournalSlots.length,15,'existing eligible chance sites moved to one-to-one legacy slots');
// Phase 15 moved processIntlPhase into InternationalTournament: pick( -1 in game.js, the same 1 in international-tournament.js.
// Its game.js wiring only forwards to the current pick (late binding) and is not a draw site.
const intlBridge='pick:a=>pick(a)';
assert.equal(game.split(intlBridge).length,2,'one InternationalTournament RNG bridge, not a new independent draw');
assert.equal((gameSites.replace(intlBridge,'intlBridge').match(/\bpick\(/g) || []).length, 0);
assert.deepEqual(['R','ri','chance','pick'].map(f=>(internationalTournament.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[0,0,0,1],'InternationalTournament draw site moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(playerInjury.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[0,7,6,2],'PlayerInjury draw sites moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(playerAbility.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[1,0,0,0],'PlayerAbility draw site moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(playerRomance.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[2,0,9,10],'PlayerRomance draw sites moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(seasonEvents.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[0,0,0,1],'SeasonEvents draw site moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(seasonAwards.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[1,0,0,0],'SeasonAwards draw site moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(careerRetirement.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[4,2,0,0],'CareerRetirement draw sites moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(amateurCareer.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[1,9,0,0],'AmateurCareer draw sites moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(careerContract.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[0,0,1,0],'CareerContract draw site moved verbatim');
assert.deepEqual(['R','ri','chance','pick'].map(f=>(careerMovement.match(new RegExp('\\b'+f+'\\(','g'))||[]).length),[0,2,11,0],'CareerMovement draw sites moved verbatim');

// v1.4.5: NPB復帰候補は表示額を契約へ引き継ぎ、候補表示でRNGを追加消費しない。
assert.match(careerMovement, /candidate=salaryCandidate\(\{sourceLevel:S\.lv,targetLevel:lv,contractMult:1\}\),annualSalary=candidate\.annualSalary/);
assert.match(careerMovement, /context\.years\?\?=ri\(1,3\);signTo\('NPB',lv,rec\.teamId,context\.years,1,'RETURN',\{annualSalary,candidate,transaction:context\.transaction\}\)/);
assert.doesNotMatch(gameAndModules, /annualSalary=salaryCandidate\([^\n]*\b(?:R|ri|chance|pick)\s*\(/);

// 降格時と戦力外後の海外候補でも、表示時の計算はRNGを呼ばず、表示額をsignToへ渡す。
assert.match(careerMovement, /sourceLevel:S\.lv,targetLevel:'CPBL1',contractMult:1/);
assert.match(careerMovement, /sourceLevel:S\.lv,targetLevel:lv,contractMult:1/);
assert.match(careerMovement, /signTo\('CPBL','CPBL1'[^\n]*\{annualSalary\}/);
assert.match(careerMovement, /signTo\(org,lv,rec\.teamId,1,1,'RELEASE_RECONTRACT',\{annualSalary,candidate\}\)/);

assert.match(careerMovement, /S\.ct=fixedContract/);
assert.match(careerContract, /createContract\(/);
assert.doesNotMatch(gameAndModules, /S\.ct\.annualSalary=S\.currentSalary/);
assert.match(careerContract, /applyLevelMinimumToUnpaidSchedule/);
assert.match(careerContract, /transferContract/);
assert.match(careerContract, /appendExtension/);

assert.match(careerMovement, /calculateScheduledBuyout\(S\.ct,rate\)/);
assert.doesNotMatch(gameAndModules, /calculateLegacyContractBuyout/);
assert.doesNotMatch(gameAndModules, /const yearly=Math\.round\(salaryFor\(S\.lv,S\.lastD\|\|0\)/);
assert.match(careerMovement, /S\.careerBuyout=\(S\.careerBuyout\|\|0\)\+result\.buyoutAmount/);
assert.match(careerMovement, /S\.ct=null;\s*S\.currentSalary=0/);

assert.match(game, /NPB_DEV:\{n:'NPB育成',par:35/);
assert.match(game, /NPB2:\{n:'NPB二軍',par:52/);
assert.match(game, /NPB1:\{n:'NPB一軍',par:58/);
assert.match(game, /A3:\{n:'3A',par:56/);
assert.match(game, /MLB:\{n:'メジャーリーグ',par:63/);

assert.doesNotMatch(contractPolicy, /\b(?:R|ri|chance|pick)\s*\(/);
assert.doesNotMatch(controlPolicy+injuryPolicy+arbitrationPolicy, /\b(?:R|ri|chance|pick)\s*\(/);
assert.equal((careerContract.match(/chance\(terms\.winChance\)/g)||[]).length,1,'仲裁結果のRNGは選択後の1回だけ');
assert.match(careerContract,/contractType:'CONTROL'/);assert.match(careerContract,/contractType:'ARBITRATION'/);assert.match(careerMovement,/proof\?'PROOF'/);
assert.match(game,/S\.serviceTime\.MLB\+\+/);assert.doesNotMatch(gameAndModules,/S\.serviceTime\.MLB.*MINOR/);
assert.match(game,/careerBaseSalary:0/);assert.match(game,/careerIncentive:0/);assert.match(game,/yearlyIncentivePaid:\{\}/);assert.match(game,/lastFaMarket:null/);
assert.match(careerMovement,/generateBidJitters\(selected\.map\(x=>x\.team\.teamId\),R\)/);assert.match(careerMovement,/S\.lastFaMarket\?\.marketKey===key/);assert.match(seasonPayment,/applyIncentivePayment/);
assert.match(game,/現契約を継続/);assert.match(game,/来季年俸/);assert.match(game,/契約残り/);assert.match(game,/年俸の再計算はありません/);assert.match(game,/今季の実績は次回の契約評価へ反映されます/);assert.doesNotMatch(gameAndModules,/今季の好成績は次回の契約評価へ反映されます/);
assert.match(careerContract,/floorApplied:contractType==='CONTROL'&&control\.floorApplied/);
console.log('Salary flow v1.4.5 checks passed.');
