import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as domestic from '../docs/src/engine/domestic-tournament-policy.js';
import {TRAIT_LABELS,TRAIT_TEXT,highSchoolChampionCount} from '../docs/src/engine/trait-policy.js';
import {ensureEventState,beginEventSeason,consumeEventSeason} from '../docs/src/engine/event-state-policy.js';
const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const sim=game.slice(game.indexOf('function simSeason('),game.indexOf('/* シーズン状態は10%'));
const qual=game.slice(game.indexOf('function dpQual('),game.indexOf('const DP_RANK='));
const fixture={S:{pos:'P',role:'SP',age:23,lv:'NPB1',ab:{vel:20,ctl:20,brk:20,sta:30,con:20,pow:20,eye:20,spd:20},traits:{},seasonFactor:1,dpos:null},LV:{NPB1:{par:53,g:143}},DP_TH:{SS:{NPB1:50}},dpScore:()=>44,clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),N0:()=>0,R:()=>.5,isSP:()=>true,pitcherRole:()=> 'SP',defRuns:()=>0,applySeasonForm:()=>{}};
const context=vm.createContext(fixture);vm.runInContext(sim,context);
const run=()=>vm.runInContext("simSeason('NPB1')",context);
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
assert.match(game,/power=overall\+beginEventSeason\(S\)\.form\+bonus\+ri\(-8,8\)/);
assert.match(game,/qualificationResult\(ovr\(\)\+beginEventSeason\(S\)\.form\+bonus\+ri\(-8,8\)\)/);
assert.match(game,/if\(eventPoints!==0\)Object\.assign\(st,normalizeEventSeason\(st,eventOptions\)\)/);
assert.match(game,/ensureEventState\(state\);return state/);
assert.match(game,/resetEventYear\(S\); startYear\(\)/);
assert.match(game,/consumeEventSeason\(S\);card\('bad'/);
assert.equal(TRAIT_LABELS.favorite,'監督のお気に入り');
assert.match(game,/eventPoints!==0[\s\S]*applyEventSeason[\s\S]*recordSalaryEvaluation\(st\)/);
const eventDisplay=game.slice(game.indexOf('function eventChoiceSummary'),game.indexOf('function drawEvents'));
assert.doesNotMatch(eventDisplay,/\b(?:R|ri|pick|chance)\s*\(/);
assert.match(fs.readFileSync(new URL('../docs/src/engine/event-policy.js',import.meta.url),'utf8'),/cntSocialBoldFail>10/);
const amateur=game.slice(game.indexOf('  function cupOnce('),game.indexOf('  function intlEvents('));
for(const stage of ['HS','U','CORP','IND'])for(const rest of [false,true]){
  let rng=0,next=0,indResults=null;const state=ensureEventState({year:2030,age:20,stage,stageYr:1,schoolTier:'S',schoolId:'TEST',senbatsuEligibleYear:null,seasonFactor:rest?0:1,pendStat:-2,traits:{},ab:{},pool:0,honors:[],log:[],domesticCompletedKeys:{},domesticTournamentLog:[]});
  const ctx=vm.createContext({...domestic,S:state,DATA:{universities:[{schoolId:'TEST',jinguRoute:'DIRECT'}]},TRAIT_TEXT,highSchoolChampionCount,displayTrait:k=>TRAIT_LABELS[k],traitCard:k=>{state.traits[k]=true;},ensureEventState,beginEventSeason,consumeEventSeason,ovr:()=>50,ri:()=>{rng++;return 0;},card:()=>{},nextStep:()=>{next++;},maybeIntl:done=>done(),recordIndependentSalaryEvaluation:r=>{indResults=r;}});
  vm.runInContext(amateur,ctx);vm.runInContext('amateurSeason()',ctx);
  assert.equal(state.pendStat,0,stage+' annual point consumption');assert.equal(state.eventSeasonContext.consumed,true);assert.equal(next,1);
  if(rest){assert.equal(rng,0);assert.equal(state.log[0].line,'全休');}
  else{assert.equal(state.eventSeasonContext.form,-2);assert.ok(state.domesticTournamentLog.length>0);const before=rng;vm.runInContext('amateurSeason()',ctx);assert.equal(rng,before,'completed tournament guards prevent redraw');if(stage==='IND')assert.ok(indResults);}
}
console.log('Actual favorite coefficients, injury order, tournament/season/state/display integration passed.');
