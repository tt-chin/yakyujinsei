import assert from 'node:assert/strict';
import {identifyAwardDecision} from '../docs/src/engine/award-identity-policy.js';
import {annualAwardTransaction,preallocateAwardSlots,captureAwardSlot,recordAwardDecisions,prepareAwardReceipt,commitAwardReceipt,completeAwardDecisions,isCompletedAwardDecision,inspectAwardTransaction} from '../docs/src/engine/award-transaction-policy.js';
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};
const setup=()=>{const s={seed:'receipt-fixture',year:2039,traits:{glass:true,phoenix:false},pool:7,removed:[],honors:[]};const context={league:'NPB',level:'NPB1',role:'SP',metrics:{W:15,L:7,IP:180.1}};return {s,context,t:annualAwardTransaction(s,context)};};
test('F-B01/02: legacy chance100 still draws once, repeat draws zero',()=>{const {s,t}=setup();preallocateAwardSlots(t,['MVP']);let calls=0,r=0;const draw=()=>{calls++;r++;return .5;};assert(captureAwardSlot(t,'MVP',100,draw,()=>r));assert(captureAwardSlot(t,'MVP',100,draw,()=>r));assert.equal(calls,1);assert.equal(s.pool,7);});
test('F-B03/04/12: partial primitive writes resume once',()=>{const {s,t}=setup();prepareAwardReceipt(t,'phoenix',[{path:['traits','glass'],after:false},{path:['traits','phoenix'],after:true},{path:['pool'],after:15},{path:['removed'],after:['スペランカー']}]);let once=true;assert.throws(()=>commitAwardReceipt(t,'phoenix',()=>{if(once){once=false;throw Error('INJECTED_AFTER_WRITE');}}),/INJECTED/);assert.equal(s.traits.glass,false);assert.equal(s.pool,7);commitAwardReceipt(t,'phoenix');assert.equal(s.pool,15);assert.equal(commitAwardReceipt(t,'phoenix'),false);assert.deepEqual(s.removed,['スペランカー']);});
test('F-B12: legitimate concurrent pool write conflicts without overwriting',()=>{const {s,t}=setup();prepareAwardReceipt(t,'pool',[{path:['pool'],after:15}]);s.pool=100;assert.throws(()=>commitAwardReceipt(t,'pool'),/EFFECT_CONFLICT/);assert.equal(s.pool,100);});
test('F-B05: after record fault resumes without new native RNG',()=>{const {t}=setup();preallocateAwardSlots(t,['MVP']);let calls=0;assert.throws(()=>captureAwardSlot(t,'MVP',50,()=>{calls++;return .2;},()=>calls,()=>{throw Error('AFTER_RECORD');}),/AFTER_RECORD/);assert(captureAwardSlot(t,'MVP',50,()=>{calls++;return .9;},()=>calls));assert.equal(calls,1);});
test('unsupported gap is ambiguous and cannot redraw',()=>{const {t}=setup();preallocateAwardSlots(t,['MVP']);let calls=0;assert.throws(()=>captureAwardSlot(t,'MVP',50,()=>{calls++;throw Error('GAP');},()=>calls),/AMBIGUOUS_RNG/);assert.throws(()=>captureAwardSlot(t,'MVP',50,()=>{calls++;return .5;},()=>calls),/AMBIGUOUS_RNG/);assert.equal(calls,1);});
test('F-B07/08: new year/state separates transactions',()=>{const {s,t,context}=setup();s.year++;assert.notEqual(annualAwardTransaction(s,context),t);assert.notEqual(annualAwardTransaction({...s},context),t);});
test('F-B09: paid history cannot draw without trusted Journal',()=>{const {s,context}=setup();assert.throws(()=>annualAwardTransaction({...s,lastSalaryPaidYear:2039},context),/HISTORICAL_READ_ONLY/);assert.throws(()=>annualAwardTransaction({...s,awardDecisions:[{year:2039,leagueKey:'NPB'}]},context),/UNKNOWN_HISTORY/);assert.throws(()=>annualAwardTransaction({...s,honors:['2039 NPB最優秀投手賞']},context),/UNKNOWN_HISTORY/);});
test('preparation rejects unwritable Journal/effects before any draw',()=>{
  const {s,context}=setup();for(const key of ['awardDecisions','pool']){const frozen={...s};Object.defineProperty(frozen,key,{value:key==='pool'?7:[],writable:false});assert.throws(()=>annualAwardTransaction(frozen,context),/INVALID_EFFECT_PROPERTY/);}
  assert.throws(()=>annualAwardTransaction({...s,awardDecisions:null},context),/INVALID_DECISION_HISTORY/);
});
test('invalid year, frozen level, role and metrics reject preparation',()=>{
  const {s,context}=setup();for(const year of [0,-1,10000,NaN])assert.throws(()=>annualAwardTransaction({...s,year},context),/INVALID_AWARD_CONTEXT/);
  for(const override of [{level:'NPB2'},{role:'FAKE'},{metrics:null},{metrics:[]}])assert.throws(()=>annualAwardTransaction({...s},{...context,...override}),/INVALID_AWARD_CONTEXT/);
});
test('actual defense and batting triple-crown producer history without Journal is unknown',()=>{
  const {s,context}=setup();for(const title of ['年間最優秀守備選手','打撃三冠王'])assert.throws(()=>annualAwardTransaction({...s,honors:['2039 NPB'+title]},context),/UNKNOWN_HISTORY/);
});
test('completed decision authority rejects caller boolean/copies and preserves ordered history',()=>{const {s,t}=setup();preallocateAwardSlots(t,['ALL_STAR','MVP']);let r=0;for(const id of ['ALL_STAR','MVP'])captureAwardSlot(t,id,100,()=>{r++;return .5;},()=>r);prepareAwardReceipt(t,'honors',[{path:['honors'],after:['2039 NPB年間MVP']}]);commitAwardReceipt(t,'honors');completeAwardDecisions(t);assert.deepEqual(s.awardDecisions.map(d=>d.awardId),['ALL_STAR','MVP']);assert(isCompletedAwardDecision(s.awardDecisions[0],s));assert(!isCompletedAwardDecision({...s.awardDecisions[0],trusted:true},s));const before=structuredClone(s);completeAwardDecisions(t);assert.deepEqual(s,before);assert.equal(inspectAwardTransaction(t).phase,'AWARD_EFFECTS_COMMITTED');});
for(const mutation of ['reorder','content','remove'])test('decision history conflict '+mutation,()=>{
  const {s,t}=setup();preallocateAwardSlots(t,['ALL_STAR','MVP']);for(const id of ['ALL_STAR','MVP'])captureAwardSlot(t,id,100,()=>.5,()=>0);completeAwardDecisions(t);
  if(mutation==='reorder')s.awardDecisions.reverse();else if(mutation==='content')s.awardDecisions[0].metrics.W=99;else s.awardDecisions.pop();
  assert.throws(()=>completeAwardDecisions(t),/DECISION_HISTORY_CONFLICT/);
});
test('F-B03: DECIDED Journal precedes effects, not completion authority',()=>{
  const {s,t}=setup();preallocateAwardSlots(t,['MVP']);captureAwardSlot(t,'MVP',100,()=>.5,()=>0);const decisions=recordAwardDecisions(t);
  assert.equal(decisions[0].decisionStatus,'DECIDED');assert.equal(inspectAwardTransaction(t).phase,'DRAW_RECORDED');assert(!isCompletedAwardDecision(decisions[0],s));assert.equal(s.awardDecisions,undefined);
  prepareAwardReceipt(t,'honor',[{path:['honors'],after:['2039 NPB年間MVP']}]);assert.equal(s.honors.length,0);assert.throws(()=>completeAwardDecisions(t),/UNCOMMITTED_AWARD_EFFECT/);
  commitAwardReceipt(t,'honor');completeAwardDecisions(t);assert.equal(s.honors.length,1);assert(isCompletedAwardDecision(s.awardDecisions[0],s));
});
for(const originalMvp of [true,false,null])test('F-B06/10: completed P07 fixture shared MVP Receipt, legacy '+originalMvp,()=>{
  const {s,t}=setup();let calls=0;
  if(originalMvp!==null){preallocateAwardSlots(t,['MVP']);captureAwardSlot(t,'MVP',originalMvp?100:0,()=>{calls++;return .5;},()=>calls);}
  // Explicit completed-Decision fixture payload, NOT a new producer or trusted Adapter.
  const fixture=Object.freeze({year:2039,league:'NPB',awarded:true,awardId:'PITCH_TRIPLE_CROWN',sources:['PITCH_WINS','PITCH_ERA','PITCH_STRIKEOUTS']});
  assert.equal(fixture.awarded,true);assert(!isCompletedAwardDecision(fixture,s));
  prepareAwardReceipt(t,'fixture-final-mvp',[{path:['honors'],after:['2039 NPB年間MVP']}]);commitAwardReceipt(t,'fixture-final-mvp');commitAwardReceipt(t,'fixture-final-mvp');assert.deepEqual(s.honors,['2039 NPB年間MVP']);assert.equal(calls,originalMvp===null?0:1);
});
test('F-B11: completed P08/MVP fixture effects share one phoenix Receipt',()=>{
  const {s,t,context}=setup();
  // G3 only: already-qualified completed fixture; no P08 qualification/producer consumer.
  const payload=Object.freeze([{awardId:'PITCH_SAWAMURA',awarded:true},{awardId:'MVP',awarded:true}]);assert(payload.every(d=>!isCompletedAwardDecision(d,s)));
  const writes=[{path:['traits','glass'],after:false},{path:['traits','phoenix'],after:true},{path:['pool'],after:15},{path:['removed'],after:['スペランカー']}];
  for(const decision of payload){prepareAwardReceipt(t,'fixture-shared-phoenix',writes);commitAwardReceipt(t,'fixture-shared-phoenix');}
  assert.equal(s.pool,15);assert.deepEqual(s.removed,['スペランカー']);s.year++;const next=annualAwardTransaction(s,context);
  prepareAwardReceipt(next,'fixture-already-phoenix',[]);commitAwardReceipt(next,'fixture-already-phoenix');assert.equal(s.pool,15);
});
test('F-B08: different frozen league has distinct full keys; context conflict rejects',()=>{
  const {s,t,context}=setup(),other=annualAwardTransaction(s,{...context,league:'KBO',level:'KBO1'});
  for(const tx of [t,other]){preallocateAwardSlots(tx,['MVP']);captureAwardSlot(tx,'MVP',100,()=>.5,()=>0);completeAwardDecisions(tx);}
  assert.notEqual(s.awardDecisions[0].decisionKey,s.awardDecisions[1].decisionKey);assert.throws(()=>annualAwardTransaction(s,{...context,metrics:{W:99}}),/AWARD_CONTEXT_CONFLICT/);
});
test('F-B07: append next year preserves all earlier live completion proofs',()=>{
  const {s,t,context}=setup();preallocateAwardSlots(t,['MVP']);captureAwardSlot(t,'MVP',100,()=>.5,()=>0);completeAwardDecisions(t);const first=s.awardDecisions[0];
  s.year++;const next=annualAwardTransaction(s,context);preallocateAwardSlots(next,['MVP']);captureAwardSlot(next,'MVP',100,()=>.5,()=>0);completeAwardDecisions(next);
  assert.equal(s.awardDecisions[0],first);assert(isCompletedAwardDecision(first,s));assert(isCompletedAwardDecision(s.awardDecisions[1],s));
});
test('F-B12: history write fault resumes original append offset once',()=>{
  const {s,t}=setup();preallocateAwardSlots(t,['ALL_STAR','MVP']);for(const id of ['ALL_STAR','MVP'])captureAwardSlot(t,id,100,()=>.5,()=>0);
  assert.throws(()=>completeAwardDecisions(t,()=>{throw Error('AFTER_HISTORY_WRITE');}),/AFTER_HISTORY_WRITE/);assert.equal(s.awardDecisions.length,2);assert(!isCompletedAwardDecision(s.awardDecisions[0],s));
  completeAwardDecisions(t);assert.equal(s.awardDecisions.length,2);assert(s.awardDecisions.every(d=>isCompletedAwardDecision(d,s)));completeAwardDecisions(t);assert.equal(s.awardDecisions.length,2);
});
test('old year and seed tokens cannot draw, prepare, commit or complete',()=>{
  for(const change of ['year','seed']){
    const {s,t}=setup();preallocateAwardSlots(t,['MVP']);prepareAwardReceipt(t,'pool',[{path:['pool'],after:15}]);
    if(change==='year')s.year++;else s.seed='new-seed';
    for(const operation of [()=>preallocateAwardSlots(t,['ROOKIE']),()=>captureAwardSlot(t,'MVP',100,()=>{throw Error('MUST_NOT_DRAW');},()=>0),()=>prepareAwardReceipt(t,'other',[]),()=>commitAwardReceipt(t,'pool'),()=>completeAwardDecisions(t)])assert.throws(operation,/STALE_AWARD_TRANSACTION/);
    assert.equal(s.pool,7);
  }
});
test('trusted Adapter requires live completion; history remains readable after handoff',()=>{
  const {s,t}=setup();preallocateAwardSlots(t,['LEGACY_BEST_PITCHER']);captureAwardSlot(t,'LEGACY_BEST_PITCHER',100,()=>.5,()=>0);completeAwardDecisions(t);
  const decision=s.awardDecisions[0];assert.equal(identifyAwardDecision(decision,s).awardId,'LEGACY_BEST_PITCHER');assert.equal(identifyAwardDecision(decision,s).decisionVerified,true);
  assert.equal(identifyAwardDecision(structuredClone(decision),s).decisionVerified,false);assert.equal(identifyAwardDecision(decision,{...s}).decisionVerified,false);
  s.year++;assert.equal(identifyAwardDecision(decision,s).decisionVerified,true);
});
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_PRODUCT_MODULE_FIXTURE; not game integration'}));
