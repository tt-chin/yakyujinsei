// No project dependency: pass --playwright=<installed package directory> when needed.
// GameView refactor guard (tasks/GAME_JS_OOP_REFACTOR_PLAN.md §2d.4): same seed/choices must give the same
// #log/#act/#board DOM, S and RNG count at every step as the fixed baseline. Allowed difference: none.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {findFirstDifference} from './support/first-difference.mjs';
import {instrumentRng} from './support/rng-instrument.mjs';
import {GAME_VIEW_HOOK,captureGameView} from './support/dom-snapshot.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const baselineRef=arg('baseline')||'1bc65dfc2b8ba226930b23dca85a03e678e91253';
// Harness self-check only: a DOM-only change on the candidate side (year header text) must FAIL.
const negativeControl=process.argv.includes('--negative-control');
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),baseline=url.pathname.startsWith('/baseline/');
    const relative=decodeURIComponent(url.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';
    if(relative.includes('..'))throw new Error('Unsafe path');
    let content=baseline?execFileSync('git',['show',`${baselineRef}:docs/${relative}`],{cwd:root,maxBuffer:20*1024*1024}):await readFile(path.join(root,'docs',relative));
    if(relative==='src/engine/game.js'){
      content=instrumentRng(content.toString(),'__rngCalls')+GAME_VIEW_HOOK;
      if(!baseline)content+='\nwindow.__expectIncomeDisplay=true;';
      if(negativeControl&&!baseline)content+='\nconst __negativeDivider=divider;divider=function(t){__negativeDivider(t+\' \');};';
    }
    res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript; charset=utf-8':relative.endsWith('.css')?'text/css; charset=utf-8':relative.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(error){res.statusCode=404;res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[];
function careerAction(balanced){const rows=[...document.querySelectorAll('#act .abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...document.querySelectorAll('#act button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));if(balanced)rows.sort((a,b)=>{const priority=x=>['vel','ctl','brk','con','pow','eye','spd'].includes(x.dataset.abilityKey)?0:1;return priority(a)-priority(b)||parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent);});return buttons.find(e=>e.innerText.trim().startsWith('通常投球'))||rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];}
// Plays one career; returns per-step digests, or the full snapshot at step stopAt.
async function career(variant,{seed,pos,balanced},viewport,stopAt=-1){
  const context=await browser.newContext({viewport}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(`${variant} ${seed}: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')errors.push(`${variant} ${seed}: ${message.text()}`);});
  try{
    await page.goto(`${local}/${variant==='baseline'?'baseline/':''}?seed=${seed}`);await page.locator('#btn-start').waitFor();
    await page.locator(`#seg-pos [data-v="${pos}"]`).click();await page.locator('#in-name').fill('画面回帰');await page.locator('#btn-start').click();
    return await page.evaluate(async({capture,action,balanced,stopAt})=>{
      const snap=new Function('return '+capture)(),choose=new Function('return '+action)(),steps=[];
      for(let step=0;step<2500;step++){
        const s=await snap(step===stopAt);
        if(step===stopAt)return {full:s};
        steps.push(s);if(s.done)return {steps};
        const b=choose(balanced);if(!b)throw Error('No actionable choice at step '+step);b.click();
      }
      throw Error('CAREER_LIMIT');
    },{capture:captureGameView.toString(),action:careerAction.toString(),balanced,stopAt});
  }finally{await context.close();}
}
const cases=[
  {seed:'yakyo-test-001',pos:'P',balanced:false},{seed:'jp3-pitcher-02',pos:'P',balanced:true},
  {seed:'jp3-infielder-01',pos:'IF',balanced:false},{seed:'jp3-outfielder-01',pos:'OF',balanced:true},
];
const viewports=[{width:1280,height:800},{width:390,height:844}];
let failure=null;
try{
  for(const viewport of viewports)for(const c of cases){
    const label=`${c.seed}/${c.pos}/${c.balanced?'balanced':'first-row'}/${viewport.width}`;
    const [base,head]=[await career('baseline',c,viewport),await career('candidate',c,viewport)];
    const step=base.steps.findIndex((s,i)=>s.digest!==head.steps[i]?.digest);
    if(step>=0||base.steps.length!==head.steps.length){
      const at=step>=0?step:Math.min(base.steps.length,head.steps.length);
      const [b,h]=[await career('baseline',c,viewport,at),await career('candidate',c,viewport,at)];
      const d=findFirstDifference(h.full,b.full);
      // outerHTML strings are long; show the region around the first differing character.
      const near=(x,y)=>{if(typeof x!=='string'||typeof y!=='string')return [x,y].map(v=>JSON.stringify(v)?.slice(0,300));let i=0;while(x[i]===y[i])i++;return [x,y].map(v=>JSON.stringify(v.slice(Math.max(0,i-80),i+160)));};
      assert.fail(`${label} differs from ${baselineRef} at step ${at} (year ${base.steps[at]?.year}) ${d?d.path+': '+near(d.before,d.after).join(' -> '):'(length only)'}`);
    }
    const last=base.steps.at(-1);assert.ok(last.calls>0,'Actual game RNG must be instrumented');
    console.log(`PASS ${label}: ${base.steps.length} steps, RNG ${last.calls}, retirement ${last.year}, DOM/S/RNG identical`);
  }
  assert.deepEqual(errors,[],'Console or page errors');
  console.log(`GameView DOM E2E passed: ${cases.length*viewports.length} careers vs ${baselineRef}`);
}catch(error){failure=error;console.error(error);}
finally{
  server.closeAllConnections();server.close();server.unref();
  await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
  process.exit(failure?1:0);
}
