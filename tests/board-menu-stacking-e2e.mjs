// UI-BOARD-MENU-STACK-01 (1.16.13): the board menu panel must stay above the sticky #act. #board and #act were both
// z-index 20, so #act (later in the DOM) painted over the panel; with the tall dice-allocation panel at phone width the
// lower menu items (共有／開発を応援／タイトルに戻る) were covered and could not be tapped. In a real career at the
// allocation step, every panel item must be the hit target at its centre, and a real click on the last item must open
// its confirmation dialog. A precondition checks that #act actually overlaps the panel, so the check is not vacuous.
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
const server=createServer(async(req,res)=>{
  try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(rel.includes('..'))throw Error('path');
    const content=await readFile(path.join(root,'docs',rel));
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(e){res.statusCode=404;res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[],artifacts=path.join(os.tmpdir(),'yakyujinsei-board-menu-stacking-e2e');await mkdir(artifacts,{recursive:true});
const wire=async(ctx,p)=>{await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async p=>{await p.goto(local+'/?seed=menu-stack-01');await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="IF"]').click();await p.locator('#in-name').fill('重なり検証');await p.locator('#btn-start').click();};
let failure;
try{
  // --sizes=390x720,320x640 runs a subset (used to prove each phone size fails on its own in the negative control).
  const sizes=(arg('sizes')||'390x720,320x640,1280x720').split(',').map(s=>s.split('x').map(Number));
  for(const [width,height] of sizes){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();await wire(ctx,p);await start(p);
    // The first year opens with the dice-allocation entry; its panel is the tallest #act.
    await p.locator('#act button').filter({hasText:'トレーニング成果を割り振る'}).click();
    await p.locator('#act .abrow').first().waitFor();
    await p.locator('#board-menu-toggle').click();await p.locator('#board-menu-panel').waitFor();
    const r=await p.evaluate(()=>{const panel=document.querySelector('#board-menu-panel'),pr=panel.getBoundingClientRect(),ar=document.querySelector('#act').getBoundingClientRect();
      return {panelBottom:pr.bottom,actTop:ar.top,items:[...panel.querySelectorAll('button,a[href]')].map(el=>{const b=el.getBoundingClientRect(),x=b.left+b.width/2,y=b.top+b.height/2,hit=document.elementFromPoint(x,y);
        return {id:el.id,cy:y,inViewport:b.top>=0&&b.bottom<=innerHeight,hit:!!hit&&(hit===el||el.contains(hit)),by:hit?(hit.id||String(hit.className)||hit.tagName):null};})};});
    const label=width+'x'+height;
    // Precondition: on phones at least one item centre lies inside #act, so the old stacking would have covered it.
    if(width<500){const over=r.items.filter(i=>i.cy>r.actTop).map(i=>i.id);assert.ok(over.length>0,label+' precondition: an item centre lies below #act top '+Math.round(r.actTop));console.log(label+' items over #act: '+over.join(','));}
    assert.deepEqual(r.items.map(i=>i.id),['board-menu-close','board-help','board-updates','board-bug-report','board-credits','board-preferences','board-share','board-support','btn-restart'],label+' visible close and preserved menu items');
    for(const item of r.items){assert.ok(item.inViewport,label+' '+item.id+' inside the viewport');assert.ok(item.hit,label+' '+item.id+' is the hit target (covered by '+item.by+')');}
    await p.screenshot({path:path.join(artifacts,label+'-menu-over-allocation.png')});
    // A real click (actionability includes the hit-target check) on the lowest item opens its confirmation.
    await p.locator('#btn-restart').click({timeout:5000});
    await p.locator('#confirmation-dialog[open]').waitFor({timeout:5000});
    await p.locator('#confirmation-cancel').click();
    assert.equal(await p.locator('#confirmation-dialog[open]').count(),0,label+' confirmation closed by cancel');
    assert.equal(await p.locator('#act .abrow').count()>0,true,label+' allocation still in place after cancel');
    console.log('PASS '+label+': 8 menu items hit-testable over the allocation panel, タイトルに戻る opens its confirmation');
    await ctx.close();
  }
  assert.deepEqual(errors,[],'console errors / JS-CSS 404');
  console.log('Console/JS-CSS404 0; screenshots '+artifacts);
}catch(e){failure=e;}
await browser.close();server.close();
if(failure)throw failure;
