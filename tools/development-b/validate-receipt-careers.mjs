// Independent, read-only reconstruction of the lossless private-receipt trace.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {isDeepStrictEqual} from 'node:util';
import {createHash} from 'node:crypto';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const directory=arg('directory');assert(directory,'explicit evidence directory required');
const output=arg('output');assert(output&&!fs.existsSync(output),'fresh validation output required');
const summary=JSON.parse(fs.readFileSync(path.join(directory,'summary.json'),'utf8'));
assert.equal(summary.fail,0);assert.equal(summary.pass,4);assert.deepEqual(summary.errors,[]);
const sha=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const results=[];
for(const entry of summary.records){
 const seed=entry.input.seed,pos=entry.input.pos;
 const first=path.join(directory,seed+'-'+pos+'-first.json'),repeat=path.join(directory,seed+'-'+pos+'-repeat.json');
 const firstHash=sha(first),repeatHash=sha(repeat);assert.equal(firstHash,repeatHash,'complete serialized replay equality: '+seed);
 const run=JSON.parse(fs.readFileSync(first,'utf8')),versions=new Map(),latest=new Map();let lastOrder=[],revisionCount=0;
 for(const [stepIndex,step] of run.steps.entries())for(const phase of ['receiptsBefore','receiptsAfter']){
  const snapshot=step[phase];assert(snapshot&&Array.isArray(snapshot.order)&&Array.isArray(snapshot.changes));
  for(const change of snapshot.changes){
   assert(Number.isSafeInteger(change.index)&&change.index>=0);assert(Number.isSafeInteger(change.revision)&&change.revision>=0);
   assert(['AWARD','STATE'].includes(change.kind));
   const previous=latest.get(change.index);assert.equal(change.revision,previous===undefined?0:previous+1);
   const id=change.index+'/'+change.revision;assert(!versions.has(id),'no overwritten revision');
   if(previous!==undefined)assert(!isDeepStrictEqual(versions.get(change.index+'/'+previous),{kind:change.kind,journal:change.journal}),'unchanged values must reuse their existing revision');
   assert(Number.isSafeInteger(change.journal.year));
   for(const receipt of change.journal.receipts){assert.equal(typeof receipt.status,'string');assert(Array.isArray(receipt.writes));
    for(const write of receipt.writes){assert(Array.isArray(write.path));assert.equal(typeof write.beforePresent,'boolean');assert.equal(typeof write.status,'string');}
   }
   versions.set(id,{kind:change.kind,journal:change.journal});latest.set(change.index,change.revision);revisionCount++;
  }
  assert(snapshot.order.length>=lastOrder.length,'original token order cannot shrink');
  snapshot.order.forEach((ref,index)=>{assert.equal(ref.index,index);assert.equal(ref.revision,latest.get(index));
   const value=versions.get(index+'/'+ref.revision);assert(value,'every step reference reconstructs a complete saved value');assert.equal(value.kind,ref.kind);
  });
  lastOrder=snapshot.order;
 }
 const reconstructed=lastOrder.map(ref=>versions.get(ref.index+'/'+ref.revision));
 assert(isDeepStrictEqual(reconstructed,run.receipts),'last complete journals exactly reconstruct the actual final native receipts');
 const rows=run.receipts.flatMap(r=>r.journal.receipts);assert(rows.every(r=>r.status==='COMMITTED'&&r.writes.every(w=>w.status==='WRITTEN')));
 results.push({seed,pos,status:'PASS',steps:run.steps.length,mainRngCalls:run.rng.length,transactions:run.receipts.length,receipts:rows.length,fullRevisions:revisionCount,firstSha256:firstHash,repeatSha256:repeatHash});
 console.log('PASS '+seed+'/'+pos+' lossless complete receipt reconstruction and exact replay');
}
const result={classification:'NATIVE_RUNTIME_EVIDENCE_VALIDATION',PASS:results.length,FAIL:0,summarySha256:sha(path.join(directory,'summary.json')),results};
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({PASS:results.length,FAIL:0,output}));
