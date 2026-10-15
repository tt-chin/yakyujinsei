import assert from 'node:assert/strict';
import {annualAwardTransaction,preallocateAwardSlots,captureAwardSlot,recordAwardDecisions,completeAwardDecisions} from '../docs/src/engine/award-transaction-policy.js';
import {validateAwardHistory,historicalState,historicalCareer} from '../tools/development-a/historical-comparison.mjs';
const s={seed:'history-comparison',year:2039,traits:{},honors:[],log:[{y:2039,st:{W:15}}],rngState:1};
const tx=annualAwardTransaction(s,{league:'NPB',level:'NPB1',role:'SP',metrics:{W:15}});preallocateAwardSlots(tx,['MVP']);captureAwardSlot(tx,'MVP',100,()=>{s.rngState=(s.rngState+0x6D2B79F5)>>>0;return .5;},()=>s.rngState);recordAwardDecisions(tx);completeAwardDecisions(tx);
validateAwardHistory(s);const before=structuredClone(s);assert(!Object.hasOwn(historicalState(s),'awardDecisions'));assert.deepEqual(s,before);
const old=historicalState(s);assert.deepEqual(historicalCareer({state:s,before:JSON.stringify(s)}),{state:old,before:JSON.stringify(old)});
let pass=2;
for(const mutate of [x=>x.awardDecisions.push(x.awardDecisions[0]),x=>x.awardDecisions[0].year++,x=>x.awardDecisions[0].metrics.W++,x=>x.awardDecisions[0].rngAfter++,x=>x.awardDecisions[0].decisionKey='fake',x=>x.awardDecisions[0].decisionStatus='PREPARED']){const bad=structuredClone(s);mutate(bad);assert.throws(()=>historicalState(bad));pass++;}
const changed=structuredClone(s);changed.traits.glass=true;assert.notDeepEqual(historicalCareer(changed),historicalCareer(s),'other S differences must survive projection');pass++;
const changedHistory=structuredClone(s);changedHistory.awardDecisions[0].sources.push('FAKE');assert.notDeepEqual(changedHistory,s,'same-version full state retains metadata');pass++;
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'historical comparison contract; same-version replay never projected'}));
