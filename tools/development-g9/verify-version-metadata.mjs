// Manual G9 release-preparation check. No product wiring, output writes or baseline changes.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {VERSION} from '../../docs/src/config.js';
import {JP_DATA} from '../../docs/src/data/jp-data.js';
import {TRAIT_LABELS} from '../../docs/src/engine/trait-policy.js';
import {ensureEventState} from '../../docs/src/engine/event-state-policy.js';
import * as schoolPolicy from '../../docs/src/engine/school-policy.js';
import {independentAwardDraw} from '../../docs/src/engine/award-rng-policy.js';

const root=fileURLToPath(new URL('../../',import.meta.url));
const base='56e72d9792529f3221c1a1ffadaf563bceebe26d';
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'});
const read=p=>readFileSync(new URL('../../'+p,import.meta.url),'utf8');
const digest=x=>createHash('sha256').update(x).digest('hex');
let PASS=0;
function check(id,fn){fn();PASS++;console.log('PASS '+id);}
const source=read('docs/src/engine/game.js');
const beforeConfig=git('show',base+':docs/src/config.js');
check('config-only-approved-literal',()=>{
  assert.equal(VERSION,'1.13.0');
  assert.equal(read('docs/src/config.js').replaceAll('\r\n','\n'),beforeConfig.replace("'1.12.0'","'1.13.0'").replaceAll('\r\n','\n'));
});
check('game-byte-content-unchanged',()=>assert.equal(source.replaceAll('\r\n','\n'),git('show',base+':docs/src/engine/game.js').replaceAll('\r\n','\n')));
function line(prefix){const found=source.split(/\r?\n/).find(s=>s.trim().startsWith(prefix));assert.ok(found,prefix);return found;}
const begin=source.indexOf('  newState = function(name,pos)'),end=source.indexOf('\n  const nextContractId',begin);
assert.ok(begin>=0&&end>begin);
const initializer=source.slice(begin,end);
function initialize(seed,pos,version){
  const ctx=vm.createContext({TextEncoder,S:{rngState:0},SEED:seed,VERSION:version,DATA:JP_DATA,
    TRAIT_LABELS,traitPresentation:new WeakMap(),ensureEventState,...schoolPolicy});
  // Extract the active native initializer, RNG, seed initialization and ability keys, not a reimplementation.
  vm.runInContext('var _s=0;var R,seedInit,newState;'+line('const POS_AB=')+line('function fnv1a32(')
    +line('seedInit = function(')+line('R = function(')+line('const ri=')+line('function pickRecord(')+initializer,ctx);
  ctx.seedInit(seed);
  const nativeR=ctx.R,trace=[];
  ctx.R=()=>{const before=ctx.S.rngState,u=nativeR(),after=ctx.S.rngState;trace.push({before,u,after});return u;};
  const state=ctx.newState('G9検証',pos);
  return {state,plain:JSON.parse(JSON.stringify(state)),trace};
}
const rows=[];
for(const seed of ['tob0ilu0','q77bi1jx','jp3-pitcher-01','jp3-infielder-01'])for(const pos of ['P','IF']){
  const a=initialize(seed,pos,'1.12.0'),b=initialize(seed,pos,VERSION),repeat=initialize(seed,pos,VERSION);
  check(seed+'/'+pos+'/exact-two-metadata-paths',()=>{
    assert.equal(a.plain.version,'1.12.0');assert.equal(a.plain.birthHighSchool.createdVersion,'1.12.0');
    assert.equal(b.plain.version,'1.13.0');assert.equal(b.plain.birthHighSchool.createdVersion,'1.13.0');
    // Replace only these two exact values in this historical initializer comparison; no global exclusion.
    const expected=structuredClone(a.plain);expected.version='1.13.0';expected.birthHighSchool.createdVersion='1.13.0';
    assert.deepEqual(b.plain,expected);
  });
  check(seed+'/'+pos+'/complete-main-rng-trace',()=>assert.deepEqual(b.trace,a.trace));
  check(seed+'/'+pos+'/same-version-exact-replay',()=>{assert.deepEqual(b.plain,repeat.plain);assert.deepEqual(b.trace,repeat.trace);});
  check(seed+'/'+pos+'/immutable-birth-snapshot',()=>{
    const desc=Object.getOwnPropertyDescriptor(b.state,'birthHighSchool');
    assert.equal(desc.writable,false);assert.equal(desc.configurable,false);assert.equal(Object.isFrozen(b.state.birthHighSchool),true);
  });
  rows.push({seed,pos,rngCalls:b.trace.length,traceSha256:digest(JSON.stringify(b.trace)),
    oldStateSha256:digest(JSON.stringify(a.plain)),newStateSha256:digest(JSON.stringify(b.plain)),tier:b.state.schoolTier});
}
for(const tier of ['S','A','B','C'])check('birth-version-compatibility/'+tier,()=>{
  const school=JP_DATA.highSchools.find(s=>s.tier===tier),old={},current={};
  schoolPolicy.installBirthHighSchool(old,school,'1.12.0');schoolPolicy.installBirthHighSchool(current,school,VERSION);
  assert.equal(schoolPolicy.smallSchoolEligibility(current.birthHighSchool,JP_DATA.highSchools,VERSION),tier==='C'?'ELIGIBLE':'NOT_ELIGIBLE');
  assert.equal(schoolPolicy.smallSchoolEligibility(old.birthHighSchool,JP_DATA.highSchools,VERSION),'UNKNOWN');
  assert.equal(old.birthHighSchool.createdVersion,'1.12.0');
});
check('missing-invalid-birth-not-invented',()=>{
  for(const snapshot of [undefined,null,{}, {schemaVersion:1,classificationSystem:'JP_SABC',createdVersion:VERSION,tier:'C',schoolId:'missing'}])
    assert.equal(schoolPolicy.smallSchoolEligibility(snapshot,JP_DATA.highSchools,VERSION),'UNKNOWN');
});
for(const [awardId,ruleId] of Object.entries({PITCH_WINS:'p01-b-v1',PITCH_WIN_PCT:'p04-b-npb12-v1',PITCH_SAWAMURA:'p08-ip180-s3-b2-g95-v1'}))check('independent-draw-version-invariant/'+awardId,()=>{
  const a=initialize('q77bi1jx','P','1.12.0'),b=initialize('q77bi1jx','P',VERSION);
  const draw=s=>independentAwardDraw({seed:s.seed,year:2039,league:'NPB',awardId,ruleId},s.seed);
  const beforeA=JSON.stringify(a.state),beforeB=JSON.stringify(b.state);
  assert.deepEqual(draw(a.state),draw(b.state));
  assert.equal(JSON.stringify(a.state),beforeA);assert.equal(JSON.stringify(b.state),beforeB);
});
console.log(JSON.stringify({suite:'G9_VERSION_METADATA_NATIVE_INITIALIZER',base,version:VERSION,PASS,FAIL:0,rows,
  scope:'Native initializer/RNG plus policy fixtures only; not a full career, CI, Preview or real-device UI acceptance.'},null,2));
