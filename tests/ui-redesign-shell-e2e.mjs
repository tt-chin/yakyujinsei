import {VERSION} from '../docs/src/config.js';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {projectShell2000,observeShellBoard,SHELL_BOARD_2000,SHELL_BOARD_11615} from './support/ui-shell-comparison.mjs';
import {projectJerseyBoard} from './support/dom-snapshot.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const out=path.resolve(arg('output')||'test-results/ui-redesign-shell');await mkdir(out,{recursive:true});
const comparisonBase='ad8e77f53ede29de6a51c23708b2370eed7b414d';
const hook=`\n(${observeShellBoard.toString()})(gameView,window);window.__shellDraws=[];careerRng.onDraw=value=>window.__shellDraws.push({state:S.rngState,value});window.__shell={get:()=>({state:S&&JSON.parse(JSON.stringify(S)),rng:window.__shellDraws.slice()}),settle:()=>browserSave.settled(),fixture:fields=>{Object.assign(S,fields);board(1);}};`;
const errors=[],cases=[];
const server=createServer(async(req,res)=>{
  let rel=new URL(req.url,'http://local').pathname.slice(1)||'index.html';const baseline=rel.startsWith('baseline/');if(baseline)rel=rel.slice(9)||'index.html';
  if(rel==='favicon.ico'){res.statusCode=204;return res.end();}
  try{if(rel.split('/').includes('..'))throw Error('path');let body=baseline?execFileSync('git',['show',`${comparisonBase}:docs/${rel}`],{cwd:root,maxBuffer:30e6}):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=body.toString()+hook;
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':rel.endsWith('.webp')?'image/webp':'text/html');res.end(body);
  }catch(e){res.statusCode=404;res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium}=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,...(arg('browser')?{channel:arg('browser')}:{})});
