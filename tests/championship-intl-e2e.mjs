import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url)),baseline='004cd26';
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
// These hooks are injected by this test server/route only, never into shipped files.
const getter=`get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0})`;
const hook=`const realR=R,realAdvance=advance;
window.__champTest={${getter},
 fixture:v=>{R=realR;advance=realAdvance;actClear();S=newState('優勝検証','P');Object.assign(S,{year:2035,age:25,stage:'PRO',stageYr:6,org:'NPB',lv:'NPB1',orgTeamId:'NPB_CL_HAN',lastD:4,lastSt:null,ab:{vel:58,ctl:58,brk:58,sta:58},teamYears:6,seasonFactor:1,skipMid:false,rehab:0,careerEarnings:111,careerBaseSalary:0,yearOutsideIncome:111,currentSalary:100000000,...v});S.ct=createContract({contractId:'fixture',org:S.org,teamId:S.orgTeamId,signedYear:2034,startYear:S.year,years:3,annualSalary:100000000,incentive:null});window.__adv=0;advance=()=>window.__adv++;board(1);},
 force:v=>{R=()=>{realR();return v;};},restore:()=>{R=realR;advance=realAdvance;},
 capture:()=>captureSeasonChampionship(S),end:()=>phaseEnd(),move:()=>movement(),
 change:v=>Object.assign(S,v),intl:phase=>processIntlPhase(phase,()=>window.__adv++),adv:()=>window.__adv,
 season:()=>{const saved=[tjGamble,demotionAudit,tradeCheck,maybeIntl,nextStep];tjGamble=c=>c();demotionAudit=c=>{S.lv='NPB2';c();};tradeCheck=c=>c();maybeIntl=c=>c();nextStep=()=>{};try{proSeason();}finally{[tjGamble,demotionAudit,tradeCheck,maybeIntl,nextStep]=saved;}},
 retire:()=>endGame('優勝・国際特性の表示検証'),
 share:()=>{const out=document.createElement('div');document.body.appendChild(out);const text=[],base=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...a){text.push(t);return base.call(this,t,...a);};try{shareImage([],out);return {png:out.querySelector('img').src,text};}finally{CanvasRenderingContext2D.prototype.fillText=base;out.remove();}}
};`;
function instrument(content,old=false){content=content.replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;');const at=content.lastIndexOf('})();');return content.slice(0,at)+(old?`window.__champTest={${getter}};`:hook)+content.slice(at);}
const cache=new Map();
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),old=u.pathname.startsWith('/baseline/'),rel=decodeURIComponent(u.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('Invalid path');if(old&&!cache.has(rel))cache.set(rel,execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:20*1024*1024}));let content=old?cache.get(rel):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')content=instrument(content.toString(),old);res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`,target=arg('preview')||local;
const browser=await chromium.launch({channel:'chrome',headless:true}),shots=path.join(os.tmpdir(),'yakyujinsei-championship-intl');await mkdir(shots,{recursive:true});
const errors=[];
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,url,pos='P')=>{if(process.argv.includes('--balanced'))await p.addInitScript(()=>window.__balanced=true);if(process.argv.includes('--stay'))await p.addInitScript(()=>window.__stay=true);await p.goto(url);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();};
const action=()=>{const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));if(window.__balanced)rows.sort((a,b)=>{const priority=x=>['vel','ctl','brk','con','pow','eye','spd'].includes(x.dataset.abilityKey)?0:1;return priority(a)-priority(b)||parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent);});const b=rows[0]||(window.__stay&&buttons.find(e=>/現在の球団に残留|宣言残留/.test(e.innerText)))||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)throw Error('No career action '+JSON.stringify({year:window.__champTest.get().state.year,level:window.__champTest.get().state.lv,buttons:act.innerText,log:document.querySelector('#log').innerText.slice(-2000)}));return b;};
const metadata=new Set(['version','championshipResults','seasonChampContext','seasonEndMaintenanceYear','championshipMigrationVersion','internationalTraitMigrationVersion','intlFinalCount','intlTraitResults','wonChamp']);
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>!metadata.has(k)).map(([k,v])=>[k,canonical(v)])):x;
let failure;
try{
 if(arg('preview')){
  const p=await browser.newPage();wire(p);await p.goto(target);
  // Confirm all executable/HTML/CSS assets match this checkout before instrumentation.
  const files=execFileSync('git',['ls-files','docs'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(js|css|html)$/.test(f)).map(f=>f.slice(5));
  for(const f of ['src/engine/championship-policy.js','src/engine/international-trait-policy.js'])if(!files.includes(f))files.push(f);
  for(const rel of files){const deployed=await p.evaluate(async r=>{const response=await fetch('./'+r,{cache:'no-store'});if(!response.ok)throw Error(r+': '+response.status);return response.text();},rel);assert.equal(deployed.replace(/\r\n/g,'\n'),(await readFile(path.join(root,'docs',rel),'utf8')).replace(/\r\n/g,'\n'),rel+' is not latest');}
  console.log(`Preview latest deployment: ${files.length} assets byte-matched; commit ${execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim()}`);await p.close();
  // Normal remote high-school -> professional -> retirement, using only UI actions.
  // Instrumentation observes state/RNG; it does not force RNG or seed game state.
  for(const [seed,pos] of [['yakyo-test-001','P'],['jp3-infielder-01','IF']]){
   const p=await browser.newPage();wire(p);await p.route('**/src/engine/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:instrument(await response.text())});});await start(p,target+'/?seed='+seed,pos);let result,actions=0;
   for(;actions<2500;actions++){const done=await p.evaluate(`(()=>{if(window.__champTest.get().state.done)return true;(${action.toString()})().click();return false;})()`);if(done)break;}
   result=await p.evaluate(()=>window.__champTest.get());assert.equal(result.state.done,true);assert.ok(Object.keys(result.state.championshipResults).length>0);assert.equal(new URL(p.url()).search,'?seed='+seed);console.log(`Preview actual ${seed}/${pos}: ${actions} actions/RNG ${result.calls}, ${Object.values(result.state.championshipResults).filter(r=>r.eligible).length} eligible seasons; no forced outcome`);await p.close();
  }
 }
 if(!process.argv.includes('--ui-only'))for(const [seed,pos] of [['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-catcher-01','C'],['jp3-infielder-01','IF'],['jp3-outfielder-01','OF']].filter(([seed])=>!arg('seed')||arg('seed').split(',').includes(seed))){
  const runs=[];
  for(const old of [true,false,false]){const p=await browser.newPage();wire(p);await start(p,local+(old?'/baseline/':'/')+'?seed='+seed,pos);const records=[];
   for(let i=0;i<2500;i++){const r=await p.evaluate(`(()=>{const h=window.__champTest.get();if(h.state.done)return{record:h,done:true};h.action=(${action.toString()})().innerText;(${action.toString()})().click();return{record:h,done:false};})()`);records.push(r.record);if(r.done)break;if(i===2499)throw Error('Career did not complete');}
   console.log(`${seed}/${pos} ${old?'baseline':'new'}: ${records.length} actions completed`);runs.push(records);await p.close();}
  assert.deepEqual(runs[1],runs[2],seed+' new replay mismatch');let first=-1;
  for(let i=0;i<Math.min(runs[0].length,runs[1].length);i++)if(JSON.stringify(canonical(runs[0][i]))!==JSON.stringify(canonical(runs[1][i]))){first=i;const newRun=runs[1][i],results=Object.values(newRun.state.championshipResults);assert.ok(results.some(r=>r.eligible)||Object.values(newRun.state.intlTraitResults).some(r=>r.unlockedIntlace)||runs[0][i].state.tradeRefuse>0||runs[0][i].state.tradeHeat>0,'unapproved first difference');break;}
  const last=runs[1].at(-1).state;for(const record of runs[1])if(record.state.seasonChampContext?.year===record.state.year){assert.ok(Number.isFinite(record.state.seasonChampContext.ratingD));}
  for(const r of Object.values(last.championshipResults))if(r.eligible)assert.equal(last.honors.filter(h=>h===r.honorText).length,r.won?1:0);
  console.log(`${seed}/${pos}: old ${runs[0].length}/RNG ${runs[0].at(-1).calls} -> new ${runs[1].length}/RNG ${runs[1].at(-1).calls}; exact new replay, first approved difference ${first}, ${Object.values(last.championshipResults).filter(r=>r.eligible).length} eligible seasons`);
 }
 if(!process.argv.includes('--skip-ui'))for(const width of [1280,320,360,390]){
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();wire(p);
  if(arg('preview'))await p.route('**/src/engine/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:instrument(await response.text())});});
  await start(p,target+'/?seed=championship-browser');
  // Real proSeason finalization followed by post-stat demotion: first-team context survives.
  await p.evaluate(()=>{window.__champTest.fixture({});window.__champTest.season();});let s=(await p.evaluate(()=>window.__champTest.get())).state;assert.equal(s.lv,'NPB2');assert.equal(s.seasonChampContext.level,'NPB1');assert.equal(s.seasonChampContext.teamId,'NPB_CL_HAN');assert.ok(s.log.at(-1).st);assert.equal(s.salaryEvaluationHistory.length,1);
  // Real active phaseEnd -> movement -> franchise, plus repeated phaseEnd protection.
  await p.evaluate(()=>{window.__champTest.fixture({});window.__champTest.capture();window.__champTest.force(0);window.__champTest.end();});let before=await p.evaluate(()=>window.__champTest.get());s=before.state;assert.equal(s.traits.franchise,true);assert.equal(s.teamYears,7);assert.equal(s.careerBaseSalary,100000000);assert.equal(s.careerEarnings,100000111);assert.equal(await p.evaluate(()=>window.__champTest.adv()),0);await p.evaluate(()=>window.__champTest.end());assert.deepEqual(await p.evaluate(()=>window.__champTest.get()),before);assert.equal(await p.evaluate(()=>window.__champTest.adv()),0);
  assert.match(await p.locator('#log').innerText(),/阪神ストライプス.*日本一/);await p.locator('[data-main-view="career"]').click();await p.locator('[data-career-tab="achievements"]').click();assert.match(await p.locator('#career-content').innerText(),/2035 日本一/);await p.locator('[data-main-view="home"]').click();
  // Each league's active phaseEnd title, and a loss does not reroll.
  for(const [org,lv,team,title] of [['MLB','MLB','MLB_AL_NYY','ワールドシリーズチャンピオン'],['CPBL','CPBL1','CPBL_TAIPEI_GUARDIANS','台湾シリーズ優勝'],['KBO','KBO1','KBO_SEOUL_TWINS','韓国シリーズ優勝']]){
   const valid=await p.evaluate(org=>window.__YAKYO_JP_DATA__.teams.find(t=>t.org===org).teamId,org);await p.evaluate(v=>{window.__champTest.fixture(v);window.__champTest.capture();window.__champTest.force(0);window.__champTest.end();},{org,lv,orgTeamId:valid});assert.ok((await p.evaluate(()=>window.__champTest.get())).state.honors.includes('2035 '+title));}
  await p.evaluate(()=>{window.__champTest.fixture({});window.__champTest.capture();window.__champTest.force(.99);window.__champTest.end();});before=await p.evaluate(()=>window.__champTest.get());assert.equal(before.state.wonChamp,false);await p.evaluate(()=>window.__champTest.force(0));await p.evaluate(()=>window.__champTest.end());assert.deepEqual(await p.evaluate(()=>window.__champTest.get()),before);
  // Third appearance unlocks on best8; the following appearance gets minimum2, no extra injury.
  await p.evaluate(()=>{window.__champTest.fixture({intlCount:2,intlFinalCount:2});window.__champTest.force(.99);window.__champTest.intl('POST');});const button=p.locator('#act button').filter({hasText:'日本代表として出場'});await button.evaluate(b=>{b.click();b.click();});s=(await p.evaluate(()=>window.__champTest.get())).state;assert.deepEqual([s.intlCount,s.intlFinalCount,s.pool,s.injNext],[3,2,1,10]);assert.equal(s.traits.intlace,true);assert.equal(await p.evaluate(()=>window.__champTest.adv()),1);assert.match(await p.locator('#log').innerText(),/次回の代表出場から/);
  await p.evaluate(()=>{window.__champTest.change({year:2038});window.__champTest.intl('PRE');});await p.locator('#act button').filter({hasText:'日本代表として出場'}).click();s=(await p.evaluate(()=>window.__champTest.get())).state;assert.deepEqual([s.intlCount,s.pool,s.injNext],[4,3,10]);
  await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();assert.match(await p.locator('#player-content').innerText(),/国際大会による故障リスク加算なし.*最低2点/);await p.locator('[data-main-view="home"]').click();
  await p.evaluate(()=>window.__champTest.retire());assert.match(await p.locator('#log').innerText(),/獲得した大会では適用されず/);const image=await p.evaluate(()=>window.__champTest.share());assert.ok(image.png.startsWith('data:image/png'));assert.match(image.text.join(''),/国際大会による故障リスク加算なし.*最低2点/);
  for(const injured of [false,true]){await p.evaluate(injured=>{window.__champTest.fixture({rehab:injured?1:0});window.__champTest.intl('POST');},injured);if(!injured)await p.locator('#act button').filter({hasText:'辞退'}).evaluate(b=>{b.click();b.click();});s=(await p.evaluate(()=>window.__champTest.get())).state;assert.deepEqual([s.intlCount,s.intlFinalCount,s.pool,s.injNext,s.intlStat.G],[0,0,0,0,0]);assert.equal(s.intlCompletedKeys['P12:2035'],true);}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(shots,(arg('preview')?'preview-':'local-')+width+'.png')});console.log(`${width}px: active season/championship/4 leagues/franchise/payments/intl/unlock/next-effect/decline/injury/retirement/PNG PASS`);await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log('Console/JS-CSS404: 0; screenshots '+shots);
}catch(e){failure=e;console.error(e.stack);console.error('Browser errors:',errors);}finally{server.closeAllConnections();server.close();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
