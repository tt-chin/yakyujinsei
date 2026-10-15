// Read-only ZIP integrity inspection; generated manifest is append-only evidence.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {inflateRawSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const input=arg('zip'),output=arg('output');assert(input&&output);assert(!fs.existsSync(output),'Never overwrite evidence');
const bytes=fs.readFileSync(input),hash=b=>createHash('sha256').update(b).digest('hex');
let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--)if(bytes.readUInt32LE(i)===0x06054b50){end=i;break;}
assert(end>=0);const count=bytes.readUInt16LE(end+10),central=bytes.readUInt32LE(end+16);assert(count!==65535&&central!==0xffffffff,'ZIP64 needs separate explicit validation');
const entries=[];let at=central;
for(let n=0;n<count;n++){
 assert.equal(bytes.readUInt32LE(at),0x02014b50);const method=bytes.readUInt16LE(at+10),compressed=bytes.readUInt32LE(at+20),size=bytes.readUInt32LE(at+24),nameLength=bytes.readUInt16LE(at+28),extra=bytes.readUInt16LE(at+30),comment=bytes.readUInt16LE(at+32),local=bytes.readUInt32LE(at+42);
 const name=bytes.subarray(at+46,at+46+nameLength).toString('utf8');assert(!path.isAbsolute(name)&&!name.split('/').includes('..'));
 assert.equal(bytes.readUInt32LE(local),0x04034b50);const start=local+30+bytes.readUInt16LE(local+26)+bytes.readUInt16LE(local+28),data=bytes.subarray(start,start+compressed),plain=method===0?data:method===8?inflateRawSync(data):null;
 assert(plain,'Unsupported compression method');assert.equal(plain.length,size);const sha256=hash(plain);
 if(process.argv.includes('--compare-original'))assert.equal(sha256,hash(fs.readFileSync(name)),'Archive original mismatch: '+name);
 entries.push({path:name,bytes:size,sha256});at+=46+nameLength+extra+comment;
 if(n%100===0)console.log('VERIFIED_ENTRIES '+(n+1)+'/'+count);
}
assert.equal(new Set(entries.map(e=>e.path)).size,entries.length,'No duplicate archive paths');
const result={archive:path.basename(input),archiveSha256:hash(bytes),entryCount:entries.length,originalComparison:process.argv.includes('--compare-original')?'PASS':'NOT_RUN',entries};
fs.writeFileSync(output,JSON.stringify(result,null,2),{flag:'wx'});console.log(JSON.stringify({status:'PASS',entryCount:entries.length,archiveSha256:result.archiveSha256,manifestSha256:hash(fs.readFileSync(output)),output}));
