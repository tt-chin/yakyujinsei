// Isolated, fail-closed evidence packaging. Never changes test results or source artifacts.
import {createReadStream} from 'node:fs';
import {lstat,readdir,readFile,writeFile,mkdir,realpath,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const LIMITS=Object.freeze({file:64*1024*1024,total:256*1024*1024,index:8*1024*1024,files:10000});
const hash=x=>createHash('sha256').update(x).digest('hex');
const statuses=['PASS','FAIL','SKIP','BLOCKED'];
const fail=code=>Object.assign(new Error(code),{code});
const normal=p=>p.replaceAll('\\','/');
function relativeName(p){
  if(typeof p!=='string'||!p.length||p.includes('\\')||p.includes(':')||p.startsWith('/')||p.includes('\0'))throw fail('UNSAFE_PATH');
  if(p.split('/').some(s=>!s||s==='.'||s==='..'||/[. ]$/.test(s)||/^(con|prn|aux|nul|com\d|lpt\d)(\.|$)/i.test(s)))throw fail('UNSAFE_PATH');
  return p;
}
const inside=(base,p)=>{const r=path.relative(base,p);return r===''||(!r.startsWith('..'+path.sep)&&r!=='..'&&!path.isAbsolute(r));};
async function absent(p){try{await lstat(p);return false;}catch(e){if(e.code==='ENOENT')return true;throw e;}}
async function hashFile(p){const h=createHash('sha256');for await(const b of createReadStream(p))h.update(b);return h.digest('hex');}
function safeText(buffer){
  let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(buffer);}catch{throw fail('NON_UTF8_CONTENT');}
  if(text.includes('\0'))throw fail('BINARY_TEXT');
  // Conservative recognizers, not a claim to detect all personal information.
  const privatePath=/[A-Za-z]:[\\/](?:Users|Documents and Settings)[\\/]|\/Users\/[^/\s]+|\/home\/(?!runner(?:\/|\b))[^/\s]+/;
  const credentials=/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bgithub_pat_[A-Za-z0-9_]{20,}|\bAKIA[A-Z0-9]{16}\b|\bBearer\s+[A-Za-z0-9._~-]{12,}|["']?(?:password|passwd|access_token|refresh_token|api_key|client_secret)["']?\s*[:=]\s*["']?[^\s,"'}]{4,}/i;
  if(privatePath.test(text))throw fail('PRIVATE_PATH');
  if(credentials.test(text))throw fail('SENSITIVE_CONTENT');
  return text;
}
function jsonSafety(value){
  // Inspect decoded strings as well: JSON escaping must not bypass private-path/credential checks.
  const queue=[value];while(queue.length){const v=queue.pop();if(typeof v==='string')safeText(Buffer.from(v));
    else if(v&&typeof v==='object')for(const[k,x]of Object.entries(v)){safeText(Buffer.from(k));if(x===null||typeof x!=='object')safeText(Buffer.from(k+': '+String(x)));else queue.push(x);}}
}
function validatePayload(name,raw){
  if(/\.(json|log|txt|ndjson|md)$/i.test(name)){
    const text=safeText(raw);
    if(name.endsWith('.json')){let v;try{v=JSON.parse(text);}catch{throw fail('CORRUPT_JSON');}jsonSafety(v);}
    if(name.endsWith('.ndjson'))for(const line of text.split('\n').filter(s=>s.trim())){let v;try{v=JSON.parse(line);}catch{throw fail('CORRUPT_JSON');}jsonSafety(v);}
  }else if(!name.endsWith('.png')||!raw.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw fail('BINARY_FORMAT');
}
async function inventory(root){
  const found=[];
  async function walk(dir){
    for(const item of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
      const absolute=path.join(dir,item.name),name=relativeName(normal(path.relative(root,absolute))),s=await lstat(absolute);
      if(s.isSymbolicLink()||(!s.isDirectory()&&!s.isFile()))throw fail('UNSUPPORTED_FILESYSTEM_ENTRY');
      if(s.isDirectory())await walk(absolute);
      else{if(found.length>=LIMITS.files)throw fail('INVENTORY_LIMIT');
        let sha256=null,inventoryError;try{sha256=await hashFile(absolute);}catch(e){inventoryError=['EPERM','EACCES','ENOENT','EBUSY'].includes(e.code)?e.code:'READ_ERROR';}
        found.push({path:name,bytes:s.size,sha256,mtimeMs:s.mtimeMs,...(inventoryError?{inventoryError}:{})});}
    }
  }
  await walk(root);return found;
}
function rootSummary(raw){
  const s=JSON.parse(raw);
  if(!s||!Array.isArray(s.results)||!s.results.length||!['quick','full','audit'].includes(s.mode)||!s.counts||!s.node||!s.platform
    ||!/^\p{ASCII_Hex_Digit}{40}$/u.test(s.head||'')||!/^\p{ASCII_Hex_Digit}{64}$/u.test(s.sourceFingerprint||'')||!s.version)throw fail('SUMMARY_SCHEMA');
  const counts=Object.fromEntries(statuses.map(k=>[k,0])),ids=new Set();
  for(const r of s.results){
    if(!r||typeof r.id!=='string'||ids.has(r.id)||!statuses.includes(r.status))throw fail('SUMMARY_RESULT_SCHEMA');ids.add(r.id);counts[r.status]++;
    if(r.status==='PASS'&&(r.exitCode!==0||r.timedOut||r.error))throw fail('SUMMARY_RESULT_CONFLICT');
    if(['PASS','FAIL'].includes(r.status)&&(!r.log||!Array.isArray(r.command)||!/^\w{64}$/.test(r.logSha256||'')))throw fail('SUMMARY_RESULT_SCHEMA');
  }
  if(statuses.some(k=>s.counts[k]!==counts[k]))throw fail('SUMMARY_COUNT_CONFLICT');return s;
}
async function sourceContext(repoRoot){
  if(!repoRoot)return {status:'NOT_PROVIDED',notice:'Tested source identity is the original summary fingerprint, not inferred from collection time.'};
  const cwd=path.resolve(repoRoot),git=(...args)=>execFileSync('git',args,{cwd,encoding:'utf8',maxBuffer:8*1024*1024});
  const names=[...new Set(git('ls-files','-z','--cached','--others','--exclude-standard','docs/src','docs/styles','docs/index.html','scripts','tests','.github/workflows/test.yml').split('\0').filter(Boolean))].sort();
  const files={};for(const p of names){relativeName(p);const s=await lstat(path.join(cwd,p));if(!s.isFile()||s.isSymbolicLink())throw fail('SOURCE_ENTRY');files[p]=await hashFile(path.join(cwd,p));}
  return {status:'COLLECTION_TIME_ONLY',head:git('rev-parse','HEAD').trim(),files,
    notice:'Not an attestation that a historical test ran against this worktree. Original summary head/fingerprint remain unchanged.'};
}

export async function collectEvidence({input,output,requirements={schemaVersion:1,files:[],reviewedBinaries:[]},repoRoot,
  maxFileBytes=LIMITS.file,maxTotalBytes=LIMITS.total}={}){
  if(!Number.isSafeInteger(maxFileBytes)||maxFileBytes<1||maxFileBytes>LIMITS.file
    ||!Number.isSafeInteger(maxTotalBytes)||maxTotalBytes<65536||maxTotalBytes>LIMITS.total)throw fail('LIMIT_CONFIGURATION');
  if(!input||!output)throw fail('INPUT_OUTPUT_REQUIRED');
  const root=await realpath(input),out=path.resolve(output);
  if((await lstat(input)).isSymbolicLink()||inside(root,out)||inside(out,root)||!(await absent(out)))throw fail('UNSAFE_OUTPUT');
  // Resolve output parent before writing: reject symlink aliases into the source tree.
  const parent=await realpath(path.dirname(out));if(inside(root,parent)||inside(path.join(parent,path.basename(out)),root))throw fail('UNSAFE_OUTPUT');
  if(!requirements||requirements.schemaVersion!==1||!Array.isArray(requirements.files)||!Array.isArray(requirements.reviewedBinaries))throw fail('REQUIREMENTS_SCHEMA');
  const required=new Map(),reviewed=new Map();
  for(const item of requirements.files){relativeName(item.path);if(!/^[a-f0-9]{64}$/.test(item.sha256||'')||required.has(item.path))throw fail('REQUIREMENTS_SCHEMA');required.set(item.path,item.sha256);}
  for(const item of requirements.reviewedBinaries){relativeName(item.path);if(!/^[a-f0-9]{64}$/.test(item.sha256||'')||reviewed.has(item.path))throw fail('REQUIREMENTS_SCHEMA');reviewed.set(item.path,item.sha256);}
  const started=Date.now(),entries=await inventory(root),byPath=new Map(entries.map(e=>[e.path,e])),problems=[];
  const problem=(code,p)=>problems.push({code,...(p?{path:p}:{})});
  for(const e of entries)if(e.inventoryError)problem('INVENTORY_UNREADABLE',e.path);
  let summary=null;
  const summaryEntry=byPath.get('summary.json');
  try{if(!summaryEntry)throw fail('MISSING_SUMMARY');if(summaryEntry.bytes>maxFileBytes)throw fail('SUMMARY_TOO_LARGE');summary=rootSummary(await readFile(path.join(root,'summary.json'),'utf8'));}
  catch(e){problem(e.code||'CORRUPT_SUMMARY','summary.json');}
  // All logs and summaries are mandatory, not just the root Runner logs.
  for(const e of entries)if(e.path.endsWith('.log')||path.posix.basename(e.path)==='summary.json')required.set(e.path,required.get(e.path)||e.sha256);
  required.set('summary.json',required.get('summary.json')||summaryEntry?.sha256||null);
  if(summary)for(const result of summary.results.filter(r=>r.log)){
    let absolute=path.isAbsolute(result.log)?path.resolve(result.log):path.resolve(root,result.log);
    const repoLog=path.resolve(repoRoot||process.cwd(),result.log);
    if(!path.isAbsolute(result.log)&&!byPath.has(normal(result.log))&&inside(root,repoLog))absolute=repoLog;
    if(!inside(root,absolute)){problem('LOG_OUTSIDE_INPUT');continue;}
    const rel=relativeName(normal(path.relative(root,absolute)));
    if(required.has(rel)&&required.get(rel)!==result.logSha256)problem('LOG_HASH_CONFLICT',rel);
    required.set(rel,result.logSha256);
  }
  // Without a trusted per-failure association, require ALL tmp artifacts. Never guess away a failed case.
  if(!summary||summary.counts.FAIL||summary.counts.BLOCKED)for(const e of entries)if(e.path.startsWith('tmp/'))required.set(e.path,required.get(e.path)||e.sha256);
  for(const[p,want]of required){const e=byPath.get(p);if(!e)problem('MISSING_REQUIRED',p);else if(want!==e.sha256)problem('REQUIRED_HASH_MISMATCH',p);}
  await mkdir(out);await mkdir(path.join(out,'payload'));
  const reserve=Math.min(LIMITS.index,Math.floor(maxTotalBytes/2));let payloadBytes=0,stored=0;
  for(const e of entries){
    e.required=required.has(e.path);e.storage='INDEX_ONLY';delete e.mtimeMs;
    if(!e.required){e.reason='SUCCESS_OUTPUT_NOT_DECLARED_REQUIRED_NOT_REPLAYABLE';continue;}
    try{
      if(e.inventoryError)throw fail('INVENTORY_UNREADABLE');
      if(e.bytes>maxFileBytes)throw fail('FILE_LIMIT');
      const raw=await readFile(path.join(root,e.path)),after=await stat(path.join(root,e.path));
      if(raw.length!==e.bytes||after.size!==e.bytes||hash(raw)!==e.sha256)throw fail('SOURCE_CHANGED');
      if(!/\.(json|log|txt|ndjson|md)$/i.test(e.path)&&!(e.path.endsWith('.png')&&reviewed.get(e.path)===e.sha256))throw fail('UNREVIEWED_BINARY');
      validatePayload(e.path,raw);
      const compressed=gzipSync(raw,{level:6});
      if(!gunzipSync(compressed,{maxOutputLength:maxFileBytes}).equals(raw))throw fail('COMPRESSION_ROUNDTRIP');
      if(payloadBytes+compressed.length>maxTotalBytes-reserve)throw fail('TOTAL_LIMIT');
      const archive='payload/'+String(stored++).padStart(5,'0')+'.gz';
      await writeFile(path.join(out,archive),compressed,{flag:'wx'});payloadBytes+=compressed.length;
      Object.assign(e,{storage:'GZIP',archive,compressedBytes:compressed.length,compressedSha256:hash(compressed)});
    }catch(error){e.reason=error.code||'COLLECTION_IO';problem(e.reason,e.path);}
  }
  const requiredEntries=entries.filter(e=>e.required),retained=requiredEntries.filter(e=>e.storage==='GZIP').length;
  let sources;try{sources=await sourceContext(repoRoot);}catch{sources={status:'UNAVAILABLE'};problem('SOURCE_MANIFEST_UNAVAILABLE');}
  const index={schemaVersion:1,tool:'bounded-ci-evidence-v1',status:problems.length?'EVIDENCE_BLOCKED':'DECLARED_EVIDENCE_COMPLETE',
    originalResults:summary?{mode:summary.mode,head:summary.head,version:summary.version,sourceFingerprint:summary.sourceFingerprint,counts:summary.counts,node:summary.node,platform:summary.platform,browser:summary.browser||null}:null,
    collection:{node:process.version,platform:process.platform,seconds:(Date.now()-started)/1000,sources},
    limits:{maxFileBytes,maxTotalBytes,indexBytes:LIMITS.index},requirements:[...required].map(([p,sha256])=>({path:p,sha256})),coverage:{required:required.size,retained,indexedOnly:entries.filter(e=>!e.required).length,
      formalGates:'NOT_ESTABLISHED',notice:'Declared-file completeness is not formal Gate coverage; index-only files cannot be restored.'},
    originals:'READ_ONLY_RETAINED_AT_INPUT',problems,entries};
  let encoded=Buffer.from(JSON.stringify(index,null,2)+'\n');
  // Never place detected private data in the index merely because a payload was refused.
  try{safeText(encoded);jsonSafety(index);}catch{throw fail('UNSAFE_INDEX_CONTENT');}
  if(encoded.length>reserve||encoded.length+payloadBytes+65>maxTotalBytes){
    // Explicit failure, never quietly drop inventory and call it complete.
    const minimal={schemaVersion:1,tool:index.tool,status:'EVIDENCE_BLOCKED',problems:[{code:'INDEX_LIMIT'}],coverage:{formalGates:'NOT_ESTABLISHED'},entries:[],inventoryOmitted:true};
    encoded=Buffer.from(JSON.stringify(minimal,null,2)+'\n');
    if(encoded.length+payloadBytes+65>maxTotalBytes)throw fail('INDEX_LIMIT');
    await writeFile(path.join(out,'index.json'),encoded,{flag:'wx'});await writeFile(path.join(out,'index.sha256'),hash(encoded)+'\n',{flag:'wx'});return minimal;
  }
  await writeFile(path.join(out,'index.json'),encoded,{flag:'wx'});await writeFile(path.join(out,'index.sha256'),hash(encoded)+'\n',{flag:'wx'});
  const validation=await verifyEvidence({bundle:out});
  if(validation.integrity!=='PASS')throw fail('POST_WRITE_VERIFICATION');
  return index;
}

export async function verifyEvidence({bundle,expectedIndexSha256}={}){
  const root=await realpath(bundle);if((await lstat(bundle)).isSymbolicLink())throw fail('UNSAFE_BUNDLE');
  for(const p of ['index.json','index.sha256']){const s=await lstat(path.join(root,p));if(!s.isFile()||s.isSymbolicLink()||s.size>LIMITS.index)throw fail('INDEX_FORMAT');}
  const raw=await readFile(path.join(root,'index.json')),digest=hash(raw),sidecar=(await readFile(path.join(root,'index.sha256'),'utf8')).trim();
  if(digest!==sidecar||(expectedIndexSha256&&digest!==expectedIndexSha256))throw fail('INDEX_HASH');
  let index;try{index=JSON.parse(raw);}catch{throw fail('INDEX_FORMAT');}
  if(index.schemaVersion!==1||!Array.isArray(index.entries)||index.entries.length>LIMITS.files||!['EVIDENCE_BLOCKED','DECLARED_EVIDENCE_COMPLETE'].includes(index.status))throw fail('INDEX_FORMAT');
  safeText(raw);jsonSafety(index);
  const names=new Set(),archives=new Set();let bytes=raw.length+65,restorable=0;
  for(const e of index.entries){
    const unreadable=index.status==='EVIDENCE_BLOCKED'&&e.inventoryError&&e.sha256===null&&e.storage==='INDEX_ONLY';
    relativeName(e.path);if(names.has(e.path)||!Number.isSafeInteger(e.bytes)||e.bytes<0||(!/^[a-f0-9]{64}$/.test(e.sha256||'')&&!unreadable))throw fail('INDEX_ENTRY');names.add(e.path);
    if(!['INDEX_ONLY','GZIP'].includes(e.storage))throw fail('INDEX_ENTRY');
    if(e.storage!=='GZIP'){if(e.required&&index.status==='DECLARED_EVIDENCE_COMPLETE')throw fail('FALSE_COMPLETE');continue;}
    if(!/^payload\/\d{5}\.gz$/.test(e.archive)||archives.has(e.archive)||e.bytes>LIMITS.file)throw fail('INDEX_ENTRY');archives.add(e.archive);
    const payloadRoot=await lstat(path.join(root,'payload'));if(!payloadRoot.isDirectory()||payloadRoot.isSymbolicLink())throw fail('UNSAFE_BUNDLE');
    const p=path.join(root,e.archive),s=await lstat(p);if(!s.isFile()||s.isSymbolicLink()||s.size!==e.compressedBytes||s.size>LIMITS.file+65536)throw fail('PAYLOAD_SIZE');
    const compressed=await readFile(p);if(hash(compressed)!==e.compressedSha256)throw fail('PAYLOAD_HASH');
    const unpacked=gunzipSync(compressed,{maxOutputLength:LIMITS.file});if(unpacked.length!==e.bytes||hash(unpacked)!==e.sha256)throw fail('RESTORED_HASH');
    validatePayload(e.path,unpacked);
    bytes+=compressed.length;restorable++;
  }
  if(bytes>LIMITS.total)throw fail('TOTAL_LIMIT');
  const actualFiles=await inventory(root),allowed=new Set(['index.json','index.sha256',...archives]);
  if(actualFiles.some(e=>e.inventoryError))throw fail('UNREADABLE_BUNDLE');
  if(actualFiles.some(e=>!allowed.has(e.path)))throw fail('UNINDEXED_BUNDLE_FILE');
  if(index.status==='DECLARED_EVIDENCE_COMPLETE'){
    if(!Array.isArray(index.requirements)||index.problems?.length||index.inventoryOmitted)throw fail('FALSE_COMPLETE');
    const declared=new Set();for(const r of index.requirements){relativeName(r.path);if(declared.has(r.path))throw fail('FALSE_COMPLETE');declared.add(r.path);const e=index.entries.find(e=>e.path===r.path);if(!e?.required||e.storage!=='GZIP'||e.sha256!==r.sha256)throw fail('FALSE_COMPLETE');}
    if(index.coverage?.required!==declared.size||index.coverage?.retained!==restorable)throw fail('FALSE_COMPLETE');
  }
  return {status:index.status,integrity:'PASS',indexSha256:digest,bytes,restorable,index,
    trust:expectedIndexSha256?'EXTERNAL_HASH_ANCHOR':'SIDECAR_INTEGRITY_ONLY_NOT_AUTHENTICATION'};
}

export async function restoreEvidence({bundle,output,expectedIndexSha256}={}){
  const verified=await verifyEvidence({bundle,expectedIndexSha256});
  if(verified.status!=='DECLARED_EVIDENCE_COMPLETE')throw fail('EVIDENCE_BLOCKED');
  const out=path.resolve(output),root=await realpath(bundle),parent=await realpath(path.dirname(out));
  if(!(await absent(out))||inside(root,out)||inside(root,parent)||inside(out,root))throw fail('UNSAFE_OUTPUT');
  await mkdir(out);
  for(const e of verified.index.entries.filter(e=>e.storage==='GZIP')){
    const target=path.join(out,e.path);await mkdir(path.dirname(target),{recursive:true});
    const compressed=await readFile(path.join(root,e.archive));if(hash(compressed)!==e.compressedSha256)throw fail('PAYLOAD_HASH');
    const content=gunzipSync(compressed,{maxOutputLength:LIMITS.file});if(content.length!==e.bytes||hash(content)!==e.sha256)throw fail('RESTORED_HASH');
    await writeFile(target,content,{flag:'wx'});if(await hashFile(target)!==e.sha256)throw fail('RESTORED_HASH');
  }
  return {status:'RESTORED_DECLARED_EVIDENCE',files:verified.restorable,indexSha256:verified.indexSha256,formalGates:'NOT_ESTABLISHED'};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  try{
    const args=Object.fromEntries(process.argv.slice(2).map(a=>{if(!a.startsWith('--')||!a.includes('='))throw fail('CLI_ARGUMENT');const at=a.indexOf('=');return[a.slice(2,at),a.slice(at+1)];}));
    const allowed=['input','output','requirements','repo','verify','restore','expected-index-sha256'];if(Object.keys(args).some(k=>!allowed.includes(k)))throw fail('CLI_ARGUMENT');
    let result;
    if(args.verify)result=await verifyEvidence({bundle:args.verify,expectedIndexSha256:args['expected-index-sha256']});
    else if(args.restore)result=await restoreEvidence({bundle:args.restore,output:args.output,expectedIndexSha256:args['expected-index-sha256']});
    else result=await collectEvidence({input:args.input,output:args.output,repoRoot:args.repo||'.',requirements:args.requirements?JSON.parse(await readFile(args.requirements,'utf8')):undefined});
    const problemCounts={};for(const p of result.problems||[])problemCounts[p.code]=(problemCounts[p.code]||0)+1;
    console.log(JSON.stringify({status:result.status,integrity:result.integrity,coverage:result.coverage||result.index?.coverage,
      problemCounts,problemCount:result.problems?.length,firstProblems:result.problems?.slice(0,5),allProblems:'index.json',files:result.files,indexSha256:result.indexSha256}));
    process.exitCode=result.status==='EVIDENCE_BLOCKED'?2:0;
  }catch(error){console.error(JSON.stringify({status:'EVIDENCE_BLOCKED',code:error.code||'COLLECTOR_FAILURE',originalTestStatus:'UNCHANGED'}));process.exitCode=2;}
}
