import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {projectDecisionPresentation} from './support/decision-dom-comparison.mjs';
import {THEME_IDS} from '../docs/src/ui/theme-catalog.js';
import {assertSameCareer} from './support/first-difference.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const baseline='eddc464d27087263d57665ade818930db8f58f25';
const out=path.resolve(arg('output')||'test-results/ui-redesign-allocation');await mkdir(out,{recursive:true});
const hook=`\nwindow.__allocationUI=()=>({saved:gameView.decisionUI.homeScroll,view:gameView.decisionUI.view,id:gameView.decisionUI.current?.id});window.__allocationTrace=[];document.addEventListener('yakyujinsei:mainview',e=>window.__allocationTrace.push({event:e.detail,y:scrollY,height:document.documentElement.scrollHeight,ui:window.__allocationUI()}));window.__allocationDraws=[];careerRng.onDraw=value=>window.__allocationDraws.push({state:S.rngState,value});window.__phase3Pending=()=>choiceViews.get(S);window.__allocationProbe={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:window.__allocationDraws.slice(),done:window.__allocationDone||0}),settle:()=>browserSave.settled(),fixture:(fixture,mode)=>{Object.assign(S,fixture);if(fixture.carry===null)delete S.carry;allocUI(mode,'配分テスト',()=>{window.__allocationDone=(window.__allocationDone||0)+1;choose('配分完了',[{t:'次へ',f:()=>{}}]);});}};`;
const server=createServer(async(req,res)=>{let rel=new URL(req.url,'http://local').pathname.slice(1)||'index.html',old=rel.startsWith('baseline/');if(old)rel=rel.slice(9)||'index.html';
 try{if(rel==='favicon.ico'){res.statusCode=204;return res.end();}if(rel.split('/').includes('..'))throw Error('path');let body=old?execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:30e6}):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=body.toString()+hook+'\nwindow.__projectDecisionPresentation='+projectDecisionPresentation.toString()+';';res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':'text/html; charset=utf-8');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const {chromium}=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright'),browser=await chromium.launch({headless:true,...(arg('browser')?{channel:arg('browser')}:{})});
