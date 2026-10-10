import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createProductionHarness,leagues,labels} from './retirement-hof-test-support.mjs';
const baseline=execFileSync('git',['show','925987dc1bb93304eddd8eb71ab2876eef9dac8c:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
const blank=()=>({yr:10,G:0,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,DEF:0});
const thresholds=createProductionHarness({traits:{},honors:[],stats:{}}).snapshot().thresholds;
const mult={CPBL:1.15,KBO:1.15,NPB:1.12,MLB:1.2};
let count=0;
function check(id,scores,expected,existing=false,initialLeague){
 const initial={pos:'IF',lv:'MLB',stage:'PRO',year:2050,traits:{legend:existing},honors:[],stats:Object.fromEntries(Object.entries(scores).map(([l,H])=>[l,{...blank(),H}])),teamTally:{}};
 if(initialLeague!==undefined)initial.legendLeague=initialLeague;
 const runs=[baseline,undefined].map(source=>{const h=createProductionHarness(initial,id,source);h.run("retireScene(Object.fromEntries(Object.keys(S.stats).map(b=>[b,tierOf(b)])))");return {h,snap:h.snapshot(),cards:structuredClone(h.cards)};});
 const [old,now]=runs;assert.equal(now.snap.state.legendLeague,expected,id);
 const corrected=structuredClone(old.snap);if(old.snap.state.legendLeague!==expected)corrected.state.legendLeague=expected;
 assert.deepEqual(now.snap,corrected,id+' only legendLeague may change; calls, S.rngState and hofInfo exact');
 const oldCards=old.cards.map(c=>{if(c[1].startsWith('隠し特性解放：')&&old.snap.state.legendLeague!==expected){const prev=old.snap.state.legendLeague;return c.map((value,i)=>i?value.replaceAll(prev,expected):value);}return c;});
 assert.deepEqual(now.cards,oldCards,id+' exact cards except corrected legend label');
 const expectedFirst=leagues.filter(l=>scores[l]!=null&&Math.round(scores[l])>=thresholds[l][0]*mult[l]);
 assert.deepEqual(now.snap.state.hofInfo?.filter(x=>x.yr===1).map(x=>x.lg)||[],expectedFirst.map(l=>labels[l]),id+' first ballot uses rounded t.sc and native float comparison');
 assert.equal(now.snap.state.traits.legend,existing||expectedFirst.length>0,id+' unchanged unlock');
 console.log(id+' PASS RNG='+now.snap.calls+' final='+now.snap.state.rngState);count++;
}
check('F01',{CPBL:8600,MLB:11000},'メジャーリーグ');
for(const [id,l]of [['F02','CPBL'],['F03','NPB'],['F04','KBO'],['F05','MLB']])check(id,{[l]:11000},labels[l]);
check('F06',{CPBL:11000,MLB:11000},'台湾プロ野球');
check('F07',{CPBL:8600,KBO:11000,MLB:11000},'KBO');
check('F08',{CPBL:8600,MLB:8600},'existing-marker',false,'existing-marker');
check('F09-candidate',{NPB:6000},undefined);check('F09-none',{NPB:100},undefined);
check('F10',{MLB:11000},'NPB',true,'NPB');
for(const l of leagues){const boundary=thresholds[l][0]*mult[l];for(const delta of [-1,0,1,-.49,.49]){const score=boundary+delta;check('F11-'+l+'-'+delta,{[l]:score},Math.round(score)>=boundary?labels[l]:undefined);}}
console.log(count+' fixed diagnostic before/after cases PASS; only league label changes, RNG and vote cards exact.');
