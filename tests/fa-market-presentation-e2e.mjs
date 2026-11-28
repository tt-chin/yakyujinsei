import {assertUi20VersionStamps,currentUiBaselineVersion} from './support/ui-version-comparison.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {projectDecisionPresentation} from './support/decision-dom-comparison.mjs';
import {sortFaOffers} from '../docs/src/ui/fa-market-presentation.js';
import {VERSION} from '../docs/src/config.js';
import {THEME_IDS} from '../docs/src/ui/theme-catalog.js';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3),baseline='dc9bf83aca09a82ccc891b061231490ec9295c68';
const output=path.resolve(arg('output')||path.join(os.tmpdir(),'fa-market-presentation'));await mkdir(output,{recursive:true});
const hook=`\nwindow.__faDraws=[];careerRng.onDraw=value=>window.__faDraws.push({value,state:S.rngState});window.__faProbe={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:window.__faDraws.slice(),done:window.__faDone||0}),buttons:()=>choiceViews.get(S).buttons,fixture:()=>{Object.assign(S,{stage:'PRO',org:'NPB',lv:'NPB1',orgTeamId:listByOrg('NPB')[0].teamId,year:2032,age:28,lastD:4,ab:Object.fromEntries(POS_AB[S.pos].map(k=>[k,65])),traits:{},lastFaMarket:null,faType:'OVERSEAS',currentSalary:9000000,salaryEvaluationHistory:[],serviceTime:{NPB:9,MLB:0,KBO:0,CPBL:0}});if(typeof flowHooks!=='undefined')flowHooks.advance=()=>{window.__faDone=(window.__faDone||0)+1;};else advance=()=>{window.__faDone=(window.__faDone||0)+1;};faMarket(65,4);},empty:()=>{S.lastFaMarket={...S.lastFaMarket,offers:[],stayOffer:null,acceptedOfferId:null};faMarket(65,4);},rechoose:aside=>{const v=choiceViews.get(S);choose(v.title,[...v.opts.filter(o=>!o.extraProbe),{t:'追加の選択肢',faAside:aside,extraProbe:true,f:()=>{}}]);},settle:()=>browserSave.settled()};`;
const cache=new Map(),server=createServer(async(req,res)=>{try{let rel=new URL(req.url,'http://local').pathname.slice(1)||'index.html',old=rel.startsWith('baseline/');if(old)rel=rel.slice(9)||'index.html';if(rel==='favicon.ico'){res.statusCode=204;return res.end();}if(rel.split('/').includes('..'))throw Error('path');if(old&&!cache.has(rel))cache.set(rel,execFileSync('git',['show',baseline+':docs/'+rel],{cwd:root,maxBuffer:30e6}));let body=old?cache.get(rel):await readFile(path.join(root,'docs',rel));if(old&&rel==='src/config.js')body=currentUiBaselineVersion(body);if(rel==='src/engine/game.js')body=body.toString()+hook+'\nwindow.__phase3Pending=()=>choiceViews.get(S);window.__projectFa='+projectDecisionPresentation.toString()+';';res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':'text/html; charset=utf-8');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright'),browser=await chromium.launch({headless:true,...(arg('browser')?{channel:arg('browser')}:{})}),errors=[],cases=[];
const frames=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const get=p=>p.evaluate(()=>window.__faProbe.get());
function comparable(value){return assertUi20VersionStamps(value);}
async function open(pos,old=false){const c=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});await c.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({contentType:'text/css',body:''}));const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto(url+(old?'/baseline/':'/')+'?seed=fa-ui-'+pos);await p.waitForFunction(()=>!document.getElementById('btn-start').disabled);await p.locator('#in-name').fill('契約比較');await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();await p.evaluate(()=>window.__faProbe.settle());await p.evaluate(()=>window.__faProbe.fixture());await frames(p);return{c,p};}
let failure;
try{
 for(const pos of ['P','IF']){
  const {c,p}=await open(pos),reference=await open(pos,true),before=await get(p),market=before.state.lastFaMarket,offers=[...market.offers,...(market.stayOffer?[market.stayOffer]:[])];
  assert.equal(before.state.version,VERSION);assert.equal((await get(reference.p)).state.version,VERSION);
  assert.deepEqual(comparable(before),comparable(await get(reference.p)),'FA generation preserves full state and every RNG draw against frozen baseline');
  assert.deepEqual(await p.locator('.fa-offer-card > button').evaluateAll(nodes=>nodes.map(n=>n.innerHTML)),await reference.p.locator('#act button').evaluateAll(nodes=>nodes.map(n=>n.innerHTML)),'original names and every contract condition are unchanged');
  for(const [index,offer] of offers.entries())for(const field of ['annualSalary','years','guaranteedTotal']){const value=offer[field],expected=field==='years'?value+'年':value.toLocaleString('ja-JP')+'円';assert.equal(await p.locator('tbody tr[data-fa-offer-index="'+index+'"] [data-fa-field="'+field+'"]').textContent(),expected);}
  const projected=q=>q.evaluate(()=>window.__projectFa(document.getElementById('act').outerHTML,'act',window.__faProbe.get().state));
  assert.equal(await projected(p),await projected(reference.p),'approved wrapper reconstructs the exact original choice DOM');
  assert.deepEqual(await p.evaluate(()=>['[data-fa-field="annualSalary"]','tbody a','.fa-offer-card'].map(selector=>{const copy=document.getElementById('act').cloneNode(true);if(selector==='.fa-offer-card')copy.querySelector(selector).remove();else copy.querySelector(selector).textContent='CORRUPTED';try{window.__projectFa(copy.outerHTML,'act',window.__faProbe.get().state);return false;}catch(e){return /^PHASE3_FA_/.test(e.message);}})),[true,true,true],'comparison rejects corrupted financial value, club name and missing guarded button');
  await p.evaluate(()=>window.__faButtons=window.__faProbe.buttons().slice());
  assert.equal(await p.locator('.fa-offer-card > button').count(),offers.length,'no proxy signing buttons');
  assert.equal(await p.locator('[data-fa-comparison] select').count(),0);assert.equal(await p.locator('[data-fa-sort]').count(),3);assert.equal(await p.locator('[data-fa-sort-header="annualSalary"]').getAttribute('aria-sort'),'descending');assert.equal(await p.locator('[data-fa-sort="annualSalary"] .fa-sort-indicator').textContent(),'▼');
  const setSort=async(field,direction)=>{const th=p.locator('[data-fa-sort-header="'+field+'"]'),button=th.locator('button');if(await th.getAttribute('aria-sort')!==direction){await button.click();if(await th.getAttribute('aria-sort')!==direction)await button.click();}await frames(p);assert.equal(await th.getAttribute('aria-sort'),direction);assert.deepEqual(await p.locator('thead th[data-fa-sort-header]').evaluateAll(nodes=>nodes.filter(n=>n.getAttribute('aria-sort')!=='none').map(n=>n.dataset.faSortHeader)),[field]);assert.equal(await button.locator('.fa-sort-indicator').getAttribute('aria-hidden'),'true');assert.equal(await button.locator('.fa-sort-indicator').textContent(),direction==='ascending'?'▲':'▼');assert.deepEqual(await p.locator('tbody tr').evaluateAll(rows=>rows.map(r=>Number(r.dataset.faOfferIndex))),sortFaOffers(offers,field,direction));assert.deepEqual(await p.locator('.fa-offer-card').evaluateAll(cards=>cards.map(c=>Number(c.dataset.faOfferIndex)).sort((a,b)=>Number(cards[a].style.order)-Number(cards[b].style.order))),sortFaOffers(offers,field,direction));};
  for(const [width,height] of [[320,568],[390,844],[844,390],[1440,900]])for(const theme of THEME_IDS)for(const font of ['medium','large']){
   await p.setViewportSize({width,height});await p.evaluate(({theme,font})=>{document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize=font;},{theme,font});await frames(p);
   for(const field of ['annualSalary','years','guaranteedTotal']){
    for(const direction of ['descending','ascending']){await setSort(field,direction);assert.ok((await p.locator('[data-fa-sort="'+field+'"]').boundingBox()).height>=44);await projected(p);}
   }
   const geometry=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,cards:[...document.querySelectorAll('.fa-offer-card')].map(c=>({overflow:c.scrollWidth>c.clientWidth+1,order:Number(c.style.order)})),table:document.querySelector('.fa-table-scroll').scrollWidth>document.querySelector('.fa-table-scroll').clientWidth}));
   assert.equal(geometry.overflow,false,JSON.stringify({width,height,theme,font,geometry}));assert.ok(geometry.cards.every(c=>!c.overflow),'all original conditions wrap in cards');if(width===320)assert.equal(geometry.table,true,'small phone table scrolls horizontally');
   assert.deepEqual(await get(p),before,'sort/resize/theme/font never changes S or RNG');cases.push({pos,width,height,theme,font,status:'PASS'});
  }
  await p.setViewportSize({width:390,height:844});await setSort('annualSalary','descending');
  await p.locator('.fa-table-scroll').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(output,pos+'-390-header.png'),animations:'disabled'});
  const selected=Math.min(2,offers.length-1);await p.locator('tbody tr[data-fa-offer-index="'+selected+'"] a').click();await frames(p);
  assert.equal(await p.locator('tbody tr.selected').getAttribute('data-fa-offer-index'),String(selected));
  assert.equal(await p.locator('.fa-offer-card:not([inert])').getAttribute('data-fa-offer-index'),String(selected));
  const targetBox=await p.locator('.fa-offer-card:not([inert])').boundingBox(),navBox=await p.locator('#main-nav').boundingBox();assert.ok(targetBox.y>=navBox.y+navBox.height-1,'table jump clears fixed navigation');
  await p.screenshot({path:path.join(output,pos+'-390-card.png'),animations:'disabled'});
  const sortButton=p.locator('[data-fa-sort="guaranteedTotal"]');await sortButton.focus();const left=await p.locator('.fa-table-scroll').evaluate(n=>n.scrollLeft);await sortButton.press('Enter');await frames(p);assert.equal(await p.locator('[data-fa-sort-header="guaranteedTotal"]').getAttribute('aria-sort'),'descending','switching field starts descending');assert.equal(await sortButton.evaluate(n=>document.activeElement===n),true,'sort retains keyboard focus');assert.equal(await p.locator('.fa-table-scroll').evaluate(n=>n.scrollLeft),left,'sort retains horizontal scroll');await sortButton.press('Space');await frames(p);assert.equal(await p.locator('[data-fa-sort-header="guaranteedTotal"]').getAttribute('aria-sort'),'ascending','Space toggles direction');assert.equal(await sortButton.evaluate(n=>document.activeElement===n),true);assert.equal(await p.locator('.fa-table-scroll').evaluate(n=>n.scrollLeft),left);assert.deepEqual(await get(p),before);await setSort('annualSalary','descending');

  const order=sortFaOffers(offers,'annualSalary'),last=order.at(-1);
  await p.locator('.fa-offer-rail').focus();await p.keyboard.press('End');await frames(p);assert.equal(await p.locator('tbody tr.selected').getAttribute('data-fa-offer-index'),String(last),'keyboard changes visible card');
  // A native scroll event (same path as a swipe) keeps the table highlight aligned.
  const first=order[0];await p.locator('.fa-offer-rail').evaluate((rail,index)=>{const card=rail.querySelector('[data-fa-offer-index="'+index+'"]');rail.scrollLeft+=card.getBoundingClientRect().left-rail.getBoundingClientRect().left;},first);await p.waitForFunction(index=>document.querySelector('tbody tr.selected')?.dataset.faOfferIndex===String(index),first);
  await p.locator('[data-main-view="player"]').click();await p.locator('#decision-return').click();await frames(p);
  assert.equal(await p.evaluate(()=>window.__faButtons.every((b,i)=>b===window.__faProbe.buttons()[i]&&b.isConnected&&typeof b.onclick==='function')),true,'original guarded buttons and closures survive navigation');assert.deepEqual(await get(p),before);
  await p.locator('tbody tr[data-fa-offer-index="'+selected+'"] a').click();
  await p.evaluate(index=>window.__faStale=window.__faProbe.buttons()[index],selected);
  const button=p.locator('.fa-offer-card[data-fa-offer-index="'+selected+'"] button');await button.click();await p.evaluate(()=>{window.__faStale.click();window.__faStale.click();});await reference.p.evaluate(index=>{const button=window.__faProbe.buttons()[index];button.click();button.click();},selected);await frames(p);
  assert.deepEqual(comparable(await get(p)),comparable(await get(reference.p)),'same exact offer signs to identical full state/RNG through original guarded handler');assert.equal((await get(p)).done,1);
  assert.equal(await p.locator('[data-fa-comparison]').count(),0,'FA UI cleaned after signing');
  await p.evaluate(()=>window.__faProbe.fixture());await p.evaluate(()=>window.__faProbe.empty());assert.equal(await p.locator('[data-fa-comparison]').count(),0,'zero offers retains original return/retire choices');assert.equal(await p.locator('#act button').count(),2);
  // Year-8 FA cancel (NPB-OFFER-WINDOW-01): a trailing faAside choice keeps the comparison and is placed after it; any other extra choice still disables it.
  await p.evaluate(()=>window.__faProbe.fixture());await frames(p);const asideOffers=(await get(p)).state.lastFaMarket,asideCount=asideOffers.offers.length+(asideOffers.stayOffer?1:0);
  await p.evaluate(()=>window.__faProbe.rechoose(true));await frames(p);assert.equal(await p.locator('[data-fa-comparison]').count(),1,'faAside choice keeps the comparison');
  assert.equal(await p.locator('.fa-offer-card > button').count(),asideCount,'only offer buttons move into cards');
  assert.equal(await p.evaluate(()=>{const extra=[...document.querySelectorAll('#act > button')].find(n=>n.textContent==='追加の選択肢'),root=document.querySelector('[data-fa-comparison]');return !!extra&&!!(root.compareDocumentPosition(extra)&Node.DOCUMENT_POSITION_FOLLOWING);}),true,'faAside button follows the comparison');
  await p.evaluate(()=>window.__faProbe.rechoose(false));await frames(p);assert.equal(await p.locator('[data-fa-comparison]').count(),0,'an unmarked extra choice still disables the comparison');
  await reference.c.close();await c.close();console.log('PASS '+pos+': 32 layouts, numeric sorts, selected card/scroll/keyboard, retained handlers, same baseline generation/signing S/RNG and zero offers');
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e;console.error(e.stack);}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await writeFile(path.join(output,'summary.json'),JSON.stringify({status:failure?'FAIL':'PASS',baseline,allowedDifferences:[],cases,errors,failure:failure?.stack},null,2));}
if(failure)throw failure;
