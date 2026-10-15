import assert from 'node:assert/strict';
import {pitcherAwardCandidate as candidate,sawamuraProbability} from '../docs/src/engine/pitcher-award-policy.js';
let passed=0;const test=(id,f)=>{f();passed++;console.log('PASS '+id);};
const input={league:'NPB',level:'NPB1',role:'SP',pos:'P',stats:{G:26,W:15,L:7,IP:180.1,SO:165,era:2.35}};
for(const [league,b,g] of [['CPBL',10,15],['KBO',12,17],['NPB',12,17],['MLB',14,20]])for(const role of ['SP','MR','CL'])for(const w of [b-1,b,b+1,g-1,g,g+1])test('P01 '+league+'/'+role+'/'+w,()=>{
  const r=candidate('PITCH_WINS',{...input,league,level:league==='MLB'?'MLB':league+'1',role,stats:{...input.stats,W:w}});
  assert.equal(r.eligibility,w>=b);assert.equal(r.pPercent,w<b?0:w>=g?100:20+75*(w-b)/(g-b));
});
for(const [league,W,L,p] of [['NPB',11,0,0],['NPB',12,0,100],['NPB',12,6,25],['NPB',12,7,0],['NPB',13,7,20],['NPB',13,2,100],['KBO',9,0,0],['KBO',10,5,25],['KBO',10,2,75],['KBO',10,1,100]])test('P04 '+league+'/'+W+'/'+L,()=>{
  const r=candidate('PITCH_WIN_PCT',{...input,league,level:league+'1',stats:{...input.stats,W,L}});
  assert(Math.abs(r.pPercent-p)<1e-12,'assertion approximation only, not a product threshold epsilon');
});
for(const league of ['CPBL','MLB'])test('P04 excluded '+league,()=>assert.equal(candidate('PITCH_WIN_PCT',{...input,league,level:league==='MLB'?'MLB':league+'1'}).eligibility,false));
for(const [score,p] of [[59.999,0],[60,10],[60.001,10.0025],[65,22.5],[70,35],[75,47.5],[80,60],[85,72.5],[90,85],[94,95],[94.999,95],[95,100],[95.001,100],[100,100]])test('P08 probability '+score,()=>assert(Math.abs(sawamuraProbability(score)-p)<1e-10));
test('manual mobile evidence is an offline estimate, not product awarded result',()=>{
  const r=candidate('PITCH_SAWAMURA',input);assert.equal(r.eligibility,true);
  assert(Math.abs(r.score-68.79545454545455)<1e-10);assert(Math.abs(r.pPercent-31.98863636363636)<1e-10);
});
for(const IP of [143,150,160,170,180,190,200])test('P08 IP component '+IP,()=>assert.equal(candidate('PITCH_SAWAMURA',{...input,stats:{...input.stats,IP}}).components.IP,100*Math.max(0,Math.min(1,(IP-143)/37))));
for(const id of ['PITCH_WINS','PITCH_WIN_PCT','PITCH_SAWAMURA']){
  for(const key of ['G','IP'])for(const value of [0,-1,NaN,Infinity,undefined,'180'])test(id+'/'+key+'/'+String(value),()=>assert.equal(candidate(id,{...input,stats:{...input.stats,[key]:value}}).eligibility,false));
  for(const role of ['IF',null])test(id+' invalid role '+role,()=>assert.equal(candidate(id,{...input,role}).eligibility,false));
  test(id+' lower tier',()=>assert.equal(candidate(id,{...input,level:'NPB2'}).eligibility,false));
}
for(const id of ['PITCH_WINS','PITCH_WIN_PCT'])for(const W of [NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER+1,'15',undefined])test(id+' invalid W '+String(W),()=>assert.equal(candidate(id,{...input,stats:{...input.stats,W}}).eligibility,false));
for(const L of [NaN,Infinity,-1,1.5,Number.MAX_SAFE_INTEGER,'7',undefined])test('P04 invalid L '+String(L),()=>assert.equal(candidate('PITCH_WIN_PCT',{...input,stats:{...input.stats,L}}).eligibility,false));
test('P04 zero denominator',()=>assert.equal(candidate('PITCH_WIN_PCT',{...input,stats:{...input.stats,W:0,L:0}}).eligibility,false));
for(const key of ['W','L','SO','era'])for(const value of [-1,NaN,Infinity,undefined,'1'])test('P08 invalid '+key+'/'+String(value),()=>assert.equal(candidate('PITCH_SAWAMURA',{...input,stats:{...input.stats,[key]:value}}).eligibility,false));
for(const [key,value] of [['W',12],['IP',142.999],['era',3.200001]])test('P08 qualification precedes score '+key,()=>assert.equal(candidate('PITCH_SAWAMURA',{...input,stats:{...input.stats,W:20,L:0,IP:220,era:1,SO:300,[key]:value}}).eligibility,false));
test('P08 guarantee and legal zero losses',()=>{const r=candidate('PITCH_SAWAMURA',{...input,stats:{G:30,W:17,L:0,IP:180,SO:215,era:2.2}});assert.equal(r.score,100);assert.equal(r.pPercent,100);});
test('pure frozen input, no global RNG',()=>{
  const x=Object.freeze({...input,stats:Object.freeze({...input.stats})}),before=structuredClone(x);
  for(let n=0;n<10;n++)candidate('PITCH_SAWAMURA',x);assert.deepEqual(x,before);
});
console.log(JSON.stringify({PASS:passed,FAIL:0,evidence:'PURE_PRODUCT_NUMERIC_FUNCTION; NOT_INTEGRATED_AWARD_GRANT'}));
