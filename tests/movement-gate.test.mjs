import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createContext,runInContext} from 'node:vm';
import {readSourceText,sourceText} from './support/source-text.mjs';
import {MovementGate} from '../docs/src/engine/movement-gate.js';

// Phase 33 (OOP plan §2ll): movement L2 (service time, FA eligibility, LEGACY.movement) and L3 (the professional
// same-year continuation guard) moved verbatim from game.js into MovementGate. Part 1 proves the module is the
// base section plus the listed edits only; part 2 runs the base section in a vm and the module in the main realm on
// the same stubs and compares the call log, errors and state after every call.
const BASE='d4cd99d09ca6f4d578e4a1d03dbffbf05d60fb81';
const oldGame=sourceText(execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const L2HEAD='\n  movement = function(){',L3HEAD='\n  const performMovement=movement;\n  movement=function(){\n',L3END='\n  };\n';
assert.equal(oldGame.split(L2HEAD).length,2,'one old L2');assert.equal(oldGame.split(L3HEAD).length,2,'one old L3');
const l2Start=oldGame.indexOf(L2HEAD)+L2HEAD.length,l2End=oldGame.indexOf('};\n',l2Start);
const l2Body=oldGame.slice(l2Start,l2End);
assert.equal(oldGame.slice(l2End+3,l2End+3+L3HEAD.length-1),L3HEAD.slice(1),'L3 follows L2');
const l3Start=oldGame.indexOf(L3HEAD)+L3HEAD.length,l3End=oldGame.indexOf(L3END,l3Start);
const l3Body=oldGame.slice(l3Start,l3End);
const oldSection=oldGame.slice(l2Start-L2HEAD.length+1,l3End+L3END.length);

// ---- Part 1: verbatim move ----
const HEADER=`// Season-end movement entry (OOP plan §2ll): the service-time accrual and FA eligibility before LEGACY.movement
// (the CareerMovement wrapper), and the professional same-year continuation guard around it. The career state is
// read at the start of each method through getState. LEGACY and amateurCareer are the game.js objects, passed by
// reference; LEGACY.movement is the binding captured before this wrapper, so E2E traces that wrap it still see it.
// Every other game.js function is an injected late-binding lambda. No draw site.
`;
assert.equal(l3Body.split('performMovement()').length,3,'two internal calls');
const expected=HEADER+`export class MovementGate {
  #deps;
  #professionalMoves=new WeakMap();
  constructor(deps){this.#deps=deps;}
  #performMovement(){const S=this.#deps.getState(),{LEGACY,amateurCareer,migrateSalaryV130State,accrueForeignFirstTeamSeason,contractStageFor}=this.#deps;${l2Body}}
  movement(){const S=this.#deps.getState(),professionalMoves=this.#professionalMoves,{restorePendingChoice}=this.#deps;
${l3Body.replaceAll('performMovement()','this.#performMovement()')}
  }
}
`;
const moduleText=await readSourceText(new URL('../docs/src/engine/movement-gate.js',import.meta.url));
assert.equal(moduleText,expected,'module = base section plus the listed edits');
assert.doesNotMatch(moduleText,/\b(?:R|ri|chance|pick|pickRecord)\(/,'no draw site');

// ---- Part 2: behaviour, old section (vm) vs module (main realm) ----
function makeStubs(run){
  const log=run.log;// cfg is read live: play() replaces run.cfg before every call
  return {
    LEGACY:{movement(){log.push(['legacy',run.S.year,run.S.lv]);if(run.cfg.legacyThrows)throw new Error('LEGACY_FAULT');}},
    amateurCareer:{seasonEndMovement(){log.push(['amateur',run.S.stage]);return !!run.cfg.amateur;}},
    migrateSalaryV130State(){log.push(['migrate']);},
    accrueForeignFirstTeamSeason(state){log.push(['accrueForeign',state===run.S]);return 0;},
    contractStageFor(org){log.push(['contractStage',org]);return run.cfg.stage||'CONTROL';},
    restorePendingChoice(...args){log.push(['restore',args.length]);return !!run.cfg.restore;},
  };
}
function oldHarness(){
  const run={log:[],cfg:{},S:null},stubs=makeStubs(run);
  const context=createContext({...stubs,S:null});
  runInContext("'use strict';\nlet movement;const professionalMoves=new WeakMap();\n"+oldSection+'\nglobalThis.__movement=()=>movement();',context);
  return {run,call(){context.S=run.S;return context.__movement();}};
}
function newHarness(){
  const run={log:[],cfg:{},S:null},stubs=makeStubs(run);
  const gate=new MovementGate({getState:()=>run.S,...stubs});
  return {run,call(){return gate.movement();}};
}
const pro=(patch={})=>({stage:'PRO',org:'NPB',lv:'NPB1',year:2030,seasonFactor:1,npbRosterDays:0,npbFaSeasons:0,serviceTime:{NPB:0,MLB:0,KBO:0,CPBL:0},serviceTimeAccruedYear:null,faElig:false,...patch});
// Each step: optional state (replaces S with a fresh object), patch (mutates S), cfg (stub behaviour), then one call.
const scenarios=[
  ['amateur return',[{state:{stage:'HS',year:2026},cfg:{amateur:true}}]],
  ['IND without amateur return',[{state:pro({stage:'IND',org:'IND',lv:'IND'})}]],
  ['CORP without amateur return',[{state:pro({stage:'CORP',org:'CORP',lv:'CORP'})}]],
  ['NPB1 full season',[{state:pro()}]],
  ['NPB1 partial season carry',[{state:pro({seasonFactor:.5,npbRosterDays:100})}]],
  ['NPB1 two FA seasons in one accrual',[{state:pro({npbRosterDays:200})}]],
  ['NPB1 no games',[{state:pro({seasonFactor:0})}]],
  ['NPB2 no accrual',[{state:pro({lv:'NPB2'})}]],
  ['NPB FA eligibility at 8',[{state:pro({serviceTime:{NPB:7,MLB:0,KBO:0,CPBL:0},npbFaSeasons:7,npbRosterDays:144})}]],
  ['NPB keeps max service time',[{state:pro({serviceTime:{NPB:9,MLB:0,KBO:0,CPBL:0},npbFaSeasons:2})}]],
  ['already accrued this year',[{state:pro({serviceTimeAccruedYear:2030,npbRosterDays:140})}]],
  ['MLB half season',[{state:pro({org:'MLB',lv:'MLB',seasonFactor:.5}),cfg:{stage:'ARBITRATION'}}]],
  ['MLB under half',[{state:pro({org:'MLB',lv:'MLB',seasonFactor:.49}),cfg:{stage:'CONTROL'}}]],
  ['MLB minors',[{state:pro({org:'MLB',lv:'A3'}),cfg:{stage:'FREE_AGENT'}}]],
  ['KBO1',[{state:pro({org:'KBO',lv:'KBO1'})}]],
  ['KBO2',[{state:pro({org:'KBO',lv:'KBO2'})}]],
  ['CPBL1',[{state:pro({org:'CPBL',lv:'CPBL1',seasonFactor:.2})}]],
  ['CPBL1 no games',[{state:pro({org:'CPBL',lv:'CPBL1',seasonFactor:0})}]],
  ['CPBL2',[{state:pro({org:'CPBL',lv:'CPBL2'})}]],
  ['same-year re-entry restores',[{state:pro()},{cfg:{restore:true}}]],
  ['same-year re-entry restore fails',[{state:pro()},{cfg:{restore:false}}]],
  ['LEGACY throws then same-year re-entry',[{state:pro(),cfg:{legacyThrows:true}},{cfg:{}}]],
  ['next year starts a new entry',[{state:pro()},{patch:{year:2031}},{cfg:{restore:true}}]],
  ['another state object, same year',[{state:pro()},{state:pro()}]],
  ['PRO then non-PRO same year bypasses the guard',[{state:pro()},{patch:{stage:'IND',org:'IND',lv:'IND'}}]],
  ['non-PRO first, then PRO same year',[{state:pro({stage:'IND',org:'IND',lv:'IND'})},{patch:{stage:'PRO',org:'NPB',lv:'NPB1'}}]],
  ['re-entry after restore, third call',[{state:pro()},{cfg:{restore:true}},{cfg:{restore:true}}]],
];
function play(h,steps){
  const out=[];
  for(const step of steps){
    if(step.state)h.run.S=structuredClone(step.state);
    if(step.patch)Object.assign(h.run.S,step.patch);
    h.run.cfg={...(step.cfg||{})};const before=h.run.log.length;let error=null;
    try{h.call();}catch(e){error=e.message;}
    out.push({log:h.run.log.slice(before),error,state:JSON.stringify(h.run.S)});
  }
  return out;
}
let compared=0;
for(const [name,steps] of scenarios){
  const a=play(oldHarness(),steps),b=play(newHarness(),steps);
  assert.equal(a.length,steps.length,name+': all steps ran');assert.ok(a.some(x=>x.log.length>0),name+': stubs reached');
  assert.equal(JSON.stringify(b),JSON.stringify(a),name);compared++;
}
assert.equal(compared,scenarios.length);
// The branches the natural careers never reach (§2ll.4) must be exercised here.
const all=scenarios.flatMap(([,steps])=>play(newHarness(),steps));
assert.ok(all.some(x=>x.error==='MOVEMENT_CONTINUATION_AMBIGUOUS'),'ambiguous continuation reached');
assert.ok(all.some(x=>x.log.some(c=>c[0]==='restore')&&!x.error),'restored continuation reached');
assert.ok(all.some(x=>x.error==='LEGACY_FAULT'),'LEGACY fault reached');
assert.ok(all.some(x=>JSON.parse(x.state).npbFaSeasons>=2),'roster-day loop ran twice');
console.log(`movement-gate checks passed (${compared} scenarios).`);
