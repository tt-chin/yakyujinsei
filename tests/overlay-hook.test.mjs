import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {injectOverlayHook} from './support/overlay-hook.mjs';

const MARKER='/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */';
const current=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const wrapped=execFileSync('git',['show','d2a564ecbc78d9b8027956d9349b2c7ba1a63934:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
// The overlay without its IIFE shell, as phase 4-A leaves it (the other edits do not matter to the injection point).
const head=MARKER+"\r\n(() => {\r\n  'use strict';\r\n";
assert.equal(wrapped.split(head).length,2);assert.ok(wrapped.endsWith('})();\r\n'));
const unwrapped=wrapped.replace(head,MARKER+'\r\n').slice(0,-'})();\r\n'.length);
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};

test('d2a564e (overlay IIFE) inserts before the last })(); after the marker',()=>{
  const end=wrapped.lastIndexOf('})();');assert.ok(end>wrapped.indexOf(MARKER));
  assert.equal(injectOverlayHook(wrapped,'H1;'),wrapped.slice(0,end)+'H1;'+wrapped.slice(end));
  assert.equal(injectOverlayHook(injectOverlayHook(wrapped,'H1;'),'H2;'),wrapped.slice(0,end)+'H1;H2;'+wrapped.slice(end));
});
test('unwrapped overlay appends at module top level, hooks in injection order',()=>{
  assert.equal(injectOverlayHook(unwrapped,'H1;'),unwrapped+'\nH1;\n');
  assert.equal(injectOverlayHook(injectOverlayHook(unwrapped,'H1;'),'H2;'),unwrapped+'\nH1;\n\nH2;\n');
  assert.ok(unwrapped.lastIndexOf('})();')<unwrapped.indexOf(MARKER),'the last })(); now belongs to an IIFE before the overlay');
});
test('current game.js is accepted by one of the two paths',()=>{
  const out=injectOverlayHook(current,'H1;');assert.notEqual(out,current);assert.equal(out.split('H1;').length,2);
});
for(const [name,source] of [['IIFE',MARKER+'\n(() => {\n  const x=1;\n})();\n'],['unwrapped',MARKER+'\n  const x=1;\n(function(){})();\n']])
  test(name+': later hooks see earlier hook declarations and overlay scope',()=>{
    const ctx={};vm.runInNewContext(injectOverlayHook(injectOverlayHook(source,'const a=1;'),'globalThis.out=a+x;'),ctx);assert.equal(ctx.out,2);
  });
// kbo-renewal-e2e shape: overlay code calls a function that only the hook declares. A block around the hook would hide it
// (strict mode, as in the ES module; sloppy scripts would hoist the block function and mask the difference).
for(const [name,source] of [['IIFE',MARKER+'\n(() => {\n  function f(){return g();}\n  globalThis.f=f;\n})();\n'],['unwrapped',MARKER+'\n  function f(){return g();}\n  globalThis.f=f;\n']])
  test(name+': overlay code resolves a function declared by the hook',()=>{
    const ctx={};vm.runInNewContext("'use strict';\n"+injectOverlayHook(source,'function g(){return 1;}'),ctx);assert.equal(ctx.f(),1);
  });
test('missing marker or overlay end before the marker throws',()=>{
  assert.throws(()=>injectOverlayHook('(() => {\n})();\n','H;'),/OVERLAY_HOOK_MISS/);
  assert.throws(()=>injectOverlayHook('})();\n'+MARKER+'\n(() => {\n','H;'),/OVERLAY_HOOK_MISS/);
});
console.log(`overlay-hook: ${pass} cases PASS.`);
