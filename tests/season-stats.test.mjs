import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {SeasonStats} from '../docs/src/engine/season-stats.js';

// OOP plan §2h: SeasonStats (through the game.js delegates and wiring) must match the game.js functions of ffb9e32
// exactly: return values, state changes, and the RNG draw sequence (count and order).
const old=execFileSync('git',['show','ffb9e320c711746e603d5984335b04820d23e790:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const current=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const between=(src,from,to)=>{const s=src.indexOf(from),e=src.indexOf(to,s+1);assert.ok(s>=0&&e>s,'missing '+from);return src.slice(s,e);};
const line=(src,re)=>{const m=src.match(re);assert.ok(m,'missing '+re);return m[0];};
const NAMES=['blankStat','simSeason','applySeasonForm','defRuns','addStatTotal','accStat','accLevelStat'];
// Shared by both sides: RNG helpers and role helpers verbatim from the baseline.
const shared=['const ri=','const pick=','const chance=','const clamp=','const N0='].map(p=>line(old,new RegExp('^'+p+'.*$','m'))).join('\n')+'\n'
  +between(old,'\nfunction pitcherRole(','\nfunction fmtIP(')+'\n'+line(old,/^function isSP\(\).*$/m)+'\n';
const levels=vm.runInNewContext('('+old.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1]+')');
const oldFunctions=line(old,/^function blankStat\(\).*$/m)+'\n'+between(old,'\nfunction simSeason(','\nfunction statLine(');
const delegates=NAMES.map(n=>line(current,new RegExp('^function '+n+'\\(.*$','m'))).join('\n');
assert.ok(NAMES.every(n=>delegates.includes('return seasonStats.'+n+'(')),'game.js keeps one-line delegates');
const wiring=line(current,/^const seasonStats=new SeasonStats\(.*$/m);
// OOP plan §2i (7-A): addIntlStats joined SeasonStats; its game.js line is the same in ffb9e32 and 34ed23c.
const oldIntl=line(old,/^  function addIntlStats\(\).*$/m);
const intlDelegate=line(current,/^  function addIntlStats\(\).*$/m);
assert.equal(intlDelegate,'  function addIntlStats(){return seasonStats.addIntlStats();}','game.js keeps the addIntlStats delegate');

function side(kind,state,seq){
  const draws=[],gold=[];let i=0;
  const ctx=vm.createContext({S:structuredClone(state),LV:levels,SeasonStats,draws,
    R:()=>{const v=seq[i++%seq.length];draws.push(v);return v;},
    checkGoldclothSeason:()=>{gold.push(ctx.S.statsByLevel?.NPB1?.yr??null);}});
  vm.runInContext(shared+(kind==='old'?oldFunctions+'\n'+oldIntl:wiring+'\n'+delegates+'\n'+intlDelegate),ctx);
  return {ctx,draws,gold,run:code=>vm.runInContext(code,ctx)};
}
const lcg=seed=>{let x=seed>>>0;return Array.from({length:97},()=>((x=Math.imul(x,1664525)+1013904223>>>0)/4294967296));};
const json=v=>v===undefined?'<undefined>':JSON.parse(JSON.stringify(v));
function same(id,state,code,seq){
  const a=side('old',state,seq),b=side('new',state,seq);
  const ra=a.run(code),rb=b.run(code);
  assert.deepEqual(json(rb),json(ra),id+' return');
  assert.deepEqual(json(b.ctx.S),json(a.ctx.S),id+' state');
  assert.deepEqual(b.draws,a.draws,id+' RNG draws');
  assert.deepEqual(b.gold,a.gold,id+' checkGoldclothSeason');
  return a.draws.length;
}
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};

const ab={vel:55,ctl:52,brk:50,sta:60,con:50,pow:48,eye:47,spd:52,fld:50,arm:49,cat:51,rng:53};
const base={pos:'P',role:'SP',lv:'NPB1',ab,traits:{},seasonFactor:1,dpos:null,stats:{},teamTally:{},dposYears:{},roleYears:{},orgTeamId:'T1'};
const fixtures={
  'P SP':{},
  'P MR':{role:'MR'},
  'P CL':{role:'CL'},
  'P CL favorite':{role:'CL',traits:{favorite:true},ab:{...ab,vel:30,ctl:30,brk:30}},
  'P role unset (bullpen, CL→MR)':{role:null,ab:{...ab,sta:45}},
  'P role unset (SP)':{role:null},
  'P seasonFactor 0.5':{seasonFactor:.5},
  'P seasonFactor 0':{seasonFactor:0},
  'IF DH turn':{pos:'IF',role:null,ab:{...ab,con:80,pow:80,eye:80,spd:70,sta:40},dpos:'SS'},
  'IF DH (no defense)':{pos:'IF',role:null,dpos:'DH'},
  'C':{pos:'C',role:null},
  'IF favorite':{pos:'IF',role:null,traits:{favorite:true},ab:{...ab,con:20,pow:20,eye:20,spd:20,sta:30},dpos:'CF'},
  'IF seasonFactor 0.5':{pos:'IF',role:null,seasonFactor:.5,dpos:'2B'},
  ...Object.fromEntries([60,52,47,42,37,30].map(sta=>['IF sta '+sta,{pos:'IF',role:null,dpos:'3B',ab:{...ab,sta}}])),
};

for(const [name,v] of Object.entries(fixtures))for(const lv of ['NPB1','MLB','CPBL2'])test('simSeason '+name+' '+lv,()=>{
  let draws=0;for(let seed=1;seed<=40;seed++)draws+=same(name,{...base,...v},`simSeason(${JSON.stringify(lv)})`,lcg(seed*7919+lv.length));
  assert.equal(draws>0,(v.seasonFactor??1)>0,'draws happen only when playing');
});
// Season form: low (roll<.10), career high (.10≤roll<.20, healthy only) and normal, for P and IF.
for(const pos of ['P','IF'])for(const seasonFactor of [1,.95,.5,0])for(const roll of [.05,.15,.5])test(`applySeasonForm ${pos} f=${seasonFactor} roll=${roll}`,()=>{
  const st={G:40,PA:170,AB:150,H:45,HR:9,RBI:30,SB:6,BB:20,W:8,L:6,SV:12,HLD:9,IP:60,SO:70,ER:20,avg:.3,era:3,d:2};
  same('form',{...base,pos,role:pos==='P'?'CL':null,seasonFactor},`const st=${JSON.stringify(st)};applySeasonForm(st,'NPB1');st`,[roll]);
});
for(const [pos,dpos] of [['P',null],['IF','DH'],['IF','SS'],['IF','LF'],['IF',null],['C',null],['IF','XX']])test(`defRuns ${pos} ${dpos}`,()=>same('def',{...base,pos,dpos,seasonFactor:.8},"defRuns('NPB1')",[.5]));
test('blankStat / addStatTotal',()=>same('total',base,"const t=blankStat();addStatTotal(t,{G:3,IP:10.1,SO:4,DEF:2});addStatTotal(t,{G:1,IP:.2,H:2});t",[.5]));
for(const [name,v,code] of [
  ['P new bucket',{},"accStat('NPB',{G:5,IP:30})"],
  ['P MINOR',{},"accStat('MINOR',{G:5,IP:30})"],
  ['P no role',{role:null},"accStat('NPB',{G:5,IP:30})"],
  ['IF existing bucket + tally',{pos:'IF',role:null,dpos:'SS',stats:{NPB:{yr:1,G:9,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,AS:0,DEF:1}},teamTally:{NPB:{T1:1}}},"accStat('NPB',{G:5,PA:20,DEF:3})"],
  ['IF _dh',{pos:'IF',role:null,dpos:'1B'},"accStat('NPB',{G:5,_dh:true})"],
  ['IF no dpos, no team',{pos:'IF',role:null,orgTeamId:null},"accStat('MLB',{G:1})"],
])test('accStat '+name,()=>same(name,{...base,...v},code,[.5]));
for(const [name,v,code] of [
  ['init + NPB1 goldcloth',{},"accLevelStat('NPB1',{G:5,IP:30});accLevelStat('NPB1',{G:2,IP:3})"],
  ['MLB (no goldcloth)',{statsByLevel:{MLB:null}},"accLevelStat('MLB',{G:5,IP:30})"],
])test('accLevelStat '+name,()=>same(name,{...base,...v},code,[.5]));
const intlStat={G:3,IP:12.1,W:1,SV:1,SO:9,ER:4,PA:14,AB:12,H:4,HR:1,RBI:3};
for(const [name,v] of Object.entries({'P SP':{},'P MR':{role:'MR'},'P CL':{role:'CL'},'P low ability':{ab:{...ab,vel:30,ctl:30,brk:30}},'IF':{pos:'IF',role:null},'IF high ability':{pos:'IF',role:null,ab:{...ab,con:90,pow:90,eye:90}}}))
  for(const [seqName,seq] of [['lcg1',lcg(1)],['lcg7',lcg(7)],['low',[.01]],['high',[.99]]])
    test(`addIntlStats ${name} ${seqName}`,()=>same('addIntlStats '+name,{...base,intlStat:{...intlStat},...v},'addIntlStats()',seq));
test('addIntlStats zero intlStat',()=>same('addIntlStats zero',{...base,intlStat:Object.fromEntries(Object.keys(intlStat).map(k=>[k,0]))},'addIntlStats()',lcg(3)));

// Late binding: a test (or replay hook) that reassigns R after construction must still see every draw.
for(const v of [{},{role:'MR'},{pos:'IF',role:null}])test('R reassigned after construction is used '+JSON.stringify(v),()=>{
  const a=side('old',{...base,...v},[.5]),b=side('new',{...base,...v},[.5]);a.run("simSeason('NPB1')");
  b.run("var rebound=0;R=()=>{rebound++;return .5;}");b.run("simSeason('NPB1')");
  assert.deepEqual([b.draws.length,b.run('rebound')],[0,a.draws.length],'every draw goes through the reassigned R');
});
for(const v of [{},{role:'MR'},{pos:'IF',role:null}])test('addIntlStats R reassigned after construction is used '+JSON.stringify(v),()=>{
  const state={...base,intlStat:{...intlStat},...v},a=side('old',state,[.5]),b=side('new',state,[.5]);a.run('addIntlStats()');
  b.run("var rebound=0;R=()=>{rebound++;return .5;}");b.run('addIntlStats()');
  assert.deepEqual([b.draws.length,b.run('rebound')],[0,a.draws.length],'every draw goes through the reassigned R');
});
test('state read on every call',()=>{
  const b=side('new',base,[.5]);b.run("S={...S,pos:'IF',role:null,dpos:'SS'}");
  assert.equal(b.run("defRuns('NPB1')")!==0,true,'new S (fielder) is used, not the captured pitcher');
});
console.log(`season-stats: ${pass} PASS; SeasonStats matches ffb9e32 values, state and RNG draws`);
