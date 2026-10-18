import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {instrumentRng} from './support/rng-instrument.mjs';

const current=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const baseline=execFileSync('git',['show','650e4dd21718b4abec3876fc9ef6148714c21d4f:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};

test('current game.js uses careerRng.onDraw and leaves the R text untouched',()=>{
  const out=instrumentRng(current,'__probeCalls');
  assert.equal(out,current+'\ncareerRng.onDraw=()=>{window.__probeCalls=(window.__probeCalls||0)+1;};');
});
test('650e4dd baseline (no careerRng) falls back to the legacy R text replace',()=>{
  const out=instrumentRng(baseline);assert.ok(!/^let careerRng = null;$/m.test(baseline));
  assert.ok(out.includes('R = function(){window.__rngCalls=(window.__rngCalls||0)+1;'));
  assert.ok(out.includes('function R(){window.__rngCalls=(window.__rngCalls||0)+1;'));
  assert.ok(!out.includes('careerRng.onDraw'));
});
test('a source with neither hook point throws instead of counting 0',()=>{
  assert.throws(()=>instrumentRng('const R=()=>0.5;'),/RNG_INSTRUMENT_MISS/);
});
console.log(`rng-instrument tests: ${pass} PASS`);
