// INT-01: in a real browser, キャリア → 実績 lists the tournaments actually played (S.intlTraitResults) after the 実績
// panel, and the retirement 通算成績 card shows the same list right after the 国際大会通算 table. Rows are collapsed
// <details> (year, name, rank); expanding shows the saved 本大会の個人成績 or 記録なし. No tournaments → no extra node.
// Viewing / expanding never changes S (rngState included). Checked at 1280 and 390 px and in all 4 themes.
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
const RESULTS={'P12:2027':{eventKey:'P12:2027',year:2027,rank:'準優勝',hadIntlace:false,basePoints:3,awardedPoints:3,injuryAdded:10,finalReached:true,unlockedIntlace:false},
  'WBC:2026':{eventKey:'WBC:2026',year:2026,rank:'優勝',hadIntlace:false,basePoints:5,awardedPoints:5,injuryAdded:10,finalReached:true,unlockedIntlace:false,personalStats:{position:'P',role:'SP',stats:{G:2,IP:9,W:1,SV:0,SO:11,ER:2}}}};
const hook=`\nwindow.__intlHist={state:()=>JSON.stringify(S),played:r=>{S.intlTraitResults=r;S.intlCount=Object.keys(r).length;S.intlStat={G:5,IP:10,W:1,SV:0,SO:12,ER:3,AB:20,H:6,PA:22,HR:1,RBI:4};},retire:()=>endGame('検証')};`;
const server=createServer(async(req,res)=>{
  try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(rel.includes('..'))throw Error('path');
    let content=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')content=content.toString()+hook;
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(e){res.statusCode=404;res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[],artifacts=path.join(os.tmpdir(),'yakyujinsei-international-history-e2e');await mkdir(artifacts,{recursive:true});
const wire=async(ctx,p)=>{await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,seed,pos)=>{await p.goto(local+'/?seed='+seed);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#in-name').fill('国際検証');await p.locator('#btn-start').click();await p.waitForFunction(()=>window.__intlHist);};
const frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const openAchievements=async p=>{await p.locator('[data-main-view="career"]').click();await p.locator('[data-career-tab="achievements"]').click();await p.locator('#career-content .ui-panel').first().waitFor();};
const panelOf=p=>p.evaluate(()=>{const c=document.getElementById('career-content'),blocks=c.querySelectorAll('[data-intl-history]'),b=blocks[0];
  return {count:blocks.length,panels:[...c.children].map(e=>e.querySelector('h2')?.textContent),
    rows:b?[...b.querySelectorAll('details.intl-history-item')].map(d=>({summary:d.querySelector('summary').textContent,open:d.open,body:d.textContent.slice(d.querySelector('summary').textContent.length)})):[]};});
const fits=p=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
const WANT=['2026 ワールド・ベースボール・クラシック　優勝','2027 WBSCプレミア12　準優勝'];
let failure;
try{
  for(const [width,height,seed,pos] of [[1280,800,'intl-hist-pc','P'],[390,844,'intl-hist-sp','P']]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();await wire(ctx,p);await start(p,seed,pos);
    // 1) no tournaments: the 実績 tab is exactly the 実績 panel.
    await openAchievements(p);let v=await panelOf(p);
    assert.equal(v.count,0,'no history without results');assert.deepEqual(v.panels,['実績']);
    // 2) played tournaments: one panel after 実績, schedule order, collapsed; S unchanged by viewing and toggling.
    await p.locator('[data-main-view="home"]').click();await p.evaluate(r=>window.__intlHist.played(r),RESULTS);
    const before=await p.evaluate(()=>window.__intlHist.state());
    await openAchievements(p);v=await panelOf(p);
    assert.equal(v.count,1);assert.deepEqual(v.panels,['実績','国際大会出場履歴']);
    assert.deepEqual(v.rows.map(r=>r.summary),WANT,'played tournaments in schedule order');assert.ok(v.rows.every(r=>!r.open),'collapsed by default');
    const first=p.locator('#career-content details.intl-history-item').first();await first.locator('summary').click();
    v=await panelOf(p);assert.equal(v.rows[0].open,true,'expands');assert.match(v.rows[0].body,/本大会の個人成績登板 2｜投球回 9\.0｜勝利 1｜セーブ 0奪三振 11｜防御率 2\.00/);
    await p.locator('#career-content details.intl-history-item').nth(1).locator('summary').click();
    v=await panelOf(p);assert.equal(v.rows[1].body,'本大会の個人成績：記録なし','old result without personal stats');
    assert.ok(await fits(p),width+' no horizontal page overflow when expanded');
    await p.screenshot({path:path.join(artifacts,`achievements-${width}-open.png`),fullPage:true});
    for(const theme of THEMES){await p.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);await frame(p);
      assert.ok(await fits(p),theme+' horizontal overflow');await p.locator('#career-content [data-intl-history]').screenshot({path:path.join(artifacts,`achievements-${width}-${theme}.png`)});}
    await p.evaluate(()=>{delete document.documentElement.dataset.theme;});
    await first.locator('summary').click();assert.equal((await panelOf(p)).rows[0].open,false,'collapses');
    assert.equal(await p.evaluate(()=>window.__intlHist.state()),before,'viewing and toggling leave S (and rngState) unchanged');
    // 3) retirement: the block sits in 通算成績 right after the 国際大会通算 table.
    await p.locator('[data-main-view="home"]').click();await p.evaluate(()=>window.__intlHist.retire());await frame(p);
    const card=await p.evaluate(()=>{const blocks=[...document.querySelectorAll('#log [data-intl-history]')],b=blocks[0],c=b?.closest('.card');
      return {count:blocks.length,card:c?.querySelector('h4')?.textContent,prev:b?.previousElementSibling?.tagName+'.'+b?.previousElementSibling?.className,prevHeading:b?.previousElementSibling?.previousElementSibling?.textContent,
        heading:b?.querySelector('h4')?.textContent,rows:b?[...b.querySelectorAll('details.intl-history-item')].map(d=>({summary:d.querySelector('summary').textContent,open:d.open})):[]};});
    assert.equal(card.count,1);assert.equal(card.card,'通算成績');assert.equal(card.prev,'TABLE.st');assert.match(card.prevHeading,/^国際大会通算（日本代表・2大会）$/);
    assert.equal(card.heading,'国際大会出場履歴');assert.deepEqual(card.rows.map(r=>r.summary),WANT);assert.ok(card.rows.every(r=>!r.open));
    assert.ok(await fits(p),width+' retirement no horizontal page overflow');
    await p.evaluate(()=>{const c=document.querySelector('#log [data-intl-history]').closest('.card');c.querySelectorAll('details').forEach(d=>{d.open=true;});});await frame(p);
    assert.ok(await fits(p),width+' retirement expanded no horizontal page overflow');
    await p.locator('#log [data-intl-history]').screenshot({path:path.join(artifacts,`retirement-${width}.png`)});
    console.log(`${width}px: 実績 panels ${v.panels.join(',')}; retirement rows ${card.rows.length}`);
    await ctx.close();
  }
  // 4) retirement without tournaments: no block.
  {const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage();await wire(ctx,p);await start(p,'intl-hist-none','IF');
    await p.evaluate(()=>window.__intlHist.retire());await frame(p);
    assert.equal(await p.locator('#log [data-intl-history]').count(),0,'no retirement history without results');await ctx.close();}
  assert.deepEqual(errors,[]);console.log('International history E2E passed; console / JS-CSS 404: 0. Screenshots: '+artifacts);
}catch(e){failure=e;console.error(e);}finally{server.closeAllConnections();server.close();server.unref();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
