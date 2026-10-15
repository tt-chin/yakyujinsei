// Read-only evidence validation. Not a test Runner, product loader or permission gate.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const file=arg('manifest');assert(file,'--manifest=<frozen manifest> required');
const manifest=JSON.parse(fs.readFileSync(file,'utf8')),base=path.dirname(path.resolve(file));
assert.equal(manifest.validation.complete,true,'An unfinished candidate is not a passed baseline');
assert.equal(manifest.validation.quick.counts.FAIL,0);assert.equal(manifest.validation.full.counts.FAIL,0);
const sha=p=>new Promise((resolve,reject)=>{const h=createHash('sha256'),s=fs.createReadStream(p);s.on('data',b=>h.update(b));s.on('error',reject);s.on('end',()=>resolve(h.digest('hex')));});
for(const entry of manifest.archives){assert(!path.isAbsolute(entry.file)&&!entry.file.split(/[\\/]/).includes('..'),'Archive path must remain inside baseline');assert.equal(await sha(path.join(base,entry.file)),entry.sha256,entry.file);}
assert.equal(await sha(path.join(base,manifest.entriesManifest.file)),manifest.entriesManifest.sha256,'Per-entry integrity manifest');
if(process.argv.includes('--current-source'))for(const [p,expected] of Object.entries(manifest.productSources))assert.equal(await sha(p),expected,'Baseline product mismatch: '+p);
console.log(JSON.stringify({status:'PASS',archives:manifest.archives.length,currentSourceChecked:process.argv.includes('--current-source'),head:manifest.head,version:manifest.version,notice:'Evidence reuse does not replace Development B Quick/Full or authorize implementation'}));
