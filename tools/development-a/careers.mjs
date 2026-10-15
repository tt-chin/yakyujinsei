// Development A native replay. Preserved G1-A UI strategy; historical comparison
// separates ONLY new awardDecisions after independent validation. Same-version strict.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {harness,instrument,arg,root} from '../../tests/support/stage6-browser.mjs';
const mode=arg('mode'),baseline=arg('baseline');
assert(['before','after'].includes(mode));assert(baseline&&arg('output'));
const base=execFileSync('git',['rev-parse',baseline+'^{commit}'],{encoding:'utf8'}).trim();
const old=execFileSync('git',['show',base+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
const source=mode==='before'?old:fs.readFileSync(path.join(root,'docs/src/engine/game.js'),'utf8');
const sha=x=>createHash('sha256').update(x).digest('hex');
const extras=String.raw`
window.__g1events=[];
const g1state=()=>JSON.parse(JSON.stringify(S));
for(const pair of [['awards',awards],['movement',movement]]){
 const original=pair[1],wrapped=(...a)=>{const before=g1state(),rBefore=s6rng.length;const result=original(...a);window.__g1events.push({kind:pair[0],before,after:g1state(),rBefore,rAfter:s6rng.length});return result;};
 if(pair[0]==='awards')awards=wrapped;else movement=wrapped;
}
window.__g1step=effort=>{
 if(S.done)return null;
 const rows=[...$('act').querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')==='false'&&!e.classList.contains('capped'));
 rows.sort((a,b)=>{const order=['vel','ctl','brk','con','pow','eye','spd','sta'];return (S.pos==='IF'?S.ab[a.dataset.abilityKey]-S.ab[b.dataset.abilityKey]:0)||(order.indexOf(a.dataset.abilityKey)-order.indexOf(b.dataset.abilityKey))||S.ab[a.dataset.abilityKey]-S.ab[b.dataset.abilityKey];});
 const buttons=[...$('act').querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.textContent));
 const label=e=>e.textContent.trim();
 const b=rows[0]||buttons.find(e=>label(e).startsWith(effort))||buttons.find(e=>/現在の球団に残留|権利を行使せず残留|宣言残留/.test(label(e)))||buttons.find(e=>/配分を確定|次へ|完了/.test(label(e)))||buttons.find(e=>/NPBドラフト|プロ志望|指名を受け|オファーを受け|契約を結|入団/.test(label(e)))||buttons[0];
 if(!b)throw Error('NO_CURRENT_ACTION');
 if(/新しい野球人生/.test(label(b)))throw Error('RETIREMENT_RESTART_FORBIDDEN');
 const before=g1state(),choice=b.dataset.abilityKey||label(b),rBefore=s6rng.length;b.click();
 return {choice,before,after:g1state(),rBefore,rAfter:s6rng.length};
};`;
function observed(src){const i=instrument(src),at=i.lastIndexOf('})();');return i.slice(0,at)+extras+i.slice(at);}
const h=await harness('g1-a-careers');
const cases=[{seed:'yakyo-test-001',pos:'P',effort:'通常投球'},{seed:'jp3-pitcher-02',pos:'P',effort:'省エネ投球'},{seed:'jp3-pitcher-03',pos:'P',effort:'全力投球'},{seed:'jp3-infielder-01',pos:'IF',effort:'通常投球'}];
function legacyProjection(career){
 const result=structuredClone(career);
 for(const state of [result.state,...result.steps.flatMap(s=>[s.before,s.after]),...result.events.flatMap(e=>[e.before,e.after])])delete state.awardDecisions;
 return result;
}
function validateDecisions(career){
 const rows=career.state.awardDecisions||[],seen=new Set();let rowIndex=0;
 for(const event of career.events.filter(e=>e.kind==='awards')){
  const added=(event.after.awardDecisions||[]).slice((event.before.awardDecisions||[]).length);
  assert.equal(added.length,event.rAfter-event.rBefore,'one ordered Decision per eligible legacy native draw');
  for(const [i,d] of added.entries()){
   assert.equal(d.schemaVersion,1);assert.equal(d.keySchemaVersion,1);assert.equal(d.ruleId,'legacy-v1');
   assert.equal(d.decisionStatus,'DECIDED');assert.equal(d.drawSource,'LEGACY_MAIN_RNG');assert.equal(d.eligibility,true);
   assert.equal(d.year,event.before.year);assert.equal(d.level,event.before.lv);assert.equal(d.role,event.before.role??null);
   assert.deepEqual(d.metrics,event.before.lastSt);assert.deepEqual(d.sources,['LEGACY_MAIN_RNG']);assert.deepEqual(d.reasonCodes,['LEGACY_ELIGIBLE']);
   assert.equal(d.legacySlotId,d.awardId);assert(!seen.has(d.decisionKey));seen.add(d.decisionKey);
   const key=['legacy-award-v1',career.state.seed,String(d.year),d.leagueKey,d.awardId,'legacy-v1'].map(v=>{const b=Buffer.from(v),n=Buffer.alloc(4);n.writeUInt32BE(b.length);return Buffer.concat([n,b]);});
   assert.equal(d.decisionKey,Buffer.concat(key).toString('hex'));assert.equal(d.leagueKey,event.before.lv==='MLB'?'MLB':event.before.lv.replace(/1$/,''));
   const r=career.rng[event.rBefore+i];assert.equal(d.u,r.value);assert.equal(d.rngBefore,r.before);assert.equal(d.rngAfter,r.after);assert.equal(d.awarded,d.u*100<d.pPercent);
   assert(Number.isFinite(d.pPercent)&&d.pPercent>=0&&d.pPercent<=100);assert.deepEqual(rows[rowIndex++],d,'original completion order preserved through entire career');
  }
 }
 assert.equal(rowIndex,rows.length);
}
const clean=x=>{x=structuredClone(x);delete x.version;return x;};
async function run(input,width){const p=await h.page(width,input.pos,input.seed);await p.route('**/src/engine/game.js',route=>route.fulfill({status:200,contentType:'text/javascript',body:observed(source)}));await p.reload();await p.waitForFunction(()=>!!window.__g1step);await p.locator('#seg-pos [data-v="'+input.pos+'"]').click();await p.locator('#btn-start').click();const steps=[];
 for(let n=0;n<2500;n++){const step=await p.evaluate(e=>window.__g1step(e),input.effort);if(!step)break;steps.push(step);if(n===2499)throw Error('CAREER_LIMIT');}
 const snap=await h.get(p),events=await p.evaluate(()=>window.__g1events);assert.equal(snap.state.done,true);assert.ok(snap.state.log.some(r=>r.st),'Must actually play professional season');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const result={input,width,steps,events,state:snap.state,rng:snap.rng};await p.close();return result;}
for(let i=0;i<cases.length;i++){const input=cases[i],width=[1280,320,390,1280][i],id=input.seed+'-'+input.pos;if(arg('only')&&arg('only')!==input.pos)continue;await h.test(id,input,async entry=>{const first=await run(input,width),repeat=await run(input,width);assert.deepEqual(repeat,first,'Exact same source/seed/choices/RNG replay');const target=path.join(h.output,id+'.career.json');fs.writeFileSync(target,JSON.stringify(first));entry.runtimeReplay='PASS';entry.actions=first.steps.length;entry.rngCalls=first.rng.length;entry.engineSha256=sha(source);entry.baseline=base;
 if(mode==='after'){
 const before=JSON.parse(fs.readFileSync(path.join(arg('before-output'),id+'.career.json'),'utf8'));
 validateDecisions(first);validateDecisions(repeat);
 assert.deepEqual(legacyProjection(first),legacyProjection(before),'All other S, steps, choices, events and exact native RNG unchanged');
 entry.comparison={classification:'ONLY_NEW_DECISION_METADATA',oldActions:before.steps.length,newActions:first.steps.length,oldRng:before.rng.length,newRng:first.rng.length};
 }

 });}
const result=await h.finish();process.exit(result.fail||result.errors.length?1:0);
