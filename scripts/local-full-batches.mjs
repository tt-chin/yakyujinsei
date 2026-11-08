// Local-only scheduler. Reuses the CI plan/run/aggregate contracts without
// changing the Runner, Full inventory, flags, timeout or pass criteria.
import assert from 'node:assert/strict';
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {createHash,randomUUID} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync,createWriteStream,statfsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root=fileURLToPath(new URL('../',import.meta.url));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const write=(file,value)=>writeFileSync(file,JSON.stringify(value,null,2)+'\n');
export function sourceIdentity(){
  const files=[...new Set(git('ls-files','-co','--exclude-standard','-z','--','docs','scripts','tests','tools','.github').split('\0').filter(f=>/\.(?:m?js|json|html|css|ya?ml)$/.test(f)))].sort();
  const hash=createHash('sha256');
  const sources=files.map(file=>{const sha256=createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex');hash.update(file).update('\0').update(sha256).update('\0');return {file,sha256};});
  return {head:git('rev-parse','HEAD'),fingerprint:hash.digest('hex'),sources};
}
export function newOutput(directory){
  const output=path.resolve(root,directory),relative=path.relative(path.join(root,'test-results'),output);
  assert(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative),'Output must be a fresh child of test-results');
  mkdirSync(path.dirname(output),{recursive:true});
  mkdirSync(output); // EEXIST is intentional: never overwrite prior evidence.
  return output;
}
export async function runPool(items,concurrency,run,{shouldStop=()=>false}={}){
  assert(Number.isInteger(concurrency)&&concurrency>=1&&concurrency<=2,'Local concurrency must be 1 or 2');
  assert.equal(new Set(items).size,items.length,'Duplicate batch');
  let cursor=0;const results=[];
  async function worker(){
    while(!shouldStop()&&cursor<items.length){
      const item=items[cursor++];
      try{results.push({index:item,...await run(item)});}
      catch(error){results.push({index:item,exitCode:null,error:error.message});}
    }
  }
  await Promise.all(Array.from({length:Math.min(concurrency,items.length)},worker));
  return results.sort((a,b)=>a.index-b.index);
}
// macOS os.freemem() omits reclaimable inactive pages. vm_stat "Pages free"
// excludes speculative pages; purgeable pages already sit in active/inactive.
export function parseVmStat(text){
  const page=String(text).match(/page size of (\d+) bytes/);if(!page)return null;
  const pages=['free','speculative','inactive'].map(name=>String(text).match(new RegExp(`^Pages ${name}:\\s+(\\d+)\\.$`,'m')));
  if(pages.some(x=>!x))return null;
  return pages.reduce((sum,x)=>sum+Number(x[1]),0)*Number(page[1]);
}
export function readAvailableMemory({platform=process.platform,runVmStat=()=>execFileSync('vm_stat',{encoding:'utf8',timeout:5000}),readFree=os.freemem}={}){
  if(platform==='darwin'){try{const bytes=parseVmStat(runVmStat());if(bytes!==null)return bytes;}catch{}}
  return readFree();
}
export async function waitForMemory({readFree=()=>readAvailableMemory(),now=Date.now,pause=ms=>new Promise(r=>setTimeout(r,ms)),minBytes=2*1024**3,timeoutMs=60000,shouldStop=()=>false,onWait=()=>{}}={}){
  const started=now();
  while(!shouldStop()){
    const free=readFree();if(free>=minBytes)return true;
    const waited=now()-started;onWait({freeBytes:free,waitedMs:waited,minBytes});
    if(waited>=timeoutMs)return false;
    await pause(Math.min(1000,timeoutMs-waited));
  }
  return false;
}
export function acceptedLocalRun(summary,executions,{sourceChanged=false,stopped=false,resourceBlocked=false}={}){
  return !sourceChanged&&!stopped&&!resourceBlocked&&summary?.status==='PASS'&&executions.length===8&&
    executions.every((r,i)=>r.index===i+1&&r.exitCode===0&&!r.signal&&!r.error);
}
async function main(){
  assert(process.env.GITHUB_ACTIONS!=='true','Use the existing workflow on GitHub Actions');
  const options={};
  for(const arg of process.argv.slice(2)){
    const match=arg.match(/^--(output|playwright|browser)=(.+)$/);assert(match,'Usage: node scripts/local-full-batches.mjs [--output=test-results/fresh-name] [--playwright=module] [--browser=chrome|chromium]');
    assert(!Object.hasOwn(options,match[1]),'Duplicate option');options[match[1]]=match[2];
  }
  const output=newOutput(options.output||`test-results/local-full-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID().slice(0,8)}`);
  const env={...process.env};
  if(options.playwright)env.PLAYWRIGHT_MODULE=options.playwright;
  if(options.browser)env.TEST_BROWSER=options.browser;
  const identity=sourceIdentity(),started=new Date().toISOString(),disk=statfsSync(root);
  const environment={node:process.version,platform:process.platform,arch:process.arch,osRelease:os.release(),totalMemory:os.totalmem(),initialFreeMemory:os.freemem(),initialAvailableMemory:readAvailableMemory(),diskAvailableBytes:disk.bavail*disk.bsize};
  write(path.join(output,'source-manifest.json'),identity);
  const active=new Map(),completed=[],samples=[],memoryWait=new Map();let stopped=false,sourceChanged=false,resourceBlocked=false,peakConcurrency=0;
  const coordinator=()=>({started,head:identity.head,sourceFingerprint:identity.fingerprint,concurrency:2,peakConcurrency,active:[...active.keys()],completed,stopped,sourceChanged,resourceBlocked,memoryWait:[...memoryWait.values()],minFreeMemoryMiB:2048,resourceWaitLimitSeconds:60,environment,memorySamples:samples});
  const save=()=>write(path.join(output,'coordinator.json'),coordinator());
  function unchanged(){
    try{
      const now=sourceIdentity();
      if(now.head===identity.head&&now.fingerprint===identity.fingerprint)return true;
    }catch(error){console.error('SOURCE_CHECK_FAILED: '+error.message);}
    sourceChanged=true;save();return false;
  }
  function stop(signal){
    if(stopped)return;stopped=true;save();console.error(`STOP ${signal}: no further batches will start`);
    for(const child of active.values())if(child.pid&&child.exitCode===null&&child.signalCode===null){
      if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{stdio:'ignore'});
      else try{process.kill(-child.pid,'SIGTERM');}catch{}
    }
  }
  const onInt=()=>stop('SIGINT'),onTerm=()=>stop('SIGTERM');
  process.on('SIGINT',onInt);process.on('SIGTERM',onTerm);
  let timer;
  try{
    const planLog=execFileSync(process.execPath,['scripts/ci-full-batches.mjs','plan','--output='+output],{cwd:root,env,encoding:'utf8'});
    writeFileSync(path.join(output,'plan.console.log'),planLog);
    const plan=JSON.parse(readFileSync(path.join(output,'plan.json'),'utf8'));
    console.log(`PLAN ${plan.batches.flat().length} entries / 8 batches / max 2 concurrent; ${output}`);
    timer=setInterval(()=>{
      const availableMemory=readAvailableMemory();
      samples.push({time:new Date().toISOString(),osFreeMemory:os.freemem(),availableMemory,coordinatorRss:process.memoryUsage().rss});save();
      console.log(`RUN batches ${[...active.keys()].join(',')||'none'}; completed ${completed.length}/8; available memory ${Math.round(availableMemory/1048576)} MiB`);
    },30000);
    const executions=await runPool([1,2,3,4,5,6,7,8],2,async index=>{
      if(!unchanged())throw Error('SOURCE_CHANGED: batch not started');
      let lastNotice=-1;
      const ready=await waitForMemory({shouldStop:()=>stopped||sourceChanged||resourceBlocked,onWait:sample=>{
        memoryWait.set(index,{index,...sample});
        const notice=Math.floor(sample.waitedMs/10000);if(notice!==lastNotice){lastNotice=notice;save();console.log(`RESOURCE_WAIT batch ${index}; available ${Math.round(sample.freeBytes/1048576)} MiB`);}
      }});
      memoryWait.delete(index);
      if(!ready||resourceBlocked||stopped||sourceChanged){resourceBlocked=resourceBlocked||(!stopped&&!sourceChanged);save();throw Error(resourceBlocked?'RESOURCE_BLOCKED: insufficient free RAM for 60 seconds; batch not started':'STOPPED: batch not started');}
      if(!unchanged())throw Error('SOURCE_CHANGED: batch not started');
      const log=createWriteStream(path.join(output,`batch-${index}.console.log`));
      console.log(`START batch ${index} (${plan.batches[index-1].length} entries)`);
      const result=await new Promise(resolve=>{
        let error;
        const child=spawn(process.execPath,['scripts/ci-full-batches.mjs','run',String(index),'--output='+output],{cwd:root,env,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
        active.set(index,child);peakConcurrency=Math.max(peakConcurrency,active.size);save();
        child.stdout.on('data',data=>log.write(data));child.stderr.on('data',data=>log.write(data));
        child.on('error',e=>{error=e.message;});
        child.on('close',(exitCode,signal)=>log.end(()=>resolve({exitCode,signal,error:error??null})));
      });
      active.delete(index);completed.push({index,...result});unchanged();save();
      console.log(`END batch ${index}: exit=${result.exitCode}, signal=${result.signal||'none'}`);
      return result;
    },{shouldStop:()=>stopped||sourceChanged||resourceBlocked});
    unchanged();
    // Always run the original strict aggregate, including after failure/cancellation.
    // It flags RUNNING/missing/corrupt batches; this scheduler never fabricates PASS.
    const merged=spawnSync(process.execPath,['scripts/ci-full-batches.mjs','aggregate','--output='+output],{cwd:root,env,encoding:'utf8'});
    writeFileSync(path.join(output,'aggregate.console.log'),(merged.stdout||'')+(merged.stderr||''));
    let summary;try{summary=JSON.parse(readFileSync(path.join(output,'summary.json'),'utf8'));}catch{}
    const pass=merged.status===0&&acceptedLocalRun(summary,executions,{sourceChanged,stopped,resourceBlocked});
    write(path.join(output,'local-summary.json'),{...coordinator(),completedAt:new Date().toISOString(),seconds:(Date.now()-Date.parse(started))/1000,status:pass?'PASS':'FAIL_OR_INCOMPLETE',aggregateExitCode:merged.status,executions,counts:summary?.counts??null,expected:plan.batches.flat().length,artifactCoverage:'ARTIFACT_COVERAGE_BLOCKED'});
    console.log(JSON.stringify({status:pass?'PASS':'FAIL_OR_INCOMPLETE',counts:summary?.counts,output}));
    process.exitCode=pass?0:1;
  }finally{clearInterval(timer);process.removeListener('SIGINT',onInt);process.removeListener('SIGTERM',onTerm);save();}
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
