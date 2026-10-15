import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseAwardHonor, buildAwardIdentityView, buildAwardIdentityEntries} from '../docs/src/engine/award-identity-policy.js';
import {calculateMarketAwardAdjustment} from '../docs/src/engine/salary-evaluation-policy.js';
import {salaryAwardBonus} from '../docs/src/engine/salary-promotion-policy.js';
import {evaluateIncentive} from '../docs/src/engine/incentive-policy.js';
import {honorScoreFor} from '../docs/src/engine/hall-of-fame-policy.js';
const freeze = x => {if(x && typeof x === 'object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
let passed=0;
const check=(name,fn)=>{fn();passed++;console.log('PASS '+name);};
const observe=honors=>({market:calculateMarketAwardAdjustment(honors,2039),
  fallback:salaryAwardBonus(honors,2039),
  incentive:evaluateIncentive({terms:{annualMax:700000,halfPayDThreshold:3},evaluation:{payD:0,sampleStatus:'FULL'},honors,year:2039}),
  hof:honorScoreFor({bucket:'NPB',honors,position:'P'})});
for(const raw of ['2039 NPB最優秀投手賞','2039 NPB首位打者','2039 NPB本塁打王',
  '2039 NPBゴールデングラブ賞','2039 NPB新人王','2039 NPB年間MVP','2039 NPBオールスターゲーム',
  '2039 NPBホームラン王','2039 NPB年度MVP','2039 NPB最佳投手','2039 日本代表MVP',
  '2039 NPB日本一','2038 NPB首位打者','2039 KBO首位打者']){
  check('native consumer outputs unchanged by read-only lookup: '+raw,()=>{
    const honors=freeze([raw,raw]),before=structuredClone(honors),expected=observe(honors);
    buildAwardIdentityEntries(honors);buildAwardIdentityView(honors);parseAwardHonor(raw,{trusted:true});
    assert.deepEqual(honors,before);assert.deepEqual(observe(honors),expected);
  });
}
check('same ID does not unify current native alias treatments',()=>{
  assert.equal(parseAwardHonor('2039 NPBホームラン王').awardId,'BATTING_HR');
  const formal=observe(['2039 NPB本塁打王']),alias=observe(['2039 NPBホームラン王']);
  assert.equal(formal.market,.35);assert.equal(alias.market,0);
  assert.equal(formal.incentive.level,'FULL');assert.equal(alias.incentive.level,'FULL');
});
check('source order and semantic order are different explicit views',()=>{
  const honors=freeze(['2039 NPB最多奪三振','2039 NPB年間MVP','2039 NPB最多三振奪取投手賞','謎','謎']);
  const entries=buildAwardIdentityEntries(honors),view=buildAwardIdentityView(honors);
  assert.deepEqual(entries.map(x=>x.originalText),honors);
  assert.deepEqual(entries.map(x=>x.sourceIndex),[0,1,2,3,4]);
  assert.deepEqual(view[0].sourceIndices,[0,2]);assert.equal(view.length,4);
  assert(Object.isFrozen(view[0].sourceIndices));
});
check('per-entry scope and historical context, no current org inference',()=>{
  const rows=buildAwardIdentityEntries(['2039 NPB年間MVP','2039 KBO新人王','2039 NPB年間MVP','unknown'],
    freeze([{scope:'personal',year:2039,league:'NPB',level:'NPB1',org:'MLB'},
      {scope:'personal',level:'KBO1'},{scope:'international'},{}]));
  assert.deepEqual(rows.map(x=>x.status),['RECOGNIZED','RECOGNIZED','NOT_IN_SCOPE','UNKNOWN']);
  assert.equal(rows[0].league,'NPB');assert.equal(rows[1].level,'KBO1');
  assert.equal(parseAwardHonor('2039 NPB新人王',{year:2040}).status,'INVALID');
  assert.equal(parseAwardHonor('2039 NPB新人王',{league:'KBO'}).status,'INVALID');
  assert.equal(buildAwardIdentityEntries(['2039 NPB新人王'],[null])[0].status,'INVALID');
  assert.equal(buildAwardIdentityEntries(['2039 NPB新人王'],[{year:NaN}])[0].status,'INVALID');
});
check('invalid and missing values retain original values without invented identity',()=>{
  for(const raw of [undefined,null,0,{},'', '2039 NPB年度MVP']){
    const row=buildAwardIdentityEntries([raw])[0];assert.equal(row.originalText,raw);
    assert.notEqual(row.status,'RECOGNIZED');
  }
});
check('accepted A consumer-isolation source evidence preserved; B wiring tested separately',()=>{
  const before=JSON.parse(fs.readFileSync('docs/reviews/development-a/before-hashes.json','utf8'));
  for(const file of ['salary-evaluation-policy','salary-promotion-policy','incentive-policy','hall-of-fame-policy','trait-policy']){
    const path='docs/src/engine/'+file+'.js';
    const accepted=execFileSync('git',['show','efd4710c4c5c366ff3aba69c59180031c82ff18a:'+path]);
    const hash=x=>createHash('sha256').update(x).digest('hex');
    assert([hash(accepted),hash(accepted.toString().replaceAll('\n','\r\n'))].includes(before[path]));
  }
});
console.log(JSON.stringify({evidence:'NATIVE_FUNCTION_FIXTURE + STATIC; not wired Runtime E2E',PASS:passed,FAIL:0}));