const get=p=>p.evaluate(()=>window.__shell.get());
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
let failure;
try{
 for(const pos of ['P','IF']){
  const ctx=await browser.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage();
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
  await p.goto(`http://127.0.0.1:${server.address().port}/?seed=${pos==='P'?'jp3-pitcher-02':'jp3-infielder-01'}`);
  await p.locator('#btn-start').waitFor();await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
  await p.locator('#in-name').fill('長い名前の検証選手');await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();
  await p.locator('#act button').filter({hasText:'トレーニング成果を割り振る'}).click();
  await p.locator('#act .abrow').first().click();await p.evaluate(()=>window.__shell.settle());
  const before=await get(p),startUrl=p.url();
  const baselineContext=await browser.newContext({viewport:{width:1440,height:900}});await baselineContext.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));
  const old=await baselineContext.newPage();old.on('pageerror',e=>errors.push('baseline '+e.message));await old.goto(`http://127.0.0.1:${server.address().port}/baseline/?seed=${before.state.seed}`);await old.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
  await old.locator('#in-name').fill('長い名前の検証選手');await old.locator(`#seg-pos [data-v="${pos}"]`).click();await old.locator('#btn-start').click();await old.locator('#act button').filter({hasText:'トレーニング成果を割り振る'}).click();await old.locator('#act .abrow').first().click();await old.evaluate(()=>window.__shell.settle());
  const reference=await get(old),project=(value,version)=>{const copy=structuredClone(value);assert.equal(copy.state.version,version);delete copy.state.version;assert.equal(copy.state.birthHighSchool.createdVersion,version);delete copy.state.birthHighSchool.createdVersion;return copy;};
  assert.deepEqual(project(before,VERSION),project(reference,'1.16.15'),pos+' exact pre-change allocation state and RNG, only verified version metadata differs');await baselineContext.close();
  // PLY-01: the candidate board carries the approved number badge/menu item; project them back (with contract checks) before the frozen 2.0.0 compare.
  await p.evaluate(({fn,jersey,current,previous})=>{window.__projectJerseyBoard=eval('('+jersey+')');window.__projectShell2000=eval('('+fn+')');window.__shellBoard2000=current;window.__shellBoard11615=previous;},{fn:projectShell2000.toString(),jersey:projectJerseyBoard.toString(),current:SHELL_BOARD_2000,previous:SHELL_BOARD_11615});
  await p.evaluate(()=>{window.__shellAct=document.querySelector('#act');window.__shellRows=[...document.querySelectorAll('#act .abrow')];window.__shellButtons=[...document.querySelectorAll('#act button')];window.__shellDraft=document.querySelector('#act').innerHTML;});
  for(const [width,height] of [[320,640],[390,844],[1099,900],[1100,700],[1440,900],[1440,699],[844,390]]){
   await p.setViewportSize({width,height});
   for(const theme of ['standard','night','classic','scoreboard'])for(const font of ['medium','large']){
    await p.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize=font;},{theme,font});await frames(p);
    const geo=await p.evaluate(()=>{
      const box=id=>{const el=document.getElementById(id),r=el.getBoundingClientRect(),s=getComputedStyle(el);return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height,overflow:s.overflowY,position:s.position,visible:!!el.getClientRects().length};};
      return {overflow:document.documentElement.scrollWidth>innerWidth,app:box('app'),board:box('board'),nav:box('main-nav'),sidebar:box('desktop-player'),main:box('game-main'),log:box('log'),act:box('act'),salary:box('salary-detail-trigger'),salaryText:document.getElementById('bd-sal').textContent};
    });
    const desktop=width>=1100&&height>=700;
    assert.equal(geo.overflow,false,JSON.stringify({pos,width,height,theme,font,geo}));assert.equal(geo.sidebar.visible,desktop);
    assert.equal(geo.salaryText,'アマ');assert.equal(geo.log.height,0,'phase-4 dedicated allocation hides the retained event reader');
    if(desktop){assert.ok(Math.abs(geo.nav.y-geo.main.y-1)<1,'desktop navigation retains its original top position');assert.ok(geo.sidebar.width>=280&&geo.sidebar.width<=320);assert.ok(geo.main.x>=geo.sidebar.right);assert.ok(geo.app.bottom<=height+1);assert.equal(geo.log.overflow,'auto');}
    else{assert.equal(geo.board.position,'sticky');assert.equal(geo.nav.position,'sticky');assert.equal(geo.act.overflow,'visible');}
    cases.push({pos,width,height,theme,font,geo});
   }
   if(width<1100||height<700){
    await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await frames(p);
    const header=await p.evaluate(()=>{const board=document.getElementById('board').getBoundingClientRect(),nav=document.getElementById('main-nav').getBoundingClientRect();return {boardTop:board.top,boardBottom:board.bottom,navTop:nav.top,navBottom:nav.bottom,saveBottom:document.getElementById('save-live').getBoundingClientRect().bottom};});
    assert.ok(Math.abs(header.boardTop)<1,'player board stays pinned');assert.ok(Math.abs(header.navTop-header.boardBottom)<1,'navigation stays directly below the complete board');assert.ok(header.saveBottom<=header.navTop+1,'save status stays above navigation');
   }
   await p.locator('[data-main-view="player"]').click();
   await p.locator('[data-player-tab="ability"]').focus();await p.keyboard.press('ArrowRight');
   assert.equal(await p.locator('[data-player-tab="traits"]').getAttribute('aria-selected'),'true');
   assert.equal(await p.locator('#player-content').getAttribute('aria-labelledby'),'player-content-tab-traits');
   await p.keyboard.press('Home');assert.equal(await p.locator('[data-player-tab="ability"]').getAttribute('tabindex'),'0');
   await p.keyboard.press('End');assert.equal(await p.locator('[data-player-tab="stats"]').getAttribute('aria-selected'),'true');
   await p.locator('[data-player-tab="contract"]').click();assert.match(await p.locator('#player-content').textContent(),/契約/);
   await p.locator('[data-main-view="career"]').click();await p.locator('[data-career-tab="stats"]').focus();await p.keyboard.press('End');
   assert.equal(await p.locator('[data-career-tab="yearly"]').getAttribute('aria-selected'),'true');
   await p.locator('[data-main-view="home"]').click();
   await p.locator('#board-menu-toggle').click();assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-close');
   await p.keyboard.press('Shift+Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'btn-restart');
   await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-close');
   await p.evaluate(()=>document.querySelector('[data-main-view="career"]').focus());assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-close','background is inert');
   const sheet=await p.locator('#board-menu-panel').boundingBox();assert.ok(sheet.height<=height*.85+1);assert.ok(sheet.y>=0);
   if(width<1100)assert.ok(Math.abs(sheet.y+sheet.height-height)<=1);
   await p.keyboard.press('Escape');assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-toggle');
   await p.locator('#board-menu-toggle').click();await p.locator('#board-menu-close').click();assert.equal(await p.locator('#board-menu-panel').isVisible(),false);
   await p.locator('#board-menu-toggle').click();await p.mouse.click(2,2);assert.equal(await p.locator('#board-menu-panel').isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-toggle');
   assert.equal(await p.evaluate(()=>window.__shellAct===document.querySelector('#act')&&window.__shellDraft===document.querySelector('#act').innerHTML&&window.__shellRows.every(n=>n.isConnected)&&window.__shellButtons.every(n=>n.isConnected)),true,'allocation DOM/draft retained');
   assert.deepEqual(await get(p),before,'navigation/resize/menu must preserve complete S and RNG');
   assert.equal(p.url(),startUrl,'navigation/resize/menu must not change the URL (AUD-02 06d)');
   await p.evaluate(()=>{const board=document.querySelector('#board').cloneNode(true);board.querySelector('#save-live').remove();window.__projectShell2000(window.__projectJerseyBoard(board.outerHTML,window.__shell.get().state),window.__shellRenderedBoard);const risk=board.querySelector('#bd-risk');risk.textContent='999%';let rejected=false;try{window.__projectShell2000(window.__projectJerseyBoard(board.outerHTML,window.__shell.get().state),window.__shellRenderedBoard);}catch(e){rejected=e.message.startsWith('UI_SHELL_2000_STATIC_BOARD_CONTRACT');}if(!rejected)throw Error('board negative control was accepted');});
   if([320,390,1100,1440,844].includes(width))await p.screenshot({path:path.join(out,`${pos}-${width}x${height}.png`),fullPage:true});
  }
  // AUD-02 14c (CURRENT_SPEC 2.0 shell): #main-nav vertical padding is calc(4px * --nav-scale), every button is at least 44px, the standard
  // row is about 53px, and a padding-only density change re-syncs --board-height／--game-header-height through the border-box ResizeObserver.
  const shown=await p.evaluate(()=>({...document.documentElement.dataset})),shownViewport=p.viewportSize();const navRows=[];
  for(const width of [320,390,1280]){
   await p.setViewportSize({width,height:900});
   for(const font of ['small','medium','large'])for(const density of ['standard','compact']){
    await p.evaluate(({font,density})=>{const d=document.documentElement.dataset;d.theme='standard';d.fontSize=font;d.density=density;},{font,density});
    await p.evaluate(()=>document.fonts.ready);await frames(p);
    const m=await p.evaluate(()=>{const nav=document.getElementById('main-nav'),s=getComputedStyle(nav),root=getComputedStyle(document.documentElement),board=document.getElementById('board').getBoundingClientRect().height,height=nav.getBoundingClientRect().height;
     return {height,board,padTop:parseFloat(s.paddingTop),padBottom:parseFloat(s.paddingBottom),border:parseFloat(s.borderTopWidth)+parseFloat(s.borderBottomWidth),scale:parseFloat(root.getPropertyValue('--nav-scale')),buttons:[...nav.querySelectorAll('button')].filter(b=>b.getClientRects().length).map(b=>b.getBoundingClientRect().height),boardVar:parseFloat(nav.style.getPropertyValue('--board-height')),headerVar:parseFloat(document.documentElement.style.getPropertyValue('--game-header-height'))};});
    const label=JSON.stringify({pos,width,font,density,m}),scale=density==='compact'?0.85:1;navRows.push({pos,width,font,density,height:m.height});
    assert.ok(Math.abs(m.scale-scale)<1e-6&&Math.abs(m.padTop-4*scale)<0.01&&Math.abs(m.padBottom-4*scale)<0.01,'nav padding is 4px × --nav-scale '+label);
    assert.equal(m.buttons.length,3,label);assert.ok(m.buttons.every(h=>h>=44-0.01),'nav buttons are at least 44px '+label);
    assert.ok(Math.abs(m.height-(Math.max(...m.buttons)+m.padTop+m.padBottom+m.border))<0.5,'nav has no height beyond its tallest button, padding and border '+label);
    if(font==='medium'&&density==='standard')assert.ok(Math.abs(m.height-53)<=1,'standard row is about 53px '+label);
    assert.ok(Math.abs(m.boardVar-m.board)<0.5&&Math.abs(m.headerVar-(m.board+m.height))<0.5,'--board-height／--game-header-height follow the measured border boxes '+label);
   }
  }
  cases.push({pos,navRows});
  await p.setViewportSize(shownViewport);await p.evaluate(shown=>{const d=document.documentElement.dataset;for(const key of ['theme','fontSize','density'])if(shown[key]===undefined)delete d[key];else d[key]=shown[key];},shown);await frames(p);
  assert.deepEqual(await get(p),before,'14c measurements preserve complete S and RNG');assert.equal(p.url(),startUrl,'14c measurements keep the URL');
  // Undo remains bound to the original allocation closure after all navigation/resizes.
  await p.locator('#act button').filter({hasText:'元に戻す'}).click();
  assert.notDeepEqual((await get(p)).state.ab,before.state.ab);assert.deepEqual((await get(p)).rng,before.rng);
  await p.evaluate(()=>window.__shell.fixture({stage:'PRO',currentSalary:1234567890,injNext:17,rehab:1,skipMid:true,seasonFactor:0}));await p.setViewportSize({width:1440,height:900});await frames(p);
  assert.equal(await p.locator('#bd-sal').textContent(),'123,457');assert.equal(await p.locator('#bd-risk').textContent(),'-');assert.match(await p.locator('#desktop-player').textContent(),/リハビリ中（今季全休・残り1年）/);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.querySelector('#desktop-player').scrollWidth>document.querySelector('#desktop-player').clientWidth),false,'long rehab and salary fit the sidebar');
  await p.evaluate(()=>{const board=document.querySelector('#board').cloneNode(true);board.querySelector('#save-live').remove();window.__projectShell2000(window.__projectJerseyBoard(board.outerHTML,window.__shell.get().state),window.__shellRenderedBoard);});
  // Expected values come from renderer inputs, so corrupt live DOM must fail.
  await p.evaluate(()=>{const salary=document.getElementById('bd-sal'),saved=salary.textContent;try{salary.textContent='999,999';const board=document.querySelector('#board').cloneNode(true);board.querySelector('#save-live').remove();let rejected=false;try{window.__projectShell2000(window.__projectJerseyBoard(board.outerHTML,window.__shell.get().state),window.__shellRenderedBoard);}catch(e){rejected=e.message==='UI_SHELL_2000_SALARY_CONTRACT';}if(!rejected)throw Error('corrupt salary DOM was accepted');}finally{salary.textContent=saved;}});
  await ctx.close();console.log('PASS '+pos+': responsive layout, modal, tabs, allocation identity, exact state/RNG');
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e;}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await writeFile(path.join(out,'summary.json'),JSON.stringify({status:failure?'FAIL':'PASS',comparisonBase,allowedDifferences:['state.version','state.birthHighSchool.createdVersion'],cases,errors,failure:failure?.stack},null,2));}
if(failure)throw failure;
