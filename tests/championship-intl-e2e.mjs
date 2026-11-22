import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {instrumentRng} from './support/rng-instrument.mjs';
import {injectOverlayHook} from './support/overlay-hook.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),baseline='004cd26';
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
// These hooks are injected by this test server/route only, never into shipped files.
const getter=`get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0})`;
const hook=`const realR=R;
window.__champTest={${getter},
 fixture:v=>{R=realR;flowHooks.advance=null;actClear();S=newState('優勝検証','P');Object.assign(S,{year:2035,age:25,stage:'PRO',stageYr:6,org:'NPB',lv:'NPB1',orgTeamId:'NPB_CL_HAN',lastD:4,lastSt:null,ab:{vel:58,ctl:58,brk:58,sta:58},teamYears:6,seasonFactor:1,skipMid:false,rehab:0,careerEarnings:111,careerBaseSalary:0,yearOutsideIncome:111,currentSalary:100000000,...v});S.ct=createContract({contractId:'fixture',org:S.org,teamId:S.orgTeamId,signedYear:2034,startYear:S.year,years:3,annualSalary:100000000,incentive:null});window.__adv=0;flowHooks.advance=()=>window.__adv++;board(1);},
 force:v=>{R=()=>{realR();return v;};},restore:()=>{R=realR;flowHooks.advance=null;},
 capture:()=>captureSeasonChampionship(S),end:()=>phaseEnd(),move:()=>movement(),
 change:v=>Object.assign(S,v),intl:phase=>processIntlPhase(phase,()=>window.__adv++),adv:()=>window.__adv,
 season:()=>{const saved=[tjGamble,demotionAudit,tradeCheck,maybeIntl,nextStep];tjGamble=c=>c();demotionAudit=c=>{S.lv='NPB2';c();};tradeCheck=c=>c();maybeIntl=c=>c();nextStep=()=>{};try{proSeason();}finally{[tjGamble,demotionAudit,tradeCheck,maybeIntl,nextStep]=saved;}},
 retire:()=>endGame('優勝・国際特性の表示検証'),
 share:async()=>{const out=document.createElement('div');document.body.appendChild(out);const text=[],base=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(t,...a){text.push(t);return base.call(this,t,...a);};try{await shareImage([],out);return {png:out.querySelector('img').src,text};}finally{CanvasRenderingContext2D.prototype.fillText=base;out.remove();}}
};`;
// Manual compare only: window.__champRng (start() opts.isolate) replaces the single championship draw on each side; draws count in __champDraws.
function isolateChampionship(content,old){const [from,to]=old?['if(chance(pcc)){','if((window.__champRng?(window.__champDraws=(window.__champDraws||0)+1,window.__champRng()*100<pcc):chance(pcc))){']:['random:()=>R()','random:()=>window.__champRng?(window.__champDraws=(window.__champDraws||0)+1,window.__champRng()):R()'];if(content.split(from).length!==2)throw Error('CHAMPIONSHIP_ISOLATION_MISS '+(old?'baseline':'current'));return content.replace(from,()=>to);}
function instrument(content,old=false){content=isolateChampionship(content,old);content=instrumentRng(content,'__rngCalls');return injectOverlayHook(content,old?`window.__champTest={${getter}};`:hook);}
const cache=new Map();
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),old=u.pathname.startsWith('/baseline/'),rel=decodeURIComponent(u.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('Invalid path');if(old&&!cache.has(rel))cache.set(rel,execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:20*1024*1024}));let content=old?cache.get(rel):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')content=instrument(content.toString(),old);res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`,target=arg('preview')||local;
const browser=await chromium.launch({channel:process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||'chrome',headless:true}),shots=path.join(os.tmpdir(),'yakyujinsei-championship-intl');await mkdir(shots,{recursive:true});
const errors=[];
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
// Identical explicit input preserves full-state/RNG replay; blank product names intentionally vary.
const replayNames={P:'投山翔太',C:'強肩剛',IF:'守田巧',OF:'走川隼人'};
// opts.picker: per-run override ('balanced'|'stay'|'default'); when omitted, the --balanced/--stay flags apply.
// opts.refuse: choose 拒否権を行使して残留する on star trade offers (sets tradeRefuse).
// opts.eligible / opts.won / opts.trade (seed list only): coverage guards checked after the compare.
// opts.isolate: seed string for the separate championship stream (manual compare only).
const start=async(p,url,pos='P',name,normalPitch=false,opts={})=>{const picker=opts.picker;if(picker?picker==='balanced':process.argv.includes('--balanced'))await p.addInitScript(()=>window.__balanced=true);if(normalPitch)await p.addInitScript(()=>window.__normalPitch=true);if(picker?picker==='stay':process.argv.includes('--stay'))await p.addInitScript(()=>window.__stay=true);if(opts.refuse)await p.addInitScript(()=>window.__refuse=true);if(opts.isolate)await p.addInitScript(seed=>{let h=1779033703^seed.length;for(let i=0;i<seed.length;i++){h=Math.imul(h^seed.charCodeAt(i),3432918353);h=h<<13|h>>>19;}let a=(h^h>>>16)>>>0;window.__champRng=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};},opts.isolate);await p.goto(url);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();if(name)await p.locator('#in-name').fill(name);await p.locator('#btn-start').click();};
const action=()=>{const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));if(window.__balanced)rows.sort((a,b)=>{const priority=x=>['vel','ctl','brk','con','pow','eye','spd'].includes(x.dataset.abilityKey)?0:1;return priority(a)-priority(b)||parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent);});const b=rows[0]||(window.__stay&&buttons.find(e=>/現在の球団に残留|宣言残留/.test(e.innerText)))||(window.__refuse&&buttons.find(e=>/拒否権を行使して残留する/.test(e.innerText)))||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||(window.__normalPitch&&buttons.find(e=>/^通常投球/.test(e.innerText)))||buttons[0];if(!b)throw Error('No career action '+JSON.stringify({year:window.__champTest.get().state.year,level:window.__champTest.get().state.lv,buttons:act.innerText,log:document.querySelector('#log').innerText.slice(-2000)}));return b;};
const metadata=new Set(['version','championshipResults','seasonChampContext','seasonEndMaintenanceYear','championshipMigrationVersion','internationalTraitMigrationVersion','intlFinalCount','intlTraitResults','wonChamp']);
const championshipKeys=new Set(['honors','champThisTeam','champTeam','tradeRefuse']);
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.entries(x).filter(([k])=>!metadata.has(k)).map(([k,v])=>[k,canonical(v)])):x;
// Baseline comparison (TEST-MANUAL-HISTORICAL-COMPARE-01): every top-level state key the baseline already has must match,
// except those `metadata` excludes (keys added later are not compared; nested values are compared in full), plus RNG
// state/count. Action text is not compared.
// The new-only jersey choice step (PLY-01, 9315543) is removed before step alignment.
const jerseyStep=/背番号\s*\d+\s*で入団する/;
const historical=(base,record=base)=>({state:Object.fromEntries(Object.keys(base.state).filter(k=>Object.hasOwn(record.state,k)).map(k=>[k,record.state[k]])),rng:record.rng,calls:record.calls});
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
 // jp3-catcher-03 replaces jp3-catcher-01, whose school changed in 1.12.0 (d8f2df9); jp3-pitcher-16 reaches championship-eligible CPBL seasons
 // (lost, so with the isolated stream they leave no difference).
 // Pitchers choose 通常投球: 004cd26 stored 全力投球 as '全力投', so its effect was missing until 1.11.9 (a1658c9).
 // jp3-catcher-16 with the balanced picker: first difference is the won 2040 KBO1 season (step 223), so the honors check below sees won=1.
 // jp3-infielder-11 refuses a star trade: the first difference (step 168) is the refusal step, which also settles the eligible 2036 season, so the
 // current version's season-end maintenance lowers tradeRefuse within that step (baseline 2, current 1).
 // Championship isolation (TEST-HISTORICAL-BRANCH-COVERAGE-01): only the current version draws championships (004cd26 made none in any seed
 // checked), so with one shared RNG each extra draw moved every later draw to another purpose. When the counts happened to cancel (one extra
 // championship draw against one more baseline training die), the shift surfaced steps later as an unrelated-looking ability difference.
 // Manual compare therefore draws championships from a separate seeded stream on both sides, and the main RNG must stay aligned.
 // Approval: the first difference must be the step that adds a championship-eligible result, and only championshipKeys may differ there.
 // International-unlock and trade-counter conditions were removed (no seed needed them); such a difference now fails and must be investigated.
 if(!process.argv.includes('--ui-only'))for(const [seed,pos,opts={}] of [['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-pitcher-16','P',{eligible:true}],['jp3-catcher-03','C'],['jp3-catcher-16','C',{picker:'balanced',won:true}],['jp3-infielder-01','IF'],['jp3-infielder-11','IF',{picker:'balanced',refuse:true,trade:true}],['jp3-outfielder-01','OF']].filter(([seed])=>!arg('seed')||arg('seed').split(',').includes(seed))){
  const runs=[];
  for(const old of [true,false,false]){const p=await browser.newPage();wire(p);await start(p,local+(old?'/baseline/':'/')+'?seed='+seed,pos,replayNames[pos],true,{...opts,isolate:'championship:'+seed});const records=[];
   for(let i=0;i<2500;i++){const r=await p.evaluate(`(()=>{const h=window.__champTest.get();h.champDraws=window.__champDraws||0;if(h.state.done)return{record:h,done:true};h.action=(${action.toString()})().innerText;(${action.toString()})().click();return{record:h,done:false};})()`);records.push(r.record);if(r.done)break;if(i===2499)throw Error('Career did not complete');}
   console.log(`${seed}/${pos} ${old?'baseline':'new'}: ${records.length} actions completed`);runs.push(records);await p.close();}
  assert.deepEqual(runs[1],runs[2],seed+' new replay mismatch');let first=-1;const aligned=runs[1].filter(r=>!jerseyStep.test(r.action||''));
  for(let i=0;i<Math.min(runs[0].length,aligned.length);i++)if(JSON.stringify(canonical(historical(runs[0][i])))!==JSON.stringify(canonical(historical(runs[0][i],aligned[i])))){first=i;const o=runs[0][i],n=aligned[i],prev=i>0?aligned[i-1].state.championshipResults:null,changed=Object.keys(o.state).filter(k=>!metadata.has(k)&&(!Object.hasOwn(n.state,k)||JSON.stringify(canonical(o.state[k]))!==JSON.stringify(canonical(n.state[k]))));const added=prev?Object.entries(n.state.championshipResults).filter(([year,r])=>r.eligible&&!prev[year]?.eligible).map(([,r])=>r):[];assert.ok(added.length>0,'unapproved first difference: no championship-eligible result added at step '+i);assert.ok(JSON.stringify(o.rng)===JSON.stringify(n.rng)&&o.calls===n.calls&&changed.length>0&&changed.every(k=>championshipKeys.has(k)),'unapproved first difference at step '+i+': '+changed.join(','));
   // Values: honors gain exactly the won titles; champThisTeam/champTeam change only for a title won with the current team; tradeRefuse may only
   // be one season-end maintenance ahead of the baseline.
   const won=added.filter(r=>r.won),honors=[...o.state.honors];for(const r of won)if(!honors.includes(r.honorText))honors.push(r.honorText);const team=won.find(r=>r.teamId===n.state.orgTeamId);
   assert.ok(JSON.stringify(n.state.honors)===JSON.stringify(honors)&&(team?n.state.champThisTeam===true&&n.state.champTeam===team.teamId:n.state.champThisTeam===o.state.champThisTeam&&n.state.champTeam===o.state.champTeam)&&(n.state.tradeRefuse===o.state.tradeRefuse||n.state.tradeRefuse===Math.max(0,o.state.tradeRefuse-1)),'unapproved first difference at step '+i+': championship values '+JSON.stringify({won:won.map(r=>r.honorText),honors:n.state.honors.filter(h=>!o.state.honors.includes(h)),champThisTeam:[o.state.champThisTeam,n.state.champThisTeam],champTeam:[o.state.champTeam,n.state.champTeam],tradeRefuse:[o.state.tradeRefuse,n.state.tradeRefuse]}));break;}
  const last=runs[1].at(-1).state;for(const record of runs[1])if(record.state.seasonChampContext?.year===record.state.year){assert.ok(Number.isFinite(record.state.seasonChampContext.ratingD));}
  for(const r of Object.values(last.championshipResults))if(r.eligible)assert.equal(last.honors.filter(h=>h===r.honorText).length,r.won?1:0);
  assert.equal(runs[1].at(-1).champDraws,Object.values(last.championshipResults).filter(r=>r.eligible).length,seed+' championship draws did not use the isolated stream');
  // Coverage guards (opts.eligible / opts.won / opts.trade): a seed listed for a branch must keep reaching it.
  if(opts.eligible)assert.ok(Object.values(last.championshipResults).some(r=>r.eligible),seed+' lost its championship-eligible seasons');
  if(opts.won)assert.ok(Object.values(last.championshipResults).some(r=>r.eligible&&r.won),seed+' lost its won championship-eligible season');
  if(opts.trade)assert.ok(first>=0&&runs[0][first].state.tradeRefuse>0,seed+' lost its baseline tradeRefuse first difference');
  console.log(`${seed}/${pos}: old ${runs[0].length}/RNG ${runs[0].at(-1).calls} -> new ${runs[1].length}/RNG ${runs[1].at(-1).calls}; exact new replay, ${runs[1].length-aligned.length} jersey steps aligned, first approved difference ${first}, ${Object.values(last.championshipResults).filter(r=>r.eligible).length} eligible seasons`);
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
  await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();assert.match(await p.locator('#player-content').innerText(),/国際大会の鬼/);assert.doesNotMatch(await p.locator('#player-content').innerText(),/国際大会による故障リスク加算なし|最低2点/);await p.locator('[data-main-view="home"]').click();
  await p.evaluate(()=>window.__champTest.retire());assert.doesNotMatch(await p.locator('#log').innerText(),/獲得した大会では適用されず/);const image=await p.evaluate(()=>window.__champTest.share());assert.ok(image.png.startsWith('data:image/png'));assert.match(image.text.join(''),/国際大会の鬼/);assert.doesNotMatch(image.text.join(''),/国際大会による故障リスク加算なし|最低2点/);
  for(const injured of [false,true]){await p.evaluate(injured=>{window.__champTest.fixture({rehab:injured?1:0});window.__champTest.intl('POST');},injured);if(!injured)await p.locator('#act button').filter({hasText:'辞退'}).evaluate(b=>{b.click();b.click();});s=(await p.evaluate(()=>window.__champTest.get())).state;assert.deepEqual([s.intlCount,s.intlFinalCount,s.pool,s.injNext,s.intlStat.G],[0,0,0,0,0]);assert.equal(s.intlCompletedKeys['P12:2035'],true);}
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(shots,(arg('preview')?'preview-':'local-')+width+'.png')});console.log(`${width}px: active season/championship/4 leagues/franchise/payments/intl/unlock/next-effect/decline/injury/retirement/PNG PASS`);await ctx.close();
 }
 assert.deepEqual(errors,[]);console.log('Console/JS-CSS404: 0; screenshots '+shots);
}catch(e){failure=e;console.error(e.stack);console.error('Browser errors:',errors);}finally{server.closeAllConnections();server.close();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
