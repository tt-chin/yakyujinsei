import assert from 'node:assert/strict';
import {sortFaOffers} from '../docs/src/ui/fa-market-presentation.js';
const offers=Object.freeze([Object.freeze({annualSalary:100,years:4,guaranteedTotal:400}),Object.freeze({annualSalary:250,years:1,guaranteedTotal:250}),Object.freeze({annualSalary:100,years:2,guaranteedTotal:200})]);
assert.deepEqual(sortFaOffers(offers),[1,0,2]);assert.deepEqual(sortFaOffers(offers,'years'),[0,2,1]);assert.deepEqual(sortFaOffers(offers,'guaranteedTotal'),[0,1,2]);
assert.deepEqual(sortFaOffers([{annualSalary:null},{annualSalary:0},{annualSalary:NaN},{annualSalary:-1},{annualSalary:1},{annualSalary:Infinity}]),[4,1,0,2,3,5]);
assert.deepEqual(sortFaOffers([]),[]);assert.deepEqual(sortFaOffers([{years:1}],'years'),[0]);assert.throws(()=>sortFaOffers(offers,'teamId'),/Unknown FA sort/);
assert.deepEqual(offers.map(o=>o.annualSalary),[100,250,100]);console.log('PASS FA sort: annual/years/guaranteed, stable ties, missing/invalid, empty/single, rejected field and frozen source unchanged');

const {assertUi20VersionStamps}=await import('./support/ui-version-comparison.mjs');
const original={state:{version:'2.0.0',birthHighSchool:{createdVersion:'2.0.0',school:'A'},salary:10},rng:[1,2]},before=structuredClone(original);
assert.equal(assertUi20VersionStamps(original),original);assert.deepEqual(original,before);
for(const version of ['2.1.0','9.0.0']){assert.throws(()=>assertUi20VersionStamps({state:{version}}),/UI20_VERSION/);assert.throws(()=>assertUi20VersionStamps({state:{version:'2.0.0',birthHighSchool:{createdVersion:version}}}),/UI20_BIRTH/);}
assert.throws(()=>assertUi20VersionStamps({state:{version:'2.0.0',birthHighSchool:{createdVersion:null}}}),/UI20_BIRTH/);
assert.deepEqual(assertUi20VersionStamps({state:{version:'2.0.0'},rng:[]}),{state:{version:'2.0.0'},rng:[]});
assert.deepEqual(assertUi20VersionStamps({state:{version:'2.0.0',birthHighSchool:{school:'legacy'}},rng:[]}),{state:{version:'2.0.0',birthHighSchool:{school:'legacy'}},rng:[]});
console.log('PASS unified 2.0.0 version validation; complete snapshot identity, financial values and RNG retained; wrong stamps rejected');
