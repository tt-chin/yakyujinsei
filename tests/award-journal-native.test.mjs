import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {productionFunction} from './retirement-hof-test-support.mjs';
import * as policy from '../docs/src/engine/award-transaction-policy.js';
import {hasCurrentAwardEffect} from '../docs/src/engine/award-consumer-policy.js';
import {getAwardDefinition} from '../docs/src/engine/award-identity-policy.js';
import {validateAwardHistory} from '../tools/development-b/historical-comparison.mjs';
import {expectedState} from '../tools/development-b/award-runtime-support.mjs';
import {awardTraitUnlocks,TRAIT_TEXT,traitLabel} from '../docs/src/engine/trait-policy.js';
import {Rng} from '../docs/src/engine/rng.js';
const baseline=execFileSync('git',['show','efd4710c4c5c366ff3aba69c59180031c82ff18a:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
const current=fs.readFileSync('docs/src/engine/game.js','utf8');
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};
const initial=(league,pos='P',role='SP')=>({seed:'native-journal-'+league,year:2039,age:36,pos,role,
  org:league,lv:league==='MLB'?'MLB':league+'1',seasonFactor:1,orgTeamId:'fixture',
  stats:{[league]:{yr:2,AS:0}},honors:['2038 NPB新人王'],traits:{glass:true,phoenix:false,yips:true},removed:[],pool:7});
const st={d:15,G:143,IP:200,era:2,SO:260,SV:40,HLD:35,W:17,L:6,PA:680,AB:600,H:220,BB:100,HR:50,RBI:145,SB:45,DEF:12,avg:220/600};
function harness(source,state,{render=false,slot=false}={}){
  const cards=[],rng=[];let renderFault=render,slotFault=slot;
  const context=vm.createContext({S:structuredClone(state),SEED:state.seed,getAwardDefinition,structuredClone,TextEncoder,Rng,TRAIT_TEXT,awardTraitUnlocks,hasCurrentAwardEffect,
    ...policy,captureAwardSlot:(...args)=>policy.captureAwardSlot(...args,slotFault?()=>{slotFault=false;throw Error('AFTER_RECORD_FAULT');}:undefined),
    traitPresentation:new WeakMap(),traitLabel,teamNick:x=>x,displayTrait:k=>traitLabel(k,context.S,x=>x),board:()=>{},recordR:x=>rng.push(structuredClone(x)),
    card:(...args)=>{if(renderFault&&args[1]==='年間賞'){renderFault=false;throw Error('RENDER_FAULT');}cards.push(args);}});
  const levels=source.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1];
  const functions=['awards',...(source.includes('function collectLegacyAwardPlan(')?['renderCheckpointCard','collectLegacyAwardPlan']:[]),'isSP','removeTrait','fnv1a32'].map(n=>productionFunction(n,source)).join('\n');
  vm.runInContext(`const LV=${levels};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let _s=0,seedInit,R;const careerRng=new Rng(()=>S,fnv1a32);
    ${source.match(/seedInit = function\(seed\)\{[^\n]+/)[0]}
    ${source.match(/R = function\(\)\{[^\n]+/)[0]}
    const originalR=R;R=()=>{const before=S.rngState,value=originalR();recordR({before,after:S.rngState,value});return value;};
    const chance=p=>R()*100<p;${functions};seedInit(S.seed);`,context);
  context.st=structuredClone(st);context.bucket=state.lv==='MLB'?'MLB':state.lv.replace(/1$/,'');
  return {c:context,context,cards,rng,run:()=>vm.runInContext('awards(bucket,st)',context),snapshot:()=>JSON.parse(vm.runInContext('JSON.stringify(S)',context))};
}
function validateHistory(h){
  const s=h.snapshot();validateAwardHistory({...s,log:[{y:s.year,st}]});
  const native=s.awardDecisions.filter(d=>d.drawSource==='LEGACY_MAIN_RNG');
  assert.equal(native.length,h.rng.length);
  native.forEach((d,i)=>{assert.equal(d.u,h.rng[i].value);assert.equal(d.rngBefore,h.rng[i].before);assert.equal(d.rngAfter,h.rng[i].after);});
  for(const [i,d] of s.awardDecisions.entries()){
    assert(policy.isCompletedAwardDecision(h.context.S.awardDecisions[i],h.context.S));
    assert(!policy.isCompletedAwardDecision(d,h.context.S),'serialized lookalike is untrusted');
  }
}
function compareApproved(old,now,initialState){
  const result=now.snapshot();delete result.awardDecisions;
  const expected=expectedState(old,initialState,now);assert.deepEqual(result,expected,'full ordinary S: explicit D2 effects only');
  assert.deepEqual(now.rng,old.rng,'every original native slot unchanged');
  const expectedCards=structuredClone(old.cards);
  const yearly=expectedCards.find(c=>c[1]==='年間賞');
  if(yearly)yearly[2]=expected.honors.filter(x=>x.startsWith(String(initialState.year))).map(x=>x.slice(5)).join('｜');
  if(!initialState.traits.pitcherTC&&expected.traits.pitcherTC)expectedCards.unshift(['gold','隠し特性解放：'+traitLabel('pitcherTC',expected,x=>x),TRAIT_TEXT.pitcherTC]);
  assert.deepEqual(now.cards,expectedCards,'only approved title names and acquisition card differ');
}
for(const league of ['NPB','KBO','CPBL','MLB'])for(const [pos,role] of [['P','SP'],['P','MR'],['P','CL'],['IF',null]])test('native '+league+'/'+pos+'/'+role+' exact legacy S/R/cards',()=>{
  const old=harness(baseline,initial(league,pos,role)),now=harness(current,initial(league,pos,role));old.run();now.run();validateHistory(now);
  compareApproved(old,now,initial(league,pos,role));
  const before=now.snapshot(),cards=now.cards.length;now.run();assert.deepEqual(now.snapshot(),before);assert.equal(now.cards.length,cards);assert.deepEqual(now.rng,old.rng);
});
test('F-A04: native render fault resumes same saved award result',()=>{
  const h=harness(current,initial('NPB'),{render:true});assert.throws(h.run,/RENDER_FAULT/);
  const before=h.snapshot(),calls=h.rng.length;h.run();assert.deepEqual(h.snapshot(),before);assert.equal(h.rng.length,calls);validateHistory(h);
});
test('F-B05: native after-record fault does not mutate effects or redraw',()=>{
  const h=harness(current,initial('NPB'),{slot:true});assert.throws(h.run,/AFTER_RECORD_FAULT/);assert.equal(h.context.S.pool,7);assert.equal(h.context.S.stats.NPB.AS,0);
  const old=harness(baseline,initial('NPB'));old.run();h.run();compareApproved(old,h,initial('NPB'));validateHistory(h);
});
test('parallel pool mutation after a recorded slot stops native commit',()=>{
  const h=harness(current,initial('NPB'),{slot:true});assert.throws(h.run,/AFTER_RECORD_FAULT/);h.context.S.pool=100;
  assert.throws(h.run,/AWARD_INPUT_CONFLICT/);assert.equal(h.context.S.pool,100);assert.equal(h.context.S.stats.NPB.AS,0);
});
test('DH frozen position never enters fielding award slots',()=>{
  const state={...initial('NPB','IF',null),dpos:'DH'},old=harness(baseline,state),now=harness(current,state);old.run();now.run();
  assert.deepEqual(now.rng,old.rng,'DH must keep exactly the original eligible native RNG slots');
  compareApproved(old,now,state);
  assert(!now.context.S.awardDecisions.some(d=>['GOLD_GLOVE','DEFENSE_BEST'].includes(d.awardId)));
});
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_GAME_FUNCTION_FIXTURE; render stub, not browser UI'}));
