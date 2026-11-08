import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {CareerTraits} from '../docs/src/engine/career-traits.js';
import {TRAIT_LABELS,traitLabel,recordFirstTeamSeason,goldclothEligible} from '../docs/src/engine/trait-policy.js';

// OOP phase 39 (§2rr): traitCard, removeTrait, displayTrait, traitNames and checkGoldclothSeason moved from game.js into
// CareerTraits (unlock, remove, label, names, checkGoldclothSeason). game.js keeps the five names as wrappers; the class
// reaches card/board/teamNick and the game.js traitCard/displayTrait through injected lambdas.
const BASE='f3f05fae431a002429dbd42e430713aee2e058bc';
const old=execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const current=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
const moduleText=fs.readFileSync(new URL('../docs/src/engine/career-traits.js',import.meta.url),'utf8').replace(/\r\n/g,'\n');
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};
const J=JSON.stringify;
function between(src,from,to,label){const s=src.indexOf(from);assert.ok(s>=0,'missing '+label);assert.equal(src.indexOf(from,s+1),-1,'twice '+label);const e=src.indexOf(to,s);assert.ok(e>s,'no end '+label);return src.slice(s,e);}
const oldBodies=between(old,'function traitCard(key,name,desc,tone){','/* 一芸特化','traitCard..removeTrait')+between(old,'function displayTrait(key){','const careerPresenter=new CareerPresenter(','displayTrait..checkGoldclothSeason');

test('moved bodies equal the base game.js bodies after removing the state reads and renaming back',()=>{
  let text=between(moduleText,'  function unlock(','\n  return {unlock,remove,label,names,checkGoldclothSeason};','rule bodies');
  for(const [read,count] of [['\n    const S=getState();',1],[' const S=getState();',2],['const S=getState();',1]]){assert.equal(text.split(read).length,count+1,'state reads '+J(read));text=text.replaceAll(read,'');}
  for(const [from,to] of [['unlock','traitCard'],['remove','removeTrait'],['label','displayTrait'],['names','traitNames']]){const head='  function '+from+'(';assert.equal(text.split(head).length,2,head);text=text.replace(head,'  function '+to+'(');}
  assert.equal(text.replace(/^  /gm,'')+'\n',oldBodies);
});

test('game.js keeps the five names as one-line wrappers and builds CareerTraits once',()=>{
  for(const line of ['\nfunction traitCard(key,name,desc,tone){careerTraits.unlock(key,name,desc,tone);}\nfunction removeTrait(key,label){careerTraits.remove(key,label);}\n',
    '\nfunction displayTrait(key){return careerTraits.label(key);}\nfunction traitNames(){return careerTraits.names();}\nfunction checkGoldclothSeason(){careerTraits.checkGoldclothSeason();}\n',
    '\nconst careerTraits=new CareerTraits({getState:()=>S,traitPresentation,card:(cls,title,html)=>card(cls,title,html),board:p=>board(p),teamNick:team=>teamNick(team),traitCard:(key,name,desc,tone)=>traitCard(key,name,desc,tone),displayTrait:key=>displayTrait(key)});\n'])
    assert.equal(current.split(line).length,2,line.trim().slice(0,60));
  for(const gone of ['traitPresentation.get(S)?.delete(key)','return traitLabel(key,S,teamNick)','recordFirstTeamSeason(S)','隠し特性解放：'])assert.ok(!current.includes(gone),'moved out of game.js: '+gone);
});

