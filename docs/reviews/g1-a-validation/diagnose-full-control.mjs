// Re-run only the unchanged IF assertion, preserving its original baseline and expectation.
// In-memory observation hooks capture actual awards boundaries. No product/test source writes.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
const original=new URL('../../../tests/full-power-pitching-e2e.mjs',import.meta.url);
// Freeze the original failing assertion; later approved test fixes must not erase
// this historical negative control or silently change its expectation.
let code=execFileSync('git',['show','554d54a94352b7dbc86473084a65b56bef74d3b7:tests/full-power-pitching-e2e.mjs'],{encoding:'utf8',maxBuffer:20e6});
for(const m of [...code.matchAll(/from '([^']+)'/g)])if(m[1].startsWith('.'))code=code.replaceAll("from '"+m[1]+"'",'from '+JSON.stringify(new URL(m[1],original).href));
code=code.replaceAll('import.meta.url',JSON.stringify(original.href));
const replace=(a,b)=>{assert.equal(code.split(a).length,2,a);code=code.replace(a,b);};
replace("const h=await harness('full-power-pitching');","const h=await harness('full-power-pitching');const originalTest=h.test;h.test=(id,...args)=>id==='S03-IF-unchanged'?originalTest(id,...args):Promise.resolve();");
const observe=String.raw`
window.__g1AwardEvents=[];
const g1Awards=awards;awards=(...args)=>{const before=JSON.parse(JSON.stringify(S)),rBefore=s6rng.length,result=g1Awards(...args);window.__g1AwardEvents.push({before,after:JSON.parse(JSON.stringify(S)),rBefore,rAfter:s6rng.length});return result;};
`;
replace('const hook=`','const hook=`'+observe);
replace('const result={steps,firstPlan,state:clean(final.state),rng:final.rng,trace};','const result={steps,firstPlan,state:clean(final.state),rng:final.rng,trace,awardEvents:await p.evaluate(()=>window.__g1AwardEvents)};');
replace("assert.deepEqual(now,old);e.counts={actions:now.steps.length", "e.snapshots.push({old,now});assert.deepEqual(now,old);e.counts={actions:now.steps.length");
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
