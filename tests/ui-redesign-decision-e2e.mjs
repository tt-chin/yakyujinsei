import {assertUi20VersionStamps,currentUiBaselineVersion} from './support/ui-version-comparison.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {projectDecisionPresentation} from './support/decision-dom-comparison.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const out=path.resolve(arg('output')||path.join(os.tmpdir(),'ui-redesign-decision'));await mkdir(out,{recursive:true});
const baseline='4ba12c54c5da3e2fd477d7616c57821132accfa3';
const hook=`\nwindow.__decisionDraws=[];careerRng.onDraw=value=>window.__decisionDraws.push({state:S.rngState,value});window.__decisionProbe={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:window.__decisionDraws.slice()}),choice:()=>{const v=choiceViews.get(S);return v&&{kind:v.kind,year:v.year,generation:v.generation,title:v.title,labels:v.opts?.map(o=>o.t)};},fixture:result=>seasonEvents.renderEventResult(EVENTS.find(e=>e.id===1)||EVENTS[0],result),continuation:(title,count)=>choose(title,Array.from({length:count},(_,i)=>({t:'次へ'+i,f:()=>{}}))),error:()=>choose('診断の検証',[{t:'確認',f:()=>{throw Error('PHASE3_UI_TEST');}}]),settle:()=>browserSave.settled(),navigation:()=>gameView.decisionUI,collapse:()=>gameView.toggleActions(),nextYear:()=>{S.year++;gameView.divider(S.year+'年',10);choose('開幕前の投球プラン',Array.from({length:12},(_,i)=>({t:'投球プラン'+i,s:'説明'.repeat(25),f:()=>{}})));}};`;
const errors=[],cases=[],checks=[];
const server=createServer(async(req,res)=>{let rel=new URL(req.url,'http://local').pathname.slice(1)||'index.html';const old=rel.startsWith('baseline/');if(old)rel=rel.slice(9)||'index.html';
  if(rel==='favicon.ico'){res.statusCode=204;return res.end();}
  try{if(rel.split('/').includes('..'))throw Error('path');let body=old?execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:30e6}):await readFile(path.join(root,'docs',rel));if(old&&rel==='src/config.js')body=currentUiBaselineVersion(body);if(rel==='src/engine/game.js')body=body.toString()+hook;
    if(!old&&rel==='src/engine/game.js')body+='\nwindow.__projectDecisionPresentation='+projectDecisionPresentation.toString()+';window.__phase3Events=EVENTS;window.__phase3Labels=ABL;window.__phase3Money=value=>fmtMoney(value);window.__phase3Pending=()=>choiceViews.get(S);';
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':rel.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(body);
  }catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const {chromium}=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(arg('browser')?{channel:arg('browser')}:{})});
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const get=p=>p.evaluate(()=>window.__decisionProbe.get());
async function open(pos,old=false,options={}){const c=await browser.newContext({viewport:{width:1440,height:900},...options});await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));const p=await c.newPage();
  p.on('pageerror',e=>{if(!e.message.includes('PHASE3_UI_TEST'))errors.push(e.message);});p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('PHASE3_UI_TEST'))errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto(base+(old?'/baseline/':'/')+'?seed='+(pos==='P'?'jp3-pitcher-02':'jp3-infielder-01'));await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#in-name').fill('決策検証');await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();return{c,p};}
