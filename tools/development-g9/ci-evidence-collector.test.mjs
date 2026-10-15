// Manual collector acceptance. Not a new Runner entry; all fixtures stay under ignored test-results.
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash,randomBytes} from 'node:crypto';
import {execFileSync,spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {collectEvidence,verifyEvidence,restoreEvidence,LIMITS} from '../../scripts/collect-ci-evidence.mjs';

const root=fileURLToPath(new URL('../../',import.meta.url)),hash=b=>createHash('sha256').update(b).digest('hex');
const base=await fs.mkdtemp(path.join(root,'test-results','g9-evidence-selftest-')),start=Date.now();
const rows=[];
async function test(id,run){try{await run();rows.push({id,status:'PASS'});console.log('PASS '+id);}catch(error){rows.push({id,status:'FAIL',code:error.code||error.name});console.error('FAIL '+id+' '+error.message);}}
async function fixture(name,{failed=false}={}){
  const dir=path.join(base,name),input=path.join(dir,'input'),output=path.join(dir,'bundle');await fs.mkdir(path.join(input,'tmp'),{recursive:true});
  const log=Buffer.from(failed?'FAIL specimen: original exit 17\n':'PASS specimen\n');await fs.writeFile(path.join(input,'sample.log'),log);
  const summary={mode:'quick',head:'a'.repeat(40),sourceFingerprint:'b'.repeat(64),node:process.version,platform:process.platform,version:'1.13.0',
    counts:{PASS:failed?0:1,FAIL:failed?1:0,SKIP:0,BLOCKED:0},results:[{id:'sample',status:failed?'FAIL':'PASS',exitCode:failed?17:0,seconds:1,command:['node','tests/sample.mjs'],log:'sample.log',logSha256:hash(log)}]};
  await fs.writeFile(path.join(input,'summary.json'),JSON.stringify(summary,null,2));
  return{input,output,dir,summary};
}
async function put(f,rel,value){const p=path.join(f.input,rel);await fs.mkdir(path.dirname(p),{recursive:true});const b=Buffer.isBuffer(value)?value:Buffer.from(typeof value==='string'?value:JSON.stringify(value));await fs.writeFile(p,b);return{path:rel,sha256:hash(b)};}
const req=(...files)=>({schemaVersion:1,files,reviewedBinaries:[]});
const blocked=(r,code)=>{assert.equal(r.status,'EVIDENCE_BLOCKED');assert.ok(r.problems.some(p=>p.code===code),JSON.stringify(r.problems));};
async function rewriteSummary(f){await fs.writeFile(path.join(f.input,'summary.json'),JSON.stringify(f.summary));}
async function mutateIndex(bundle,fn){const p=path.join(bundle,'index.json'),s=JSON.parse(await fs.readFile(p,'utf8'));fn(s);const b=Buffer.from(JSON.stringify(s));await fs.writeFile(p,b);await fs.writeFile(path.join(bundle,'index.sha256'),hash(b)+'\n');}

await test('normal complete summary/log + declared S/RNG/Decision/Receipt',async()=>{
  const f=await fixture('normal');const r=await put(f,'tmp/native.json',{S:{honors:['2039 NPB最多勝利投手賞'],pool:8,careerEarnings:50000000},rng:[.1,.2],awardDecisions:[{id:'sample'}],receipts:[{paid:true}]});
  const result=await collectEvidence({...f,requirements:req(r),repoRoot:root});assert.equal(result.status,'DECLARED_EVIDENCE_COMPLETE');assert.equal(result.coverage.retained,3);assert.equal(result.coverage.formalGates,'NOT_ESTABLISHED');
  const verified=await verifyEvidence({bundle:f.output});assert.equal(verified.integrity,'PASS');assert.ok(verified.index.collection.sources.files['docs/src/config.js']);
});
await test('download copy + external anchor + restore exact original bytes',async()=>{
  const f=await fixture('download');const artifact=await put(f,'tmp/case.json',{state:{honors:[],salary:700000},rng:[0,.999]});await collectEvidence({...f,requirements:req(artifact)});
  const digest=(await fs.readFile(path.join(f.output,'index.sha256'),'utf8')).trim(),download=path.join(f.dir,'download');await fs.cp(f.output,download,{recursive:true});
  const restored=path.join(f.dir,'restored'),r=await restoreEvidence({bundle:download,output:restored,expectedIndexSha256:digest});assert.equal(r.files,3);
  for(const rel of ['summary.json','sample.log',artifact.path])assert.deepEqual(await fs.readFile(path.join(restored,rel)),await fs.readFile(path.join(f.input,rel)));
});
await test('original FAIL/exit17 preserved; all tmp is mandatory',async()=>{
  const f=await fixture('failure',{failed:true});await put(f,'tmp/failed-state.json',{S:{pool:3},rng:[.4],receipt:{done:false}});const before=hash(await fs.readFile(path.join(f.input,'summary.json')));
  const r=await collectEvidence(f);assert.equal(r.status,'DECLARED_EVIDENCE_COMPLETE');assert.equal(r.coverage.retained,3);assert.equal(r.originalResults.counts.FAIL,1);
  assert.equal(hash(await fs.readFile(path.join(f.input,'summary.json'))),before);const out=path.join(f.dir,'restore');await restoreEvidence({bundle:f.output,output:out});assert.equal(JSON.parse(await fs.readFile(path.join(out,'summary.json'))).results[0].exitCode,17);
});
await test('unknown successful output index-only, never called replayable',async()=>{
  const f=await fixture('index-only');await put(f,'tmp/unmapped.json',{state:'not retained'});const r=await collectEvidence(f);assert.equal(r.coverage.indexedOnly,1);assert.equal(r.entries.find(e=>e.path.endsWith('unmapped.json')).storage,'INDEX_ONLY');assert.equal(r.coverage.formalGates,'NOT_ESTABLISHED');
});
await test('missing summary fails closed',async()=>{const f=await fixture('no-summary');await fs.unlink(path.join(f.input,'summary.json'));blocked(await collectEvidence(f),'MISSING_SUMMARY');});
await test('interrupted/truncated summary fails closed',async()=>{const f=await fixture('truncated');await put(f,'summary.json','{"results":');blocked(await collectEvidence(f),'CORRUPT_SUMMARY');});
await test('summary counts conflict',async()=>{const f=await fixture('counts');f.summary.counts.PASS=9;await rewriteSummary(f);blocked(await collectEvidence(f),'SUMMARY_COUNT_CONFLICT');});
await test('summary PASS nonzero exit cannot be laundered',async()=>{const f=await fixture('bad-exit');f.summary.results[0].exitCode=17;await rewriteSummary(f);blocked(await collectEvidence(f),'SUMMARY_RESULT_CONFLICT');});
await test('missing Runner log',async()=>{const f=await fixture('missing-log');await fs.unlink(path.join(f.input,'sample.log'));blocked(await collectEvidence(f),'MISSING_REQUIRED');});
await test('Runner log SHA mismatch',async()=>{const f=await fixture('log-sha');await fs.appendFile(path.join(f.input,'sample.log'),'changed');blocked(await collectEvidence(f),'LOG_HASH_CONFLICT');});
await test('missing required Gate input',async()=>{const f=await fixture('missing-case');blocked(await collectEvidence({...f,requirements:req({path:'tmp/absent.json',sha256:'d'.repeat(64)})}),'MISSING_REQUIRED');});
await test('required input hash mismatch',async()=>{const f=await fixture('required-sha');const entry=await put(f,'tmp/case.json',{});blocked(await collectEvidence({...f,requirements:req({...entry,sha256:'0'.repeat(64)})}),'REQUIRED_HASH_MISMATCH');});
await test('corrupt required JSON',async()=>{const f=await fixture('bad-json');const entry=await put(f,'tmp/case.json','{broken');blocked(await collectEvidence({...f,requirements:req(entry)}),'CORRUPT_JSON');});
await test('corrupt NDJSON',async()=>{const f=await fixture('bad-ndjson');const entry=await put(f,'tmp/case.ndjson','{}\ninvalid');blocked(await collectEvidence({...f,requirements:req(entry)}),'CORRUPT_JSON');});
await test('64MiB single-file upper bound cannot be raised',async()=>{const f=await fixture('limit-config');await assert.rejects(collectEvidence({...f,maxFileBytes:LIMITS.file+1}),{code:'LIMIT_CONFIGURATION'});});
await test('over64MiB failed-case file blocked, original retained',async()=>{
  const f=await fixture('real-limit',{failed:true}),p=path.join(f.input,'tmp','large.json');const handle=await fs.open(p,'wx');await handle.truncate(LIMITS.file+1);await handle.close();const before=hash(await fs.readFile(p));blocked(await collectEvidence(f),'FILE_LIMIT');assert.equal(hash(await fs.readFile(p)),before);
});
await test('compressed total budget exceeded, no silent discard',async()=>{const f=await fixture('budget');const e=await put(f,'tmp/random.txt',randomBytes(70000).toString('hex'));blocked(await collectEvidence({...f,requirements:req(e),maxTotalBytes:65536}),'TOTAL_LIMIT');});
await test('256MiB compressed upper bound cannot be raised',async()=>{const f=await fixture('total-limit-config');await assert.rejects(collectEvidence({...f,maxTotalBytes:LIMITS.total+1}),{code:'LIMIT_CONFIGURATION'});});
await test('exact64MiB is accepted without changing original bytes',async()=>{const f=await fixture('exact-limit');const entry=await put(f,'tmp/exact.txt',Buffer.alloc(LIMITS.file,97));const r=await collectEvidence({...f,requirements:req(entry)});assert.equal(r.status,'DECLARED_EVIDENCE_COMPLETE');assert.equal(r.entries.find(e=>e.path===entry.path).bytes,LIMITS.file);});
for(const [name,text,code] of [
  ['private-win','C:\\Users\\private-person\\secret.txt','PRIVATE_PATH'],
  ['private-mac','/Users/private-person/private.txt','PRIVATE_PATH'],
  ['credential','{"access_token":"this_is_a_fake_test_secret"}','SENSITIVE_CONTENT'],
  ['private-key','-----BEGIN PRIVATE KEY-----','SENSITIVE_CONTENT'],
  ['bearer','Authorization: Bearer fake_test_credential_123456','SENSITIVE_CONTENT'],
])await test('sensitive content blocked without leaking value: '+name,async()=>{const f=await fixture(name);const e=await put(f,'tmp/case.txt',text);const r=await collectEvidence({...f,requirements:req(e)});blocked(r,code);assert.ok(!(await fs.readFile(path.join(f.output,'index.json'),'utf8')).includes(text));});
await test('JSON-escaped personal path cannot bypass safety scan',async()=>{const f=await fixture('escaped-private');const e=await put(f,'tmp/case.json',{nested:{file:'C:\\Users\\private-person\\history.json'}});blocked(await collectEvidence({...f,requirements:req(e)}),'PRIVATE_PATH');});
await test('Unicode-escaped credential key cannot bypass safety scan',async()=>{const f=await fixture('escaped-secret');const e=await put(f,'tmp/case.json','{"\\u0061ccess_token":"fake_test_secret_value"}');blocked(await collectEvidence({...f,requirements:req(e)}),'SENSITIVE_CONTENT');});
await test('allowed standard CI runner path remains byte-exact',async()=>{const f=await fixture('runner-path');const e=await put(f,'tmp/case.txt','/home/runner/work/yakyujinsei/yakyujinsei/tests/case.mjs');assert.equal((await collectEvidence({...f,requirements:req(e)})).status,'DECLARED_EVIDENCE_COMPLETE');});
await test('non UTF8 rejected',async()=>{const f=await fixture('utf8');const e=await put(f,'tmp/case.txt',Buffer.from([255,254]));blocked(await collectEvidence({...f,requirements:req(e)}),'NON_UTF8_CONTENT');});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFEsAAAAASUVORK5CYII=','base64');
await test('unreviewed PNG is blocked',async()=>{const f=await fixture('png-unreviewed');const e=await put(f,'tmp/view.png',png);blocked(await collectEvidence({...f,requirements:req(e)}),'UNREVIEWED_BINARY');});
await test('explicit reviewed PNG hash required for binary capture',async()=>{const f=await fixture('png-reviewed');const e=await put(f,'tmp/view.png',png);const r=await collectEvidence({...f,requirements:{...req(e),reviewedBinaries:[e]}});assert.equal(r.status,'DECLARED_EVIDENCE_COMPLETE');});
await test('output cannot overwrite an existing bundle',async()=>{const f=await fixture('no-clobber');await collectEvidence(f);await assert.rejects(collectEvidence(f),{code:'UNSAFE_OUTPUT'});});
await test('output cannot be inside original input',async()=>{const f=await fixture('nested');await assert.rejects(collectEvidence({...f,output:path.join(f.input,'bundle')}),{code:'UNSAFE_OUTPUT'});});
await test('unsafe requirements traversal refused',async()=>{const f=await fixture('traversal');await assert.rejects(collectEvidence({...f,requirements:req({path:'../case.json',sha256:'a'.repeat(64)})}),{code:'UNSAFE_PATH'});});
await test('duplicate declared paths refused',async()=>{const f=await fixture('duplicate');const e=await put(f,'tmp/case.json',{});await assert.rejects(collectEvidence({...f,requirements:req(e,e)}),{code:'REQUIREMENTS_SCHEMA'});});
await test('download index modification detected',async()=>{const f=await fixture('index-tamper');await collectEvidence(f);await fs.appendFile(path.join(f.output,'index.json'),' ');await assert.rejects(verifyEvidence({bundle:f.output}),{code:'INDEX_HASH'});});
await test('download compressed payload modification detected',async()=>{const f=await fixture('gzip-tamper');const r=await collectEvidence(f),p=path.join(f.output,r.entries.find(e=>e.storage==='GZIP').archive);const b=await fs.readFile(p);b[10]^=1;await fs.writeFile(p,b);await assert.rejects(verifyEvidence({bundle:f.output}),{code:'PAYLOAD_HASH'});});
await test('download missing payload detected',async()=>{const f=await fixture('missing-payload');const r=await collectEvidence(f);await fs.unlink(path.join(f.output,r.entries.find(e=>e.storage==='GZIP').archive));await assert.rejects(verifyEvidence({bundle:f.output}));});
await test('external index anchor detects rewritten sidecar',async()=>{const f=await fixture('anchor');await collectEvidence(f);const expected=(await fs.readFile(path.join(f.output,'index.sha256'),'utf8')).trim();await mutateIndex(f.output,s=>{s.tool='forged';});await assert.rejects(verifyEvidence({bundle:f.output,expectedIndexSha256:expected}),{code:'INDEX_HASH'});});
await test('restore traversal blocked even if sidecar is recomputed',async()=>{const f=await fixture('restore-traversal');await collectEvidence(f);await mutateIndex(f.output,s=>{s.entries[0].path='../escape.log';});await assert.rejects(restoreEvidence({bundle:f.output,output:path.join(f.dir,'restore')}),{code:'UNSAFE_PATH'});});
await test('FALSE_COMPLETE manifest refused',async()=>{const f=await fixture('false-complete');await collectEvidence(f);await mutateIndex(f.output,s=>{s.entries[0].storage='INDEX_ONLY';});await assert.rejects(verifyEvidence({bundle:f.output}),{code:'FALSE_COMPLETE'});});
await test('partial blocked bundle is not restored as complete',async()=>{const f=await fixture('no-partial');await collectEvidence({...f,requirements:req({path:'missing.json',sha256:'0'.repeat(64)})});await assert.rejects(restoreEvidence({bundle:f.output,output:path.join(f.dir,'restore')}),{code:'EVIDENCE_BLOCKED'});});
await test('restore refuses pre-existing destination',async()=>{const f=await fixture('restore-no-clobber');await collectEvidence(f);const out=path.join(f.dir,'restore');await fs.mkdir(out);await assert.rejects(restoreEvidence({bundle:f.output,output:out}),{code:'UNSAFE_OUTPUT'});});
await test('extra unindexed bundle file refused',async()=>{const f=await fixture('extra');await collectEvidence(f);await fs.writeFile(path.join(f.output,'unexpected.txt'),'not in index');await assert.rejects(verifyEvidence({bundle:f.output}),{code:'UNINDEXED_BUNDLE_FILE'});});
await test('input directory junction is refused, no target mutation',async()=>{const f=await fixture('junction');const linked=path.join(f.dir,'linked');await fs.symlink(f.input,linked,process.platform==='win32'?'junction':'dir');await assert.rejects(collectEvidence({...f,input:linked}),{code:'UNSAFE_OUTPUT'});assert.ok(await fs.stat(path.join(f.input,'summary.json')));});
await test('CLI collect, verify and restore exits zero on complete declared evidence',async()=>{const f=await fixture('cli-ok');const cli=args=>spawnSync(process.execPath,['scripts/collect-ci-evidence.mjs',...args],{cwd:root,encoding:'utf8'});const c=cli(['--input='+f.input,'--output='+f.output]);assert.equal(c.status,0,c.stderr);assert.equal(cli(['--verify='+f.output]).status,0);assert.equal(cli(['--restore='+f.output,'--output='+path.join(f.dir,'restored')]).status,0);});
await test('collector CLI failure exit2 cannot change original failure',async()=>{
  const f=await fixture('cli',{failed:true});const before=await fs.readFile(path.join(f.input,'summary.json'));
  const cli=spawnSync(process.execPath,['scripts/collect-ci-evidence.mjs','--input='+f.input,'--output='+path.join(f.dir,'absent-parent','out')],{cwd:root,encoding:'utf8'});
  assert.equal(cli.status,2);assert.match(cli.stderr,/EVIDENCE_BLOCKED/);assert.deepEqual(await fs.readFile(path.join(f.input,'summary.json')),before);
});
await test('workflow preserves trigger/test step/artifact fallback; timeout only',async()=>{
  const current=await fs.readFile(path.join(root,'.github/workflows/test.yml'),'utf8');const original=execFileSync('git',['show','HEAD:.github/workflows/test.yml'],{cwd:root,encoding:'utf8'});
  assert.equal(current.replaceAll('\r\n','\n'),original.replace('timeout-minutes: 60','timeout-minutes: 120').replaceAll('\r\n','\n'));
  assert.ok(!current.includes('collect-ci-evidence.mjs'),'No unproven Gate collector wired');
});

const report={suite:'G9_BOUNDED_COLLECTOR',PASS:rows.filter(r=>r.status==='PASS').length,FAIL:rows.filter(r=>r.status==='FAIL').length,seconds:(Date.now()-start)/1000,environment:{node:process.version,platform:process.platform},cases:rows,artifactDirectory:path.relative(root,base).replaceAll('\\','/')};
await fs.writeFile(path.join(base,'summary.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));process.exitCode=report.FAIL?1:0;
