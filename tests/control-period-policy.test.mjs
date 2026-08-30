import assert from'node:assert/strict';
import{applyForcedCutProtection,calculateControlOffer,getContractStage,getNpbFaRights,migrateServiceTime}from'../docs/src/engine/control-period-policy.js';
assert.equal(getContractStage({org:'NPB',serviceYears:7}),'CONTROL');assert.equal(getContractStage({org:'NPB',serviceYears:8}),'FA');assert.deepEqual(getNpbFaRights(8),{domestic:true,overseas:false});assert.deepEqual(getNpbFaRights(9),{domestic:true,overseas:true});
for(let y=0;y<=2;y++)assert.equal(getContractStage({org:'MLB',serviceYears:y}),'CONTROL');for(let y=3;y<=5;y++)assert.equal(getContractStage({org:'MLB',serviceYears:y}),'ARBITRATION');assert.equal(getContractStage({org:'MLB',serviceYears:6}),'FA');
assert.equal(getContractStage({org:'NPB',serviceYears:4,faEligible:false}),'CONTROL');assert.equal(applyForcedCutProtection(50,100),75);
const offer=calculateControlOffer({marketSalary:40_000_000,previousSalary:80_000_000,marketRating:0,serviceYears:1,org:'NPB',levelMinimum:16_000_000});assert.equal(offer.protectedSalary,60_000_000);
assert.deepEqual(migrateServiceTime({npbFaSeasons:4,stats:{MLB:{yr:3},MINOR:{yr:9},KBO:{yr:2},CPBL:{yr:1}}}),{NPB:4,MLB:3,KBO:2,CPBL:1});
assert.deepEqual(migrateServiceTime({serviceTime:{NPB:8,MLB:2,KBO:0,CPBL:4},npbFaSeasons:7,stats:{MLB:{yr:3},KBO:{yr:1},CPBL:{yr:2}}}),{NPB:8,MLB:3,KBO:1,CPBL:4});
console.log('control period policy tests passed');
