import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
function instrument(source){
 source=source.replace('function R(){','function R(){window.__calls=(window.__calls||0)+1;').replace('R = function(){','R = function(){window.__calls=(window.__calls||0)+1;').replace('function card(cls,title,html){','function card(cls,title,html){window.__cardCalls=(window.__cardCalls||0)+1;(window.__cardHTML??=[]).push({cls,title,html});');
 const at=source.lastIndexOf('})();');assert.ok(at>0);
 return source.slice(0,at)+`window.__actAudit={get:()=>({state:JSON.parse(JSON.stringify(S)),calls:window.__calls||0,generation:choiceGeneration,token:activeChoiceToken?.generation,running:activeChoiceToken?.running,dom:document.querySelector('#act').outerHTML,cards:window.__cardCalls||0}),draft:(from)=>{actClear();S=newState('入団検証',S.pos);Object.assign(S,{age:from==='HS'?18:22,year:2032,stage:from,lv:from,stageYr:from==='HS'?3:4,entryRoute:from,seasonFactor:1});Object.keys(S.ab).forEach(k=>S.ab[k]=60);enterDraftPath(from);}};`+source.slice(at);
}
const server=createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';if(rel.includes('..'))throw Error('path');let body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':'text/html');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const target=arg('preview')||`http://127.0.0.1:${server.address().port}`;
const output=path.join(os.tmpdir(),'yakyujinsei-act-audit',arg('diagnostic-seed')?'diagnostic':arg('preview')?'preview':'local');await mkdir(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],results=[],started=Date.now();let failure;
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
   const label=b.innerText;b.click();const after=window.__actAudit.get();
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
 if(!arg('diagnostic-seed'))for(const width of [1280,320,390])for(const pos of ['P','IF'])for(const from of ['HS','U','CORP','IND']){
  const p=await page(width,'act-signing-'+from,pos);await p.evaluate(from=>window.__actAudit.draft(from),from);const before=await p.evaluate(()=>window.__actAudit.get());const button=p.locator('#act button').filter({hasText:'指名を受けて入団'});await button.click();const after=await p.evaluate(()=>window.__actAudit.get());assert.equal(after.state.stage,'PRO');assert.ok(after.state.ct);assert.equal(after.state.contractSequence,before.state.contractSequence+1);assert.ok(after.cards>before.cards);assert.ok(await p.locator('#act button,#act .abrow').count());
  // A queued callback from the now-detached acceptance choice must be inert.
  await p.evaluate(()=>{if(typeof window.__lastAcceptance!=='function')throw Error('ACCEPT_HANDLER_NOT_CAPTURED');window.__lastAcceptance();window.__lastAcceptance();});
  assert.deepEqual(await p.evaluate(()=>window.__actAudit.get()),after);
  // Navigation must preserve exact nodes/listeners and all game state/RNG.
  await p.evaluate(()=>{window.__held=[...document.querySelector('#act').children];window.__heldHandlers=window.__held.map(n=>n.onclick);});
  for(const tab of ['player','career','home'])await p.locator('[data-main-view="'+tab+'"]').click();
  assert.equal(await p.evaluate(()=>window.__held.every((n,i)=>n.isConnected&&n.onclick===window.__heldHandlers[i])),true);assert.deepEqual(await p.evaluate(()=>window.__actAudit.get()),after);
  // Two synchronous clicks on a retained next-choice element simulate rapid input.
  const nextBefore=await p.evaluate(()=>window.__actAudit.get());const nextLabel=await p.evaluate(code=>{const b=eval('('+code+')')(false);if(!b)throw Error('NO_NEXT');const label=b.innerText;b.click();const once=JSON.stringify(window.__actAudit.get());b.click();if(JSON.stringify(window.__actAudit.get())!==once)throw Error('DOUBLE_EXECUTION');return label;},select.toString());const nextAfter=await p.evaluate(()=>window.__actAudit.get());assert.notDeepEqual(nextAfter,nextBefore);assert.equal(nextAfter.state.contractSequence,after.state.contractSequence);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await writeFile(path.join(output,`draft-${from}-${pos}-${width}.json`),JSON.stringify({before,after,nextLabel,nextBefore,nextAfter}));await p.close();console.log(`PASS draft ${from}/${pos}/${width} contract/result/next/listener/double-click`);
 }
 if(arg('diagnostic-seed'))await career(arg('diagnostic-seed'),'P',false,1280);
 if(!arg('diagnostic-seed'))for(const width of [1280,320,390]){
  const p=await page(width,'k55l221a','P');let checked=false;
  for(let i=0;i<150;i++){
   const meta=await p.evaluate(code=>{const b=eval('('+code+')')(false);if(!b)throw Error('NO_ACTION');const kind=b.matches('.abrow')?'.abrow':'button';return{kind,index:[...document.querySelectorAll('#act '+kind)].indexOf(b),label:b.innerText,before:window.__actAudit.get()};},select.toString());
   await p.locator('#act '+meta.kind).nth(meta.index).click();
   if(meta.label.includes('今季の成績を見る')){const after=await p.evaluate(()=>window.__actAudit.get());assert.ok(after.cards>meta.before.cards);assert.ok(after.state.log.length>meta.before.state.log.length);assert.ok(await p.locator('#act button,#act .abrow').count());await writeFile(path.join(output,'pointer-result-'+width+'.json'),JSON.stringify({before:meta.before,after,log:await p.locator('#log').innerHTML()}));checked=true;break;}
  }
  assert.ok(checked);await p.close();console.log('PASS Playwright pointer result/next '+width);
 }
 if(!arg('diagnostic-seed')&&!process.argv.includes('--fixtures-only')){
  for(const [seed,pos]of [['k55l221a','P'],...['P','C','IF','OF'].map(pos=>['oscuxs1w',pos])])for(const balanced of [false,true])await career(seed,pos,balanced,1280);
  for(const width of [320,390])await career('k55l221a','P',false,width);
  for(const [seed,pos]of [['yakyo-test-001','P'],['jp3-infielder-01','IF']]){const a=await career(seed,pos,false,1280),b=await career(seed,pos,false,1280);assert.deepEqual(b,a,'full state/DOM/actions/RNG repeat');console.log('PASS exact replay '+seed+'/'+pos);}
 }
 assert.deepEqual(errors,[]);await writeFile(path.join(output,'summary.json'),JSON.stringify({sha,target,results,errors,seconds:(Date.now()-started)/1000},null,2));console.log('PASS Console/JS-CSS404 0; seconds '+(Date.now()-started)/1000+'; evidence '+output);
}catch(e){failure=e;console.error(e.stack);}finally{server.closeAllConnections();server.close();let timer;try{await Promise.race([browser.close(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('BROWSER_CLOSE_TIMEOUT')),15000))]);}catch(e){if(e.message==='BROWSER_CLOSE_TIMEOUT'&&!browser.isConnected())console.warn('BROWSER_CLEANUP_WARNING: disconnected; profile cleanup timeout');else{failure??=e;console.error(e.message);}}finally{clearTimeout(timer);}process.exit(failure?1:0);}
