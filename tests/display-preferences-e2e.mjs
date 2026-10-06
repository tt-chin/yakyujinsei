// No project dependency: pass --playwright=<installed package directory> when needed.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';

const root=fileURLToPath(new URL('../',import.meta.url));
const modulePath=process.argv.find(v=>v.startsWith('--playwright='))?.slice(13);
const require=createRequire(import.meta.url),{chromium}=require(modulePath||'playwright');
const preview=process.argv.find(v=>v.startsWith('--preview='))?.slice(10);
const baselineRef=process.argv.find(v=>v.startsWith('--baseline='))?.slice(11)||'8dd244b';
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),baseline=url.pathname.startsWith('/baseline/');
    let relative=decodeURIComponent(url.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';
    if(relative.includes('..'))throw new Error('Unsafe path');
    let content=baseline?execFileSync('git',['show',`${baselineRef}:docs/${relative}`],{cwd:root,maxBuffer:20*1024*1024}):await readFile(path.join(root,'docs',relative));
    if(relative==='src/engine/game.js'){
      let script=content.toString().replace('function R(){','function R(){ window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){ window.__rngCalls=(window.__rngCalls||0)+1;');
      script+='\nwindow.__displayRegression=()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0,seed:SEED});';
      content=script;
    }
    res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript; charset=utf-8':relative.endsWith('.css')?'text/css; charset=utf-8':relative.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(error){console.log(`Fixture 404: ${req.url}: ${String(error)}`);res.statusCode=404;res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local=`http://127.0.0.1:${server.address().port}`,target=preview||local;
const channel=process.argv.find(v=>v.startsWith('--browser='))?.slice(10)||'chrome';
const browser=await chromium.launch({channel,headless:true});
const artifacts=path.join(os.tmpdir(),'yakyujinsei-v170-e2e');await mkdir(artifacts,{recursive:true});
let screenshots=0,combinations=0;
let failure=null;
const errors=[];
const wire=page=>{
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error'){errors.push(`${message.text()} ${message.location().url}`);console.log(`Console diagnostic: ${message.text()} ${message.location().url}`);}});
  page.on('response',response=>{if(response.status()>=400&&/\.(?:js|css)(?:\?|$)/.test(response.url()))errors.push(`${response.status()} ${response.url()}`);});
};
const fits=page=>page.evaluate(()=>({width:document.documentElement.scrollWidth,viewport:innerWidth,dialog:document.querySelector('#display-preferences')?.scrollWidth,dialogClient:document.querySelector('#display-preferences')?.clientWidth}));
const setPreferences=async(page,theme,fontSize,density)=>{
  await page.locator(`[name="theme"][value="${theme}"]`).check();
  await page.locator(`[name="fontSize"][value="${fontSize}"]`).check();
  await page.locator(`[name="density"][value="${density}"]`).check();
};
try{
  if(!process.argv.includes('--careers-only')){
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();wire(page);
  await page.goto(`${target}/?seed=display-settings-test`);await page.locator('#btn-start').waitFor();
  await page.locator('#in-name').fill('長い名前テスト');
  await page.locator('[data-open-preferences]').first().click();
  for(const theme of ['standard','night','classic','scoreboard'])for(const fontSize of ['small','medium','large'])for(const density of ['standard','compact']){
    await setPreferences(page,theme,fontSize,density);combinations++;
    for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[560,800],[1280,800]]){
      await page.setViewportSize({width,height});const size=await fits(page);assert.ok(size.width<=width,`${theme}/${fontSize}/${density} overflow ${JSON.stringify(size)}`);assert.ok(size.dialog<=size.dialogClient+1,'dialog overflow');
    }
    if([1,4,6,12,18,24].includes(combinations)){await page.setViewportSize({width:combinations%2?320:390,height:844});await page.screenshot({path:path.join(artifacts,`settings-${theme}-${fontSize}-${density}.png`)});screenshots++;}
  }
  await page.locator('#preferences-close').click();assert.equal(await page.locator('#in-name').inputValue(),'長い名前テスト');
  assert.equal(await page.evaluate(()=>document.activeElement.hasAttribute('data-open-preferences')),true);
  await page.reload();assert.equal(await page.locator('html').getAttribute('data-theme'),'scoreboard');
  await page.locator('#btn-start').click();await page.locator('#board-preferences').click();
  await page.locator('#preferences-close').focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.name),'theme');
  await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'preferences-close');
  await page.keyboard.press('Escape');assert.equal(await page.locator('#display-preferences').evaluate(el=>el.open),false);
  assert.equal(await page.evaluate(()=>document.activeElement.id),'board-preferences');
  const act=await page.locator('#act').evaluate(el=>el.innerHTML);
  await page.locator('#board-preferences').click();await page.locator('#preferences-reset').click();await page.locator('#preferences-close').click();
  assert.equal(await page.locator('#act').evaluate(el=>el.innerHTML),act);
  for(const tab of ['player','career','home']){await page.locator(`[data-main-view="${tab}"]`).click();await page.locator('#board-preferences').click();await setPreferences(page,'night','large','compact');await page.locator('#preferences-close').click();assert.equal(await page.locator(`[data-main-view="${tab}"]`).getAttribute('aria-current'),'page');}
  // Exercise retained training DOM/listeners after a touch-based setting change.
  for(let i=0;i<10&&await page.locator('#act .abrow').count()===0;i++)await page.locator('#act button:not(:disabled)').first().click();
  assert.ok(await page.locator('#act .abrow').count()>0,'training allocation reached');
  await page.locator('#act .abrow[aria-disabled="false"]').first().click();
  const trainingMarkup=await page.locator('#act').evaluate(el=>el.innerHTML);
  await page.locator('#board-preferences').click();await setPreferences(page,'classic','large','compact');await page.keyboard.press('Escape');
  assert.equal(await page.locator('#act').evaluate(el=>el.innerHTML),trainingMarkup,'training DOM was rebuilt');
  await page.locator('#act .abrow[aria-disabled="false"]').first().focus();await page.keyboard.press('Enter');
  assert.notEqual(await page.locator('#act').evaluate(el=>el.innerHTML),trainingMarkup,'retained row listener works');
  for(const theme of ['standard','night','classic','scoreboard'])for(const fontSize of ['small','medium','large'])for(const density of ['standard','compact']){
    await page.locator('#board-preferences').click();await setPreferences(page,theme,fontSize,density);await page.keyboard.press('Escape');
    for(const [view,tabs] of [['home',[]],['player',['ability','traits']],['career',['stats','achievements','contract','yearly']]]){
      await page.locator(`[data-main-view="${view}"]`).click();
      for(const tab of tabs.length?tabs:[null]){
        if(tab)await page.locator(`[data-${view}-tab="${tab}"]`).click();
        for(const [width,height] of [[320,568],[375,667],[390,844],[430,932],[560,800],[1280,800]]){
          await page.setViewportSize({width,height});const size=await fits(page);assert.ok(size.width<=width,`${view}/${tab}/${theme}/${fontSize}/${density}: ${JSON.stringify(size)}`);
        }
      }
    }
    await page.locator('#salary-detail-trigger').click();await page.locator('#salary-detail-panel').waitFor({state:'visible'});
    assert.ok((await fits(page)).width<=1280);await page.locator('#salary-detail-close').click();
  }
  await context.close();

  const blocked=await browser.newContext();await blocked.addInitScript(()=>{Object.defineProperty(window,'localStorage',{get(){throw new Error('storage disabled');}});});
  const bp=await blocked.newPage();wire(bp);await bp.goto(`${target}/?seed=storage-test`);await bp.locator('[data-open-preferences]').first().click();await bp.locator('[name="theme"][value="night"]').check();assert.equal(await bp.locator('#preferences-save-status').innerText(),'この端末には設定を保存できませんでした。');await bp.keyboard.press('Escape');await bp.locator('#btn-start').click();await bp.locator('#board').waitFor({state:'visible'});await blocked.close();
  const touch=await browser.newContext({viewport:{width:320,height:568},isMobile:true,hasTouch:true}),tp=await touch.newPage();wire(tp);
  await tp.goto(`${target}/?seed=touch-test`);await tp.locator('[data-open-preferences]').first().tap();await tp.locator('[name="theme"][value="scoreboard"]').tap();await tp.locator('[name="fontSize"][value="large"]').tap();await tp.locator('[name="density"][value="compact"]').tap();await tp.locator('#preferences-close').tap();await tp.locator('#btn-start').tap();await tp.locator('#board-preferences').tap();await tp.locator('#preferences-close').tap();assert.ok((await fits(tp)).width<=320);await tp.screenshot({path:path.join(artifacts,`touch-${channel}-320.png`)});await touch.close();
  }

  if(!preview&&!process.argv.includes('--skip-careers')){
    const cases=[['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-catcher-01','C'],['jp3-infielder-01','IF'],['jp3-outfielder-01','OF']];
    const onlySeed=process.argv.find(v=>v.startsWith('--only-seed='))?.slice(12);
    for(const [seed,pos] of cases.filter(([seed])=>!onlySeed||onlySeed===seed)){
      const snapshots=[];
      for(const variant of ['baseline','candidate']){
        const ctx=await browser.newContext({viewport:{width:390,height:844}}),p=await ctx.newPage();wire(p);
        await p.goto(`${local}/${variant==='baseline'?'baseline/':''}?seed=${seed}`);await p.locator('#btn-start').waitFor();await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#in-name').fill('回帰テスト');await p.locator('#btn-start').click();
        const records=[];
        for(let step=0;step<2000;step++){
          if(variant==='candidate'&&step%17===0){
            const before=await p.evaluate(()=>window.__displayRegression());
            await p.locator('#board-preferences').click();await setPreferences(p,['standard','night','classic','scoreboard'][step%4],['small','medium','large'][step%3],step%2?'compact':'standard');await p.keyboard.press('Escape');
            assert.deepEqual(await p.evaluate(()=>window.__displayRegression()),before,'preferences mutate game/RNG');
          }
          const result=await p.evaluate(()=>{
            const snapshot=window.__displayRegression();delete snapshot.state.version;
            const action=document.querySelector('#act');
            const state={...snapshot,text:document.querySelector('#log').innerText,choices:action.innerText};
            if(snapshot.state.done)return {state,done:true};
            const rows=[...action.querySelectorAll('.abrow')].filter(el=>el.getAttribute('aria-disabled')!=='true'&&!el.classList.contains('capped'));
            const buttons=[...action.querySelectorAll('button')].filter(el=>!el.disabled&&!/元に戻す|すべてリセット/.test(el.innerText));
            const button=rows[0]||buttons.find(el=>/配分を確定|配分完了|次へ|完了/.test(el.innerText))||buttons.find(el=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(el.innerText))||buttons[0];
            if(!button)throw new Error('No actionable choice');
            button.click();return {state,done:false};
          });
          records.push(result.state);
          if(result.done)break;
          if(step===1999)throw new Error(`Career did not finish: ${seed}`);
        }
        snapshots.push(records);await ctx.close();
      }
      assert.deepEqual(snapshots[1],snapshots[0],`${seed} gameplay/RNG differs`);
      const last=snapshots[0].at(-1);assert.ok(last.calls>0,'Actual game RNG must be instrumented');console.log(`Fixed career ${seed}/${pos}: ${snapshots[0].length} actions, RNG ${last.calls}, retirement ${last.state.year}, exact match`);
    }
  }
  console.log(`Console/HTTP errors: ${errors.length}`);
  if(errors.length)console.log(JSON.stringify(errors));
  assert.deepEqual(errors,[],'Console or JS/CSS HTTP errors');console.log(`Display E2E passed (${channel}): ${combinations?`${combinations} combinations × 6 viewports, ${screenshots} screenshots`:'six-seed career comparison'}. ${artifacts}`);
}catch(error){failure=error;console.error(error);}
finally{
  server.closeAllConnections();server.close();server.unref();
  // Bound cleanup of the test-owned Windows browser transport after assertions.
  await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
  process.exit(failure?1:0);
}
