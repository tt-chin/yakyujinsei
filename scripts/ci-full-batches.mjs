// CI-only orchestration. The test Runner, profile flags and assertions stay unchanged.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,existsSync,statfsSync,mkdtempSync,chmodSync,symlinkSync,unlinkSync,rmdirSync} from 'node:fs';
import {spawnSync,execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {inventory} from './test-manifest.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const hash=data=>createHash('sha256').update(data).digest('hex');
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const write=(p,v)=>writeFileSync(p,JSON.stringify(v,null,2)+'\n');
function environment(){
  const disk=statfsSync(root);
  return {node:process.version,platform:process.platform,arch:process.arch,osRelease:os.release(),totalMemory:os.totalmem(),freeMemory:os.freemem(),diskAvailableBytes:disk.bavail*disk.bsize,runnerOS:process.env.RUNNER_OS??null,imageOS:process.env.ImageOS??null,imageVersion:process.env.ImageVersion??null};
}
export function fullIds(){return ['syntax',...inventory(new URL('../',import.meta.url)).filter(e=>e.modes.includes('full')).map(e=>e.id)];}
export function fullSeconds(){return new Map(inventory(new URL('../',import.meta.url)).filter(e=>e.modes.includes('full')).map(e=>[e.id,e.seconds]));}
export const DEFAULT_SECONDS=5;
// LPT: heaviest first (ties by inventory order) into the lightest batch (ties by lowest index); each batch keeps inventory order for test.mjs --only.
export function splitIds(ids,count=8,weightOf=()=>undefined){
  assert.ok(ids.length>=count&&new Set(ids).size===ids.length);
  const weight=id=>weightOf(id)??DEFAULT_SECONDS,order=new Map(ids.map((id,i)=>[id,i]));
  const batches=Array.from({length:count},()=>({ids:[],sum:0}));
  for(const id of [...ids].sort((a,b)=>weight(b)-weight(a)||order.get(a)-order.get(b))){
    const b=batches.reduce((m,x)=>x.sum<m.sum?x:m);b.ids.push(id);b.sum+=weight(id);
  }
  return batches.map(b=>b.ids.sort((x,y)=>order.get(x)-order.get(y)));
}
export function validatePlan(plan,ids){
  assert.equal(plan.mode,'full');assert.equal(plan.batches.length,8);
  const flat=plan.batches.flat(),order=new Map(ids.map((id,i)=>[id,i]));
  assert.equal(new Set(flat).size,flat.length,'Duplicate entry');
  assert.deepEqual([...flat].sort(),[...ids].sort(),'Full inventory changed or omitted');
  assert.ok(plan.batches.every(b=>b.length&&b.every((id,i)=>!i||order.get(b[i-1])<order.get(id))),'Empty batch or batch not in inventory order');
}
export function linuxTempAlias(target){
  mkdirSync(target,{recursive:true});
  const parent=mkdtempSync('/tmp/yj-');chmodSync(parent,0o700);
  const alias=path.join(parent,'t');
  try{symlinkSync(path.resolve(target),alias,'dir');}catch(e){rmdirSync(parent);throw e;}
  return {alias,release(){unlinkSync(alias);rmdirSync(parent);}}; // Never delete the evidence target.
}
export function runBatch(plan,index,output,execute=spawnSync){
  const ids=plan.batches[index-1];assert.ok(ids,'Invalid batch');
  const dir=path.join(output,'batch-'+index);mkdirSync(dir,{recursive:true});
  const receiptFile=path.join(dir,'batch.json');assert.ok(!existsSync(receiptFile),'Refuse to overwrite batch evidence');
  const args=['scripts/test.mjs','full','--only='+ids.join(','),'--baseline='+plan.baseline,'--output='+dir];
  const temp=process.platform==='linux'?linuxTempAlias(path.join(dir,'tmp')):null;
  if(temp)args.push('--temp-root='+temp.alias);
  const receipt={head:plan.head,runId:plan.runId,runAttempt:plan.runAttempt,index,ids,planHash:hash(JSON.stringify(plan)),command:[process.execPath,...args],status:'RUNNING',started:new Date().toISOString(),environment:environment()};
  write(receiptFile,receipt);
  let r;
  try{r=execute(process.execPath,args,{cwd:root,stdio:'inherit',env:process.env});}
  finally{temp?.release();}
  Object.assign(receipt,{status:'COMPLETED',exitCode:r.status,signal:r.signal??null,error:r.error?.message??null,completed:new Date().toISOString()});
  write(receiptFile,receipt);
  return r.status===0&&!r.signal&&!r.error?0:1;
}
export function aggregate(plan,output,ids){
  validatePlan(plan,ids);
  const results=[],issues=[],batches=[];let common,browser;
  for(let i=1;i<=plan.batches.length;i++){
    try{
      const dir=path.join(output,'batch-'+i),receipt=read(path.join(dir,'batch.json')),r=read(path.join(dir,'summary.json'));
      assert.equal(receipt.planHash,hash(JSON.stringify(plan)),'Plan hash');
      for(const k of ['head','runId','runAttempt'])assert.equal(receipt[k],plan[k],k);
      assert.equal(receipt.index,i);assert.deepEqual(receipt.ids,plan.batches[i-1]);
      assert.equal(receipt.status,'COMPLETED','Interrupted batch');assert.ok(Number.isInteger(receipt.exitCode),'Missing exit code');
      assert.equal(receipt.signal,null);assert.equal(receipt.error,null);
      assert.equal(r.mode,'full');assert.equal(r.head,plan.head);assert.equal(r.baseline,plan.baseline);
      assert.equal(r.reused,0,'No cached PASS');assert.ok(!r.reuseSource);
      assert.deepEqual(r.results.map(x=>x.id),plan.batches[i-1],'Missing/extra/duplicate entries');
      const metadata=JSON.stringify([r.sourceFingerprint,r.node,r.platform,r.version,r.baseline]);
      assert.ok(r.sourceFingerprint&&r.node&&r.platform&&r.version);
      common??=metadata;assert.equal(metadata,common,'Inconsistent source/environment');
      if(r.browser){assert.equal(r.browser.channel,plan.browser);assert.ok(r.browser.version&&r.browser.playwrightVersion);browser??=JSON.stringify(r.browser);assert.equal(JSON.stringify(r.browser),browser,'Browser changed between batches');}
      const counts=Object.fromEntries(['PASS','FAIL','SKIP','BLOCKED'].map(s=>[s,r.results.filter(x=>x.status===s).length]));
      assert.deepEqual(r.counts,counts,'Incorrect batch counts');
      assert.equal(r.executed,r.results.filter(x=>x.command).length,'Incorrect execution count');
      for(const x of r.results){
        assert.ok(['PASS','FAIL','SKIP','BLOCKED'].includes(x.status),'Invalid status');
        assert.ok(!x.reusedFrom,'No cached result');
        if(x.status==='PASS'){assert.equal(x.exitCode,0,x.id+' exit');assert.ok(!x.timedOut&&!x.error&&!x.signal&&x.command);}
        if(!x.command){assert.ok(['SKIP','BLOCKED'].includes(x.status));continue;}
        const log=path.resolve(x.log),base=path.resolve(dir)+path.sep;
        assert.ok(log.startsWith(base),'Log outside batch');
        assert.equal(hash(readFileSync(log)),x.logSha256,'Missing/corrupt log');
      }
      results.push(...r.results);
      const good=receipt.exitCode===0&&r.results.every(x=>x.status==='PASS');
      if(!good)issues.push({batch:i,error:'Batch exit/status is not a complete PASS'});
      batches.push({index:i,status:good?'PASS':'FAIL_OR_INCOMPLETE',exitCode:receipt.exitCode,counts,seconds:r.seconds});
    }catch(e){issues.push({batch:i,error:e.message});batches.push({index:i,status:'NOT_ACCEPTED'});}
  }
  const order=new Map(ids.map((id,i)=>[id,i]));results.sort((a,b)=>order.get(a.id)-order.get(b.id));
  const pass=issues.length===0&&results.length===ids.length;
  const counts=Object.fromEntries(['PASS','FAIL','SKIP','BLOCKED'].map(s=>[s,results.filter(r=>r.status===s).length]));
  return {mode:'full',head:plan.head,runId:plan.runId,runAttempt:plan.runAttempt,baseline:plan.baseline,expected:ids.length,status:pass?'PASS':'FAIL_OR_INCOMPLETE',counts,acceptedPass:counts.PASS,unverified:ids.length-results.length,batches,issues,results,artifactCoverage:'ARTIFACT_COVERAGE_BLOCKED'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [command,index]=process.argv.slice(2),output=path.resolve(root,process.argv.find(a=>a.startsWith('--output='))?.slice(9)||'test-results/ci-full'),planFile=path.join(output,'plan.json');
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
  if(command==='plan'){
    mkdirSync(output,{recursive:true});assert.ok(!existsSync(planFile),'Refuse to overwrite evidence');
    const head=git('rev-parse','HEAD'),seconds=fullSeconds();if(process.env.GITHUB_SHA)assert.equal(head,process.env.GITHUB_SHA);
    const plan={mode:'full',head,runId:process.env.GITHUB_RUN_ID||'LOCAL',runAttempt:process.env.GITHUB_RUN_ATTEMPT||'LOCAL',browser:process.env.TEST_BROWSER||'chrome',baseline:git('rev-parse','origin/main^{commit}'),batches:splitIds(fullIds(),8,id=>seconds.get(id))};
    validatePlan(plan,fullIds());write(planFile,plan);console.log(JSON.stringify(plan,null,2));
  }else{
    assert.ok(['run','aggregate'].includes(command),'Usage: plan | run <1..8> | aggregate');
    const plan=read(planFile);validatePlan(plan,fullIds());assert.equal(plan.head,git('rev-parse','HEAD'));
    for(const [key,env]of [['runId','GITHUB_RUN_ID'],['runAttempt','GITHUB_RUN_ATTEMPT']])assert.equal(plan[key],process.env[env]||'LOCAL');
    if(command==='run')process.exitCode=runBatch(plan,Number(index),output);
    else{const summary=aggregate(plan,output,fullIds());write(path.join(output,'summary.json'),summary);console.log(JSON.stringify(summary.batches));console.log(JSON.stringify({status:summary.status,expected:summary.expected,acceptedPass:summary.acceptedPass,issues:summary.issues}));process.exitCode=summary.status==='PASS'?0:1;}
  }
}
