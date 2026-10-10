import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const baseline='925987dc1bb93304eddd8eb71ab2876eef9dac8c';
const hook=`\nwindow.__hofFix={get:()=>({state:JSON.parse(JSON.stringify(S)),calls:window.__rngCalls||0}),fixture:()=>{S.pos='IF';S.lv='MLB';S.stage='PRO';S.team='長い球団名のニューヨーク・スターズ';S.year=2050;S.age=40;S.honors=[];S.teamTally={};S.stats={CPBL:{...blankStat(),yr:4,H:8600},MLB:{...blankStat(),yr:10,H:11000}};endGame('人工診断：複数リーグ入選');}};`;
const instrument=s=>s.replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;')+hook+`window.__hofImageText=[];const hofOriginalFill=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){window.__hofImageText.push(String(text));return hofOriginalFill.call(this,text,...args);};`;
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://local'),old=u.pathname.startsWith('/baseline/'),rel=u.pathname.replace(/^\/(baseline\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('path');let body=old?execFileSync('git',['show',baseline+':docs/'+rel],{maxBuffer:20e6}):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':'text/html');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({channel:'chrome',headless:true}),errors=[];
const shots=path.join(os.tmpdir(),'yakyujinsei-hof-first-ballot');await mkdir(shots,{recursive:true});
async function imageResult(p,width){const texts=await p.evaluate(()=>window.__hofImageText);assert.ok(texts.some(t=>t.includes('メジャーリーグ歴史に残る名選手')),'actual PNG draws correct trait');assert.ok(!texts.some(t=>t.includes('台湾プロ野球歴史に残る名選手')),'PNG excludes wrong trait');const png=await p.locator('#sh-out img').getAttribute('src');await writeFile(path.join(shots,'export-'+width+'.png'),Buffer.from(png.split(',')[1],'base64'));}
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,url,pos)=>{await p.goto(url);await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();};
const action=async(p,balanced)=>p.evaluate(balanced=>{const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));if(balanced)rows.sort((a,b)=>parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent));const buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||(balanced?buttons.find(e=>/残留|FA権を行使しない|現在の球団/.test(e.innerText)):null)||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)return null;const text=b.innerText;b.click();return text;},balanced);
let failure;
try{
 if(arg('preview')){
  // Preview is never instrumented and has no test-only state mutation API.
  const p=await browser.newPage();wire(p);await p.goto(arg('preview'));
  const files=execFileSync('git',['ls-files','docs'],{encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(js|css|html)$/.test(f));
  for(const file of files){const response=await p.request.get(new URL(file.slice(5),arg('preview')+'/').href,{headers:{'Cache-Control':'no-cache'}});assert.equal(response.status(),200,file);assert.equal((await response.text()).replaceAll('\r\n','\n'),(await readFile(path.join(root,file),'utf8')).replaceAll('\r\n','\n'),file+' deployed content');}
  console.log('Preview '+files.length+' assets exact checkout '+execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());
  for(const width of [1280,320,390]){await p.setViewportSize({width,height:844});await start(p,arg('preview')+'/?seed=hof111-pilot-11','P');for(let i=0;i<3000;i++){if(await p.locator('#sh-img').count())break;assert.ok(await action(p,true),'normal Preview action');}await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor();assert.match(await p.locator('#log').innerText(),/殿堂入り投票/);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(shots,'preview-'+width+'.png')});console.log('Preview '+width+'px natural retirement/vote/PNG/overflow PASS');}
  await p.close();
 }else{
  for(const width of [1280,320,390]){
   const p=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});wire(p);await start(p,local+'/?seed=hof-fix-F01','IF');await p.evaluate(()=>window.__hofFix.fixture());
   const title=await p.locator('#log h4').allTextContents();assert.ok(title.includes('隠し特性解放：メジャーリーグ歴史に残る名選手'));assert.ok(!title.includes('隠し特性解放：台湾プロ野球歴史に残る名選手'));
   await p.locator('#sh-img').click();const img=p.locator('#sh-out img');await img.waitFor();await img.evaluate(i=>i.decode());await imageResult(p,width);
   await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();assert.match(await p.locator('#player-content').innerText(),/メジャーリーグ歴史に残る名選手/);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:path.join(shots,'local-'+width+'.png')});console.log(width+'px synthetic F01 unlock/player/PNG/overflow PASS');await p.close();
  }
  for(const [seed,pos]of [['yakyo-test-001','P'],['jp3-infielder-01','IF']]){const runs=[];for(const old of [true,false]){const p=await browser.newPage();wire(p);await start(p,local+(old?'/baseline/':'/')+'?seed='+seed,pos);const actions=[];for(let i=0;i<3000;i++){if(await p.evaluate(()=>window.__hofFix.get().state.done))break;actions.push(await action(p,false));assert.ok(actions.at(-1),'action');}const snap=await p.evaluate(()=>window.__hofFix.get());assert.equal(snap.state.done,true);delete snap.state.version;runs.push({snap,actions});await p.close();}assert.deepEqual(runs[1],runs[0],seed+' exact full career before/after');console.log(seed+'/'+pos+' full state/actions/RNG exact PASS calls='+runs[1].snap.calls);}
 }
 assert.deepEqual(errors,[]);console.log('Console and JS/CSS404 0; screenshots '+shots);
}catch(e){failure=e;console.error(e.stack,errors);}finally{server.closeAllConnections();server.close();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
