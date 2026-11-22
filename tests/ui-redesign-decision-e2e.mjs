import {assertUi20VersionStamps} from './support/ui-version-comparison.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {projectDecisionPresentation} from './support/decision-dom-comparison.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const out=path.resolve(arg('output')||'test-results/ui-redesign-decision');await mkdir(out,{recursive:true});
const baseline='4ba12c54c5da3e2fd477d7616c57821132accfa3';
const hook=`\nwindow.__decisionDraws=[];careerRng.onDraw=value=>window.__decisionDraws.push({state:S.rngState,value});window.__decisionProbe={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:window.__decisionDraws.slice()}),choice:()=>{const v=choiceViews.get(S);return v&&{kind:v.kind,year:v.year,generation:v.generation,title:v.title,labels:v.opts?.map(o=>o.t)};},fixture:result=>seasonEvents.renderEventResult(EVENTS.find(e=>e.id===1)||EVENTS[0],result),continuation:(title,count)=>choose(title,Array.from({length:count},(_,i)=>({t:'次へ'+i,f:()=>{}}))),error:()=>choose('診断の検証',[{t:'確認',f:()=>{throw Error('PHASE3_UI_TEST');}}]),settle:()=>browserSave.settled()};`;
const errors=[],cases=[],checks=[];
const server=createServer(async(req,res)=>{let rel=new URL(req.url,'http://local').pathname.slice(1)||'index.html';const old=rel.startsWith('baseline/');if(old)rel=rel.slice(9)||'index.html';
  if(rel==='favicon.ico'){res.statusCode=204;return res.end();}
  try{if(rel.split('/').includes('..'))throw Error('path');let body=old?execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:30e6}):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=body.toString()+hook;
    if(!old&&rel==='src/engine/game.js')body+='\nwindow.__projectDecisionPresentation='+projectDecisionPresentation.toString()+';window.__phase3Events=EVENTS;window.__phase3Labels=ABL;window.__phase3Money=value=>fmtMoney(value);window.__phase3Pending=()=>choiceViews.get(S);';
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':rel.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(body);
  }catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const {chromium}=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(arg('browser')?{channel:arg('browser')}:{})});
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const get=p=>p.evaluate(()=>window.__decisionProbe.get());
async function open(pos,old=false){const c=await browser.newContext({viewport:{width:1440,height:900}});await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));const p=await c.newPage();
  p.on('pageerror',e=>{if(!e.message.includes('PHASE3_UI_TEST'))errors.push(e.message);});p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('PHASE3_UI_TEST'))errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto(base+(old?'/baseline/':'/')+'?seed='+(pos==='P'?'jp3-pitcher-02':'jp3-infielder-01'));await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#in-name').fill('決策検証');await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();return{c,p};}
