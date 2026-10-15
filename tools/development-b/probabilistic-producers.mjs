// Marginal, non-guaranteed new awards with real G2 hash draws and native old slots.
import assert from 'node:assert/strict';
import {harness,oldSource,source,state,stat,validate,expectedState,oldTraits} from './award-runtime-support.mjs';
import {inspectAwardTransaction} from '../../docs/src/engine/award-transaction-policy.js';
let pass=0,hashDraws=0;
for(const league of ['NPB','KBO','CPBL','MLB'])for(const role of ['SP','MR','CL']){
 const initial=state(league,role,'d2-marginal-'+league+'-'+role),metrics={...stat,d:7,G:60,W:league==='CPBL'?12:15,L:4,IP:180,era:2.5,SO:180,SV:25,HLD:22};
 const a=harness(oldSource,initial,metrics),b=harness(source,initial,metrics);a.run();b.run();validate(b);
 assert.deepEqual(b.rng,a.rng,'same marginal inputs: every legacy eligibility/p/u/position retained');
 const ordinary=b.snapshot();delete ordinary.awardDecisions;
 const expected=expectedState(a,initial,b);
 // Extend the fixed legacy-MVP fixture oracle explicitly for this additional
 // marginal scenario: raw MVP lost, but the three actual winners guarantee it.
 const prefix=initial.year+' '+({NPB:'NPB',KBO:'KBO',CPBL:'台湾プロ野球',MLB:'メジャーリーグ'}[league]);
 if(b.c.S.awardDecisions.some(d=>d.awardId==='PITCH_TRIPLE_CROWN'&&d.awarded)&&!expected.honors.includes(prefix+'年間MVP')){
  expected.honors.push(prefix+'年間MVP');oldTraits.awardTraitUnlocks(expected,league,prefix.slice(5));
  if(expected.traits.glass&&!expected.traits.phoenix){expected.traits.glass=false;expected.traits.phoenix=true;expected.pool+=8;if(!expected.removed.includes('スペランカー'))expected.removed.push('スペランカー');}
 }
 assert.deepEqual(ordinary,expected,'all ordinary fields explained by actual approved outcomes');
 const hashed=b.snapshot().awardDecisions.filter(d=>d.drawSource==='INDEPENDENT_HASH');hashDraws+=hashed.length;
 assert(hashed.length>0);for(const d of hashed){assert(d.pPercent>0&&d.pPercent<100);assert(Number.isInteger(d.hash32));assert.equal(d.u,d.hash32/4294967296);}
 const once=b.snapshot(),draws=structuredClone(b.rng);b.run();assert.deepEqual(b.snapshot(),once);assert.deepEqual(b.rng,draws);
 pass++;console.log(JSON.stringify({status:'PASS',league,role,input:{initial,metrics},actualNewDraws:hashed,
  ordinaryDifferenceClassification:'EXPLICIT_APPROVED_D2_EFFECTS_ONLY',A:a.snapshot(),B:b.snapshot(),
  expectedOrdinaryState:expected,receiptJournal:inspectAwardTransaction(b.transaction()),mainRA:a.rng,mainRB:b.rng}));
}
console.log(JSON.stringify({PASS:pass,FAIL:0,hashDraws,evidence:'NATIVE_PRODUCT_PROBABILISTIC_PRODUCERS / SYNTHETIC_SCENARIO; no natural-rate claim'}));
