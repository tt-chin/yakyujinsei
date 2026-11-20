// OOP plan §2uu phase 43: JerseyFlow vs the former game.js bodies (159dbf2), wrapper delegation, and live-state checks
// in the deferred dialog callbacks (J4). Natural careers, the dialog/menu UI and legacy saves stay in jersey-e2e.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {productionFunction} from './retirement-hof-test-support.mjs';
import * as jerseyPolicy from '../docs/src/engine/jersey-policy.js';
import {JerseyFlow} from '../docs/src/engine/jersey-flow.js';

const BASE='159dbf2b293c6087df6a8f3713a19e6e61ad4a74';
const old=execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:30e6});
const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const teamMaster={a:{name:'東京'},b:{name:'東京ヤング'},c:{name:'大阪'},e:{name:'Seoul'},d:{name:'Seoul Bears'}}; // Seoul before Seoul Bears: the longest-name sort is observable
const teamRec=id=>id==='a'?{name:'東京'}:id==='z'?{}:undefined;
const pro=(over={})=>({stage:'PRO',org:'NPB',lv:'NPB1',orgTeamId:'NPB-YB',year:2030,pos:'IF',log:[],...over});

// 1. teamName / unknownTeam / label vs the former bodies.
const oldContext=vm.createContext({...jerseyPolicy,teamRec,leagueCatalog:{teamMaster},S:null});
vm.runInContext(['jerseyTeamName','jerseyUnknownTeam','jerseyLabelText'].map(n=>productionFunction(n,old)).join('\n'),oldContext);
const box={S:null},flow=new JerseyFlow({getState:()=>box.S,teamRec,teamMaster:()=>teamMaster});
let cells=0;
for(const id of ['a','z','missing',0,null])assert.equal(flow.teamName(id),vm.runInContext('jerseyTeamName(id)',Object.assign(oldContext,{id}))),cells++;
for(const tm of ['東京','東京ヤング','東京ヤング 二軍','東京 一軍','大阪→東京ヤング','A→東京 二軍','不明球団','','X→','Seoul Bears 2軍','東京ヤングス',0,null,undefined])
  assert.equal(flow.unknownTeam(tm),vm.runInContext('jerseyUnknownTeam(tm)',Object.assign(oldContext,{tm})),String(tm)),cells++;
const labelStates=[pro(),pro({jerseyHistory:[{teamId:'NPB-YB',number:'18',year:2030}]}),pro({jerseyHistory:[{teamId:'NPB-YB',number:'00',year:2030}],done:true}),pro({jerseyHistory:[{teamId:'KBO-X',number:'7',year:2029}]}),{stage:'AMA',year:2030,log:[]}];
for(const state of labelStates){box.S=state;oldContext.S=state;assert.equal(flow.label(),vm.runInContext('jerseyLabelText()',oldContext),JSON.stringify(state));cells++;}
assert.equal(cells,5+14+labelStates.length,'jersey cell count');

// 2. game.js keeps one-line wrappers that delegate to the matching JerseyFlow method (behavior, via a spy).
const calls=[];const spy=new Proxy({},{get:(_,method)=>(...args)=>{calls.push([method,...args]);return 'R:'+String(method);}});
const wrapperContext=vm.createContext({jerseyFlow:spy});
const wrappers={jerseyStep:['step',''],jerseyTeamName:['teamName','T1'],jerseyUnknownTeam:['unknownTeam','L1'],jerseyLabelText:['label','']};
vm.runInContext(Object.keys(wrappers).map(n=>productionFunction(n,game).split('\n')[0]).join('\n'),wrapperContext);
for(const [name,[method,arg]] of Object.entries(wrappers)){calls.length=0;const result=vm.runInContext(`${name}(${arg?JSON.stringify(arg):''})`,wrapperContext);
  assert.equal(result,'R:'+method,name+' returns the method result');assert.equal(JSON.stringify(calls),JSON.stringify([[method,...(arg?[arg]:[])]]),name+' delegates once to '+method);}

// 3. step / promptEntry / openChange with recording deps.
function harness(state){
  const h={state,log:[],prompts:[],pending:null,buttons:{}};
  h.flow=new JerseyFlow({getState:()=>h.state,nextStep:()=>h.log.push('next'),board:p=>h.log.push('board:'+p),
    choose:(title,opts)=>{h.log.push('choose');h.prompts.push({title,opts});},
    chooseNumber:options=>{h.log.push('dialog:'+options.title);return new Promise(r=>{h.pending=r;});},
    byId:id=>id==='act'?{querySelector:()=>({click:()=>{h.log.push('click');h.prompts.at(-1).opts[0].f();},focus:()=>h.log.push('focus')})}:(h.buttons[id]??={}),
    setBoardNumber:text=>h.log.push('number:'+text),teamRec:()=>({name:'横浜'}),teamMaster:()=>teamMaster});
  return h;
}
const tick=()=>new Promise(r=>setTimeout(r,0));
{const h=harness(pro({jerseyHistory:[{teamId:'NPB-YB',number:'6',year:2029}]}));h.flow.step();
  assert.deepEqual(h.log,['next'],'no pending entry: step only advances');}
{const h=harness(pro());h.flow.step();
  assert.deepEqual(h.log,['board:0','choose'],'pending entry: board, then the prompt');assert.equal(h.prompts[0].opts.length,2);
  h.prompts[0].opts[0].f();assert.deepEqual(h.log.slice(2),['next']);assert.equal(jerseyPolicy.currentJerseyNumber(h.state),'6','default IF number recorded');}
// J4: the dialog callback compares the live state; a swapped state must neither prompt again nor write.
for(const swap of [false,true]){
  const h=harness(pro());h.flow.step();h.prompts[0].opts[1].f();assert.equal(h.log.at(-1),'dialog:背番号を選ぶ');
  const original=h.state;if(swap)h.state=pro({orgTeamId:'NPB-OTHER'});h.pending('7');await tick();
  if(swap){assert.equal(h.prompts.length,1,'no re-prompt after the state changed');assert.equal(original.jerseyHistory,undefined,'no write after the state changed');}
  else{assert.equal(h.prompts.length,2,'accept re-renders the prompt');assert.deepEqual(h.log.slice(-3),['choose','click','next']);assert.equal(jerseyPolicy.currentJerseyNumber(original),'7');}
}
for(const swap of [false,true]){
  const h=harness(pro({jerseyHistory:[{teamId:'NPB-YB',number:'6',year:2030}]}));h.flow.openChange();assert.deepEqual(h.log,['dialog:背番号の変更']);
  const original=h.state;if(swap)h.state=pro();h.pending('9');await tick();
  if(swap){assert.equal(original.jerseyHistory.length,1,'no change after the state changed');assert.deepEqual(h.log,['dialog:背番号の変更']);}
  else{assert.equal(jerseyPolicy.currentJerseyNumber(original),'9');assert.deepEqual(h.log.slice(1),['number:#9']);assert.equal(h.buttons['board-number'].disabled,!jerseyPolicy.canChangeJersey(original));}
}
console.log(`JerseyFlow checks passed (${cells} cells, ${Object.keys(wrappers).length} wrappers).`);
