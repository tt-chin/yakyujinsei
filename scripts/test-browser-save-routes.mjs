import {VERSION} from '../docs/src/config.js';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import assert from 'node:assert/strict';import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import path from 'node:path';import {createRequire} from 'node:module';import {assertSameCareer} from '../tests/support/first-difference.mjs';
const root=process.cwd(),out=process.argv.find(a=>a.startsWith('--output='))?.slice(9)||path.join(os.tmpdir(),'yakyujinsei-browser-save-routes-'+Date.now());await mkdir(out,{recursive:true});
const probe=`\nwindow.__saveTrace=[];const saveObservedR=R;R=function(){const value=saveObservedR();window.__saveTrace.push({value,state:S.rngState});return value;};const saveObservedYear=yearFlow.startReadyYear.bind(yearFlow);yearFlow.startReadyYear=function(capture){return saveObservedYear(state=>{window.__saveTraceStart=window.__saveTrace.length;window.__saveRawBoundary=JSON.parse(JSON.stringify(state));capture(state);});};window.__saveAcceptance={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:window.__saveTrace.slice(window.__saveTraceStart)}),failNextYear:()=>{const old=yearFlow.startReadyYear.bind(yearFlow);yearFlow.startReadyYear=function(capture){yearFlow.startReadyYear=old;old(capture);S.ab[Object.keys(S.ab)[0]]-=1;throw Error('SAVE_INJECTED_FIRST_STEP');};}};window.__historyMoney=fmtMoney;window.__saveRouteFixture=(lv,rehab=false)=>{const pos=S.pos;S=newState('保存route fixture',pos);Object.assign(S,{year:2032,age:22,stage:'PRO',stageYr:1,lv,org:LV[lv].org,rehab:rehab?1:0});const team=listByOrg(S.org)[0];S.orgTeamId=team.teamId;for(const k of Object.keys(S.ab)){S.ab[k]=70;S.pot[k]=80;}signTo(S.org,lv,team.teamId,3,1,'TRANSFER',{startYear:S.year});resetEventYear(S);startYear();};`;
const historyBaseline='00fc40d460e706a8f994aebe936a41f1fc4d45a8',baselineFiles=new Map();
const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://local').pathname,legacy=pathname.startsWith('/legacy/'),old=legacy||pathname.startsWith('/old/');const rel=(legacy?pathname.slice(8):old?pathname.slice(5):pathname.slice(1))||'index.html';if(rel.includes('..'))throw Error('path');if(old&&!baselineFiles.has(rel))baselineFiles.set(rel,execFileSync('git',['show',historyBaseline+':docs/'+rel],{maxBuffer:20*1024*1024}));
let b=old?baselineFiles.get(rel):await readFile(path.join(root,'docs',rel));if(old&&!legacy&&rel==='src/config.js'){
 const source=b.toString();assert.match(source,/^export const VERSION = '2\.1\.0';\s*$/);
 b=source.replace("'2.1.0'",JSON.stringify(VERSION));
}
if(rel==='src/engine/game.js')b=b.toString()+probe;res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':'text/html');res.end(b);}catch{res.statusCode=404;res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const mod=process.argv.find(a=>a.startsWith('--playwright='))?.slice(13)||process.env.PLAYWRIGHT_MODULE||'playwright';const {chromium}=createRequire(import.meta.url)(mod),browser=await chromium.launch({channel:(process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||process.env.TEST_BROWSER||'chrome')==='chromium'?undefined:(process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||process.env.TEST_BROWSER||'chrome'),headless:true});const results=[];
const advanceYear=()=>{const actions=[];const start=window.__saveAcceptance.get().state.year;for(let i=0;i<1400;i++){const state=window.__saveAcceptance.get().state;if(state.done||state.year!==start)return actions;const a=document.querySelector('#act'),rows=[...a.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')).sort((x,y)=>parseInt(x.querySelector('.val').textContent)-parseInt(y.querySelector('.val').textContent)),bs=[...a.querySelectorAll('button:not([data-fa-sort])')].filter(b=>!b.disabled&&!/元に戻す|すべてリセット/.test(b.innerText));const b=bs.find(b=>/通常投球/.test(b.innerText))||rows[0]||bs.find(b=>/配分を確定|配分完了|次へ|完了/.test(b.innerText))||bs.find(b=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(b.innerText))||bs[0];if(!b)throw Error('NO_ACTION');actions.push(b.dataset.abilityKey??b.textContent);b.click();}throw Error('YEAR_ACTION_LIMIT');};
const historyRun=process.argv.includes('--year-history');
try{for(const [seed,pos,fixture]of historyRun?[['q77bi1jx','IF',null],['jp3-infielder-01','IF',null]]:[['jp3-infielder-01','IF',null],['jp3-pitcher-02','P',null],...['MLB','A3','A2','A1','R','NPB1','NPB2','NPB_DEV','KBO1','KBO2','CPBL1','CPBL2'].map((lv,i)=>['save-route-'+lv,i%2?'IF':'P',lv]),['save-rehab','P','REHAB']]){
 console.log('START '+seed+'/'+pos+'/'+fixture);if(process.argv.includes('--only-a3')&&fixture!=='A3')continue;if(process.argv.includes('--only-r')&&fixture!=='R')continue;const context=await browser.newContext({viewport:{width:historyRun&&seed==='q77bi1jx'?390:1280,height:900}});context.setDefaultTimeout(30000);await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));const live=await context.newPage(),resume=await context.newPage();const url='http://127.0.0.1:'+server.address().port+'/?seed='+seed;await live.goto(url);await live.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await live.locator('#seg-pos [data-v="'+pos+'"]').click();if(historyRun)await live.locator('#in-name').fill('年度比較太郎');await live.locator('#btn-start').click();await live.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('開始時点をセーブしました'));
 if(fixture){await live.evaluate(level=>window.__saveRouteFixture(level==='REHAB'?'NPB1':level,level==='REHAB'),fixture);await live.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('2032年の開始時点をセーブしました'));}
 const compareOld=historyRun&&seed==='q77bi1jx';
 const oldContext=compareOld?await browser.newContext({viewport:{width:390,height:900}}):null;
 const oldPage=oldContext?await oldContext.newPage():null;
 if(oldPage){
  await oldContext.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await oldPage.goto('http://127.0.0.1:'+server.address().port+'/old/?seed='+seed);
  await oldPage.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
  await oldPage.locator('#seg-pos [data-v="'+pos+'"]').click();
  await oldPage.locator('#in-name').fill('年度比較太郎');
  await oldPage.locator('#btn-start').click();
 }
 live.on('console',m=>{if(m.type()==='warning'||m.type()==='error')console.log('PAGE '+seed+' '+m.text());});let verified=0,maxEnvelopeBytes=0,maxProofs=0;const historySizes=[];let salaryHistoryChecked=false,domSample=null;const covered=new Set();for(let year=0;year<40;year++){
  const boundary=await live.evaluate(()=>window.__saveRawBoundary);await writeFile(path.join(out,'latest-boundary.json'),JSON.stringify(boundary));const before=await live.evaluate(()=>window.__saveAcceptance.get());console.log('YEAR '+seed+' '+before.state.year+' '+before.state.lv+' done='+before.state.done+' status='+await live.locator('#save-live').innerText());if(before.state.done)break;
  await live.waitForFunction(y=>document.querySelector('#save-live').textContent.includes(y+'年の開始時点をセーブしました'),before.state.year);
  const size=await live.evaluate(async includeHistory=>{const {BrowserSaveStore}=await import('/src/engine/browser-save-store.js');const st=new BrowserSaveStore(),started=performance.now(),row=await st.read(),readMs=performance.now()-started;st.close();return {readMs,bytes:new TextEncoder().encode(JSON.stringify(row.save)).length,proofs:row.save.awardProofs.length,...(includeHistory?{history:row.save.yearHistory,historyBytes:new TextEncoder().encode(JSON.stringify(row.save.yearHistory)).length}:{})};},historyRun);maxEnvelopeBytes=Math.max(maxEnvelopeBytes,size.bytes);maxProofs=Math.max(maxProofs,size.proofs);
  await resume.goto(url);await resume.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await resume.locator('#save-continue').click();await resume.waitForFunction(y=>document.querySelector('#save-live').textContent.includes(y+'年の最初から再開しました'),before.state.year);assertSameCareer(await resume.evaluate(()=>window.__saveAcceptance.get()),before,'live vs reload '+seed+'/'+before.state.year);verified++;covered.add(before.state.lv);
  if(historyRun){
   assert.equal(size.history.length,verified-1,'every completed annual title is saved');
   const headers=resume.locator('#log .yr-head');
   assert.deepEqual((await headers.allTextContents()).slice(0,-1),size.history.map(record=>record.title));
   assert.equal(await resume.locator('#log .yr-block.collapsed .yr-body > *').count(),0,'closed history has no card DOM');
   historySizes.push({year:before.state.year,saveBytes:size.bytes,historyBytes:size.historyBytes,readMs:size.readMs,
      addedBytes:size.historyBytes-(historySizes.at(-1)?.historyBytes??0)});
   if(verified===22){
    const getCounts=()=>({logNodes:document.querySelectorAll('#log *').length,
       renderedCards:document.querySelectorAll('#log .yr-body .card').length});
    domSample={before:oldPage?await oldPage.evaluate(getCounts):null,
      continuous:await live.evaluate(getCounts),restored:await resume.evaluate(getCounts)};
    assert.ok(!domSample.before||domSample.continuous.logNodes<domSample.before.logNodes,'keep fewer active log nodes than the legacy window');
   }
   if([10,22].includes(verified)){
    const oldest=resume.locator('#log .yr-block').first();
    for(let pass=0;pass<2;pass++){
     await oldest.locator('.yr-head').click();
     assert.match(await oldest.locator('.yr-body').innerText(),/選手誕生/);
     assert.equal(await oldest.locator('.yr-body .card').count(),
       await live.evaluate(html=>{const t=document.createElement('template');t.innerHTML=html;return t.content.querySelectorAll('.card').length;},size.history[0].html));
     assert.equal(await oldest.locator('.yr-body').textContent(),await live.evaluate(html=>{
       const template=document.createElement('template');template.innerHTML=html;return template.content.textContent;
     },size.history[0].html),'saved text is retained in order');
     await oldest.locator('.yr-head').click();
     assert.equal(await oldest.locator('.yr-body > *').count(),0);
    }
   }
   if(!salaryHistoryChecked&&before.state.age>=35){
    const index=size.history.findIndex(record=>record.html.includes('season-salary-detail')&&
      record.salaries.some(snapshot=>snapshot&&snapshot.currentSalary!==before.state.currentSalary));
    if(index>=0){
     const block=resume.locator('#log .yr-block').nth(index);
     const expected=await live.evaluate(async record=>{
       const view=document.createElement('template');view.innerHTML=record.html;
       const buttons=[...view.content.querySelectorAll('.salary-detail-link,.season-salary-detail')];
       const snapshot=record.salaries[buttons.findIndex(button=>button.matches('.season-salary-detail:not([disabled])'))];
       return snapshot&&{year:snapshot.salaryYear,salary:snapshot.currentSalary};
     },size.history[index]);
     if(expected){
      for(let pass=0;pass<2;pass++){
       await block.locator('.yr-head').click();
       await block.getByRole('button',{name:'年俸の内訳を見る'}).click();
       assert.match(await resume.locator('#salary-detail-body').innerText(),new RegExp(String(expected.year)));
       const expectedMoney=await live.evaluate(n=>window.__historyMoney(n),expected.salary);
       assert.ok((await resume.locator('#salary-detail-body').innerText()).includes(expectedMoney),'historical salary amount');
       await resume.locator('#salary-detail-close').click();
       await block.locator('.yr-head').click();
      }
      assertSameCareer(await resume.evaluate(()=>window.__saveAcceptance.get()),before,'history operations preserve S/RNG');
      salaryHistoryChecked=true;
     }
    }
   }
  }

  const originalIndex=await live.evaluate(()=>window.__saveTraceStart),restoredIndex=await resume.evaluate(()=>window.__saveTraceStart);const actions=await live.evaluate(advanceYear);const future=await live.evaluate(()=>window.__saveAcceptance.get());if(oldPage){
   const oldIndex=await oldPage.evaluate(()=>window.__saveTraceStart);
   assert.deepEqual(await oldPage.evaluate(advanceYear),actions,'same baseline choices '+before.state.year);
   assertSameCareer(await oldPage.evaluate(()=>window.__saveAcceptance.get()),future,'unmodified baseline state '+before.state.year);
   assertSameCareer(await oldPage.evaluate(i=>window.__saveTrace.slice(i),oldIndex),
     await live.evaluate(i=>window.__saveTrace.slice(i),originalIndex),'baseline RNG sequence '+before.state.year);
  }
  if(future.state.year!==before.state.year)await live.waitForFunction(y=>document.querySelector('#save-live').textContent.includes(y+'年の開始時点をセーブしました'),future.state.year);await resume.evaluate(advanceYear);const replayed=await resume.evaluate(()=>window.__saveAcceptance.get());await writeFile(path.join(out,'latest-comparison.json'),JSON.stringify({before,future,replayed,originalRng:await live.evaluate(i=>window.__saveTrace.slice(i),originalIndex),restoredRng:await resume.evaluate(i=>window.__saveTrace.slice(i),restoredIndex)}));assertSameCareer(replayed.state,future.state,'entire restored year including payment/awards '+seed+'/'+before.state.year);const originalRng=await live.evaluate(i=>window.__saveTrace.slice(i),originalIndex),restoredRng=await resume.evaluate(i=>window.__saveTrace.slice(i),restoredIndex);assertSameCareer(restoredRng,originalRng,'all RNG values and states through restored year '+seed+'/'+before.state.year);
 }
 const final=await live.evaluate(()=>window.__saveAcceptance.get());let retirementResumeVerified=false;
 if(final.state.done){
  const storedBefore=await live.evaluate(async()=>{const {BrowserSaveStore}=await import('/src/engine/browser-save-store.js');const st=new BrowserSaveStore(),row=await st.read();st.close();return JSON.stringify(row);});
  await resume.goto(url);await resume.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await resume.locator('#save-continue').click();await resume.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('年の最初から再開しました'));if(!await resume.evaluate(()=>window.__saveAcceptance.get().state.done))await resume.evaluate(advanceYear);assert.equal(await resume.evaluate(()=>window.__saveAcceptance.get().state.done),true,'replay annual actions reaches original retirement');assertSameCareer(await resume.evaluate(()=>window.__saveAcceptance.get()),final,'retirement from last annual checkpoint '+seed);
  const storedAfter=await live.evaluate(async()=>{const {BrowserSaveStore}=await import('/src/engine/browser-save-store.js');const st=new BrowserSaveStore(),row=await st.read();st.close();return JSON.stringify(row);});assert.equal(storedAfter,storedBefore,'retirement replay never overwrites annual checkpoint');retirementResumeVerified=true;
 }
 if(oldPage){
  await oldContext.close();
  const legacyContext=await browser.newContext({viewport:{width:390,height:900}});
  const page=await legacyContext.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/legacy/?seed='+seed);
  await page.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
  await page.locator('#seg-pos [data-v="'+pos+'"]').click();
  await page.locator('#in-name').fill('年度比較太郎');
  await page.locator('#btn-start').click();
  await page.evaluate(advanceYear);
  const expected=await page.evaluate(()=>window.__saveAcceptance.get());
  await page.waitForFunction(y=>document.querySelector('#save-live').textContent.includes(y+'年の開始時点をセーブしました'),expected.state.year);
  const legacy=await page.evaluate(async()=>{
   const {BrowserSaveStore}=await import('/legacy/src/engine/browser-save-store.js');
   const store=new BrowserSaveStore();try{return (await store.read()).save;}finally{store.close();}
  });
  assert.equal(legacy.schemaVersion,2);
  assert.equal(legacy.gameVersion,'2.1.0');
  await page.goto(url);
  await page.locator('#save-continue').click();
  await page.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('年の最初から再開しました'));
  assert.equal(await page.locator('#log .yr-head').count(),1,'old checkpoint loads without inventing titles');
  assertSameCareer(await page.evaluate(()=>window.__saveAcceptance.get()),expected,'legacy save reload preserves the original boundary state and RNG');
  await page.evaluate(advanceYear);
  await page.waitForFunction(y=>document.querySelector('#save-live').textContent.includes(y+'年の開始時点をセーブしました'),expected.state.year+1);
  const upgraded=await page.evaluate(async()=>{
   const {BrowserSaveStore}=await import('/src/engine/browser-save-store.js');
   const store=new BrowserSaveStore();try{return (await store.read()).save;}finally{store.close();}
  });
  assert.equal(upgraded.schemaVersion,3);
  assert.equal(upgraded.gameVersion,VERSION);
  assert.equal(upgraded.state.birthHighSchool.createdVersion,'2.1.0');
  assert.deepEqual(upgraded.yearHistory.map(entry=>entry.year),[expected.state.year]);
  await legacyContext.close();
 }
 if(historyRun){
  assert.ok(verified>20&&final.state.age>=35&&final.state.done,'long career reaches retirement');
  assert.ok(salaryHistoryChecked,'historical salary action exercised');
  assert.match(await live.locator('#log .yr-head').first().innerText(),/高校/);
  assert.equal(await live.locator('#log .yr-head').last().innerText(),'現役生活に幕');
 }
 results.push({seed,pos,baseline:compareOld?historyBaseline:null,historySizes,domSample,salaryHistoryChecked,maxEnvelopeBytes,maxProofs,retirementResumeVerified,kind:fixture?'CONTROLLED_FIXTURE':'NATURAL',fixture,years:verified,levels:[...covered],status:'PASS'});console.log(JSON.stringify(results.at(-1)));await writeFile(path.join(out,'progress.json'),JSON.stringify(results,null,2));await context.close();}
await writeFile(path.join(out,'summary.json'),JSON.stringify({results,FAIL:0,scope:'actual live save and reload every playable annual checkpoint'},null,2));}catch(error){await writeFile(path.join(out,'FAIL.json'),JSON.stringify({error:error.stack,results},null,2));console.error(error.stack);process.exitCode=1;}finally{await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);server.closeAllConnections();server.close();process.exit(process.exitCode||0);}
