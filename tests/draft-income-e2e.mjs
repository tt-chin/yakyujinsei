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
const hook=`
window.__eventTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0}),set:v=>Object.assign(S,v),draft:()=>{const saved=R;R=()=>{saved();return .5;};try{runDraft(false,()=>{});}finally{R=saved;}}};`;
const server=createServer(async(req,res)=>{
  try{const u=new URL(req.url,'http://localhost'),baseline=u.pathname.startsWith('/baseline/'),rel=decodeURIComponent(u.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('path');
    let content=baseline?execFileSync('git',['show',`7acb456:docs/${rel}`],{cwd:root,maxBuffer:20*1024*1024}):await readFile(path.join(root,'docs',rel));
    if(rel==='src/engine/game.js'){content=content.toString().replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;')+hook;}
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
  for(const width of [1280,320,390]){
    const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();wire(p);await start(p,target+'/?seed=bonus-ui');if(width===320)await p.evaluate(()=>document.documentElement.dataset.theme='night');
    if(!arg('preview'))for(const development of [false,true]){
      await p.evaluate(dev=>{const h=window.__eventTest;h.set({age:35,traits:{},ab:{vel:dev?39:48,ctl:dev?39:48,brk:dev?39:48,sta:dev?39:48},careerEarnings:0,careerSigningBonus:0,careerBaseSalary:0,careerIncentive:0,careerBuyout:0,careerOutsideIncome:0,yearOutsideIncome:0,corpIncome:0});h.draft(dev);},development);
      await p.locator('#act button').filter({hasText:'指名を受けて入団'}).click();
      const before=await p.evaluate(()=>window.__eventTest.get());assert.equal(before.state.ct.signingBonus,before.state.careerSigningBonus);assert.equal(before.state.careerEarnings,before.state.careerSigningBonus);assert.equal(before.state.careerBaseSalary,0);assert.equal(before.state.ct.contractType,development?'DEVELOPMENT':'CONTROL');
      for(let repeat=0;repeat<2;repeat++){await p.locator('#salary-detail-trigger').click();const t=await p.locator('#salary-detail-body').innerText();for(const label of ['契約金','保証年俸総額','未払い年俸','固定年俸累計','出来高累計','買い取り累計','所得内訳'])assert.ok(t.includes(label),label);assert.doesNotMatch(t,/未払い保証額|保証総額/);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('.salary-detail-dialog').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:path.join(artifacts,'draft-'+width+'-'+development+'.png')});await p.locator('#salary-detail-close').click();}
      assert.deepEqual(await p.evaluate(()=>window.__eventTest.get()),before,'viewing detail changes state/RNG');
    }
    if(arg('preview')){
      for(let step=0;step<700;step++){
        const found=await p.evaluate(()=>{if(document.querySelector('#log').innerText.includes('新人年俸'))return true;const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)throw Error('No draft choice');b.click();return false;});if(found)break;if(step===699)throw Error('No draft signing');
      }
      await p.locator('#salary-detail-trigger').click();const t=await p.locator('#salary-detail-body').innerText();for(const label of ['契約金','契約金累計','保証年俸総額','未払い年俸','所得内訳','買い取り累計'])assert.ok(t.includes(label));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(artifacts,'preview-draft-'+width+'.png')});await p.locator('#salary-detail-close').click();
    }
    await ctx.close();
  }console.log('PC/320/390px draft + development, income detail and display RNG checks passed');
  if(!arg('preview')&&!process.argv.includes('--quick'))for(const [seed,pos] of [['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-catcher-01','C'],['jp3-infielder-01','IF'],['jp3-outfielder-01','OF']]){
    const histories=[];
    for(let run=0;run<2;run++){
      const ctx=await browser.newContext(),p=await ctx.newPage();wire(p);await start(p,local+(run===0?'/baseline/':'/')+'?seed='+seed,pos);const records=[];
      for(let step=0;step<2000;step++){
        const r=await p.evaluate(()=>{const snapshot=window.__eventTest.get(),act=document.querySelector('#act');const record={...snapshot,choices:act.innerText.replaceAll('保証年俸総額','保証総額').replaceAll('合計保証年俸総額','合計保証額')};delete record.state.version;if(record.state.ct)delete record.state.ct.signingBonus;if(snapshot.state.done)return {done:true,record};const rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)throw Error('No choice');b.click();return {done:false,record};});records.push(r.record);if(r.done)break;if(step===1999)throw Error('Career not complete');
      }
      const before=await p.evaluate(()=>window.__eventTest.get());
      await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor();
      assert.deepEqual(await p.evaluate(()=>window.__eventTest.get()),before,'retirement/share changes state or RNG');
      assert.match(await p.locator('#log').innerText(),/スポンサー収入累計/);
      histories.push(records);await ctx.close();
    }
    assert.deepEqual(histories[0],histories[1],seed+' v1.8.0 game/RNG differs');const last=histories[0].at(-1);assert.ok(last.state.done);console.log(`${seed}/${pos}: ${histories[0].length} actions, RNG ${last.calls}, retirement ${last.state.year}, v1.8.0 state and RNG identical`);
  }
  assert.deepEqual(errors,[]);console.log('Draft E2E passed; console / JS-CSS 404: 0. Screenshots: '+artifacts);
}catch(e){failure=e;console.error(e);}finally{server.closeAllConnections();server.close();server.unref();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}

