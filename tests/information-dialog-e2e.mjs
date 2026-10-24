import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {instrumentRng} from './support/rng-instrument.mjs';
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const root=fileURLToPath(new URL('../',import.meta.url)),output=arg('output')||path.join(os.tmpdir(),'yakyujinsei-information-dialog');
await mkdir(output,{recursive:true});
const pw=createRequire(import.meta.url)(arg('playwright')||'playwright'),engine=arg('engine')||'chromium';
const server=createServer(async(req,res)=>{try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';if(rel.split('/').includes('..'))throw Error('path');
  let body=await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js')body=instrumentRng(body.toString(),'__dialogRng')+'\nwindow.__dialogState=()=>JSON.parse(JSON.stringify({state:S,calls:window.__dialogRng||0}));';
  res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8');res.end(body);
}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
let browser,failure;const results=[],errors=[];
const settle=p=>p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const settleMotion=async(p,key)=>{
  await p.evaluate(async key=>{
    const v=document.querySelector('#information-'+key+' .information-content');let last=v.scrollTop,stable=0;
    for(let i=0;i<180;i++){await new Promise(requestAnimationFrame);const top=v.scrollTop;stable=Math.abs(top-last)<.1?stable+1:0;last=top;if(stable>=5)return;}
    throw Error('Scroll motion did not settle');
  },key);await settle(p);
};
const watchers=p=>p.evaluate(()=>({resize:window.__liveResize.size,mutation:window.__liveMutation.size,listeners:window.__scrollListeners.length}));
const geometry=(p,key)=>p.locator('#information-'+key).evaluate(d=>{
  const v=d.querySelector('.information-content'),t=d.querySelector('.information-scroll-track'),thumb=d.querySelector('.information-scroll-thumb');
  const rect=e=>{if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
  return{dialog:rect(d),header:rect(d.querySelector('header')),footer:rect(d.querySelector('footer')),button:rect(d.querySelector('button')),content:rect(v),article:rect(d.querySelector('.information-article')),last:rect(d.querySelector('section:last-child')),track:rect(t),thumb:rect(thumb),hidden:t.hidden,scroll:v.scrollTop,max:v.scrollHeight-v.clientHeight,total:v.scrollHeight,dialogScroll:d.scrollTop,rootWidth:document.documentElement.scrollWidth,windowWidth:innerWidth,windowHeight:innerHeight,locked:document.body.style.position==='fixed'&&document.documentElement.style.overflow==='hidden',pointer:getComputedStyle(t).pointerEvents};
});
function check(g){
  assert.ok(g.dialog.y>=11&&g.dialog.bottom<=g.windowHeight-11,'within visible height');
  assert.ok(g.dialog.x>=11&&g.dialog.right<=g.windowWidth-11,'within visible width');
  assert.ok(g.header.height>0&&g.footer.height>0&&g.content.height>0,'all three regions retain space');
  assert.ok(g.button.y>=g.footer.y&&g.button.bottom<=g.dialog.bottom,'close visible');
  assert.ok(g.content.y>=g.header.bottom-1&&g.content.bottom<=g.footer.y+1,'content cannot cover header/footer');
  assert.equal(g.dialogScroll,0);assert.ok(g.locked);assert.ok(g.rootWidth<=g.windowWidth);
  assert.equal(g.hidden,g.max<=1);assert.equal(g.pointer,'none');
  if(!g.hidden){
    const size=Math.min(g.track.height,Math.max(20,g.track.height*g.content.height/g.total));
    assert.ok(Math.abs(g.thumb.height-size)<1,'thumb size');
    const expected=(g.track.height-size)*Math.max(0,Math.min(1,g.scroll/g.max));
    assert.ok(Math.abs(g.thumb.y-g.track.y-expected)<1,'thumb position: '+JSON.stringify({actual:g.thumb.y-g.track.y,expected,scroll:g.scroll,max:g.max}));
    // The scroll viewport includes its reserved right padding; only the article
    // text box must end before the decorative rail.
    assert.ok(g.article.right<=g.track.x,'track has reserved text space');
  }
}
try{
  browser=await pw[engine].launch(engine==='chromium'?{channel:arg('browser')||'chrome',headless:true}:{headless:true});
  for(const [width,height] of [[320,568],[390,844],[844,390],[390,240],[1280,900]]){
    const ctx=await browser.newContext({viewport:{width,height},isMobile:width<1000,hasTouch:width<1000});
    await ctx.addInitScript(()=>{
      window.__liveResize=new Set();window.__liveMutation=new Set();window.__scrollListeners=[];
      for(const [name,set] of [['ResizeObserver',window.__liveResize],['MutationObserver',window.__liveMutation]]){
        const Native=window[name];window[name]=class extends Native{constructor(cb){super(cb);set.add(this);}disconnect(){set.delete(this);return super.disconnect();}};
      }
      const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener=function(type,fn,opts){if((type==='scroll'||type==='resize')&&(this===window||this===visualViewport||this.classList?.contains('information-content')))window.__scrollListeners.push({target:this,type,fn});return add.call(this,type,fn,opts);};
      EventTarget.prototype.removeEventListener=function(type,fn,opts){window.__scrollListeners=window.__scrollListeners.filter(x=>!(x.target===this&&x.type===type&&x.fn===fn));return remove.call(this,type,fn,opts);};
    });
    const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});
    await p.goto('http://127.0.0.1:'+server.address().port+'/?seed=dialog-layout');await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#btn-start').click();
    await p.evaluate(()=>{const filler=document.createElement('div');filler.style.height='2000px';document.getElementById('log').append(filler);window.scrollTo(0,180);});await settle(p);
    const state=await p.evaluate(()=>window.__dialogState()),initialWatchers=await watchers(p);
    const open=async key=>{await p.locator('#board-menu-toggle').click();await p.locator('#board-'+key).click();await settle(p);assert.equal(await p.evaluate(()=>document.activeElement.id),'information-'+key+'-title');};
    for(const key of ['help','updates']){
      const original=await p.locator('#information-'+key+' .information-article').textContent();
      for(const [name,ratio] of [['top',0],['middle',.5],['bottom',1]]){
        const scroll=await p.evaluate(()=>[scrollX,scrollY]);await open(key);
        const d=p.locator('#information-'+key),v=d.locator('.information-content');
        assert.equal(await v.evaluate(e=>e.scrollTop),0,'reopen begins at top');const start=await geometry(p,key);check(start);
        await v.evaluate((e,r)=>{e.scrollTop=(e.scrollHeight-e.clientHeight)*r;},ratio);await settle(p);const g=await geometry(p,key);check(g);
        assert.deepEqual(g.header,start.header);assert.deepEqual(g.footer,start.footer);
        if(ratio===1)assert.ok(g.last.bottom<=g.content.bottom+1,'last section fully above footer at bottom');
        if((width===390&&height===844)||(width===320&&height===568))await p.screenshot({path:path.join(output,key+'-'+name+(width===320?'-320':'')+'.png')});
        // Wheel input over a non-scrolling region cannot move the underlying page.
        const anchor=await p.locator('#log').boundingBox();
        // Playwright mobile WebKit has no wheel API. Check its page lock using a
        // programmatic scroll attempt; Chromium separately verifies native touch.
        if(engine==='webkit'&&width<1000)await p.evaluate(()=>window.scrollBy(0,200));
        else{await p.mouse.move(g.header.x+20,g.header.y+10);await p.mouse.wheel(0,200);}
        await settle(p);assert.deepEqual(await p.locator('#log').boundingBox(),anchor);
        await d.locator('button').click();await settle(p);
        assert.deepEqual(await p.evaluate(()=>[scrollX,scrollY]),scroll,'page scroll restored');assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-toggle');
        assert.deepEqual(await watchers(p),initialWatchers,'observers and transient listeners cleaned');
      }
      await open(key);const d=p.locator('#information-'+key),v=d.locator('.information-content');
      await v.focus();await p.keyboard.press('End');await settleMotion(p,key);check(await geometry(p,key));await p.keyboard.press('Home');await settleMotion(p,key);
      await p.keyboard.press('Tab');assert.equal(await d.locator('button').evaluate(e=>e===document.activeElement),true,'keyboard reaches close');await p.keyboard.press('Shift+Tab');assert.equal(await v.evaluate(e=>e===document.activeElement),true);
      await p.keyboard.press('Escape');await settle(p);assert.equal(await d.isVisible(),false);assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-toggle');
      // Synchronous close/reopen must survive the previous queued native close event.
      await open(key);await p.evaluate(key=>{const d=document.getElementById('information-'+key);d.querySelector('button').click();document.getElementById('board-'+key).click();},key);await settle(p);
      assert.equal(await d.isVisible(),true);assert.equal(await p.evaluate(()=>document.activeElement.id),'information-'+key+'-title');check(await geometry(p,key));
      // Programmatic close and backdrop dismissal use the same cleanup path.
      if(engine==='chromium'&&width===390&&height===844){
        const v=d.locator('.information-content');await v.evaluate(e=>{e.scrollTop=0;});await settle(p);
        const g=await geometry(p,key),anchor=await p.locator('#log').boundingBox();
        if(g.max>0){
          const session=await ctx.newCDPSession(p),x=g.content.x+g.content.width/2,y=g.content.bottom-35;
          await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
          for(let i=1;i<=5;i++)await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*18}]});
          await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await session.detach();
          await settleMotion(p,key);const moved=await geometry(p,key);assert.ok(moved.scroll>0,'native touch scroll remains available');check(moved);assert.deepEqual(await p.locator('#log').boundingBox(),anchor);
        }
      }
      await d.evaluate(e=>e.close());await settle(p);assert.deepEqual(await watchers(p),initialWatchers);
      await open(key);const rect=await d.boundingBox();await p.mouse.click(rect.x+2,Math.max(1,rect.y-5));await settle(p);assert.equal(await d.isVisible(),false);assert.deepEqual(await watchers(p),initialWatchers);
      assert.equal(await p.locator('#information-'+key+' .information-article').textContent(),original,'article text preserved');
      results.push({key,width,height,status:'PASS'});
    }
    if(width===390&&height===844){
      await open('updates');const d=p.locator('#information-updates');
      for(const viewport of [{width:844,height:390},{width:390,height:240},{width:390,height:844}]){await p.setViewportSize(viewport);await settle(p);check(await geometry(p,'updates'));}
      const old=await geometry(p,'updates');
      await d.locator('.information-article').evaluate(e=>{const extra=document.createElement('p');extra.id='height-fixture';extra.style.height='800px';extra.textContent='動的な内容の高さの検証';e.append(extra);});await settle(p);const taller=await geometry(p,'updates');check(taller);assert.ok(taller.max>old.max&&taller.thumb.height<old.thumb.height);
      await p.evaluate(()=>document.getElementById('height-fixture').remove());await settle(p);
      // Synthetic visualViewport contraction models address-bar/keyboard geometry, not a real iPhone test.
      await p.evaluate(()=>{Object.defineProperty(visualViewport,'height',{configurable:true,value:500});Object.defineProperty(visualViewport,'offsetTop',{configurable:true,value:30});visualViewport.dispatchEvent(new Event('resize'));});await settle(p);
      const reduced=await geometry(p,'updates');assert.ok(reduced.dialog.y>=41&&reduced.dialog.bottom<=519,'visual viewport offsets respected');
      await p.evaluate(()=>{delete visualViewport.height;delete visualViewport.offsetTop;visualViewport.dispatchEvent(new Event('resize'));});await settle(p);
      await d.locator('button').click();await settle(p);
      // No overflow must hide the decorative rail; mutations restore it automatically.
      await open('help');await p.locator('#information-help .information-article').evaluate(e=>{window.__savedArticle=[...e.childNodes];e.replaceChildren(document.createTextNode('短い内容'));});await settle(p);assert.equal((await geometry(p,'help')).hidden,true);
      await p.locator('#information-help .information-article').evaluate(e=>e.replaceChildren(...window.__savedArticle));await settle(p);check(await geometry(p,'help'));
      await p.keyboard.press('Escape');await settle(p);assert.deepEqual(await watchers(p),initialWatchers);
      // A queued close from help cannot steal focus from a subsequently opened dialog.
      await open('help');await p.locator('#information-help button').click();
      await p.locator('#board-menu-toggle').click();await p.locator('#board-preferences').click();await p.waitForTimeout(150);
      assert.ok(await p.locator('#display-preferences').isVisible());assert.ok(await p.evaluate(()=>document.getElementById('display-preferences').contains(document.activeElement)));
      await p.locator('#preferences-close').click();await settle(p);assert.equal(await p.evaluate(()=>document.activeElement.id),'board-menu-toggle');
      results.push({key:'resize/mutation/visualViewport/no-overflow',width,height,status:'PASS'});
    }
    assert.deepEqual(await p.evaluate(()=>window.__dialogState()),state,'dialog operations do not touch S/RNG');
    assert.deepEqual(await watchers(p),initialWatchers);await ctx.close();
  }
  assert.deepEqual(errors,[]);console.log(results.length+' dialog layout/lifecycle cases PASS; 12 mobile screenshots; S/RNG unchanged');
}catch(e){failure=e;console.error(e.stack);}finally{
  await writeFile(path.join(output,'summary.json'),JSON.stringify({engine,PASS:results.length,FAIL:failure?1:0,results,errors,failure:failure?.stack},null,2));
  server.closeAllConnections();server.close();await browser?.close();
  process.exit(failure?1:0);
}
