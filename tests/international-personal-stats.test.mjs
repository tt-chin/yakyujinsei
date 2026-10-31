import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {execFileSync} from 'node:child_process';
import {internationalPersonalStats,renderInternationalPersonalStats} from '../docs/src/ui/international-personal-stats.js';
import {prepareInternationalResult,commitInternationalResult} from '../docs/src/engine/international-trait-policy.js';
const source=readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const fmtIP=runInNewContext('('+source.slice(source.indexOf('function fmtIP('),source.indexOf('function roleN('))+')');
const zero={G:0,IP:0,W:0,SV:0,SO:0,ER:0,PA:0,AB:0,H:0,HR:0,RBI:0};
const state=()=>({year:2035,intlCount:0,intlFinalCount:0,intlCompletedKeys:{},intlTraitResults:{},intlStat:{...zero},pool:0,injNext:17,honors:[],traits:{}});
let cases=0;
function test(id,f){f();console.log('PASS '+id);cases++;}
test('T01 SP saved delta and formatting',()=>{
 const personal=internationalPersonalStats(zero,{...zero,G:6,IP:9,W:1,SO:9,ER:2},'P','SP');
 assert.deepEqual(personal,{position:'P',role:'SP',stats:{G:6,IP:9,W:1,SV:0,SO:9,ER:2}});
 assert.match(renderInternationalPersonalStats(personal,fmtIP),/登板 6｜投球回 9.0｜勝利 1｜セーブ 0/);
 assert.match(renderInternationalPersonalStats(personal,fmtIP),/奪三振 9｜防御率 2.00/);
});
for(const role of ['MR','CL'])for(const SV of [0,2])test('T02 '+role+' SV='+SV,()=>{
 const p=internationalPersonalStats(zero,{...zero,G:5,IP:6.3,SV},'P',role);assert.match(renderInternationalPersonalStats(p,fmtIP),new RegExp('セーブ '+SV));
});
for(const position of ['C','IF','OF'])test('T03 '+position,()=>{
 const p=internationalPersonalStats(zero,{...zero,G:7,PA:28,AB:24,H:8,HR:1,RBI:5},position,null);
 assert.match(renderInternationalPersonalStats(p,fmtIP),/出場 7｜打席 28｜打数 24｜安打 8/);
 assert.match(renderInternationalPersonalStats(p,fmtIP),/打率 .333｜本塁打 1｜打点 5/);
});
test('T04 T05 T06 T11 copied snapshot, separate events, repeated commit',()=>{
 const s=state(),input={position:'IF',role:null,stats:{G:7,PA:28,AB:24,H:8,HR:1,RBI:5}};
 const prepared=prepareInternationalResult(s,{eventKey:'P12:2035',name:'WBSCプレミア12'},{rank:'優勝',stats:{...zero,...input.stats},hadIntlace:false,personalStats:input});
 input.stats.H=999;assert.equal(prepared.result.personalStats.stats.H,8);
 const first=commitInternationalResult(s,prepared);const saved=JSON.stringify(s);
 assert.equal(commitInternationalResult(s,prepared).created,false);assert.equal(JSON.stringify(s),saved);
 s.intlStat.H=100;assert.equal(first.result.personalStats.stats.H,8);
 const next={...s.intlStat,G:s.intlStat.G+5,H:s.intlStat.H+2};
 const personal=internationalPersonalStats(s.intlStat,next,'IF',null);
 const second=prepareInternationalResult(s,{eventKey:'WBC:2038',name:'ワールド・ベースボール・クラシック'},{rank:'ベスト4',stats:next,hadIntlace:false,personalStats:personal});
 commitInternationalResult(s,second);second.stats.H=999;
 assert.equal(first.result.personalStats.stats.H,8);assert.equal(s.intlTraitResults['WBC:2038'].personalStats.stats.H,2);
 assert.equal(s.intlCount,2);assert.equal(s.pool,10);assert.equal(s.injNext,37);
});
test('T08 third appearance retains timing and subsequent minimum',()=>{
 const s=state();s.intlCount=2;s.intlFinalCount=2;
 const p=prepareInternationalResult(s,{eventKey:'P12:2035',name:'P12'},{rank:'ベスト8',stats:zero,hadIntlace:false});commitInternationalResult(s,p);
 assert.equal(p.result.awardedPoints,1);assert.equal(p.result.injuryAdded,10);assert.equal(s.traits.intlace,true);
 const next=prepareInternationalResult(s,{eventKey:'WBC:2038',name:'WBC'},{rank:'ベスト8',stats:zero,hadIntlace:true});assert.equal(next.result.awardedPoints,2);assert.equal(next.result.injuryAdded,0);
});
test('T09 denominator zero, missing/non-finite/negative display and zero counts',()=>{
 for(const position of ['P','IF']){
  const html=renderInternationalPersonalStats({position,stats:{...zero}},fmtIP);assert.match(html,position==='P'?/防御率 —/:/打率 —/);assert.match(html,position==='P'?/セーブ 0/:/本塁打 0/);
  for(const value of [undefined,NaN,Infinity,-1]){const broken=Object.fromEntries(Object.keys(zero).map(k=>[k,value]));const out=renderInternationalPersonalStats({position,stats:broken},fmtIP);assert.doesNotMatch(out,/NaN|Infinity|undefined/);assert.match(out,/—/);}
 }
});
test('T10 absent old snapshot, unchanged old preparation shape',()=>{
 assert.equal(renderInternationalPersonalStats(null,fmtIP),'<p>本大会の個人成績：記録なし</p>');
 const p=prepareInternationalResult(state(),{eventKey:'old',name:'old'},{rank:'優勝',stats:zero,hadIntlace:false});assert.equal(Object.hasOwn(p.result,'personalStats'),false);
});
test('T12 saved position determines type without current state',()=>{
 const p={position:'P',role:'MR',stats:{G:2,IP:3,SO:4,ER:0,W:0,SV:0}};assert.match(renderInternationalPersonalStats(p,fmtIP),/登板/);assert.doesNotMatch(renderInternationalPersonalStats(p,fmtIP),/打率|打席/);
});
test('T13 decimal IP rounding leaves input untouched; invalid deltas fail visibly',()=>{
 const before={...zero,IP:12.2},after={...zero,IP:18.3};const original=JSON.stringify([before,after]);
 assert.equal(internationalPersonalStats(before,after,'P','SP').stats.IP,6.1);assert.equal(JSON.stringify([before,after]),original);
 assert.throws(()=>internationalPersonalStats(after,before,'P','SP'),/INVALID_INTERNATIONAL_STATS_DELTA/);
});
test('existing addIntlStats and fmtIP implementations remain byte-equivalent',()=>{
 const baseline=execFileSync('git',['show','e602174a22d7472e1021d780388ad61adc6b11b6:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
 let current=source.replace(/\r\n/g,'\n');
 // OOP plan §2i (7-A): addIntlStats moved into SeasonStats; game.js keeps a one-line delegate. Rebuild the former
 // game.js line from the method (drop the state/deps/RNG destructuring line) so the byte comparison still covers it.
 if(current.includes('seasonStats.addIntlStats(')){
  const delegate='  function addIntlStats(){return seasonStats.addIntlStats();}\n';
  assert.equal(current.split(delegate).length,2,'game.js keeps one addIntlStats delegate');
  const seasonStats=readFileSync(new URL('../docs/src/engine/season-stats.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
  const header='  addIntlStats(){\n    const S=this.#getState(),{clamp,isSP}=this.#deps,{R,chance,ri}=this.#rng;\n    ';
  assert.equal(seasonStats.split(header).length,2,'one SeasonStats addIntlStats method');
  const at=seasonStats.indexOf(header)+header.length;
  current=current.replace(delegate,'  function addIntlStats(){'+seasonStats.slice(at,seasonStats.indexOf('\n  }\n',at))+'}\n');
 }
 // OOP plan §2s: completeIntl moved into InternationalTournament, so addIntlStats ends at the next 2-space declaration.
 for(const [start,end]of [['  function addIntlStats(', '\n  function '],['function fmtIP(', 'function roleN(']])assert.equal(current.slice(current.lastIndexOf(start),current.indexOf(end,current.lastIndexOf(start))),baseline.slice(baseline.lastIndexOf(start),baseline.indexOf(end,baseline.lastIndexOf(start))));
});
console.log(cases+' cases PASS');
