// INJ-UI-01: injuryRiskBreakdown equals the former player-injury.js injuryProb body (8a4f765) on a full grid,
// the steps follow the calculation order, and the session-only check / season-start records drive the display status.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import { injuryRiskBreakdown, recordInjuryCheck, markInjurySeasonStart, injuryRiskStatus } from '../docs/src/engine/injury-risk-policy.js';
import { injuryRiskCondition } from '../docs/src/ui/injury-risk-view-model.js';
import { PlayerInjury } from '../docs/src/engine/player-injury.js';

let passed=0;const check=(name,fn)=>{fn();passed++;console.log('PASS',name);};
const BASE_SHA='8a4f765483ca2d96dd832a2daba60172ae36a4ab';
const oldSource=execFileSync('git',['show',`${BASE_SHA}:docs/src/engine/player-injury.js`],{encoding:'utf8'});
const start=oldSource.indexOf('  function injuryProb(){'),end=oldSource.indexOf('  function rollInjury(){');
assert(start>0&&end>start,'old injuryProb body found');
const ctx=vm.createContext({clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),Math,state:null});
vm.runInContext(`const getState=()=>state;\n${oldSource.slice(start,end)}\nthis.oldInjuryProb=injuryProb;`,ctx);
const oldProb=state=>{ctx.state=state;return ctx.oldInjuryProb();};
const TRAITS=[{},{academy:true},{iron:true},{glass:true},{iron:true,glass:true},{academy:true,iron:true},{academy:true,glass:true}];
const states=[];
for(const traits of TRAITS)for(let age=15;age<=48;age++)for(const injNext of [0,10,20,90])for(const tmpInj of [undefined,-5,0,10,60,120])
  states.push({traits,age,injNext,tmpInj,year:2030});

