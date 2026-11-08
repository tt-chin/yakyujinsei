import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fmtIP,slgOf} from '../docs/src/ui/stat-format.js';
import {CareerPresenter} from '../docs/src/ui/career-presenter.js';

// OOP phase 39 (§2rr): fmtIP and slgOf moved from game.js into stat-format.js, statLine into CareerPresenter.statLine.
// game.js imports fmtIP/slgOf and keeps statLine as a wrapper. Compared here against the pre-move game.js.
const BASE='f3f05fae431a002429dbd42e430713aee2e058bc';
const old=execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const current=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const formatText=fs.readFileSync(new URL('../docs/src/ui/stat-format.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const presenterText=fs.readFileSync(new URL('../docs/src/ui/career-presenter.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};
const J=JSON.stringify;
function between(src,from,to,label){const s=src.indexOf(from);assert.ok(s>=0,'missing '+label);assert.equal(src.indexOf(from,s+1),-1,'twice '+label);const e=src.indexOf(to,s);assert.ok(e>s,'no end '+label);return src.slice(s,e);}
const oldFmtIP=between(old,'function fmtIP(ip){','function roleN(r){','fmtIP');
const oldStatLine=between(old,'function statLine(st){','/* 長打率估算','statLine');
const oldSlgOf=between(old,'/* 長打率估算','const fmtMoney=','slgOf');

test('fmtIP and slgOf bodies equal the base game.js bodies',()=>{
  const text=formatText.slice(formatText.indexOf('export function fmtIP('));
  assert.equal(text.split('export ').length,3,'two exports');
  assert.equal(text.replaceAll('export function ','function '),oldFmtIP+oldSlgOf);
});

test('CareerPresenter.statLine equals the base game.js statLine after restoring the state read',()=>{
  const head="  statLine(st){const S=this.#getState(),{fmtIP,roleN}=this.#deps;\n";
  const method=between(presenterText,head,'\n  player(){','statLine method');
  assert.equal(('function statLine(st){\n'+method.slice(head.length)).replace(/^  /gm,'')+'\n',oldStatLine);
  assert.equal(presenterText.split("import {slgOf} from './stat-format.js';\n").length,2,'presenter imports slgOf');
});

test('game.js imports the formatters and keeps statLine as a wrapper',()=>{
  for(const line of ["\nimport { fmtIP, slgOf } from '../ui/stat-format.js';\n",'\nfunction statLine(st){return careerPresenter.statLine(st);}\n'])assert.equal(current.split(line).length,2,line.trim());
  for(const gone of ['function fmtIP(','function slgOf(','const outs=Math.round(frac*3)','const tb=singles'])assert.ok(!current.includes(gone),'moved out of game.js: '+gone);
});

const oldWorld=vm.createContext({});vm.runInContext(oldFmtIP+oldSlgOf+'function roleN(r){ return {SP:\'先発\',MR:\'中継ぎ\',CL:\'抑え\'}[r]||\'—\'; }\n'+oldStatLine,oldWorld);
assert.equal(between(old,'function roleN(r){','\n','roleN'),"function roleN(r){ return {SP:'先発',MR:'中継ぎ',CL:'抑え'}[r]||'—'; }",'roleN stub is the base roleN');
test('fmtIP and slgOf return the old values',()=>{
  for(const ip of [null,undefined,0,0.1,1/3,2/3,0.99,5,120.33,120.67,7.999,-1])assert.equal(fmtIP(ip),oldWorld.fmtIP(ip),'fmtIP '+ip);
  for(const st of [{AB:0},{AB:10,H:3,HR:1},{AB:500,H:150,HR:30},{AB:4,H:4,HR:0},{AB:3,H:1,HR:2}])assert.equal(slgOf(st),oldWorld.slgOf(st),'slgOf '+J(st));
});

test('statLine returns the old text for pitchers and batters',()=>{
  let state;const presenter=new CareerPresenter({getState:()=>state,labels:{ABL:{},POS_AB:{},POSN:{},DPN:{}},TEAM_COLOR:{},fmtMoney:x=>x,fmtIP,displayTrait:k=>k,teamNick:t=>t,roleN:r=>oldWorld.roleN(r),playerType:()=>'',ovr:()=>0});
  const pitch={G:30,IP:180.67,W:12,L:7,SO:170,BB:40,era:2.95,WHIP:1.05,SV:0,HLD:0,H:150,ER:59};
  const bat={G:140,PA:600,AB:520,H:160,HR:25,RBI:90,BB:70,SB:12,avg:.308};
  const cases=[['P',{role:'SP'},pitch],['P',{role:'CL'},{...pitch,SV:35}],['P',{role:'CL'},pitch],['P',{role:'MR'},{...pitch,HLD:20}],['P',{role:'MR'},pitch],['P',{},pitch],
    ['IF',{},bat],['IF',{},{...bat,DEF:5}],['IF',{},{...bat,DEF:-3}],['IF',{},{...bat,DEF:0}],['OF',{},{...bat,PA:0,AB:0,H:0,avg:0}],['OF',{},{...bat,AB:0}]];
  for(const [pos,extra,st] of cases){state={pos,...extra};oldWorld.S=state;const st2=structuredClone(st);
    assert.equal(presenter.statLine(st),vm.runInContext('statLine',oldWorld)(st2),pos+' '+J(extra));}
});

console.log(pass+' stat-format checks PASS');
