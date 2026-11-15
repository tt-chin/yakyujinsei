// EVT-01 E3 (1.16.12): in a real browser career, キャリア → 年度別 shows a collapsed event row under each year that has
// events, and a trailing 今季（進行中） row for events of the season not yet in S.log. Each row lists every occurrence
// (no dedup by cardID) with the category saved in S.processedEventIDs. Checked at 1280 and 390 px (collapsed / expanded,
// no horizontal page overflow) and in all 4 themes. Screenshots go to the OS temp dir for review.
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
const hook=`\nwindow.__evtHist={state:()=>({done:!!S.done,year:S.year,logYears:(S.log||[]).map(r=>r.y),processed:JSON.parse(JSON.stringify(S.processedEventIDs||{})),names:Object.fromEntries(EVENTS.map(e=>[e.id,e.n])),abl:ABL,money:Object.fromEntries(Object.entries(S.processedEventIDs||{}).map(([k,r])=>[k,r.incomeYen?fmtMoney(r.incomeYen):null]))})};`;
const server=createServer(async(req,res)=>{
  try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(rel.includes('..'))throw Error('path');
    let content=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')content=content.toString()+hook;
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(e){res.statusCode=404;res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[],artifacts=path.join(os.tmpdir(),'yakyujinsei-event-history-e2e');await mkdir(artifacts,{recursive:true});
const wire=async(ctx,p)=>{await ctx.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({status:200,contentType:'text/css',body:''}));
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,seed,pos)=>{await p.goto(local+'/?seed='+seed);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#in-name').fill('履歴検証');await p.locator('#btn-start').click();};
const state=p=>p.evaluate(()=>window.__evtHist.state());
// One generic action (same selection as event-category-badge-e2e); stops before the end screen (S.done).
const step=p=>p.evaluate(()=>{const act=document.querySelector('#act');
  const rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
  const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|完了/.test(e.innerText))||buttons[0];if(!b)throw Error('No action');b.click();});
const until=async(p,cond,limit=3000)=>{for(let i=0;i<limit;i++){const s=await state(p);if(s.done)throw Error('career ended before condition');if(cond(s))return s;await step(p);await p.waitForTimeout(10);}throw Error('condition not reached');};
const openYearly=async p=>{await p.locator('[data-main-view="career"]').click();await p.locator('[data-career-tab="yearly"]').click();await p.locator('#career-content table').waitFor();};
const backHome=p=>p.locator('[data-main-view="home"]').click();
const rowsOf=p=>p.evaluate(()=>[...document.querySelectorAll('#career-content tbody tr')].map(tr=>tr.classList.contains('ui-yearly-events')?{events:true,summary:tr.querySelector('summary')?.textContent??tr.textContent,open:!!tr.querySelector('details')?.open,items:[...tr.querySelectorAll('li')].map(li=>({id:li.dataset.eventOccurrenceId,badge:li.querySelector('.event-badge')?.className??null,badgeText:li.querySelector('.event-badge')?.textContent??null,title:li.querySelector('strong')?.textContent,line:li.querySelector('p')?.textContent}))}:{year:Number(tr.cells[0].textContent)}));
// Expected rows from saved state: each S.log row, then (after the last row of a year) that year's events; then 今季.
const expected=s=>{const entries=Object.entries(s.processed).sort(([a,ra],[b,rb])=>ra.year-rb.year||Number(a.split(':')[1])-Number(b.split(':')[1]));
  const last=new Map();s.logYears.forEach((y,i)=>last.set(y,i));const out=[];
  s.logYears.forEach((y,i)=>{out.push({year:y});const items=last.get(y)===i?entries.filter(([,r])=>r.year===y):[];if(items.length)out.push({events:true,label:'',ids:items.map(([id])=>id)});});
  const cur=entries.filter(([,r])=>!last.has(r.year));if(cur.length)out.push({events:true,label:'今季（進行中） ',ids:cur.map(([id])=>id)});return out;};
const wired={ability:0,money:0};
const verify=(rows,s,tag)=>{const want=expected(s);
  assert.equal(rows.length,want.length,tag+' row count '+JSON.stringify(rows.map(r=>r.year??r.summary)));
  want.forEach((w,i)=>{const r=rows[i];if(!w.events){assert.equal(r.year,w.year,tag+' year row '+i);return;}
    assert.ok(r.events,tag+' events row '+i);assert.equal(r.summary,`${w.label}イベント（${w.ids.length}件）`,tag);assert.equal(r.open,false,tag+' collapsed by default');
    assert.deepEqual(r.items.map(x=>x.id),w.ids,tag+' every occurrence in order');
    r.items.forEach(x=>{const saved=s.processed[x.id];assert.equal(x.badge,'event-badge event-badge-'+saved.category,tag+' saved category');assert.equal(x.badgeText,LABELS[saved.category]);
      assert.equal(x.title,s.names[saved.cardID]);assert.ok(x.line.startsWith({bold:'勝負',norm:'通常',safe:'安全'}[saved.mode]+(saved.success?'成功':'失敗')),x.line);
      assert.ok(!/今季/.test(x.line),'history lines do not say 今季: '+x.line);
      // The presenter passes the game's ABL labels and fmtMoney (not the builder defaults).
      if(saved.abilityDelta){assert.ok(x.line.includes(s.abl[saved.target]+'：'),tag+' ability label: '+x.line);wired.ability++;}
      if(s.money[x.id]){assert.ok(x.line.includes('スポンサー収入：'+s.money[x.id]),tag+' income format: '+x.line);wired.money++;}});});
  return want.filter(w=>w.events).length;};
let failure;
try{
  for(const [width,height,seed,pos] of [[1280,800,'evt-hist-pc','IF'],[390,844,'evt-hist-sp','P']]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();await wire(ctx,p);await start(p,seed,pos);
    // 1) mid first season: only the 今季（進行中） row.
    let s=await until(p,s=>Object.keys(s.processed).length>=1&&s.logYears.length===0);
    await openYearly(p);verify(await rowsOf(p),s,width+' first season');await backHome(p);
    // 2) several seasons in: year rows with events, a same-card repeat if one happens, and the open toggle.
    s=await until(p,s=>s.logYears.length>=3&&Object.values(s.processed).some(r=>!s.logYears.includes(r.year)));
    await openYearly(p);const groups=verify(await rowsOf(p),s,width+' later');assert.ok(groups>=2,'at least two event rows');
    const first=p.locator('#career-content tr.ui-yearly-events summary').first();await first.click();
    assert.equal(await p.locator('#career-content tr.ui-yearly-events details').first().evaluate(d=>d.open),true,'expands');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),width+' no horizontal page overflow when expanded');
    const tableFits=await p.evaluate(()=>{const sc=document.querySelector('#career-content .ui-yearly-scroll'),body=document.querySelector('.ui-yearly-events-body');return {table:sc.scrollWidth,box:sc.clientWidth,body:body.getBoundingClientRect().width};});
    // The expanded list stays inside the visible scroll box, also after the wide table is scrolled to the right.
    for(const left of [0,10000]){const fit=await p.evaluate(x=>{const sc=document.querySelector('#career-content .ui-yearly-scroll');sc.scrollLeft=x;const box=sc.getBoundingClientRect(),body=document.querySelector('.ui-yearly-events-body').getBoundingClientRect();return {l:body.left-box.left,r:box.right-body.right,scroll:sc.scrollLeft};},left);
      assert.ok(fit.l>=-1&&fit.r>=-1,width+' event list inside the scroll box at scrollLeft '+fit.scroll+': '+JSON.stringify(fit));}
    await p.evaluate(()=>{document.querySelector('#career-content .ui-yearly-scroll').scrollLeft=0;});
    console.log(`${width}px ${pos}: logYears ${s.logYears.join(',')}; event rows ${groups}; table ${tableFits.table}/${tableFits.box}px, list ${Math.round(tableFits.body)}px`);
    await p.screenshot({path:path.join(artifacts,`yearly-${width}-open.png`),fullPage:true});
    for(const theme of THEMES){
      await p.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),theme+' horizontal overflow');
      await p.locator('#career-content tr.ui-yearly-events').first().screenshot({path:path.join(artifacts,`events-${width}-${theme}.png`)});
    }
    await first.click();assert.equal(await p.locator('#career-content tr.ui-yearly-events details').first().evaluate(d=>d.open),false,'collapses');
    await ctx.close();
  }
  assert.ok(wired.ability>0,'at least one ability effect checked: '+JSON.stringify(wired));
  // Unreadable records: real DOM, one イベント詳細記録なし row at the top of the table, no event rows.
  {const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage();await wire(ctx,p);await p.goto(local+'/');
    const missing=await p.evaluate(async()=>{const m=await import('/src/ui/career-event-history.js');const out={};
      for(const bad of [undefined,null,[],'x']){const h=m.buildEventHistory({processedEventIDs:bad},[{year:2031},{year:2032}],{});
        const tbody=document.createElement('tbody');for(const y of [2031,2032]){const tr=document.createElement('tr');tr.innerHTML='<td>'+y+'</td>';tbody.appendChild(tr);}
        m.appendYearEvents(tbody,h,0);m.appendYearEvents(tbody,h,1);m.appendYearEvents(tbody,h,'current');
        out[String(JSON.stringify(bad))]=[...tbody.rows].map(r=>r.classList.contains('ui-yearly-events')?'E:'+r.textContent+':'+r.cells[0].colSpan:'Y:'+r.textContent);}
      return out;});
    for(const [k,rows] of Object.entries(missing))assert.deepEqual(rows,['E:イベント詳細記録なし:4','Y:2031','Y:2032'],'missing records '+k);
    await ctx.close();}
  console.log('ability/income wiring checks: '+JSON.stringify(wired));
  assert.deepEqual(errors,[]);console.log('Event history E2E passed; console / JS-CSS 404: 0. Screenshots: '+artifacts);
}catch(e){failure=e;console.error(e);}finally{server.closeAllConnections();server.close();server.unref();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