const errors=[],cases=[],checks=[];const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const get=p=>p.evaluate(()=>window.__allocationProbe.get());
const dom=p=>p.evaluate(()=>window.__projectDecisionPresentation(document.getElementById('act').outerHTML,'act',window.__allocationProbe.get().state));
async function open(pos,old=false){const c=await browser.newContext({viewport:{width:1440,height:900}});await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto(base+(old?'/baseline/':'/')+'?seed='+(pos==='P'?'jp3-pitcher-02':'jp3-infielder-01'));await p.waitForFunction(()=>!document.getElementById('btn-start').disabled);await p.locator('#in-name').fill('配分検証');await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();await p.locator('#act button').filter({hasText:'トレーニング成果を割り振る'}).click();await p.evaluate(()=>window.__allocationProbe.settle());return{c,p};}
async function equal(a,b,label){assertSameCareer(await get(a),await get(b),label+' complete S/RNG');assert.equal(await dom(a),await dom(b),label+' original allocation DOM');}
async function action(a,b,operation){for(const p of [a,b])await p.evaluate(op=>{const act=document.getElementById('act');const el=op==='spend'?act.querySelector('.abrow[aria-disabled="false"]'):op==='undo'?[...act.querySelectorAll('button')].find(e=>e.textContent.includes('元に戻す')):op==='reset'?[...act.querySelectorAll('button')].find(e=>e.textContent==='すべてリセット'):act.querySelector('button.main:not(:disabled)');if(!el)throw Error('missing '+op);el.click();},operation);await equal(a,b,operation);}
let failure;
try{
 // The growth module itself must remain byte-for-byte (newline-normalized) unchanged.
 const core=await readFile(path.join(root,'docs/src/engine/player-ability.js'),'utf8');assert.equal(core.replaceAll('\r\n','\n'),execFileSync('git',['show',`${baseline}:docs/src/engine/player-ability.js`],{cwd:root,encoding:'utf8'}).replaceAll('\r\n','\n'));
 for(const pos of ['P','IF']){
  const {c,p}=await open(pos),reference=await open(pos,true);await equal(p,reference.p,'initial natural dice');
  for(const q of [p,reference.p]){await q.bringToFront();await q.locator('#act .abrow').first().focus();await frames(q);assert.equal(await q.locator('#act .abrow').first().evaluate(e=>e===document.activeElement),true,'native keyboard input targets the focused ability');await q.keyboard.press('Enter');assert.equal(await q.locator('#dice .die.used').count(),1,'native Enter consumes exactly one die');}await equal(p,reference.p,'native keyboard allocation');const before=await get(p);
  await p.evaluate(()=>{window.__allocationNodes=[...document.querySelectorAll('#act .abrow,#act button')];window.__allocationMarkup=document.getElementById('act').innerHTML;});
  for(const [width,height] of [[320,568],[375,667],[390,844],[844,390],[1024,600],[768,1024],[1280,720],[1440,900]])for(const theme of THEME_IDS)for(const font of ['medium','large']){
   await p.setViewportSize({width,height});await p.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize=font;},{theme,font});await frames(p);
   const g=await p.evaluate(()=>{const act=document.getElementById('act'),rows=[...act.querySelectorAll('.abrow')],footer=document.getElementById('al-btm');const box=e=>{const b=e.getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height};};return{overflow:document.documentElement.scrollWidth>innerWidth,logVisible:getComputedStyle(document.getElementById('log')).display!=='none',rows:rows.map(r=>({...box(r),overflow:r.scrollWidth>r.clientWidth+1})),footer:getComputedStyle(footer).position,home:getComputedStyle(document.getElementById('view-home')).overflowY,confirmDisabled:act.querySelector('[data-allocation-confirm-placeholder]')?.disabled};});
   assert.equal(g.overflow,false,JSON.stringify({width,height,theme,font,g}));assert.equal(g.logVisible,false);assert.equal(g.confirmDisabled,true);assert.ok(g.rows.every(r=>r.height>=44&&!r.overflow));if(width<700)assert.ok(g.rows.every(r=>Math.abs(r.x-g.rows[0].x)<1));if(height<=699)assert.equal(g.footer,'static');if(width>=1100&&height>=700)assert.equal(g.home,'auto');
   // Last row and all footer controls remain reachable with one main scroll area.
   await p.evaluate(()=>{document.getElementById('view-home').scrollTop=document.getElementById('view-home').scrollHeight;window.scrollTo(0,document.documentElement.scrollHeight);});await frames(p);
   assert.equal(await p.locator('#al-rows .abrow').last().evaluate(row=>{const b=row.getBoundingClientRect();return document.elementFromPoint(b.x+b.width/2,b.y+b.height/2)?.closest('.abrow')===row;}),true,'last ability is not covered by the confirmation bar');
   await p.locator('#al-btm button').first().scrollIntoViewIfNeeded();assert.equal(await p.locator('#al-btm button').first().isVisible(),true);
   const scroll=await p.evaluate(()=>{window.__allocationBeforeNav={y:scrollY,boxes:Object.fromEntries(['app','game-body','game-main','main-nav','view-host','view-home','act'].map(id=>{const e=document.getElementById(id),r=e.getBoundingClientRect(),s=getComputedStyle(e);return[id,{top:r.top,height:r.height,position:s.position,cssTop:s.top,overflow:s.overflow,flex:s.flex}]}))};return{page:scrollY,home:document.getElementById('view-home').scrollTop};});
   const navigation=await p.locator('[data-main-view="player"]').boundingBox();assert.ok(navigation.y>=0&&navigation.y+navigation.height<=height,'navigation stays visible while reading the last ability');
   // Click the visible sticky navigation as a user would. Locator.click first
   // scrolls the element's layout position and would change the pre-click oracle.
   await p.mouse.click(navigation.x+navigation.width/2,navigation.y+navigation.height/2);assert.equal(await p.locator('#view-home').isVisible(),false);await p.locator('#decision-return').click();await frames(p);
   const restored=await p.evaluate(saved=>{const home=document.getElementById('view-home');return{actual:{page:scrollY,home:home.scrollTop},expected:{page:Math.min(saved.page,Math.max(0,document.documentElement.scrollHeight-innerHeight)),home:Math.min(saved.home,Math.max(0,home.scrollHeight-home.clientHeight))}};},scroll);
   assert.deepEqual(restored.actual,restored.expected,'dedicated return retains reading position (clamped only to current scroll bounds): '+await p.evaluate(()=>JSON.stringify({before:window.__allocationBeforeNav,trace:window.__allocationTrace.slice(-4),ui:window.__allocationUI(),nav:document.getElementById('main-nav').getBoundingClientRect().toJSON(),homeHeight:document.getElementById('view-home').scrollHeight,pageHeight:document.documentElement.scrollHeight})));
   assert.equal(await p.evaluate(()=>window.__allocationNodes.every(n=>n.isConnected)&&document.getElementById('act').innerHTML===window.__allocationMarkup),true);assert.deepEqual(await get(p),before);
   cases.push({pos,width,height,theme,font,status:'PASS'});
  }
  await p.setViewportSize({width:1280,height:720});await frames(p);
  await p.locator('[data-allocation-guide] summary').click();const draft=await get(p);await p.locator('[data-main-view="career"]').click();await p.locator('#decision-return').click();assert.equal(await p.locator('[data-allocation-guide]').getAttribute('open'),'');assert.deepEqual(await get(p),draft);
  // Normal navigation restores the dedicated pane's nonzero scroll position.
  await p.evaluate(()=>{document.getElementById('view-home').scrollTop=100;});const saved=await p.locator('#view-home').evaluate(e=>e.scrollTop);assert.ok(saved>0);await p.locator('[data-main-view="player"]').click();await p.locator('[data-main-view="home"]').click();await frames(p);assert.equal(await p.locator('#view-home').evaluate(e=>e.scrollTop),saved);
  await p.locator('[data-allocation-guide] summary').click();assert.equal(await p.locator('[data-allocation-guide]').getAttribute('open'),null);
  for(const [width,height] of [[320,568],[390,844],[844,390],[1280,720],[1440,900]]){await p.setViewportSize({width,height});await p.evaluate(()=>{document.getElementById('view-home').scrollTop=0;window.scrollTo(0,0);});await p.screenshot({path:path.join(out,`${pos}-${width}.png`),fullPage:false,animations:'disabled'});}
  await action(p,reference.p,'undo');await action(p,reference.p,'spend');await action(p,reference.p,'reset');
  // Real engine fixtures: rising costs, over potential, carry, caps and empty resources.
  const keys=pos==='P'?['vel','ctl','brk','sta']:['sta','con','pow','eye','spd','rng','fld','arm','cat'];
  const fixture=(value,potential,carry=0)=>({ab:Object.fromEntries(keys.map(k=>[k,value])),pot:Object.fromEntries(keys.map(k=>[k,potential])),carry:Object.fromEntries(keys.map(k=>[k,carry])),traits:{},age:20,stage:'HS'});
  const variants=[{name:'dice-cost-potential',state:fixture(pos==='P'?66:72,60),mode:{dice:[1,6,2]}},{name:'point-cost-potential',state:fixture(pos==='P'?66:72,60),mode:{pool:5}},{name:'carry-cap-discard',state:{...fixture(80,80),ab:{...fixture(80,80).ab,[keys[0]]:79},carry:{[keys[0]]:pos==='P'?6:2}},mode:{pool:4}},{name:'all-cap-dice',state:fixture(80,80),mode:{dice:[6,2]}},{name:'empty-dice',state:{...fixture(40,62),carry:null},mode:{dice:[]}},{name:'empty-points',state:fixture(40,62),mode:{pool:0}}];
  for(const v of variants){for(const q of [p,reference.p])await q.evaluate(v=>window.__allocationProbe.fixture(v.state,v.mode),v);await equal(p,reference.p,v.name+' initial');
   assert.equal(await p.locator('#view-home').getAttribute('data-allocation-open'),'');
   if(!v.name.startsWith('empty')&&!v.name.startsWith('all-cap')){await action(p,reference.p,'spend');await action(p,reference.p,'undo');await action(p,reference.p,'spend');await action(p,reference.p,'reset');}
   for(let i=0;i<10;i++){if(await p.locator('#al-btm .main:not(:disabled)').count())break;await action(p,reference.p,'spend');if(i===9)throw Error('not confirmable');}
   const beforeConfirm=await get(p);for(const q of [p,reference.p])await q.evaluate(()=>{const button=document.querySelector('#al-btm .main:not(:disabled)');button.click();button.click();});await equal(p,reference.p,v.name+' stale duplicate confirmation');assert.equal((await get(p)).done,beforeConfirm.done+1);assert.equal(await p.locator('#view-home').getAttribute('data-allocation-open'),null);assert.equal(await p.locator('#log').isVisible(),true);
   checks.push({pos,fixture:v.name,status:'PASS'});
  }
  // Projection must reject plausible but incorrect preview and resource values.
  for(const q of [p,reference.p])await q.evaluate(v=>window.__allocationProbe.fixture(v,{pool:3}),fixture(60,62));await equal(p,reference.p,'negative-control setup');
  assert.deepEqual(await p.evaluate(()=>['[data-allocation-preview]','[data-allocation-status]'].map(selector=>{const clone=document.getElementById('act').cloneNode(true);clone.querySelector(selector).textContent='今回 60 → 80（+20）';try{window.__projectDecisionPresentation(clone.outerHTML,'act',window.__allocationProbe.get().state);return false;}catch(e){return /^PHASE3_ALLOCATION_/.test(e.message);}})),[true,true]);
  await reference.c.close();await c.close();console.log('PASS '+pos+': 64 layouts, exact natural and six native fixture S/RNG, undo/reset, retained nodes, return/scroll and once-only confirmation');
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e;console.error(e.stack);}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await writeFile(path.join(out,'summary.json'),JSON.stringify({status:failure?'FAIL':'PASS',baseline,cases,checks,errors,failure:failure?.stack},null,2));}
if(failure)throw failure;
