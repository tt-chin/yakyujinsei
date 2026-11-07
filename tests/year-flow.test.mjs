import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createContext,runInContext} from 'node:vm';
import {readSourceText,sourceText} from './support/source-text.mjs';
import {CareerSession} from '../docs/src/engine/career-session.js';
import {resetEventYear} from '../docs/src/engine/event-state-policy.js';
import {YearFlow} from '../docs/src/engine/year-flow.js';

// Phase 32 (OOP plan §2kk): the year skeleton moved verbatim from game.js into YearFlow.
// Part 1 proves the module is the BASE sections plus the listed edits only; part 2 runs the old sections in a vm and the
// module in the main realm on the same stubs and compares calls, errors and state; part 3 proves that every call leaving
// a method goes through the injected lambda, which E2E hooks rebind (§2kk.4: an E2E notices only advance->startYear).
const BASE='6b83d686e7ce8ee92aa6715d6167e2157d4fdc4e';
const oldGame=sourceText(execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const moduleText=readSourceText(new URL('../docs/src/engine/year-flow.js',import.meta.url));
const once=(text,part,label)=>{assert.equal(text.split(part).length,2,label+' once');return part;};
const line=start=>{once(oldGame,start,start);const a=oldGame.indexOf(start);return oldGame.slice(a,oldGame.indexOf('\n',a));};
const between=(start,end)=>{once(oldGame,start,start);const a=oldGame.indexOf(start);return oldGame.slice(a,oldGame.indexOf(end,a));};
const replaceOnce=(text,from,to,label)=>{once(text,from,label);return text.replace(from,()=>to);};

const oldNext=line('function nextStep(){');
const oldAdvance=between('function advance(){\n','\n/* キャリア終盤。 */');
const oldOverride=once(oldGame,'\n  const advanceWithoutSalaryFinalization=advance;\n  advance=function(){finalizePendingOffseasonSalary();advanceWithoutSalaryFinalization();};\n','override');
const oldReport=between('  function reportFlowOutcome(outcome){\n','\n  const flowHooks=');
const oldFlowHooks=line('  const flowHooks=');
const oldIntl=line('  function phaseIntlPre(){'),oldStart=line('  function startYear(){');
assert.equal(oldFlowHooks,'  const flowHooks={advance:null,endGame:null};');

// ---- Part 1: verbatim move ----
const HEADER=`// Year skeleton (OOP plan §2kk): the step queue, the year hand-off (advance), the flow-outcome
// dispatch and the preseason international step. The career state is read at the start of each method through
// getState. careerSession, yearHandoffs and flowHooks are the game.js objects, passed by reference. Calls that leave
// a method go through injected late-binding lambdas, because E2E hooks rebind startYear, advance and nextStep
// (§3.17); yearSteps returns the game.js step functions so stepQ keeps their identity and names. No draw site.
import { resetEventYear } from './event-state-policy.js';

export class YearFlow {
  #deps;
  constructor(deps){this.#deps=deps;}
`;
const body=(text,head)=>replaceOnce(text,head,'',head).replace(/}$/,'');
const expected=HEADER+
  '  nextStep(){const S=this.#deps.getState(),{careerSession}=this.#deps;'+body(oldNext,'function nextStep(){')+'}\n'+
  '  advance(){this.#deps.finalizePendingOffseasonSalary();this.advanceWithoutSalaryFinalization();}\n'+
  '  advanceWithoutSalaryFinalization(){const S=this.#deps.getState(),{careerSession,yearHandoffs,startYear,$}=this.#deps;\n'+
  replaceOnce(oldAdvance,'function advance(){\n','','advance head')+'\n'+
  '  reportFlowOutcome(outcome){const {flowHooks,advance,endGame}=this.#deps;\n'+
  replaceOnce(oldReport,'  function reportFlowOutcome(outcome){\n','','report head')+'\n'+
  '  phaseIntlPre(){const {processIntlPhase,nextStep}=this.#deps;'+body(oldIntl,'  function phaseIntlPre(){')+'}\n'+
  '  startYear(){const S=this.#deps.getState(),{careerSession,yearSteps,divider,stageLabel,nextStep}=this.#deps;'+
  replaceOnce(body(oldStart,'  function startYear(){'),'careerSession.stepQ=[phasePre,phaseIntlPre,phaseMid,phaseEnd];','careerSession.stepQ=yearSteps();','stepQ')+'}\n'+
  '}\n';
