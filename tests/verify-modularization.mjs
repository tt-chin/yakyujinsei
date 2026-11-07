import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {VERSION} from '../docs/src/config.js';
import {sourceText} from './support/source-text.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFile(path.join(root, relative), 'utf8');

const [html, config, data, game, main, baseCss, themeCss] = await Promise.all([
  read('docs/index.html'),
  read('docs/src/config.js'),
  read('docs/src/data/jp-data.js'),
  read('docs/src/engine/game.js'),
  read('docs/src/main.js'),
  read('docs/styles/base.css'),
  read('docs/styles/themes.css'),
]);
const shareImage = await read('docs/src/ui/share-image.js');
const initialState = await read('docs/src/engine/initial-state.js');

assert.match(html, /<link rel="stylesheet" href="\.\/styles\/base\.css">/);
assert.match(html, /<link rel="stylesheet" href="\.\/styles\/jp-theme\.css">/);
assert.match(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
assert.match(html, /<link rel="icon" type="image\/png" href="\.\/assets\/baseball-icon\.png">/);
assert.match(baseCss, /url\('\.\.\/assets\/baseball-icon\.png'\)/);
assert.doesNotMatch(html, /<style>/);
assert.equal((html.match(/<script/g) || []).length, 1);
assert.match(html, /href="https:\/\/x\.com\/dog_cat_150"[^>]*>犬猫（@dog_cat_150）<\/a>/);

assert.match(main, /initializeDisplayPreferences\(\);[\s\S]*await import\('\.\/engine\/game\.js'\)/);
assert.match(game, /import \{ VERSION \} from '\.\.\/config\.js';/);
assert.match(game, /import \{ JP_DATA \} from '\.\.\/data\/jp-data\.js';/);
assert.match(VERSION,/^\d+\.\d+\.\d+$/);
assert.equal(sourceText(config),`export const VERSION = '${VERSION}';\n\n`,'current version, exact declaration and no extra code');
assert.throws(()=>assert.equal(sourceText(config)+'// unexpected',`export const VERSION = '${VERSION}';\n\n`));
assert.doesNotMatch(config, /RNG_VERSION|RULES_VERSION/);
assert.match(initialState, /version:VERSION/);
for(const line of [
  'function restorePendingChoice(state=S,expected){return choicePrompt.restorePendingChoice(state,expected);}',
  'function runWithResultView(action){return choicePrompt.runWithResultView(action);}',
  'function choose(title,opts){choicePrompt.choose(title,opts);}',
  'const choicePrompt=new ChoicePrompt({getState:()=>S,careerSession,choiceViews,yearHandoffs,gameView,$:id=>$(id),actClear:()=>actClear(),actToggleSync:()=>actToggleSync(),archiveTraitResults:()=>archiveTraitResults(),card:(cls,title,html)=>card(cls,title,html),scrollAction:()=>scrollAction(),scrollBottom:()=>scrollBottom()});',
])assert.ok(game.includes(line),'choice prompt wiring: '+line.slice(0,40));
{// Phase 31: the season settlement wiring, four lines in this order, once; the getters and lambdas stay live.
  const text=sourceText(game),wiring=[
    '  resumeSeasonEnd=()=>seasonSettlement.resumeSeasonEnd();',
    '  function phaseEnd(){return seasonSettlement.phaseEnd();}',
    '  const seasonSettlement=new SeasonSettlement({getState:()=>S,careerSession,choiceViews,board:phase=>board(phase),migrateSalaryV140State:()=>migrateSalaryV140State(),teamRec:id=>teamRec(id),random:()=>R(),renderCheckpointCard:(owner,key,args)=>renderCheckpointCard(owner,key,args),escapeHTML:v=>escapeHTML(v),fmtMoney:yen=>fmtMoney(yen),movement:()=>movement(),choose:(title,opts)=>choose(title,opts),allocUI:(mode,label,done)=>allocUI(mode,label,done),restorePendingChoice:(state,expected)=>restorePendingChoice(state,expected),$:id=>$(id),salaryCandidate:input=>salaryCandidate(input),currentMarketRating:()=>currentMarketRating(),saveSalaryDecision:(decisionType,candidate,previousSalary,finalSalary,options)=>saveSalaryDecision(decisionType,candidate,previousSalary,finalSalary,options),card:(cls,title,html)=>card(cls,title,html),salaryDecisionLink:()=>salaryDecisionLink(),bindLatestSalaryDetailLink:()=>bindLatestSalaryDetailLink(),salaryFor:(lv,d)=>salaryFor(lv,d)});',
  ].join('\n')+'\n';
  assert.equal(text.split('\n'+wiring).length,2,'season settlement wiring: three lines in order, once');
  assert.equal(text.split("\nimport { SeasonSettlement } from './season-settlement.js';\n").length,2,'season settlement import, once');
  for(const name of ['new SeasonSettlement(','seasonSettlement.resumeSeasonEnd(','seasonSettlement.phaseEnd(','function phaseEnd(','\n  resumeSeasonEnd='])assert.equal(text.split(name).length,2,'season settlement wiring only once: '+name);
}
{// Phase 32: the year skeleton wiring. The named wrappers stay rebindable for E2E hooks; the constructor follows startYear
  // and passes every outgoing call as a late-binding lambda (§2kk.4: only advance->startYear is caught by an E2E).
  const text=sourceText(game);
  for(const line of [
    '\nfunction nextStep(){return yearFlow.nextStep();}\n',
    '\nfunction advance(){return yearFlow.advance();}\n',
    '\n  function reportFlowOutcome(outcome){return yearFlow.reportFlowOutcome(outcome);}\n  const flowHooks={advance:null,endGame:null};\n',
    '\n  function phaseIntlPre(){return yearFlow.phaseIntlPre();}\n  function startYear(){return yearFlow.startYear();}\n'+
      '  const yearFlow=new YearFlow({getState:()=>S,careerSession,yearHandoffs,flowHooks,$:id=>$(id),finalizePendingOffseasonSalary:()=>finalizePendingOffseasonSalary(),startYear:()=>startYear(),nextStep:()=>nextStep(),advance:()=>advance(),endGame:reason=>endGame(reason),processIntlPhase:(phase,done)=>processIntlPhase(phase,done),divider:t=>divider(t),stageLabel:()=>stageLabel(),yearSteps:()=>[phasePre,phaseIntlPre,phaseMid,phaseEnd]});\n',
    "\nimport { YearFlow } from './year-flow.js';\n",
  ])assert.equal(text.split(line).length,2,'year flow wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new YearFlow(','yearFlow.nextStep(','yearFlow.advance(','yearFlow.reportFlowOutcome(','yearFlow.phaseIntlPre(','yearFlow.startYear(','function nextStep(','function advance(','function reportFlowOutcome(','function phaseIntlPre(','function startYear('])assert.equal(text.split(name).length,2,'year flow wiring only once: '+name);
  assert.ok(!text.includes('advanceWithoutSalaryFinalization'),'the salary-finalizing advance override moved into YearFlow');
}
{// Phase 33: movement L2/L3 wiring. The wrapper stays a rebindable movement binding after LEGACY captures the
  // CareerMovement wrapper; LEGACY and amateurCareer go by reference, other calls as late-binding lambdas.
  const text=sourceText(game);
  for(const line of [
    "\nimport { MovementGate } from './movement-gate.js';\n",
    '\n  movement=function(){return movementGate.movement();};\n'+
      '  const movementGate=new MovementGate({getState:()=>S,LEGACY,amateurCareer,migrateSalaryV130State:()=>migrateSalaryV130State(),accrueForeignFirstTeamSeason:state=>accrueForeignFirstTeamSeason(state),contractStageFor:org=>contractStageFor(org),restorePendingChoice:(state,expected)=>restorePendingChoice(state,expected)});\n',
  ])assert.equal(text.split(line).length,2,'movement gate wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new MovementGate(','movementGate.movement(','\n  movement='])assert.equal(text.split(name).length,2,'movement gate wiring only once: '+name);
  assert.ok(text.indexOf('  const LEGACY = { board, movement,')<text.indexOf('\n  movement=function(){return movementGate'),'LEGACY captures movement before the wrapper');
  for(const gone of ['professionalMoves','performMovement','MOVEMENT_CONTINUATION_AMBIGUOUS','  movement = function('])assert.ok(!text.includes(gone),'moved into MovementGate: '+gone);
}
assert.ok(game.includes('function newState(name,pos){return createInitialState(name,pos,{getState:()=>S,getSeed:()=>SEED,R,ri,pickRecord,DATA,POS_AB,teamRec,teamDisplay,traitPresentation});}'),'newState passes the current state, seed and RNG to createInitialState');
assert.match(shareImage, /fillText\(VERSION,W-PAD,H-40\)/);
assert.doesNotMatch(game, /rngVersion|rulesVersion/);
assert.doesNotMatch(html, /id="ver-badge"/);
assert.match(html, /<h1 id="logo-tap"><em>野球人生シミュレーター<\/em><span id="app-version"[^>]*><\/span><\/h1>/);
assert.doesNotMatch(html, /v1\.0\.0/);
assert.match(game, /appVersion\.textContent='v'\+VERSION/);