// Old side: the base bodies in a vm whose free names are the same stubs the new side receives.
function world(kind,state){
  const log=[],presentation=new WeakMap(),S={value:state};presentation.set(state,new Set(['rubber','mrteam']));
  const teamNick=team=>{log.push(['teamNick',team]);return 'N:'+team;};
  const card=(cls,title,html)=>log.push(['card',cls,title,html]),board=p=>log.push(['board',p]);
  if(kind==='old'){
    const ctx=vm.createContext({S:state,card,board,teamNick,traitPresentation:presentation,TRAIT_LABELS,traitLabel,recordFirstTeamSeason,goldclothEligible});
    vm.runInContext(oldBodies,ctx);
    return {log,presentation,state:()=>ctx.S,call:(m,...a)=>ctx[{unlock:'traitCard',remove:'removeTrait',label:'displayTrait',names:'traitNames',checkGoldclothSeason:'checkGoldclothSeason'}[m]](...a)};
  }
  let traits;
  const wrapper={traitCard:(key,name,desc,tone)=>traits.unlock(key,name,desc,tone),displayTrait:key=>traits.label(key)};
  traits=new CareerTraits({getState:()=>S.value,traitPresentation:presentation,card,board,teamNick,traitCard:(...a)=>wrapper.traitCard(...a),displayTrait:k=>wrapper.displayTrait(k)});
  return {log,presentation,state:()=>S.value,call:(m,...a)=>traits[m](...a)};
}
const base=v=>({year:2035,lv:'NPB1',orgTeamId:'NPB_CL_HAN',traits:{rubber:true,mrteam:false},removed:['既存'],mrTeamName:'阪神',legendLeague:'NPB',firstTeamSeasons:{},firstTeamYearsByTeam:{NPB_CL_HAN:9},...v});
const scenarios=[
  ['unlock default tone',base(),[['unlock','ironman','鉄人','説明']]],
  ['unlock explicit tone',base(),[['unlock','clutch','勝負強さ','説明','good']]],
  ['remove active trait',base(),[['remove','rubber','ゴムゴムの腕']]],
  ['remove active, label already removed',base({removed:['ゴムゴムの腕']}),[['remove','rubber','ゴムゴムの腕']]],
  ['remove inactive trait',base(),[['remove','mrteam','ミスター']]],
  ['labels',base(),[['label','mrteam'],['label','legend'],['label','rubber'],['label','unknown-key']]],
  ['names',base(),[['names']]],
  ['goldcloth reaches ten years',base(),[['checkGoldclothSeason']]],
  ['goldcloth same season twice',base(),[['checkGoldclothSeason'],['checkGoldclothSeason']]],
  ['goldcloth below ten years',base({firstTeamYearsByTeam:{NPB_CL_HAN:3}}),[['checkGoldclothSeason']]],
  ['goldcloth not first team',base({lv:'NPB2'}),[['checkGoldclothSeason']]],
  ['goldcloth already held',base({traits:{goldcloth:true}}),[['checkGoldclothSeason']]],
];
let goldUnlocked=0;
for(const [id,state,calls] of scenarios)test('old/new equal: '+id,()=>{
  const runs=['old','new'].map(kind=>{const w=world(kind,structuredClone(state));const results=calls.map(([m,...a])=>w.call(m,...a));return {results:J(results),log:J(w.log),state:J(w.state()),presentation:J([...w.presentation.get(w.state())])};});
  assert.deepEqual(runs[1],runs[0]);
  if(id==='goldcloth reaches ten years'){goldUnlocked=JSON.parse(runs[0].log).filter(x=>x[0]==='card').length;assert.equal(goldUnlocked,1,'scenario unlocks goldcloth');}
});

test('getState is read on every call (a reassigned state is seen at once)',()=>{
  const first=base(),second=base({traits:{}});const holder={value:first},log=[];
  const traits=new CareerTraits({getState:()=>holder.value,traitPresentation:new WeakMap(),card:(...a)=>log.push(a),board:()=>{},teamNick:t=>t,traitCard:(...a)=>traits.unlock(...a),displayTrait:k=>traits.label(k)});
  traits.unlock('ironman','鉄人','x');holder.value=second;traits.unlock('clutch','勝負強さ','y');
  assert.equal(first.traits.ironman,true);assert.equal(first.traits.clutch,undefined);assert.equal(second.traits.clutch,true);assert.equal(second.traits.ironman,undefined);
});

test('internal calls go through the injected traitCard/displayTrait lambdas',()=>{
  const hits=[];let traits;
  traits=new CareerTraits({getState:()=>base(),traitPresentation:new WeakMap(),card:()=>{},board:()=>{},teamNick:t=>t,
    traitCard:(key,name,desc,tone)=>hits.push(['traitCard',key,name]),displayTrait:key=>{hits.push(['displayTrait',key]);return 'D:'+key;}});
  traits.checkGoldclothSeason();
  assert.deepEqual(hits,[['displayTrait','goldcloth'],['traitCard','goldcloth','D:goldcloth']]);
  hits.length=0;const names=traits.names();
  assert.deepEqual(Object.keys(names),Object.keys(TRAIT_LABELS));assert.equal(hits.length,Object.keys(TRAIT_LABELS).length);assert.ok(hits.every(([n,k])=>n==='displayTrait'&&names[k]==='D:'+k));
});

test('label passes teamNick through the injected lambda',()=>{
  const nicks=[];const traits=new CareerTraits({getState:()=>base(),traitPresentation:new WeakMap(),card:()=>{},board:()=>{},teamNick:t=>{nicks.push(t);return 'N';},traitCard:()=>{},displayTrait:()=>{}});
  assert.equal(traits.label('mrteam'),traitLabel('mrteam',base(),()=> 'N'));assert.deepEqual(nicks,['阪神']);
});

console.log(pass+' career-traits checks PASS');
