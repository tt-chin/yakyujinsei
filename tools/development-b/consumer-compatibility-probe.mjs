// Read-only native policy comparison. Output is evidence, never an award migration.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {parseAwardHonor} from '../../docs/src/engine/award-identity-policy.js';
const output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
const candidateDir=process.argv.find(x=>x.startsWith('--candidate-dir='))?.slice(16);
if(!output||fs.existsSync(output))throw Error('Fresh explicit evidence output required');
const baseline='efd4710c4c5c366ff3aba69c59180031c82ff18a';
const modules={};const sha=x=>createHash('sha256').update(x).digest('hex');
const hashes={};
for(const name of ['salary-evaluation-policy','incentive-policy','hall-of-fame-policy']){
  const file='docs/src/engine/'+name+'.js';
  const old=execFileSync('git',['show',baseline+':'+file],{maxBuffer:20e6});
  const candidate=fs.readFileSync(candidateDir?path.join(candidateDir,name+'.js'):file);
  const candidateSource=candidate.toString().replaceAll("'./award-consumer-policy.js'",
    JSON.stringify(pathToFileURL(path.resolve('docs/src/engine/award-consumer-policy.js')).href));
  modules[name]={before:await import('data:text/javascript;base64,'+old.toString('base64')),
    after:await import('data:text/javascript;base64,'+Buffer.from(candidateSource).toString('base64'))};
  hashes[file]={before:sha(old),after:sha(candidate)};
}
const results=[];
for(const name of ['年度MVP','守備王','出塁王','最多勝','年間MVP','最優秀投手賞','ホームラン王']){
  const text='2039 NPB'+name,honors=Object.freeze([text]);
  const observe=side=>({market:modules['salary-evaluation-policy'][side].calculateMarketAwardAdjustment(honors,2039),
    incentive:modules['incentive-policy'][side].evaluateIncentive({terms:{annualMax:700000,halfPayDThreshold:3},evaluation:{payD:0,sampleStatus:'FULL'},honors,year:2039}),
    hof:modules['hall-of-fame-policy'][side].honorScoreFor({bucket:'NPB',honors,position:'P'})});
  results.push({text,identity:parseAwardHonor(text),before:observe('before'),after:observe('after')});
}
fs.mkdirSync(path.dirname(output),{recursive:true});
const report={mode:'NATIVE_PURE_POLICY_FIXTURE',baseline,head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
  node:process.version,platform:process.platform,command:process.argv,hashes,results,
  limits:['Not natural career or UI E2E','Candidate consumer wiring only; no new award producer','No RNG invoked, no S or honors mutated']};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify(report,null,2));
