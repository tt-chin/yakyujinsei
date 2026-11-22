import assert from 'node:assert/strict';
import {sortFaOffers} from '../docs/src/ui/fa-market-presentation.js';
const offers=Object.freeze([Object.freeze({annualSalary:100,years:4,guaranteedTotal:400}),Object.freeze({annualSalary:250,years:1,guaranteedTotal:250}),Object.freeze({annualSalary:100,years:2,guaranteedTotal:200})]);
assert.deepEqual(sortFaOffers(offers),[1,0,2]);assert.deepEqual(sortFaOffers(offers,'years'),[0,2,1]);assert.deepEqual(sortFaOffers(offers,'guaranteedTotal'),[0,1,2]);
assert.deepEqual(sortFaOffers([{annualSalary:null},{annualSalary:0},{annualSalary:NaN},{annualSalary:-1},{annualSalary:1},{annualSalary:Infinity}]),[4,1,0,2,3,5]);
assert.deepEqual(sortFaOffers([]),[]);assert.deepEqual(sortFaOffers([{years:1}],'years'),[0]);assert.throws(()=>sortFaOffers(offers,'teamId'),/Unknown FA sort/);
assert.deepEqual(offers.map(o=>o.annualSalary),[100,250,100]);console.log('PASS FA sort: annual/years/guaranteed, stable ties, missing/invalid, empty/single, rejected field and frozen source unchanged');

const {projectUi21VersionStamps}=await import('./support/ui-version-comparison.mjs');
const original={state:{version:'2.1.0',birthHighSchool:{createdVersion:'2.1.0',school:'A'},salary:10},rng:[1,2]};
assert.deepEqual(projectUi21VersionStamps(original),{state:{birthHighSchool:{school:'A'},salary:10},rng:[1,2]});assert.equal(original.state.version,'2.1.0');
assert.throws(()=>projectUi21VersionStamps({state:{version:'9.0.0'}}),/UI21_VERSION/);assert.throws(()=>projectUi21VersionStamps({state:{version:'2.1.0',birthHighSchool:{createdVersion:'9.0.0'}}}),/UI21_BIRTH/);
console.log('PASS strict version metadata projection; original state, financial values and RNG retained; unknown stamps rejected');
