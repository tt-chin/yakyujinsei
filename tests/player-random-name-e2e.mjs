import {allocationComparisonHook} from './support/allocation-comparison.mjs';
// Focused new-career names: real runtime/save/PNG, no complete career or Full run.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {assertSameCareer} from './support/first-difference.mjs';
import {PLAYER_FAMILY_NAMES,PLAYER_GIVEN_NAMES} from '../docs/src/data/player-names.js';
const root=fileURLToPath(new URL('../',import.meta.url)),baseline='f3bffeee49cd6a9cca3f56b9118bf164992bd8af';
const arg=n=>process.argv.find(v=>v.startsWith('--'+n+'='))?.slice(n.length+3),output=path.resolve(arg('output')||path.join(os.tmpdir(),'player-random-name'));await mkdir(output,{recursive:true});
const oldFiles=new Map(),errors=[],results=[];
const hook=`
const nameTrace=[];careerRng.onDraw=value=>nameTrace.push({before:(S.rngState-0x6D2B79F5)>>>0,after:S.rngState,value});
window.__nameTest={
 get:()=>({state:JSON.parse(JSON.stringify(S)),rng:JSON.parse(JSON.stringify(nameTrace)),choices:[...$('act').querySelectorAll('.abrow,button')].map(b=>({text:b.textContent,disabled:b.disabled??b.getAttribute('aria-disabled')})),comparisonChoices:window.__allocationComparison.choices()}),
 step:()=>{const row=$('act').querySelector('.abrow[aria-disabled="false"]:not(.capped)'),buttons=[...$('act').querySelectorAll('button')].filter(b=>!b.disabled&&!/元に戻す|すべてリセット/.test(b.textContent));const choice=buttons.find(b=>/配分を確定|配分完了|次へ|完了/.test(b.textContent))||row||buttons[0];if(!choice)throw Error('NO_ACTION');const text=window.__allocationComparison.action(choice);choice.click();return text;},
 image:async()=>{const out=document.createElement('div'),texts=[],native=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){texts.push(String(text));return native.call(this,text,...args);};try{await shareImage([],out);return {texts,png:out.querySelector('img').src};}finally{CanvasRenderingContext2D.prototype.fillText=native;}}
};`;
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://local');if(url.pathname==='/favicon.ico'){res.statusCode=204;return res.end();}
 const old=url.pathname.startsWith('/baseline/'),relative=url.pathname.replace(/^\/(?:baseline\/)?/,'')||'index.html';if(relative.includes('..'))throw Error('path');
 let data;if(old){if(!oldFiles.has(relative))oldFiles.set(relative,execFileSync('git',['show',baseline+':docs/'+relative],{cwd:root,maxBuffer:20e6}));data=oldFiles.get(relative);}else data=await readFile(path.join(root,'docs',relative));
 if(relative==='src/engine/game.js')data=data.toString()+allocationComparisonHook+hook;
 res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript; charset=utf-8':relative.endsWith('.css')?'text/css':relative.endsWith('.webp')?'image/webp':'text/html; charset=utf-8');res.end(data);
}catch(e){res.statusCode=404;res.end(String(e));}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright'),browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const currentVersion=(await readFile(path.join(root,'docs/src/config.js'),'utf8')).match(/VERSION = '([^']+)'/)[1];
const oldVersion=execFileSync('git',['show',baseline+':docs/src/config.js'],{cwd:root}).toString().match(/VERSION = '([^']+)'/)[1];
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(r.status()+' '+r.url());});};
const snapshot=p=>p.evaluate(()=>window.__nameTest.get());
const projection=(v,version,name)=>{const copy=structuredClone(v);copy.choices=copy.comparisonChoices;delete copy.comparisonChoices;assert.equal(copy.state.name,name);assert.equal(copy.state.version,version);delete copy.state.name;delete copy.state.version;if(copy.state.birthHighSchool){assert.equal(copy.state.birthHighSchool.createdVersion,version);delete copy.state.birthHighSchool.createdVersion;}return copy;};
const cases=[{id:'empty',raw:'',indices:[0,0],expected:'王貞治'},{id:'spaces',raw:'   ',indices:[1,17],expected:'長嶋秀喜'},{id:'fullwidth',raw:'　　',indices:[PLAYER_FAMILY_NAMES.indexOf('ダルビッシュ'),PLAYER_GIVEN_NAMES.indexOf('慎之助')],expected:'ダルビッシュ慎之助'},{id:'typed',raw:' 山田太郎 ',expected:'山田太郎'},{id:'normalization',raw:'ＡＢＣ太郎',expected:'ABC太郎'},{id:'length',raw:'abcdefghijklmnop',expected:'abcdefghij'}];
let failure;
try{
 const replays=[];
 for(const width of [320,375,390,1280])for(const theme of ['standard','night','classic','scoreboard']){
  const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});await ctx.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  await ctx.addInitScript(()=>{window.__buttonEntropy=0;const words=[0,0,0,0,1,1,2,2,3,3],native=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=array=>{if(array instanceof Uint32Array&&array.length===1){if(window.__buttonEntropy>=words.length)throw Error('EXTRA_NAME_DRAW');array[0]=words[window.__buttonEntropy++];return array;}return native(array);};});
  const page=await ctx.newPage();wire(page);await page.goto(base+'/?seed=button-fixed-seed');await page.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await page.locator('#seg-pos [data-v="IF"]').click();await page.locator('#in-name').fill('山田太郎');await page.locator('#in-name').blur();
  await page.evaluate(async theme=>{document.documentElement.dataset.theme=theme;const {bindRandomPlayerName}=await import('/src/ui/random-player-name.js');const input=document.getElementById('in-name'),button=document.getElementById('btn-random-name');bindRandomPlayerName({input,button});bindRandomPlayerName({input,button});window.__fieldEvents=[];for(const name of ['input','change'])document.addEventListener(name,e=>{if(e.target===input)window.__fieldEvents.push([e.type,e.bubbles]);});},theme);
  const button=page.getByRole('button',{name:'名前をランダムに生成',exact:true});assert.equal(await button.getAttribute('type'),'button');assert.equal(await button.getAttribute('title'),'名前をランダムに生成');
  const home=()=>page.evaluate(()=>({seed:document.getElementById('seed-show').value,pos:document.querySelector('#seg-pos .on').dataset.v,preferences:localStorage.getItem('yakyujinsei.display.v1'),theme:document.documentElement.dataset.theme,url:location.href}));const before=await snapshot(page),beforeHome=await home();
  const b=await button.boundingBox(),a=await page.locator('#in-name').boundingBox();assert.ok(b.width>=44&&b.height>=44);assert.ok(b.x>=a.x+a.width&&Math.abs(b.y-a.y)<1);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await (width<500?button.tap():button.click());assert.equal(await page.locator('#in-name').inputValue(),'王貞治');await (width<500?button.tap():button.click());assert.equal(await page.locator('#in-name').inputValue(),'長嶋茂雄');assert.equal(await page.evaluate(()=>window.__buttonEntropy),6,'exact duplicate retry without extra handlers');
  await page.locator('#in-name').focus();await page.keyboard.press('Tab');assert.equal(await button.evaluate(e=>e===document.activeElement),true);assert.ok(parseFloat(await button.evaluate(e=>getComputedStyle(e).outlineWidth))>0);
  await page.keyboard.press('Enter');assert.equal(await page.locator('#in-name').inputValue(),'野村克也');await page.keyboard.press('Space');assert.equal(await page.locator('#in-name').inputValue(),'落合博満');
  assert.deepEqual(await page.evaluate(()=>window.__fieldEvents),Array(4).fill([['input',true],['change',true]]).flat());assertSameCareer(await snapshot(page),before,'no career/start/S/RNG effects');assert.deepEqual(await home(),beforeHome);
  if(theme==='standard')await page.screenshot({path:path.join(output,'button-'+width+'.png')});
  await page.locator('#in-name').fill('山田太郎');await page.locator('#btn-start').click();const first=await snapshot(page);assert.equal(first.state.name,'山田太郎');assert.equal(first.state.pos,'IF');assert.ok((await page.locator('#bd-name').innerText()).includes('山田太郎'));assert.equal(await page.evaluate(()=>window.__buttonEntropy),10);
  if(width===320&&theme==='standard'){const frames=[first],actions=[];for(let i=0;i<3;i++){actions.push(await page.evaluate(()=>window.__nameTest.step()));frames.push(await snapshot(page));}replays.push({frames,actions});}
  results.push({id:'button-'+width+'-'+theme,status:'PASS'});await ctx.close();
 }
 {const ctx=await browser.newContext({viewport:{width:320,height:844}});await ctx.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));const page=await ctx.newPage();wire(page);await page.goto(base+'/?seed=button-fixed-seed');await page.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await page.locator('#seg-pos [data-v="IF"]').click();await page.locator('#in-name').fill('山田太郎');await page.locator('#btn-start').click();const frames=[await snapshot(page)],actions=[];for(let i=0;i<3;i++){actions.push(await page.evaluate(()=>window.__nameTest.step()));frames.push(await snapshot(page));}assertSameCareer(replays[0],{frames,actions},'zero vs four name clicks: complete S/choices/RNG exact with same final manual input');await ctx.close();results.push({id:'button-RNG-zero-vs-four',status:'PASS'});}
 console.log('PASS button: 16 viewport/themes, touch/Enter/Space, focus, events, idempotence, exact state/RNG replay');
 if(!process.argv.includes('--button-only'))for(const pos of ['P','IF'])for(const spec of cases){
  const pair=[];
  for(const old of [true,false]){
   const context=await browser.newContext({viewport:{width:pos==='P'?390:1280,height:844}});await context.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
   await context.addInitScript(({indices})=>{window.__nameDraws=0;const words=[...(indices||[])],native=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=function(array){if(array instanceof Uint32Array&&array.length===1){window.__nameDraws++;if(!words.length)throw Error('UNEXPECTED_NAME_DRAW');array[0]=words.shift();return array;}return native(array);};},{indices:old?[]:spec.indices});
   const page=await context.newPage();wire(page);await page.goto(base+(old?'/baseline/':'/')+'?seed=random-name-fixed-seed');await page.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
   await page.locator('#seg-pos [data-v="'+pos+'"]').click();await page.locator('#in-name').fill(spec.raw);assert.equal(await page.evaluate(()=>window.__nameDraws),0,'typing does not generate a name');
   await page.locator('#btn-start').click();await page.waitForFunction(()=>window.__nameTest.get().state?.name);
   const initial=await snapshot(page),name=initial.state.name;assert.ok(initial.rng.length>0,'native career RNG trace must be observed');
   if(old)assert.equal(name,spec.indices?{P:'投山翔太',IF:'守田巧'}[pos]:spec.expected,'frozen normalization/default-name contract');
   if(!old){assert.equal(name,spec.expected);assert.equal(await page.evaluate(()=>window.__nameDraws),spec.indices?2:0);assert.ok((await page.locator('#bd-name').innerText()).includes(name));assert.ok((await page.locator('#log').innerText()).includes(name));}
   const frames=[projection(initial,old?oldVersion:currentVersion,name)],actions=[];
   for(let step=0;step<3;step++){actions.push(await page.evaluate(()=>window.__nameTest.step()));frames.push(projection(await snapshot(page),old?oldVersion:currentVersion,name));}
   pair.push({frames,actions});
   if(!old&&spec.id==='empty'){
    await page.locator('[data-main-view="player"]').click();assert.ok((await page.locator('#bd-name').innerText()).includes(name));await page.setViewportSize({width:320,height:844});await page.locator('[data-main-view="home"]').click();assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    const before=await snapshot(page),image=await page.evaluate(()=>window.__nameTest.image());assert.ok(image.texts.includes(name));assertSameCareer(await snapshot(page),before,'views and PNG keep complete state/RNG/choices');assert.equal(await page.evaluate(()=>window.__nameDraws),2);
    await writeFile(path.join(output,'name-'+pos+'.png'),Buffer.from(image.png.split(',')[1],'base64'));await page.screenshot({path:path.join(output,'name-mobile-'+pos+'.png')});
    const storeName=()=>page.evaluate(async()=>{const {BrowserSaveStore}=await import('/src/engine/browser-save-store.js');return (await new BrowserSaveStore().read()).save?.state?.name;});
    await page.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('開始時点をセーブしました'));assert.equal(await storeName(),name);
    await page.reload();await page.locator('#save-continue').waitFor({state:'visible'});assert.equal(await page.evaluate(()=>window.__nameDraws),0);await page.locator('#save-continue').click();await page.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('最初から再開しました'));assert.equal((await snapshot(page)).state.name,name);assert.equal(await page.evaluate(()=>window.__nameDraws),0,'resume does not generate a new name');assert.equal(await storeName(),name);
    let yearlySteps=0;for(;yearlySteps<180;yearlySteps++){const value=await snapshot(page);assert.equal(value.state.name,name);if(value.state.year>2026)break;await page.evaluate(()=>window.__nameTest.step());}
    assert.ok(yearlySteps<180,'native next year reached without a complete career');assert.equal((await snapshot(page)).state.year,2027);assert.equal(await page.evaluate(()=>window.__nameDraws),0,'year advancement does not generate names');
    await page.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('2027年の開始時点をセーブしました'));assert.equal(await storeName(),name);
   }
   await context.close();
  }
  assertSameCareer(pair[1],pair[0],pos+'/'+spec.id+': complete S, choices and every RNG before/after/value except validated name and version metadata');results.push({pos,id:spec.id,status:'PASS',steps:3,rngCalls:pair[1].frames.at(-1).rng.length,annualSaveChecked:spec.id==='empty'});console.log('PASS '+pos+'/'+spec.id);
 }
 assert.deepEqual(errors,[]);
}catch(e){failure=e;console.error(e.stack);}finally{
 const summary=()=>({baseline,version:currentVersion,PASS:results.length,FAIL:failure?1:0,errors,results,failure:failure?.stack,cleanupWarning});let cleanupWarning,timer;
 await writeFile(path.join(output,'summary.json'),JSON.stringify(summary(),null,2));server.closeAllConnections();server.close();
 try{await Promise.race([browser.close(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('BROWSER_CLOSE_TIMEOUT')),15000))]);}
 catch(e){if(e.message==='BROWSER_CLOSE_TIMEOUT'&&!browser.isConnected()){cleanupWarning='Disconnected browser profile cleanup timed out';console.warn(cleanupWarning);}else{failure??=e;console.error(e.stack);}}
 finally{clearTimeout(timer);}
 await writeFile(path.join(output,'summary.json'),JSON.stringify(summary(),null,2));process.exit(failure?1:0);
}
