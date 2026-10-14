import fs from 'node:fs';
import assert from 'node:assert/strict';
import {calculateMarketAwardAdjustment} from '../../src/engine/salary-evaluation-policy.js';
import {salaryAwardBonus} from '../../src/engine/salary-promotion-policy.js';
import {honorScoreFor} from '../../src/engine/hall-of-fame-policy.js';
import {evaluateIncentive} from '../../src/engine/incentive-policy.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const before=read('before-fixtures.json'),after=read('after-fixtures.json'),cases=[];
for(let i=0;i<before.cases.length;i++){
 const old=before.cases[i],now=after.cases[i],a=old.finalState,b=now.finalState;
 assert.equal(old.id,now.id);assert.deepEqual(a.honors,b.honors);assert.deepEqual(a.ct,b.ct);
 for(const k of ['currentSalary','careerBaseSalary','careerSigningBonus','careerEarnings','lastSalaryPaidYear','yearlyIncentivePaid'])assert.deepEqual(a[k],b[k]);
 if(old.id!=='B08-55chance')assert.deepEqual(old.rngValues,now.rngValues);
 if(old.policyStatus==='PASS')assert.deepEqual(a,b);
 const consumer=s=>({market:calculateMarketAwardAdjustment(s.honors,s.year),fallback:salaryAwardBonus(s.honors,s.year),hof:honorScoreFor({bucket:'NPB',honors:s.honors,position:s.pos}),incentive:evaluateIncentive({terms:s.ct.incentive,honors:s.honors,year:s.year,evaluation:{sampleStatus:'FULL',payD:4}})});
 assert.deepEqual(consumer(a),consumer(b));
 cases.push({id:old.id,status:'PASS',classification:old.policyStatus==='FAIL'?'INTENDED_BUG_FIX':'UNCHANGED_LEGACY',beforeR:old.rngCalls,afterR:now.rngCalls,beforePool:a.pool,afterPool:b.pool,consumers:consumer(b)});
}
const result={pass:cases.length,fail:0,unchanged:25,intendedFix:7,cases,limits:['Native synthetic fixture comparison, not real payment or complete season recovery','Consumer functions executed directly, using unchanged honors and contracts','Only B08 intentionally skips the original 55% demotion draw; no new RNG calls']};
if(process.argv.includes('--careers')){
 const load=p=>JSON.parse(fs.readFileSync(new URL('../../../test-results/'+p,import.meta.url),'utf8'));
 const old=load('g1-a-before-if-balanced/jp3-infielder-01-IF.career.json'),now=load('g1-a-after/jp3-infielder-01-IF.career.json');
 const beforeEvent=old.events.find(e=>e.kind==='awards'&&e.before.year===2042),afterEvent=now.events.find(e=>e.kind==='awards'&&e.before.year===2042);
 const strip=s=>{s=structuredClone(s);delete s.pool;delete s.removed;delete s.traits.glass;delete s.traits.phoenix;return s;};
 assert.deepEqual(beforeEvent.before,afterEvent.before);assert.deepEqual(strip(beforeEvent.after),strip(afterEvent.after));
 assert.equal(beforeEvent.rBefore,afterEvent.rBefore);assert.equal(beforeEvent.rAfter,afterEvent.rAfter);assert.deepEqual(old.rng,now.rng);
 const summary=s=>({honors:s.honors,earnings:s.careerEarnings,baseSalary:s.careerBaseSalary,signingBonus:s.careerSigningBonus,incentive:s.careerIncentive,year:s.year,glass:s.traits.glass,phoenix:s.traits.phoenix});
 result.natural={seed:'jp3-infielder-01',position:'IF',firstDifference:279,year:2042,status:'PASS',classification:'INTENDED_BUG_FIX',firstAwardOnlyChangedGlassPhoenixRemovedPool:true,awardRngUnchanged:true,all637RngValuesEqual:true,before:summary(old.state),after:summary(now.state),note:'The whole UI callback also reaches different continuation checkpoints because +8 creates allocation. Do not require all post-callback state to match; the actual awards boundary is compared exactly except the four authorized effect fields.'};
}
if(process.argv.includes('--full-diagnostic')){
 const load=p=>JSON.parse(fs.readFileSync(new URL('../../../test-results/'+p,import.meta.url),'utf8'));
 const dir='g1-a-full-control-diagnostic/',old=load(dir+'career-jp3-infielder-01-通常投球-old.json'),now=load(dir+'career-jp3-infielder-01-通常投球-current.json');
 const idx=now.awardEvents.findIndex((e,i)=>JSON.stringify(e.after)!==JSON.stringify(old.awardEvents[i]?.after)),a=old.awardEvents[idx],b=now.awardEvents[idx];
 const strip=s=>{s=structuredClone(s);delete s.pool;delete s.removed;delete s.traits.glass;delete s.traits.phoenix;return s;};
 assert.deepEqual(a.before,b.before);assert.deepEqual(strip(a.after),strip(b.after));assert.equal(a.rBefore,b.rBefore);assert.equal(a.rAfter,b.rAfter);assert.deepEqual(old.rng,now.rng);
 const intl=load('g1-a-full/tmp/international-personal-stats/career-jp3-infielder-01-current.json'),state=structuredClone(intl.state);delete state.version;
 assert.deepEqual(now.state,state);assert.deepEqual(now.rng,intl.rng);assert.deepEqual(now.steps.map(x=>x.action),intl.actions.map(x=>x.action));
 result.fullControl={diagnosticAssertions:'PASS',originalFullEntries:'FAIL / NOT_REWRITTEN',seed:'jp3-infielder-01',position:'IF',firstStep:265,year:b.before.year,firstAwardOnlyFourEffectFieldsChanged:true,rngAtAward:[a.rBefore,a.rAfter,b.rBefore,b.rAfter],all639RngValuesEqual:true,bothFailedEntriesSameCurrentStateChoicesRng:true,oldPhoenix:a.after.traits.phoenix,newPhoenix:b.after.traits.phoenix,oldPool:a.after.pool,newPool:b.after.pool,classification:'INTENDED_BUG_FIX / OBSOLETE_EXACT_EQUALITY_EXPECTATION',note:'No expectation changed. Original negative diagnostic also exits 1. Updating official tests requires separate authorization; Full remains FAIL.'};
}
const historyBefore=read('before-history.json'),historyAfter=read('after-history.json');
for(const a of historyBefore.cases.filter(c=>c.id.startsWith('H-'))){const b=historyAfter.cases.find(c=>c.id===a.id);assert.deepEqual(a.finalState,b.finalState);assert.deepEqual(a.rngValues,b.rngValues);}
result.legacyCompatibility={cases:8,status:'PASS',stateAndRngExact:true};
fs.writeFileSync(new URL('comparison.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,cases:undefined}));
