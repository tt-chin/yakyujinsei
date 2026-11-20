// OOP plan §2uu phase 43: PlayerProfile vs the former game.js bodies (159dbf2), and the game.js wrapper delegation.
// ovr/playerType/toolGap/abCost equivalence over the full ability grid stays in ability-allocation.test.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {productionFunction} from './retirement-hof-test-support.mjs';
import * as abilityPolicy from '../docs/src/engine/ability-evaluation-policy.js';
import {PlayerProfile} from '../docs/src/engine/player-profile.js';

const BASE='159dbf2b293c6087df6a8f3713a19e6e61ad4a74';
const old=execFileSync('git',['show',BASE+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:30e6});
const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');

// 1. Former bodies (one vm, inputs swapped per case) vs PlayerProfile on the same state.
const oldContext=vm.createContext({...abilityPolicy,S:null});
vm.runInContext(['careerAllStars','pitcherRole','isSP'].map(n=>productionFunction(n,old)).join('\n')+
  '\nconst run=f=>{try{return f();}catch(e){return "E:"+e.constructor.name+":"+e.message;}};function cell(){const before=JSON.stringify(S),r={allStars:run(careerAllStars),role:run(pitcherRole),sp:run(isSP)};return JSON.stringify({r,unchanged:before===JSON.stringify(S)});}',oldContext);
const run=f=>{try{return f();}catch(e){return 'E:'+e.constructor.name+':'+e.message;}};
const newCell=state=>{const box={S:structuredClone(state)},before=JSON.stringify(box.S),p=new PlayerProfile({getState:()=>box.S});
  const r={allStars:run(()=>p.allStars()),role:run(()=>p.pitcherRole()),sp:run(()=>p.isStarter())};return JSON.stringify({r,unchanged:before===JSON.stringify(box.S)});};
const oldCell=state=>{oldContext.S=structuredClone(state);return oldContext.cell();};
const statsOf=[undefined,{},{NPB:{AS:2}},{CPBL:{AS:1},KBO:{AS:0},NPB:{AS:3},MLB:{AS:4}},{MLB:{}},{KBO:{AS:5},Other:{AS:9}},{NPB:null}];
const roles=[undefined,null,'SP','MR','CL'],ds=[undefined,-99,0,0.5,1,2,3,4],stas=[40,51,52,60];
let cells=0;const seenRoles=new Set();
for(const stats of statsOf)for(const sta of stas)for(const role of roles)for(const prevD of ds)for(const lastD of [undefined,0,1,3]){
  const state={ab:{sta},stats:stats===undefined?{}:stats,role,prevD,lastD};if(stats===undefined)delete state.stats;
  const A=oldCell(state);assert.equal(newCell(state),A,`player profile equivalence ${JSON.stringify(state)}`);
  const a=JSON.parse(A);assert.ok(a.unchanged,'state unchanged');seenRoles.add(a.r.role);cells++;}
assert.equal(cells,statsOf.length*stas.length*roles.length*ds.length*4,'player profile cell count');
assert.deepEqual([...seenRoles].sort(),['CL','MR','SP'],'every pitcherRole branch reached');

// 2. game.js keeps one-line wrappers that delegate to the matching PlayerProfile method (behavior, via a spy).
const calls=[];const spy=new Proxy({},{get:(_,method)=>(...args)=>{calls.push([method,...args]);return 'R:'+String(method);}});
const wrapperContext=vm.createContext({playerProfile:spy});
const wrappers={careerAllStars:'allStars',toolGap:'toolGap',pitcherRole:'pitcherRole',isSP:'isStarter',ovr:'overall',playerType:'type',abCost:'stepCost'};
vm.runInContext(Object.keys(wrappers).map(n=>productionFunction(n,game).split('\n')[0]).join('\n'),wrapperContext);
for(const [name,method] of Object.entries(wrappers)){calls.length=0;const result=vm.runInContext(name==='abCost'?`abCost('ctl')`:`${name}()`,wrapperContext);
  assert.equal(result,'R:'+method,name+' returns the method result');assert.equal(JSON.stringify(calls),JSON.stringify([[method,...(name==='abCost'?['ctl']:[])]]),name+' delegates once to '+method);}
console.log(`PlayerProfile checks passed (${cells} cells, ${Object.keys(wrappers).length} wrappers).`);
