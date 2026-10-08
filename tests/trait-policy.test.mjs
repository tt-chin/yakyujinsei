import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import * as policy from '../docs/src/engine/trait-policy.js';
import {eventOdds,eventCounters,eventTraitUnlocks} from '../docs/src/engine/event-policy.js';
import {ensureEventState,beginEvent,applyEvent} from '../docs/src/engine/event-state-policy.js';
import {EVENT_CATALOG} from '../docs/src/data/event-cards-jp.js';
import {JP_DATA} from '../docs/src/data/jp-data.js';

assert.equal(Object.keys(policy.TRAIT_LABELS).length,38);
assert.deepEqual(policy.DEFERRED_TRAITS,['championmaker','pitcherTC','nitenichi']);
assert.equal(JP_DATA.teams.find(t=>t.teamId==='NPB_CL_HAN').name,'阪神ストライプス');
const labelState={mrTeamName:'阪神ストライプス',legendLeague:'NPB',rainbowLg:'MLB',tripleCrownHistory:{hitterTC:[{league:'NPB'},{league:'NPB'},{league:'KBO'}]}};
assert.equal(policy.traitLabel('mrteam',labelState,()=> 'ストライプス'),'ストライプスミスター');
assert.equal(policy.traitLabel('legend',labelState),'NPB歴史に残る名選手');
assert.equal(policy.traitLabel('rainbow',labelState),'MLB渡り鳥');
assert.equal(policy.traitLabel('hitterTC',labelState),'NPB・KBO打撃三冠王');
const old=['ラバーアーム','愛妻家','ロッカールームの癌','ムードメーカー','ゴールデングラブ常連','NPBジャーニーマン'];
const saved=structuredClone(old);
assert.deepEqual(old.map(v=>policy.removedTraitLabel(v)),['ゴムゴムの腕','女友達止まり','チームの癌','問題児','黄金のユニフォーム','NPB渡り鳥']);assert.deepEqual(old,saved);
for(const [love,eligible] of [
  [{datedTimes:3,kids:0,st:'dating',exes:[]},true],
  [{datedTimes:3,kids:0,st:'divorced'},true],
  [{datedTimes:3,kids:0,st:'single',exes:[{kids:1}]},false],
  [{datedTimes:3,kids:0,st:'dating',exes:[{kids:0},{kids:2}]},false],
  [{datedTimes:3,kids:1,st:'dating'},false],
  [{datedTimes:2,kids:0,st:'dating'},false],
  [{datedTimes:3,kids:0,st:'married'},false],
  [{datedTimes:3,kids:0},false],
])assert.equal(policy.confidanteEligible({love,traits:{}}),eligible);
assert.equal(policy.confidanteEligible({love:{datedTimes:3},traits:{confidante:true}}),false);
assert.equal(policy.confidanteEligible({love:{datedTimes:3,kids:0,st:'dating',exes:null},traits:{}}),true);

let s={year:2029,lv:'NPB1',orgTeamId:'NPB_CL_HAN',traits:{}};
for(let i=0;i<5;i++){s.year=2029+i;policy.recordFirstTeamSeason(s);policy.recordFirstTeamSeason(s);}
s.lv='NPB2';for(let i=0;i<12;i++){s.year=2034+i;policy.recordFirstTeamSeason(s);}
s.lv='NPB_DEV';policy.recordFirstTeamSeason(s);assert.equal(s.firstTeamYearsByTeam.NPB_CL_HAN,5);
s.lv='NPB1';s.orgTeamId='NPB_CL_YOM';for(let i=0;i<10;i++){s.year=2046+i;policy.recordFirstTeamSeason(s);}
assert.equal(policy.goldclothEligible(s),false);
s.orgTeamId='NPB_CL_HAN';for(let i=0;i<4;i++){s.year=2056+i;policy.recordFirstTeamSeason(s);}
assert.equal(policy.goldclothEligible(s),false);s.year=2060;policy.recordFirstTeamSeason(s);assert.equal(policy.goldclothEligible(s),true);
s.traits.goldcloth=true;assert.equal(policy.goldclothEligible(s),false);
assert.equal(policy.goldclothEligible({traits:{},teamTally:{NPB:{NPB_CL_HAN:10},CPBL:{CPBL_TAICHUNG_MAMMOTHS:10}}}),false,'mixed old tenure is not evidence');

