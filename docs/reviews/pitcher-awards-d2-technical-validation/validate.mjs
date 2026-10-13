// Local isolated artifacts only. Reference models are proposals, never product implementations.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {GAME_SOURCE as source,productionFunction} from '../../../tests/retirement-hof-test-support.mjs';
import * as contract from '../../src/engine/contract-policy.js';
import {createIncentiveTerms,applyIncentivePayment} from '../../src/engine/incentive-policy.js';
import {normalizeChampionshipState,settleChampionship,maintainSeasonEnd,captureSeasonChampionship} from '../../src/engine/championship-policy.js';
import {classifyMarketInjury} from '../../src/engine/injury-market-policy.js';
import {awardTraitUnlocks} from '../../src/engine/trait-policy.js';
const started=performance.now(),cases=[];
const add=(id,evidence,status,expected,actual,notes='')=>cases.push({id,evidence,status,expected,actual,notes});
const clone=x=>JSON.parse(JSON.stringify(x));
const start=source.indexOf('  let seasonEndContext=null;'),end=source.indexOf('\n  movement = function(){',start);
assert(start>0&&end>start);
const nativePhase=source.slice(start,end);
const nativeSeed=source.match(/seedInit = function\(seed\)\{[^\n]+/)[0],nativeR=source.match(/R = function\(\)\{[^\n]+/)[0],nativeChance=source.match(/const chance=p=>[^\n]+/)[0];
const firstTeam={teamId:'NPB_PL_FUK',org:'NPB',name:'福岡シーホークス'};
function state(){return {seed:'award-jp-2',year:2035,age:30,stageYr:5,pos:'P',role:'SP',stage:'PRO',org:'NPB',lv:'NPB1',orgTeamId:firstTeam.teamId,traits:{glass:true,phoenix:false},honors:[],removed:[],pool:0,seasonFactor:1,rehab:0,skipMid:false,lastD:-5,lastSalaryEvaluation:{sampleStatus:'FULL',payD:4},careerEarnings:0,careerBaseSalary:0,careerIncentive:0,yearlyIncentivePaid:{},yearOutsideIncome:0,lastSalaryPaidYear:null,serviceTime:{NPB:0},npbYears:0,stats:{NPB:{yr:2,AS:0}},log:[],ct:contract.createContract({contractId:'valid:2035',org:'NPB',teamId:firstTeam.teamId,startYear:2035,signedYear:2035,years:3,annualSalary:10000000,incentive:createIncentiveTerms({org:'NPB',annualSalary:10000000})})};}
function harness(initial=state()){
 const rng=[],cards=[],choices=[],events=[],ctx=vm.createContext({S:structuredClone(initial),TextEncoder,...contract,applyIncentivePayment,normalizeChampionshipState,settleChampionship,maintainSeasonEnd,classifyMarketInjury,awardTraitUnlocks,
  teamRec:id=>id===firstTeam.teamId?firstTeam:null,board:()=>events.push('board'),migrateSalaryV140State:()=>events.push('migration-boundary'),fmtMoney:x=>String(x),escapeHTML:x=>String(x),
  card:(tone,title,body)=>{cards.push({tone,title,body});if(ctx.faultTitle===title){ctx.faultTitle=null;throw Error('INJECTED_RENDER_FAULT');}},
  choose:(title,options)=>choices.push({title,options}),allocUI:(v,title,done)=>events.push({allocBoundary:v,title}),movement:()=>events.push('movement-boundary'),
  recordR:v=>rng.push(v),traitPresentation:new WeakMap(),displayTrait:x=>x,startYear:()=>events.push('startYear-boundary'),resetEventYear:s=>{s.eventDrawYear=s.year;s.eventDrawnCardIDs=[];}});
 const funcs=['fnv1a32','awards','removeTrait','isSP','advance'].map(n=>productionFunction(n)).join('\n');
 vm.runInContext(`let _s=0,seedInit,R,phaseEnd,pendingOffseasonSalary=null;const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));const LV={NPB1:{top:'NPB',g:143}};${funcs}\n${nativeSeed}\n${nativeR}\nconst originalR=R;R=()=>{const v=originalR();recordR(v);return v;};${nativeChance}\n${nativePhase}`,ctx);
 vm.runInContext('seedInit(S.seed)',ctx);
 return {ctx,rng,cards,choices,events,run:code=>vm.runInContext(code,ctx),snap:()=>({state:JSON.parse(vm.runInContext('JSON.stringify(S)',ctx)),rng:[...rng],cards:clone(cards),choices:choices.map(c=>({title:c.title,labels:c.options.map(o=>o.t)})),events:clone(events)})};
}
// VAL-A: bounded native runtime, no natural career or real browser.
for(const [id,pool,repeats] of [['VAL-A01',0,1],['VAL-A02',0,2],['VAL-A03',4,2]]){
 const s=state();s.pool=pool;captureSeasonChampionship(s);const h=harness(s);h.run('phaseEnd()');const once=h.snap();if(repeats===2)h.run('phaseEnd()');const twice=h.snap();
 assert.equal(once.state.careerBaseSalary,10000000);assert.equal(once.state.careerIncentive,350000);assert.deepEqual(twice,once);
 if(pool)assert.equal(h.choices.length,1);else assert(h.events.includes('movement-boundary'));
 add(id,'VERIFIED_RUNTIME','PASS','Base 10m + HALF 350k once; year unchanged; no repeated side effects',{input:s,once,twice},'Native championship+contract+incentive; movement/alloc/DOM are boundary doubles; services not executed.');
}
{
 const s=state();s.pool=7;const h=harness(s);h.ctx.st={d:15,IP:120,era:4,SO:100,G:20,SV:0,HLD:0};h.ctx.faultTitle='年間賞';assert.throws(()=>h.run("awards('NPB',st)"),/INJECTED_RENDER_FAULT/);const failed=h.snap();assert(failed.state.honors.includes('2035 NPB年間MVP'));assert.equal(failed.state.pool,7);h.run("awards('NPB',st)");const retried=h.snap();assert.equal(retried.state.honors.filter(x=>x==='2035 NPB年間MVP').length,2);assert.equal(retried.state.pool,15);assert(retried.rng.length>failed.rng.length);
 add('VAL-A04','VERIFIED_RUNTIME / RISK','RISK','Failure retry must not re-draw or duplicate award',{input:s,failed,retried},'Explicit fault injection after awards card, before phoenix. Reentering raw awards, not proof normal UI reaches this retry.');
}
add('VAL-A05','VERIFIED_STATIC / NOT_RUN','NOT_RUN','Reload recovery requires persisted career state',{observed:'No career save/load; preferences localStorage only'},'Do not fake restored state or execute browser reload; current product starts a new seed life.');
{
 const s=state();s.honors=['2035 NPB最優秀投手賞'];const h=harness(s);h.ctx.st={d:-5,IP:150,era:2.2,SO:100,G:20,SV:0,HLD:0};h.run("awards('NPB',st)");const result=h.snap();assert.equal(result.state.honors.filter(x=>x==='2035 NPB最優秀投手賞').length,2);assert.equal(result.rng.length,2);
 add('VAL-A06','VERIFIED_RUNTIME / RISK','RISK','Existing same-year award should not be regenerated',{input:s,result},'Direct raw awards reentry; not a natural UI bug reproduction and no Japanese-name matrix rerun.');
}
{
 const s=state();captureSeasonChampionship(s);const h=harness(s);h.ctx.faultTitle='シーズン終了';assert.throws(()=>h.run('phaseEnd()'),/INJECTED_RENDER_FAULT/);const failed=h.snap();h.run('phaseEnd()');const retry=h.snap();assert.equal(retry.state.careerEarnings,failed.state.careerEarnings);assert(!retry.events.includes('movement-boundary'));assert.equal(retry.choices.length,0);assert.deepEqual(retry,failed);
 add('VAL-A07','VERIFIED_RUNTIME / RISK','RISK','After payment renderer fault, retry should continue without repayment',{input:s,failed,retry},'Valid contract + explicit card fault. PRO context prevents retry from reaching navigation; no natural UI proof.');
}
{
 const s=state();captureSeasonChampionship(s);const h=harness(s);h.run('phaseEnd()');h.run('advance()');const advanced=h.snap();assert.equal(advanced.state.year,2036);assert.equal(advanced.state.age,31);
 add('VAL-A08','VERIFIED_RUNTIME','PASS','Native advance increments year/age once',{input:s,advanced},'startYear/resetEventYear are boundary doubles: annual entry trace only, not full next season or reload.');
}
// VAL-B: deliberately independent reference model, not product S/journal or approved schema.
class ReferenceJournal {
 constructor(){this.decisions=new Map();this.receipts=new Map();this.draws=0;this.honors=new Set();this.pool=7;this.glass=true;this.phoenix=false;this.settled=new Set();}
 key(player,year,league,award,rule='fixture-rule'){return JSON.stringify([player,year,league,award,rule]);}
 decide(key,fail=false){if(this.decisions.has(key))return this.decisions.get(key);if(this.settled.has(key))return{historical:true,unknown:true};this.draws++;const value={schemaVersion:1,awarded:true,phase:'DECIDED'};this.decisions.set(key,value);if(fail)throw Error('DECISION_FAULT');return value;}
 effects(key,ops,fault=-1){let r=this.receipts.get(key);if(!r){r={schemaVersion:1,steps:ops.map(([field,after])=>({field,before:this[field],after,done:false}))};this.receipts.set(key,r);}for(let i=0;i<r.steps.length;i++){const step=r.steps[i];if(step.done)continue;if(this[step.field]!==step.before&&this[step.field]!==step.after)throw Error('CONCURRENT_STATE_CONFLICT');this[step.field]=step.after;if(i===fault)throw Error('EFFECT_FAULT');step.done=true;}r.complete=true;return r;}
 phoenixEffect(key,fault=-1){if(this.receipts.has(key))return this.effects(key,[],fault);if(!this.glass||this.phoenix)return null;return this.effects(key,[['glass',false],['phoenix',true],['pool',this.pool+8]],fault);}
 snapshot(){return {decisions:[...this.decisions],receipts:[...this.receipts],draws:this.draws,honors:[...this.honors],pool:this.pool,glass:this.glass,phoenix:this.phoenix};}
}
for(let i=1;i<=12;i++){
 const m=new ReferenceJournal(),k=m.key('fixture-player-1',2035,'NPB','P08');let actual;
 switch(i){
 case 1:m.decide(k);assert.equal(m.draws,1);break;
 case 2:m.decide(k);m.decide(k);assert.equal(m.draws,1);break;
 case 3:m.decide(k);assert.equal(m.pool,7);m.phoenixEffect('phoenix:player1');assert.equal(m.pool,15);assert.equal(m.draws,1);break;
 case 4:m.phoenixEffect('phoenix:player1');m.phoenixEffect('phoenix:player1');assert.equal(m.pool,15);break;
 case 5:assert.throws(()=>m.decide(k,true),/DECISION_FAULT/);m.decide(k);assert.equal(m.draws,1);assert.equal(m.decisions.get(k).phase,'DECIDED');break;
 case 6:for(const award of ['P01','P02','P03'])m.decide(m.key('p1',2035,'NPB',award));assert.equal(m.decisions.size,3);break;
 case 7:m.decide(k);m.decide(m.key('fixture-player-1',2036,'NPB','P08'));assert.equal(m.decisions.size,2);break;
 case 8:for(const player of ['p1','p2'])for(const league of ['NPB','KBO'])m.decide(m.key(player,2035,league,'P01'));assert.equal(m.decisions.size,4);break;
 case 9:m.honors.add('2030 NPB最優秀投手賞');m.settled.add(k);m.decide(k);assert.equal(m.draws,0);assert.deepEqual([...m.honors],['2030 NPB最優秀投手賞']);break;
 case 10:for(const award of ['P01','P02','P03'])m.decide(m.key('p1',2035,'NPB',award));for(let retry=0;retry<2;retry++){if(['P01','P02','P03'].every(a=>m.decisions.get(m.key('p1',2035,'NPB',a))?.awarded)){m.honors.add('p1:2035:NPB:P07');m.honors.add('p1:2035:NPB:MVP');}}assert.equal([...m.honors].filter(x=>x.endsWith(':MVP')).length,1);break;
 case 11:m.phoenixEffect('phoenix:p1');m.phoenixEffect('phoenix:p1');assert.equal(m.pool,15);break;
 case 12:assert.throws(()=>m.phoenixEffect('phoenix:p1',2),/EFFECT_FAULT/);m.phoenixEffect('phoenix:p1');assert.equal(m.pool,15);assert(m.receipts.get('phoenix:p1').steps.every(x=>x.done));const unsafe={pool:7,applied:false};unsafe.pool+=8;/* fault before applied */if(!unsafe.applied)unsafe.pool+=8;assert.equal(unsafe.pool,23);const ambiguous=new ReferenceJournal();assert.throws(()=>ambiguous.phoenixEffect('p',0),/EFFECT_FAULT/);ambiguous.pool=100;assert.throws(()=>ambiguous.phoenixEffect('p'),/CONCURRENT_STATE_CONFLICT/);actual={safe:m.snapshot(),singleFlagCounterexample:unsafe,concurrentCounterexample:ambiguous.snapshot()};break;
 }
 add('VAL-B'+String(i).padStart(2,'0'),'VERIFIED_MODEL','PASS','Reference model case '+i+' only; no claim of product transaction safety',actual||m.snapshot(),'Typed tuple keys, fixed true decision provider (not hash), frozen per-field before/after targets. No crash persistence or arbitrary interleaving guarantee.');
}
// VAL-C: no algorithm is selected without approval; formal hash vectors remain a DESIGN_GAP.
const design=fs.readFileSync(new URL('../../designs/PITCHER_AWARDS_PHASE1_DESIGN_D2.md',import.meta.url),'utf8');
assert(design.includes('演算法常數及向量此處**僅提案，未實作或執行**'));
add('VAL-C-HASH','VERIFIED_STATIC / DESIGN_BLOCKER','DESIGN_GAP','Approved algorithm/byte input/golden vectors needed',{observed:'D2 §14.3 has proposal only; no approved golden vectors'},'C3 fixed hashes, cross-environment/order independence and actual new draw are NOT_RUN. No new hash chosen.');
{
 const h1=harness(),h2=harness();const v1=Array.from({length:4},()=>h1.run('R()')),v2=Array.from({length:4},()=>h2.run('R()'));assert.deepEqual(v1,v2);assert(h1.run('chance(100)'));assert.equal(h1.run('chance(0)'),false);assert.equal(h1.rng.length,6);add('VAL-C-MAIN','VERIFIED_RUNTIME','PASS','Same seed same native R values; chance0/100 each consume R',{v1,v2,calls:h1.rng.length,state:h1.snap().state.rngState},'Current Japan overlay seed/R/chance, four draws + endpoints. No full-career test.');
}
const valid=v=>Number.isSafeInteger(v)&&v>=0;
const lines={CPBL:[10,15],KBO:[12,17],NPB:[12,17],MLB:[14,20]};
function p01(league,W){if(!lines[league]||!valid(W))return 0;const [b,g]=lines[league];return W<b?0:W>=g?100:20+75*(W-b)/(g-b);}
function p04(league,W,L){const min={NPB:12,KBO:10}[league];if(!min||!valid(W)||!valid(L)||W+L===0||W<min)return 0;const wp=W/(W+L);return wp<.65?0:wp>=.85?100:20+300*(wp-.65);}
function p08(score,eligible=true){return !eligible||!Number.isFinite(score)||score<60?0:score>=95?100:Math.min(95,10+2.5*(score-60));}
const close=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`); // assertion tolerance only, no model threshold epsilon
for(const [league,[b,g]] of Object.entries(lines))for(const [W,expected] of [[b-1,0],[b,20],[b+1,20+75/(g-b)],[g-1,20+75*(g-1-b)/(g-b)],[g,100],[g+1,100]]){const actual=p01(league,W);close(actual,expected);add(`VAL-C-P01-${league}-${W}`,'VERIFIED_MODEL','PASS',{league,W,expected},{pPercent:actual});}
const wpCases=[['NPB',11,0,0],['NPB',12,0,100],['NPB',12,6,25],['NPB',12,7,0],['NPB',13,7,20],['NPB',17,3,100],['NPB',16,3,20+300*(16/19-.65)],['KBO',9,0,0],['KBO',10,0,100],['KBO',10,5,25],['KBO',10,2,75],['KBO',10,1,100],['NPB',0,0,0],['NPB',-1,0,0],['NPB',12.5,0,0],['NPB',NaN,0,0],['NPB',Infinity,0,0],['NPB',12,undefined,0],['NPB',12,-1,0],['NPB',12,.5,0],['CPBL',20,0,0],['MLB',20,0,0]];
for(let i=0;i<wpCases.length;i++){const [league,W,L,expected]=wpCases[i],actual=p04(league,W,L);close(actual,expected);add('VAL-C-P04-'+String(i+1).padStart(2,'0'),'VERIFIED_MODEL','PASS',{league,W:String(W),L:String(L),pPercent:expected},{pPercent:actual});}
for(const [score,expected] of [[59.999,0],[60,10],[60.001,10.0025],[94.999,95],[95,100],[95.001,100]]){const actual=p08(score);close(actual,expected);add('VAL-C-P08-'+score,'VERIFIED_MODEL','PASS',{score,pPercent:expected},{pPercent:actual});}
{
 const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)),comp=(x,a,b)=>100*clamp((x-a)/(b-a),0,1);
 const eligibility=s=>s.league==='NPB'&&s.level==='NPB1'&&s.role==='SP'&&['G','W','L','IP','SO','ERA'].every(k=>Number.isFinite(s[k])&&s[k]>=0)&&s.G>0&&s.W>=13&&s.IP>=143&&s.ERA<=3.2&&s.W+s.L>0;
 const sample={league:'NPB',level:'NPB1',role:'SP',G:26,W:15,L:7,IP:180.1,SO:165,ERA:2.35};const score=.25*comp(sample.W,12,17)+.30*comp(sample.ERA,3.2,2.2)+.25*comp(sample.IP,143,180)+.15*comp(sample.SO,155,215)+.05*comp(sample.W/(sample.W+sample.L),.65,.85);close(score,68.79545454545455);
 assert(eligibility(sample));assert.equal(p08(100,eligibility({...sample,W:12})),0);assert.equal(p08(100,eligibility({...sample,IP:142.999})),0);assert.equal(p08(100,eligibility({...sample,role:'MR'})),0);assert.equal(comp(180,143,180),100);assert.equal(comp(150,143,180)>0&&comp(150,143,180)<100,true);
 add('VAL-C-P08-QUAL','VERIFIED_MODEL','PASS','W13/IP143/NPB1 SP eligibility precedes score; IP180 cap',{score,pPercent:p08(score),invalidHighScoreProbability:0},'Manual 1.10.3 evidence numbers used offline; not new-product award or replay.');
 const raw=p04('NPB',13,7),rounded=p04('NPB',12,6),premature=20+300*(Number((12/18).toFixed(3))-.65);assert(Math.abs(rounded-premature)>.01);add('VAL-C-PRECISION','VERIFIED_MODEL / RISK','PASS','Raw ratios and unrounded score; floating endpoints not product-approved',{exactBasic:raw,twelveSix:rounded,prematureRounded:premature,sumUnsafe:Number.MAX_SAFE_INTEGER+Number.MAX_SAFE_INTEGER},'25 becomes24.999999999999982 binary64; unsafe sum policy, component comparison tolerance and cross-platform vectors still need review. No automatic epsilon approval.');
}
const result={mode:'VALIDATION_ONLY / ANALYSIS_ONLY / DESIGN_ONLY',branch:execFileSync('git',['branch','--show-current']).toString().trim(),head:execFileSync('git',['rev-parse','HEAD']).toString().trim(),version:fs.readFileSync(new URL('../../src/config.js',import.meta.url),'utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)[1],engineSha256:createHash('sha256').update(source).digest('hex'),node:process.version,cases,counts:Object.fromEntries(['PASS','FAIL','RISK','DESIGN_GAP','NOT_RUN','BLOCKED'].map(k=>[k,cases.filter(x=>x.status===k).length])),seconds:(performance.now()-started)/1000};
fs.writeFileSync(new URL('./results.json',import.meta.url),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({counts:result.counts,caseCount:cases.length,seconds:result.seconds},null,2));
