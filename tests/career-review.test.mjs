import assert from 'node:assert/strict';
import {careerReviewModel,reviewStatLine} from '../docs/src/ui/career-review.js';

const stat={G:31,IP:123+2/3,W:12,L:4,SO:133,PA:500,AB:400,H:120,HR:21,RBI:77};
assert.equal(reviewStatLine('P',stat),'登板 31｜投球回 123.2｜12勝4敗｜奪三振 133');
assert.equal(reviewStatLine('IF',stat),'出場 31｜打席 500｜打率 .300｜本塁打 21｜打点 77');
assert.equal(reviewStatLine('P',null),'');
const state={name:'検証選手',pos:'P',year:2040,stage:'PRO',lv:'MLB',log:[{y:2026,tm:'高校',line:'地区大会'},{y:2030,tm:'東京',st:stat},{y:2034,tm:'海外',st:stat},{y:2038,tm:'海外',inj:true,line:'全休'},{y:2039,tm:'海外',st:stat},{y:2040,tm:'東京',st:{...stat,form:1}}],honors:['2030 新人王','2040 MVP','2040 最多勝'],teamTally:{NPB:{tokyo:10},MLB:{us:5}},stats:{NPB:stat},ct:{annualSchedule:[{year:2040,amount:100000000,paid:true}]},salaryDecisionHistory:[],offer:{salary:999999999}};
const frozen=JSON.stringify(state),labels={formatMoney:value=>'円'+value,teamName:key=>key==='tokyo'?'東京球団':key,teamLeague:name=>name==='海外'?'MLB':null};
let model=careerReviewModel(state,labels);
assert.equal(model.salary,'円100000000');assert.equal(model.nextSalary,'未定','an offer is not a contract');
assert.deepEqual(model.awards,['2040 MVP','2040 最多勝']);assert.deepEqual(model.changes,['所属の変化：海外 → 東京','キャリアハイ']);
assert.deepEqual(model.moments.map(row=>row.year),[2026,2030,2034,2039,2040]);
assert.equal(model.representative,'東京球団');assert.equal(JSON.stringify(state),frozen,'all reads preserve state');
model=careerReviewModel({...state,ct:{annualSchedule:[{year:2041,amount:0}]},salaryDecisionHistory:[{salaryYear:2040,finalSalary:55}]},labels);
assert.equal(model.salary,'円55');assert.equal(model.nextSalary,'円0','zero is known, not missing');
for(const pos of ['P','IF']){const empty=careerReviewModel({pos,year:2026});assert.deepEqual(empty.moments,[]);assert.deepEqual(empty.totals,[]);assert.equal(empty.salary,'未定');assert.equal(empty.nextSalary,'未定');assert.equal(empty.salaryApplies,false);assert.doesNotMatch(JSON.stringify(empty),/undefined|NaN/);}
assert.equal(careerReviewModel({...state,stage:'HS'}).salaryApplies,false);
console.log('PASS career-review: P/IF baseball innings, existing season/awards, cross-stage selection, signed vs offered/unknown/zero salary, empty/legacy and immutable reads');