const wins=['HS_SUMMER_LOCAL','HS_FALL','HS_SENBATSU','HS_KOSHIEN'].map((key,i)=>({key,year:2026+i,result:'優勝'}));
assert.equal(policy.highSchoolChampionCount({domesticTournamentLog:wins.slice(0,3)}),3);
assert.equal(policy.highSchoolChampionCount({domesticTournamentLog:[...wins,...wins,{year:2028,key:'U_SPRING',result:'優勝'},{year:2028,key:'HS_FALL',result:'準優勝'}]}),4);

const awardState=(age,pos='IF',bucket='NPB')=>({age,pos,year:2045,traits:{},honors:[`2045 ${bucket==='MLB'?'メジャーリーグ':bucket}年間MVP`]});
for(const [age,pos,bucket,expected] of [[23,'P','NPB',['strongpitch']],[23,'IF','MLB',['stronghit']],[24,'IF','NPB',[]],[23,'P','KBO',[]],[34,'P','NPB',[]],[35,'P','NPB',['oldghost']]]){
  const v=awardState(age,pos,bucket);assert.deepEqual(policy.awardTraitUnlocks(v,bucket,bucket==='MLB'?'メジャーリーグ':bucket),expected);assert.deepEqual(policy.awardTraitUnlocks(v,bucket,bucket==='MLB'?'メジャーリーグ':bucket),[]);
}
s=awardState(35);s.oldGhostUsed=true;assert.deepEqual(policy.awardTraitUnlocks(s,'NPB','NPB'),[]);
s=awardState(35);s.honors=[];assert.deepEqual(policy.awardTraitUnlocks(s,'NPB','NPB'),[]);
assert.equal(policy.declineForSeason({oldGhostPending:true},2),1,'disc-adjusted first-stage decline');
s=awardState(35);policy.awardTraitUnlocks(s,'NPB','NPB');assert.equal(s.oldGhostPending,true);assert.equal(policy.declineForSeason(s,7),4);assert.equal(s.oldGhostPending,false);assert.equal(s.oldGhostUsed,true);assert.equal(policy.declineForSeason(s,8),8);assert.equal(policy.declineForSeason({},5),5);
s={age:23,pos:'IF',year:2033,traits:{},honors:['2033 NPB首位打者','2033 NPB本塁打王','2033 NPB打点王']};
assert.deepEqual(policy.awardTraitUnlocks(s,'NPB','NPB'),['hitterTC','stronghit']);assert.equal(s.honors.filter(h=>h==='2033 NPB年間MVP').length,1);
assert.deepEqual(policy.awardTraitUnlocks(s,'NPB','NPB'),[]);assert.equal(s.tripleCrownHistory.hitterTC.length,1);
s.year=2034;s.honors.push('2034 KBO首位打者','2034 KBO本塁打王','2034 KBO打点王');assert.deepEqual(policy.awardTraitUnlocks(s,'KBO','KBO'),['hitterTC']);assert.equal(s.tripleCrownHistory.hitterTC.length,2);assert.deepEqual(policy.awardTraitUnlocks(s,'KBO','KBO'),[]);
s.year=2035;s.honors.push('2035 NPB首位打者','2035 NPB本塁打王','2035 NPB打点王');assert.deepEqual(policy.awardTraitUnlocks(s,'NPB','NPB'),[]);assert.equal(s.tripleCrownHistory.hitterTC.length,3);
for(const honors of [['2033 NPB首位打者','2033 NPB本塁打王','2034 NPB打点王'],['2033 NPB首位打者','2033 NPB本塁打王','2033 KBO打点王']]){const v={age:24,pos:'IF',year:2033,traits:{},honors};assert.deepEqual(policy.awardTraitUnlocks(v,'NPB','NPB'),[]);}

