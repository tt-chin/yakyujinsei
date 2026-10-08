import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';

const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const baseline='ad5b778',cache=new Map(),errors=[];
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
// Hooks are served by this test only; no test accessors are shipped to Preview.
const hook=`window.__salaryHistoryTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0}),setHistory:h=>{S.salaryDecisionHistory=h;},populate:()=>{S.salaryDecisionHistory=[];for(let i=24;i>=0;i--)saveSalaryDecision('RENEWAL',{sourceLevel:'NPB2',targetLevel:'NPB2',sourceRating:0,convertedRating:0,baseSalary:5000000,contractMult:1,positionMult:1},0,5000000+i*10000,{salaryYear:2029+i});},continuation:()=>{S.stage='PRO';S.org='NPB';S.lv='NPB1';S.year=2032;S.pool=0;S.ct=createContract({contractId:'CONTINUATION',org:'NPB',teamId:S.orgTeamId,signedYear:2032,startYear:2032,years:3,annualSalary:16000000});S.currentSalary=16000000;S.lastSalaryPaidYear=null;movement=()=>{};phaseEnd();}};`;
const server=createServer(async(req,res)=>{try{
  const pathname=new URL(req.url,'http://localhost').pathname,old=pathname.startsWith('/baseline/');
  const rel=decodeURIComponent(pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';
  if(rel.includes('..'))throw Error('Invalid asset path');
  if(old&&!cache.has(rel))cache.set(rel,execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:20*1024*1024}));
  let content=old?cache.get(rel):await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js'){
    content=content.toString().replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;');
    const at=content.lastIndexOf('})();');content=content.slice(0,at)+hook+content.slice(at);
  }
  res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const shots=path.join(os.tmpdir(),'yakyujinsei-salary-history');await mkdir(shots,{recursive:true});
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,url,pos='P')=>{await p.goto(url);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();};
const action=()=>{
  const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));
  const buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
  const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];
  if(!b)throw Error('No career action');return b;
};
const openHistory=async p=>{await p.locator('[data-main-view="career"]').click();await p.locator('[data-career-tab="contract"]').click();return p.locator('#career-content .ui-panel').filter({has:p.locator('h2',{hasText:'契約・年俸決定履歴'})});};
const checkLayout=async(panel,p,width)=>{
  const items=panel.locator('li');assert.ok(await items.count()>10);assert.ok((await items.first().innerText()).startsWith('2029年'));
  assert.ok(await panel.evaluate(e=>{for(let p=e;p&&p!==document.body;p=p.parentElement){const s=getComputedStyle(p);if(/hidden|clip/.test(s.overflowY)&&p.scrollHeight>p.clientHeight+1)return false;}return true;}));
  await items.first().scrollIntoViewIfNeeded();assert.ok(await items.first().isVisible());
  await items.last().scrollIntoViewIfNeeded();assert.ok(await items.last().isVisible());
  assert.ok(await items.last().evaluate(e=>{const r=e.getBoundingClientRect();return r.top>=0&&r.bottom<=innerHeight;}));
  assert.ok(await p.evaluate(()=>document.scrollingElement.scrollTop>0));
  assert.ok(await panel.evaluate(e=>getComputedStyle(e).maxHeight==='none'&&e.scrollHeight<=e.clientHeight+1));
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await p.screenshot({path:path.join(shots,(arg('preview')?'preview-':'local-')+width+'.png')});
};
let failure;
try{
  if(!arg('preview')){
    for(const width of [1280,320,390]){
      const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();wire(p);await start(p,local+'/?seed=history-ui');
      await p.evaluate(()=>window.__salaryHistoryTest.populate());const before=await p.evaluate(()=>window.__salaryHistoryTest.get());
      assert.equal(before.state.salaryDecisionHistory.length,25);
      const panel=await openHistory(p);await checkLayout(panel,p,width);
      assert.equal(await panel.locator('li').count(),25);assert.deepEqual(await p.evaluate(()=>window.__salaryHistoryTest.get()),before);
      await p.locator('[data-main-view="home"]').click();await p.evaluate(()=>window.__salaryHistoryTest.continuation());
      const after=await p.evaluate(()=>window.__salaryHistoryTest.get());assert.deepEqual(after.state.salaryDecisionHistory,before.state.salaryDecisionHistory);assert.equal(after.calls,before.calls);
      await p.evaluate(()=>window.__salaryHistoryTest.setHistory(undefined));assert.equal(await (await openHistory(p)).locator('.ui-empty').innerText(),'記録なし');
      await p.locator('[data-main-view="home"]').click();await p.evaluate(h=>window.__salaryHistoryTest.setHistory(h),before.state.salaryDecisionHistory.slice(-10));
      assert.equal(await (await openHistory(p)).locator('li').count(),10);
      console.log(`UI ${width}: 25 entries, first/last visible, read-only/RNG=0, empty/old data, continuation creates no decision passed`);await ctx.close();
    }
    if(!process.argv.includes('--ui-only'))for(const [seed,pos] of [['yakyo-test-001','P'],['jp3-infielder-01','IF']]){
      const runs=[];
      for(const old of [true,false]){
        const p=await browser.newPage();wire(p);await start(p,local+(old?'/baseline/':'/')+'?seed='+seed,pos);const records=[];
        for(let i=0;i<2500;i++){
          const r=await p.evaluate(`(()=>{const h=window.__salaryHistoryTest.get(),state=h.state;delete state.salaryDecisionHistory;delete state.version;const record={state,rng:h.rng,calls:h.calls};if(state.done)return{record,done:true};const b=(${action.toString()})();record.action=b.innerText;b.click();return{record,done:false};})()`);
          records.push(createHash('sha256').update(JSON.stringify(r.record)).digest('hex'));if(r.done)break;if(i===2499)throw Error('Career not completed');
        }
        const final=await p.evaluate(()=>window.__salaryHistoryTest.get());runs.push({records,final});await p.close();
      }
      assert.deepEqual(runs[0].records,runs[1].records,seed+': non-history state/financial/RNG difference');
      const full=runs[1].final.state.salaryDecisionHistory,old=runs[0].final.state.salaryDecisionHistory;
      assert.deepEqual(full.slice(-10),old);if(full.length)assert.equal(full[0].salaryYear,2029);
      console.log(`${seed}/${pos}: ${runs[1].records.length} actions, RNG ${runs[1].final.calls}, ${full.length} decisions; all other state including statistics/income/contracts/log identical`);
    }
  }else{
    for(const width of [1280,320,390]){
      const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();wire(p);await start(p,arg('preview')+'/?seed=history-preview');
      await openHistory(p);
      // Explicit test fixture: use the deployed policy and renderer, without modifying game state.
      await p.evaluate(async()=>{
        const {appendSalaryDecision,buildSalaryDecision}=await import('./src/engine/salary-explanation-policy.js');
        const {renderCareer}=await import('./src/ui/player-detail.js');let history=[];
        for(let i=24;i>=0;i--)history=appendSalaryDecision(history,buildSalaryDecision({salaryYear:2029+i,decisionYear:2028+i,decisionType:'RENEWAL',finalSalary:5000000+i*10000}));
        renderCareer(document.querySelector('#career-content'),{contract:{description:'検証用契約',remainingYears:'—',guaranteedTotal:'—',schedule:[],history:history.map(d=>d.salaryYear+'年 '+(d.finalSalary/10000)+'万円')}},'contract');
      });
      const panel=p.locator('#career-content .ui-panel').filter({has:p.locator('h2',{hasText:'契約・年俸決定履歴'})});
      await checkLayout(panel,p,width);assert.equal(await panel.locator('li').count(),25);console.log(`Preview ${width}: deployed policy/renderer, 25-entry fixture, first year 2029, page scrolling passed`);await ctx.close();
    }
  }
  assert.deepEqual(errors,[]);console.log('Console/JavaScript-CSS404: 0; screenshots: '+shots);
}catch(e){failure=e;console.error(e.stack);}finally{server.closeAllConnections();server.close();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
