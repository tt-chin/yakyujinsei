// UI-DESIGN-TOKENS-07 (tasks/DESIGN_SYSTEM_PLAN.md §15 T4): the share image waits for its web fonts before measuring and
// drawing, never blocks on a failed or slow font, and draws with the --sans/--mono token families. No network is used:
// the Google Fonts stylesheet is answered with fake @font-face rules whose files are held, refused (404) or never answered.
//  1 held then refused: no image and the button still says 作成中 while the files are held; the image appears after the
//    refusal, and the button turns ✅ only once the image is in place.
//  2 never answered: the image appears after the 3 s timeout; a second render in the same session does not wait again.
//  3 empty stylesheet: the image appears at once; every fillText font uses the --sans or --mono family list.
//  4 two renders of one container while held: only the newer render writes the container.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');

const hook=`\nwindow.__dt07={
 retire:()=>endGame('UI-DESIGN-TOKENS-07 fixture'),
 tokens:()=>{const s=getComputedStyle(document.documentElement);return {sans:s.getPropertyValue('--sans'),mono:s.getPropertyValue('--mono')};},
 watch:()=>{const out=document.querySelector('#sh-out'),btn=document.querySelector('#sh-img'),log=[];window.__dt07.log=log;
  new MutationObserver(()=>log.push({text:btn.textContent,img:!!out.querySelector('img')})).observe(btn,{childList:true,characterData:true,subtree:true});},
 fonts:()=>{const proto=CanvasRenderingContext2D.prototype,fill=proto.fillText,fonts=[];window.__dt07.fills=fonts;
  proto.fillText=function(t,...r){fonts.push(this.font);return fill.call(this,t,...r);};},
 render:async()=>{const out=document.createElement('div');document.body.appendChild(out);const t0=performance.now();await shareImage([],out);
  const ms=performance.now()-t0,img=!!out.querySelector('img');out.remove();return {ms,img};},
 genStart:()=>{const out=document.createElement('div'),texts=[],proto=CanvasRenderingContext2D.prototype,fill=proto.fillText;document.body.appendChild(out);let inserts=0;
  new MutationObserver(m=>{for(const r of m)for(const n of r.addedNodes)if(n.nodeName==='IMG')inserts++;}).observe(out,{childList:true});
  proto.fillText=function(t,...r){texts.push(String(t));return fill.call(this,t,...r);};
  window.__dt07.gen={out,texts,restore:()=>{proto.fillText=fill;},inserts:()=>inserts,done:Promise.all([shareImage(['A世代'],out),shareImage(['B世代'],out)])};
  return !!out.querySelector('img');},
 genEnd:async()=>{const g=window.__dt07.gen;try{await g.done;}finally{g.restore();}return {inserts:g.inserts(),texts:g.texts,img:!!g.out.querySelector('img')};}
};`;
const server=createServer(async(req,res)=>{try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname.slice(1))||'index.html';
  if(rel.includes('..'))throw Error('path');
  if(rel==='favicon.ico'){res.writeHead(204);return res.end();}
  let body=await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js')body=body.toString()+hook;
  const type={js:'text/javascript',css:'text/css',html:'text/html',png:'image/png',webp:'image/webp',svg:'image/svg+xml'}[rel.split('.').pop()]||'application/octet-stream';
  res.writeHead(200,{'content-type':type+'; charset=utf-8'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`;

const face=(family,weight,file)=>`@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};src:url(https://fonts.gstatic.com/dt07/${file}.woff2) format('woff2');}`;
const fakeCss=[face('Noto Sans JP',400,'noto-400'),face('Noto Sans JP',700,'noto-700'),face('IBM Plex Mono',500,'plex-500'),face('IBM Plex Mono',700,'plex-700')].join('\n');
const families=list=>list.split(',').map(f=>f.trim().replace(/^["']|["']$/g,'')).filter(Boolean);
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
let checks=0;
// files: 'hold' (held until release(), then 404), 'never' (never answered); css:false answers the stylesheet with nothing.
async function open({files='hold',css=true}={}){
  const ctx=await browser.newContext({viewport:{width:1280,height:900}}),p=await ctx.newPage(),errors=[],held=[];let released=false;
  p.on('pageerror',e=>errors.push('pageerror '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource: the server responded with a status of 404/.test(m.text()))errors.push(m.text());});
  await ctx.route(/fonts\.googleapis\.com/,r=>r.fulfill({status:200,contentType:'text/css',body:css?fakeCss:''}));
  await ctx.route(/fonts\.gstatic\.com/,r=>{if(files==='never')return;if(released)return r.fulfill({status:404,body:''});held.push(r);});
  await p.goto(local+'/?seed=design-tokens-07',{waitUntil:'domcontentloaded'}); // held font files would block the load event
  await p.waitForFunction(()=>window.__dt07&&!document.querySelector('#btn-start').disabled);
  await p.locator('#seg-pos [data-v="P"]').click();await p.locator('#btn-start').click();
  await p.evaluate(()=>window.__dt07.retire());await p.locator('#sh-img').waitFor();
  const release=async()=>{released=true;for(const r of held.splice(0))await r.fulfill({status:404,body:''});};
  return {ctx,p,errors,held,release};
}
try{
  { // 1 held then refused
    const {ctx,p,errors,held,release}=await open();
    await p.evaluate(()=>window.__dt07.watch());
    await p.locator('#sh-img').click();await p.waitForTimeout(800);
    assert.ok(held.length>0,'font files are requested and held');
    assert.equal(await p.locator('#sh-out img').count(),0,'no image while the font files are held');
    assert.match(await p.locator('#sh-img').innerText(),/作成中/,'button still says 作成中 while waiting');
    assert.equal(await p.locator('#sh-img').isDisabled(),true,'button disabled while waiting');
    await release();
    await p.locator('#sh-out img').waitFor({timeout:5000});
    await p.waitForFunction(()=>/✅/.test(document.querySelector('#sh-img').textContent));
    const log=await p.evaluate(()=>window.__dt07.log),done=log.filter(e=>/✅/.test(e.text));
    assert.ok(done.length>0&&done.every(e=>e.img),'button turns ✅ only after the image is in place: '+JSON.stringify(log));
    assert.deepEqual(errors,[]);await ctx.close();checks++;
    console.log('PASS 1 held fonts: image waits for them and appears after the refusal');
  }
  { // 2 never answered
    const {ctx,p,errors}=await open({files:'never'});
    const t0=Date.now();await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor({timeout:12000});const ms=Date.now()-t0;
    assert.ok(ms>=2800&&ms<10000,'first render waits for the 3 s timeout: '+ms+' ms'); // upper bound leaves headroom for loaded CI runners
    const second=await p.evaluate(()=>window.__dt07.render());
    assert.ok(second.img&&second.ms<1000,'second render does not wait again: '+JSON.stringify(second));
    assert.deepEqual(errors,[]);await ctx.close();checks++;
    console.log(`PASS 2 hung fonts: first image after ${ms} ms, second after ${Math.round(second.ms)} ms`);
  }
  { // 3 empty stylesheet + font families
    const {ctx,p,errors}=await open({css:false});
    await p.evaluate(()=>window.__dt07.fonts());
    const t0=Date.now();await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor({timeout:5000});const ms=Date.now()-t0;
    assert.ok(ms<1500,'no font faces: the image appears at once: '+ms+' ms');
    const tokens=await p.evaluate(()=>window.__dt07.tokens()),fills=await p.evaluate(()=>window.__dt07.fills);
    const sans=families(tokens.sans),mono=families(tokens.mono);
    assert.equal(sans[0],'Noto Sans JP');assert.equal(mono[0],'IBM Plex Mono');
    assert.ok(fills.length>20,'fillText calls recorded: '+fills.length);
    const kinds=fills.map(f=>{const list=families(f.replace(/^.*?\d+(?:\.\d+)?px\s*/,''));return JSON.stringify(list)===JSON.stringify(sans)?'sans':JSON.stringify(list)===JSON.stringify(mono)?'mono':f;});
    assert.deepEqual(kinds.filter(k=>k!=='sans'&&k!=='mono'),[],'every fillText font is a token family list');
    assert.ok(kinds.includes('sans')&&kinds.includes('mono'),'both token families are used');
    assert.deepEqual(errors,[]);await ctx.close();checks++;
    console.log(`PASS 3 empty stylesheet: image after ${ms} ms, ${fills.length} fills use --sans/--mono`);
  }
  { // 4 newer render wins
    const {ctx,p,errors,release}=await open();
    assert.equal(await p.evaluate(()=>window.__dt07.genStart()),false,'both renders wait for the held fonts');
    await p.waitForTimeout(300);await release();
    const g=await p.evaluate(()=>window.__dt07.genEnd());
    assert.ok(g.img,'the container has an image');
    assert.equal(g.inserts,1,'only one render writes the container');
    assert.ok(g.texts.includes('★ B世代')&&!g.texts.includes('★ A世代'),'the newer render is the one drawn');
    assert.deepEqual(errors,[]);await ctx.close();checks++;
    console.log('PASS 4 two renders of one container: only the newer one draws');
  }
}finally{await browser.close();server.close();}
assert.equal(checks,4);
console.log('design-tokens-07-e2e: 4 PASS');
