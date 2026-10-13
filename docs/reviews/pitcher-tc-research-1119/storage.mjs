// Lossless storage only: never imports the engine or changes research choices/statistics.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const hash=x=>createHash('sha256').update(x).digest('hex');
const filename=x=>x instanceof URL?fileURLToPath(x):path.resolve(x);
export function readStudy(input){
 const file=filename(input),base=path.dirname(file),data=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const r of data.results){
  const ref=r.study?.actions;
  if(Array.isArray(ref)||!ref)continue;
  assert.equal(ref.format,'action-trace.v1');
  const target=path.resolve(base,ref.file),relative=path.relative(base,target);
  assert(!relative.startsWith('..')&&!path.isAbsolute(relative),'Trace must stay inside research folder');
  const raw=fs.readFileSync(target);assert.equal(hash(raw),ref.sha256,`Trace checksum: ${r.seed}`);
  const actions=JSON.parse(raw);assert(Array.isArray(actions));assert.equal(actions.length,ref.count);
  r.study.actions=actions;
 }
 return data;
}
export function writeStudy(output,input){
 const file=filename(output),base=path.dirname(file),stem=path.basename(file,'.json'),original=JSON.stringify(input),data=JSON.parse(original);
 fs.mkdirSync(path.join(base,'traces',stem),{recursive:true});
 for(const r of data.results){
  assert(/^[a-zA-Z0-9_-]+$/.test(r.seed),'Safe trace filename');
  if(!Array.isArray(r.study?.actions))continue;
  const body=JSON.stringify(r.study.actions),relative=`traces/${stem}/${r.seed}.json`;
  assert(Buffer.byteLength(body)<25*1024*1024,'Single trace asset limit');
  fs.writeFileSync(path.join(base,relative),body);
  r.study.actions={format:'action-trace.v1',file:relative,count:r.study.actions.length,sha256:hash(body)};
 }
 const stored=JSON.stringify(data);assert(Buffer.byteLength(stored)<25*1024*1024,'Study index asset limit');
 fs.writeFileSync(file,stored);
 assert.equal(JSON.stringify(readStudy(file)),original,'Full reconstructed JSON must be identical');
 return {file:path.basename(file),records:data.results.length,originalBytes:Buffer.byteLength(original),storedBytes:Buffer.byteLength(stored),reconstructedSha256:hash(original),roundTrip:'PASS'};
}
if(process.argv.includes('--pack')){
 const here=new URL('./',import.meta.url),backup=new URL('../../../test-results/pitcher-tc-1119-packaging-original/',here);
 fs.mkdirSync(backup,{recursive:true});
 const results=[];
 for(const name of ['careers.json','baseline-traces.json']){
  const file=new URL(name,here),saved=new URL(name,backup),data=readStudy(file);
  if(!fs.existsSync(saved))fs.writeFileSync(saved,JSON.stringify(data));
  assert.deepEqual(JSON.parse(fs.readFileSync(saved,'utf8')),data,'Preserve pre-packaging original');
  results.push(writeStudy(file,data));
 }
 fs.writeFileSync(new URL('STORAGE_VERIFICATION.json',here),JSON.stringify({format:'action-trace.v1',results},null,2));
 console.log(JSON.stringify(results,null,2));
}
