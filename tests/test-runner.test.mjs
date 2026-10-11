import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import {inventory} from '../scripts/test-manifest.mjs';
const entries=inventory(new URL('../',import.meta.url));
assert.equal(new Set(entries.map(e=>e.id)).size,entries.length,'no duplicate test entries');
for(const e of entries.filter(e=>e.modes.includes('quick')))assert.ok(e.modes.includes('full')&&e.modes.includes('audit'));
for(const e of entries.filter(e=>e.modes.includes('full')))assert.ok(e.modes.includes('audit'));
assert.deepEqual(entries.find(e=>e.id==='retirement-hof-test-support').modes,[]);
const dir=mkdtempSync(path.join(os.tmpdir(),'runner-contract-'));
function run(name,args){
  const out=path.join(dir,name),r=spawnSync(process.execPath,['scripts/test.mjs','quick',...args,'--output='+out],{encoding:'utf8'});
  assert.notEqual(r.status,0,r.stdout+r.stderr);
  return JSON.parse(readFileSync(path.join(out,'summary.json'),'utf8'));
}
const failed=run('failure',['--only=choice-action.test','--self-test-failure']);
assert.equal(failed.counts.FAIL,1);assert.equal(failed.results.at(-1).exitCode,17);assert.equal(failed.results[0].status,'PASS');
const missing=run('missing',['--only=event-fix-e2e','--playwright='+path.join(dir,'does-not-exist')]);
assert.equal(missing.counts.BLOCKED,1);assert.equal(missing.counts.PASS,0);
const cacheOut=path.join(dir,'reused');
const cached=spawnSync(process.execPath,['scripts/test.mjs','quick','--only=choice-action.test','--reuse='+path.join(dir,'failure','summary.json'),'--output='+cacheOut],{encoding:'utf8'});
assert.equal(cached.status,0,cached.stdout+cached.stderr);
const cacheReport=JSON.parse(readFileSync(path.join(cacheOut,'summary.json'),'utf8'));
assert.equal(cacheReport.executed,0);assert.equal(cacheReport.reused,1);assert.equal(cacheReport.counts.PASS,1);
console.log('PASS runner: unique inventory, profile supersets, exit 17 propagation, missing Playwright BLOCKED/nonzero, exact-source/command/log reuse');
