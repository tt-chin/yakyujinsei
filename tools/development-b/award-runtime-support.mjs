import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {productionFunction} from '../../tests/retirement-hof-test-support.mjs';
import * as tx from '../../docs/src/engine/award-transaction-policy.js';
import * as identity from '../../docs/src/engine/award-identity-policy.js';
import * as consumers from '../../docs/src/engine/award-consumer-policy.js';
import * as traits from '../../docs/src/engine/trait-policy.js';
import {pitcherAwardCandidate} from '../../docs/src/engine/pitcher-award-policy.js';
import {decideIndependentAward} from '../../docs/src/engine/award-rng-policy.js';
import {calculateMarketAwardAdjustment} from '../../docs/src/engine/salary-evaluation-policy.js';
import {Rng} from '../../docs/src/engine/rng.js';
import {SeasonAwards} from '../../docs/src/engine/season-awards.js';
import {salaryAwardBonus} from '../../docs/src/engine/salary-promotion-policy.js';
import {evaluateIncentive} from '../../docs/src/engine/incentive-policy.js';
import {honorScoreFor} from '../../docs/src/engine/hall-of-fame-policy.js';
const baseline='efd4710c4c5c366ff3aba69c59180031c82ff18a';
const oldSource=execFileSync('git',['show',baseline+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
const source=fs.readFileSync('docs/src/engine/game.js','utf8');
const oldTraitSource=execFileSync('git',['show',baseline+':docs/src/engine/trait-policy.js'],{encoding:'utf8'});
const oldTraits=await import('data:text/javascript;base64,'+Buffer.from(oldTraitSource).toString('base64'));
const labels={NPB:'NPB',KBO:'KBO',CPBL:'台湾プロ野球',MLB:'メジャーリーグ'};
const stat={d:15,G:30,W:20,L:0,IP:200,SO:300,era:1,SV:40,HLD:35,ER:22,H:100,BB:20};
const state=(league='NPB',role='SP',seed='d2-native-'+league)=>({seed,year:2039,age:36,pos:'P',role,
  lv:league==='MLB'?'MLB':league+'1',org:league,seasonFactor:1,orgTeamId:'fixture',stats:{[league]:{yr:2,AS:0}},
  honors:['2038 NPB新人王'],traits:{glass:true,phoenix:false,yips:true},removed:[],pool:7});
function harness(src,s,st,{slotFault=false,effectFault=false,newFault=false,renderFault=false,historyFault=false}={}){
  const cards=[],rng=[];let slotOnce=slotFault,effectOnce=effectFault,newOnce=newFault,renderOnce=renderFault;
  const c=vm.createContext({S:structuredClone(s),SEED:s.seed,structuredClone,TextEncoder,Rng,SeasonAwards,...identity,...consumers,...tx,...traits,
    traitPresentation:new WeakMap(),teamNick:x=>x,board:()=>{},recordR:x=>rng.push(structuredClone(x)),
    captureAwardSlot:(...a)=>tx.captureAwardSlot(...a,slotOnce?()=>{slotOnce=false;throw Error('AFTER_SLOT');}:undefined),
    prepareD2AwardDecisions:(...a)=>tx.prepareD2AwardDecisions(...a,newOnce?()=>{newOnce=false;throw Error('AFTER_NEW_DECISIONS');}:undefined),
    commitAwardReceipt:(...a)=>tx.commitAwardReceipt(...a,effectOnce?path=>{if(effectOnce===true||path.join('.')===effectOnce){effectOnce=false;throw Error('AFTER_EFFECT_WRITE');}}:undefined),
    completeAwardDecisions:(...a)=>tx.completeAwardDecisions(...a,historyFault?()=>{historyFault=false;throw Error('AFTER_HISTORY_WRITE');}:undefined),
    card:(...a)=>{if(renderOnce&&a[1]==='年間賞'){renderOnce=false;throw Error('AFTER_EFFECT_RENDER');}cards.push(a);}});
  const levels=src.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1];
  const functions=['awards','renderCheckpointCard',...(src.includes('function collectLegacyAwardPlan(')?['collectLegacyAwardPlan']:[]),'isSP','removeTrait','fnv1a32'].map(n=>productionFunction(n,src)).join('\n');
  vm.runInContext(`const LV=${levels};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let _s=0,seedInit,R;const careerRng=new Rng(()=>S,fnv1a32);
    ${src.match(/seedInit = function\(seed\)\{[^\n]+/)[0]}
    ${src.match(/R = function\(\)\{[^\n]+/)[0]}
    const originalR=R;R=()=>{const before=S.rngState,value=originalR();recordR({before,after:S.rngState,value});return value;};
    ${functions};seedInit(S.seed);`,c);
  c.bucket=s.org;c.st=structuredClone(st);
  return {c,cards,rng,run:()=>vm.runInContext('awards(bucket,st)',c),snapshot:()=>JSON.parse(vm.runInContext('JSON.stringify(S)',c)),
    transaction:()=>tx.annualAwardTransaction(c.S,{league:s.org,level:s.lv,role:s.role,metrics:st})};
}
function validate(h){
  const s=h.c.S,seen=new Set();
  for(const d of s.awardDecisions){
    assert(tx.isCompletedAwardDecision(d,s));assert.equal(identity.identifyAwardDecision(structuredClone(d),s).decisionVerified,false);
    assert(!seen.has(d.decisionKey));seen.add(d.decisionKey);assert.equal(d.year,s.year);assert.equal(d.leagueKey,s.org);
    if(d.drawSource==='LEGACY_MAIN_RNG'){
      const r=h.rng.find(r=>r.before===d.rngBefore);assert(r);assert.equal(d.u,r.value);assert.equal(d.rngAfter,r.after);
      const raw=d.u*100<d.pPercent;
      if(d.awardId==='MVP'){assert.equal(d.legacyDrawAwarded,raw);assert.equal(d.awarded,raw||d.sources.includes('TRIPLE_CROWN_GUARANTEE'));}
      else assert.equal(d.awarded,raw);
    }else if(d.drawSource==='DERIVED'){
      assert.equal(d.awarded,true);assert.equal(d.u,null);
      if(d.awardId==='PITCH_TRIPLE_CROWN'){
        assert.deepEqual(Array.from(d.sources),['PITCH_WINS','PITCH_ERA','PITCH_STRIKEOUTS']);
        for(const key of d.sourceDecisionKeys)assert(s.awardDecisions.some(other=>other.decisionKey===key&&other.awarded&&other.year===d.year&&other.leagueKey===d.leagueKey));
      }else assert.deepEqual(Array.from(d.sources),['TRIPLE_CROWN_GUARANTEE']);
    }else{
      const candidate=pitcherAwardCandidate(d.awardId,{league:s.org,level:s.lv,role:s.role,pos:s.pos,stats:h.c.st});
      const draw=decideIndependentAward({seed:s.seed,year:s.year,league:s.org,awardId:d.awardId,ruleId:d.ruleId},candidate.pPercent,s.seed);
      assert.equal(d.eligibility,candidate.eligibility);assert.equal(d.pPercent,candidate.pPercent);
      for(const k of ['drawKey','hash32','u','awarded','drawSource'])assert.equal(d[k],draw[k]);
    }
  }
  const native=s.awardDecisions.filter(d=>d.drawSource==='LEGACY_MAIN_RNG');assert.equal(native.length,h.rng.length);
  native.forEach((d,i)=>assert.equal(d.u,h.rng[i].value,'native ordering'));
  const inspection=tx.inspectAwardTransaction(h.transaction());assert.equal(inspection.phase,'AWARD_EFFECTS_COMMITTED');
  assert(inspection.receipts.every(r=>r.status==='COMMITTED'));
}
function expectedState(old,initial,now){
  const expected=old.snapshot(),label=labels[initial.org],prefix=initial.year+' '+label;
  for(const [i,d] of old.c.S.awardDecisions.entries()){
    assert(tx.isCompletedAwardDecision(d,old.c.S));assert.equal(d.drawSource,'LEGACY_MAIN_RNG');
    assert.equal(d.u,old.rng[i].value);assert.equal(d.awarded,d.u*100<d.pPercent);
  }
  assert.equal(old.c.S.awardDecisions.length,old.rng.length);
  // Both histories are independently validated, not a blanket state exclusion.
  delete expected.awardDecisions;
  const rename={'最優秀投手賞':'最優秀防御率投手賞','最多奪三振':'最多三振奪取投手賞','最多セーブ':'最多セーブ投手賞','最優秀中継ぎ':'最優秀中継ぎ投手賞'};
  expected.honors=expected.honors.map(text=>{for(const [from,to] of Object.entries(rename))if(text===prefix+from)return prefix+to;return text;});
  const decisions=now.c.S.awardDecisions;
  for(const d of decisions.filter(d=>d.drawSource!=='LEGACY_MAIN_RNG'&&d.awarded)){
    const text=prefix+identity.getAwardDefinition(d.awardId).displayName;if(!expected.honors.includes(text))expected.honors.push(text);
  }
  expected.traits=structuredClone(initial.traits);expected.removed=structuredClone(initial.removed);expected.pool=initial.pool;
  const triple=decisions.some(d=>d.awardId==='PITCH_TRIPLE_CROWN'&&d.awarded);
  if(triple){expected.traits.pitcherTC=true;expected.tripleCrownHistory={...(initial.tripleCrownHistory||{}),pitcherTC:[...(initial.tripleCrownHistory?.pitcherTC||[]),{year:initial.year,bucket:initial.org,league:label}]};}
  oldTraits.awardTraitUnlocks(expected,initial.org,label);
  const remove=(key,name)=>{if(expected.traits[key]){expected.traits[key]=false;if(!expected.removed.includes(name))expected.removed.push(name);}};
  if(expected.honors.some(h=>h.startsWith(String(initial.year)))){
    remove('yips','イップス');
    const big=expected.honors.some(h=>[prefix+'年間MVP',prefix+'新人王',prefix+'首位打者',prefix+'本塁打王'].includes(h))||decisions.some(d=>d.awardId==='PITCH_SAWAMURA'&&d.awarded);
    if(big&&expected.traits.glass&&!expected.traits.phoenix){expected.traits.phoenix=true;remove('glass','スペランカー');expected.pool+=8;}
  }
  return expected;
}

export {baseline,oldSource,source,oldTraits,labels,stat,state,harness,validate,expectedState};
