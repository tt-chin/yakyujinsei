// EVT-01 (1.16.11): in a real browser career, the first event prompt (#act title) and its result card (#log h4) carry
// one category badge. The prompt badge equals effectiveCategory(card, stage) at draw time; the result badge equals the
// category saved in S.processedEventIDs. Checked at 1280 and 390 px, then in all 4 themes (badge colors resolve to the
// theme tokens, no horizontal overflow, badge stays on one line). Screenshots go to the OS temp dir for review.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const THEMES=['standard','night','classic','scoreboard'];
const LABELS={training:'トレーニング',encounter:'日常・交流',endorsement:'広報・スポンサー'};
const hook=`\nwindow.__evtBadge={pending:()=>{const p=S.pendingEvent;if(!p)return null;const ev=EVENTS.find(e=>e.id===p.cardID);return {cardID:p.cardID,name:ev.n,stage:S.stage,raw:ev.category,expected:effectiveCategory(ev,S.stage)};},saved:id=>S.processedEventIDs[id]?.category??null};`;
const server=createServer(async(req,res)=>{
  try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(rel.includes('..'))throw Error('path');
    let content=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')content=content.toString()+hook;
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(e){res.statusCode=404;res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[],artifacts=path.join(os.tmpdir(),'yakyujinsei-event-badge-e2e');await mkdir(artifacts,{recursive:true});
const wire=async(ctx,p)=>{await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,seed,pos)=>{await p.goto(local+'/?seed='+seed);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#in-name').fill('分類検証');await p.locator('#btn-start').click();};
// Click through until the event prompt is up (same selection as event-system-e2e's mobile walk).
const toEvent=async p=>{for(let i=0;i<300;i++){
  const status=await p.evaluate(()=>{const act=document.querySelector('#act');if(act.querySelector('.title')?.textContent.includes('イベント｜'))return 'event';
    const rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
    const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|完了/.test(e.innerText))||buttons[0];if(!b)throw Error('No action');b.click();return 'next';});
  if(status==='event')return;await p.waitForTimeout(20);}throw Error('No event prompt within 300 actions');};
const badgeOf=(p,sel)=>p.evaluate(sel=>{const b=[...document.querySelectorAll(sel)];return b.map(e=>({cls:e.className,text:e.textContent,next:e.nextSibling?.textContent??'',
  ls:getComputedStyle(e).letterSpacing,bg:getComputedStyle(e).backgroundColor,color:getComputedStyle(e).color,lines:Math.round(e.getBoundingClientRect().height/parseFloat(getComputedStyle(e).lineHeight))}));},sel);
let failure;
try{
  for(const [width,height,seed,pos] of [[1280,800,'evt-badge-pc','IF'],[390,844,'evt-badge-sp','P']]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();await wire(ctx,p);await start(p,seed,pos);
    await toEvent(p);const pending=await p.evaluate(()=>window.__evtBadge.pending());assert.ok(pending,'pending event');
    const prompt=await badgeOf(p,'#act .title .event-badge');
    assert.equal(prompt.length,1,'one prompt badge');assert.equal(prompt[0].cls,'event-badge event-badge-'+pending.expected,JSON.stringify(pending));
    assert.equal(prompt[0].text,LABELS[pending.expected]);assert.ok(prompt[0].next.startsWith('イベント｜'),prompt[0].next);assert.ok(['normal','0px'].includes(prompt[0].ls),'letter-spacing reset: '+prompt[0].ls);assert.equal(prompt[0].lines,1,'badge on one line');
    await p.screenshot({path:path.join(artifacts,`prompt-${width}.png`)});
    await p.locator('#act button').first().click();
    const card=p.locator('#log [data-event-occurrence-id]').last();await card.waitFor();
    const occ=await card.getAttribute('data-event-occurrence-id'),saved=await p.evaluate(id=>window.__evtBadge.saved(id),occ);assert.ok(saved,'saved category');
    const result=await badgeOf(p,`#log [data-event-occurrence-id="${occ}"] h4 .event-badge`);
    assert.equal(result.length,1,'one result badge');assert.equal(result[0].cls,'event-badge event-badge-'+saved);assert.equal(result[0].text,LABELS[saved]);assert.equal(result[0].next,pending.name,'approved result heading contains the exact event name without the repeated label');assert.ok(['normal','0px'].includes(result[0].ls),'h4 letter-spacing reset: '+result[0].ls);assert.equal(result[0].lines,1,'result badge on one line');
    assert.equal(saved,pending.expected,'saved category equals the draw-time effective category');
    console.log(`${width}px ${pos}: stage ${pending.stage}, card ${pending.cardID} (${pending.raw}) → ${pending.expected}; prompt + result badge OK`);
    for(const theme of THEMES){
      await p.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);
      await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const [b]=await badgeOf(p,`#log [data-event-occurrence-id="${occ}"] h4 .event-badge`);
      const want=await p.evaluate(k=>{const probe=document.createElement('span');probe.style.cssText=`background:var(--event-${k}-bg);color:var(--event-${k}-text)`;document.body.append(probe);const s=getComputedStyle(probe),r={bg:s.backgroundColor,color:s.color};probe.remove();return r;},saved);
      assert.equal(b.bg,want.bg,theme+' bg token');assert.equal(b.color,want.color,theme+' text token');assert.notEqual(b.bg,'rgba(0, 0, 0, 0)',theme+' badge background set');
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' horizontal overflow');
      await card.scrollIntoViewIfNeeded();await card.screenshot({path:path.join(artifacts,`result-${width}-${theme}.png`)});
    }
    await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log('Event category badge E2E passed; console / JS-CSS 404: 0. Screenshots: '+artifacts);
}catch(e){failure=e;console.error(e);}finally{server.closeAllConnections();server.close();server.unref();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
