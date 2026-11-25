// INJ-UI-01: in a real browser, 選手 → 能力 and the desktop sidebar show 健康診断時の故障リスク in コンディション
// (right after シーズン稼働率) with a collapsed 故障リスクの内訳 <details>. A real season is played up to the health check:
// the value shown before the check equals the 故障率 the check used (result card, when uninjured), and afterwards the
// row reads 判定済み（X%） with the judged breakdown. Hooks then cover the year start before phasePre (stale tmpInj shown as
// reset), the live tmpInj after phasePre, and a rehab season (no check). Viewing, expanding and re-rendering never
// change S (rngState included); the breakdown and 潜在能力について keep their own open state. 1280 and 390 px, 4 themes.
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
const hook=`\nwindow.__headerDraws=0;careerRng.onDraw=()=>window.__headerDraws++;window.__injRisk={draws:()=>window.__headerDraws,state:()=>JSON.stringify(S),done:()=>S.done,set:o=>{Object.assign(S,o);board(1);},mark:()=>{markInjurySeasonStart(S);board(1);},newYear:()=>{S.year++;board(1);}};`;
const server=createServer(async(req,res)=>{
  try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(rel.includes('..'))throw Error('path');
    let content=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')content=content.toString()+hook;
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(e){res.statusCode=404;res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[],artifacts=path.join(os.tmpdir(),'yakyujinsei-injury-risk-e2e');await mkdir(artifacts,{recursive:true});
const wire=async(ctx,p)=>{await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,seed,pos)=>{await p.goto(local+'/?seed='+seed);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#in-name').fill('故障検証');await p.locator('#btn-start').click();await p.waitForFunction(()=>window.__injRisk&&document.querySelector('#act button'));};
const frame=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
// Same driver as game-view-dom-e2e (first row), stopping at the health check button.
function step(){const check=[...document.querySelectorAll('#act button')].find(e=>!e.disabled&&e.innerText.includes('シーズン半ばの健康診断'));if(check)return 'CHECK';
  const rows=[...document.querySelectorAll('#act .abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...document.querySelectorAll('#act button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
  const target=buttons.find(e=>e.innerText.trim().startsWith('通常投球'))||rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons[0];if(!target)return 'NONE';target.click();return 'CLICK';}
const toHealthCheck=async p=>{for(let i=0;i<300;i++){if(await p.evaluate(()=>window.__injRisk.done()))throw Error('career ended before the health check');const r=await p.evaluate(step);if(r==='CHECK')return;await frame(p);}throw Error('health check not reached');};
const conditionOf=(p,scope)=>p.evaluate(scope=>{const host=document.querySelector(scope),section=[...host.querySelectorAll('section.ui-panel')].find(s=>s.querySelector('h2')?.textContent==='コンディション');if(!section)return null;
  const pairs=dl=>[...dl.querySelectorAll(':scope>dt')].map(dt=>[dt.textContent,dt.nextElementSibling.textContent]);const d=section.querySelectorAll('details.ui-condition-breakdown');
  return {rows:pairs(section.querySelector(':scope>dl')),details:d.length,open:d[0]?.open,summary:d[0]?.querySelector('summary').textContent,breakdown:d[0]?pairs(d[0].querySelector('dl')):[],note:d[0]?.querySelector('p')?.textContent,
    children:[...section.children].map(e=>e.tagName+(e.className?'.'+e.className:''))};},scope);
const openPlayer=async p=>{await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="ability"]').click();await p.locator('#player-content .ui-panel').first().waitFor();};
const home=p=>p.locator('[data-main-view="home"]').click();
const fits=p=>p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth);
const riskOf=c=>c.rows.find(([label])=>label==='健康診断時の故障リスク')?.[1];
let failure,matched=0;
try{
  for(const [width,height,seed,pos] of [[1280,800,'inj-risk-pc','P'],[390,844,'inj-risk-sp','IF']]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();await wire(ctx,p);await start(p,seed,pos);
    // 1) real season: before the check the row is the live value, second in コンディション, breakdown collapsed.
    await toHealthCheck(p);await openPlayer(p);let c=await conditionOf(p,'#player-content');
    assert.equal(c.rows[1][0],'健康診断時の故障リスク');assert.equal(c.rows[0][0],'シーズン稼働率');
    const shown=riskOf(c),m=/^(\d+)%$/.exec(shown);assert.ok(m,'forecast value '+shown);
    assert.equal(await p.locator('#bd-risk').textContent(),shown,'header forecast equals shared condition');assert.equal(await p.locator('#bd-risk').evaluate(e=>e.nextElementSibling.textContent),'故障リスク');assert.equal(c.details,1);assert.equal(c.open,false);assert.equal(c.summary,'故障リスクの内訳');assert.deepEqual(c.breakdown.at(-1),['結果',shown]);
    assert.deepEqual(c.children,['H2','DL.ui-data-list','DETAILS.ui-condition-breakdown']);assert.match(c.note,/健康診断1回の判定確率です。.*今後のイベントで変わることがあります。$/);
    const before=await p.evaluate(()=>window.__injRisk.state());
    await p.locator('#player-content details.ui-condition-breakdown summary').click();c=await conditionOf(p,'#player-content');assert.equal(c.open,true,'expands');
    assert.ok(await fits(p),width+' no horizontal overflow when expanded');await p.screenshot({path:path.join(artifacts,`player-${width}-forecast.png`),fullPage:true});
    for(const theme of THEMES){await p.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);await frame(p);
      assert.ok(await fits(p),theme+' horizontal overflow');await p.locator('#player-content details.ui-condition-breakdown').screenshot({path:path.join(artifacts,`breakdown-${width}-${theme}.png`)});}
    await p.evaluate(()=>{delete document.documentElement.dataset.theme;});
    assert.equal(await p.evaluate(()=>window.__injRisk.state()),before,'viewing and expanding leave S (and rngState) unchanged');
    // 2) the check: the judged value is the value that was shown; afterwards 判定済み with the judged breakdown.
    await home(p);await p.locator('#act button',{hasText:'シーズン半ばの健康診断'}).click();await frame(p);
    const card=await p.evaluate(()=>[...document.querySelectorAll('#log .card')].map(e=>e.textContent).reverse().find(t=>/健康の回復|軽傷|重傷|故障/.test(t))||'');
    const used=/故障率 (\d+)%/.exec(card);if(used){assert.equal(used[1]+'%',shown,'result card 故障率 equals the shown value');matched++;}
    await openPlayer(p);c=await conditionOf(p,'#player-content');
    assert.equal(riskOf(c),`判定済み（${shown}）`);assert.deepEqual(c.breakdown.at(-1),['結果',shown]);assert.match(c.note,/今季の判定は終了しました。内訳は判定時の値です。$/);
    assert.equal(await p.locator('#bd-risk').textContent(),shown,'header keeps judged risk after carry cleared');
    const checkedState=JSON.parse(await p.evaluate(()=>window.__injRisk.state()));assert.equal(checkedState.injNext,0,'the check reset injNext');
    // 3) year start before phasePre: the stale tmpInj counts as reset; 4) after phasePre it counts; 5) rehab season.
    await home(p);await p.evaluate(()=>{window.__injRisk.set({tmpInj:10,injNext:10,skipMid:false});window.__injRisk.newYear();});await openPlayer(p);c=await conditionOf(p,'#player-content');
    const tmpRow=c.breakdown.find(([l])=>l==='今季の一時加算');assert.deepEqual(tmpRow,['今季の一時加算','±0%（シーズン開始時にリセット）']);assert.ok(c.breakdown.some(([l,v])=>l==='国際大会出場による加算'&&v==='+10%'));
    const reset=Number(riskOf(c).replace('%',''));
    await home(p);await p.evaluate(()=>window.__injRisk.mark());await openPlayer(p);c=await conditionOf(p,'#player-content');
    assert.deepEqual(c.breakdown.find(([l])=>l==='今季の一時加算'),['今季の一時加算','+10%']);assert.equal(Number(riskOf(c).replace('%','')),Math.min(95,reset+10));
    await home(p);await p.evaluate(()=>window.__injRisk.set({skipMid:true}));await openPlayer(p);c=await conditionOf(p,'#player-content');
    assert.equal(riskOf(c),'今季は健康診断なし（リハビリ中）');assert.equal(c.details,0,'no breakdown without a check');assert.equal(await p.locator('#bd-risk').textContent(),'-','no-check header is an ASCII dash');
    await home(p);await p.evaluate(()=>{window.__injRisk.set({skipMid:false,rehab:1});window.__injRisk.newYear();});await openPlayer(p);c=await conditionOf(p,'#player-content');
    assert.equal(riskOf(c),'今季は健康診断なし（リハビリ中）','year start with a pending rehab');await home(p);await p.evaluate(()=>{window.__injRisk.set({rehab:0});window.__injRisk.mark();});
    await p.screenshot({path:path.join(artifacts,`player-${width}-rehab.png`),fullPage:true});
    // 6) desktop sidebar: same row; the breakdown and 潜在能力について keep their own open state across re-renders.
    if(width>=1100){
      await home(p);await p.evaluate(()=>window.__injRisk.set({skipMid:false}));await frame(p);
      c=await conditionOf(p,'#desktop-player');assert.ok(c,'sidebar コンディション');assert.equal(c.rows[1][0],'健康診断時の故障リスク');
      await p.locator('#desktop-player details.ui-condition-breakdown summary').click();
      const sidebarBefore=await p.evaluate(()=>window.__injRisk.state());
      await p.evaluate(()=>window.__injRisk.set({tmpInj:5}));await frame(p);
      let open=await p.evaluate(()=>[...document.querySelectorAll('#desktop-player details')].map(d=>[d.className||d.querySelector('summary').textContent,d.open]));
      assert.deepEqual(open,[['潜在能力について',false],['ui-condition-breakdown',true]],'re-render keeps the breakdown open, guide closed');
      await p.locator('#desktop-player details:not(.ui-condition-breakdown) summary').click();await p.locator('#desktop-player details.ui-condition-breakdown summary').click();
      await p.evaluate(()=>window.__injRisk.set({tmpInj:6}));await frame(p);
      open=await p.evaluate(()=>[...document.querySelectorAll('#desktop-player details')].map(d=>[d.className||d.querySelector('summary').textContent,d.open]));
      assert.deepEqual(open,[['潜在能力について',true],['ui-condition-breakdown',false]],'re-render keeps the guide open, breakdown closed');
      const after=JSON.parse(await p.evaluate(()=>window.__injRisk.state())),was=JSON.parse(sidebarBefore);was.tmpInj=6;assert.deepEqual(after,was,'only the hook-set tmpInj changed');
      await p.locator('#desktop-player').screenshot({path:path.join(artifacts,`sidebar-${width}.png`)});
    }
    // Target header layouts: P/IF, 50/100 actual caps, high salary and large text.
    await home(p);
    for(const cap of [50,100]){
      await p.evaluate(cap=>{const state=JSON.parse(window.__injRisk.state());window.__injRisk.set({stage:'PRO',currentSalary:1234567890000,traits:{...state.traits,rubber:cap===100},tj:cap+.04,rehab:0,skipMid:false,seasonFactor:1});window.__injRisk.newYear();window.__injRisk.mark();},cap);
      const original=await p.evaluate(()=>({state:window.__injRisk.state(),draws:window.__injRisk.draws()}));
      await openPlayer(p);const condition=await conditionOf(p,'#player-content');if(pos==='P')assert.equal(await p.locator('#bd-tj-gauge').textContent(),condition.rows.find(([label])=>label==='TJゲージ')[1],'same TJ source and precision');await home(p);
      for(const [w,h] of [[320,568],[390,844],[844,390]])for(const theme of THEMES)for(const font of ['medium','large']){
        await p.setViewportSize({width:w,height:h});await p.evaluate(v=>{document.documentElement.dataset.theme=v.theme;document.documentElement.dataset.fontSize=v.font;},{theme,font});await frame(p);
        const layout=await p.evaluate(()=>{const grid=document.getElementById('bd-grid'),cells=[...grid.children].filter(e=>getComputedStyle(e).display!=='none'),boxes=cells.map(e=>e.getBoundingClientRect());return{columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,count:cells.length,metrics:cells.map(e=>{const b=e.querySelector('b');return {text:b.textContent,font:getComputedStyle(b).fontSize,width:b.clientWidth,scroll:b.scrollWidth,cell:e.getBoundingClientRect().width};}),overflow:cells.some(e=>e.querySelector('b').scrollWidth>e.querySelector('b').clientWidth+1),labelOverflow:cells.some(e=>{const span=e.querySelector('span'),range=document.createRange();range.selectNodeContents(span);return range.getBoundingClientRect().width>e.clientWidth-parseFloat(getComputedStyle(e).paddingLeft)-parseFloat(getComputedStyle(e).paddingRight)+1;}),tops:boxes.map(r=>r.top),salary:document.getElementById('bd-sal').textContent,tjHidden:document.getElementById('bd-tj-gauge-cell').hidden,tj:document.getElementById('bd-tj-gauge').textContent};});
        assert.equal(layout.count,pos==='P'?4:3,JSON.stringify({pos,w,h,theme,font,layout}));assert.equal(layout.columns,layout.count);assert.equal(layout.overflow,false,JSON.stringify({pos,w,h,theme,font,layout}));assert.equal(layout.labelOverflow,false);assert.ok(layout.tops.every(y=>Math.abs(y-layout.tops[0])<1),'one metric row');assert.equal(layout.salary,'123,456,789');assert.equal(layout.tjHidden,pos!=='P');assert.equal(layout.tj,pos==='P'?cap.toFixed(1)+' / '+cap:'');
        if(w===320&&theme==='standard'&&font==='large')await p.screenshot({path:path.join(artifacts,'header-'+pos+'-cap-'+cap+'.png')});
      }
      assert.deepEqual(await p.evaluate(()=>({state:window.__injRisk.state(),draws:window.__injRisk.draws()})),original,'header/layout/condition reads preserve complete state and RNG consumption');
    }
    console.log(`${width}px ${pos}: forecast ${shown}, card ${used?used[0]:'injured (no rate on card)'}, year-start reset ${reset}%`);
    await ctx.close();
  }
  assert.ok(matched>=1,'at least one seed compared the result card 故障率 with the shown value');
  assert.deepEqual(errors,[]);console.log('Injury risk E2E passed; console / JS-CSS 404: 0. Screenshots: '+artifacts);
}catch(e){failure=e;console.error(e);}finally{server.closeAllConnections();server.close();server.unref();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
