// Focused historical dependency/startup checks; no full career or suite execution.
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {harness,instrument,routeHistoricalShareTheme,root} from '../tests/support/stage6-browser.mjs';
import {withApprovedSchoolChanges} from '../tests/support/approved-school-oracle.mjs';
const refs=[
 ['pitching','20920dddd72ab8c91b0e2c71d560492663cd5aec',true],
 ['international','e602174a22d7472e1021d780388ad61adc6b11b6',true],
 ['smallschool','0fd13c7532fd03da136c72ef64e9890858cfb81e',false],
 ['traits','a0b880bb7e7fe74e743daa0cb8144455c9fdded2',true]
];
const old=(ref,file)=>execFileSync('git',['show',ref+':docs/src/'+file],{cwd:root,encoding:'utf8',maxBuffer:20e6});
const sha=s=>createHash('sha256').update(s).digest('hex');
for(const [,ref]of refs){
 let seen=0;await routeHistoricalShareTheme({route:async(pattern,handler)=>{
  assert.equal(pattern,'**/src/ui/share-theme.js');await handler({fulfill:async response=>{
   assert.equal(response.body,old(ref,'ui/share-theme.js'),'complete original source, no shim or normalization');
   assert.equal(response.contentType,'text/javascript; charset=utf-8');seen++;
  }});
 }},ref);assert.equal(seen,1);
}
const entries=['full-power-pitching-e2e.mjs','international-personal-stats-e2e.mjs','smallschool-c-e2e.mjs','trait-display-e2e.mjs'];
for(const [index,file]of entries.entries()){
 const source=await readFile(new URL('../tests/'+file,import.meta.url),'utf8');
 assert(source.includes(refs[index][1]),file+' keeps its original fixed baseline');
 assert.equal(source.split('if(old)await routeHistoricalShareTheme(p,baseline);').length,2,file+' routes only the historical side exactly once');
}
console.log('PASS 4 actual entry wiring/baseline contracts');
let routed=0;
for(const ref of ['HEAD','main','../bad','0'.repeat(40)])await assert.rejects(()=>routeHistoricalShareTheme({route:async()=>routed++},ref));
assert.equal(routed,0,'invalid/unavailable baseline cannot fall back to current source');
console.log('PASS 4 exact-source route contracts and 4 invalid/unavailable baseline controls');
const h=await harness('yakyujinsei-historical-share-theme');
try{
 for(const [label,ref,school]of refs)await h.test('boot-'+label,{ref},async evidence=>{
  const source=old(ref,'engine/game.js'),palette=old(ref,'ui/share-theme.js');
  const page=await h.page(390,'P','historical-share-'+label,{historical:true,beforeLoad:async page=>{
   await routeHistoricalShareTheme(page,ref);
   await page.route('**/src/engine/game.js',route=>route.fulfill({body:instrument(school?withApprovedSchoolChanges(source):source),contentType:'text/javascript'}));
  }});
  const state=await h.get(page);assert.equal(state.state.pos,'P');assert(state.rng.length>0);
  const served=await page.evaluate(()=>fetch('/src/ui/share-theme.js').then(r=>r.text()));
  assert.equal(served,palette);evidence.sourceSHA256=sha(served);evidence.rngCalls=state.rng.length;
  await page.close();
 });
 await h.test('current-isolated-negative-control',{},async evidence=>{
  const current=await readFile(new URL('../docs/src/ui/share-theme.js',import.meta.url),'utf8');
  const page=await h.page(390,'IF','current-share');
  assert.equal(await page.evaluate(()=>fetch('/src/ui/share-theme.js').then(r=>r.text())),current,'candidate keeps current complete module');
  const failure=await page.evaluate(async()=>{
   const url=URL.createObjectURL(new Blob(["import {getSharePalette} from "+JSON.stringify(location.origin+'/src/ui/share-theme.js')+";export default getSharePalette;"],{type:'text/javascript'}));
   try{await import(url);return null;}catch(e){return e.message;}finally{URL.revokeObjectURL(url);}
  });
  assert.match(failure,/does not provide an export named 'getSharePalette'/,'without historical route the exact original import error is reproducible');
  const state=await h.get(page);assert.equal(state.state.pos,'IF');assert(state.rng.length>0);
  evidence.sourceSHA256=sha(current);evidence.negativeControl=failure;await page.close();
 });
}finally{const result=await h.finish();process.exit(result.fail||h.errors.length?1:0);}
