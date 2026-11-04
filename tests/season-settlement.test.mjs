import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {runInNewContext} from 'node:vm';
import {readSourceText,sourceText} from './support/source-text.mjs';
import {JP_DATA} from '../docs/src/data/jp-data.js';
import {SeasonSettlement} from '../docs/src/engine/season-settlement.js';
import {annualStateTransaction,prepareAwardReceipt,commitAwardReceipt} from '../docs/src/engine/award-transaction-policy.js';
import {prepareSeasonPayment} from '../docs/src/engine/season-payment-policy.js';
import {contractContinuationForNextYear,createContract} from '../docs/src/engine/contract-policy.js';
import {classifyMarketInjury} from '../docs/src/engine/injury-market-policy.js';
import {normalizeChampionshipState,settleChampionship,maintainSeasonEnd,captureSeasonChampionship} from '../docs/src/engine/championship-policy.js';
import {createIncentiveTerms} from '../docs/src/engine/incentive-policy.js';

// Phase 31 (OOP plan §2jj): the season-end settlement moved verbatim from game.js into SeasonSettlement.
// Part 1 proves the module is the 319be98 section plus the listed edits only; part 2 runs the old section in a vm
// and the module in the main realm on the same stubs and compares the call sequence, errors and state.
const BASE='319be98de2906aa4e6e81b1eef76ff337cf721ae';
const oldGame=sourceText(execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const START='  const professionalEnds=new WeakMap(),professionalMoves=new WeakMap();\n',END='\n  movement = function(){';
assert.equal(oldGame.split(START).length,2,'one old section start');
const oldStart=oldGame.indexOf(START),oldEnd=oldGame.indexOf(END,oldStart);
const oldSection=oldGame.slice(oldStart,oldEnd),oldBody=oldSection.slice(START.length);

// ---- Part 1: verbatim move ----
const HEADER=`// Season-end settlement (OOP plan §2jj): championship, season payment and its Receipt, the result card,
// the season ability-point allocation and the hand-off to movement, plus the IND/CORP year-end pay.
// The career state is read at the start of each method through getState; go reads it again because it can run
// after the allocation UI. careerSession and choiceViews are the game.js objects, passed by reference. Every other
// game.js function is an injected late-binding lambda (E2E hooks rebind board, card, choose, allocUI, movement,
// salaryCandidate, salaryFor and R). No draw site here: settleChampionship draws through random, game.js R.
import { annualStateTransaction, prepareAwardReceipt, commitAwardReceipt } from './award-transaction-policy.js';
import { prepareSeasonPayment } from './season-payment-policy.js';
import { contractContinuationForNextYear } from './contract-policy.js';
import { classifyMarketInjury } from './injury-market-policy.js';
import { normalizeChampionshipState, settleChampionship, maintainSeasonEnd } from './championship-policy.js';

export class SeasonSettlement {
  #deps;
  #professionalEnds=new WeakMap();
  constructor(deps){this.#deps=deps;}
`;
// [original, moved]: the method headers read the state and dependencies, internal calls go through this, go reads the live state.
const EDITS=[
  ['  resumeSeasonEnd=()=>{\n','  resumeSeasonEnd(){const S=this.#deps.getState(),professionalEnds=this.#professionalEnds;\n'],
  ['    settleProfessionalEnd();return true;\n  };\n','    this.settleProfessionalEnd();return true;\n  }\n'],
  ['  function settleProfessionalEnd(){\n','  settleProfessionalEnd(){const S=this.#deps.getState(),professionalEnds=this.#professionalEnds,{getState,careerSession,choiceViews,board,migrateSalaryV140State,teamRec,random:R,renderCheckpointCard,escapeHTML,fmtMoney,movement,choose,allocUI,restorePendingChoice,$}=this.#deps;\n'],
  ['const go=()=>{if(entry.state!==S||','const go=()=>{const S=getState();if(entry.state!==S||'],
  ["  function phaseEnd(){\n    if(S.stage!=='CORP')return settlePhaseEnd();\n","  phaseEnd(){const S=this.#deps.getState(),{careerSession}=this.#deps;\n    if(S.stage!=='CORP')return this.settlePhaseEnd();\n"],
  ['    try{settlePhaseEnd();entry.complete=true;}','    try{this.settlePhaseEnd();entry.complete=true;}'],
  ["  function settlePhaseEnd(){\n    if(S.stage==='PRO')return settleProfessionalEnd();\n","  settlePhaseEnd(){const S=this.#deps.getState(),{careerSession,board,migrateSalaryV140State,teamRec,salaryCandidate,currentMarketRating,saveSalaryDecision,card,fmtMoney,salaryDecisionLink,bindLatestSalaryDetailLink,salaryFor,movement,choose,allocUI}=this.#deps;\n    if(S.stage==='PRO')return this.settleProfessionalEnd();\n"],
];
{
  const moduleText=readSourceText('docs/src/engine/season-settlement.js');
  assert.ok(moduleText.startsWith(HEADER),'module header, imports and fields exact');
  assert.ok(moduleText.endsWith('}\n')&&moduleText.split('\nexport class ').length===2,'one class, closed at the end');
  let body=moduleText.slice(HEADER.length,-2);
  for(const [original,moved] of EDITS){
    assert.equal(body.split(moved).length,2,'one edit: '+moved.slice(0,48));
    assert.equal(oldBody.split(original).length,2,'one original: '+original.slice(0,48));
    body=body.replace(moved,original);
  }
  assert.equal(body,oldBody,'module body is the 319be98 section with only the listed edits');
  assert.throws(()=>assert.equal(body.replace('entry.phase=\'PAYMENT_COMMITTED\'','entry.phase=\'PAYMENT_COMMITED\''),oldBody),'negative control');
}

// ---- Part 2: behaviour, old section (vm) vs module (main realm) ----
const POLICIES={annualStateTransaction,prepareAwardReceipt,commitAwardReceipt,prepareSeasonPayment,contractContinuationForNextYear,classifyMarketInjury,normalizeChampionshipState,settleChampionship,maintainSeasonEnd};
const teamById=id=>JP_DATA.teams.find(t=>t.teamId===id);
function baseState(v={}){return {seed:'season-settlement',year:2035,age:27,stage:'PRO',lv:'NPB1',org:'NPB',orgTeamId:'NPB_CL_HAN',lastD:4,seasonFactor:1,traits:{},honors:[],championshipMigrationVersion:1,championshipResults:{},seasonChampContext:null,seasonEndMaintenanceYear:null,tradeRefuse:2,tradeHeat:8,pool:0,rehab:0,skipMid:false,careerEarnings:111,careerBaseSalary:0,careerIncentive:0,careerSigningBonus:0,yearlyIncentivePaid:{},yearOutsideIncome:111,currentSalary:100000000,corpIncome:0,lastSalaryPaidYear:null,...v};}
function proState(v={},contract={}){const s=baseState(v);s.ct=createContract({contractId:'c'+s.year,org:'NPB',teamId:s.orgTeamId,signedYear:s.year-1,startYear:s.year,years:2,annualSalary:100000000,incentive:createIncentiveTerms({org:'NPB',annualSalary:100000000}),...contract});captureSeasonChampionship(s);return s;}
// Cycle-safe JSON: shared references are spelled out, cycles become "[cycle]", functions "[fn]".
function json(value){const stack=[];return JSON.stringify(value,function(key,v){if(typeof v==='function')return '[fn]';if(v&&typeof v==='object'){while(stack.length&&stack.at(-1)!==this)stack.pop();if(stack.includes(v))return '[cycle]';stack.push(v);}return v;});}

function harness(mode,sc){
  const h={log:[],S:sc.state(),states:[],opts:null,done:null,randoms:[...(sc.randoms||[0])],movementFails:sc.movementFails||0,renderFails:sc.renderFails?{...sc.renderFails}:null,cardFails:sc.cardFails||0};h.states.push(h.S);// per-run counters: never mutate the shared scenario
  const log=(...a)=>h.log.push(json(a));
  const careerSession={choiceGeneration:1,seasonEndContext:null,pendingOffseasonSalary:{year:2035},corpSettlements:new WeakMap()};
  const choiceViews=new WeakMap();
  const stubs={
    board:phase=>log('board',phase),
    migrateSalaryV140State:()=>log('migrateSalaryV140State'),
    teamRec:id=>{log('teamRec',id);return teamById(id);},
    R:()=>{const v=h.randoms.length?h.randoms.shift():0.5;log('R',v);return v;},
    renderCheckpointCard:(owner,key,args)=>{log('renderCheckpointCard',owner===careerSession.seasonEndContext,key,args);if(h.renderFails&&key===h.renderFails.key&&h.renderFails.n-->0)throw new Error('RENDER_FAILED');},
    escapeHTML:x=>String(x),
    fmtMoney:x=>'¥'+x,
    movement:()=>{log('movement',h.S.year,h.S.stage);if(h.movementFails>0){h.movementFails--;throw new Error('MOVEMENT_FAILED');}},
    choose:(title,opts)=>{log('choose',title,opts.map(o=>[o.t,o.main]));h.opts=opts;if(sc.chooseRegisters)choiceViews.set(h.S,{kind:'ALLOCATION',year:h.S.year,generation:careerSession.choiceGeneration});},
    allocUI:(mode,label,done)=>{log('allocUI',mode,label);h.done=done;},
    restorePendingChoice:(state,expected)=>{log('restorePendingChoice',state===undefined?'default':state===h.S,expected===undefined?'none':expected===choiceViews.get(h.S));return sc.restoreResult??false;},
    $:id=>{log('$',id);return {children:{length:sc.actChildren||0}};},
    salaryCandidate:input=>{log('salaryCandidate',input);return {annualSalary:4200000,input};},
    currentMarketRating:()=>{log('currentMarketRating');return 48;},
    saveSalaryDecision:(...a)=>log('saveSalaryDecision',...a),
    card:(cls,title,html)=>{log('card',cls,title,html);if(h.cardFails>0&&h.cardFails-->0)throw new Error('CARD_FAILED');},
    salaryDecisionLink:()=>'<link>',
    bindLatestSalaryDetailLink:()=>log('bindLatestSalaryDetailLink'),
    salaryFor:(lv,d)=>{log('salaryFor',lv,d);return 12600000;},
  };
  let api;
  if(mode==='old'){
    const c={...POLICIES,...stubs,careerSession,choiceViews,S:h.S,resumeSeasonEnd:null,Error};
    runInNewContext(oldSection,c);
    api={phaseEnd:()=>c.phaseEnd(),resume:()=>c.resumeSeasonEnd(),setS:s=>{c.S=s;}};
  }else{
    const {R,...rest}=stubs;
    const settlement=new SeasonSettlement({...rest,random:R,getState:()=>h.S,careerSession,choiceViews});
    api={phaseEnd:()=>settlement.phaseEnd(),resume:()=>settlement.resumeSeasonEnd(),setS:()=>{}};
  }
  const ctx={h,careerSession,choiceViews,setS:s=>{h.S=s;h.states.push(s);api.setS(s);}};
  for(const step of sc.steps){
    try{
      const result=step==='phaseEnd'?api.phaseEnd():step==='resume'?api.resume():step==='pick'?h.opts[0].f():step==='done'?h.done():step(ctx);
      h.log.push(json(['=>',step.name||step,result===undefined?'undefined':result]));
    }catch(e){h.log.push(json(['throw',step.name||step,e.message]));}
  }
  return {log:h.log,states:h.states.map(json),seasonEndContext:json(careerSession.seasonEndContext),pending:json(careerSession.pendingOffseasonSalary),corp:h.states.map(s=>json(careerSession.corpSettlements.get(s)||null))};
}
const nextYear=function nextYear(ctx){const s=ctx.h.S;s.year++;captureSeasonChampionship(s);};
const sameYearRestart=function sameYearRestart(ctx){ctx.setS(proState());};
const liveView=function liveView(ctx){ctx.choiceViews.set(ctx.h.S,{kind:'ALLOCATION',year:ctx.h.S.year,generation:ctx.careerSession.choiceGeneration});};
const bumpGeneration=function bumpGeneration(ctx){ctx.careerSession.choiceGeneration++;};
const SCENARIOS=[
  {id:'PRO champion, no pool',state:()=>proState(),randoms:[0],steps:['phaseEnd','phaseEnd'],expect:['movement','championship']},
  {id:'PRO not champion, no pool',state:()=>proState(),randoms:[0.99],steps:['phaseEnd'],expect:['movement','payment']},
  {id:'PRO pool: choose, allocate, move',state:()=>proState({pool:3}),steps:['phaseEnd','pick','done','phaseEnd'],expect:['choose','allocUI','movement']},
  {id:'PRO pool: re-enter after a new choice generation',state:()=>proState({pool:2}),chooseRegisters:true,steps:['phaseEnd',bumpGeneration,'phaseEnd','pick','done'],expect:['choose','restorePendingChoice','movement']},
  {id:'PRO pool: live allocation view',state:()=>proState({pool:2}),chooseRegisters:true,steps:['phaseEnd','phaseEnd',bumpGeneration,'phaseEnd'],expect:['choose']},
  {id:'PRO pool: pending choice restored',state:()=>proState({pool:2}),chooseRegisters:true,restoreResult:true,steps:['phaseEnd',bumpGeneration,'phaseEnd'],expect:['restorePendingChoice']},
  {id:'PRO allocation started, live',state:()=>proState({pool:2}),actChildren:1,steps:['phaseEnd','pick',liveView,'phaseEnd','done'],expect:['$','movement']},
  {id:'PRO allocation started, ambiguous',state:()=>proState({pool:2}),steps:['phaseEnd','pick','phaseEnd'],expect:['ALLOCATION_CONTINUATION_AMBIGUOUS']},
  {id:'PRO allocation done after restart',state:()=>proState({pool:2}),steps:['phaseEnd','pick',sameYearRestart,'done','phaseEnd'],expect:['allocUI','movement']},
  {id:'PRO resume',state:()=>proState(),steps:['resume','phaseEnd','resume',nextYear,'resume'],expect:['movement','restorePendingChoice']},
  {id:'PRO paid year is read-only',state:()=>proState({lastSalaryPaidYear:2035}),steps:['phaseEnd','resume'],expect:['board']},
  {id:'PRO contract row already paid',state:()=>{const s=proState();s.ct.annualSchedule.find(r=>r.year===2035).paid=true;return s;},steps:['phaseEnd'],expect:['board']},
  {id:'PRO half incentive',state:()=>proState({lastSalaryEvaluation:{sampleStatus:'SUFFICIENT',payD:5}}),steps:['phaseEnd'],expect:['（HALF）','movement']},
  {id:'PRO contract without a schedule',state:()=>{const s=proState();delete s.ct.annualSchedule;return s;},steps:['phaseEnd','phaseEnd'],expect:['board']},
  {id:'PRO no contract',state:()=>{const s=proState();s.ct=null;return s;},steps:['phaseEnd','phaseEnd'],expect:['PRO_PLAYER_WITHOUT_CONTRACT']},
  {id:'PRO movement fails then retries',state:()=>proState(),movementFails:1,steps:['phaseEnd','phaseEnd','phaseEnd'],expect:['MOVEMENT_FAILED','movement']},
  {id:'PRO render fails then retries',state:()=>proState(),renderFails:{key:'payment',n:1},steps:['phaseEnd','phaseEnd'],expect:['RENDER_FAILED','movement']},
  {id:'PRO same-year restart',state:()=>proState(),steps:['phaseEnd',sameYearRestart,'phaseEnd'],expect:['movement']},
  {id:'PRO next year',state:()=>proState({pool:1}),steps:['phaseEnd','pick','done',nextYear,'phaseEnd'],expect:['movement']},
  {id:'IND pay, pool, repay guard',state:()=>baseState({stage:'IND',lv:'IND',org:'IND',orgTeamId:null,ct:null,pool:2}),steps:['phaseEnd','pick','done','phaseEnd'],expect:['salaryCandidate','SALARY_ALREADY_PAID_FOR_YEAR']},
  {id:'CORP pay once, complete',state:()=>baseState({stage:'CORP',lv:'CORP',org:'CORP',orgTeamId:null,ct:null}),steps:['phaseEnd','phaseEnd'],expect:['salaryFor','movement']},
  {id:'CORP card fails, retry pays once',state:()=>baseState({stage:'CORP',lv:'CORP',org:'CORP',orgTeamId:null,ct:null,pool:1}),cardFails:1,steps:['phaseEnd','phaseEnd','pick','done','phaseEnd'],expect:['CARD_FAILED','choose']},
  {id:'amateur year end',state:()=>baseState({stage:'HS',lv:'HS',org:'HS',orgTeamId:null,ct:null}),steps:['phaseEnd'],expect:['movement']},
];
let compared=0;
for(const sc of SCENARIOS){
  const old=harness('old',sc),now=harness('new',sc);
  assert.equal(json(now),json(old),sc.id);
  const text=old.log.join('\n');
  for(const marker of sc.expect)assert.ok(text.includes(marker),sc.id+': reaches '+marker);
  assert.ok(old.states.length>=1&&old.states.length===now.states.length,sc.id+': states compared');
  assert.ok(old.states.every(s=>s.length>200&&s.includes('"year":')),sc.id+': state serialized');
  compared++;
}
assert.equal(compared,SCENARIOS.length);
// Negative control: a changed module output must not compare equal.
{const sc=SCENARIOS[0],old=harness('old',sc),now=harness('new',sc);now.states[0]=now.states[0].replace('"tradeHeat":3','"tradeHeat":4');assert.notEqual(json(now),json(old));}
console.log(`season settlement: verbatim move (${EDITS.length} edits) and ${compared} old/new behaviour scenarios: PASS`);
