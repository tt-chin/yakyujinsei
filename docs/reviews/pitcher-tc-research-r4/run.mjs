// Reuse round-three action unchanged; only sampling and destination change.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const sourceURL=new URL('../pitcher-tc-research-r3/run.mjs',import.meta.url);
const batch=Number(process.argv.find(a=>a.startsWith('--batch='))?.slice(8));
assert([1,2].includes(batch));assert(!process.argv.some(a=>a.startsWith('--baseline=')),'Current dev only');
let source=fs.readFileSync(sourceURL,'utf8');
const replace=(a,b)=>{assert.equal(source.split(a).length,2,a);source=source.replace(a,b);};
for(const rel of ['../pitcher-tc-research-1119/run.mjs','../pitcher-tc-research/research.mjs'])replace(`new URL('${rel}',import.meta.url)`,`new URL(${JSON.stringify(new URL(rel,sourceURL).href)})`);
replace("new URL('STRATEGIES.md',import.meta.url)",`new URL(${JSON.stringify(new URL('STRATEGIES.md',import.meta.url).href)})`);
replace('assert([1,2,3,4].includes(batch))','assert([1,2].includes(batch))');
replace("const strategies=['KBO-SP','KBO-Bullpen','USA-SP','USA-Bullpen'];","const strategies=['USA-Bullpen','USA-Bullpen'];");
replace('pitcher-tc-r3-${String((batch-1)*10+i+1)', 'pitcher-tc-r4-${String((batch-1)*10+i+1)');
const action=s=>s.slice(s.indexOf('const action=String.raw`'),s.indexOf('const match=code.match'));
assert.equal(action(source),action(fs.readFileSync(sourceURL,'utf8')),'Frozen round-three action exactly unchanged');
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