assert.equal(eventCounters({}, {category:'encounter',counterTags:[]},'safe',false,'training').cntTrainingSafeFail,undefined);
assert.equal(eventCounters({}, {category:'training',counterTags:[]},'safe',true,'training').cntTrainingSafeFail,undefined);
assert.equal(eventCounters({}, {category:'training',counterTags:[]},'norm',false,'training').cntTrainingSafeFail,undefined);
assert.ok(eventTraitUnlocks({traits:{},age:35,cntTrainingSafeFail:20}).includes('latepractice'));
assert.ok(!eventTraitUnlocks({traits:{},age:35,cntTrainingSafeFail:19}).includes('latepractice'));
for(const traits of [{},{genius:true},{late:true},{clutch:true},{thief:true},{genius:true,thief:true}]){const oldOdds=eventOdds(traits),newOdds=eventOdds({...traits,latepractice:true});assert.equal(newOdds.safe,oldOdds.safe-5);assert.equal(newOdds.norm,oldOdds.norm);assert.equal(newOdds.bold,oldOdds.bold);}
const card=EVENT_CATALOG.events.find(e=>e.category==='training'&&e.eligibility.role==='ALL');
s=ensureEventState({year:2030,age:35,pos:'IF',stage:card.eligibility.stages[0],lv:card.eligibility.levels[0],org:card.eligibility.orgs[0],traits:{},ab:{sta:50},pot:{sta:80},carry:{},cntTrainingSafeFail:19});
let calls=0;const odds=[],options={chance:p=>{calls++;odds.push(p);return false;},pick:()=>{calls++;return 'sta';},abilityKeys:['sta']};
const pending=beginEvent(s,card);const first=applyEvent(s,card,'safe',options);assert.equal(s.cntTrainingSafeFail,20);assert.equal(s.traits.latepractice,true);assert.equal(odds[0],70);
const before=structuredClone(s),count=calls;assert.equal(applyEvent(s,card,'safe',{...options,occurrenceID:pending.eventOccurrenceID}).applied,false);assert.deepEqual(s,before);assert.equal(calls,count);
beginEvent(s,card);applyEvent(s,card,'safe',options);assert.equal(odds[1],65);

// Run the actual awards binding against the pre-change source: original chance calls must remain in place.
const current=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const oldGame=execFileSync('git',['show','9fcb24a:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:3e6});
const awards=source=>source.slice(source.indexOf('function awards('),source.indexOf('function maybeIntl('));
for(const pos of ['P','IF']){
  const runs=[oldGame,current].map(source=>{const chances=[],state={year:2030,age:23,pos,role:'SP',lv:'NPB1',seasonFactor:1,orgTeamId:'NPB_CL_HAN',traits:{},honors:[],stats:{NPB:{yr:2,AS:0}},dpos:'DH'},ctx=vm.createContext({...policy,S:state,LV:{NPB1:{top:true,g:143}},clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),chance:p=>{chances.push(p);return p===100;},isSP:()=>true,card:()=>{},removeTrait:()=>{},displayTrait:k=>policy.traitLabel(k,state)});
    vm.runInContext(awards(source),ctx);vm.runInContext("awards('NPB',{d:7,PA:600,avg:.38,HR:45,RBI:140,SB:0,H:200,BB:20,IP:180,era:2,SO:220,DEF:0})",ctx);return {chances,state};});
  assert.deepEqual(runs[1].chances,runs[0].chances);
  if(pos==='IF'){assert.equal(runs[0].state.honors.includes('2030 NPB年間MVP'),false);assert.equal(runs[1].state.honors.includes('2030 NPB年間MVP'),true);assert.equal(runs[1].state.traits.hitterTC,true);}
}
assert.doesNotMatch(fs.readFileSync(new URL('../docs/src/engine/trait-policy.js',import.meta.url),'utf8'),/\b(?:R|ri|pick|chance|random)\s*\(/);
console.log('38 labels, deferred IDs, child/marriage guards, first-team cumulative tenure, HS wins, MVP/age/triple-crown boundaries, one-use decline, safe failure/idempotency and original awards RNG calls passed.');