check('total equals the former injuryProb on the full grid',()=>{
  assert(states.length>5000);
  for(const s of states)assert.equal(injuryRiskBreakdown(s).total,oldProb(s),JSON.stringify(s));
});
check('steps are ordered, accumulate to total, and are frozen',()=>{
  for(const s of states){
    const b=injuryRiskBreakdown(s),kinds=b.steps.map(x=>x.kind);
    const order=['BASE','CARRY','AGE','ACADEMY','PRE_TRAIT','TRAIT','TMP','CLAMP'];
    assert.deepEqual(kinds,order.filter(k=>kinds.includes(k)));
    assert.equal(b.steps.at(-1).value,b.total);
    const tmp=b.steps.find(x=>x.kind==='TMP');assert.equal(tmp.delta,s.tmpInj||0);
    assert(Object.isFrozen(b)&&Object.isFrozen(b.steps)&&b.steps.every(Object.isFrozen));
  }
});
check('boundaries: age 24/25, 31/32, 34/35; trait rules before tmpInj; 3/95 clamp',()=>{
  const p=(o)=>injuryRiskBreakdown({traits:{},age:28,injNext:0,tmpInj:0,...o}).total;
  assert.equal(p({age:24,traits:{academy:true}}),10);assert.equal(p({age:25,traits:{academy:true}}),15);
  assert.equal(p({age:31}),15);assert.equal(p({age:32}),21);assert.equal(p({age:34}),21);assert.equal(p({age:35}),27);
  assert.equal(p({age:35,traits:{iron:true},tmpInj:10}),20,'iron caps the pre-trait value only');
  assert.equal(p({traits:{glass:true},tmpInj:-5}),35,'glass floor before a negative tmpInj');
  assert.equal(p({traits:{iron:true,glass:true},injNext:90}),25);
  assert.equal(p({traits:{iron:true},tmpInj:-10}),3);assert.equal(p({injNext:90,tmpInj:60}),95);
  assert.equal(injuryRiskBreakdown({traits:{},age:28,injNext:90,tmpInj:60}).steps.at(-1).clamped,true);
});
check('display before phasePre treats the stale tmpInj as reset; judgement path never does',()=>{
  const s={traits:{},age:28,injNext:0,tmpInj:10,year:2031,skipMid:false};
  assert.equal(injuryRiskStatus(s).kind,'FORECAST');assert.equal(injuryRiskStatus(s).breakdown.total,15);
  assert.equal(injuryRiskBreakdown(s).total,25);
  markInjurySeasonStart(s);assert.equal(injuryRiskStatus(s).breakdown.total,25,'after phasePre the live tmpInj counts');
});
check('after the check the status shows the judged breakdown for that year only',()=>{
  const s={traits:{},age:33,injNext:10,tmpInj:5,year:2031,skipMid:false};markInjurySeasonStart(s);
  const judged=recordInjuryCheck(s);assert.equal(judged.total,36);
  s.injNext=0;s.tmpInj=20;
  const st=injuryRiskStatus(s);assert.equal(st.kind,'CHECKED');assert.equal(st.breakdown,judged);
  assert.equal(injuryRiskCondition(s).value,'判定済み（36%）');
  s.year=2032;assert.equal(injuryRiskStatus(s).kind,'FORECAST','next year is no longer checked');
  const other={...s,year:2031};assert.equal(injuryRiskStatus(other).kind,'FORECAST','record is per state object');
});
check('a second phasePre in the same year drops that year\'s check',()=>{
  const s={traits:{},age:28,injNext:0,tmpInj:0,year:2033,skipMid:false};markInjurySeasonStart(s);recordInjuryCheck(s);
  assert.equal(injuryRiskStatus(s).kind,'CHECKED');markInjurySeasonStart(s);assert.equal(injuryRiskStatus(s).kind,'FORECAST');
  const t={...s,year:2034};recordInjuryCheck(t);t.year=2035;markInjurySeasonStart(t);t.year=2034;assert.equal(injuryRiskStatus(t).kind,'CHECKED','another year\'s mark keeps the check');
});
check('rehab season without a health check',()=>{
  const s={traits:{},age:28,injNext:0,tmpInj:0,year:2031,skipMid:true};
  assert.equal(injuryRiskStatus(s).kind,'FORECAST','before phasePre skipMid is last season');
  s.rehab=1;assert.equal(injuryRiskStatus(s).kind,'NO_CHECK','before phasePre a pending rehab means no check');s.rehab=0;
  markInjurySeasonStart(s);assert.equal(injuryRiskCondition(s).value,'今季は健康診断なし（リハビリ中）');
  assert.equal(injuryRiskCondition(s).breakdown,undefined);
});
check('condition rows list applied steps only and never a summable iron cap',()=>{
  const s={traits:{iron:true},age:35,injNext:0,tmpInj:10,year:2031,skipMid:false};markInjurySeasonStart(s);
  const c=injuryRiskCondition(s);
  assert.equal(c.value,'20%');
  assert.deepEqual(c.breakdown.rows.map(r=>[r.label,r.value]),[['基礎','15%'],['年齢（35歳以上）','+12%'],['特性適用前','27%'],['鉄人（上限10%）','10%'],['今季の一時加算','+10%'],['結果','20%']]);
});
check('rollInjury judges with the breakdown total and records it before the draw',()=>{
  for(const healthy of [true,false]){
    const S={traits:{},age:33,injNext:10,tmpInj:5,year:2031,skipMid:false,ab:{},pos:'IF',seasonFactor:1};markInjurySeasonStart(S);
    const draws=[],cards=[];let statusAtDraw;
    const injury=new PlayerInjury({getState:()=>S,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),POS_AB:{IF:[]},ABL:{},addAb:()=>{},board:()=>{},card:(...a)=>cards.push(a),choose:()=>{},removeTrait:()=>{},tjCap:()=>50,
      injuryRisk:state=>injuryRiskBreakdown(state),recordInjuryCheck:state=>recordInjuryCheck(state),
      rng:{chance:p=>{draws.push(p);if(draws.length===1)statusAtDraw=injuryRiskStatus(S);return draws.length===1?!healthy:true;},ri:()=>20,pick:k=>k[0]}});
    injury.rollInjury();
    assert.equal(draws[0],36,'first draw uses the breakdown total');
    assert.equal(statusAtDraw.kind,'CHECKED','recorded before the draw');assert.equal(statusAtDraw.breakdown.total,36);
    const after=injuryRiskStatus(S);assert.equal(S.injNext,0);assert.equal(after.kind,'CHECKED');assert.equal(after.breakdown.total,36,'judged value survives the injNext reset');
    if(healthy)assert.match(cards[0][2],/故障率 36%/);
  }
});
console.log(JSON.stringify({moduleCases:passed,FAIL:0}));
