// Supplement only: observe existing native transaction calls and private
// receipts. Never create transactions merely to inspect them. No product edits.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
import {harness,instrument,arg} from '../../tests/support/stage6-browser.mjs';
import {validateAwardHistory} from './historical-comparison.mjs';
assert(arg('output'),'Explicit fresh output required');
assert(!fs.existsSync(arg('output')),'Never overwrite existing evidence');
const h=await harness('development-b-receipt-careers');
const strategy=fs.readFileSync('tools/development-b/careers.mjs','utf8');
const match=strategy.match(/const extras=String\.raw`([\s\S]*?)`;\r?\nfunction observed/);
assert(match,'Use the exact already accepted natural-career strategy and observers');
const source=fs.readFileSync('docs/src/engine/game.js','utf8');
const original='import {annualAwardTransaction,annualStateTransaction,';
assert.equal(source.split(original).length,2);
const observedSource=source.replace(original,'import {annualAwardTransaction as __bNativeAwardTransaction,annualStateTransaction as __bNativeStateTransaction,');
// Wrappers forward each original call once and preserve the actual token.
// inspectAwardTransaction is a read-only clone; no extra state transaction call.
const prelude=`import {inspectAwardTransaction as __bInspect} from './award-transaction-policy.js';
const __bTokens=new Map(),__bVersions=new Map();
const annualAwardTransaction=(...a)=>{const t=__bNativeAwardTransaction(...a);__bTokens.set(t,{state:a[0],kind:'AWARD'});return t;};
const annualStateTransaction=(...a)=>{const t=__bNativeStateTransaction(...a);__bTokens.set(t,{state:a[0],kind:'STATE'});return t;};
`;
const body=instrument(observedSource),at=body.lastIndexOf('})();');assert(at>0);
// Lossless revision references: unchanged historical private journals are not
// copied into hundreds of subsequent step records. Every changed full value is
// saved, and every step retains its complete ordered revision references.
const receiptHook=`
window.__bReceiptHistory=()=>{
 const order=[],changes=[];let index=0;
 for(const [token,v] of __bTokens){if(v.state!==S)continue;
  const journal=__bInspect(token),text=JSON.stringify(journal),last=__bVersions.get(token);
  const revision=last?last.revision+(last.text===text?0:1):0;
  if(!last||last.text!==text){changes.push({index,revision,kind:v.kind,journal});__bVersions.set(token,{text,revision});}
  order.push({index,revision,kind:v.kind});index++;
 }
 return {order,changes};
};
window.__bReceiptFinal=()=>[...__bTokens].filter(([,v])=>v.state===S).map(([token,v])=>({kind:v.kind,journal:__bInspect(token)}));`;
const served=prelude+body.slice(0,at)+match[1]+receiptHook+body.slice(at);
const cases=[{seed:'yakyo-test-001',pos:'P',effort:'通常投球'},{seed:'jp3-pitcher-02',pos:'P',effort:'省エネ投球'},{seed:'jp3-pitcher-03',pos:'P',effort:'全力投球'},{seed:'jp3-infielder-01',pos:'IF',effort:'通常投球'}];
const sha=s=>createHash('sha256').update(s).digest('hex');
async function run(input,width){
 const p=await h.page(width,input.pos,input.seed);
 await p.route('**/src/engine/game.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:served}));
 await p.reload();await p.waitForFunction(()=>!!window.__g1step&&!!window.__bReceiptHistory);
 await p.locator('#seg-pos [data-v="'+input.pos+'"]').click();await p.locator('#btn-start').click();
 const steps=[];
 for(let n=0;n<2500;n++){
  const result=await p.evaluate(e=>{const receiptsBefore=window.__bReceiptHistory(),step=window.__g1step(e);return step&&{...step,receiptsBefore,receiptsAfter:window.__bReceiptHistory()};},input.effort);
  if(!result)break;steps.push(result);assert(n<2499,'CAREER_LIMIT');
 }
 const snap=await h.get(p),events=await p.evaluate(()=>window.__g1events),receipts=await p.evaluate(()=>window.__bReceiptFinal());
 assert.equal(snap.state.done,true);validateAwardHistory(snap.state);
 const result={input,width,steps,events,state:snap.state,rng:snap.rng,receipts};
 await p.close();return result;
}
function ordinaryTrace(result){
 return {input:result.input,width:result.width,steps:result.steps.map(({receiptsBefore,receiptsAfter,...step})=>step),events:result.events,state:result.state,rng:result.rng};
}
for(const [i,input] of cases.entries())await h.test(input.seed+'-'+input.pos,input,async entry=>{
 const width=[1280,320,390,1280][i],first=await run(input,width);
 await h.save(input.seed+'-'+input.pos+'-first',first);
 const repeat=await run(input,width);await h.save(input.seed+'-'+input.pos+'-repeat',repeat);
 assert(isDeepStrictEqual(first,repeat),'Complete same-B S/choices/RNG/Decisions AND every private receipt before/after/status/order must match');
 const baselineFile=path.join('test-results/development-b-careers-locked',input.seed+'-'+input.pos+'.career.json');
 const baseline=JSON.parse(fs.readFileSync(baselineFile,'utf8'));
 assert(isDeepStrictEqual(ordinaryTrace(first),baseline),'Observer must leave the complete already verified B trace unchanged; no ignored S/Decision/RNG fields');
 assert.equal(first.receipts.some(r=>r.kind==='AWARD'),(first.state.awardDecisions||[]).length>0,'award transactions correspond to actual first-team Decisions; second-team-only routes must not invent one');
 const receiptRows=first.receipts.flatMap(r=>r.journal.receipts);
 assert(receiptRows.length>0);assert(receiptRows.every(r=>r.status==='COMMITTED'));
 assert(receiptRows.every(r=>r.writes.every(w=>w.status==='WRITTEN')),'native commitAwardReceipt marks fields WRITTEN and the receipt COMMITTED');
 entry.sourceSha256=sha(source);entry.strategySha256=sha(strategy);entry.baselineSha256=sha(fs.readFileSync(baselineFile));
 entry.actions=first.steps.length;entry.rngCalls=first.rng.length;entry.transactions=first.receipts.length;entry.receipts=receiptRows.length;
 entry.result='NATIVE_NATURAL_CAREER_SAME_B_COMPLETE_PRIVATE_RECEIPTS_AND_ZERO_OBSERVER_DIFFERENCE';
});
const result=await h.finish();process.exit(result.fail||result.errors.length?1:0);
