import assert from 'node:assert/strict';
import {createContract,markSalaryPaid} from '../docs/src/engine/contract-policy.js';
import {createIncentiveTerms,applyIncentivePayment} from '../docs/src/engine/incentive-policy.js';
import {prepareSeasonPayment} from '../docs/src/engine/season-payment-policy.js';
import {annualStateTransaction,prepareAwardReceipt,commitAwardReceipt} from '../docs/src/engine/award-transaction-policy.js';
let pass=0;const test=(name,fn)=>{fn();pass++;console.log('PASS '+name);};
function state(org='NPB',year=2039){return {seed:'payment-receipt',year,org,orgTeamId:'team',ct:createContract({contractId:org+':signed',org,teamId:'team',signedYear:year-1,startYear:year,years:2,annualSalary:10000000,incentive:createIncentiveTerms({org,annualSalary:10000000})}),currentSalary:10000000,careerBaseSalary:0,careerEarnings:2000000,careerIncentive:0,yearlyIncentivePaid:{},honors:[],lastSalaryEvaluation:{sampleStatus:'VALID',payD:4}};}
for(const org of ['NPB','KBO','CPBL','MLB','MiLB'])test(org+' exact existing payment policy, repeat and next year',()=>{
  const s=state(org),original=structuredClone(s),p=prepareSeasonPayment(s),t=annualStateTransaction(s);
  assert.deepEqual(s,original,'preparation is read-only');
  const base=markSalaryPaid(original.ct,original.year),legacy=applyIncentivePayment({...original,careerEarnings:original.careerEarnings+base.amount},{contract:base.contract,evaluation:original.lastSalaryEvaluation,honors:original.honors,year:original.year});
  prepareAwardReceipt(t,'salary',p.writes);commitAwardReceipt(t,'salary');
  assert.equal(s.careerEarnings,legacy.state.careerEarnings);assert.deepEqual(s.ct,base.contract);assert.equal(s.careerBaseSalary,10000000);
  const paid=structuredClone(s);assert.equal(commitAwardReceipt(t,'salary'),false);assert.deepEqual(s,paid);assert.throws(()=>prepareSeasonPayment(s),/HISTORICAL_READ_ONLY/);
  s.year++;const next=prepareSeasonPayment(s),nextTx=annualStateTransaction(s);prepareAwardReceipt(nextTx,'salary',next.writes);commitAwardReceipt(nextTx,'salary');assert.equal(s.careerBaseSalary,20000000);assert.throws(()=>commitAwardReceipt(t,'salary'),/STALE_AWARD_TRANSACTION/);
});
for(let point=0;point<7;point++)test('payment partial write '+point+' recovers all fields once',()=>{
  const s=state(),p=prepareSeasonPayment(s),t=annualStateTransaction(s);prepareAwardReceipt(t,'salary',p.writes);let index=0;
  assert.throws(()=>commitAwardReceipt(t,'salary',()=>{if(index++===point)throw Error('INJECTED_WRITE');}),/INJECTED/);
  commitAwardReceipt(t,'salary');assert.equal(s.careerEarnings,12350000);assert.equal(s.careerBaseSalary,10000000);assert.equal(s.careerIncentive,350000);assert.equal(s.ct.contractId,'NPB:signed');assert.equal(s.yearlyIncentivePaid['2039'].amount,350000);
});
test('payment conflict preserves legitimate concurrent income and contract',()=>{
  const s=state(),p=prepareSeasonPayment(s),t=annualStateTransaction(s);prepareAwardReceipt(t,'salary',p.writes);s.careerEarnings=99000000;
  assert.throws(()=>commitAwardReceipt(t,'salary'),/EFFECT_CONFLICT/);assert.equal(s.careerEarnings,99000000);assert.equal(s.ct.annualSchedule[0].paid,false);
});
test('invalid contract fails before state writes',()=>{const s=state();s.ct=null;const before=structuredClone(s);assert.throws(()=>prepareSeasonPayment(s),/PRO_PLAYER_WITHOUT_CONTRACT/);assert.deepEqual(s,before);});
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'PRODUCT_RECEIPT_AND_EXISTING_PAYMENT_POLICIES; synthetic fixtures'}));
