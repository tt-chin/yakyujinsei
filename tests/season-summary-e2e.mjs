import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {projectDecisionPresentation} from './support/decision-dom-comparison.mjs';
import {currentUiBaselineVersion} from './support/ui-version-comparison.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const baseline='cf88d1a9d621c354d64a2de5c427cd437a8094bf',output=path.resolve(arg('output')||'test-results/season-summary');await mkdir(output,{recursive:true});
const hook=`
window.__summaryProjection=${projectDecisionPresentation.toString()};
window.__summaryDraws=[];careerRng.onDraw=value=>window.__summaryDraws.push({value,state:S.rngState});
window.__summaryTest={
 get:()=>({state:JSON.parse(JSON.stringify(S)),draws:window.__summaryDraws.slice()}),settle:()=>browserSave.settled(),
 setup:(pos,kind,options={})=>{actClear();S={rngState:0};seedInit(SEED);S=newState('年度表示検証',pos);const org='MiLB',team=listByOrg(org)[0].teamId;
 Object.assign(S,{year:2030,age:25,stage:'PRO',org,lv:'A3',orgTeamId:team,role:pos==='P'?'SP':null,dpos:pos==='P'?null:'SS',lastD:3,seasonFactor:1,skipMid:false,rehab:0,pool:0,currentSalary:10000000,yearOutsideIncome:80000,careerOutsideIncome:80000,careerEarnings:32280000,careerBaseSalary:30000000,careerIncentive:0,honors:[],log:[{y:2030,tm:'年度球団',st:{G:30,IP:120,W:10,L:3,SO:100,PA:400,AB:360,H:100,HR:20,RBI:60}}],lastSalaryEvaluation:{year:2030,sampleStatus:'SUFFICIENT',payD:3},salaryDecisionHistory:[],lastSalaryDecision:null,lastSalaryPaidYear:2029,stats:{},teamTally:{}});
 S.ct=createContract({contractId:'SUMMARY-'+kind,org,teamId:team,signedYear:2029,startYear:2029,years:kind==='expired-demotion'?2:3,annualSalary:10000000,incentive:{annualMax:400000,halfPayDThreshold:3}});S.ct=markSalaryPaid(S.ct,2029).contract;careerSession.pendingOffseasonSalary=null;careerSession.seasonEndContext=null;document.getElementById('log').replaceChildren();divider('2030年・シーズン終了');window.__summaryDraws=[];S.pool=options.pool||0;board(options.phase??2);},
 endChoice:()=>choose('',[{t:'▸ 季末結算へ',main:true,f:()=>window.__summaryTest.pay()}]),
 pending:kind=>{if(kind==='tj')S.tj=tjCap();else{S.org='NPB';S.lv='NPB1';S.orgTeamId=listByOrg('NPB')[0].teamId;S.tradeHeat=100;for(const k of POS_AB[S.pos])S.ab[k]=80;}board(1);choose('',[{t:'▸ 今季の成績を見る',main:true,f:()=>(kind==='tj'?tjGamble:tradeCheck)(()=>window.__summaryTest.pay())}]);},
 allocation:operation=>{const saved=movement;movement=()=>choose('配分完了',[{t:'次へ',f:()=>{}}]);try{const act=document.getElementById('act');(operation==='spend'?act.querySelector('.abrow[aria-disabled="false"]'):act.querySelector('button.main:not(:disabled)')).click();}finally{movement=saved;}},
 pay:()=>{const saved=movement;movement=()=>{};try{phaseEnd();}finally{movement=saved;}},
 resolve:kind=>{if(kind==='promotion'){const from=S.lv;S.lv='MLB';applyPromotionSalary(from,S.lv);card('good','昇格通知','MLBへ昇格しました。');board(2);}else if(kind==='demotion'||kind==='expired-demotion'){const from=S.lv;S.lv='A2';applyDemotionSalary(from,S.lv);card('info','降格通知','降格を受け入れました。');board(2);}else if(kind==='renewal'){const saved=flowHooks.advance;flowHooks.advance=()=>{};try{careerContract.renewAndAdvance();}finally{flowHooks.advance=saved;}}else if(kind==='transfer'){signTo('KBO','KBO1',listByOrg('KBO')[0].teamId,2,1,'OVERSEAS',{annualSalary:40000000});}else if(kind==='missing'){S.ct=null;S.currentSalary=999999999;S.salaryDecisionHistory=[{decisionYear:2027,salaryYear:2028,finalSalary:88888888}];}},
 advance:()=>{const saved=startYear;startYear=()=>{divider(S.year+'年・シーズン前');board(0);};try{advance();}finally{startYear=saved;}},
 refresh:()=>{board(2);gameView.careerReview?.render(S.done);},
 retire:()=>endGame('年度表示検証の引退'),
 repaintOld:()=>gameView.careerReview?.seasons?.paint(gameView.careerReview.seasons.entries(S).get(2030)),
 amateur:stage=>{S.stage=stage;S.done=false;S.year=2040;careerSession.seasonEndContext=null;document.getElementById('log').replaceChildren();divider('2040年・シーズン終了');board(2);},
 later:()=>{S.year=2032;S.currentSalary=999999999;S.yearOutsideIncome=999;S.careerEarnings+=123;S.ct=createContract({contractId:'LATER',org:S.org,teamId:S.orgTeamId,signedYear:2031,startYear:2032,years:2,annualSalary:999999999});if(S.lastSalaryDecision)S.lastSalaryDecision={...S.lastSalaryDecision,decisionYear:2031,salaryYear:2032,finalSalary:999999999};},
};`;
const cache=new Map(),server=createServer(async(req,res)=>{try{let rel=new URL(req.url,'http://local').pathname.slice(1)||'index.html',old=rel.startsWith('baseline/');if(old)rel=rel.slice(9)||'index.html';if(rel==='favicon.ico'){res.statusCode=204;return res.end();}if(rel.split('/').includes('..'))throw Error('path');let body;if(old){if(!cache.has(rel))cache.set(rel,execFileSync('git',['show',baseline+':docs/'+rel],{cwd:root,maxBuffer:30e6}));body=cache.get(rel);}else body=await readFile(path.join(root,'docs',rel));if(old&&rel==='src/config.js')body=currentUiBaselineVersion(body);if(rel==='src/engine/game.js')body=body.toString()+hook;res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':'text/html');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium}=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright'),browser=await chromium.launch({headless:true,channel:arg('browser')||'chromium'}),errors=[],cases=[],layouts=[];
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const get=p=>p.evaluate(()=>window.__summaryTest.get());
// Preserve the pre-integration baseline. The promotion fixture's approved US
// identity fix changes only these exact org fields; compare every other field
// and every RNG value, including all financial amounts, without projection.
function withApprovedUsPromotion(snapshot){
 const expected=structuredClone(snapshot),s=expected.state;
 if(s.org!=='MiLB'||s.lv!=='MLB')return expected;
 assert.equal(s.lastSalaryDecision?.decisionType,'PROMOTION');
 assert.equal(s.lastSalaryDecision.sourceLevel,'A3');assert.equal(s.lastSalaryDecision.targetLevel,'MLB');
 s.org='MLB';
 for(const decision of [s.lastSalaryDecision,...s.salaryDecisionHistory]){
  if(decision.org!=='MiLB')continue;
  assert.equal(decision.decisionType,'PROMOTION');assert.equal(decision.sourceLevel,'A3');assert.equal(decision.targetLevel,'MLB');
  assert.ok([2030,2031].includes(decision.decisionYear));decision.org='MLB';
 }
 // The explicit later-year isolation fixture creates this contract using S.org.
 // Keep the original signed contract's historical org unchanged everywhere else.
 if(s.ct?.contractId==='LATER'){assert.equal(s.ct.org,'MiLB');s.ct.org='MLB';}
 return expected;
}
async function open(old){const p=await browser.newPage({viewport:{width:390,height:844}});await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto('http://127.0.0.1:'+server.address().port+(old?'/baseline/':'/')+'?seed=season-summary-regression');await p.waitForFunction(()=>!document.getElementById('btn-start').disabled);await p.locator('#in-name').fill('年度表示検証');await p.locator('#btn-start').click();await p.evaluate(()=>window.__summaryTest.settle());return p;}
async function scrollChecks(p,old,both){
 const settle=async()=>{await frames(p);await frames(p);};
 const scroll=()=>({page:scrollY,log:document.getElementById('log').scrollTop,host:document.getElementById('view-host').scrollTop});
 const position=()=>{const heading=document.querySelector('[data-season-summary="2030"] h2'),r=heading.getBoundingClientRect(),v=visualViewport;
  let top=Math.max(v?.offsetTop||0,document.getElementById('main-nav').getBoundingClientRect().bottom),bottom=Math.min(innerHeight,(v?.offsetTop||0)+(v?.height??innerHeight));
  for(let a=heading.parentElement;a&&a!==document.body;a=a.parentElement)if(/auto|scroll/.test(getComputedStyle(a).overflowY)&&a.scrollHeight>a.clientHeight+1){const b=a.getBoundingClientRect();top=Math.max(top,b.top+a.clientTop);bottom=Math.min(bottom,b.top+a.clientTop+a.clientHeight);}
  return {top,bottom,y:r.top,end:r.bottom};};
 const aligned=async label=>{const b=await p.evaluate(position);assert.ok(b.y>=b.top-1&&b.y<=b.top+10&&b.end<=b.bottom+1,label+JSON.stringify(b));};
 const setup=async pool=>{await both(pool=>{document.dispatchEvent(new WheelEvent('wheel',{bubbles:true}));window.__summaryTest.setup('P','scroll',{phase:1,pool});
  const before=document.createElement('div');before.dataset.scrollFixture='';before.style.height='1200px';document.getElementById('log').prepend(before);
  const after=before.cloneNode();after.style.height='1800px';document.querySelector('.yr-body').append(after);window.__summaryTest.endChoice();},pool);await settle();};
 // Use native choice dispatch and the original settlement on both versions.
 // Existing exact DOM and complete S/RNG comparisons still apply at each step.
 for(const [width,height] of [[320,568],[390,844],[844,390],[1280,900]]){
  await p.setViewportSize({width,height});await old.setViewportSize({width,height});await setup(2);
  await both(()=>{document.getElementById('act').querySelector('button').click();});await settle();await aligned('first summary '+width+': ');
  if(width===390)await p.screenshot({path:path.join(output,'summary-scroll-mobile.png')});
  assert.notEqual(await p.locator('[data-season-summary] h2').evaluate(n=>document.activeElement===n),true,'auto reveal does not take keyboard focus');
  assert.equal(await p.locator('#decision-jump').isVisible(),await p.evaluate(()=>[...document.querySelectorAll('#act button:not(:disabled)')].some(n=>n.getBoundingClientRect().bottom>innerHeight)),'down arrow still reflects unfinished actions');
  await both(()=>{const detail=document.querySelector('[data-season-disclosure="income"]');if(detail)detail.open=true;document.dispatchEvent(new WheelEvent('wheel',{bubbles:true}));window.scrollTo(0,650);document.getElementById('log').scrollTop=500;});await settle();
  const before=await p.evaluate(scroll),snapshot=await get(p);
  for(let i=0;i<3;i++)await both(()=>window.__summaryTest.refresh());await settle();assert.deepEqual(await p.evaluate(scroll),before,'redraw cannot return to summary');assert.deepEqual(await get(p),snapshot,'navigation and redraw consume no state/RNG');
  assert.equal(await p.locator('[data-season-disclosure="income"]').evaluate(n=>n.open),true,'manual disclosure remains open');
  if(width===390){
   await both(()=>document.getElementById('act').querySelector('button').click());await settle();
   for(let i=0;i<2;i++)await both(()=>window.__summaryTest.allocation('spend'));await settle();
   await both(()=>window.__summaryTest.allocation('confirm'));await settle();
   const at=await p.evaluate(position);assert.ok(at.end<at.top,'native allocation completion does not jump back to the summary');
   cases.push({scroll:'native-season-allocation',status:'PASS'});
   // Return to a deliberate reading position before testing later display updates.
   await both(()=>{document.dispatchEvent(new WheelEvent('wheel',{bubbles:true}));window.scrollTo(0,650);document.getElementById('log').scrollTop=500;});await settle();
  }
  const updatePosition=await p.evaluate(scroll);
  await both(()=>window.__summaryTest.resolve('promotion'));await settle();assert.deepEqual(await p.evaluate(scroll),updatePosition,'contract update cannot return to summary');
  await both(()=>window.__summaryTest.advance());await settle();assert.deepEqual(await p.evaluate(scroll),updatePosition,'next year cannot replay old summary reveal');
  layouts.push({scroll:'first/once/redraw/contract/advance',width,height});
 }
 // Real existing TJ/trade prompts run before the original settlement. Neither
 // the result-selection focus nor an earlier scrollBottom may win afterwards.
 for(const kind of ['tj','trade']){
  await p.setViewportSize({width:390,height:844});await old.setViewportSize({width:390,height:844});await setup(0);
  await both(kind=>window.__summaryTest.pending(kind),kind);
  await both(()=>document.getElementById('act').querySelector('button').click());await settle();
  assert.equal(await p.locator('[data-season-summary]').count(),0,'no early summary at '+kind);
  assert.match(await p.locator('#act > .title').textContent(),kind==='tj'?/TJの決断/:/トレード/);
  await both(kind=>{const buttons=[...document.querySelectorAll('#act button')];buttons[kind==='trade'?1:0].click();},kind);await settle();
  assert.equal(await p.locator('[data-season-summary="2030"]').count(),1);await aligned('after '+kind+': ');cases.push({scroll:kind,status:'PASS'});
 }
 // Cancel while the originating action has queued both the old bottom frame
 // and the new summary request, before either animation frame can execute.
 for(const mode of ['wheel','touch','keyboard','player','career','dialog','stale-year','detached']){
  await setup(2);
  await both(mode=>{document.getElementById('act').querySelector('button').click();
   if(mode==='wheel')document.dispatchEvent(new WheelEvent('wheel',{bubbles:true}));
   if(mode==='touch')document.dispatchEvent(new Event('touchmove',{bubbles:true}));
   if(mode==='keyboard')document.dispatchEvent(new KeyboardEvent('keydown',{key:'PageUp',bubbles:true}));
   if(mode==='player'||mode==='career')document.querySelector('[data-main-view="'+mode+'"]').click();
   if(mode==='dialog')document.getElementById('board-menu-panel').showModal();
   if(mode==='stale-year')window.__summaryTest.advance();
   if(mode==='detached')document.querySelector('[data-season-summary]')?.remove();
   window.scrollTo(0,0);document.getElementById('log').scrollTop=0;
  },mode);await settle();
  assert.equal((await p.evaluate(scroll)).page,0,'cancelled '+mode+' cannot pull page');assert.equal((await p.evaluate(scroll)).log,0,'cancelled '+mode+' cannot pull log');
  if(mode==='dialog')await both(()=>document.getElementById('board-menu-panel').close());
  if(mode==='player'||mode==='career')await both(()=>document.querySelector('[data-main-view="home"]').click());
  if(mode!=='detached'&&mode!=='stale-year'){await both(()=>window.__summaryTest.refresh());await settle();assert.equal((await p.evaluate(scroll)).page,0,'cancelled request is never retried '+mode);}
  cases.push({scroll:'cancel-'+mode,status:'PASS'});
 }
}
let failure;
try{
 const p=await open(false),old=await open(true),project=q=>q.evaluate(()=>window.__summaryProjection(document.getElementById('log').outerHTML,'log',window.__summaryTest.get().state)),both=async(fn,arg)=>{await p.evaluate(fn,arg);await old.evaluate(fn,arg);assert.deepEqual(await get(p),withApprovedUsPromotion(await get(old)),'complete state/RNG except the exact approved promotion org fields');assert.equal(await project(p),await project(old),'every original card survives the explicitly validated display integration');};
 for(const pos of ['P','IF'])for(const kind of ['continuation','promotion','demotion','expired-demotion','renewal','transfer','missing','retirement']){
  await both(v=>window.__summaryTest.setup(v.pos,v.kind),{pos,kind});
  await both(()=>window.__summaryTest.pay());const paid=await get(p);assert.equal(paid.state.careerBaseSalary,40_000_000);assert.equal(paid.state.yearlyIncentivePaid['2030'].amount,200_000);
  const summary=p.locator('[data-season-summary="2030"]');assert.equal(await summary.count(),1);assert.match(await summary.innerText(),/今季受取総額：1,028万円/);assert.match(await summary.innerText(),/来季年俸：手続き中/);assert.equal(await summary.locator('details[open]').count(),0);
  assert.equal(await p.evaluate(()=>{const clone=document.getElementById('log').cloneNode(true);clone.querySelector('[data-season-summary] > p').textContent='今季受取総額：999万円';try{window.__summaryProjection(clone.outerHTML,'log',window.__summaryTest.get().state);return false;}catch(e){return e.message==='PHASE3_SEASON_INCOME';}}),true,'historical display adapter rejects a corrupted receipt total');
  for(let i=0;i<3;i++)await both(()=>window.__summaryTest.refresh());assert.deepEqual(await get(p),paid,'redraw never pays or draws RNG');
  await both(()=>window.__summaryTest.pay());assert.deepEqual(await get(p),paid,'duplicate payment entry remains guarded');
  if(kind==='retirement')await both(()=>window.__summaryTest.retire());else{await both(k=>window.__summaryTest.resolve(k),kind);assert.match(await summary.innerText(),/来季年俸：手続き中/);await both(()=>window.__summaryTest.advance());}
  const sealed=await get(p);assert.equal(await summary.count(),1);assert.equal(await p.locator('[data-season-finance-source]:visible').count(),0);assert.doesNotMatch(await summary.innerText(),/再計算はありません/);
  const expected=kind==='retirement'?'未定（引退）':kind==='missing'?'未定':(()=>{const yen=sealed.state.ct.annualSchedule.find(x=>x.year===2031).amount,oku=Math.floor(yen/1e8),man=Math.floor(yen%1e8/1e4);return(oku?oku+'億':'')+(man?man.toLocaleString('ja-JP')+'万円':oku?'円':'0円');})();
  assert.ok((await summary.innerText()).includes('来季年俸：'+expected),JSON.stringify({pos,kind,expected,text:await summary.innerText()}));
  if(kind==='promotion'){assert.match(await summary.innerText(),/前年比：\+1億1,000万円（\+1100\.0%）/);assert.equal(await p.locator('.card').filter({has:p.locator('h4',{hasText:'昇格通知'})}).count(),1);}
  await summary.locator('[data-season-disclosure="income"]>summary').click();assert.match(await summary.innerText(),/今季支給年俸：1,000万円/);assert.match(await summary.innerText(),/出来高：20万円/);assert.match(await summary.innerText(),/スポンサー収入：8万円/);
  await summary.locator('[data-season-disclosure="review"]>summary').click();assert.match(await summary.innerText(),pos==='P'?/投球回 120\.0/:/本塁打 20/);assert.match(await summary.innerText(),/今季の受賞/);
  const preserved=await summary.textContent();
  if(kind==='promotion')for(const [width,height] of [[320,568],[390,844],[844,390],[1280,900]])for(const theme of ['standard','classic','night','scoreboard'])for(const font of ['medium','large']){
   await p.setViewportSize({width,height});await p.evaluate(v=>{document.documentElement.dataset.theme=v.theme;document.documentElement.dataset.fontSize=v.font;},{theme,font});await frames(p);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);assert.equal(await summary.evaluate(n=>n.scrollWidth<=n.clientWidth+1),true);await summary.locator('button').scrollIntoViewIfNeeded();assert.equal(await summary.locator('button').evaluate(n=>{const r=n.getBoundingClientRect();return n.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'detail button remains uncovered');layouts.push({pos,width,height,theme,font});
  }
  if(kind==='promotion'){await p.setViewportSize({width:390,height:844});await summary.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(output,pos+'-promotion-mobile.png')});await p.setViewportSize({width:1280,height:900});await summary.scrollIntoViewIfNeeded();await p.screenshot({path:path.join(output,pos+'-promotion-desktop.png')});}
  if(!['retirement','missing'].includes(kind)){await both(()=>window.__summaryTest.pay());assert.equal(await p.locator('[data-season-summary="2031"]').count(),1,'next actual paid year has its own single summary');assert.equal(await summary.textContent(),preserved,'next-year actual settlement cannot overwrite the prior year');}
  await both(()=>window.__summaryTest.later());const later=await get(p);await p.evaluate(()=>window.__summaryTest.repaintOld());assert.equal(await summary.textContent(),preserved,'later salary/income cannot overwrite an old year');
  const detail=summary.locator('button');if(await detail.isEnabled()){await detail.click();assert.ok((await p.locator('#salary-detail-body').innerText()).includes(expected));assert.doesNotMatch(await p.locator('#salary-detail-body').innerText(),/9億9,999万円/);await p.locator('#salary-detail-close').click();}assert.deepEqual(await get(p),later,'historical detail and disclosure read no game state writes/RNG');
  cases.push({pos,kind,status:'PASS'});
 }
 for(const stage of ['HS','U','IND','CORP']){await both(stage=>window.__summaryTest.amateur(stage),stage);assert.equal(await p.locator('[data-season-summary]').count(),0,'non-professional summary is unchanged');assert.match(await p.locator('[data-career-review="season"]').textContent(),/今季の振り返り/);cases.push({stage,status:'PASS'});}
 await scrollChecks(p,old,both);
 assert.deepEqual(errors,[]);await p.close();await old.close();console.log('PASS season summary: '+cases.length+' native/boundary cases, '+layouts.length+' layouts, complete raw state/RNG vs '+baseline);
}catch(e){failure=e;console.error(e.stack);}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await writeFile(path.join(output,'summary.json'),JSON.stringify({status:failure?'FAIL':'PASS',baseline,cases,layouts,errors,failure:failure?.stack},null,2));}
if(failure)throw failure;
