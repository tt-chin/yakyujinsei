// Isolated validation artifact. No product file writes, engine imports into UI, or RNG replacement.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {performance} from 'node:perf_hooks';
import {GAME_SOURCE as src,productionFunction} from '../../../tests/retirement-hof-test-support.mjs';
import {awardTraitUnlocks,goldclothEligible,TRAIT_TEXT} from '../../src/engine/trait-policy.js';
import {isBelowActiveMinimum,findDemotionTarget,demotionChoiceText} from '../../src/engine/career-policy.js';
import {createContract,contractNeedsRenewal} from '../../src/engine/contract-policy.js';
const arg=k=>process.argv.find(x=>x.startsWith('--'+k+'='))?.slice(k.length+3);
const after=arg('mode')==='after';
assert(arg('output'),'Explicit new output required; never overwrite historical results');
const start=performance.now(),out=[];
const levels=src.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1];
const paths=src.match(/Object.assign\(PATHS,(\{[^\n]+\})\);/)[1];
const overlay=src.match(/^  movement = function\(\)\{[^\n]+/m)[0];
assert(overlay.includes('LEGACY.movement();'));
const seedSource=src.match(/seedInit = function\(seed\)\{[^\n]+/)[0];
const rSource=src.match(/R = function\(\)\{[^\n]+/)[0];
const chanceSource=src.match(/const chance=p=>[^\n]+/)[0];
const baseStat=()=>({d:-5,G:20,IP:100,era:5,ER:56,H:130,BB:50,SO:100,SV:0,HLD:0,PA:0,AB:0,HR:0,RBI:0,SB:0,DEF:0,avg:0});
const baseState=()=>({seed:'award-jp-fixture',year:2035,age:30,pos:'P',role:'SP',stage:'PRO',lv:'NPB1',org:'NPB',orgTeamId:'NPB_PL_FUK',seasonFactor:1,pool:7,traits:{glass:true,phoenix:false},removed:[],stats:{NPB:{yr:2,AS:0}},honors:[],npbYears:0,npbDevYears:0,teamYears:0,samePick:0,serviceTime:{NPB:0,MLB:0,KBO:0,CPBL:0},npbRosterDays:0,npbFaSeasons:0,lastD:-8,skipMid:false,ct:createContract({contractId:'fixture:2035',org:'NPB',teamId:'NPB_PL_FUK',signedYear:2035,startYear:2035,years:3,annualSalary:10000000}),lastSt:{G:20,IP:100,ER:65,H:150,BB:50,SV:0,HLD:0},teamTally:{}});
function harness(state,seed='award-jp-0',overall=52){
 const cards=[],choices=[],trace=[],rng=[],observed={};
 const context=vm.createContext({S:structuredClone(state),TextEncoder,awardTraitUnlocks,goldclothEligible,TRAIT_TEXT,isBelowActiveMinimum,findDemotionTarget,demotionChoiceText,contractNeedsRenewal,
  traitPresentation:new WeakMap(),displayTrait:k=>k,card:(...a)=>cards.push(a),board:()=>{},choose:(title,opts)=>choices.push({title,options:opts.map(x=>({t:x.t,s:x.s}))}),
  ovr:()=>overall,migrateSalaryV130State:()=>trace.push('migrateSalaryV130State'),accrueForeignFirstTeamSeason:()=>trace.push('accrueForeignFirstTeamSeason'),contractStageFor:()=> 'CONTROL',
  crossOffers:()=>trace.push('crossOffers-boundary'),markClubInitiatedRenewal:()=>trace.push('renewal-boundary'),applyPromotionSalary:()=>{},retireBelowActiveMinimum:()=>{throw Error('Invalid below-active fixture');},
  advance:()=>trace.push('advance-boundary'),outOfOrg:()=>{throw Error('Unexpected release fixture');},teamNick:x=>x,
  observe:(key,v)=>Object.assign(observed,{[key]:structuredClone(v)}),recordR:x=>rng.push(x),note:x=>trace.push(x)});
 const originals=[...(src.includes('function hasCurrentJapaneseAward(')?['hasCurrentJapaneseAward']:[]),'awards','removeTrait','isSP','traitCard','handleDemotion','fnv1a32','movement'];
 // Existing productionFunction extracts intact functions. Only observer calls are added in memory.
 const code=originals.map(n=>{let f=productionFunction(n);if(n==='awards')f=f.replace('    if(S.traits.glass&&!S.traits.phoenix)',"    observe('phoenixReached',{glass:S.traits.glass,phoenix:S.traits.phoenix,pool:S.pool});\n    if(S.traits.glass&&!S.traits.phoenix)");
  if(n==='movement')f=f.replace('  if(wonAward||goodReal)',"  observe('movement',{wonAward,goodReal,o,minReq,perf});\n  if(wonAward||goodReal)");return f;}).join('\n');
 vm.runInContext(`const LV=${levels},PATHS=${paths};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let _s=0,seedInit,R;${seedSource}\n${rSource}\nconst nativeR=R;R=()=>{const v=nativeR();recordR(v);return v;};${chanceSource}\n${code}\nconst nativeHandleDemotion=handleDemotion;handleDemotion=(...a)=>{note('handleDemotion-native');return nativeHandleDemotion(...a);};const LEGACY={movement:(...a)=>{note('LEGACY.movement-native');return movementLegacy(...a);}};const movementLegacy=movement;${overlay}`,context);
 context.S.seed=seed;context.fixtureSeed=seed;vm.runInContext('seedInit(fixtureSeed)',context);
 const initialState=JSON.parse(vm.runInContext('JSON.stringify(S)',context));
 return {context,cards,choices,trace,rng,observed,initialState,run:s=>vm.runInContext(s,context),snapshot:()=>JSON.parse(vm.runInContext('JSON.stringify(S)',context))};
}
// Select fixture-only RNG seeds before cases. No natural career or probability/engine changes.
function seedFor(predicate){for(let n=0;n<512;n++){const seed='award-jp-'+n,h=harness(baseState(),seed);const first=h.run('R()'),second=h.run('R()');if(predicate(first,second))return seed;}throw Error('No controlled native-R seed');}
const quietSeed=seedFor((a,b)=>a>.92&&b<.38),asSeed=seedFor(a=>a<.92),demotionSeed=seedFor(a=>a<.55);
const specs=[
 ['年間MVP',{st:{d:15,IP:120,era:4}},true],
 ['新人王',{yr:1,st:{d:10,IP:0,G:0}},true],
 ['最優秀投手賞',{st:{IP:150,era:2.2}},false],
 ['首位打者',{pos:'IF',st:{PA:350,AB:350,H:126,BB:0,avg:.36,IP:0}},false],
 ['本塁打王',{pos:'IF',st:{PA:300,AB:300,H:60,avg:.2,HR:38,IP:0}},false],
 ['ゴールデングラブ賞',{pos:'IF',st:{PA:200,AB:200,H:40,avg:.2,DEF:6,IP:0}},false],
 ['オールスターゲーム',{st:{d:15,IP:0,G:0}},false],
];
const produced=new Map();
function record(id,kind,input,h,expected,actual,policyStatus='PASS',extra={}){out.push({id,kind,evidence:policyStatus==='FAIL'?'REPRODUCED_BUG / VERIFIED_RUNTIME':'VERIFIED_RUNTIME',fixture:input,initialState:h.initialState,expectedCurrent:expected,...(id.startsWith('B')&&policyStatus==='FAIL'?{expectedPolicy:{wonAward:true,demotionHandlerEntered:false},bug:'BUG-AWARD-DEMOTION-JP-01'}:{}),actual,status:policyStatus,harnessStatus:'PASS',policyStatus,rngCalls:h.rng.length,rngValues:h.rng,finalRngState:h.snapshot().rngState,observed:h.observed,path:h.trace,cards:h.cards,choices:h.choices,finalState:h.snapshot(),...extra});}
for(let i=0;i<specs.length;i++){
 const [award,patch,oldTrigger]=specs[i],trigger=oldTrigger||(after&&[2,3,4].includes(i)),state=baseState();state.pos=patch.pos||'P';state.stats.NPB.yr=patch.yr||2;const st={...baseStat(),...patch.st},seed=award==='オールスターゲーム'?asSeed:quietSeed,h=harness(state,seed);h.context.st=st;h.run("awards('NPB',st)");const s=h.snapshot();
 assert.deepEqual(s.honors,[`2035 NPB${award}`],award+' producer fixture must generate only this award');produced.set(award,s.honors[0]);
 assert.equal(!!s.traits.phoenix,trigger);assert.equal(s.traits.glass,!trigger);assert.equal(s.pool,7+(trigger?8:0));assert(h.observed.phoenixReached);
 record('A'+String(i+1).padStart(2,'0'),'native-awards', {state,st,seed},h,{glass:!trigger,phoenix:trigger,pool:trigger?15:7}, {honors:s.honors,glass:s.traits.glass,phoenix:!!s.traits.phoenix,pool:s.pool},!after&&[2,3,4].includes(i)?'FAIL':'PASS',{expectedPolicy:i<5?{glass:false,phoenix:true,pool:15}:{glass:true,phoenix:false,pool:7},bug:[2,3,4].includes(i)?'BUG-AWARD-PHOENIX-JP-01':null,source:'game.js:1355-1474 -> awardTraitUnlocks / native removeTrait'});
}
for(const [id,existing,multi] of [['A08',false,true],['A09',true,false]]){
 const state=baseState();state.traits.phoenix=existing;state.honors=multi?['2035 NPB年間MVP','2035 NPB新人王']:['2035 NPB年間MVP'];const h=harness(state,quietSeed);h.context.st={...baseStat(),IP:0};h.run("awards('NPB',st)");const once=h.snapshot();h.run("awards('NPB',st)");const twice=h.snapshot();assert.equal(once.pool,existing?7:15);assert.equal(twice.pool,once.pool);assert.equal(twice.traits.glass,existing);assert.equal(twice.traits.phoenix,true);
 record(id,'multiple/once-only',{state,st:h.context.st,seed:quietSeed},h,{pool:existing?7:15,phoenix:true},{first:once,second:twice},'PASS',{note:'Repeated raw awards is an effect-once fixture, not proof all honors/AS are idempotent.'});
}
for(let i=0;i<specs.length;i++)for(const mode of ['bad','good','past']){
 const award=specs[i][0],state=baseState();state.honors=[produced.get(award).replace('2035',mode==='past'?'2034':'2035')];if(mode==='good')state.lastSt.ER=30;
 const h=harness(state,quietSeed);h.run('movement()');const observed=h.observed.movement;assert(h.trace.includes('LEGACY.movement-native'));const hit=mode!=='past'&&([0,1,4].includes(i)||(after&&[2,3,5].includes(i))),good=mode==='good',demote=!hit&&!good;
 assert.equal(observed.wonAward,hit);assert.equal(observed.goodReal,good);assert.equal(h.trace.includes('handleDemotion-native'),demote);assert.equal(h.choices.length,demote?1:0);assert.equal(h.rng.length,0);
 const gap=!after&&mode==='bad'&&[2,3,5].includes(i);record('B'+String(i+1).padStart(2,'0')+'-'+mode,'active-movement',{state,overall:52,seed:quietSeed},h,{wonAward:hit,goodReal:good,demotion:demote},{...observed,demotionHandlerEntered:demote,level:h.snapshot().lv,demotionOptions:h.choices},gap?'FAIL':'PASS',{bug:gap?'BUG-AWARD-DEMOTION-JP-01':null,source:'game.js:3132 -> LEGACY.movement:1556 -> handleDemotion:1674',note:'Native handleDemotion offers contract-backed demotion choice; no choice accepted or contract/payment simulated.'});
}
for(const [id,award] of [['B08-55chance','最優秀投手賞'],['B09-protected','年間MVP']]){
 const state=baseState();state.honors=[produced.get(award)];const h=harness(state,demotionSeed,60);h.run('movement()');const protectedNow=after||award==='年間MVP';assert.equal(h.rng.length,protectedNow?0:1);assert.equal(h.trace.includes('handleDemotion-native'),!protectedNow);
 record(id,'high-overall-performance-branch',{state,overall:60,seed:demotionSeed},h,{rng:protectedNow?0:1,demotion:!protectedNow},{...h.observed.movement,demotionHandlerEntered:!protectedNow},protectedNow?'PASS':'FAIL',{source:'game.js:1625-1627',note:'Actual 55% performance demotion branch; native RNG is not mocked.'});
}
const result={mode:'VALIDATION_ONLY / ANALYSIS_ONLY',head:execFileSync('git',['rev-parse','HEAD']).toString().trim(),branch:execFileSync('git',['branch','--show-current']).toString().trim(),version:fs.readFileSync(new URL('../../src/config.js',import.meta.url),'utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)[1],node:process.version,engineSha256:createHash('sha256').update(src).digest('hex'),fixtureSeeds:{quietSeed,asSeed,demotionSeed},summary:{runtimeCases:out.length,harnessPASS:out.length,harnessFAIL:0,policyPASS:out.filter(r=>r.policyStatus==='PASS').length,policyFAIL:out.filter(r=>r.policyStatus==='FAIL').length,BLOCKED:0},cases:out,seconds:(performance.now()-start)/1000,limits:['Synthetic fixtures, not natural careers or UI E2E','DOM/market boundary test doubles; no accepted demotion or real payment','Observers inserted only in isolated in-memory copies; original decisions and active RNG unchanged','Policy FAIL means observed current defect, not fixture failure']};
fs.writeFileSync(arg('output'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary:result.summary,seeds:result.fixtureSeeds,seconds:result.seconds},null,2));
