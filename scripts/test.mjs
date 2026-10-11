import {mkdirSync,readFileSync,writeFileSync,createWriteStream,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {spawn,execFileSync} from 'node:child_process';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {inventory,manual} from './test-manifest.mjs';

const rootURL=new URL('../',import.meta.url),root=fileURLToPath(rootURL);
const mode=process.argv[2],arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const allowed=new Set(['only','playwright','browser','baseline','output','reuse']);
for(const a of process.argv.slice(3))if(!allowed.has(a.slice(2).split('=')[0])&&!['--self-test-failure','--legacy-careers'].includes(a))throw Error('Unknown option '+a);
if(!['list','quick','full','audit'].includes(mode))throw Error('Usage: node scripts/test.mjs list|quick|full|audit [--only=id,...] [--baseline=ref] [--playwright=module] [--browser=chrome|chromium]');
const entries=[{id:'syntax',file:'scripts/check-syntax.mjs',category:'static',modes:['quick','full','audit'],dependencies:'Node',seconds:8,browser:false,network:false},...inventory(rootURL)];
if(mode==='list') {
  for(const e of entries)console.log(`${e.id}\n  ${e.category}; modes=${e.modes.join(',')||'manual/import only'}; ~${e.seconds}s; browser=${e.browser}; network=${e.network}\n  ${e.modes.length?'node '+e.file+' '+(e.args||[]).join(' '):'Not executed'}\n  Dependencies: ${e.dependencies}${e.reason?'\n  '+e.reason:''}${e.quick?'\n  quick: '+e.quick.join(' '):''}${e.comparison?'\n  Comparison: resolved --baseline, passed as --'+e.comparison:''}\n  Historical fixtures/default refs: ${(e.historicalRefs||[]).join(',')||'none'}`);
  for(const e of manual)console.log(`${e.id}: SKIP (manual) — ${e.reason}`);
  console.log(`Inventory: ${entries.length-1} tests files, ${entries.filter(e=>e.modes.length).length} registered automatic entries including syntax.`);
  process.exit(0);
}
const only=arg('only')?.split(',');
if(only)for(const id of only)if(!entries.some(e=>e.id===id))throw Error('Unknown test '+id);
const selected=entries.filter(e=>only?only.includes(e.id):e.modes.includes(mode));
const started=Date.now(),output=path.resolve(root,arg('output')||`test-results/${new Date().toISOString().replace(/[:.]/g,'-')}-${mode}`);
mkdirSync(path.join(output,'tmp'),{recursive:true});
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const fingerprint=createHash('sha256');
const toolFiles=readdirSync(path.join(root,'scripts'),{recursive:true,withFileTypes:true}).filter(f=>f.isFile()&&f.name.endsWith('.mjs')).map(f=>path.relative(root,path.join(f.parentPath,f.name)).replaceAll('\\','/'));
for(const file of [...new Set([...toolFiles,...entries.map(e=>e.file),...git('ls-files','-z','docs').split('\0').filter(Boolean)])].sort())fingerprint.update(file).update(readFileSync(path.join(root,file)));
const report={mode,started:new Date(started).toISOString(),head:git('rev-parse','HEAD'),branch:git('branch','--show-current'),sourceFingerprint:fingerprint.digest('hex'),node:process.version,platform:process.platform,version:readFileSync(path.join(root,'docs/src/config.js'),'utf8').match(/VERSION\s*=\s*['"]([^'"]+)/)?.[1],baselineRef:arg('baseline')||'origin/main',results:[],manual};
let baselineError,browserError;
try{report.baseline=git('rev-parse',report.baselineRef+'^{commit}');git('cat-file','-e',report.baseline+':docs/src/engine/game.js');}catch(e){baselineError='Unavailable comparison baseline: '+e.message;}
const modulePath=arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright',channel=arg('browser')||process.env.TEST_BROWSER||'chrome';
if(selected.some(e=>e.browser)) {
  try{const req=createRequire(import.meta.url),{chromium}=req(modulePath);const b=await chromium.launch({channel,headless:true});report.browser={channel,version:b.version(),playwrightVersion:JSON.parse(readFileSync(path.join(path.dirname(req.resolve(modulePath)),'package.json'),'utf8')).version};await b.close();}catch(e){browserError='Playwright/browser prerequisite unavailable: '+e.message;}
}
let reuse;
if(arg('reuse')) {
  const source=path.resolve(root,arg('reuse'));
  reuse=JSON.parse(readFileSync(source,'utf8'));
  for(const key of ['sourceFingerprint','baseline','node','platform'])if(reuse[key]!==report[key])throw Error('Cannot reuse changed '+key);
  if(JSON.stringify(reuse.browser)!==JSON.stringify(report.browser))throw Error('Cannot reuse a different browser');
  report.reuseSource=source;
}
const env={...process.env,TEMP:path.join(output,'tmp'),TMP:path.join(output,'tmp'),TMPDIR:path.join(output,'tmp')};
async function execute(e,args) {
  const begin=Date.now(),logPath=path.join(output,e.id.replaceAll('/','-')+'.log'),log=createWriteStream(logPath);
  console.log(`RUN ${e.id}: node ${args.join(' ')}`);
  const result=await new Promise(resolve=>{
    const child=spawn(process.execPath,args,{cwd:root,env,detached:process.platform!=='win32',stdio:['ignore','pipe','pipe']});
    child.stdout.on('data',d=>log.write(d));child.stderr.on('data',d=>log.write(d));
    const heartbeat=setInterval(()=>console.log(`RUN ${e.id}: ${((Date.now()-begin)/1000).toFixed(0)}s; log ${logPath}`),30000);
    let timedOut=false,spawnError;
    const timer=setTimeout(()=>{timedOut=true;if(process.platform==='win32')spawn('taskkill',['/PID',String(child.pid),'/T','/F']);else try{process.kill(-child.pid,'SIGKILL');}catch{}},Math.max(180,e.seconds*4)*1000);
    child.on('error',error=>{spawnError=String(error);});
    child.on('close',(exitCode,signal)=>{clearTimeout(timer);clearInterval(heartbeat);log.end(()=>resolve({id:e.id,status:exitCode===0&&!timedOut&&!spawnError?'PASS':'FAIL',exitCode,signal,seconds:(Date.now()-begin)/1000,command:[process.execPath,...args],log:logPath,logSha256:createHash('sha256').update(readFileSync(logPath)).digest('hex'),timedOut,error:spawnError}));});
  });
  report.results.push(result);console.log(`${result.status} ${e.id} (${result.seconds.toFixed(2)}s, exit=${result.exitCode})`);
  if(result.status==='FAIL')console.log(readFileSync(logPath,'utf8').slice(-3000));
}
for(const e of selected) {
  let historyError;
  const refs={};
  for(const ref of e.historicalRefs||[])try{refs[ref]=git('rev-parse',ref+'^{commit}');}catch(error){historyError='Missing historical fixture Git ref '+ref+': '+error.message;}
  const reason=!e.modes.length?e.reason:e.browser&&browserError?browserError:e.comparison&&baselineError?baselineError:historyError;
  if(reason){const status=e.modes.length?'BLOCKED':'SKIP';report.results.push({id:e.id,status,reason,exitCode:null,seconds:0});console.log(`${status} ${e.id}: ${reason}`);continue;}
  const flags=process.argv.includes('--legacy-careers')&&e.args?.some(a=>a==='--ui-only'||a==='--quick'||a.startsWith('--only-seed='))?[]:mode==='quick'&&e.quick?e.quick:e.args||[];
  const args=[e.file,...flags];
  if(e.browser)args.push('--playwright='+modulePath,'--browser='+channel);
  if(e.comparison)args.push('--'+e.comparison+'='+report.baseline);
  const previous=reuse?.results.find(r=>r.id===e.id&&r.status==='PASS'&&r.exitCode===0&&JSON.stringify(r.command)===JSON.stringify([process.execPath,...args]));
  if(previous&&previous.logSha256===createHash('sha256').update(readFileSync(previous.log)).digest('hex')) {
    report.results.push({...previous,seconds:0,originalSeconds:previous.originalSeconds??previous.seconds,reusedFrom:report.reuseSource});
    console.log(`PASS ${e.id} (verified prior execution reused; ${previous.log})`);continue;
  }
  await execute(e,args);
  report.results.at(-1).historicalRefs=refs;
}
if(process.argv.includes('--self-test-failure'))await execute({id:'intentional-runner-failure',seconds:1},['--input-type=module','-e','console.error("intentional runner failure");process.exit(17)']);
if(mode==='audit'&&!only)for(const e of [...entries.filter(e=>!e.modes.length),...manual])report.results.push({id:e.id,status:'SKIP',reason:e.reason,exitCode:null,seconds:0});
report.seconds=(Date.now()-started)/1000;
report.counts=Object.fromEntries(['PASS','FAIL','SKIP','BLOCKED'].map(s=>[s,report.results.filter(r=>r.status===s).length]));
report.executed=report.results.filter(r=>r.command&&!r.reusedFrom).length;
report.reused=report.results.filter(r=>r.reusedFrom).length;
writeFileSync(path.join(output,'summary.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({counts:report.counts,seconds:report.seconds,report:path.join(output,'summary.json')}));
process.exitCode=report.counts.FAIL||report.counts.BLOCKED?1:0;