assert.equal(moduleText,expected,'YearFlow is the BASE year skeleton plus the listed edits only');
for(const pattern of [/\bR\(/,/\bri\(/,/\bchance\(/,/\bpick\(/,/\bpickRecord\(/])assert.doesNotMatch(moduleText,pattern,'no draw site');
assert.deepEqual(moduleText.match(/this\.(?!#deps)\w+\(/g),['this.advanceWithoutSalaryFinalization('],'one internal call; every other call leaves through #deps');

// ---- Part 2: old sections (vm) vs YearFlow (main realm) ----
const NAMES=['nextStep','advance','reportFlowOutcome','phaseIntlPre','startYear'];
const oldScript="'use strict';\n"+[oldNext,oldAdvance+oldOverride,oldReport,oldFlowHooks,oldIntl,oldStart].join('\n');
function environment(c){
  const log=[],state={year:2040,age:30,stageYr:5,done:false,events:{year:2039},...c.state},session=new CareerSession();
  const act={style:{},buttons:[{disabled:false},{disabled:false}],querySelectorAll:selector=>{assert.equal(selector,'button');return act.buttons;}};
  const stubs={
    $:id=>{log.push(['$',id]);assert.equal(id,'act');return act;},
    finalizePendingOffseasonSalary:()=>{log.push(['finalize',state.year]);if(c.finalizeThrows)throw new Error('FINALIZE_FAULT');},
    divider:t=>log.push(['divider',t]),stageLabel:()=>{log.push(['stageLabel']);return 'NPB一軍';},
    processIntlPhase:(phase,done)=>{log.push(['intl',phase]);if(c.intlDone!==false)done();},
    endGame:reason=>log.push(['endGame',reason]),
    // The module imports resetEventYear; both sides run the real policy and the state comparison covers its effect.
    resetEventYear,
  };
  return {log,state,session,act,stubs};
}
function steps(env,c,next){
  const step=name=>({[name](){env.log.push([name,env.state.year]);if(c.stepThrows===name)throw new Error('STEP_FAULT:'+name);if(c.chain!==false&&name!=='phaseEnd')next();}})[name];
  return {phasePre:step('phasePre'),phaseMid:step('phaseMid'),phaseEnd:step('phaseEnd')};
}
// vm errors come from another realm, so no instanceof check.
const fresh=x=>{if(x===undefined||x===null)return x;if(typeof x.message==='string'&&'stack' in x)return {error:x.message,cause:x.cause?.message??null};return x;};
function snapshot(env,handoffs,flowHooks,result){
  const years=handoffs.get(env.state);
  return JSON.stringify({result:fresh(result),log:env.log,state:env.state,queue:env.session.stepQ.map(f=>f.name),
    session:{generation:env.session.choiceGeneration,token:env.session.activeChoiceToken},act:{style:env.act.style,disabled:env.act.buttons.map(b=>b.disabled)},
    handoffs:years?[...years.entries()]:null,hooks:Object.keys(flowHooks).filter(k=>flowHooks[k])});
}
function prepare(env,c,handoffs){if(c.handoffs)handoffs.set(env.state,new Map(c.handoffs.map(h=>[h.fromYear,{...h}])));if(c.token)env.session.activeChoiceToken={generation:7};if(c.context)env.session.currentChoiceContext={state:c.context.sameState===false?{}:env.state,year:c.context.year};}
function runOld(c){
  const env=environment(c),handoffs=new WeakMap(),ctx=createContext({S:env.state,careerSession:env.session,yearHandoffs:handoffs,...env.stubs});
  runInContext(oldScript,ctx);
  Object.assign(ctx,steps(env,c,()=>runInContext('nextStep()',ctx)));
  const flowHooks=runInContext('flowHooks',ctx);if(c.hooks)for(const k of c.hooks)flowHooks[k]=outcome=>env.log.push(['hook.'+k,outcome.kind]);
  prepare(env,c,handoffs);
  const api=Object.fromEntries(NAMES.map(name=>[name,(...a)=>ctx[name](...a)]));
  let result;try{result=c.call(api,env);}catch(e){result=e;}
  return snapshot(env,handoffs,flowHooks,result);
}
function runNew(c,trace){
  const env=environment(c),handoffs=new WeakMap(),flowHooks={advance:null,endGame:null};let flow;
  const named={nextStep(){return flow.nextStep();},advance(){return flow.advance();},reportFlowOutcome(o){return flow.reportFlowOutcome(o);},phaseIntlPre(){return flow.phaseIntlPre();},startYear(){return flow.startYear();}};
  const {phasePre,phaseMid,phaseEnd}=steps(env,c,()=>named.nextStep()),phaseIntlPre=named.phaseIntlPre;
  const hit=(name,fn)=>(...a)=>{trace?.push(name);return fn(...a);};
  flow=new YearFlow({getState:()=>env.state,careerSession:env.session,yearHandoffs:handoffs,flowHooks,$:env.stubs.$,
    finalizePendingOffseasonSalary:env.stubs.finalizePendingOffseasonSalary,startYear:hit('startYear',()=>named.startYear()),nextStep:hit('nextStep',()=>named.nextStep()),
    advance:hit('advance',()=>named.advance()),endGame:hit('endGame',reason=>env.stubs.endGame(reason)),processIntlPhase:env.stubs.processIntlPhase,
    divider:env.stubs.divider,stageLabel:env.stubs.stageLabel,yearSteps:()=>[phasePre,phaseIntlPre,phaseMid,phaseEnd]});
  if(c.hooks)for(const k of c.hooks)flowHooks[k]=outcome=>env.log.push(['hook.'+k,outcome.kind]);
  prepare(env,c,handoffs);
  let result;try{result=c.call(named,env);}catch(e){result=e;}
  return snapshot(env,handoffs,flowHooks,result);
}
const KINDS={advance:['AMATEUR_STAY','AMATEUR_ENTER_UNIVERSITY','AMATEUR_JOIN_CORP','AMATEUR_JOIN_IND','AMATEUR_SIGNED_MILB','AMATEUR_DRAFTED','DEMOTION_TRANSFER_NPB1','DEMOTION_TRANSFER_NPB2','DEMOTION_TRANSFER_CPBL1','DEMOTION_ACCEPTED','DEMOTION_REFUSED','CROSS_OFFER_RESOLVED','CONTRACT_RENEWED','ARBITRATION_SETTLED','FA_SIGNED','FA_NO_BID_RETURNED','RELEASE_SIGNED_PRO','RELEASE_JOINED_AMATEUR','PRESEASON_RETURNED_NPB','REHAB_YEAR_COMPLETED'],
  endGame:['AMATEUR_RETIRED','DEMOTION_RETIRED','ACTIVE_MINIMUM_RETIRED','FA_RETIRED','RELEASE_RETIRED','PRESEASON_AGE_LIMIT_RETIRED','PRESEASON_RETIRED']};
const cases=[
  {name:'startYear runs the whole queue',call:f=>f.startYear()},
  {name:'startYear stops after phasePre',call:f=>f.startYear(),chain:false},
  {name:'intl PRE without done keeps the rest queued',call:f=>f.startYear(),intlDone:false},
  {name:'nextStep on an empty queue',call:f=>f.nextStep()},
  {name:'nextStep after retirement clears the queue',call:(f,env)=>{f.startYear();env.state.done=true;return f.nextStep();},chain:false},
  {name:'nextStep with done',call:f=>f.nextStep(),state:{done:true}},
  {name:'phaseIntlPre alone',call:f=>f.phaseIntlPre()},
  {name:'advance commits the next year',call:f=>f.advance()},
  {name:'advance twice from the same choice is a no-op',call:f=>{f.advance();return f.advance();},context:{year:2040}},
  {name:'advance from a choice of this year',call:f=>f.advance(),context:{year:2040}},
  {name:'advance from a foreign choice context uses S.year',call:f=>f.advance(),context:{year:2031,sameState:false}},
  {name:'STALE_YEAR_HANDOFF',call:f=>f.advance(),context:{year:2039}},
  {name:'NEXT_YEAR_AMBIGUOUS from a started handoff of this year',call:f=>f.advance(),handoffs:[{fromYear:2039,targetYear:2040,age:30,stageYr:5,status:'STARTED'}]},
  {name:'NEXT_YEAR_AMBIGUOUS from an uncommitted handoff of another year',call:f=>f.advance(),context:{year:2039},handoffs:[{fromYear:2039,targetYear:2040,age:30,stageYr:5,status:'PREPARED'}]},
  {name:'committed handoff returns',call:f=>f.advance(),context:{year:2039},handoffs:[{fromYear:2039,targetYear:2040,age:30,stageYr:5,status:'COMMITTED'}]},
  {name:'prepared handoff of this year is reused',call:f=>f.advance(),handoffs:[{fromYear:2040,targetYear:2041,age:40,stageYr:9,status:'PREPARED'}]},
  {name:'step fault disables the action area',call:f=>f.advance(),stepThrows:'phaseMid'},
  {name:'step fault clears the active choice token',call:f=>f.advance(),stepThrows:'phaseEnd',token:true},
  {name:'step fault then retry is ambiguous',call:f=>{try{f.advance();}catch{}return f.advance();},stepThrows:'phasePre'},
  {name:'finalize fault happens before the hand-off',call:f=>f.advance(),finalizeThrows:true},
  {name:'unknown outcome',call:f=>f.reportFlowOutcome({kind:'AMATEUR_UNKNOWN'})},
  ...Object.entries(KINDS).flatMap(([target,kinds])=>kinds.flatMap(kind=>{const call=f=>f.reportFlowOutcome({kind,reason:'理由:'+kind});return [
    {name:kind+' -> '+target,call},
    {name:kind+' -> hook',call,hooks:['advance','endGame']},
    {name:kind+' -> other hook only',call,hooks:[target==='advance'?'endGame':'advance']}];})),
];
let compared=0;
for(const c of cases){
  const old=runOld(c),current=runNew(c);
  assert.ok(old.length>40,c.name+' has a snapshot');
  assert.equal(current,old,c.name);compared++;
}
assert.equal(compared,21+3*(KINDS.advance.length+KINDS.endGame.length));
// The cases reach every branch they are named for (guards against a vacuous comparison).
const outcome=name=>JSON.parse(runOld(cases.find(c=>c.name===name)));
assert.deepEqual(outcome('STALE_YEAR_HANDOFF').result,{error:'STALE_YEAR_HANDOFF',cause:null});
assert.equal(outcome('NEXT_YEAR_AMBIGUOUS from a started handoff of this year').result.error,'NEXT_YEAR_AMBIGUOUS');
assert.deepEqual(outcome('step fault disables the action area').result,{error:'NEXT_YEAR_AMBIGUOUS',cause:'STEP_FAULT:phaseMid'});
assert.deepEqual(outcome('step fault disables the action area').act,{style:{pointerEvents:'none'},disabled:[true,true]});
assert.equal(outcome('step fault then retry is ambiguous').result.cause,null);
assert.deepEqual(outcome('step fault clears the active choice token').session,{generation:1,token:null});
assert.deepEqual(outcome('advance commits the next year').handoffs,[[2040,{fromYear:2040,targetYear:2041,age:31,stageYr:6,status:'COMMITTED'}]]);
assert.deepEqual(outcome('startYear stops after phasePre').queue,['phaseIntlPre','phaseMid','phaseEnd']);
assert.deepEqual(outcome('finalize fault happens before the hand-off').log,[['finalize',2040]]);

// ---- Part 3: every outgoing call goes through the injected lambda ----
const reach=(c,expected)=>{const trace=[];runNew({chain:false,...c},trace);assert.deepEqual(trace,expected,'reach: '+c.name);};
reach({name:'advance',call:f=>f.advance()},['startYear','nextStep']);
reach({name:'startYear',call:f=>f.startYear()},['nextStep']);
reach({name:'phaseIntlPre',call:f=>f.phaseIntlPre()},['nextStep']);
reach({name:'reportFlowOutcome advance',call:f=>f.reportFlowOutcome({kind:'FA_SIGNED'})},['advance','startYear','nextStep']);
reach({name:'reportFlowOutcome endGame',call:f=>f.reportFlowOutcome({kind:'FA_RETIRED',reason:'x'})},['endGame']);
console.log('year-flow: verbatim module, '+compared+' old/new cases, 5 reach checks PASS');
