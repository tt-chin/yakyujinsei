import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {AWARD_REGISTRY,parseAwardHonor,identifyAwardDecision} from '../docs/src/engine/award-identity-policy.js';
import {consumerTreatmentView} from '../docs/src/engine/award-consumer-policy.js';
import * as market from '../docs/src/engine/salary-evaluation-policy.js';
import * as fallback from '../docs/src/engine/salary-promotion-policy.js';
import * as incentive from '../docs/src/engine/incentive-policy.js';
import * as hof from '../docs/src/engine/hall-of-fame-policy.js';
const live={'salary-evaluation-policy':market,'salary-promotion-policy':fallback,'incentive-policy':incentive,'hall-of-fame-policy':hof};
const baseline='efd4710c4c5c366ff3aba69c59180031c82ff18a',old={},hashes={};
for(const name of ['salary-evaluation-policy','salary-promotion-policy','incentive-policy','hall-of-fame-policy']){
  const file='docs/src/engine/'+name+'.js',bytes=execFileSync('git',['show',baseline+':'+file],{maxBuffer:20e6});
  hashes[file]=createHash('sha256').update(bytes).digest('hex');
  const source=bytes.toString().replace("'./contract-policy.js'",JSON.stringify(pathToFileURL(path.resolve('docs/src/engine/contract-policy.js')).href));
  old[name]=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const names=[...new Set(Object.values(AWARD_REGISTRY).flatMap(r=>[r.displayName,...r.aliases]).concat([
  '年度MVP','MVP','守備王','出塁王','最多勝','最優秀防御率','ゴールデングラブ','最優秀守備選手',
  '最佳投手','打擊王','全壘打王','金手套','澤村賞','賽揚賞','勝投王','上壘王',
  '年度最佳投手','救援王','中繼王','三振王','盜壘王','打點王','ホールド王','盗み王','賽揚獎']))];
const native=(consumer,honors,year,bucket,modules=old)=>{
  if(consumer==='market')return modules['salary-evaluation-policy'].calculateMarketAwardAdjustment(honors,year);
  if(consumer==='fallback')return modules['salary-promotion-policy'].salaryAwardBonus(honors,year);
  if(consumer==='incentive')return modules['incentive-policy'].evaluateIncentive({terms:{annualMax:700000},evaluation:{payD:0,sampleStatus:'FULL'},honors,year});
  return modules['hall-of-fame-policy'].honorScoreFor({bucket,honors,position:'P'});
};
const projected=(consumer,honors,year,league)=>{
  const rows=consumerTreatmentView(honors,consumer,{year,league:consumer==='hof'?league:undefined});
  if(consumer==='market')return Math.round((Math.min(1.5,rows.reduce((s,r)=>s+r.value,0))+Number.EPSILON)*100)/100;
  if(consumer==='fallback')return Math.min(3,rows.reduce((s,r)=>s+r.value,0));
  if(consumer==='incentive')return rows.length?{level:'FULL',amount:700000,reasonCodes:['FULL_AWARD',...new Set(rows.map(r=>r.value))]}:{level:'NONE',amount:0,reasonCodes:['BELOW_THRESHOLD']};
  const result={sc:0,mvp:0,aceN:0,king:0};
  for(const r of rows){const v=r.value;if(v==='ALL_STAR'){result.sc+=70;continue;}result.sc+=v;
    if(v===420)result.mvp++;else if(v===460)result.aceN++;else if([160,220,300].includes(v))result.king++;
  }
  return result;
};
const cases=[];let passed=0;
for(const name of names)for(const label of ['', 'NPB','KBO','台湾プロ野球','メジャーリーグ','CPBL','MLB','中職','日職','韓職','美職'])for(const prefix of ['2039 ','2038 ',''])for(const consumer of ['market','fallback','incentive','hof']){
  const text=prefix+label+name,honors=Object.freeze([text]),before=structuredClone(honors);
  const expected=native(consumer,honors,2039,'NPB'),actual=projected(consumer,honors,2039,'NPB');
  assert.deepEqual(actual,expected,consumer+' exact legacy treatment: '+text);assert.deepEqual(honors,before);
  const wired=native(consumer,honors,2039,'NPB',live);assert.deepEqual(wired,expected,consumer+' actual wired native function: '+text);
  cases.push({text,consumer,identity:parseAwardHonor(text).status,expected,actual,wired,status:'PASS'});passed++;
}
// These are explicit legacy Consumer names, not newly trusted award identities.
for(const name of ['年度MVP','守備王','出塁王','最多勝']){
  assert.equal(parseAwardHonor('2039 NPB'+name).status,'UNKNOWN');
  assert.equal(identifyAwardDecision({awardId:'PITCH_WINS',completed:true,originalText:name}).decisionVerified,false);
}
for(const text of ['2039 NPB謎の賞','2039 NPB年間MVP候補','2039 NPB最多勝利投手賞候補']){
  for(const consumer of ['market','fallback','incentive','hof'])assert.equal(consumerTreatmentView([text],consumer,{year:2039,league:'NPB'}).length,0);
}
const output=process.argv.find(x=>x.startsWith('--output='))?.slice(9);
const summary={baseline,node:process.version,sourceHashes:hashes,PASS:passed,FAIL:0,evidence:'NATIVE_A_POLICY_VS_EXACT_COMPATIBILITY; NOT_UI_E2E',cases};
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n',{flag:'wx'});}
console.log(JSON.stringify({...summary,cases:undefined}));
