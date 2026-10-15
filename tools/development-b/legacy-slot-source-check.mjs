// Static complement to native fixtures: exact old producer qualifiers/formulas/order.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const base='efd4710c4c5c366ff3aba69c59180031c82ff18a';
const a=execFileSync('git',['show',base+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replaceAll('\r\n','\n');
const b=fs.readFileSync('docs/src/engine/game.js','utf8').replaceAll('\r\n','\n');
const block=(s,end)=>s.slice(s.indexOf('  const TH = {',s.indexOf('function collectLegacyAwardPlan(')),s.indexOf(end,s.indexOf('function collectLegacyAwardPlan('))).trimEnd();
let current=block(b,'  // All original qualified slots');
for(const [newName,oldName] of [['最優秀防御率投手賞','最優秀投手賞'],['最多三振奪取投手賞','最多奪三振'],['最多セーブ投手賞','最多セーブ'],['最優秀中継ぎ投手賞','最優秀中継ぎ']]){
 assert.equal(current.split(newName).length,2,'one approved producer rename only');current=current.replace(newName,oldName);
}
assert.deepEqual(current,block(a,'  // Preserve the original MVP draw above'),'all legacy eligibility/short circuit/probability/god/order code identical after exact name mapping');
for(const pattern of [/seedInit = function\(seed\)\{[^\n]+/,/R = function\(\)\{[^\n]+/,/const chance=p=>[^\n]+/])assert.equal(b.match(pattern)?.[0],a.match(pattern)?.[0],'original RNG primitive unchanged');
console.log(JSON.stringify({PASS:4,FAIL:0,evidence:'VERIFIED_STATIC; complements actual native slot/RNG comparisons, not a career replay'}));
