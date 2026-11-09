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
const careerEntryModule = await read('docs/src/engine/career-entry.js');
const leagueCatalogModule = await read('docs/src/engine/league-catalog.js');
const playerInjuryModule = await read('docs/src/engine/player-injury.js');

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
    '\n  function phaseIntlPre(){return yearFlow.phaseIntlPre();}\n  function startYear(){return browserSave?yearFlow.startReadyYear(state=>browserSave.capture(state)):yearFlow.startYear();}\n'+
      '  const yearFlow=new YearFlow({getState:()=>S,careerSession,yearHandoffs,flowHooks,$:id=>$(id),finalizePendingOffseasonSalary:()=>finalizePendingOffseasonSalary(),startYear:()=>startYear(),nextStep:()=>nextStep(),advance:()=>advance(),endGame:reason=>endGame(reason),processIntlPhase:(phase,done)=>processIntlPhase(phase,done),divider:t=>divider(t),stageLabel:()=>stageLabel(),yearSteps:()=>[phasePre,phaseIntlPre,phaseMid,phaseEnd]});\n',
    "\nimport { YearFlow } from './year-flow.js';\n",
  ])assert.equal(text.split(line).length,2,'year flow wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new YearFlow(','yearFlow.nextStep(','yearFlow.advance(','yearFlow.reportFlowOutcome(','yearFlow.phaseIntlPre(','yearFlow.startYear(','function nextStep(','function advance(','function reportFlowOutcome(','function phaseIntlPre(','function startYear('])assert.equal(text.split(name).length,2,'year flow wiring only once: '+name);
  assert.ok(!text.includes('advanceWithoutSalaryFinalization'),'the salary-finalizing advance override moved into YearFlow');
}
{// Phase 33: movement L2/L3 wiring. The movement declaration stays a rebindable game.js name that calls the gate (phase 40
  // removed the LEGACY capture); careerMovement and amateurCareer go by reference, other calls as late-binding lambdas.
  const text=sourceText(game);
  for(const line of [
    "\nimport { MovementGate } from './movement-gate.js';\n",
    '\nfunction movement(){return movementGate.movement();}\n',
    '\n  const movementGate=new MovementGate({getState:()=>S,careerMovement,amateurCareer,migrateSalaryV130State:()=>migrateSalaryV130State(),accrueForeignFirstTeamSeason:state=>accrueForeignFirstTeamSeason(state),contractStageFor:org=>contractStageFor(org),restorePendingChoice:(state,expected)=>restorePendingChoice(state,expected)});\n',
  ])assert.equal(text.split(line).length,2,'movement gate wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new MovementGate(','movementGate.movement('])assert.equal(text.split(name).length,2,'movement gate wiring only once: '+name);
  assert.ok(!text.includes('\n  movement='),'no movement override');
  assert.ok(text.indexOf('\n  const careerMovement=new CareerMovement(')>0,'careerMovement construction');
  assert.ok(text.indexOf('\n  const careerMovement=new CareerMovement(')<text.indexOf('\n  const movementGate=new MovementGate('),'careerMovement is built before the gate');
  for(const gone of ['professionalMoves','performMovement','MOVEMENT_CONTINUATION_AMBIGUOUS','  movement = function('])assert.ok(!text.includes(gone),'moved into MovementGate: '+gone);
}
{// Phase 34: the pre/mid-season steps. Both wrappers stay rebindable names (YearFlow reads them through
  // yearSteps, E2E traces wrap them); the constructor follows phaseMid and passes every game.js call as a late-binding lambda.
  const text=sourceText(game);
  for(const line of [
    "\nimport { SeasonPhases } from './season-phases.js';\n",
    '\n/* シーズン開幕前。 */\nfunction phasePre(){return seasonPhases.phasePre();}\n/* シーズン中。 */\nfunction phaseMid(){return seasonPhases.phaseMid();}\n'+
      'const seasonPhases=new SeasonPhases({getState:()=>S,POS_AB,ABL,LV,clamp,board:p=>board(p),card:(cls,title,html)=>card(cls,title,html),choose:(title,opts)=>choose(title,opts),buyoutRemaining:rate=>buyoutRemaining(rate),reportFlowOutcome:outcome=>reportFlowOutcome(outcome),declineForSeason:(state,amount)=>declineForSeason(state,amount),checkGoldclothSeason:()=>checkGoldclothSeason(),stageLabel:()=>stageLabel(),addAb:(k,v)=>addAb(k,v),dposReview:cont=>dposReview(cont),allocUI:(mode,label,done)=>allocUI(mode,label,done),nextStep:()=>nextStep(),tjCap:()=>tjCap(),ovr:()=>ovr(),signTo:(...args)=>signTo(...args),daibaFarewell:cont=>daibaFarewell(cont),loveEvent:next=>loveEvent(next),drawEvents:(n,done)=>drawEvents(n,done),rollInjury:()=>rollInjury(),proSeason:()=>proSeason(),amateurSeason:()=>amateurSeason(),rng:{R:()=>R(),chance:p=>chance(p),ri:(a,b)=>ri(a,b)}});\n',
  ])assert.equal(text.split(line).length,2,'season phases wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new SeasonPhases(','seasonPhases.phasePre(','seasonPhases.phaseMid(','function phasePre(','function phaseMid('])assert.equal(text.split(name).length,2,'season phases wiring only once: '+name);
  for(const gone of ['シーズン前特訓','let afterAsk=','const preAsk=afterAsk','開幕前の投球プラン','シーズン半ばの健康診断','PRESEASON_'])assert.ok(!text.includes(gone),'moved into SeasonPhases: '+gone);
}
{// Phase 35: the professional season. proSeason stays a rebindable name (SeasonPhases reaches it through a
  // late-binding lambda, E2E traces wrap it); the constructor follows the wrapper and passes every game.js call as a late-binding lambda.
  const text=sourceText(game);
  for(const line of [
    "\nimport { ProfessionalSeason } from './professional-season.js';\n",
    '\nconst choiceViews=new WeakMap(),yearHandoffs=new WeakMap();\n',
    '\nfunction rollInjury(){playerInjury.rollInjury();}\nfunction proSeason(){return professionalSeason.proSeason();}\n'+
      "const professionalSeason=new ProfessionalSeason({getState:()=>S,LV,clamp,simSeason:lv=>simSeason(lv),applyEventSeason:(st,options)=>applyEventSeason(st,options),consumeEventSeason:state=>consumeEventSeason(state),normalizeEventSeason:(st,options)=>normalizeEventSeason(st,options),bucketOf:lv=>bucketOf(lv),accStat:(bucket,st)=>accStat(bucket,st),accLevelStat:(levelKey,st)=>accLevelStat(levelKey,st),card:(cls,title,html)=>card(cls,title,html),statLine:st=>statLine(st),isSP:()=>isSP(),toolGap:()=>toolGap(),careerAllStars:()=>careerAllStars(),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),removeTrait:(key,label)=>removeTrait(key,label),board:phase=>board(phase),awards:(bucket,st)=>awards(bucket,st),classifyMarketInjury:input=>classifyMarketInjury(input),recordSalaryEvaluation:st=>recordSalaryEvaluation(st),captureSeasonChampionship:state=>captureSeasonChampionship(state),tjAccrue:()=>tjAccrue(),tjGamble:cont=>tjGamble(cont),demotionAudit:cont=>demotionAudit(cont),tradeCheck:cont=>tradeCheck(cont),maybeIntl:done=>maybeIntl(done),nextStep:()=>nextStep(),resumeSeasonEnd:()=>resumeSeasonEnd(),restorePendingChoice:()=>restorePendingChoice(),seasonRng:{R:()=>R()}});\n"+'function awards(bucket,st){',
  ])assert.equal(text.split(line).length,2,'professional season wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new ProfessionalSeason(','professionalSeason.proSeason(','function proSeason('])assert.equal(text.split(name).length,2,'professional season wiring only once: '+name);
  for(const gone of ['function resumeProfessionalSeason(','function runSeasonPipeline(','function portionOf(','seasonContinuations','STALE_SEASON_CONTINUATION','PRO_SEASON_AMBIGUOUS','SEASON_CONTINUATION_AMBIGUOUS','シーズン途中の移籍','隠し特性解放：鉄人','一芸特化を返上'])assert.ok(!text.includes(gone),'moved into ProfessionalSeason: '+gone);
}
{// Phase 36: the checkpoint render receipts. renderCheckpointCard stays a game.js name (SeasonAwards and SeasonSettlement
  // reach it through late-binding lambdas, vm harnesses slice it by name); the constructor follows the wrapper and passes card
  // and logTarget as late-binding lambdas so card rebinding in E2E and vm fault fixtures still reaches the receipt body.
  const text=sourceText(game);
  for(const line of [
    "\nimport { GameView } from '../ui/game-view.js';\nimport { CheckpointRenderer } from '../ui/checkpoint-renderer.js';\n",
    '\nfunction renderCheckpointCard(owner,key,args){checkpointRenderer.render(owner,key,args);}\nconst checkpointRenderer=new CheckpointRenderer({card:(...args)=>card(...args),logTarget:()=>logTarget()});\n/* 升降格と去向。 */\n',
  ])assert.equal(text.split(line).length,2,'checkpoint renderer wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new CheckpointRenderer(','checkpointRenderer.render(','function renderCheckpointCard('])assert.equal(text.split(name).length,2,'checkpoint renderer wiring only once: '+name);
  for(const gone of ['renderReceipts','RESULT_RENDER_AMBIGUOUS','AMBIGUOUS','card appends synchronously'])assert.ok(!text.includes(gone),'moved into CheckpointRenderer: '+gone);
}
{// Phase 37: new and resumed careers. startJapanese stays a game.js name (btn-start and the smallschool E2E hook call it);
  // the constructor follows the wrapper and injects S/SEED accessors, careerSession by reference and every game.js function
  // as a late-binding lambda, so E2E rebinding of card, startYear, R and seedInit still reaches both entry paths. The restore
  // callback keeps hydrateSavedState and hands the candidate to careerEntry.resume.
  const text=sourceText(game);
  for(const line of [
    "\nimport { ProfessionalSeason } from './professional-season.js';\nimport { CareerEntry } from './career-entry.js';\n",
    "\n  function startJapanese(){careerEntry.startNew();}\n  const careerEntry=new CareerEntry({getState:()=>S,setState:state=>{S=state;},getSeed:()=>SEED,setSeed:seed=>{SEED=seed;},careerSession,CareerSession,POSN,$:id=>$(id),getNavigation:()=>navigation,normalizeSeed:raw=>normalizeSeed(raw),generateSeed:()=>generateSeed(),normalizePlayerName:(raw,seed,pos)=>normalizePlayerName(raw,seed,pos),seedInit:str=>seedInit(str),newState:(name,pos)=>newState(name,pos),escapeHTML:v=>escapeHTML(v),card:(...args)=>card(...args),actClear:()=>actClear(),startYear:()=>startYear()});\n",
    "\n  const candidate=hydrateSavedState(envelope,{DATA,teamRec,teamDisplay,traitPresentation,authorization});\n  careerEntry.resume(candidate);\n }});\n",
  ])assert.equal(text.split(line).length,2,'career entry wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new CareerEntry(','careerEntry.startNew(','careerEntry.resume(','function startJapanese('])assert.equal(text.split(name).length,2,'career entry wiring only once: '+name);
  for(const gone of ['選手誕生','S=newState(nm,pos)','S=candidate;SEED=S.seed','Object.keys(careerSession)','new CareerSession(),{choiceGeneration',"querySelector('#seg-pos button.on')","$('in-name').value"])assert.ok(!text.includes(gone),'moved into CareerEntry: '+gone);
}
{// Phase 38: league, level and team tables. LV, PATHS, TIER_TH, LG_N and TEAM_COLOR stay game.js names (components get them
  // by reference, E2E hooks use them) as aliases of the catalog's tables; teamRec, teamDisplay, listByOrg and teamNick stay wrappers.
  // The Japanese overlay's Object.assign lines are gone: the catalog defines their result once.
  const text=sourceText(game),catalog=sourceText(leagueCatalogModule);
  for(const line of [
    "\nimport { JP_DATA } from '../data/jp-data.js';\nimport { LeagueCatalog } from './league-catalog.js';\n",
    "\nconst leagueCatalog=new LeagueCatalog({teams:JP_DATA.teams});\nconst TEAM_COLOR=leagueCatalog.teamColors;\nconst LV=leagueCatalog.levels;\nconst PATHS=leagueCatalog.paths;\n",
    "\nconst TIER_TH=leagueCatalog.tierThresholds;\nconst LG_N=leagueCatalog.leagueNames;\n",
    "\nfunction teamNick(team){return leagueCatalog.teamNick(team);}\n",
    "\n  window.TEAM_MASTER = leagueCatalog.teamMaster;\n",
    "\n  function teamRec(id){return leagueCatalog.teamRec(id);}\n  function teamDisplay(id,lv){return leagueCatalog.teamDisplay(id,lv);}\n  function listByOrg(org){return leagueCatalog.listByOrg(org);}\n",
  ])assert.equal(text.split(line).length,2,'league catalog wiring, once: '+line.trim().slice(0,50));
  for(const name of ['new LeagueCatalog(','const TEAM_COLOR=','const LV=','const PATHS=','const TIER_TH=','const LG_N=','window.TEAM_MASTER','function teamNick(','function teamRec(','function teamDisplay(','function listByOrg('])assert.equal(text.split(name).length,2,'league catalog wiring only once: '+name);
  for(const gone of ['Object.assign(LV','Object.assign(PATHS','Object.assign(LG_N','Object.assign(TIER_TH','Object.assign(ABL','Object.assign(POSN','Object.assign(DPN','typeof LG_N','typeof TIER_TH',"'台中マンモス'",'DATA.teams.map(','DATA.teams.filter(','for(const t of DATA.teams)'])assert.ok(!text.includes(gone),'moved into LeagueCatalog: '+gone);
  for(const moved of ["'台中マンモス':'#ffd800'","'台中マンモス':'マンモス'",'teams.map(x=>[x.teamId,Object.freeze(x)])','.filter(t=>t.org===o&&t.active)',"NPB_DEV:{n:'NPB育成'"])assert.equal(catalog.split(moved).length,2,'in LeagueCatalog once: '+moved);
}
{// Phase 39: the TJ gauge accrual and cap moved into PlayerInjury (accrueTj, tjGaugeLimit). tjAccrue and tjCap stay game.js
  // wrappers (ProfessionalSeason, SeasonPhases, CareerPresenter and E2E hooks reach them by name), and PlayerInjury still gets
  // tjCap as an injected lambda, so tjGamble reads the cap through the game.js name.
  const text=sourceText(game),injury=sourceText(playerInjuryModule);
  assert.equal(text.split('\nfunction tjAccrue(){return playerInjury.accrueTj();}\nfunction tjCap(){return playerInjury.tjGaugeLimit();}\n').length,2,'TJ wrappers, once');
  assert.equal(text.split(',tjCap:()=>tjCap()').length,4,'tjCap lambda for PlayerInjury, SeasonPhases and CareerPresenter');
  for(const gone of ["{'全力投球':1.25,'通常投球':1.0,'省エネ投球':0.65}",'S.tj+=base','return S.traits.rubber?100:50'])assert.ok(!text.includes(gone),'moved into PlayerInjury: '+gone);
  for(const moved of ["{'全力投球':1.25,'通常投球':1.0,'省エネ投球':0.65}",'S.tj+=base','return S.traits.rubber?100:50','  accrueTj(){this.#rules.accrueTj();}\n  tjGaugeLimit(){return this.#rules.tjGaugeLimit();}\n','return {tjGamble,afterGamble,rollInjury,accrueTj,tjGaugeLimit};'])assert.equal(injury.split(moved).length,2,'in PlayerInjury once: '+moved);
}
{// Phase 40 (K): the restart and seed bindings that the bootstrap block overwrote at load time are gone; each control
  // is bound once, by the bootstrap block.
  const text=sourceText(game);
  for(const bound of ["$('btn-restart').onclick=","$('seed-re').onclick="])assert.equal(text.split(bound).length,2,'bound once: '+bound);
  for(const gone of ["getElementById('btn-restart')",'(0).toString(36)',"$('seed-show').value=SEED;",'人生のこの部分を放棄して'])assert.ok(!text.includes(gone),'dead binding removed: '+gone);
}
{// Phase 40 (L): the LEGACY overlay is gone. board, movement and endGame are single module-level function declarations
  // above the overlay marker (stage10-risk-e2e rebinds them there); board patches the name and salary itself and endGame
  // keeps the text-node replacement after the retirement scene.
  const text=sourceText(game),marker=text.indexOf('\n/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */\n');
  assert.ok(marker>0,'overlay marker');
  const boardDecl=`
function board(phase){ gameView.renderBoard(boardModel(phase));gameView.patchBoard({name:S.name,salaryText:Math.round((S.currentSalary||0)/10000).toLocaleString()}); }
`;
  const endGameDecl=`
function endGame(reason){careerRetirement.endGame(reason);setTimeout(()=>{
  /* innerHTML の再代入は共有ボタンのイベントリスナーを消すため、テキストノードだけを安全に更新する。 */
  document.querySelectorAll('.card').forEach(c=>{
    const walker=document.createTreeWalker(c,NodeFilter.SHOW_TEXT);
    for(let n=walker.nextNode();n;n=walker.nextNode())n.nodeValue=n.nodeValue.replace(/台幣/g,'円').replace(/中華隊/g,'日本代表').replace(/臺灣/g,'日本');
  });
},0);}
`;
  for(const decl of [boardDecl,endGameDecl]){assert.equal(text.split(decl).length,2,'merged declaration once: '+decl.slice(1,30));assert.ok(text.indexOf(decl)<marker,'above the overlay marker: '+decl.slice(1,30));}
  for(const name of ['\nfunction board(','\nfunction movement(','\nfunction endGame('])assert.equal(text.split(name).length,2,'one declaration: '+name.trim());
  assert.ok(text.indexOf('\nfunction movement(')<marker,'movement above the overlay marker');
  for(const gone of ['LEGACY','legacyEndGame','board =','endGame='])assert.ok(!text.includes(gone),'overlay rebinding removed: '+gone);
}
assert.ok(game.includes('function newState(name,pos){return createInitialState(name,pos,{getState:()=>S,getSeed:()=>SEED,R,ri,pickRecord,DATA,POS_AB,teamRec,teamDisplay,traitPresentation});}'),'newState passes the current state, seed and RNG to createInitialState');
assert.match(shareImage, /fillText\(VERSION,W-PAD,H-40\)/);
assert.doesNotMatch(game, /rngVersion|rulesVersion/);
assert.doesNotMatch(html, /id="ver-badge"/);
assert.match(html, /<h1 id="logo-tap"><em>野球人生シミュレーター<\/em><span id="app-version"[^>]*><\/span><\/h1>/);
assert.doesNotMatch(html, /v1\.0\.0/);
assert.match(game, /appVersion\.textContent='v'\+VERSION/);

const forbidden = `${html}\n${config}\n${data}\n${game}\n${main}\n${careerEntryModule}`;
assert.doesNotMatch(forbidden, /UNSUPPORTED_REPLAY_VERSION/);
assert.doesNotMatch(forbidden, /[?&]rv=/);
assert.doesNotMatch(forbidden, /[?&]rules=/);
assert.match(await read('docs/src/engine/career-retirement.js'), /replayURL\(getState\(\)\.seed\|\|getSeed\(\),location\.href\)/);
assert.equal(careerEntryModule.split("history.replaceState(null,'',`?seed=${encodeURIComponent(getSeed())}`)").length,3,'new and resumed careers both write the seed-only URL');

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
