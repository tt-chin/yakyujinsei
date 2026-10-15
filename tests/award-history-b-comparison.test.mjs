import assert from 'node:assert/strict';
import {harness,source,state,stat} from '../tools/development-b/award-runtime-support.mjs';
import {validateAwardHistory,historicalState,historicalCareer,assertApprovedProducerRenameCareer} from '../tools/development-b/historical-comparison.mjs';
let pass=0;const check=(name,f)=>{f();pass++;console.log('PASS '+name);};
const h=harness(source,state(),stat);h.run();const s=h.snapshot();s.log=[{y:s.year,st:structuredClone(stat)}];
check('all completed native/new/derived metadata accepted without modifying source',()=>{
  const before=structuredClone(s);validateAwardHistory(s);historicalCareer({state:s});assert.deepEqual(s,before);
});
const edits={
  duplicate:x=>x.awardDecisions.push(x.awardDecisions[0]),
  schema:x=>x.awardDecisions[0].schemaVersion++,
  keySchema:x=>x.awardDecisions[0].keySchemaVersion++,
  status:x=>x.awardDecisions[0].decisionStatus='PREPARED',
  key:x=>x.awardDecisions[0].decisionKey='fake',
  year:x=>x.awardDecisions[0].year++,
  league:x=>x.awardDecisions[0].leagueKey='KBO',
  level:x=>x.awardDecisions[0].level='NPB2',
  role:x=>x.awardDecisions[0].role='CL',
  metrics:x=>x.awardDecisions[0].metrics.W++,
  rngBefore:x=>x.awardDecisions[0].rngBefore++,
  rngAfter:x=>x.awardDecisions[0].rngAfter++,
  nativeU:x=>x.awardDecisions[0].u+=.000001,
  awarded:x=>x.awardDecisions[0].awarded=!x.awardDecisions[0].awarded,
  extra:x=>x.awardDecisions[0].unapproved=true,
  nativeOrder:x=>[x.awardDecisions[0],x.awardDecisions[1]]=[x.awardDecisions[1],x.awardDecisions[0]],
  independentProbability:x=>x.awardDecisions.find(d=>d.awardId==='PITCH_WINS').pPercent--,
  independentHash:x=>x.awardDecisions.find(d=>d.awardId==='PITCH_SAWAMURA').hash32=42,
  independentSource:x=>x.awardDecisions.find(d=>d.awardId==='PITCH_WINS').sources=['LEGACY_MAIN_RNG'],
  independentMissing:x=>x.awardDecisions.splice(x.awardDecisions.findIndex(d=>d.awardId==='PITCH_WIN_PCT'),1),
  tripleKey:x=>x.awardDecisions.find(d=>d.awardId==='PITCH_TRIPLE_CROWN').sourceDecisionKeys[0]='fake',
  tripleSources:x=>x.awardDecisions.find(d=>d.awardId==='PITCH_TRIPLE_CROWN').sources[0]='LEGACY_BEST_PITCHER',
  mvpGuarantee:x=>x.awardDecisions.find(d=>d.awardId==='MVP').sources=[],
};
for(const [name,mutate] of Object.entries(edits))check('reject '+name,()=>{const bad=structuredClone(s);mutate(bad);assert.throws(()=>historicalState(bad));});
for(const field of ['honors','pool','careerEarnings','traits'])check('ordinary '+field+' remains strictly visible',()=>{
  const changed=structuredClone(s);if(field==='honors')changed.honors.push('unapproved');else if(field==='traits')changed.traits.unapproved=true;else changed[field]=(changed[field]||0)+1;
  assert.notDeepEqual(historicalState(changed),historicalState(s));
});
check('same-version replay uses raw complete state, not historical projector',()=>{
  const repeat=harness(source,state(),stat);repeat.run();assert.deepEqual(repeat.snapshot(),h.snapshot());assert.deepEqual(repeat.rng,h.rng);
  const bad=structuredClone(h.snapshot());bad.awardDecisions[0].pPercent--;assert.notDeepEqual(bad,h.snapshot());
});
check('explicit producer oracle requires completed exact year/league native winner',()=>{
  const current=structuredClone(s),old=historicalState(s);
  const d=current.awardDecisions.find(d=>d.awardId==='PITCH_ERA'&&d.awarded);
  assert(d,'native ERA winner fixture required');
  const index=current.honors.indexOf(d.year+' NPB最優秀防御率投手賞');assert(index>=0);
  old.honors[index]=d.year+' NPB最優秀投手賞';
  const rawOld=structuredClone(old),rawCurrent=structuredClone(current);
  const result=assertApprovedProducerRenameCareer({state:old},{state:current});
  assert.equal(result.renames.length,1);assert.equal(result.renames[0].decisionKey,d.decisionKey);
  assert.deepEqual(old,rawOld);assert.deepEqual(current,rawCurrent);
  for(const field of ['pool','careerEarnings','honors','traits']){
    const bad=structuredClone(current);
    if(field==='honors')bad.honors.push('unapproved');else if(field==='traits')bad.traits.unapproved=true;else bad[field]=(bad[field]||0)+1;
    assert.throws(()=>assertApprovedProducerRenameCareer({state:old},{state:bad}),undefined,'must reject unrelated '+field);
  }
  const noDecision=structuredClone(current);delete noDecision.awardDecisions;
  assert.throws(()=>assertApprovedProducerRenameCareer({state:old},{state:noDecision}));
  const wrongYear=structuredClone(old);wrongYear.honors[index]=(d.year-1)+' NPB最優秀投手賞';
  assert.throws(()=>assertApprovedProducerRenameCareer({state:wrongYear},{state:current}));
  const wrongLeague=structuredClone(old);wrongLeague.honors[index]=d.year+' KBO最優秀投手賞';
  assert.throws(()=>assertApprovedProducerRenameCareer({state:wrongLeague},{state:current}));
  const rngA={state:old,rng:[{value:.1}]},rngB={state:current,rng:[{value:.2}]};
  assert.throws(()=>assertApprovedProducerRenameCareer(rngA,rngB),'RNG remains strict');
  const badHash=structuredClone(current);badHash.awardDecisions[0].u+=.01;
  assert.throws(()=>assertApprovedProducerRenameCareer({state:old},{state:badHash}));
});
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'STRICT_B_METADATA_VALIDATION; historical-only separation, ordinary S preserved; explicit Decision-proven producer renames'}));
