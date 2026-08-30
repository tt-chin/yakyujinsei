import assert from'node:assert/strict';
import{calculateArbitrationTerms}from'../docs/src/engine/arbitration-policy.js';
const terms=calculateArbitrationTerms({marketSalary:100_000_000,previousSalary:80_000_000,marketRating:4,serviceYears:4,levelMinimum:50_000_000});assert.ok(terms.playerSalary>terms.middleSalary&&terms.middleSalary>terms.clubSalary);assert.equal(terms.winChance,87);
assert.equal(calculateArbitrationTerms({marketSalary:1,previousSalary:100,marketRating:-99,serviceYears:3}).clubSalary,75);assert.equal(calculateArbitrationTerms({marketSalary:1,previousSalary:0,marketRating:-99,serviceYears:3}).winChance,15);assert.equal(calculateArbitrationTerms({marketSalary:1,previousSalary:0,marketRating:99,serviceYears:6}).winChance,88);
console.log('arbitration policy tests passed');
