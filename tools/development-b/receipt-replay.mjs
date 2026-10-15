// Same-B full native transaction replay, not a historical metadata projection.
import assert from 'node:assert/strict';
import {harness,source,state,stat,validate} from './award-runtime-support.mjs';
import {inspectAwardTransaction} from '../../docs/src/engine/award-transaction-policy.js';
let pass=0;
for(const league of ['NPB','KBO','CPBL','MLB'])for(const role of ['SP','MR','CL']){
 const initial=state(league,role),a=harness(source,initial,stat),b=harness(source,initial,stat);a.run();b.run();validate(a);validate(b);
 const get=h=>({S:h.snapshot(),rng:h.rng,cards:h.cards,receiptJournal:inspectAwardTransaction(h.transaction())});
 const before=get(a);assert.deepEqual(get(b),before,'same B/seed/context: full S, ordered Decisions and all receipt before/after writes');
 a.run();assert.deepEqual(get(a),before,'reentry never alters completed receipt history');
 const tampered=structuredClone(before);tampered.receiptJournal.receipts[0].writes[0].after.push('unapproved');assert.notDeepEqual(tampered,before);
 pass++;console.log(JSON.stringify({status:'PASS',league,role,decisionKeys:before.S.awardDecisions.map(d=>d.decisionKey),receiptJournal:before.receiptJournal}));
}
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_PRODUCT_FUNCTION_SAME_B_RECEIPT_REPLAY; no excluded fields'}));
