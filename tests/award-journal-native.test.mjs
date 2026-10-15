import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {productionFunction} from './retirement-hof-test-support.mjs';
import * as policy from '../docs/src/engine/award-transaction-policy.js';
import {awardTraitUnlocks,TRAIT_TEXT,traitLabel} from '../docs/src/engine/trait-policy.js';
const baseline=execFileSync('git',['show','d2ea8a3bcf38044928aab86ae56289839c45a0e4:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
const current=fs.readFileSync('docs/src/engine/game.js','utf8');
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};
const initial=(league,pos='P',role='SP')=>({seed:'native-journal-'+league,year:2039,age:36,pos,role,
  lv:league==='MLB'?'MLB':league+'1',seasonFactor:1,orgTeamId:'fixture',
  stats:{[league]:{yr:2,AS:0}},honors:['2038 NPB新人王'],traits:{glass:true,phoenix:false,yips:true},removed:[],pool:7});
const st={d:15,G:143,IP:200,era:2,SO:260,SV:40,HLD:35,W:17,L:6,PA:680,AB:600,H:220,BB:100,HR:50,RBI:145,SB:45,DEF:12,avg:220/600};
function harness(source,state,{render=false,slot=false}={}){
  const cards=[],rng=[];let renderFault=render,slotFault=slot;
  const context=vm.createContext({S:structuredClone(state),structuredClone,TextEncoder,TRAIT_TEXT,awardTraitUnlocks,
    ...policy,captureAwardSlot:(...args)=>policy.captureAwardSlot(...args,slotFault?()=>{slotFault=false;throw Error('AFTER_RECORD_FAULT');}:undefined),
    traitPresentation:new WeakMap(),traitLabel,teamNick:x=>x,displayTrait:k=>traitLabel(k,context.S,x=>x),board:()=>{},recordR:x=>rng.push(structuredClone(x)),
    card:(...args)=>{if(renderFault&&args[1]==='年間賞'){renderFault=false;throw Error('RENDER_FAULT');}cards.push(args);}});
  const levels=source.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1];
  const functions=['awards',...(source.includes('function collectLegacyAwardPlan(')?['renderCheckpointCard','collectLegacyAwardPlan']:[]),'isSP','removeTrait','fnv1a32'].map(n=>productionFunction(n,source)).join('\n');
  vm.runInContext(`const LV=${levels};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let _s=0,seedInit,R;
    ${source.match(/seedInit = function\(seed\)\{[^\n]+/)[0]}
    ${source.match(/R = function\(\)\{[^\n]+/)[0]}
    const originalR=R;R=()=>{const before=S.rngState,value=originalR();recordR({before,after:S.rngState,value});return value;};
    const chance=p=>R()*100<p;${functions};seedInit(S.seed);`,context);
  context.st=structuredClone(st);context.bucket=state.lv==='MLB'?'MLB':state.lv.replace(/1$/,'');
  return {context,cards,rng,run:()=>vm.runInContext('awards(bucket,st)',context),snapshot:()=>JSON.parse(vm.runInContext('JSON.stringify(S)',context))};
}
function validateHistory(h){
  const state=h.snapshot(),rows=state.awardDecisions;
  assert(Array.isArray(rows));assert.equal(rows.length,h.rng.length);
  const expectedIds=state.pos==='P'?['ALL_STAR',...(state.role==='SP'?['LEGACY_BEST_PITCHER']:state.role==='CL'?['PITCH_SAVES']:['PITCH_RELIEF']),'PITCH_STRIKEOUTS','MVP']:
    ['ALL_STAR','BATTING_AVG','BATTING_HR','BATTING_SB','BATTING_RBI','BATTING_OBP','GOLD_GLOVE','DEFENSE_BEST','MVP'];
  assert.deepEqual(rows.map(d=>d.awardId),expectedIds,'Exact native eligible slot order');
  const ids=new Set();for(let i=0;i<rows.length;i++){
    const d=rows[i];assert.equal(d.schemaVersion,1);assert.equal(d.decisionStatus,'DECIDED');assert.equal(d.drawSource,'LEGACY_MAIN_RNG');
    assert.equal(d.year,state.year);assert.equal(d.leagueKey,h.context.bucket);assert.equal(d.level,state.lv);assert.equal(d.role,state.role);
    assert.equal(d.u,h.rng[i].value);assert.equal(d.rngBefore,h.rng[i].before);assert.equal(d.rngAfter,h.rng[i].after);
    assert.equal(d.awarded,d.u*100<d.pPercent);assert.deepEqual(d.metrics,st);assert(!ids.has(d.decisionKey));ids.add(d.decisionKey);
    assert.equal(d.keySchemaVersion,1);assert.equal(d.ruleId,'legacy-v1');assert.equal(d.legacySlotId,d.awardId);
    assert.deepEqual(d.reasonCodes,['LEGACY_ELIGIBLE']);assert.deepEqual(d.sources,['LEGACY_MAIN_RNG']);
    const chunks=['legacy-award-v1',state.seed,String(state.year),h.context.bucket,d.awardId,'legacy-v1'].map(value=>{
      const bytes=Buffer.from(value,'utf8'),size=Buffer.alloc(4);size.writeUInt32BE(bytes.length);return Buffer.concat([size,bytes]);
    });
    assert.equal(d.decisionKey,Buffer.concat(chunks).toString('hex'),'Independent full identity encoding');
    assert(policy.isCompletedAwardDecision(h.context.S.awardDecisions[i],h.context.S));
    assert(!policy.isCompletedAwardDecision(d,h.context.S),'serialized lookalike is untrusted');
  }
}
for(const league of ['NPB','KBO','CPBL','MLB'])for(const [pos,role] of [['P','SP'],['P','MR'],['P','CL'],['IF',null]])test('native '+league+'/'+pos+'/'+role+' exact legacy S/R/cards',()=>{
  const old=harness(baseline,initial(league,pos,role)),now=harness(current,initial(league,pos,role));old.run();now.run();validateHistory(now);
  const output=now.snapshot();delete output.awardDecisions;
  assert.deepEqual(output,old.snapshot(),'Only approved technical field differs');assert.deepEqual(now.rng,old.rng);assert.deepEqual(now.cards,old.cards);
  const before=now.snapshot(),cards=now.cards.length;now.run();assert.deepEqual(now.snapshot(),before);assert.equal(now.cards.length,cards);assert.deepEqual(now.rng,old.rng);
});
test('F-A04: native render fault resumes same saved award result',()=>{
  const h=harness(current,initial('NPB'),{render:true});assert.throws(h.run,/RENDER_FAULT/);
  const before=h.snapshot(),calls=h.rng.length;h.run();assert.deepEqual(h.snapshot(),before);assert.equal(h.rng.length,calls);validateHistory(h);
});
test('F-B05: native after-record fault does not mutate effects or redraw',()=>{
  const h=harness(current,initial('NPB'),{slot:true});assert.throws(h.run,/AFTER_RECORD_FAULT/);assert.equal(h.context.S.pool,7);assert.equal(h.context.S.stats.NPB.AS,0);
  const old=harness(baseline,initial('NPB'));old.run();h.run();const result=h.snapshot();delete result.awardDecisions;assert.deepEqual(result,old.snapshot());assert.deepEqual(h.rng,old.rng);validateHistory(h);
});
test('parallel pool mutation after a recorded slot stops native commit',()=>{
  const h=harness(current,initial('NPB'),{slot:true});assert.throws(h.run,/AFTER_RECORD_FAULT/);h.context.S.pool=100;
  assert.throws(h.run,/AWARD_INPUT_CONFLICT/);assert.equal(h.context.S.pool,100);assert.equal(h.context.S.stats.NPB.AS,0);
});
test('DH frozen position never enters fielding award slots',()=>{
  const state={...initial('NPB','IF',null),dpos:'DH'},old=harness(baseline,state),now=harness(current,state);old.run();now.run();
  assert.deepEqual(now.rng,old.rng,'DH must keep exactly the original eligible native RNG slots');
  const result=now.snapshot();delete result.awardDecisions;assert.deepEqual(result,old.snapshot());
  assert(!now.context.S.awardDecisions.some(d=>['GOLD_GLOVE','DEFENSE_BEST'].includes(d.awardId)));
});
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_GAME_FUNCTION_FIXTURE; render stub, not browser UI'}));
