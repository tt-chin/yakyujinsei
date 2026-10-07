import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const hook=`\nwindow.__eventTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0}),set:v=>Object.assign(S,v),sim:lv=>simSeason(lv),card:(id,mode,good)=>{const ev=EVENTS.find(e=>e.id===id);const p=beginEvent(S,ev);const opts={chance:()=>{R();return good;},pick,abilityKeys:POS_AB[S.pos],occurrenceID:p.eventOccurrenceID};const first=applyEvent(S,ev,mode,opts);renderEventResult(ev,first.result);const saved=JSON.stringify(S),calls=window.__rngCalls;const duplicate=applyEvent(S,ev,mode,opts);if(duplicate.applied||JSON.stringify(S)!==saved||window.__rngCalls!==calls)throw Error('Duplicate event mutated state');return first.result;},preview:id=>EVENT_MODES.map(m=>eventChoiceSummary(EVENTS.find(e=>e.id===id),m)),draw:()=>drawEvents(S.stage==='PRO'?3:2,()=>{}),reset:()=>resetEventYear(S),share:()=>{const out=document.createElement('div');document.body.appendChild(out);shareImage([],out);return out.querySelector('img').src;}};`;
const server=createServer(async(req,res)=>{
  try{const u=new URL(req.url,'http://localhost'),baseline=u.pathname.startsWith('/baseline/'),rel=decodeURIComponent(u.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('path');
    let content=baseline?execFileSync('git',['show',`93ad2c7:docs/${rel}`],{cwd:root,maxBuffer:20*1024*1024}):await readFile(path.join(root,'docs',rel));
    if(rel==='src/engine/game.js'){content=content.toString().replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;')+(baseline?`\nwindow.__eventTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0}),set:v=>Object.assign(S,v),sim:lv=>simSeason(lv)};`:hook);}
    res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(e){res.statusCode=404;res.end(String(e));}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}`,target=arg('preview')||local;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[],artifacts=path.join(os.tmpdir(),'yakyujinsei-event-e2e');await mkdir(artifacts,{recursive:true});
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,url,pos='P')=>{await p.goto(url);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#in-name').fill('イベント検証');await p.locator('#btn-start').click();};
let failure;
try{
  if(!arg('preview')){
    const ctx=await browser.newContext(),p=await ctx.newPage();wire(p);await start(p,local+'/?seed=event-fixture');
    // All 552 branches through actual browser state/DOM integration; repeated resolution is inert.
    const results=await p.evaluate(async()=>{const {EVENT_CATALOG:d}=await import('/src/data/event-cards-jp.js');let count=0;
      for(const e of d.events)for(const mode of ['bold','norm','safe'])for(const success of [true,false]){
        const pos=e.eligibility.role==='P'?'P':e.eligibility.role==='C'?'C':'IF',stage=e.eligibility.stages[0],lv=e.eligibility.levels[0],org=e.eligibility.orgs[0];
        window.__eventTest.set({pos,stage,lv,org,age:23,traits:{},ab:{vel:50,ctl:50,brk:50,sta:50,con:50,pow:50,eye:50,spd:50,rng:50,fld:50,arm:50,cat:50},pot:{vel:80,ctl:80,brk:80,sta:80,con:80,pow:80,eye:80,spd:80,rng:80,fld:80,arm:80,cat:80},carry:{},pendStat:0});
        const before=window.__eventTest.get();window.__eventTest.preview(e.id);const after=window.__eventTest.get();if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Preview mutated state/RNG');
        const result=window.__eventTest.card(e.id,mode,success),last=document.querySelector('[data-event-occurrence-id="'+result.eventOccurrenceID+'"]');if(!last||!last.innerText.includes(e.choices[mode][success?'good':'bad']))throw Error('Missing result text');count++;
      }return count;});assert.equal(results,552);console.log('552 event branches: DOM/copy/duplicate/payment/preview RNG passed');
    const incomeBefore=await p.evaluate(()=>window.__eventTest.get());
    assert.match(await p.evaluate(()=>window.__eventTest.share()),/^data:image\/png;base64,/);
    assert.deepEqual(await p.evaluate(()=>window.__eventTest.get()),incomeBefore,'share must not mutate income/RNG');
    await ctx.close();
    // Non-event simulation unchanged: both versions get the same state and actual RNG.
    for(const pos of ['P','C','IF','OF']){
      const results=[];
      for(const base of [local+'/baseline/',local+'/']){const c=await browser.newContext(),q=await c.newPage();wire(q);await start(q,base+'?seed=event-isolation',pos);
        results.push(await q.evaluate(()=>{window.__eventTest.set({ab:{vel:52,ctl:52,brk:52,sta:50,con:52,pow:52,eye:52,spd:52,rng:52,fld:52,arm:52,cat:52},traits:{},role:'SP',seasonFactor:1,dpos:null});return {st:window.__eventTest.sim('NPB1'),rng:window.__eventTest.get().rng,calls:window.__eventTest.get().calls};}));await c.close();}
      assert.deepEqual(results[1],results[0],pos+' non-event season changed');
    }console.log('P/C/IF/OF non-event simulation/RNG identical to v1.7.0');
  }
  for(const [width,height] of [[1280,800],[320,568],[390,844]]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();wire(p);await start(p,target+'/?seed=event-mobile','IF');
    for(let i=0;i<100;i++){
      const status=await p.evaluate(()=>{const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));if(act.innerText.includes('成功率')&&act.innerText.includes('育成点'))return 'event';const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|完了/.test(e.innerText))||buttons[0];if(!b)throw Error('No action');b.click();return 'next';});if(status==='event')break;if(i===99)throw Error('No event found');
    }
    assert.ok(await p.locator('#act').innerText());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');await p.screenshot({path:path.join(artifacts,`event-${width}.png`)});
    // Keep a stale button and dispatch twice: the generation lock must execute only once.
    await p.evaluate(()=>{const b=document.querySelector('#act button');b.click();b.click();});assert.equal(await p.locator('[data-event-occurrence-id]').count(),1);
    await p.locator('[data-main-view="career"]').click();await p.locator('[data-career-tab="contract"]').click();assert.match(await p.locator('#career-content').innerText(),/スポンサー収入累計/);
    await p.locator('#salary-detail-trigger').click();assert.match(await p.locator('#salary-detail-body').innerText(),/所得内訳/);await p.locator('#salary-detail-close').click();
    await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();await ctx.close();
  }console.log('PC/320px/390px event + stale double click + income navigation passed');
  if(!arg('preview')&&!process.argv.includes('--quick'))for(const [seed,pos] of [['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-catcher-01','C'],['jp3-infielder-01','IF'],['jp3-outfielder-01','OF']]){
    const histories=[];
    for(let run=0;run<2;run++){
      const ctx=await browser.newContext(),p=await ctx.newPage();wire(p);await start(p,local+'/?seed='+seed,pos);const records=[];
      for(let step=0;step<2000;step++){
        const r=await p.evaluate(()=>{const snapshot=window.__eventTest.get(),act=document.querySelector('#act');const record={...snapshot,choices:act.innerText,log:document.querySelector('#log').innerText};if(snapshot.state.done)return {done:true,record};const rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)throw Error('No choice');b.click();return {done:false,record};});records.push(r.record);if(r.done)break;if(step===1999)throw Error('Career not complete');
      }
      const before=await p.evaluate(()=>window.__eventTest.get());
      await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor();
      assert.deepEqual(await p.evaluate(()=>window.__eventTest.get()),before,'retirement/share changes state or RNG');
      assert.match(await p.locator('#log').innerText(),/スポンサー収入累計/);
      histories.push(records);await ctx.close();
    }
    assert.deepEqual(histories[0],histories[1],seed+' replay differs');const last=histories[0].at(-1);assert.ok(last.state.done);console.log(`${seed}/${pos}: ${histories[0].length} actions, RNG ${last.calls}, retirement ${last.state.year}, exact replay`);
  }
  assert.deepEqual(errors,[]);console.log('Event E2E passed; console / JS-CSS 404: 0. Screenshots: '+artifacts);
}catch(e){failure=e;console.error(e);}finally{server.closeAllConnections();server.close();server.unref();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
