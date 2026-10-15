// Each new department in isolation: no MVP/other title can mask a missing consumer.
import assert from 'node:assert/strict';
import {harness,source,state,stat} from './award-runtime-support.mjs';
import {createContract} from '../../docs/src/engine/contract-policy.js';
import {createIncentiveTerms,evaluateIncentive} from '../../docs/src/engine/incentive-policy.js';
import {calculateMarketAwardAdjustment} from '../../docs/src/engine/salary-evaluation-policy.js';
import {salaryAwardBonus} from '../../docs/src/engine/salary-promotion-policy.js';
import {honorScoreFor} from '../../docs/src/engine/hall-of-fame-policy.js';
import {prepareSeasonPayment} from '../../docs/src/engine/season-payment-policy.js';
import {annualStateTransaction,prepareAwardReceipt,commitAwardReceipt} from '../../docs/src/engine/award-transaction-policy.js';
import {hasCurrentAwardEffect} from '../../docs/src/engine/award-consumer-policy.js';
let pass=0;
for(const [id,league,role,W] of [['PITCH_WINS','CPBL','SP',20],['PITCH_WIN_PCT','KBO','MR',10]])for(const fault of [-1,0,1,2,3,4,5,6]){
 const initial=state(league,role);Object.assign(initial,{careerBaseSalary:0,careerIncentive:0,careerEarnings:2000000,yearlyIncentivePaid:{},lastSalaryEvaluation:{payD:0,sampleStatus:'FULL'},
  ct:createContract({contractId:'isolated-'+id,org:league,teamId:'fixture',signedYear:2038,startYear:2039,years:2,annualSalary:40000000,incentive:createIncentiveTerms({org:league,annualSalary:40000000})})});
 const h=harness(source,initial,{...stat,d:-10,G:20,W,L:0,IP:100,era:6,SO:0,SV:0,HLD:0});h.run();const s=h.c.S;
 const won=s.awardDecisions.filter(d=>d.awarded&&d.awardId!=='ALL_STAR');assert.deepEqual(Array.from(won,d=>d.awardId),[id]);
 assert.equal(calculateMarketAwardAdjustment(s.honors,s.year,s),.35);assert.equal(salaryAwardBonus(s.honors,s.year,s),1);
 const hof=honorScoreFor({bucket:league,position:'P',honors:s.honors,awardState:s});assert.equal(hof.sc,160+(s.awardDecisions.some(d=>d.awardId==='ALL_STAR'&&d.awarded)?70:0));
 assert.equal(hof.king,1);assert.equal(hof.aceN,0);assert.equal(hof.mvp,0);
 assert(!hasCurrentAwardEffect(s,'phoenix',league));assert(!hasCurrentAwardEffect(s,'demotion',league));assert.equal(s.pool,7);
 assert.equal(evaluateIncentive({terms:s.ct.incentive,evaluation:s.lastSalaryEvaluation,honors:s.honors,year:s.year,awardState:s}).level,'FULL');
 const before=structuredClone(s),payment=prepareSeasonPayment(s),t=annualStateTransaction(s);assert.deepEqual(s,before);
 prepareAwardReceipt(t,'isolated-payment',payment.writes);
 if(fault>=0){let count=0;assert.throws(()=>commitAwardReceipt(t,'isolated-payment',()=>{if(count++===fault)throw Error('INJECTED_PAYMENT_WRITE');}),/INJECTED_PAYMENT_WRITE/);}
 commitAwardReceipt(t,'isolated-payment');assert.equal(s.careerEarnings,44800000);assert.equal(s.careerBaseSalary,40000000);assert.equal(s.careerIncentive,2800000);
 assert.equal(s.ct.contractId,before.ct.contractId);assert.equal(s.ct.guaranteedTotal,80000000);assert.equal(s.ct.annualSchedule[1].paid,false);
 const paid=structuredClone(s);assert.equal(commitAwardReceipt(t,'isolated-payment'),false);assert.deepEqual(s,paid);
 assert.throws(()=>prepareSeasonPayment(s),/HISTORICAL_READ_ONLY/);
 s.year++;const next=prepareSeasonPayment(s),nextT=annualStateTransaction(s);assert.equal(next.incentive.amount,0,'last-year award does not pay next-year incentive');
 prepareAwardReceipt(nextT,'next-payment',next.writes);commitAwardReceipt(nextT,'next-payment');assert.equal(s.careerEarnings,84800000);assert.equal(s.careerIncentive,2800000);
 pass++;console.log('PASS '+id+' isolated consumers/payment fault='+fault);
}
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_PRODUCER_DECISION_RECEIPT_FINANCIAL_CONSUMER / SYNTHETIC_SCENARIO'}));
