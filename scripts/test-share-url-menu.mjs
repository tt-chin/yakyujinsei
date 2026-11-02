// Focused UI acceptance only; no career simulation or historical baseline changes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const root=fileURLToPath(new URL('../docs/',import.meta.url));
const output=path.resolve(arg('output')||'test-results/share-url-menu-1137');
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const server=createServer(async(req,res)=>{
  try{
    const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';
    const file=path.resolve(root,rel);if(!file.startsWith(root))throw Error('path');
    const body=await readFile(file);
    res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.png')?'image/png':'text/html');res.end(body);
  }catch{res.statusCode=404;res.end('Not found');}
});
await mkdir(output,{recursive:true});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser,cases=0;const errors=[];
const check=(condition,message)=>{assert.ok(condition,message);cases++;};
try{
  browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
  for(const [width,height] of [[1280,900],[320,568],[390,844],[320,300]]){
    const context=await browser.newContext({viewport:{width,height},isMobile:width<500,hasTouch:width<500});
    const p=await context.newPage();
    p.on('pageerror',e=>errors.push(e.message));
    p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('net::ERR'))errors.push(m.text());});
    p.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)errors.push(r.status()+' '+r.url());});
    const base='http://127.0.0.1:'+server.address().port;
    const seed='日本語 +?&%/#"';
    await p.goto(base+'/?seed='+encodeURIComponent(seed)+'&rv=old#ignored');
    await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);
    await p.locator('#btn-start').click();
    await p.locator('#board-menu-toggle').click();
    const names=['遊び方','更新履歴','表示設定','共有','開発を応援','最初からやり直す'];
    const panel=p.locator('#board-menu-panel');
    const items=await panel.locator('button,a').evaluateAll(nodes=>nodes.map(n=>{
      const bullet=n.querySelector('.menu-bullet'),r=bullet?.getBoundingClientRect();
      const range=document.createRange();range.selectNodeContents(n.childNodes[1]);const text=range.getBoundingClientRect();
      return{bullet:bullet?.textContent,hidden:bullet?.getAttribute('aria-hidden'),x:r?.x,textX:text.x,height:n.getBoundingClientRect().height};
    }));
    assert.equal(items.length,6);
    for(let i=0;i<6;i++){
      check(items[i].bullet==='•'&&items[i].hidden==='true','decorative uniform bullet');
      check(Math.abs(items[i].x-items[0].x)<1&&Math.abs(items[i].textX-items[0].textX)<1,'bullet/text alignment');
      check(items[i].height>=44,'touch target');
      const expectedName=names[i]+(i===4?' 別タブ ↗':'');
      check(await panel.getByRole(i===4?'link':'button',{name:expectedName,exact:true}).count()===1,'accessible name excludes bullet: '+expectedName+' '+await panel.ariaSnapshot());
    }
    check(await p.locator('#board-menu-toggle').innerText()==='☰\nメニュー'||(await p.locator('#board-menu-toggle').innerText()).replace(/\s/g,'')==='☰メニュー','top menu unchanged');
    const preserved=await p.evaluate(()=>{
      const support=document.querySelector('#board-support'),restart=document.querySelector('#btn-restart'),style=getComputedStyle(restart);
      return{target:support.target,rel:support.rel,href:support.href,hint:support.querySelector('.menu-external').textContent,color:style.color,bad:getComputedStyle(document.documentElement).getPropertyValue('--bad').trim(),border:style.borderTopWidth};
    });
    check(preserved.target==='_blank'&&preserved.rel.includes('noopener')&&preserved.rel.includes('noreferrer')&&preserved.href==='https://ofuse.me/dcb7f92e'&&preserved.hint==='別タブ ↗','external hint/security retained');
    check(preserved.border==='1px','restart separator');
    check(await p.locator('#btn-restart').evaluate(n=>{const probe=document.createElement('span');probe.style.color='var(--bad)';n.append(probe);const same=getComputedStyle(probe).color===getComputedStyle(n).color;probe.remove();return same;}),'restart warning color');
    if(height!==300)await p.screenshot({path:path.join(output,`menu-${width}.png`)});
    const open=async()=>{await p.locator('#board-menu-toggle').click();await p.locator('#board-share').click();await p.locator('#seed-share[open]').waitFor();};
    await p.locator('#board-share').click();
    const url=await p.locator('#share-url-value').inputValue();
    assert.equal(url,base+'/?seed='+encodeURIComponent(seed));cases++;
    check(await p.locator('#share-url-copy').evaluate(n=>n.previousElementSibling.id==='share-url-value'&&n.nextElementSibling.id==='share-copy-url'),'URL copy order');
    const mock=async(kind='success')=>p.evaluate(kind=>{
      window.__copies=[];window.__shares=[];window.__fallbacks=0;window.__pending=[];
      Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>{
        window.__copies.push(text);
        if(kind==='pending')return new Promise((resolve,reject)=>window.__pending.push({resolve,reject}));
        if(kind==='failed'||kind==='legacy')return Promise.reject(Error('denied'));
        return Promise.resolve();
      }}});
      Object.defineProperty(navigator,'share',{configurable:true,value:kind==='missing'?undefined:data=>{
        window.__shares.push(data);
        if(kind==='pending-share')return new Promise(resolve=>window.__resolveShare=resolve);
        if(kind==='cancel'||kind==='denied')return Promise.reject(Object.assign(Error(kind),{name:kind==='cancel'?'AbortError':'NotAllowedError'}));
        return Promise.resolve();
      }});
      document.execCommand=()=>{window.__fallbacks++;return kind==='legacy';};
    },kind);
    const status=p.locator('#seed-share-status'),copy=p.locator('#share-url-copy');
    await mock();await copy.click();await p.waitForFunction(()=>document.querySelector('#seed-share-status').textContent==='リプレイURLをコピーしました。');
    assert.deepEqual(await p.evaluate(()=>window.__copies),[url]);check(await p.evaluate(()=>window.__shares.length)===0,'copy never calls native share');
    await p.locator('#share-copy-seed').click();await p.waitForFunction(()=>document.querySelector('#seed-share-status').textContent==='Seedをコピーしました。');
    assert.equal((await p.evaluate(()=>window.__copies)).at(-1),seed);cases++;
    await mock('failed');await copy.click();await p.waitForFunction(()=>document.querySelector('#seed-share-status').textContent.includes('選択してコピー'));
    check(await copy.isEnabled(),'failure unlocks copy');
    assert.deepEqual(await p.locator('#share-url-value').evaluate(n=>[document.activeElement.id,n.selectionStart,n.selectionEnd]),['share-url-value',0,url.length]);cases++;
    await mock('legacy');await copy.click();await p.waitForFunction(()=>document.querySelector('#seed-share-status').textContent==='リプレイURLをコピーしました。');check(await p.evaluate(()=>window.__fallbacks)===1,'shared legacy fallback');
    for(const kind of ['success','cancel','denied','missing']){
      await mock(kind);await p.locator('#share-copy-url').click();await p.waitForFunction(()=>!document.querySelector('#share-copy-url').disabled);
      check(await p.evaluate(()=>window.__shares.length)===(kind==='missing'?0:1),'existing native URL share');
      if(kind==='success')assert.equal((await p.evaluate(()=>window.__shares))[0].url,url);
      if(kind==='cancel')assert.equal(await status.innerText(),'');
      if(kind==='denied')assert.match(await status.innerText(),/共有できませんでした/);
      if(kind==='missing')assert.deepEqual(await p.evaluate(()=>window.__copies),[url]);
    }
    await mock('pending-share');await p.locator('#share-copy-url').click();
    await p.locator('#share-copy-url').evaluate(n=>{n.click();n.click();});
    check(await p.evaluate(()=>window.__shares.length)===1,'existing share duplicate guard');
    await p.locator('#seed-share-close').click();
    await p.waitForFunction(()=>!document.body.classList.contains('seed-share-open'));
    await open();await p.evaluate(async()=>{window.__resolveShare();await new Promise(r=>setTimeout(r,30));});
    check(await status.innerText()===''&&await p.locator('#share-copy-url').isEnabled(),'old native share response ignored after reopening');
    // Exercise stale success/rejection for both copy actions, with and without reopening.
    for(const id of ['share-url-copy','share-copy-seed'])for(const outcome of ['resolve','reject']){
      await mock('pending');await p.locator('#'+id).click();
      await p.locator('#'+id).evaluate(n=>{n.click();n.click();});
      check(await p.evaluate(()=>window.__copies.length)===1,'duplicate suppressed');
      await p.locator('#seed-share-close').click();await p.waitForFunction(()=>document.activeElement.id==='board-menu-toggle');
      if(outcome==='resolve'){
        await p.evaluate(()=>window.__pending[0].resolve());
        await p.waitForFunction(()=>!document.querySelector('#'+(window.__copies[0].startsWith('http')?'share-url-copy':'share-copy-seed')).disabled||!document.querySelector('#seed-share').open);
        await open();
      }else{
        await open();await p.locator('#'+id).click();
        await p.evaluate(async()=>{window.__pending[0].reject(Error('old'));await new Promise(r=>setTimeout(r,30));});
        check(await p.locator('#'+id).isDisabled(),'old finally cannot unlock new operation');
        check(await status.innerText()===''&&await p.evaluate(()=>window.__fallbacks)===0,'stale failure cannot write status or invoke fallback');
        check(await p.evaluate(()=>document.activeElement.id)!=='share-url-value','stale failure cannot steal selection');
        await p.evaluate(()=>window.__pending[1].resolve());
        await p.waitForFunction(()=>!document.querySelector('#share-url-copy').disabled&&!document.querySelector('#share-copy-seed').disabled);
      }
      if(outcome==='resolve')check(await status.innerText()==='','reopen clears stale success');
    }
    await mock();
    // Copy exactly the displayed field, not a regenerated or truncated URL.
    await p.locator('#share-url-value').evaluate(n=>n.value+='-displayed');await copy.click();
    await p.waitForFunction(()=>!document.querySelector('#share-url-copy').disabled);
    assert.equal((await p.evaluate(()=>window.__copies))[0],url+'-displayed');cases++;
    await p.locator('#share-url-value').evaluate((n,url)=>n.value=url,url);
    const box=await p.locator('#seed-share').evaluate(d=>{
      const r=d.getBoundingClientRect();return{x:r.x,right:r.right,y:r.y,bottom:r.bottom,overflow:d.scrollWidth>d.clientWidth,max:d.scrollHeight-d.clientHeight};
    });
    check(box.x>=0&&box.right<=width&&box.y>=0&&box.bottom<=height&&!box.overflow,'dialog within viewport/no horizontal overflow');
    if(height===300)check(box.max>0,'small-height content scrolls');
    await p.locator('#seed-share').evaluate(d=>d.scrollTop=d.scrollHeight);
    await p.locator('#seed-share-close').scrollIntoViewIfNeeded();
    check(await p.locator('#seed-share-close').isVisible(),'close reachable');
    const closeBox=await p.locator('#seed-share-close').boundingBox();check(closeBox.y>=0&&closeBox.y+closeBox.height<=height,'close inside viewport after scroll');
    await p.screenshot({path:path.join(output,`share-${width}-${height}.png`)});
    await p.locator('#seed-share-close').click();await p.waitForFunction(()=>document.activeElement.id==='board-menu-toggle');
    await open();check(await p.locator('#seed-share').evaluate(d=>d.scrollTop)===0,'reopen at top');
    await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('#seed-share').open&&document.activeElement.id==='board-menu-toggle'&&!document.body.classList.contains('seed-share-open'));
    check(!await p.locator('body').evaluate(n=>n.classList.contains('seed-share-open')),'close restores background');
    console.log(`PASS ${width}x${height}: URL copy/share, stale results, menu accessibility and layout`);
    await context.close();
  }
  assert.deepEqual(errors,[]);console.log(`PASS ${cases} focused checks; page/module errors 0; screenshots ${output}`);
  await writeFile(path.join(output,'summary.json'),JSON.stringify({status:'PASS',checks:cases,errors,scope:'URL copy / menu only; Quick, Full and careers NOT_RUN'},null,2));
}catch(error){await writeFile(path.join(output,'failure.json'),JSON.stringify({status:'FAIL',checks:cases,message:error.stack,errors},null,2));throw error;}
finally{await browser?.close();await new Promise(r=>server.close(r));}
