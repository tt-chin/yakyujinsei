import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
const current=fs.readFileSync('docs/src/engine/game.js','utf8');
const baseline=execFileSync('git',['show','6e06b1b64abc5f8be1a1a42d68e44c4d1944a16d:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
// Phase 4-A deleted the base definition; current sources declare the overlay version, the baseline assigns it.
function active(source){return source.match(/^  (?:function daibaFarewell\(cont\)|daibaFarewell = function\(cont\)).*$/m)?.[0]??assert.fail('missing active definition');}
function run(source,state){
  const cards=[],ctx=vm.createContext({S:structuredClone(state),card:(...v)=>cards.push(v),calls:0,R:()=>assert.fail('farewell consumed main RNG')});
  vm.runInContext(source+';daibaFarewell(()=>calls++);daibaFarewell(()=>calls++);',ctx);
  return {state:JSON.parse(JSON.stringify(ctx.S)),calls:ctx.calls,cards};
}
let cases=0;
const now=active(current),old=active(baseline);
for(const pos of ['P','IF'])for(const org of ['NPB','MLB','MiLB','KBO','CPBL','IND','UNKNOWN',null])for(const stats of [undefined,{}, {NPB:{yr:0}},{NPB:{yr:1}},{CPBL:{yr:5}},{NPB:{yr:2},CPBL:{yr:5}}])for(const stage of ['PRO','IND'])for(const already of [false,true]){
  const state={pos,org,stats,stage,_daiba:already,rngState:12345,pool:8,traits:{glass:true},honors:['2030 NPB新人王'],careerEarnings:98765,ct:{salary:900},done:false};
  const expected=stage==='PRO'&&!!stats?.NPB?.yr&&['MLB','MiLB','KBO','CPBL'].includes(org)&&!already;
  const results=[run(now,state)];
  for(const result of results){
    assert.equal(result.calls,2,'continuation once per call');
    assert.equal(result.cards.length,expected?1:0,'eligibility and once-only');
    assert.deepEqual(result.state,JSON.parse(JSON.stringify({...state,_daiba:already||expected})),'only existing once flag may change');
    if(expected){assert.equal(result.cards[0][1],'日本球界への別れ');assert.match(result.cards[0][2],/日本プロ野球.*日本のファン/);assert.doesNotMatch(result.cards[0][2],/台湾|台北/);}
  }
  const oldResult=run(old,state),oldExpected=stage==='PRO'&&!!stats?.CPBL?.yr&&org!=='CPBL'&&!already;
  assert.equal(oldResult.cards.length,oldExpected?1:0,'baseline original gate');
  const strip=s=>{const out=structuredClone(s);delete out._daiba;return out;};
  assert.deepEqual(strip(results[0].state),strip(oldResult.state),'old/current all other S fields identical');
  cases++;
}
console.log(`${cases} native production-function fixtures PASS: NPB history/overseas/stage/once-only/continuation, exact other S, zero RNG; baseline eligibility differences approved.`);
