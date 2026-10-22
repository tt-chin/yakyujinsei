import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {instrumentRng} from './support/rng-instrument.mjs';
import {withCareerSessionAccess} from './support/career-session-access.mjs';
import {injectOverlayHook} from './support/overlay-hook.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
function instrument(source){
 const actionAnchor=source.includes('action:()=>invokeAnnualChoice(view,o.f),')?'action:()=>invokeAnnualChoice(view,o.f),':source.includes('action:()=>invokeChoiceAction(o.f),')?'action:()=>invokeChoiceAction(o.f),':'action:o.f,';
 assert.ok(source.includes(actionAnchor),'choice observer anchor');
 const invoke=actionAnchor==='action:o.f,'?'o.f()':actionAnchor.includes('invokeAnnualChoice')?'invokeAnnualChoice(view,o.f)':'invokeChoiceAction(o.f)';
 source=instrumentRng(source,'__calls').replace('function card(cls,title,html){','function card(cls,title,html){window.__cardCalls=(window.__cardCalls||0)+1;(window.__cardHTML??=[]).push({cls,title,html});').replace(actionAnchor,`action:()=>{window.__actionCalls=(window.__actionCalls||0)+1;return ${invoke};},`);
 source=withCareerSessionAccess(source);
 return injectOverlayHook(source,`const auditSignTo=signTo;signTo=function(...args){const calls=window.__calls||0,rng=_s;try{return auditSignTo(...args);}finally{window.__signAudit={beforeCalls:calls,afterCalls:window.__calls||0,beforeRng:rng,afterRng:_s};}};window.__actAudit={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__calls||0,actions:window.__actionCalls||0,sign:window.__signAudit||null,generation:__cs.choiceGeneration,token:__cs.activeChoiceToken?.generation,running:__cs.activeChoiceToken?.running,dom:document.querySelector('#act').outerHTML,cards:window.__cardCalls||0}),draft:(from,development=false)=>{actClear();S=newState('入団検証',S.pos);Object.assign(S,{age:from==='HS'?18:22,year:2032,stage:from,lv:from,stageYr:from==='HS'?3:4,entryRoute:from,seasonFactor:1});Object.keys(S.ab).forEach(k=>S.ab[k]=development?(from==='HS'?31:39):60);enterDraftPath(from);}};`);
}
const server=createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';if(rel.includes('..'))throw Error('path');let body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':'text/html');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const target=arg('preview')||`http://127.0.0.1:${server.address().port}`;
const output=path.join(os.tmpdir(),'yakyujinsei-act-audit',arg('diagnostic-seed')?'diagnostic':arg('preview')?'preview':'local');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||'chrome',headless:true});
const errors=[],results=[],checks=[],fixtureControls=new Map(),started=Date.now();let failure;
async function page(width,seed,pos){
 const p=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});
 await p.addInitScript(()=>document.addEventListener('click',e=>{const b=e.target.closest?.('#act button');if(b?.innerText.includes('指名を受けて入団'))window.__lastAcceptance=b.onclick;},true));
 if(arg('preview'))await p.route('**/src/engine/game.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:instrument(await r.text())});});
 await p.goto(target+'/?seed='+seed);await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();return p;
}
// Same deterministic first-row/balanced priorities as the existing career suite.
function select(balanced){const a=document.querySelector('#act'),rows=[...a.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...a.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));if(balanced)rows.sort((a,b)=>{const rank=x=>['vel','ctl','brk','con','pow','eye','spd'].includes(x.dataset.abilityKey)?0:1;return rank(a)-rank(b)||parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent);});return rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];}
async function career(seed,pos,balanced,width){
 const p=await page(width,seed,pos);
 const run=await p.evaluate(({code,balanced})=>{
  const select=eval('('+code+')'),trace=[];
  for(let i=0;i<2500;i++){
   const before=window.__actAudit.get();if(before.state.done)return{trace,final:before};
   const b=select(balanced);if(!b)throw Error('NO_ACTION '+before.state.year);
   const label=b.innerText,handler=b.onclick;b.click();const after=window.__actAudit.get();
   if(/今季の成績を見る|指名を受けて入団/.test(label)){
    if(after.actions!==before.actions+1)throw Error('ACTION_NOT_ONCE');
    handler();handler();if(JSON.stringify(window.__actAudit.get())!==JSON.stringify(after))throw Error('STALE_RESULT_OR_SIGNING_EXECUTED');
   }
   const newCards=(window.__cardHTML||[]).slice(before.cards);
   trace.push({label,before,after,newCards});
   if(label.includes('今季の成績を見る')&&(after.cards<=before.cards||!document.querySelector('#act button,#act .abrow')))throw Error('RESULT_OR_NEXT_MISSING '+before.state.year);
   if(label.includes('指名を受けて入団')&&(!after.state.ct||!document.querySelector('#act button,#act .abrow')))throw Error('DRAFT_NEXT_MISSING');
  }
  throw Error('CAREER_LIMIT');
 },{code:select.toString(),balanced});
 assert.equal(run.final.state.done,true);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 await p.screenshot({path:path.join(output,`${seed}-${pos}-${balanced}-${width}.png`)});await p.close();
 await writeFile(path.join(output,`${seed}-${pos}-${balanced}-${width}.json`),JSON.stringify(run));
 const summary={seed,pos,balanced,width,actions:run.trace.length,results:run.trace.filter(t=>t.label.includes('今季の成績を見る')).length,drafts:run.trace.filter(t=>t.label.includes('指名を受けて入団')).length,rng:run.final.calls,year:run.final.state.year};results.push(summary);console.log('PASS career '+JSON.stringify(summary));return run;
}
try{
 console.log('HEAD '+sha+' Chrome '+browser.version()+' target '+target);
 if(arg('preview')){const p=await browser.newPage();await p.goto(target);const files=execFileSync('git',['ls-files','docs'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(html|js|css)$/.test(f));for(const f of files){const actual=await p.evaluate(async rel=>(await fetch('./'+rel,{cache:'no-store'})).text(),f.slice(5));assert.equal(actual.replace(/\r\n/g,'\n'),(await readFile(path.join(root,f),'utf8')).replace(/\r\n/g,'\n'),f);}await p.close();console.log('PASS latest Preview assets '+files.length);}
 if(!arg('diagnostic-seed'))for(const width of [1280,320,390])for(const pos of ['P','IF'])for(const from of ['HS','U','CORP','IND'])for(const development of [false,true]){
  const seed='act-signing-'+from+(development?'-dev':'')+(development&&from==='CORP'&&pos==='IF'?'-1':'');
  const p=await page(width,seed,pos);await p.evaluate(({from,development})=>window.__actAudit.draft(from,development),{from,development});const before=await p.evaluate(()=>window.__actAudit.get());
  console.log('DRAFT fixture '+JSON.stringify({seed,pos,from,development,width,type:before.state.draftRights?.type,dom:before.dom}));
  assert.equal(before.state.draftRights?.type,development?'DEVELOPMENT':'ROSTER','fixture must generate intended native draft offer');
  const button=p.locator('#act button').filter({hasText:'指名を受けて入団'});assert.ok(await button.isVisible());await button.click();const after=await p.evaluate(()=>window.__actAudit.get());assert.equal(after.state.stage,'PRO');assert.ok(after.state.ct);assert.equal(after.state.ct.contractType,development?'DEVELOPMENT':'CONTROL');assert.equal(after.state.contractSequence,before.state.contractSequence+1);assert.equal(after.actions,before.actions+1);assert.equal(after.sign.afterCalls,after.sign.beforeCalls,'signTo RNG0; subsequent phasePre may roll training dice');assert.equal(after.sign.afterRng,after.sign.beforeRng);assert.equal(after.state.year,before.state.year+1);assert.ok(after.cards>before.cards);assert.ok(await p.locator('#act button,#act .abrow').count());
  // A queued callback from the now-detached acceptance choice must be inert.
  await p.evaluate(()=>{if(typeof window.__lastAcceptance!=='function')throw Error('ACCEPT_HANDLER_NOT_CAPTURED');window.__lastAcceptance();window.__lastAcceptance();});
  assert.deepEqual(await p.evaluate(()=>window.__actAudit.get()),after);
  // Navigation must preserve exact nodes/listeners and all game state/RNG.
  await p.evaluate(()=>{window.__held=[...document.querySelector('#act').children];window.__heldHandlers=window.__held.map(n=>n.onclick);});
  for(const tab of ['player','career','home'])await p.locator('[data-main-view="'+tab+'"]').click();
  assert.equal(await p.evaluate(()=>window.__held.every((n,i)=>n.isConnected&&n.onclick===window.__heldHandlers[i])),true);assert.deepEqual(await p.evaluate(()=>window.__actAudit.get()),after);
  // Two synchronous clicks on a retained next-choice element simulate rapid input.
  const nextBefore=await p.evaluate(()=>window.__actAudit.get());const next=await p.evaluate(code=>{const b=eval('('+code+')')(false);if(!b)throw Error('NO_NEXT');window.__nextChoice=b;return{label:b.innerText,kind:b.matches('.abrow')?'.abrow':'button',index:[...document.querySelectorAll('#act '+(b.matches('.abrow')?'.abrow':'button'))].indexOf(b),listener:typeof b.onclick==='function'};},select.toString());assert.ok(next.listener);const nextLocator=p.locator('#act '+next.kind).nth(next.index);assert.ok(await nextLocator.isVisible());assert.ok(await nextLocator.isEnabled());await nextLocator.click();const nextAfter=await p.evaluate(()=>window.__actAudit.get());assert.equal(nextAfter.actions,nextBefore.actions+1);await p.evaluate(()=>{window.__nextChoice.click();window.__nextChoice.onclick();});assert.deepEqual(await p.evaluate(()=>window.__actAudit.get()),nextAfter,'rapid/stale next action inert');assert.notDeepEqual(nextAfter,nextBefore);assert.equal(nextAfter.state.contractSequence,after.state.contractSequence);for(const key of ['careerSigningBonus','careerDevelopmentStipend','careerBaseSalary','careerEarnings'])assert.equal(nextAfter.state[key],after.state[key],key+' not paid again');assert.ok(await p.locator('#act button,#act .abrow').count());assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  const continuation=await p.evaluate(({code,year})=>{const select=eval('('+code+')'),history=[];for(let i=0;i<300;i++){const h=window.__actAudit.get();if(h.state.done||h.state.year>year)return{history,final:h};const b=select(false);if(!b)throw Error('DRAFT_CONTINUATION_EMPTY');history.push({label:b.innerText,year:h.state.year,rng:h.rng,calls:h.calls});b.click();}throw Error('DRAFT_CONTINUATION_LIMIT');},{code:select.toString(),year:after.state.year});assert.ok(continuation.final.state.log.length>after.state.log.length,'first professional season completed');assert.ok(continuation.final.state.done||continuation.final.state.year===after.state.year+1,'next annual boundary reached');assert.ok(await p.locator('#act button,#act .abrow').count());
  const control={before,after,next,nextBefore,nextAfter,continuation},key=from+'/'+pos+'/'+development;if(width===1280)fixtureControls.set(key,control);else assert.deepEqual(control,fixtureControls.get(key),'exact fixture S/history/DOM/RNG across widths');
  await p.screenshot({path:path.join(output,`draft-${from}-${pos}-${width}-${development}.png`)});await writeFile(path.join(output,`draft-${from}-${pos}-${width}-${development}.json`),JSON.stringify({seed,pos,from,development,width,...control}));checks.push({bug:'ACT-02',seed,pos,from,development,width,status:'PASS',nextLabel:next.label,acceptanceRng:after.calls-before.calls,actions:nextAfter.actions-before.actions,continuedYear:continuation.final.state.year});await p.close();console.log(`PASS draft ${from}/${pos}/${width}/${development?'DEVELOPMENT':'CONTROL'} contract/result/next/pointer/listener/single-action/next-year`);
 }
 if(arg('diagnostic-seed'))await career(arg('diagnostic-seed'),'P',false,1280);
 if(!arg('diagnostic-seed'))for(const width of [1280,320,390])for(const [seed,pos]of [['k55l221a','P'],['oscuxs1w','IF']]){
  const p=await page(width,seed,pos);let checked=false;const history=[];
  for(let i=0;i<150;i++){
   const meta=await p.evaluate(code=>{const b=eval('('+code+')')(false);if(!b)throw Error('NO_ACTION');const kind=b.matches('.abrow')?'.abrow':'button';return{kind,index:[...document.querySelectorAll('#act '+kind)].indexOf(b),label:b.innerText,before:window.__actAudit.get()};},select.toString());
   history.push({label:meta.label,kind:meta.kind,index:meta.index});const action=p.locator('#act '+meta.kind).nth(meta.index);if(meta.label.includes('今季の成績を見る'))await action.evaluate(b=>{window.__resultChoice=b;window.__resultHandler=b.onclick;});await action.click();
   if(meta.label.includes('今季の成績を見る')){const after=await p.evaluate(()=>window.__actAudit.get());assert.equal(after.actions,meta.before.actions+1);assert.ok(after.cards>meta.before.cards);assert.equal(after.state.log.length,meta.before.state.log.length+1);assert.ok(await p.locator('#act button,#act .abrow').count());await p.evaluate(()=>{window.__resultChoice.click();window.__resultHandler();window.__resultHandler();});assert.deepEqual(await p.evaluate(()=>window.__actAudit.get()),after,'rapid result click/callback must not repeat S/history/RNG');for(const tab of ['career','player','home'])await p.locator('[data-main-view="'+tab+'"]').click();assert.deepEqual(await p.evaluate(()=>window.__actAudit.get()),after,'return/viewing must not change state/history/RNG');
    const nextMeta=await p.evaluate(code=>{const b=eval('('+code+')')(false);if(!b)throw Error('NO_RESULT_NEXT');const kind=b.matches('.abrow')?'.abrow':'button';return{kind,index:[...document.querySelectorAll('#act '+kind)].indexOf(b),label:b.innerText};},select.toString());await p.locator('#act '+nextMeta.kind).nth(nextMeta.index).click();const continued=await p.evaluate(()=>window.__actAudit.get());assert.notDeepEqual(continued,after);assert.ok(await p.locator('#act button,#act .abrow').count());assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await p.screenshot({path:path.join(output,`pointer-result-${seed}-${pos}-${width}.png`)});await writeFile(path.join(output,`pointer-result-${seed}-${pos}-${width}.json`),JSON.stringify({seed,pos,width,history,before:meta.before,after,continued,next:nextMeta,log:await p.locator('#log').innerHTML()}));checks.push({bug:'ACT-01',seed,pos,width,status:'PASS',history,duplicateRng:0,navigationRng:0,next:nextMeta.label});checked=true;break;}
  }
  assert.ok(checked);await p.close();console.log(`PASS Playwright pointer result/next/stale/navigation ${seed}/${pos}/${width}`);
 }
 if(!arg('diagnostic-seed')&&!process.argv.includes('--fixtures-only')){
  for(const [seed,pos]of [['k55l221a','P'],...['P','C','IF','OF'].map(pos=>['oscuxs1w',pos])])for(const balanced of [false,true])await career(seed,pos,balanced,1280);
  for(const width of [320,390])await career('k55l221a','P',false,width);
  for(const [seed,pos]of [['yakyo-test-001','P'],['jp3-infielder-01','IF']]){const a=await career(seed,pos,false,1280),b=await career(seed,pos,false,1280);assert.deepEqual(b,a,'full state/DOM/actions/RNG repeat');console.log('PASS exact replay '+seed+'/'+pos);}
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(output,'summary.json'),JSON.stringify({sha,target,results,checks,errors,seconds:(Date.now()-started)/1000},null,2));console.log('PASS Console/JS-CSS404 0; seconds '+(Date.now()-started)/1000+'; evidence '+output);
}catch(e){failure=e;console.error(e.stack);}finally{server.closeAllConnections();server.close();let timer;try{await Promise.race([browser.close(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('BROWSER_CLOSE_TIMEOUT')),15000))]);}catch(e){if(e.message==='BROWSER_CLOSE_TIMEOUT'&&!browser.isConnected())console.warn('BROWSER_CLEANUP_WARNING: disconnected; profile cleanup timeout');else{failure??=e;console.error(e.message);}}finally{clearTimeout(timer);}process.exit(failure?1:0);}
