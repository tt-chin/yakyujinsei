import assert from 'node:assert/strict';
import vm from 'node:vm';
import {Rng} from '../docs/src/engine/rng.js';
import {GAME_SOURCE,productionFunction} from './retirement-hof-test-support.mjs';

// Golden values: produced by the pre-Rng seedInit/R of 650e4dd21718b4abec3876fc9ef6148714c21d4f (8 draws per seed).
const golden={
  '':[3270292246,[0.7585771447047591,0.9602792239747941,0.5662803263403475,0.08399144327268004,0.11777909542433918,0.5446125948801637,0.5556692096870393,0.8540213806554675],742949566],
  'yakyo-test-001':[1527536498,[0.9388780486769974,0.6808669897727668,0.9465476144105196,0.22260507242754102,0.3018500586040318,0.9615724242758006,0.7820404057856649,0.553964982740581],3295161114],
  'jp3-pitcher-02':[2962908650,[0.3893882080446929,0.15217304322868586,0.8327475897967815,0.31625256733968854,0.6710462651681155,0.2791128128301352,0.6754484518896788,0.3207493603695184],435565970],
  '野球人生':[3007294176,[0.575108430115506,0.115592842688784,0.4500771330203861,0.857639578403905,0.8580336566083133,0.3454999690875411,0.6501339247915894,0.8310311392415315],479951496],
  '12345678':[1796907782,[0.3980701428372413,0.2813804824836552,0.05930790305137634,0.44286840059794486,0.0612389559391886,0.7385388570837677,0.48731602681800723,0.18616266991011798],3564532398],
};
const zeroHash=[1831565813,[0.0003297457005828619,0.2232720274478197,0.1462021479383111,0.46732782293111086,0.5450490827206522,0.6152513844426721,0.6489853798411787,0.45600721263326705],3599190429];
const fnv1a32=vm.runInNewContext(productionFunction('fnv1a32')+';fnv1a32',{TextEncoder});
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};
function draw(rng,state,seed){rng.seed(seed);const seeded=state.rngState,values=Array.from({length:8},()=>rng.next());return [seeded,values,state.rngState];}

for(const [seed,expected] of Object.entries(golden)) test('golden '+JSON.stringify(seed),()=>{
  const S={rngState:0};assert.deepEqual(draw(new Rng(()=>S,fnv1a32),S,seed),expected);
});
test('zero hash falls back to 0x6D2B79F5',()=>{
  const S={rngState:0};assert.deepEqual(draw(new Rng(()=>S,()=>0),S,'any'),zeroHash);
});
test('state is read on every call and never held',()=>{
  let S={rngState:0};const rng=new Rng(()=>S,fnv1a32);rng.seed('yakyo-test-001');
  const old=S;S={rngState:old.rngState};assert.equal(rng.next(),golden['yakyo-test-001'][1][0]);
  assert.equal(old.rngState,golden['yakyo-test-001'][0]);assert.deepEqual(Object.keys(rng).sort(),['getState','hash','onDraw']);
});
test('onDraw is notified once per next() with the drawn value, never by seed()',()=>{
  const S={rngState:0},rng=new Rng(()=>S,fnv1a32),seen=[];rng.onDraw=v=>seen.push([v,S.rngState]);
  rng.seed('yakyo-test-001');assert.deepEqual(seen,[]);
  const [seeded,values,final]=golden['yakyo-test-001'];assert.equal(S.rngState,seeded);
  assert.deepEqual(values.map(()=>rng.next()),values);assert.deepEqual(seen.map(x=>x[0]),values);assert.equal(seen.at(-1)[1],final);
});
test('game.js seedInit/R delegate to Rng and keep _s in sync',()=>{
  const c=vm.createContext({S:{rngState:0},Rng,TextEncoder});
  vm.runInContext(`let _s=0,seedInit,R;const careerRng=new Rng(()=>S,fnv1a32);${productionFunction('fnv1a32')}
    ${GAME_SOURCE.match(/seedInit = function\(seed\)\{[^\n]+/)[0]}
    ${GAME_SOURCE.match(/R = function\(\)\{[^\n]+/)[0]}`,c);
  for(const [seed,[seeded,values,final]] of Object.entries(golden)){
    c.seed=seed;vm.runInContext('seedInit(seed)',c);assert.equal(c.S.rngState,seeded);assert.equal(vm.runInContext('_s',c),seeded|0);
    assert.deepEqual(values.map(()=>vm.runInContext('R()',c)),values);assert.equal(c.S.rngState,final);assert.equal(vm.runInContext('_s',c),final|0);
  }
});
console.log(`rng tests: ${pass} PASS`);
