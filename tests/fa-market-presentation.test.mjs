import {VERSION} from '../docs/src/config.js';
import assert from 'node:assert/strict';
import {sortFaOffers} from '../docs/src/ui/fa-market-presentation.js';
const offers=Object.freeze([Object.freeze({annualSalary:100,years:4,guaranteedTotal:400}),Object.freeze({annualSalary:250,years:1,guaranteedTotal:250}),Object.freeze({annualSalary:100,years:2,guaranteedTotal:200})]);
assert.deepEqual(sortFaOffers(offers),[1,0,2]);assert.deepEqual(sortFaOffers(offers,'years'),[0,2,1]);assert.deepEqual(sortFaOffers(offers,'guaranteedTotal'),[0,1,2]);
assert.deepEqual(sortFaOffers(offers,'annualSalary','ascending'),[0,2,1]);
assert.deepEqual(sortFaOffers(offers,'years','ascending'),[1,2,0]);
assert.deepEqual(sortFaOffers(offers,'guaranteedTotal','ascending'),[2,1,0]);
assert.deepEqual(sortFaOffers([{years:2},{years:2},{years:1}], 'years','ascending'),[2,0,1]);
assert.deepEqual(sortFaOffers([{annualSalary:null},{annualSalary:10},{annualSalary:2},{annualSalary:0},{annualSalary:'100'}],'annualSalary','ascending'),[3,2,1,0,4]);
assert.throws(()=>sortFaOffers(offers,'years','sideways'),/Unknown FA sort direction/);
for(const field of ['annualSalary','years','guaranteedTotal'])for(const direction of ['ascending','descending']){const tied=Object.freeze([Object.freeze({[field]:2}),Object.freeze({[field]:2}),Object.freeze({[field]:2})]);assert.deepEqual(sortFaOffers(tied,field,direction),[0,1,2]);}


assert.deepEqual(sortFaOffers([{annualSalary:null},{annualSalary:0},{annualSalary:NaN},{annualSalary:-1},{annualSalary:1},{annualSalary:Infinity}]),[4,1,0,2,3,5]);
assert.deepEqual(sortFaOffers([]),[]);assert.deepEqual(sortFaOffers([{years:1}],'years'),[0]);assert.throws(()=>sortFaOffers(offers,'teamId'),/Unknown FA sort/);
assert.deepEqual(offers.map(o=>o.annualSalary),[100,250,100]);console.log('PASS FA sort: annual/years/guaranteed, stable ties, missing/invalid, empty/single, rejected field and frozen source unchanged');

const {assertUi20VersionStamps,currentUiBaselineVersion}=await import('./support/ui-version-comparison.mjs');
const original={state:{version:VERSION,birthHighSchool:{createdVersion:VERSION,school:'A'},salary:10},rng:[1,2]},before=structuredClone(original);
assert.equal(assertUi20VersionStamps(original),original);assert.deepEqual(original,before);
for(const version of [VERSION+'-invalid','0.0.0']){assert.throws(()=>assertUi20VersionStamps({state:{version}}),/UI20_VERSION/);assert.throws(()=>assertUi20VersionStamps({state:{version:VERSION,birthHighSchool:{createdVersion:version}}}),/UI20_BIRTH/);}
assert.throws(()=>assertUi20VersionStamps({state:{version:VERSION,birthHighSchool:{createdVersion:null}}}),/UI20_BIRTH/);
assert.deepEqual(assertUi20VersionStamps({state:{version:VERSION},rng:[]}),{state:{version:VERSION},rng:[]});
assert.deepEqual(assertUi20VersionStamps({state:{version:VERSION,birthHighSchool:{school:'legacy'}},rng:[]}),{state:{version:VERSION,birthHighSchool:{school:'legacy'}},rng:[]});
console.log('PASS current release version validation; complete snapshot identity, financial values and RNG retained; wrong stamps rejected');

assert.equal(currentUiBaselineVersion("export const VERSION = '2.0.0';\n"), 'export const VERSION = '+JSON.stringify(VERSION)+';\n');
for(const source of ["export const VERSION = '2.1.0';","export const VERSION = '2.0.0'; extra();"])assert.throws(()=>currentUiBaselineVersion(source),/UI_BASELINE_VERSION_SOURCE/);