const forbidden = `${html}\n${config}\n${data}\n${game}\n${main}`;
assert.doesNotMatch(forbidden, /UNSUPPORTED_REPLAY_VERSION/);
assert.doesNotMatch(forbidden, /[?&]rv=/);
assert.doesNotMatch(forbidden, /[?&]rules=/);
assert.match(await read('docs/src/engine/career-retirement.js'), /replayURL\(getState\(\)\.seed\|\|getSeed\(\),location\.href\)/);
assert.match(game, /history\.replaceState\(null,'',`\?seed=\$\{encodeURIComponent\(SEED\)\}`\)/);

assert.equal((data.match(/"teamId"/g) || []).length, 90);
assert.equal((data.match(/"schoolId"/g) || []).length, 85);
assert.equal((data.match(/"eventKey"/g) || []).length, 2);
assert.match(themeCss, /--button-detail:#6f303d/);
assert.match(themeCss, /--primary-button-detail:#fff4f5/);
assert.match(themeCss, /--bg:#fff8f8/);
assert.match(shareImage, /imageColor=getSharePalette\(theme\)/);
assert.match(await read('docs/src/ui/share-theme.js'), /standard:\{bg:'#fff8f8'/);
assert.ok(baseCss.length > 8_000);

assert.equal((game.match(/cur>=66\?7:cur>=60\?4:cur>=55\?2:1/g) || []).length, 0);
assert.equal(((await read('docs/src/engine/player-ability.js')).match(/cur>=66\?7:cur>=60\?4:cur>=55\?2:1/g) || []).length, 2);
assert.equal(((await read('docs/src/engine/ability-evaluation-policy.js')).match(/cur>=66\?7:cur>=60\?4:cur>=55\?2:1/g) || []).length, 1);
assert.doesNotMatch(game, /cur>=66\?7:cur>=58\?4:cur>=55\?2:1/);

function fnv1a32(value) {
  let hash = 0x811C9DC5;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

let rngState = fnv1a32('v1:yakyo-test-001') || 0x6D2B79F5;
const random = () => {
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  let value = rngState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

assert.equal(rngState, 1527536498);
const actual = Array.from({ length: 5 }, random).map(value => value.toFixed(10));
assert.deepEqual(actual, [
  '0.9388780487',
  '0.6808669898',
  '0.9465476144',
  '0.2226050724',
  '0.3018500586',
]);
assert.equal(rngState, 2095430971);

console.log('Version 1.13.0 modularization static and RNG checks passed.');