const step=()=>{const a=document.getElementById('act'),rows=[...a.querySelectorAll('.abrow[aria-disabled="false"]')],bs=[...a.querySelectorAll('button:not(:disabled)')].filter(b=>!/元に戻す|すべてリセット/.test(b.textContent));const b=rows[0]||bs.find(b=>/通常投球/.test(b.textContent))||bs[0];if(!b)throw Error('no action');const label=b.matches('.abrow')?b.querySelector('.abrow-info').textContent:b.textContent;b.click();return label;};
let failure;
try{
 for(const pos of ['P','IF']){
  const {c,p}=await open(pos),reference=await open(pos,true);
  for(const page of [p,reference.p]){await page.locator('#act button').filter({hasText:'トレーニング成果を割り振る'}).click();await page.locator('#act .abrow').first().click();await page.evaluate(()=>window.__decisionProbe.settle());}
  assert.deepEqual(assertUi20VersionStamps(await get(p)),assertUi20VersionStamps(await get(reference.p)),'same-version complete allocation S/RNG equals accepted phase 2');
  const draft=await get(p);await p.evaluate(()=>{window.__draftNodes=[...document.querySelectorAll('#act .abrow,#act button')];window.__draftHTML=document.getElementById('act').innerHTML;});
  const id=await p.locator('#act').getAttribute('data-decision-id');assert.equal(await p.locator('#act-toggle').isVisible(),false,'phase-4 allocation is a dedicated view');
  await p.locator('[data-main-view="player"]').click();await p.locator('#decision-return').click();assert.equal(await p.locator('#act').getAttribute('data-decision-id'),id);assert.equal(await p.locator('#act .abrow').first().evaluate(e=>e===document.activeElement),true);
  assert.equal(await p.evaluate(()=>window.__draftNodes.every(n=>n.isConnected)&&document.getElementById('act').innerHTML===window.__draftHTML),true);assert.deepEqual(await get(p),draft);
  for(let n=0;n<120;n++){const a=await p.evaluate(()=>Boolean(window.__decisionProbe.get().state.pendingEvent)),b=await reference.p.evaluate(()=>Boolean(window.__decisionProbe.get().state.pendingEvent));assert.equal(a,b);if(a)break;const actual=await p.evaluate(step),expected=await reference.p.evaluate(step);assert.equal(actual,expected);await frames(p);if(n===119)throw Error('event not reached');}
  assert.deepEqual(assertUi20VersionStamps(await get(p)),assertUi20VersionStamps(await get(reference.p)),'same-version complete pre-event S/RNG');
  const pending=await get(p),view=await p.evaluate(()=>window.__decisionProbe.choice()),pendingId=await p.locator('#act').getAttribute('data-decision-id');
  await p.evaluate(()=>{window.__choiceNodes=[...document.querySelectorAll('#act button')];});
  await p.evaluate(()=>{const filler=document.createElement('div');filler.id='reading-scroll-fixture';filler.style.minHeight='1000px';document.getElementById('log').append(filler);});
  for(const [width,height] of [[320,568],[375,667],[390,844],[844,390],[1024,600],[768,1024],[1280,720],[1440,900]]){
   await p.setViewportSize({width,height});
   for(const theme of ['standard','night','classic','scoreboard'])for(const font of ['medium','large']){
    await p.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize=font;},{theme,font});await frames(p);
    const g=await p.evaluate(()=>{const r=id=>{const e=document.getElementById(id),b=e.getBoundingClientRect();return{height:b.height,width:b.width,scroll:e.scrollHeight,client:e.clientHeight,position:getComputedStyle(e).position};};return{overflow:document.documentElement.scrollWidth>innerWidth,buttonOverflow:[...document.querySelectorAll('#act > button')].some(b=>b.scrollHeight>b.clientHeight+1),log:r('log'),act:r('act'),app:r('app'),summary:r('decision-summary')};});
    assert.equal(g.overflow,false,JSON.stringify({width,height,theme,font,g}));assert.equal(g.buttonOverflow,false,'option text exceeds its button: '+JSON.stringify({width,height,theme,font,g}));if(width>=1100&&height>=700){assert.ok(g.log.height>=100);assert.ok(g.app.height<=height+1);}else assert.equal(g.act.position,'static');cases.push({pos,width,height,theme,font,g});
   }
   await p.evaluate(()=>{document.getElementById('log').scrollTop=40;document.getElementById('act').scrollTop=document.getElementById('act').scrollHeight;window.scrollTo(0,80);});await frames(p);
   const scroll=await p.evaluate(()=>({page:[scrollX,scrollY],log:document.getElementById('log').scrollTop,act:document.getElementById('act').scrollTop}));
   // Native taps on the visible sticky navigation do not scroll its layout origin.
   for(const view of ['player','home']){const b=await p.locator('[data-main-view="'+view+'"]').boundingBox();await p.mouse.click(b.x+b.width/2,b.y+b.height/2);}await frames(p);
   assert.deepEqual(await p.evaluate(()=>({page:[scrollX,scrollY],log:document.getElementById('log').scrollTop,act:document.getElementById('act').scrollTop})),scroll,'normal navigation restores the reading positions');
   await p.locator('#act-toggle').click();assert.equal(await p.locator('#act-toggle').getAttribute('aria-expanded'),'false');assert.ok((await p.locator('#decision-question').textContent()).length>0);
   await p.locator('[data-main-view="career"]').click();assert.equal(await p.locator('#decision-return').isVisible(),true);await p.locator('#decision-return').click();assert.equal(await p.locator('#act').getAttribute('data-decision-id'),pendingId);assert.equal(await p.locator('#act-toggle').getAttribute('aria-expanded'),'false');
   await p.locator('#act-toggle').click();assert.equal(await p.evaluate(()=>window.__choiceNodes.every((n,i)=>n===document.querySelectorAll('#act button')[i])),true);
   assert.equal(await p.locator('#act').evaluate(e=>e.scrollTop),scroll.act,'collapse/return/expand restores action scroll');
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
 const {c,p}=await open('IF'),before=await get(p);
 const variants=[{ability:{before:79,after:80,abilityDelta:1,carryBefore:0,carryAfter:0},abilityDelta:1,overflowStat:7},{ability:{before:70,after:70,abilityDelta:0,carryBefore:1,carryAfter:3},abilityDelta:0},{success:false,ability:{before:2,after:1,abilityDelta:-1,carryBefore:0,carryAfter:0},abilityDelta:-1,injuryAdded:2},{ability:null,abilityDelta:0},{ability:null,abilityDelta:0,incomeYen:1230000,category:'endorsement'},{ability:{abilityDelta:0},abilityDelta:0}];
 for(let i=0;i<variants.length;i++){
  await p.evaluate(result=>window.__decisionProbe.fixture(result),{eventOccurrenceID:'ui-fixture-'+i,cardID:1,mode:'norm',success:true,category:'training',tier:0,target:'con',abilityPoints:0,statDelta:0,overflowStat:0,injuryAdded:0,incomeYen:0,...variants[i]});
  const text=await p.locator('#log [data-event-occurrence-id]').last().locator('[data-reader-body]').textContent();assert.doesNotMatch(text,/undefined|NaN/);if(i===0)assert.match(text,/79 → 80/);if(i===1)assert.match(text,/1 → 3/);if(i===3)assert.match(text,/数値の変化なし/);if(i===5)assert.match(text,/詳細記録なし/);assert.deepEqual(await get(p),before,'read-only result fixture');
 }
 await p.setViewportSize({width:390,height:844});
 for(const [title,count,show] of [['',1,false],['',2,true],['一つの行動を確認',1,true]]){
  await p.evaluate(({title,count})=>window.__decisionProbe.continuation(title,count),{title,count});await frames(p);
  assert.equal(await p.locator('#decision-summary').isVisible(),show);assert.equal(await p.locator('#act-toggle').isVisible(),show);
  assert.equal(await p.locator('#act button').count(),count,'all original progress/action buttons remain');assert.deepEqual(await get(p),before,'continuation presentation leaves S/RNG unchanged');
  if(!show){await p.screenshot({path:path.join(out,'continuation-390.png'),animations:'disabled'});await p.locator('[data-main-view="player"]').click();await p.locator('#decision-return').click();assert.equal(await p.locator('#act button').evaluate(e=>document.activeElement===e),true,'return targets the actual progress button');}
 }
 await p.evaluate(()=>window.__decisionProbe.error());const errorBefore=await get(p);await p.locator('#act button').click();await frames(p);
 const diagnostic=p.locator('[data-reader-error]').last();assert.match(await diagnostic.textContent(),/もう一度選択せず/);assert.equal(await diagnostic.locator('h4').evaluate(e=>e===document.activeElement),true,'error gets focus: '+await p.evaluate(()=>JSON.stringify({active:{tag:document.activeElement.tagName,id:document.activeElement.id,text:document.activeElement.textContent.slice(0,80)},header:document.querySelector('[data-reader-error] h4')?.outerHTML,summary:document.getElementById('decision-summary').outerHTML})));assert.deepEqual(await get(p),errorBefore,'UI error fixture preserves state and RNG');assert.equal(await p.locator('#act button').count(),1,'existing choice restoration retained; no new retry control');
 await c.close();checks.push({resultFixtures:6,errorFocus:'PASS',existingRecovery:'PASS'});assert.deepEqual(errors,[]);
}catch(e){failure=e;}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await writeFile(path.join(out,'summary.json'),JSON.stringify({status:failure?'FAIL':'PASS',baseline,cases,checks,errors,failure:failure?.stack},null,2));}
if(failure)throw failure;
