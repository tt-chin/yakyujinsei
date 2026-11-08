import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createContext,runInContext} from 'node:vm';
import {readSourceText,sourceText} from './support/source-text.mjs';
import {CareerEntry} from '../docs/src/engine/career-entry.js';

// Phase 37 (OOP plan §2pp): startJapanese and the browser-save restore callback body (after hydrateSavedState) moved
// from game.js into CareerEntry. Part 1 proves startNew/resume are the base bodies with only the listed edits (S/SEED
// through getState/setState/getSeed/setSeed, the shared enter(), history.replaceState left where each path had it).
// Part 2 runs the base bodies in a vm and the class in the main realm on the same stubs and compares every call, the
// state and seed seen by each call, the careerSession object and thrown errors.
const BASE='950795e1359500f43e8da00e5f11ddf4e47f0dc9';
const oldGame=sourceText(execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const oldLines=oldGame.split('\n');
const startIndex=oldLines.findIndex(l=>l.startsWith('  function startJapanese(){'));
const restoreIndex=oldLines.findIndex(l=>l.startsWith(' browserSave=new BrowserSaveController({'));
assert.equal(oldLines.filter(l=>l.startsWith('  function startJapanese(){')).length,1,'one old startJapanese');
assert.ok(restoreIndex>0&&oldLines[restoreIndex+1].startsWith('  const candidate=hydrateSavedState('),'old restore callback');
const oldStart=oldLines[startIndex].slice(2);
const [oldReset,oldEnter]=[oldLines[restoreIndex+2].slice(2),oldLines[restoreIndex+3].slice(2)];
assert.ok(oldReset.startsWith('const generation=')&&oldEnter.startsWith('S=candidate;')&&oldLines[restoreIndex+4]===' }});','old restore body');

// ---- Part 1: the moved bodies ----
const once=(text,from,to,label)=>{assert.equal(text.split(from).length,2,'one edit site: '+label);return text.replace(from,()=>to);};
const ENTER="$('start').style.display='none';$('board').style.display='';$('act').style.display='';navigation.reset();navigation.show();";
let startNew=oldStart;
startNew=once(startNew,'function startJapanese(){','  function startNew(){','name');
startNew=once(startNew,'SEED=sv;','setSeed(sv);','set seed');
startNew=once(startNew,"$('in-name').value,SEED,pos)","$('in-name').value,getSeed(),pos)",'name seed');
startNew=once(startNew,'S={rngState:0};seedInit(SEED);S=newState(nm,pos);','setState({rngState:0});seedInit(getSeed());setState(newState(nm,pos));','state');
startNew=once(startNew,'encodeURIComponent(SEED)','encodeURIComponent(getSeed())','url seed');
startNew=once(startNew,ENTER+'card(','enter();const S=getState();card(','enter');
let resume='  function resume(candidate){'+oldReset+oldEnter+'}';
resume=once(resume,'S=candidate;SEED=S.seed;','setState(candidate);setSeed(getState().seed);','resume state');
resume=once(resume,ENTER+'history.','enter();history.','resume enter');
resume=once(resume,'encodeURIComponent(SEED)','encodeURIComponent(getSeed())','resume url seed');
const enter='  function enter(){'+once(ENTER,'navigation.reset();','const navigation=getNavigation();navigation.reset();','enter navigation')+'}';
const module=readSourceText(new URL('../docs/src/engine/career-entry.js',import.meta.url));
const HEADER=`// キャリアの開始と再開（物件導向化 第37期）。新規開始（startNew）と保存データからの再開（resume）は同じ画面切替・ナビゲーション初期化（enter）を通る。
// 本体は旧 game.js の startJapanese と browserSave の restore callback（hydrateSavedState の後）。history.replaceState は各経路の元の位置に残す。
// S と SEED は game.js の let なので getState/setState/getSeed/setSeed で読み書きし、読むたびに取得する。careerSession は参照で渡し、その場で作り直す。
// game.js の関数はすべて遅延束縛の lambda で注入する。E2E は card・startYear・R などを差し替えるため、ここから GameView や Rng を直接呼ばない。
export class CareerEntry {
  #rules;
  constructor(deps){this.#rules=careerEntryRules(deps);}
  startNew(){this.#rules.startNew();}
  resume(candidate){this.#rules.resume(candidate);}
}

function careerEntryRules({getState,setState,getSeed,setSeed,careerSession,CareerSession,POSN,$,getNavigation,normalizeSeed,generateSeed,normalizePlayerName,seedInit,newState,escapeHTML,card,actClear,startYear}){
`;
assert.equal(module,HEADER+enter+'\n'+startNew+'\n'+resume+'\n  return {startNew,resume};\n}\n','module is the header plus the base bodies with the listed edits');

// ---- Part 2: old bodies in a vm, class in the main realm, same stubs ----
const POSN={P:'投手',C:'捕手',IF:'内野手',OF:'外野手'};
const escapeHTML=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
class CareerSession{constructor(){this.choiceGeneration=0;this.activeChoiceToken=null;this.fresh=true;}}
function env(kind,c,Klass=CareerEntry){
  const log=[];let fault=c.fault||null;
  const st={S:c.S??null,SEED:c.SEED??'initial'};let ctx=null;
  const cur=()=>kind==='old'?{S:ctx.S,SEED:ctx.SEED}:{S:st.S,SEED:st.SEED};
  const seen=label=>{const v=cur();log.push([label,JSON.stringify(v.S),v.SEED]);};
  const throwIf=name=>{if(fault===name){fault=null;throw Error('FAULT_'+name);}};
  const el=id=>({get value(){log.push(['value',id]);return c.fields?.[id]??'';},
    style:new Proxy({},{set(_,k,v){log.push(['style',id,k,v]);return true;}}),
    replaceChildren:()=>log.push(['replaceChildren',id])});
  const careerSession=Object.assign({choiceGeneration:c.generation??3,activeChoiceToken:'tok',stale:{x:1}},c.session||{});
  const navigation={reset:()=>log.push(['nav.reset']),show:()=>{log.push(['nav.show']);throwIf('show');if(c.swapOnShow){const next={year:2099,pos:'C',name:'swap',team:'swap',schoolTier:'C'};if(kind==='old')ctx.S=next;else st.S=next;}}};
  const deps={
    $:id=>{log.push(['$',id]);return el(id);},
    normalizeSeed:raw=>{log.push(['normalizeSeed',raw]);return String(raw??'').trim().slice(0,8)||null;},
    generateSeed:()=>{log.push(['generateSeed']);return 'gen00001';},
    normalizePlayerName:(raw,seed,pos)=>{log.push(['normalizePlayerName',raw,seed,pos]);return raw||'名'+seed;},
    seedInit:str=>{seen('seedInit:'+str);},
    newState:(name,pos)=>{seen('newState:'+name+':'+pos);throwIf('newState');return {year:2026,pos,name,team:c.team??'<東&西>',schoolTier:c.tier??'A',seed:cur().SEED};},
    card:(...args)=>{seen('card:'+JSON.stringify(args));throwIf('card');},
    actClear:()=>{log.push(['actClear']);},
    startYear:()=>{seen('startYear');throwIf('startYear');},
  };
  const globals={
    location:{get search(){log.push(['location.search']);return c.search??'';}},
    history:{replaceState:(...a)=>{seen('replaceState:'+JSON.stringify(a));}},
    document:{querySelector:q=>{log.push(['querySelector',q]);return c.pos?{dataset:{v:c.pos}}:null;}},
  };
  let startNew,resume;
  if(kind==='old'){
    ctx=createContext({...deps,...globals,URLSearchParams,encodeURIComponent,Object,POSN,escapeHTML,CareerSession,careerSession,navigation,S:st.S,SEED:st.SEED});
    runInContext(oldStart+'\nfunction __resume(candidate){'+oldReset+oldEnter+'}',ctx);
    startNew=()=>ctx.startJapanese();resume=candidate=>ctx.__resume(candidate);
  }else{
    const entry=new Klass({...Object.fromEntries(Object.entries(deps).map(([k,f])=>[k,(...a)=>f(...a)])),
      getState:()=>st.S,setState:s=>{st.S=s;},getSeed:()=>st.SEED,setSeed:s=>{st.SEED=s;},careerSession,CareerSession,POSN,escapeHTML,getNavigation:()=>navigation});
    const wrap=fn=>(...a)=>{const saved=Object.keys(globals).map(k=>[k,Object.getOwnPropertyDescriptor(globalThis,k)]);
      for(const [k,v] of Object.entries(globals))Object.defineProperty(globalThis,k,{value:v,configurable:true,writable:true});
      try{return fn(...a);}finally{for(const [k,d] of saved){if(d)Object.defineProperty(globalThis,k,d);else delete globalThis[k];}}};
    startNew=wrap(()=>entry.startNew());resume=wrap(candidate=>entry.resume(candidate));
  }
  return {log,careerSession,cur,startNew,resume};
}
function run(kind,c,Klass){
  const e=env(kind,c,Klass);let result;
  try{c.op==='resume'?e.resume(c.candidate):e.startNew();result=['return'];}catch(error){result=['throw',error.message];}
  const v=e.cur();
  return {log:e.log,result,S:JSON.stringify(v.S),SEED:v.SEED,session:JSON.stringify(e.careerSession),sessionProto:Object.getPrototypeOf(e.careerSession)===Object.prototype};
}
const cases=[
  {op:'start',fields:{'seed-show':'field01','in-name':''},search:'?seed=url00001',pos:'IF'},
  {op:'start',fields:{'seed-show':'','in-name':'<b>&太郎'},search:'?seed=url00002',pos:'OF',tier:'C'},
  {op:'start',fields:{'seed-show':'','in-name':''},search:'',pos:null},
  {op:'start',fields:{'seed-show':'  sp  ','in-name':'x'},search:'?seed=a&rv=2',pos:'C',S:{old:true}},
  {op:'start',fields:{'seed-show':'f1'},search:'',pos:'P',fault:'newState'},
  {op:'start',fields:{'seed-show':'f2'},search:'',pos:'P',fault:'show'},
  {op:'start',fields:{'seed-show':'f3'},search:'',pos:'P',fault:'card'},
  {op:'start',fields:{'seed-show':'f4'},search:'',pos:'P',fault:'startYear'},
  {op:'resume',candidate:{seed:'saved001',year:2031,stage:'PRO'},generation:3,S:{year:2029},SEED:'prior'},
  {op:'resume',candidate:{seed:'saved&02',year:2026},generation:0,session:{extra:[1,2],choiceGeneration:9}},
  {op:'resume',candidate:{seed:'saved003'},fault:'show'},
  {op:'resume',candidate:{seed:'saved004'},fault:'startYear'},
  {op:'start',fields:{'seed-show':'sw1'},search:'',pos:'IF',swapOnShow:true},
];
let compared=0;
for(const c of cases){
  const oldRun=run('old',c),newRun=run('new',c);
  assert.ok(oldRun.log.length>5,'old run reached its calls');
  assert.equal(JSON.stringify(newRun),JSON.stringify(oldRun),'same calls, state, seed, careerSession and result: '+JSON.stringify(c));
  compared++;
}
assert.equal(compared,cases.length);
// Reach: every fault fires on both paths, the resume path rebuilds careerSession, and the generated/field/URL seeds are all used.
const outcomes=new Set(cases.map(c=>run('old',c).result.join(':')));
for(const o of ['return','throw:FAULT_newState','throw:FAULT_show','throw:FAULT_card','throw:FAULT_startYear'])assert.ok(outcomes.has(o),'reached '+o);
const resumed=run('old',cases[9]);assert.deepEqual(JSON.parse(resumed.session),{choiceGeneration:10,activeChoiceToken:null,fresh:true},'resume rebuilds careerSession in place');
for(const [i,seed] of [[0,'field01'],[1,'url00002'],[2,'gen00001']])assert.equal(run('old',cases[i]).SEED,seed,'seed source '+i);
// The two paths keep history.replaceState where each had it: before enter() on start, after it on resume.
const order=r=>r.log.map(e=>e[0]).filter(x=>x.startsWith('replaceState')||x==='nav.show').map(x=>x.startsWith('replace')?'replace':'show');
assert.deepEqual(order(run('new',cases[0])),['replace','show']);assert.deepEqual(order(run('new',cases[8])),['show','replace']);

// Negative controls: a module that moves replaceState after enter() on start, or skips the careerSession rebuild, must differ.
async function mutant(from,to){const text=module.replace(from,to);assert.notEqual(text,module,'mutation applies');
  return (await import('data:text/javascript,'+encodeURIComponent(text))).CareerEntry;}
for(const [from,to,c] of [
  ["history.replaceState(null,'',`?seed=${encodeURIComponent(getSeed())}`);enter();const S","enter();history.replaceState(null,'',`?seed=${encodeURIComponent(getSeed())}`);const S",cases[0]],
  ['for(const k of Object.keys(careerSession))delete careerSession[k];','',cases[9]],
  ['enter();const S=getState();card(','const S=getState();enter();card(',cases[12]],
]){
  const Mutated=await mutant(from,to);
  assert.notEqual(JSON.stringify(run('new',c,Mutated)),JSON.stringify(run('old',c)),'mutation is caught: '+from.slice(0,40));
}
console.log(`career-entry.test: ${compared} old/new cases equal`);
