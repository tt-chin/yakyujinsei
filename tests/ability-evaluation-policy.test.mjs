// AUD-02 03a／03b／03c: overallRatingFor and defenseScoreFor against literal values from CURRENT_SPEC §3 (pitcher／fielder ovr, dw table,
// unset／unknown positions, DH) and the dpScore coefficient table. Old-vs-new equivalence stays in ability-allocation.test; this file pins numbers.
// Expected values are exact rational arithmetic of the spec formulas rounded half up. CURRENT_SPEC §3 takes the v1.6.2 game.js ovr as the
// reference, so where float rounding differs from the exact value (vel=ctl=brk=55) the current result is pinned and labelled.
import assert from 'node:assert/strict';
import { overallRatingFor } from '../docs/src/engine/ability-evaluation-policy.js';
import { defenseScoreFor } from '../docs/src/engine/defense-position-policy.js';

const ovr=(ability,position,defensePosition,traits={})=>overallRatingFor({ability,position,defensePosition,traits});

// 03a pitcher: round(1st×0.42 + 2nd×0.30 + 3rd×0.18 + sta×0.10) over 球速・制球・変化球 sorted high to low.
const pitcher=(vel,ctl,brk,sta)=>({vel,ctl,brk,sta,con:30,pow:30,eye:30,spd:30,rng:30,fld:30,arm:30,cat:30});
for(const [vel,ctl,brk] of [[70,60,50],[70,50,60],[60,70,50],[60,50,70],[50,70,60],[50,60,70]])
  assert.equal(ovr(pitcher(vel,ctl,brk,40),'P'),60,`pitcher order ${vel}/${ctl}/${brk}: 70×.42+60×.30+50×.18+40×.10=60.4`);
assert.equal(ovr(pitcher(70,60,50,80),'P'),64,'stamina weighs 0.10 (64.4)');
assert.equal(ovr(pitcher(50,50,50,99),'P'),55,'stamina never takes a top-3 slot (54.9)');
assert.equal(ovr(pitcher(40,45,65,35),'P'),52,'exact x.5 rounds up (51.5)');
assert.equal(ovr(pitcher(55,55,55,30),'P'),52,'float edge, current value: exact 52.5 evaluates to 52.4999… and rounds down');
assert.equal(ovr(pitcher(70,60,50,40),'P',undefined,{yips:true}),60,'current value: the yips penalty is not applied to pitchers');
assert.equal(ovr(pitcher(70,60,50,40),'P','SS'),60,'a pitcher ignores the defense position');

// 03c dpScore coefficients (CURRENT_SPEC §3 table); 99 for an unknown key is the current value, not written in the spec.
const A={con:65,pow:55,eye:45,spd:35,rng:70,fld:50,arm:60,cat:40,sta:50};
const dp={SS:62,'2B':60.5,'3B':58.5,CF:62.5,RF:61.5,LF:60.5,C:48,'1B':56,XX:99};
for(const [position,expected] of Object.entries(dp))
  assert.ok(Math.abs(defenseScoreFor(A,position)-expected)<1e-9,`dpScore ${position}: ${defenseScoreFor(A,position)} != ${expected}`);

// 03c dw: batting 20 and defense 80 everywhere, so ovr = round(20 + 60×dw) and each 0.02 step of dw moves the result by about 1.2.
const flat={con:20,pow:20,eye:20,spd:20,rng:80,fld:80,arm:80,cat:80,sta:50};
const dw={SS:38,CF:38,C:38,'2B':33,'3B':33,RF:32,LF:28,'1B':27};
for(const [position,expected] of Object.entries(dw))assert.equal(ovr(flat,'IF',position),expected,'dw '+position);
assert.equal(ovr(flat,'IF','DH'),26,'DH: dpScore(1B)−12 with dw 0.12 (25.76)');
const dh=rng=>({con:20,pow:20,eye:20,spd:20,rng,fld:20,arm:40,cat:40,sta:50});
assert.equal(ovr(dh(35),'IF','DH'),19,'integer DH penalty 12: 11 would give 19.52 (rounds to 20)');
assert.equal(ovr(dh(40),'IF','DH'),20,'integer DH penalty 12: 13 would give 19.40 (rounds to 19)');
assert.equal(ovr(flat,'IF','XX'),37,'unknown key: dw fallback 0.22 with the current dpScore 99 (37.38)');
assert.equal(ovr(flat,'IF',undefined),34,'unset defense position: dw 0.24 (34.4)');
assert.equal(ovr(flat,'IF',null),34,'null defense position counts as unset');

// 03c unset evaluation position: C→C, OF→CF, otherwise SS. With these abilities the unset rating differs from every other position the same
// group could fall back to (as SS／2B／3B／1B／CF／RF／LF／C: 24／23／27／25／23／27／25／26).
const spread={con:20,pow:20,eye:20,spd:20,rng:20,fld:35,arm:75,cat:35,sta:50};
assert.equal(ovr(spread,'IF',undefined),24,'IF evaluates SS (dpScore 35.5)');
assert.equal(ovr(spread,'OF',undefined),23,'OF evaluates CF (dpScore 32.75)');
assert.equal(ovr(spread,'C',undefined),26,'C evaluates C (dpScore 43)');

// 03b fielder batting: 38/27/20/15 over ミート・パワー・選球眼・走力 sorted high to low; stamina is not ranked; yips −3 (spec: after rounding; an integer
// penalty gives the same result either way, so the order is not observable here).
const values=[65,55,45,35];
const orders=values.flatMap(a=>values.filter(b=>b!==a).flatMap(b=>values.filter(c=>c!==a&&c!==b).map(c=>[a,b,c,values.find(d=>d!==a&&d!==b&&d!==c)])));
assert.equal(orders.length,24);
for(const [con,pow,eye,spd] of orders)assert.equal(ovr({...A,con,pow,eye,spd},'IF','SS'),56,`batting order ${con}/${pow}/${eye}/${spd} (56.26)`);
assert.equal(ovr({...A,sta:99},'IF','SS'),56,'fielder stamina is not part of the rating');
assert.equal(ovr(A,'IF','SS',{yips:true}),53,'yips subtracts 3');
assert.equal(ovr({...A,con:41,rng:59},'IF','SS'),50,'fielder exact x.5 rounds up (49.5)');

console.log('PASS ability-evaluation-policy: pitcher sort/stamina/x.5 (float edge pinned), dpScore table, dw per position, DH, unknown key, unset C/CF/SS, batting sort, yips');
