// Explicit CI-tool tests; not a new game Full entry. Run directly with Node.
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,writeFileSync,readFileSync,unlinkSync,mkdirSync,statSync,realpathSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fullIds,fullSeconds,DEFAULT_SECONDS,splitIds,validatePlan,runBatch,aggregate,linuxTempAlias} from './ci-full-batches.mjs';
test('Linux socket pathname budget (107 bytes excluding NUL)',()=>{
 const suffix='/org.chromium.Chromium.ABCDEF/SingletonSocket';
 assert.ok(Buffer.byteLength('/tmp/yj-ABCDEF/t'+suffix)<108);
 assert.ok(Buffer.byteLength('/home/runner/work/yakyujinsei/yakyujinsei/test-results/ci-full/batch-2/tmp'+suffix)>=108);
});
test('Linux aliases unique, private, evidence preserved after cleanup',{skip:process.platform!=='linux'},()=>{
 const target=mkdtempSync(path.join(os.tmpdir(),'alias-target-'));
 const a=linuxTempAlias(target),b=linuxTempAlias(target);
 assert.notEqual(a.alias,b.alias);assert.equal(statSync(path.dirname(a.alias)).mode&0o777,0o700);
 assert.equal(realpathSync(a.alias),realpathSync(target));
 writeFileSync(path.join(a.alias,'evidence'),'keep');a.release();b.release();
 assert.equal(existsSync(a.alias),false);assert.equal(readFileSync(path.join(target,'evidence'),'utf8'),'keep');
});

