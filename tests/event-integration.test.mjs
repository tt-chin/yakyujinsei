import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {TRAIT_LABELS} from '../docs/src/engine/trait-policy.js';
import {ensureEventState} from '../docs/src/engine/event-state-policy.js';
import * as defensePolicy from '../docs/src/engine/defense-position-policy.js';
import {AmateurCareer} from '../docs/src/engine/amateur-career.js';
import {execFileSync} from 'node:child_process';
const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const amateurSource=fs.readFileSync(new URL('../docs/src/engine/amateur-career.js',import.meta.url),'utf8');
const sim=game.slice(game.indexOf('function simSeason('),game.indexOf('/* シーズン状態は10%'));
const qual=game.slice(game.indexOf('function dpQual('),game.indexOf('const DP_RANK='));
const fixture={S:{pos:'P',role:'SP',age:23,lv:'NPB1',ab:{vel:20,ctl:20,brk:20,sta:30,con:20,pow:20,eye:20,spd:20},traits:{},seasonFactor:1,dpos:null},LV:{NPB1:{par:53,g:143}},DP_TH:{SS:{NPB1:50}},dpScore:()=>44,defensePositionQualified:defensePolicy.defensePositionQualified,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),N0:()=>0,R:()=>.5,isSP:()=>true,pitcherRole:()=> 'SP',defRuns:()=>0,applySeasonForm:()=>{}};
const moved=game.includes('seasonStats.simSeason(');
const context=vm.createContext(fixture);if(!moved)vm.runInContext(sim,context);
const seasonStats=moved?new (await import('../docs/src/engine/season-stats.js')).SeasonStats({getState:()=>fixture.S,levels:fixture.LV,rng:{R:()=>fixture.R(),N0:sd=>fixture.N0(sd),chance:p=>fixture.chance(p),ri:(a,b)=>fixture.ri(a,b)},clamp:fixture.clamp,isSP:()=>fixture.isSP(),pitcherRole:()=>fixture.pitcherRole(),checkGoldclothSeason:()=>fixture.checkGoldclothSeason()}):null;
if(seasonStats){seasonStats.defRuns=fixture.defRuns;seasonStats.applySeasonForm=fixture.applySeasonForm;}
const run=()=>seasonStats?seasonStats.simSeason('NPB1'):vm.runInContext("simSeason('NPB1')",context);
let plain=run();fixture.S.traits.favorite=true;let favored=run();assert.ok(favored.G>plain.G);assert.equal(favored.G,15);
fixture.S.seasonFactor=.5;assert.equal(run().G,8,'injury factor applies after favorite');
fixture.S.pos='IF';fixture.S.seasonFactor=1;fixture.S.ab.sta=20;fixture.S.traits.favorite=false;plain=run();fixture.S.traits.favorite=true;favored=run();assert.equal(plain.G,14);assert.equal(favored.G,119);
fixture.S.seasonFactor=.5;assert.equal(run().G,60,'favorite does not guarantee 85% of actual games');
vm.runInContext(qual,context);fixture.S.age=23;fixture.S.traits.favorite=false;
assert.equal(vm.runInContext("dpQual('SS')",context),false);fixture.S.traits.favorite=true;
assert.equal(vm.runInContext("dpQual('SS')",context),true,'young favorite stacks to threshold -6');
fixture.S.age=30;fixture.dpScore=()=>47;assert.equal(vm.runInContext("dpQual('SS')",context),true);
fixture.S.traits.favorite=false;assert.equal(vm.runInContext("dpQual('SS')",context),false);
assert.equal(vm.runInContext("dpQual('DH')",context),true);
// Guard actual integration locations, not the unreachable legacy tournament function.
assert.match(amateurSource,/power=overall\+beginEventSeason\(S\)\.form\+bonus\+ri\(-8,8\)/);
assert.match(amateurSource,/qualificationResult\(ovr\(\)\+beginEventSeason\(S\)\.form\+bonus\+ri\(-8,8\)\)/);
assert.match(game,/if\(eventPoints!==0\)Object\.assign\(st,normalizeEventSeason\(st,eventOptions\)\)/);
assert.match(game,/ensureEventState\(state\);state\.potSum0=Object\.values\(pot\)\.reduce\(\(sum,value\)=>sum\+value,0\);return state/);
assert.match(game,/try\{resetEventYear\(state\);startYear\(\);handoff\.status='COMMITTED'/);
assert.match(amateurSource,/consumeEventSeason\(S\);card\('bad'/);
assert.equal(TRAIT_LABELS.favorite,'監督のお気に入り');
assert.match(game,/eventPoints!==0[\s\S]*applyEventSeason[\s\S]*recordSalaryEvaluation\(entry\.st\)/);
const seasonEvents=fs.readFileSync(new URL('../docs/src/engine/season-events.js',import.meta.url),'utf8');
const eventDisplay=seasonEvents.slice(seasonEvents.indexOf('function eventChoiceSummary'),seasonEvents.indexOf('function drawEvents'));
assert.doesNotMatch(eventDisplay,/\b(?:R|ri|pick|chance)\s*\(/);
assert.match(fs.readFileSync(new URL('../docs/src/engine/event-policy.js',import.meta.url),'utf8'),/cntSocialBoldFail>10/);
for(const stage of ['HS','U','CORP','IND'])for(const rest of [false,true]){
  let rng=0,next=0,indResults=null;const state=ensureEventState({year:2030,age:20,stage,stageYr:1,schoolTier:'S',schoolId:'TEST',senbatsuEligibleYear:null,seasonFactor:rest?0:1,pendStat:-2,traits:{},ab:{},pool:0,honors:[],log:[],domesticCompletedKeys:{},domesticTournamentLog:[]});
  const career=new AmateurCareer({getState:()=>state,DATA:{universities:[{schoolId:'TEST',jinguRoute:'DIRECT'}]},displayTrait:k=>TRAIT_LABELS[k],traitCard:k=>{state.traits[k]=true;},ovr:()=>50,rng:{ri:()=>{rng++;return 0;}},card:()=>{},nextStep:()=>{next++;},maybeIntl:done=>done(),recordIndependentSalaryEvaluation:r=>{indResults=r;}});
  career.amateurSeason();
  assert.equal(state.pendStat,0,stage+' annual point consumption');assert.equal(state.eventSeasonContext.consumed,true);assert.equal(next,1);
  if(rest){assert.equal(rng,0);assert.equal(state.log[0].line,'全休');}
  else{assert.equal(state.eventSeasonContext.form,-2);assert.ok(state.domesticTournamentLog.length>0);const before=rng;career.amateurSeason();assert.equal(rng,before,'completed tournament guards prevent redraw');if(stage==='IND')assert.ok(indResults);}
}
// OOP §2k phase 9: 0cb3ccc dpScore/dpBar/dpQual/dpList/dpMult vs current wrappers + defense-position-policy, with the final DP_* tables.
const dpBaseline=execFileSync('git',['show','0cb3cccff0ef8fdd4a5f80fdfd4fa859b19cad9d:docs/src/engine/game.js'],{encoding:'utf8'});
const dpBlock=source=>source.slice(source.indexOf('function dpScore('),source.indexOf('function dposReview('));
const dpContext=source=>{const c=vm.createContext({...defensePolicy,log:[]});vm.runInContext(dpBlock(source)+'\nconst scoreOf=dpScore,qualOf=dpQual;dpScore=p=>{log.push("score:"+p);return scoreOf(p);};dpQual=p=>{log.push("qual:"+p);return qualOf(p);};',c);return c;};
const dpOld=dpContext(dpBaseline),dpNew=dpContext(game);
assert.ok(dpBlock(dpBaseline).length>0&&dpBlock(game).length>0);assert.equal(vm.runInContext('JSON.stringify([DP_TH,DP_BAR,DP_MULT,DP_RANK])',dpNew),vm.runInContext('JSON.stringify([DP_TH,DP_BAR,DP_MULT,DP_RANK])',dpOld));
const dpPositions=['SS','2B','3B','CF','RF','LF','C','1B','DH','XX'];
const dpCell=(c,state)=>{c.S=structuredClone(state);c.log=[];return vm.runInContext(`(()=>{const before=JSON.stringify(S),r={scores:${JSON.stringify(dpPositions)}.map(p=>scoreOf(p)),bar:dpBar(),qual:${JSON.stringify(dpPositions)}.map(p=>dpQual(p)),list:dpList(),mult:dpMult()};return JSON.stringify({r,log,unchanged:before===JSON.stringify(S)});})()`,c);};
const dpTH=JSON.parse(vm.runInContext('JSON.stringify(DP_TH)',dpOld)),dpValues=new Set([30,45.5,70]);
for(const th of Object.values(dpTH))for(const t of Object.values(th))for(const d of [-6.5,-6,-4.5,-3,-1.5,-1,0,0.5])dpValues.add(t+d);
const dpAbilities=[...dpValues].map(v=>({rng:v,fld:v,arm:v,cat:v})).concat([{rng:70,fld:40,arm:30,cat:55},{rng:35,fld:62,arm:58,cat:20}]);
let dpCells=0,dpQualSeen=new Set();
for(const pos of ['P','C','IF','OF'])for(const lv of ['CPBL1','NPB1','MLB','NPB2','CORP',undefined])for(const age of [20,21,22,23,24,25,26,27,30])for(const traits of [{},{favorite:true}])for(const ab of dpAbilities){
  const state={pos,lv,age,traits,ab,dpos:null},A=dpCell(dpOld,state);
  assert.equal(dpCell(dpNew,state),A,`defense position equivalence ${JSON.stringify(state)}`);const a=JSON.parse(A);assert.ok(a.unchanged);a.r.qual.forEach(q=>dpQualSeen.add(q));dpCells++;}
for(const pos of ['P','C','IF','OF'])for(const dpos of [null,...dpPositions]){const state={pos,lv:'NPB1',age:27,traits:{},ab:dpAbilities[0],dpos},A=dpCell(dpOld,state);
  assert.equal(dpCell(dpNew,state),A,`defense multiplier equivalence ${pos} ${dpos}`);dpCells++;}
assert.equal(dpCells,4*6*9*2*dpAbilities.length+4*11,'defense position equivalence cell count');assert.deepEqual([...dpQualSeen].sort(),[false,true]);
console.log('Actual favorite coefficients, injury order, tournament/season/state/display integration passed.');
