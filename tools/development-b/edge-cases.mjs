// Controlled native-function fixtures, not natural careers or new sampling.
import assert from 'node:assert/strict';
import {harness,source,state,stat} from './award-runtime-support.mjs';
import {validateAwardHistory} from './historical-comparison.mjs';
import {hasCurrentAwardEffect,consumerTreatmentView} from '../../docs/src/engine/award-consumer-policy.js';
import {getAwardDefinition} from '../../docs/src/engine/award-identity-policy.js';
let pass=0;const test=(id,f)=>{f();pass++;console.log('PASS '+id);};
for(const wins of [false,true])for(const era of [false,true])for(const so of [false,true])test('P07 actual winners '+[wins,era,so].join('/'),()=>{
 const metrics={...stat,d:0,W:wins?20:0,era:era?1:4,SO:so?300:0};
 const h=harness(source,state(),metrics);h.run();const s=h.snapshot();s.log=[{y:s.year,st:metrics}];validateAwardHistory(s);
 const actual=id=>s.awardDecisions.some(d=>d.awardId===id&&d.awarded);
 assert.equal(actual('PITCH_WINS'),wins);assert.equal(actual('PITCH_ERA'),era);assert.equal(actual('PITCH_STRIKEOUTS'),so);
 assert.equal(actual('PITCH_TRIPLE_CROWN'),wins&&era&&so);
 const mvp=s.awardDecisions.filter(d=>d.awardId==='MVP');assert.equal(mvp.length,wins&&era&&so?1:0);
});
test('different years never combine P07 sources',()=>{
 const h=harness(source,state(),{...stat,d:0,SO:0,era:4});h.run();
 assert(h.c.S.awardDecisions.some(d=>d.awardId==='PITCH_WINS'&&d.awarded));
 h.c.S.year++;h.c.st={...stat,d:0,W:0};h.run();
 assert(!h.c.S.awardDecisions.some(d=>d.awardId==='PITCH_TRIPLE_CROWN'));
 assert(!h.c.S.traits.pitcherTC);
});
test('P08 eligible below probability threshold creates no phoenix/protection',()=>{
 const h=harness(source,state(),{...stat,d:0,W:13,L:10,IP:143,SO:155,era:3.2});h.run();
 const d=h.c.S.awardDecisions.find(d=>d.awardId==='PITCH_SAWAMURA');assert(d.eligibility);assert.equal(d.pPercent,0);assert(!d.awarded);
 assert.equal(h.c.S.pool,7);assert(h.c.S.traits.glass);assert(!h.c.S.traits.phoenix);assert(!hasCurrentAwardEffect(h.c.S,'demotion','NPB'));
});
test('actual P08 life-once and current-year-only effect',()=>{
 const metrics={...stat,d:0,SO:154,W:17,L:0,IP:220,era:1};
 const h=harness(source,state(),metrics);h.run();assert.equal(h.c.S.pool,15);assert(hasCurrentAwardEffect(h.c.S,'demotion','NPB'));
 h.c.S.year++;assert(!hasCurrentAwardEffect(h.c.S,'demotion','NPB'),'past Decision never protects next year');
 h.run();assert.equal(h.c.S.pool,15,'another actual award cannot add eight again');
});
test('previously acquired phoenix does not remove a later glass condition or add points',()=>{
 const initial=state();initial.traits.phoenix=true;
 const h=harness(source,initial,stat);h.run();assert.equal(h.c.S.pool,7);assert(h.c.S.traits.glass);assert(h.c.S.traits.phoenix);
});
test('new live departments do not acquire legacy phoenix/demotion treatment',()=>{
 const h=harness(source,state(),{...stat,d:0,W:20,era:1,SO:0});h.run();
 const s=h.c.S;assert(s.awardDecisions.some(d=>d.awardId==='PITCH_ERA'&&d.awarded));
 const onlyDepartments={...s,honors:s.honors.filter(t=>!t.endsWith('沢村賞'))};
 // Copies have no live Decision authority; exact historical department formats
 // still cannot gain a legacy major-award protection by their spelling.
 assert(!hasCurrentAwardEffect(onlyDepartments,'phoenix','NPB'));
 assert(!hasCurrentAwardEffect(onlyDepartments,'demotion','NPB'));
});
test('legacy best pitcher, P02 and P08 remain distinct in actual consumers',()=>{
 const h=harness(source,state(),stat);h.run();const s=h.c.S;
 const legacy=s.year+' NPB最優秀投手賞',era=s.year+' NPB'+getAwardDefinition('PITCH_ERA').displayName,saw=s.year+' NPB沢村賞';
 const honors=[legacy,era,saw];const view=consumerTreatmentView(honors,'hof',{league:'NPB',state:s});
 assert.equal(view.length,3);assert.deepEqual(view.map(r=>typeof r.value==='number'?r.value:r.value.sc),[460,160,460]);
 assert.deepEqual(honors,[legacy,era,saw],'legacy text not transformed to a new ID');
});
test('P03 old/new aliases count once but preserve raw text and order',()=>{
 const h=harness(source,state(),stat);h.run();const s=h.c.S;
 const short=s.year+' NPB最多奪三振',formal=s.year+' NPB最多三振奪取投手賞',honors=[short,'unknown',formal,short];
 const rows=consumerTreatmentView(honors,'hof',{league:'NPB',state:s});assert.equal(rows.length,1);
 assert.deepEqual(honors,[short,'unknown',formal,short]);
 assert.equal(typeof rows[0].value==='number'?rows[0].value:rows[0].value.sc,160);
});
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_PRODUCT_FUNCTION_FIXTURE / SYNTHETIC_SCENARIO; not natural distribution'}));