const step=()=>{const a=document.getElementById('act'),rows=[...a.querySelectorAll('.abrow[aria-disabled="false"]')],bs=[...a.querySelectorAll('button:not(:disabled)')].filter(b=>!/元に戻す|すべてリセット/.test(b.textContent));const b=rows[0]||bs.find(b=>/通常投球/.test(b.textContent))||bs[0];if(!b)throw Error('no action');const label=b.matches('.abrow')?b.querySelector('.abrow-info').textContent:b.textContent;b.click();return label;};
let failure;
try{
 if(!process.argv.includes('--navigation-only')){
 for(const pos of ['P','IF']){
  const {c,p}=await open(pos),reference=await open(pos,true);
  for(const page of [p,reference.p]){await page.locator('#act button').filter({hasText:'トレーニング成果を割り振る'}).click();await page.locator('#act .abrow').first().click();await page.evaluate(()=>window.__decisionProbe.settle());}
  assert.deepEqual(assertUi20VersionStamps(await get(p)),assertUi20VersionStamps(await get(reference.p)),'same-version complete allocation S/RNG equals accepted phase 2');
  const draft=await get(p);await p.evaluate(()=>{window.__draftNodes=[...document.querySelectorAll('#act .abrow,#act button')];window.__draftHTML=document.getElementById('act').innerHTML;});
  const id=await p.locator('#act').getAttribute('data-decision-id');assert.equal(await p.locator('#act-toggle').isVisible(),false,'phase-4 allocation is a dedicated view');
  await p.locator('[data-main-view="player"]').click();await p.locator('#decision-return').click();assert.equal(await p.locator('#act').getAttribute('data-decision-id'),id);assert.equal(await p.locator('#act .abrow').first().evaluate(e=>e===document.activeElement),true);
  assert.equal(await p.evaluate(()=>window.__draftNodes.every(n=>n.isConnected)&&document.getElementById('act').innerHTML===window.__draftHTML),true);assert.deepEqual(await get(p),draft);
  await p.emulateMedia({reducedMotion:'reduce'});await p.setViewportSize({width:390,height:568});await frames(p);await p.evaluate(()=>scrollTo(0,0));await frames(p);
  for(let i=0;i<30&&await p.locator('#decision-jump').isVisible();i++){const b=await p.locator('#decision-jump').boundingBox();if(!b)break;await p.mouse.click(b.x+b.width/2,b.y+b.height/2);await frames(p);}
  assert.equal(await p.locator('#decision-jump').isVisible(),false,'allocation arrow stops at reachable operations');
  assert.deepEqual(await get(p),draft,'allocation navigation preserves the original draft and RNG');
  await p.setViewportSize({width:1440,height:900});await frames(p);
  for(let n=0;n<120;n++){const a=await p.evaluate(()=>Boolean(window.__decisionProbe.get().state.pendingEvent)),b=await reference.p.evaluate(()=>Boolean(window.__decisionProbe.get().state.pendingEvent));assert.equal(a,b);if(a)break;const actual=await p.evaluate(step),expected=await reference.p.evaluate(step);assert.equal(actual,expected);await frames(p);if(n===119)throw Error('event not reached');}
  assert.deepEqual(assertUi20VersionStamps(await get(p)),assertUi20VersionStamps(await get(reference.p)),'same-version complete pre-event S/RNG');
  const pending=await get(p),view=await p.evaluate(()=>window.__decisionProbe.choice()),pendingId=await p.locator('#act').getAttribute('data-decision-id');
  await p.evaluate(()=>{window.__choiceNodes=[...document.querySelectorAll('#act button')];});
  await p.evaluate(()=>{const filler=document.createElement('div');filler.id='reading-scroll-fixture';filler.style.minHeight='1000px';document.getElementById('log').append(filler);});
  for(const [width,height] of [[320,568],[375,667],[390,844],[844,390],[1024,600],[768,1024],[1280,720],[1440,900]]){
   await p.setViewportSize({width,height});
   for(const theme of ['standard','night','classic','scoreboard'])for(const font of ['medium','large']){
    await p.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize=font;},{theme,font});await frames(p);
    const g=await p.evaluate(()=>{const r=id=>{const e=document.getElementById(id),b=e.getBoundingClientRect();return{height:b.height,width:b.width,scroll:e.scrollHeight,client:e.clientHeight,position:getComputedStyle(e).position};};return{overflow:document.documentElement.scrollWidth>innerWidth,buttonOverflow:[...document.querySelectorAll('#act > button')].some(b=>b.scrollHeight>b.clientHeight+1),log:r('log'),act:r('act'),app:r('app')};});
    assert.equal(g.overflow,false,JSON.stringify({width,height,theme,font,g}));assert.equal(g.buttonOverflow,false,'option text exceeds its button: '+JSON.stringify({width,height,theme,font,g}));if(width>=1100&&height>=700){assert.ok(g.log.height>=100);assert.ok(g.app.height<=height+1);}else assert.equal(g.act.position,'static');cases.push({pos,width,height,theme,font,g});
   }
   await p.evaluate(()=>{document.getElementById('log').scrollTop=40;document.getElementById('act').scrollTop=document.getElementById('act').scrollHeight;window.scrollTo(0,80);});await frames(p);
   const scroll=await p.evaluate(()=>({page:[scrollX,scrollY],log:document.getElementById('log').scrollTop,act:document.getElementById('act').scrollTop}));
   // Native taps on the visible sticky navigation do not scroll its layout origin.
   for(const view of ['player','home']){const b=await p.locator('[data-main-view="'+view+'"]').boundingBox();await p.mouse.click(b.x+b.width/2,b.y+b.height/2);}await frames(p);
   assert.deepEqual(await p.evaluate(()=>({page:[scrollX,scrollY],log:document.getElementById('log').scrollTop,act:document.getElementById('act').scrollTop})),scroll,'normal navigation restores the reading positions');
   await p.evaluate(()=>window.__decisionProbe.collapse());assert.equal(await p.locator('#act-toggle').getAttribute('aria-expanded'),'false');assert.equal(await p.locator('#act-toggle').isVisible(),false,'legacy collapse hook has no visible button');
   await p.locator('[data-main-view="career"]').click();assert.equal(await p.locator('#decision-return').isVisible(),true);await p.locator('#decision-return').click();assert.equal(await p.locator('#act').getAttribute('data-decision-id'),pendingId);assert.equal(await p.locator('#act-toggle').getAttribute('aria-expanded'),'true','explicit return expands');
   assert.equal(await p.evaluate(()=>window.__choiceNodes.every((n,i)=>n===document.querySelectorAll('#act button')[i])),true);
   assert.equal(await p.locator('#act > .title').evaluate(e=>{const r=e.getBoundingClientRect(),nav=document.getElementById('main-nav').getBoundingClientRect();return r.top>=nav.bottom-1&&r.bottom<=innerHeight;}),true,'explicit return exposes the current heading');
   assert.deepEqual(await p.evaluate(()=>window.__decisionProbe.choice()),view);assert.deepEqual(await get(p),pending,'UI-only operations preserve every S field and RNG draw');
   if([320,390,1280,1440].includes(width)){
    // The artificial scroll obstruction proves restoration; omit it from visual evidence.
    await p.evaluate(()=>{document.getElementById('reading-scroll-fixture').hidden=true;document.getElementById('log').scrollTop=0;document.getElementById('act').scrollTop=0;window.scrollTo(0,0);});await frames(p);
    await p.screenshot({path:path.join(out,`${pos}-pending-${width}.png`),fullPage:true,animations:'disabled'});
    await p.evaluate(saved=>{document.getElementById('reading-scroll-fixture').hidden=false;document.getElementById('log').scrollTop=saved.log;document.getElementById('act').scrollTop=saved.act;window.scrollTo(...saved.page);},scroll);await frames(p);
   }
  }
  // One native double click equals one baseline ordinary selection.
  await p.evaluate(()=>document.getElementById('reading-scroll-fixture').remove());await p.setViewportSize({width:1440,height:900});await frames(p);await p.locator('#act button').nth(1).dblclick();await reference.p.locator('#act button').nth(1).click();await frames(p);
  assert.deepEqual(assertUi20VersionStamps(await get(p)),assertUi20VersionStamps(await get(reference.p)),'double click equals exactly one accepted baseline action');
  const result=p.locator('#log [data-event-occurrence-id]').last();
  assert.doesNotMatch(await result.locator('h4').textContent(),/イベントカード｜/,'result heading keeps the name and badge without the repeated label');assert.ok((await result.locator('[data-event-effects]').textContent()).length>0);assert.equal(await result.locator('[data-event-calculation]').getAttribute('open'),null);
  assert.equal(await result.locator('h4').evaluate(e=>e===document.activeElement),true,'committed result gets focus');
  const controls=await p.evaluate(()=>{
   const state=window.__decisionProbe.get().state,log=document.getElementById('log');
   window.__projectDecisionPresentation(log.outerHTML,'log',state);
   return ['[data-event-effects] dd','[data-event-selection]','[data-reader-period]','[data-event-occurrence-id] h4'].map(selector=>{
    const clone=log.cloneNode(true);clone.querySelector(selector).textContent='CORRUPTED';
    try{window.__projectDecisionPresentation(clone.outerHTML,'log',state);return false;}catch(e){return /^PHASE3_/.test(e.message);}
   });
  });
  assert.deepEqual(controls,[true,true,true,true],'DOM projection rejects corrupted effects, selection, period and event title');
  assert.equal(await p.locator('#act-toggle').getAttribute('aria-expanded'),'true','new decision opens');
  const after=await get(p);await p.evaluate(()=>document.querySelector('#act button').dispatchEvent(new MouseEvent('click',{bubbles:true,detail:2})));assert.deepEqual(await get(p),after,'second click cannot accept the next decision');
  checks.push({pos,baselineAllocation:'PASS',baselineEvent:'PASS',pendingIdentity:'PASS',doubleClick:'PASS'});
  await result.screenshot({path:path.join(out,`${pos}-result.png`),animations:'disabled'});
  await reference.c.close();await c.close();console.log('PASS '+pos+': pending identity, allocation draft, exact baseline S/RNG, double click and result');
 }
 // A choice that opens allocation must not mark the card that its confirm creates, whether or not a frame runs in
 // between: any non-option #act button ends the selection (event-system-e2e replay flake on 5910421).
 {const {c,p}=await open('P'),hasOpener=()=>[...document.querySelectorAll('#act button:not(:disabled)')].some(b=>/^能力点を分配（\d+点）$/.test(b.textContent.trim()));let found=false;
  for(let n=0;n<600&&!found;n++){found=await p.evaluate(hasOpener);if(!found){await p.evaluate(step);await frames(p);}}
  assert.ok(found,'reached an allocation-opening choice');
  const r=await p.evaluate(()=>{const a=document.getElementById('act'),button=[...a.querySelectorAll('button:not(:disabled)')].find(b=>/^能力点を分配（\d+点）$/.test(b.textContent.trim())),label=button.textContent.trim();window.__staleBefore=new Set(document.querySelectorAll('#log .card'));
   button.click();let spent=0;for(let row;spent<50&&(row=a.querySelector('.abrow[aria-disabled="false"]:not(.capped)'));spent++)row.click();a.querySelector('button.main:not(:disabled)').click();return {label,spent};});
  await frames(p);
  const marks=await p.evaluate(()=>{const cards=[...document.querySelectorAll('#log .card')].filter(e=>!window.__staleBefore.has(e));return {cards:cards.length,stale:cards.flatMap(e=>[...e.querySelectorAll('[data-reader-selection]')].map(n=>n.textContent))};});
  assert.ok(r.spent>0&&marks.cards>0,'allocation spent and its confirm created a card: '+JSON.stringify({r,marks}));
  assert.deepEqual(marks.stale,[],'the allocation result card carries no stale 選んだ行動 after '+r.label);
  checks.push({staleSelectionMark:'PASS',opener:r.label,cards:marks.cards});await c.close();console.log('PASS stale selection: '+r.label+' → '+marks.cards+' new card(s), no mark');}
 const {c,p}=await open('IF'),before=await get(p);
 const variants=[{ability:{before:79,after:80,abilityDelta:1,carryBefore:0,carryAfter:0},abilityDelta:1,overflowStat:7},{ability:{before:70,after:70,abilityDelta:0,carryBefore:1,carryAfter:3},abilityDelta:0},{success:false,ability:{before:2,after:1,abilityDelta:-1,carryBefore:0,carryAfter:0},abilityDelta:-1,injuryAdded:2},{ability:null,abilityDelta:0},{ability:null,abilityDelta:0,incomeYen:1230000,category:'endorsement'},{ability:{abilityDelta:0},abilityDelta:0}];
 for(let i=0;i<variants.length;i++){
  await p.evaluate(result=>window.__decisionProbe.fixture(result),{eventOccurrenceID:'ui-fixture-'+i,cardID:1,mode:'norm',success:true,category:'training',tier:0,target:'con',abilityPoints:0,statDelta:0,overflowStat:0,injuryAdded:0,incomeYen:0,...variants[i]});
  const text=await p.locator('#log [data-event-occurrence-id]').last().locator('[data-reader-body]').textContent();assert.doesNotMatch(text,/undefined|NaN/);if(i===0)assert.match(text,/79 → 80/);if(i===1)assert.match(text,/1 → 3/);if(i===3)assert.match(text,/数値の変化なし/);if(i===5)assert.match(text,/詳細記録なし/);assert.deepEqual(await get(p),before,'read-only result fixture');
 }
 await p.setViewportSize({width:390,height:844});
 for(const [title,count,show] of [['',1,false],['',2,true],['一つの行動を確認',1,true]]){
  await p.evaluate(({title,count})=>window.__decisionProbe.continuation(title,count),{title,count});await frames(p);
  assert.equal(await p.locator('#decision-summary').count(),0,'no summary placeholder');assert.equal(await p.locator('#act-toggle').isVisible(),false,'no legacy toggle for any choice');
  assert.equal(await p.locator('#act button').count(),count,'all original progress/action buttons remain');assert.deepEqual(await get(p),before,'continuation presentation leaves S/RNG unchanged');
  if(!show){await p.screenshot({path:path.join(out,'continuation-390.png'),animations:'disabled'});await p.locator('[data-main-view="player"]').click();await p.locator('#decision-return').click();assert.equal(await p.locator('#act button').evaluate(e=>document.activeElement===e),true,'return targets the actual progress button');}
 }
 await p.evaluate(()=>window.__decisionProbe.error());const errorBefore=await get(p);await p.locator('#act button').click();await frames(p);
 const diagnostic=p.locator('[data-reader-error]').last();assert.match(await diagnostic.textContent(),/もう一度選択せず/);assert.equal(await diagnostic.locator('h4').evaluate(e=>e===document.activeElement),true,'error gets focus: '+await p.evaluate(()=>JSON.stringify({active:{tag:document.activeElement.tagName,id:document.activeElement.id,text:document.activeElement.textContent.slice(0,80)},header:document.querySelector('[data-reader-error] h4')?.outerHTML,summary:document.getElementById('decision-summary')?.outerHTML})));assert.deepEqual(await get(p),errorBefore,'UI error fixture preserves state and RNG');assert.equal(await p.locator('#act button').count(),1,'existing choice restoration retained; no new retry control');
 await c.close();checks.push({resultFixtures:6,errorFocus:'PASS',existingRecovery:'PASS'});
 }
 // Native choice rendering with controlled history/year fixtures. The navigation must
 // never invoke an option, mutate the pending draft or consume an RNG draw.
 {
  const {c,p}=await open('P',false,{hasTouch:true});await p.emulateMedia({reducedMotion:'reduce'});
  for(const [width,height] of [[390,844],[844,390],[320,568],[1440,900]]){
   await p.setViewportSize({width,height});
   await p.evaluate(()=>{const log=document.getElementById('log');log.insertAdjacentHTML('beforeend','<div data-old-reading style="height:1800px">過去年度の記録</div>');});
   await p.evaluate(()=>window.__decisionProbe.continuation('開幕前の投球プラン',24));await frames(p);
   await p.evaluate(()=>{scrollTo(0,0);document.getElementById('log').scrollTop=0;});await frames(p);
   if(width>=1100&&height>=700)await p.evaluate(()=>window.__decisionProbe.collapse());await frames(p);
   const before=await get(p),nodes=await p.locator('#act button').count();
   const jump=p.locator('#decision-jump');
   assert.equal(await jump.getAttribute('aria-label'),'現在の選択肢へ移動');
   await p.waitForFunction(()=>!document.getElementById('decision-jump').hidden).catch(async e=>{console.error(JSON.stringify(await p.evaluate(()=>{const n=window.__decisionProbe.navigation(),a=document.getElementById('act');return {live:n.live(),remaining:n.remaining(),bounds:n.bounds(),view:n.getDecision()?.kind,year:n.getYear(),decisionYear:n.getDecision()?.year,stateYear:n.getDecision()?.state?.year,current:!!n.current,act:a.getBoundingClientRect().toJSON(),last:n.controls().at(-1)?.getBoundingClientRect().toJSON(),style:a.style.cssText,hidden:document.getElementById('view-home').hidden};})));throw e;});
   const box=await jump.boundingBox();assert.ok(box.width>=44&&box.height>=44,'44px hit target');assert.ok(box.y+box.height<=height-6,'small visible viewport gap');
   const visual=await jump.evaluate(node=>{const circle=getComputedStyle(node,'::before'),style=getComputedStyle(node),scale=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--font-scale'))||1;return {width:parseFloat(circle.width),height:parseFloat(circle.height),font:parseFloat(style.fontSize),scale};});
   assert.ok(Math.abs(visual.width-box.width*.8)<.2&&Math.abs(visual.height-box.height*.8)<.2,'circle is 80% inside the unchanged hit target');assert.ok(Math.abs(visual.font-28*visual.scale*.8)<.2,'arrow glyph is 80% of its original token size');
   // Keyboard activation has the same navigation-only semantics as touch.
   await jump.focus();await p.keyboard.press(width===320?'Space':'Enter');await frames(p);
   const heading=await p.locator('#act > .title').boundingBox(),nav=await p.locator('#main-nav').boundingBox();
   assert.ok(heading.y>=nav.y+nav.height-1,'current heading clears the fixed header');
   assert.equal(await p.locator('#act > .title').evaluate(e=>e===document.activeElement),true);
   assert.equal(await p.evaluate(()=>[...document.querySelectorAll('#act button')].filter(e=>{const r=e.getBoundingClientRect();return r.top>=document.getElementById('main-nav').getBoundingClientRect().bottom&&r.bottom<=innerHeight;}).every(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));})),true,'float does not cover visible action centers '+JSON.stringify({width,height,diagnostic:await p.evaluate(()=>{const j=document.getElementById('decision-jump');return {jump:j.getBoundingClientRect().toJSON(),buttons:[...document.querySelectorAll('#act button')].slice(0,8).map(e=>{const r=e.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {r:r.toJSON(),hit:hit?.outerHTML.slice(0,100)};})};})}));
   if(width===390)await p.screenshot({path:path.join(out,'floating-arrow-390.png'),fullPage:false});
   for(let i=0;i<30&&await jump.isVisible();i++){const b=await jump.boundingBox();assert.ok(b);await p.touchscreen.tap(b.x+b.width/2,b.y+b.height/2);await frames(p);}
   assert.equal(await jump.isVisible(),false,'hide at the actual choice bottom');
   const last=p.locator('#act button').last(),lastBox=await last.boundingBox();
   assert.ok(lastBox.y+lastBox.height<=height+1,'last option is visible');
   assert.equal(await last.evaluate(e=>{const r=e.getBoundingClientRect();return e.contains(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2));}),true,'last option remains clickable');
   assert.equal(await p.locator('#act button').count(),nodes);assert.deepEqual(await get(p),before,'arrow never selects or changes state/RNG');
   await p.evaluate(()=>window.__decisionProbe.collapse());await frames(p);assert.equal(await jump.isVisible(),true,'collapsed choice exposes navigation');
   await jump.click();await frames(p);assert.equal(await p.locator('#act').getAttribute('class'),'','arrow expands current choice');
   assert.deepEqual(await get(p),before,'expansion is read-only');
   await p.evaluate(()=>document.querySelectorAll('[data-old-reading]').forEach(e=>e.remove()));
   checks.push({floatingArrow:{width,height,heading:'PASS',bottom:'PASS',keyboard:'PASS',collapsed:'PASS',stateRng:'PASS'}});
  }
  await p.setViewportSize({width:390,height:844});
  await p.evaluate(()=>{document.getElementById('log').insertAdjacentHTML('beforeend','<div data-old-reading style="height:1800px">読む途中の旧年度</div>');scrollTo(0,30);});await frames(p);
  await p.mouse.move(50,400);await p.mouse.wheel(0,-40);await frames(p);
  const reading=await p.evaluate(()=>scrollY);
  await p.evaluate(()=>window.__decisionProbe.nextYear());await frames(p);
  assert.equal(await p.evaluate(()=>scrollY),reading,'new year does not interrupt old-record reading');
  assert.equal(await p.locator('[data-old-reading]').count(),1,'old record is retained');
  const annual=await get(p);await p.locator('#decision-jump').click();await frames(p);
  assert.equal(await p.locator('#act > .title').textContent(),'開幕前の投球プラン');
  assert.equal(await p.locator('#act').getAttribute('data-decision-id')!==null,true);
  await p.setViewportSize({width:390,height:640});await frames(p);
  assert.ok((await p.locator('#decision-jump').boundingBox())?.y<640,'height change updates float');
  // Emulate reported visual bounds, not Safari's native toolbar implementation.
  await p.evaluate(()=>{window.__realVisual=visualViewport;const visual=new EventTarget();Object.assign(visual,{height:520,offsetTop:0});Object.defineProperty(window,'visualViewport',{configurable:true,value:visual});dispatchEvent(new Event('resize'));});await frames(p);
  assert.ok((await p.locator('#decision-jump').boundingBox()).y+48<=512,'visual viewport shrink keeps one small toolbar gap');
  await p.evaluate(()=>{Object.defineProperty(window,'visualViewport',{configurable:true,value:window.__realVisual});dispatchEvent(new Event('resize'));});await frames(p);
  await p.evaluate(()=>window.__decisionProbe.continuation('',1));await frames(p);
  await p.locator('[data-main-view="player"]').click();await p.locator('#decision-return').click();await frames(p);
  assert.equal(await p.locator('#act button').evaluate(e=>e===document.activeElement),true,'single continuation return focuses native button');
  assert.equal(await p.locator('#decision-jump').isVisible(),false,'history overflow alone cannot show arrow');
  await p.evaluate(()=>window.__decisionProbe.continuation('',0));await frames(p);assert.equal(await p.locator('#decision-jump').isVisible(),false,'no actionable choice hides arrow');
  assert.deepEqual(await get(p),annual,'annual navigation and controlled redraws preserve complete S/RNG');
  await p.screenshot({path:path.join(out,'floating-arrow-empty-390.png'),fullPage:true});
  await c.close();checks.push({newYearReading:'PASS',currentYearTarget:'PASS',shortViewport:'PASS',singleContinue:'PASS',empty:'PASS'});
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e;}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await writeFile(path.join(out,'summary.json'),JSON.stringify({status:failure?'FAIL':'PASS',baseline,cases,checks,errors,failure:failure?.stack},null,2));}
if(failure)throw failure;
