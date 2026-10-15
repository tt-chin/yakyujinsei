// Re-analysis of preserved Runtime evidence, NOT a fresh browser replay.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {assertApprovedProducerRenameCareer} from './historical-comparison.mjs';
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const directory=arg('directory')||'test-results/development-b-full-locked/tmp/full-power-pitching';
for(const effort of ['通常投球','省エネ投球']){
  const file=side=>path.join(directory,'career-yakyo-test-001-'+effort+'-'+side+'.json');
  const a=JSON.parse(fs.readFileSync(file('old'),'utf8')),b=JSON.parse(fs.readFileSync(file('current'),'utf8'));
  const evidence=assertApprovedProducerRenameCareer(a,b);
  assert.deepEqual(a.rng,b.rng,'all original RNG values/states/count/order exact');
  console.log(JSON.stringify({status:'PASS',classification:'REANALYSIS_EXISTING_RUNTIME_SNAPSHOTS',seed:a.state.seed,effort,steps:a.steps.length,rngCalls:a.rng.length,...evidence}));
}
