import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {TraitResultCard} from '../docs/src/ui/trait-result-card.js';
import {TRAIT_LABELS,TRAIT_TEXT} from '../docs/src/engine/trait-policy.js';
import {EVENT_TRAIT_TEXT} from '../docs/src/engine/event-policy.js';

// OOP plan §2gg: decorate() must behave exactly like game.js traitResultMarkup of 9e6129fbc659abba28478b6f45af1b486e7a8c6a.
const old=execFileSync('git',['show','9e6129fbc659abba28478b6f45af1b486e7a8c6a:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const start=old.indexOf('\nfunction traitResultMarkup('),end=old.indexOf('\nfunction card(');
assert.ok(start>0&&end>start);const oldBody=old.slice(start,end);

// Argument-revealing stand-in, identical for both sides, so a miswired displayTrait changes the output.
const displayTrait=key=>'D:'+key;
const prefixes=['隠し特性解放：','隠し特性解放:','隠し称号：','隠し称号:','隠しタイトル：','隠しタイトル:'];
const keys=[...new Set([...Object.keys(TRAIT_LABELS),...Object.keys(TRAIT_TEXT),...Object.keys(EVENT_TRAIT_TEXT)])];
const textOf=key=>EVENT_TRAIT_TEXT[key]||TRAIT_TEXT[key]||'';
const htmlVariants=key=>[textOf(key),'','本文','<b>'+textOf(key)+'</b>','本文<br>'+textOf(key),'追加効果の説明','記念称号の説明','次回 最低2点 故障リスク','<i>次回</i>最低2点と故障リスク','最低2点 故障リスク','次回 故障リスク','次回 最低2点',textOf(key).slice(0,3)+'<b></b>'+textOf(key).slice(3),undefined];
const stateVariants=key=>[
  {name:'owned',traits:{[key]:true,other:true,off:false}},
  {name:'not owned',traits:{[key]:false,other:true}},
  {name:'no traits',traits:undefined},
];
const shownVariants=key=>[
  {name:'absent',shown:null},
  {name:'has key',shown:[key,'other']},
  {name:'without key',shown:['other']},
];
const cases=[];
const add=(id,title,html,state,shown)=>cases.push({id,title,html,state,shown});
for(const [title,key] of [['ゴムゴムの腕、ついに限界','rubber'],['結果で黙らせる','cancer'],['一芸特化を返上','onetool'],['イップス克服','yips']])
  for(const shown of [null,[key]])add('lost '+key,title,'本文',{traits:{[key]:true}},shown);
for(const title of ['シーズン終了','',null,undefined,'隠し特性解放','前置き隠し特性解放：'+displayTrait('iron')])add('not hidden',title,'本文',{traits:{iron:true}},null);
for(const prefix of prefixes)for(const name of ['存在しない特性',''])add('unknown name',prefix+name,'本文',{traits:{iron:true}},null);
for(const prefix of prefixes)for(const owned of [true,false])for(const shown of [null,['franchise']])add('神カード',prefix+'神カード',TRAIT_TEXT.franchise||'本文',{traits:{franchise:owned}},shown);
for(const key of keys)for(const prefix of prefixes)for(const name of [displayTrait(key),TRAIT_LABELS[key]])if(name)for(const html of htmlVariants(key))for(const state of stateVariants(key))for(const shown of shownVariants(key))
  add(`${key}/${prefix}/${name}/${state.name}/${shown.name}`,prefix+name,html,{traits:state.traits},shown.shown);

// The Set in the WeakMap is compared by content, plus whether the entry is the one that was already there.
function observe(call,{title,html,state,shown}){
  const S=structuredClone(state),node={dataset:{}},traitPresentation=new WeakMap(),before=shown?new Set(shown):null;
  if(before)traitPresentation.set(S,before);
  const snapshot=JSON.stringify(S);
  const result=call({S,node,traitPresentation,title,html});
  const entry=traitPresentation.get(S);
  assert.equal(JSON.stringify(S),snapshot,'S is not written');
  return JSON.stringify({title:result.title,html:result.html===undefined?'<undefined>':result.html,keys:Object.keys(result),dataset:node.dataset,shown:entry?[...entry].sort():null,same:entry===before});
}
const context=vm.createContext({TRAIT_LABELS,TRAIT_TEXT,EVENT_TRAIT_TEXT,displayTrait});vm.runInContext(oldBody,context);
const oldCall=({S,node,traitPresentation,title,html})=>{Object.assign(context,{S,traitPresentation});return context.traitResultMarkup(node,title,html);};
const newCall=({S,node,traitPresentation,title,html})=>new TraitResultCard({getState:()=>S,traitPresentation,displayTrait}).decorate(node,title,html);

const branches=new Set();let compared=0;
for(const c of cases){
  const expected=observe(oldCall,c),actual=observe(newCall,c);
  assert.equal(actual,expected,c.id);compared++;
  const e=JSON.parse(expected);
  branches.add(e.dataset.traitResult?.startsWith('removed:')?'removed':e.dataset.traitResult?'unlocked':e.html===''&&e.title!==c.title?'silent':'unchanged');
}
assert.deepEqual([...branches].sort(),['removed','silent','unchanged','unlocked'],'every outcome is reached');
assert.ok(compared>1000,'case count '+compared);
console.log('PASS decorate equals 9e6129f traitResultMarkup: '+compared+' cases');

let S={traits:{iron:true}};const traitPresentation=new WeakMap(),view=new TraitResultCard({getState:()=>S,traitPresentation,displayTrait});
view.decorate({dataset:{}},'隠し特性解放：'+displayTrait('iron'),'');const first=S;
S={traits:{iron:false}};view.decorate({dataset:{}},'隠し特性解放：'+displayTrait('iron'),'');
assert.deepEqual([...traitPresentation.get(first)],['iron']);assert.deepEqual([...traitPresentation.get(S)],[]);
console.log('PASS state is read on every call (new career after S is reassigned)');
