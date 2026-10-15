import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {productionFunction} from './retirement-hof-test-support.mjs';
import * as tx from '../docs/src/engine/award-transaction-policy.js';
import * as identity from '../docs/src/engine/award-identity-policy.js';
import * as consumers from '../docs/src/engine/award-consumer-policy.js';
import * as traits from '../docs/src/engine/trait-policy.js';
import {pitcherAwardCandidate} from '../docs/src/engine/pitcher-award-policy.js';
import {decideIndependentAward} from '../docs/src/engine/award-rng-policy.js';
import {calculateMarketAwardAdjustment} from '../docs/src/engine/salary-evaluation-policy.js';
import {salaryAwardBonus} from '../docs/src/engine/salary-promotion-policy.js';
import {evaluateIncentive} from '../docs/src/engine/incentive-policy.js';
import {honorScoreFor} from '../docs/src/engine/hall-of-fame-policy.js';
import {oldSource,source,stat,state,harness,validate,expectedState,labels} from '../tools/development-b/award-runtime-support.mjs';
let passed=0;const test=(id,f)=>{f();passed++;console.log('PASS '+id);};
for(const league of Object.keys(labels))for(const role of ['SP','MR','CL'])test('producer→Decision→Receipt→consumer '+league+'/'+role,()=>{
  const initial=state(league,role),old=harness(oldSource,initial,stat),now=harness(source,initial,stat);old.run();now.run();validate(now);
  assert.deepEqual(now.rng,old.rng,'same input, original slots preserve every native RNG value');
  const actual=now.snapshot();delete actual.awardDecisions;assert.deepEqual(actual,expectedState(old,initial,now),'complete ordinary S, only explicitly constructed D2 effects');
  const before=now.snapshot(),calls=now.rng.length;now.run();assert.deepEqual(now.snapshot(),before);assert.equal(now.rng.length,calls);
  const s=now.c.S,view={honors:s.honors,year:s.year,awardState:s};
  assert(calculateMarketAwardAdjustment(s.honors,s.year,s)>0);assert(salaryAwardBonus(s.honors,s.year,s)>0);
  assert.equal(evaluateIncentive({...view,terms:{annualMax:700000},evaluation:{payD:0,sampleStatus:'FULL'}}).level,'FULL');
  assert(honorScoreFor({...view,bucket:league,position:'P'}).sc>0);
});
for(const [id,flags] of [['after-slot',{slotFault:true}],['after-new',{newFault:true}],['after-effect',{effectFault:true}],['render',{renderFault:true}]])test('supported fault '+id,()=>{
  const initial=state(),normal=harness(source,initial,stat),failed=harness(source,initial,stat,flags);normal.run();assert.throws(failed.run,/AFTER_/);failed.run();validate(failed);
  assert.deepEqual(failed.snapshot(),normal.snapshot());assert.deepEqual(failed.rng,normal.rng);
});
for(const key of ['traits.glass','traits.phoenix','pool','removed','tripleCrownHistory','stats.NPB.AS','awardDecisions'])test('per-write fault '+key,()=>{
  const initial=state(),normal=harness(source,initial,stat),failed=harness(source,initial,stat,key==='awardDecisions'?{historyFault:true}:{effectFault:key});
  normal.run();assert.throws(failed.run,/AFTER_/);failed.run();validate(failed);
  assert.deepEqual(failed.snapshot(),normal.snapshot());assert.deepEqual(failed.rng,normal.rng);
});
for(const d of [0,6,15])test('P07 MVP native no-slot/false/true pathway d='+d,()=>{
  const initial=state('NPB','SP','d2-mvp-'+d),st={...stat,d},old=harness(oldSource,initial,st),now=harness(source,initial,st);old.run();now.run();validate(now);
  const decisions=now.c.S.awardDecisions,mvp=decisions.filter(x=>x.awardId==='MVP');assert.equal(mvp.length,1);assert.equal(mvp[0].awarded,true);
  assert.equal(mvp[0].sources.includes('TRIPLE_CROWN_GUARANTEE'),true);assert.deepEqual(now.rng,old.rng);
  if(d===0)assert.equal(mvp[0].drawSource,'DERIVED');if(d===6)assert.equal(mvp[0].legacyDrawAwarded,false);if(d===15)assert.equal(mvp[0].legacyDrawAwarded,true);
  assert.equal(now.c.S.honors.filter(x=>x==='2039 NPB年間MVP').length,1);
});
test('P08 real producer without P07 or native MVP shares one life-once effect',()=>{
  const initial=state(),st={...stat,d:0,SO:154,W:17,L:0,IP:220,era:1},h=harness(source,initial,st);h.run();validate(h);
  assert(h.c.S.awardDecisions.some(d=>d.awardId==='PITCH_SAWAMURA'&&d.awarded));
  assert(!h.c.S.awardDecisions.some(d=>d.awardId==='MVP'||d.awardId==='PITCH_TRIPLE_CROWN'),'no native MVP slot or P03 qualification');
  assert(consumers.hasCurrentAwardEffect(h.c.S,'demotion','NPB'));assert(!consumers.hasCurrentAwardEffect({...h.c.S,honors:[]},'demotion','KBO'));
  assert.equal(h.c.S.pool,15);h.run();assert.equal(h.c.S.pool,15);
});
test('new producer history without a trusted Journal fails closed',()=>{
  for(const id of ['PITCH_WINS','PITCH_ERA','PITCH_STRIKEOUTS','PITCH_WIN_PCT','PITCH_SAVES','PITCH_RELIEF','PITCH_TRIPLE_CROWN','PITCH_SAWAMURA']){
    const s=state();s.honors=['2039 NPB'+identity.getAwardDefinition(id).displayName];
    assert.throws(()=>tx.annualAwardTransaction(s,{league:'NPB',level:'NPB1',role:'SP',metrics:stat}),/UNKNOWN_HISTORY/,id);
  }
});
test('consumer-only names cannot fabricate three-award sources or trusted P08',()=>{
  const s=state();s.honors=['2039 NPB最多勝','2039 NPB最優秀防御率','2039 NPB年度MVP'];
  const t=tx.annualAwardTransaction(s,{league:'NPB',level:'NPB1',role:'SP',metrics:{...stat,W:0}});
  tx.preallocateAwardSlots(t,['LEGACY_BEST_PITCHER','PITCH_STRIKEOUTS']);
  const d2=tx.prepareD2AwardDecisions(t,s.seed);assert.equal(d2.triple,false);assert(!d2.decisions.some(d=>d.awardId==='PITCH_TRIPLE_CROWN'));
  assert.throws(()=>tx.annualAwardTransaction({...state(),honors:['2039 NPB最多奪三振']},{league:'NPB',level:'NPB1',role:'SP',metrics:stat}),/UNKNOWN_HISTORY/,'actual legacy award without Journal is not a consumer-only name');
  assert(!consumers.hasCurrentAwardEffect({...s,honors:['2039 NPB沢村賞']},'demotion','NPB'));
});
console.log(JSON.stringify({PASS:passed,FAIL:0,evidence:'NATIVE_GAME_FUNCTION_FIXTURE; actual policies/Journal/Receipt/consumers, not browser UI'}));
