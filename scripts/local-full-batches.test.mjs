import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {runPool,acceptedLocalRun,newOutput,sourceIdentity,waitForMemory} from './local-full-batches.mjs';
import {fullIds,fullSeconds,splitIds,validatePlan} from './ci-full-batches.mjs';
const ids=[1,2,3,4,5,6,7,8],wait=ms=>new Promise(r=>setTimeout(r,ms));
test('exact existing eight-way Full partition; every entry once',()=>{
 const all=fullIds(),seconds=fullSeconds(),batches=splitIds(all,8,id=>seconds.get(id));
 validatePlan({mode:'full',batches},all);assert.equal(batches.length,8);assert.equal(new Set(batches.flat()).size,all.length);
});
test('eight jobs once; maximum two active; failed job does not skip remaining batches',async()=>{
 let active=0,peak=0;const seen=[];
 const r=await runPool(ids,2,async index=>{active++;peak=Math.max(peak,active);seen.push(index);await wait(5);active--;return {exitCode:index===3?1:0};});
 assert.equal(peak,2);assert.deepEqual(seen,ids);assert.equal(r.length,8);assert.equal(r[2].exitCode,1);
 assert.equal(acceptedLocalRun({status:'PASS'},r),false);
});
test('spawn error remains failure and all other batches run',async()=>{
 const r=await runPool(ids,2,async index=>{if(index===2)throw Error('spawn failed');return {exitCode:0};});
 assert.equal(r.length,8);assert.equal(r[1].error,'spawn failed');assert.equal(acceptedLocalRun({status:'PASS'},r),false);
});
test('stop prevents queued jobs; already running jobs preserve evidence',async()=>{
 let stopped=false;const evidence=[];
 const r=await runPool(ids,2,async index=>{await wait(5);evidence.push(index);stopped=true;return {exitCode:0};},{shouldStop:()=>stopped});
 assert.deepEqual(r.map(x=>x.index),[1,2]);assert.deepEqual(evidence,[1,2]);assert.equal(acceptedLocalRun({status:'PASS'},r,{stopped}),false);
});
test('source change/missing batch/aggregate FAIL/signal/error cannot PASS',()=>{
 const ok=ids.map(index=>({index,exitCode:0}));assert(acceptedLocalRun({status:'PASS'},ok));
 assert(!acceptedLocalRun({status:'PASS'},ok,{sourceChanged:true}));
 assert(!acceptedLocalRun({status:'PASS'},ok,{stopped:true}));
 assert(!acceptedLocalRun({status:'PASS'},ok,{resourceBlocked:true}));
 assert(!acceptedLocalRun({status:'PASS'},ok.slice(1)));
 assert(!acceptedLocalRun({status:'FAIL_OR_INCOMPLETE'},ok));
 assert(!acceptedLocalRun(null,ok));
 for(const bad of [{signal:'SIGTERM'},{error:'spawn failed'},{exitCode:1}])assert(!acceptedLocalRun({status:'PASS'},ok.map((r,i)=>i? r:{...r,...bad})));
});
test('reject duplicate jobs and concurrency above two',async()=>{
 await assert.rejects(runPool(ids,8,()=>{}));await assert.rejects(runPool(ids,0,()=>{}));await assert.rejects(runPool([1,1],2,()=>{}));
});
test('real child processes: independent outputs, failure exit retained, all eight scheduled',async()=>{
 const output=mkdtempSync(path.join(os.tmpdir(),'local-full-scheduler-'));let active=0,peak=0;
 const r=await runPool(ids,2,index=>new Promise(resolve=>{
   active++;peak=Math.max(peak,active);
   const code=`require('fs').writeFileSync(process.argv[1],JSON.stringify({index:${index}}));setTimeout(()=>process.exit(${index===4?7:0}),10);`;
   const p=spawn(process.execPath,['-e',code,path.join(output,index+'.json')]);
   p.on('close',(exitCode,signal)=>{active--;resolve({exitCode,signal});});
 }));
 assert.equal(peak,2);assert.equal(r[3].exitCode,7);assert(!acceptedLocalRun({status:'PASS'},r));
 for(const index of ids)assert.deepEqual(JSON.parse(readFileSync(path.join(output,index+'.json'))),{index});
});
test('new output refuses overwrite and escaping test-results',()=>{
 const output=newOutput('test-results/local-scheduler-contract-'+Date.now());writeFileSync(path.join(output,'keep'),'original');
 assert.throws(()=>newOutput(output));assert.equal(readFileSync(path.join(output,'keep'),'utf8'),'original');
 assert.throws(()=>newOutput('test-results'));assert.throws(()=>newOutput('../outside'));
});
test('source identity includes dirty/untracked imported tools and tests',()=>{
 const before=sourceIdentity(),after=sourceIdentity();assert.deepEqual(before,after);
 assert(before.sources.some(x=>x.file==='tools/development-b/championmaker-comparison.mjs'));
 assert(before.sources.some(x=>x.file==='scripts/local-full-batches.mjs'));
 assert(before.sources.some(x=>x.file==='tests/kbo-renewal-e2e.mjs'));
});
test('low-memory wait resumes when headroom returns; no timeout/assertion changes',async()=>{
 let clock=0,reads=0;const records=[];
 const ready=await waitForMemory({readFree:()=>++reads<3?1024:4096,minBytes:2048,now:()=>clock,pause:async ms=>{clock+=ms;},onWait:r=>records.push(r)});
 assert.equal(ready,true);assert.equal(reads,3);assert.equal(records.length,2);assert.equal(clock,2000);
});
test('persistent low RAM or cancellation never launches an accepted Full',async()=>{
 let clock=0;assert.equal(await waitForMemory({readFree:()=>0,now:()=>clock,timeoutMs:3000,pause:async ms=>{clock+=ms;}}),false);assert.equal(clock,3000);
 assert.equal(await waitForMemory({shouldStop:()=>true,readFree:()=>{throw Error('must not read');}}),false);
});