const ids=fullIds(),temp=mkdtempSync(path.join(os.tmpdir(),'ci-batches-contract-'));
const hash=s=>createHash('sha256').update(s).digest('hex');
const write=(p,v)=>writeFileSync(p,JSON.stringify(v));
let serial=0;
function fixture(){
 const output=path.join(temp,String(++serial));mkdirSync(output);
 const plan={mode:'full',head:'a'.repeat(40),baseline:'b'.repeat(40),runId:'123',runAttempt:'2',browser:'chromium',batches:splitIds(ids)};
 for(let i=1;i<=8;i++){
  assert.equal(runBatch(plan,i,output,(_exe,args)=>{
   const dir=args.find(x=>x.startsWith('--output=')).slice(9);
   assert.deepEqual(args.slice(0,4),['scripts/test.mjs','full','--only='+plan.batches[i-1].join(','),'--baseline='+plan.baseline]);
   const results=plan.batches[i-1].map(id=>{
    const log=path.join(dir,id+'.log');writeFileSync(log,'original fixture evidence '+id);
    return{id,status:'PASS',exitCode:0,command:['node',id],log,logSha256:hash(readFileSync(log)),timedOut:false};
   });
   write(path.join(dir,'summary.json'),{mode:'full',head:plan.head,baseline:plan.baseline,sourceFingerprint:'fixed-source',node:process.version,platform:process.platform,version:'1.13.0',browser:{channel:'chromium',version:'151',playwrightVersion:'1.62.1'},reused:0,executed:results.length,counts:{PASS:results.length,FAIL:0,SKIP:0,BLOCKED:0},seconds:1,results});
   return {status:0};
  }),0);
 }
 return {plan,output,file:path.join(output,'batch-2/summary.json'),receipt:path.join(output,'batch-2/batch.json')};
}
function change(file,fn){const r=JSON.parse(readFileSync(file));fn(r);write(file,r);}
test('exact 91 entries, eight duration-balanced disjoint batches in inventory order; unweighted entries assigned',()=>{
 const seconds=fullSeconds(),weight=id=>seconds.get(id)??DEFAULT_SECONDS,order=new Map(ids.map((id,i)=>[id,i]));
 const batches=splitIds(ids,8,id=>seconds.get(id));
 assert.equal(ids.length,91);assert.equal(seconds.has('syntax'),false);
 assert.deepEqual([...batches.flat()].sort(),[...ids].sort());
 assert.ok(batches.every(b=>b.length&&b.every((id,i)=>!i||order.get(b[i-1])<order.get(id))));
 assert.deepEqual(splitIds(ids,8,id=>seconds.get(id)),batches,'Deterministic');
 // Greedy invariant: a batch minus its lightest entry never exceeds the lightest batch (implies max <= max(top, total/8+top)).
 const sums=batches.map(b=>b.reduce((s,id)=>s+weight(id),0));
 batches.forEach((b,i)=>{if(b.length>1)assert.ok(sums[i]-Math.min(...b.map(weight))<=Math.min(...sums),'Batch '+(i+1)+' unbalanced');});
 assert.equal(splitIds([...ids,'future-entry'],8,id=>seconds.get(id)).flat().filter(id=>id==='future-entry').length,1);
 assert.throws(()=>splitIds(['same','same'],1));
});
test('all batches complete, exact command/profile and strict aggregate PASS',()=>{
 const f=fixture(),r=aggregate(f.plan,f.output,ids);assert.equal(r.status,'PASS');assert.equal(r.counts.PASS,91);assert.equal(r.unverified,0);assert.deepEqual(r.results.map(r=>r.id),ids);
 assert.throws(()=>runBatch(f.plan,1,f.output),'cannot overwrite evidence');
});
const faults={
 'missing summary':f=>unlinkSync(f.file),
 'corrupt JSON':f=>writeFileSync(f.file,'{'),
 'missing log':f=>unlinkSync(JSON.parse(readFileSync(f.file)).results[0].log),
 'corrupt log':f=>writeFileSync(JSON.parse(readFileSync(f.file)).results[0].log,'changed'),
 'wrong SHA':f=>change(f.file,r=>r.head='wrong'),
 'wrong baseline':f=>change(f.file,r=>r.baseline='wrong'),
 'changed fingerprint':f=>change(f.file,r=>r.sourceFingerprint='changed'),
 'changed browser':f=>change(f.file,r=>r.browser.version='changed'),
 'duplicate entry':f=>change(f.file,r=>r.results[1]=r.results[0]),
 'missing entry':f=>change(f.file,r=>r.results.pop()),
 'extra entry':f=>change(f.file,r=>r.results.push(r.results[0])),
 'wrong counts':f=>change(f.file,r=>r.counts.PASS++),
 'PASS with nonzero exit':f=>change(f.file,r=>r.results[0].exitCode=1),
 'PASS with timeout':f=>change(f.file,r=>r.results[0].timedOut=true),
 'reused result':f=>change(f.file,r=>r.reused=1),
 'changed Run ID':f=>change(f.receipt,r=>r.runId='another-run'),
 'changed attempt':f=>change(f.receipt,r=>r.runAttempt='another-attempt'),
 'changed plan':f=>change(f.receipt,r=>r.planHash='changed'),
 'runner interrupted':f=>change(f.receipt,r=>{r.status='RUNNING';delete r.exitCode;}),
 'external SIGTERM':f=>change(f.receipt,r=>{r.exitCode=null;r.signal='SIGTERM';}),
 'batch nonzero despite PASS summary':f=>change(f.receipt,r=>r.exitCode=1),
};
for(const [name,fault]of Object.entries(faults))test(name+' cannot produce Full PASS',()=>{
 const f=fixture();fault(f);const r=aggregate(f.plan,f.output,ids);assert.equal(r.status,'FAIL_OR_INCOMPLETE');assert.ok(r.issues.length>0);
});
for(const status of ['FAIL','SKIP','BLOCKED'])test(status+' never counts as PASS',()=>{
 const f=fixture();change(f.file,r=>{const x=r.results[0];x.status=status;x.exitCode=status==='FAIL'?1:null;r.counts.PASS--;r.counts[status]++;});
 const r=aggregate(f.plan,f.output,ids);assert.equal(r.status,'FAIL_OR_INCOMPLETE');assert.equal(r.counts.PASS,90);assert.equal(r.counts[status],1);
});
test('interruption after batch 1 leaves its independent evidence intact',()=>{
 const f=fixture(),before=hash(readFileSync(path.join(f.output,'batch-1/summary.json')));
 unlinkSync(f.file);const r=aggregate(f.plan,f.output,ids);assert.equal(r.batches[0].status,'PASS');assert.equal(hash(readFileSync(path.join(f.output,'batch-1/summary.json'))),before);
});
test('inventory omissions/order changes rejected',()=>{
 const f=fixture(),swapped=structuredClone(f.plan),b=swapped.batches[0];[b[0],b[1]]=[b[1],b[0]];
 f.plan.batches[0].pop();assert.throws(()=>validatePlan(f.plan,ids));
 assert.throws(()=>validatePlan(swapped,ids),/inventory order/);
});
test('native existing Runner executes a selected original test with unchanged full flags',()=>{
 const output=path.join(temp,'native');mkdirSync(output);
 const plan={head:'LOCAL',baseline:'origin/main',runId:'LOCAL',runAttempt:'LOCAL',batches:[['choice-action.test']]};
 assert.equal(runBatch(plan,1,output),0);
 const r=JSON.parse(readFileSync(path.join(output,'batch-1/summary.json')));
 assert.equal(r.mode,'full');assert.deepEqual(r.results.map(x=>x.id),['choice-action.test']);assert.equal(r.results[0].status,'PASS');assert.equal(r.reused,0);
});
test('CLI aggregation of missing plan returns nonzero, not accidental success',()=>{
 const r=spawnSync(process.execPath,['scripts/ci-full-batches.mjs','aggregate','--output='+path.join(temp,'missing-plan')],{encoding:'utf8'});assert.notEqual(r.status,0);
});
console.log('CI batch tests use synthetic reports except the explicitly labelled native Runner case; artifacts at '+temp);
