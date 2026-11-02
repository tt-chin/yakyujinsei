import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {JP_DATA} from '../docs/src/data/jp-data.js';
import {VERSION} from '../docs/src/config.js';
import * as policy from '../docs/src/engine/school-policy.js';
import {createInitialState} from '../docs/src/engine/initial-state.js';
const baseline='0fd13c7532fd03da136c72ef64e9890858cfb81e';
const oldData=execFileSync('git',['show',baseline+':docs/src/data/jp-data.js'],{encoding:'utf8'});
const old=JSON.parse(oldData.slice(oldData.indexOf('=')+1).trim().replace(/;$/,''));
assert.deepEqual(JP_DATA.highSchools.slice(0,50),old.highSchools);
assert.deepEqual({...JP_DATA,highSchools:old.highSchools},old);
assert.equal(JP_DATA.highSchools.length,60);
assert.equal(new Set(JP_DATA.highSchools.map(s=>s.schoolId)).size,60);
assert.equal(new Set(JP_DATA.highSchools.map(s=>s.name)).size,60);
assert.deepEqual(JP_DATA.highSchools.reduce((a,s)=>(a[s.tier]=(a[s.tier]||0)+1,a),{}),{A:22,B:8,S:20,C:10});
for(const [roll,tier] of [[0,'S'],[24,'S'],[25,'A'],[69,'A'],[70,'B'],[89,'B'],[90,'C'],[99,'C']])assert.equal(policy.highSchoolTier(roll),tier);
const counts={S:0,A:0,B:0,C:0};for(let i=0;i<100;i++)counts[policy.highSchoolTier(i)]++;
assert.deepEqual(counts,{S:25,A:45,B:20,C:10});
for(const stage of ['HS','U','CORP','IND','PRO'])for(const tier of ['S','A','B','C'])assert.equal(policy.schoolCompetitionBonus(stage,tier),tier==='S'?6:tier==='A'?2:stage==='HS'&&tier==='C'?-4:-2);
for(const tier of ['S','A','B','C']){
 const school=JP_DATA.highSchools.find(s=>s.tier===tier),state={};policy.installBirthHighSchool(state,school,VERSION);
 assert.equal(policy.smallSchoolEligibility(state.birthHighSchool,JP_DATA.highSchools,VERSION),tier==='C'?'ELIGIBLE':'NOT_ELIGIBLE');
 assert.ok(Object.isFrozen(state.birthHighSchool));assert.equal(Object.getOwnPropertyDescriptor(state,'birthHighSchool').writable,false);
 assert.throws(()=>state.birthHighSchool={});assert.throws(()=>state.birthHighSchool.tier='B');assert.throws(()=>delete state.birthHighSchool);
 const original=state.birthHighSchool;policy.installBirthHighSchool(state,JP_DATA.highSchools[0],VERSION);assert.equal(state.birthHighSchool,original);
 state.schoolTier='A';assert.equal(state.birthHighSchool.tier,tier);
 for(const patch of [{schemaVersion:2},{classificationSystem:'LEGACY_T123'},{createdVersion:'0.0.0'},{createdVersion:null},{schoolId:'HS_UNKNOWN'},{tier:'Z'},{tier:null},{schoolId:JP_DATA.highSchools.find(s=>s.tier!==tier).schoolId}])assert.equal(policy.smallSchoolEligibility({...original,...patch},JP_DATA.highSchools,VERSION),'UNKNOWN');
}
for(const missing of [null,undefined,{},'C',{hsTier:3},{schoolTier:'C'}])assert.equal(policy.smallSchoolEligibility(missing,JP_DATA.highSchools,VERSION),'UNKNOWN');
// Evaluate the actual active initializers, not a duplicate model. Controlled RNG is a fixture.
const oldSource=execFileSync('git',['show',baseline+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
function initialize(source,data,pos,roll,schoolRoll){let calls=0;const random=()=>{calls++;return .5;};const ctx=vm.createContext({S:{rngState:1},SEED:'fixture',VERSION,DATA:data,POS_AB:{P:['sta','vel','ctl','brk'],IF:['sta','con','pow','spd','eye','rng','fld','arm']},TRAIT_LABELS:{},traitPresentation:new WeakMap(),ensureEventState:()=>{},teamDisplay:()=>'',...policy,R:random,ri:(a,b)=>a+Math.floor(random()*(b-a+1))});const start=Math.max(source.indexOf('  function newState(name,pos)'),source.indexOf('  newState = function(name,pos)'));const end=source.search(/\n  const (?:nextContractId|careerContract)=/);assert.ok(start>0&&end>start);vm.runInContext(source.slice(start,end),ctx);let n=0;const shuffle=ctx.POS_AB[pos].length-1;ctx.R=()=>{calls++;n++;return n<=shuffle?.5:n===shuffle+1?(roll+.1)/100:schoolRoll;};ctx.pickRecord=a=>a[Math.floor(ctx.R()*a.length)];const result=ctx.newState('fixture',pos);return {state:result,calls,schoolCalls:n-shuffle};}
function initializeCurrent(data,pos,roll,schoolRoll){let calls=0,n=0;const traitPresentation=new WeakMap(),random=()=>{calls++;return .5;},POS_AB={P:['sta','vel','ctl','brk'],IF:['sta','con','pow','spd','eye','rng','fld','arm']},shuffle=POS_AB[pos].length-1,R=()=>{calls++;n++;return n<=shuffle?.5:n===shuffle+1?(roll+.1)/100:schoolRoll;};const state=createInitialState('fixture',pos,{getState:()=>({rngState:1}),getSeed:()=>'fixture',R,ri:(a,b)=>a+Math.floor(random()*(b-a+1)),pickRecord:a=>a[Math.floor(R()*a.length)],DATA:data,POS_AB,teamRec:()=>null,teamDisplay:()=>'',traitPresentation});assert.ok(traitPresentation.get(state) instanceof Set,'birth registers trait presentation');return {state,calls,schoolCalls:n-shuffle};}
for(const pos of ['P','IF'])for(const roll of [24,25,69,70,89,90,99])for(const r of [0,1-Number.EPSILON]){
 const a=initializeCurrent(JP_DATA,pos,roll,r),b=initialize(oldSource,old,pos,roll,r);
 assert.deepEqual(JSON.parse(JSON.stringify(a.state.ab)),JSON.parse(JSON.stringify(b.state.ab)));
 assert.deepEqual(JSON.parse(JSON.stringify(a.state.pot)),JSON.parse(JSON.stringify(b.state.pot)));
 assert.equal(a.state.potSum0,b.state.potSum0);assert.equal(a.calls,b.calls);assert.equal(a.schoolCalls,2);
 assert.equal(a.state.schoolTier,policy.highSchoolTier(roll));assert.equal(a.state.birthHighSchool.schoolId,a.state.schoolId);
 assert.equal(JP_DATA.highSchools.find(s=>s.schoolId===a.state.schoolId).tier,a.state.schoolTier);
}
const cSchools=JP_DATA.highSchools.filter(s=>s.tier==='C');for(let i=0;i<10;i++)assert.equal(initializeCurrent(JP_DATA,'P',90,(i+.5)/10).state.schoolId,cSchools[i].schoolId);
console.log('School Master, all roll boundaries, native initializers, write-once, eligibility and HS-only bonus passed.');
