// Append-only evidence for focused development tests; not a replacement Runner.
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync,execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);
const tests=process.argv.find(a=>a.startsWith('--tests='))?.slice(8).split(',');
if(!output||fs.existsSync(output)||!tests?.length)throw Error('Fresh output and explicit tests required');
const entries=[];
for(const test of tests){
  const started=Date.now(),r=spawnSync(process.execPath,[test],{encoding:'utf8',maxBuffer:30e6});
  entries.push({command:[process.execPath,test],exitCode:r.status,error:r.error?String(r.error):undefined,
    status:r.error?'BLOCKED':r.status===0?'PASS':'FAIL',seconds:(Date.now()-started)/1000,
    testSha256:createHash('sha256').update(fs.readFileSync(test)).digest('hex'),stdout:r.stdout,stderr:r.stderr});
  console.log(entries.at(-1).status+' '+test);
}
const result={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),node:process.version,
  counts:Object.fromEntries(['PASS','FAIL','BLOCKED'].map(s=>[s,entries.filter(e=>e.status===s).length])),entries};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(result.counts));process.exit(result.counts.FAIL||result.counts.BLOCKED?1:0);
