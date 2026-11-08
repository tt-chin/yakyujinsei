import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {LeagueCatalog,leagueTables} from '../docs/src/engine/league-catalog.js';
import {JP_DATA} from '../docs/src/data/jp-data.js';

// OOP phase 38 (§2qq): the league, level and team tables and their lookups moved from game.js into LeagueCatalog.
// The old game.js defined the Taiwan tables first and overwrote them with the Japanese overlay (Object.assign);
// the catalog defines the overwritten result once. Compared here against the pre-move game.js, order-sensitively.
const BASE='8b489b2117c4fe5ab1b8a75d962d4280b73c8b7d';
const old=execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const current=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};
const J=JSON.stringify;
function once(src,from,to,label){const s=src.indexOf(from);assert.ok(s>=0,'missing '+label);assert.equal(src.indexOf(from,s+1),-1,'twice '+label);const e=src.indexOf(to,s+from.length);assert.ok(e>s,'no end '+label);return src.slice(s,e+to.length);}
const lineOf=(src,start,label)=>once(src,'\n'+start,'\n',label).slice(1);
const fresh=()=>structuredClone(JP_DATA.teams);

// Old side: base literals, overlay, TEAM_MASTER/TEAM_COLOR loop and lookup bodies, verbatim from BASE, in their original order.
const oldParts=[
  lineOf(old,'const ABL=','ABL'),lineOf(old,'const POSN=','POSN'),once(old,'\nconst DPN=','};\n','DPN'),
  once(old,'\nconst TEAM_COLOR={','\n};\n','TEAM_COLOR'),once(old,'\nconst LV={','\n};\n','LV'),lineOf(old,'const PATHS=','PATHS'),
  lineOf(old,'const TIER_TH=','TIER_TH'),lineOf(old,'const LG_N=','LG_N'),
  '  const DATA = JP_DATA;\n',once(old,'\n  Object.assign(ABL,',"CORP:[3000,1800,900,400]});\n",'overlay'),
  lineOf(old,'  window.TEAM_MASTER =','TEAM_MASTER'),lineOf(old,'  for(const t of DATA.teams)','TEAM_COLOR loop'),
  lineOf(old,'  function teamRec(','teamRec'),lineOf(old,'  function teamDisplay(','teamDisplay'),lineOf(old,'  function listByOrg(','listByOrg'),
  once(old,'\nfunction teamNick(team){','\n}\n','teamNick'),
];
function oldWorld(){
  const ctx=vm.createContext({JP_DATA:{teams:fresh()},window:{}});
  vm.runInContext(oldParts.join('\n')+'\nglobalThis.out={ABL,POSN,DPN,LV,PATHS,TIER_TH,LG_N,TEAM_COLOR,teamRec,teamDisplay,listByOrg,teamNick,teams:DATA.teams,window};',ctx);
  return ctx.out;
}
const O=oldWorld();
const C=new LeagueCatalog({teams:fresh()});

test('LC1-tables-equal-overlay-result',()=>{
  const pairs=[['levels','LV'],['paths','PATHS'],['leagueNames','LG_N'],['tierThresholds','TIER_TH'],['teamColors','TEAM_COLOR']];
  for(const [mine,theirs] of pairs){assert.ok(Object.keys(O[theirs]).length>0,'old '+theirs+' empty');assert.equal(J(C[mine]),J(O[theirs]),mine+' differs from the overlay result (values or key order)');}
  assert.equal(J(C.teamMaster),J(O.window.TEAM_MASTER),'teamMaster');
  assert.equal(Object.keys(C.levels).length,16);
});
test('LC2-comparison-is-order-sensitive',()=>{
  const levels=JSON.parse(J(O.LV)),[first,...rest]=Object.keys(levels),swapped=Object.fromEntries([...rest,first].map(k=>[k,levels[k]]));
  assert.notEqual(J(swapped),J(C.levels),'a key-order change must be detected');
  const changed=JSON.parse(J(O.LV));changed.NPB_DEV.par++;assert.notEqual(J(changed),J(C.levels),'a value change must be detected');
});
test('LC3-lookups-match-old-bodies',()=>{
  const ids=[...O.teams.map(t=>t.teamId),null,undefined,'','UNKNOWN'],levels=[...Object.keys(O.LV),'UNKNOWN'];let n=0;
  for(const id of ids){assert.equal(J(C.teamRec(id)),J(O.teamRec(id)),'teamRec '+id);n++;
    for(const lv of levels){let a,b,ea,eb;try{a=C.teamDisplay(id,lv);}catch(e){ea=e.constructor.name;}try{b=O.teamDisplay(id,lv);}catch(e){eb=e.constructor.name;}assert.equal(a,b,'teamDisplay '+id+' '+lv);assert.equal(ea,eb,'teamDisplay throws '+id+' '+lv);n++;}}
  for(const org of ['NPB','KBO','CPBL','MLB','MiLB','IND','CORP','AMATEUR','HS','U','UNKNOWN',undefined]){assert.equal(J(C.listByOrg(org)),J(O.listByOrg(org)),'listByOrg '+org);n++;}
  const names=[...new Set([...O.teams.map(t=>t.name),...Object.keys(O.TEAM_COLOR),'',null,undefined,'X','ab'])];
  for(const name of names){assert.equal(C.teamNick(name),O.teamNick(name),'teamNick '+name);n++;}
  assert.ok(n>1500,'lookup comparisons ran: '+n);
});
test('LC4-freeze-and-identity',()=>{
  const teams=fresh(),catalog=new LeagueCatalog({teams});
  assert.ok(Object.isFrozen(catalog.teamMaster),'teamMaster frozen');assert.ok(teams.every(t=>Object.isFrozen(t)),'team records frozen in place, as before');
  for(const t of teams)assert.equal(catalog.teamRec(t.teamId),t,'teamRec returns the shared record');
  assert.equal(catalog.listByOrg('NPB').every(t=>teams.includes(t)),true,'listByOrg filters the live team list');
  for(const t of teams)if(t.color)assert.equal(catalog.teamColors[t.teamId],t.color);
});
test('LC5-leagueTables-fresh-per-call',()=>{
  const a=leagueTables(),b=leagueTables();
  for(const k of ['levels','paths','leagueNames','tierThresholds','teamColorsByName'])assert.notEqual(a[k],b[k],k+' shared between calls');
  a.levels.NPB1.par=0;a.paths.NPB.push('X');assert.equal(J(leagueTables().levels),J(C.levels));assert.equal(J(leagueTables().paths),J(C.paths));
});
test('LC6-removed-label-overlays-were-no-ops',()=>{
  // The overlay also re-assigned ABL/POSN/DPN with their own values; those lines were removed. Current game.js definitions equal the old final values.
  const ctx=vm.createContext({});
  vm.runInContext([lineOf(current,'const ABL=','ABL'),lineOf(current,'const POSN=','POSN'),once(current,'\nconst DPN=','};\n','DPN'),'globalThis.out={ABL,POSN,DPN};'].join('\n'),ctx);
  for(const k of ['ABL','POSN','DPN'])assert.equal(J(ctx.out[k]),J(O[k]),k);
});
console.log(`League catalog checks passed: ${pass}`);
