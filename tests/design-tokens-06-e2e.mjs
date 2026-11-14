// UI-DESIGN-TOKENS-06 (tasks/DESIGN_SYSTEM_PLAN.md §14 T2): font-size / radius / shadow tokens and the move of fixed
// inline layout values into CSS rules leave every element's computed style and layout unchanged.
// The fixed pre-change tree (d5433e2) and the current tree are opened side by side; for every element under #start,
// #board and #log, 41 computed properties plus the box relative to its root must be equal, for 4 themes x 3 font
// sizes x 2 densities, at 1280 and 390 px, for a pitcher and a fielder. The career side uses an injected rich
// retirement (league stats, amateur rows with injuries, international stats, share image, manual replay URL input).
// Google Fonts requests are blocked and transitions disabled: web-font load timing alone moves widths by 0.02-0.5 px
// (§14.8), also old-vs-old. Every new class / id rule must match at least one compared element.
// --allow-web-fonts keeps the font requests (diagnostic only; not a pass condition).
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const baseline=arg('baseline')||'d5433e2',allowWebFonts=process.argv.includes('--allow-web-fonts');

const stats=pos=>pos==='P'?{yr:6,G:150,IP:900,W:60,L:40,SV:3,HLD:10,SO:800,BB:250,H:820,ER:330,AS:3}:{yr:6,G:700,PA:2800,AB:2500,H:720,BB:260,HR:110,RBI:420,SB:40,DEF:5,'2B':130,'3B':10,AS:3};
const hook=pos=>`\nwindow.__dt06={retire:()=>endGame('検証'),rich:()=>{S.honors=Array.from({length:5},(_,i)=>'2030年 日本シリーズ優勝 '+i);S.log=Array.from({length:8},(_,i)=>({y:2026+i,age:16+i,tm:'長い球団名の福岡シーホークス',line:'検証成績',inj:i===1||i===5,st:i<3?null:{G:120,IP:180,W:15,L:5,SV:0,HLD:0,SO:190,BB:40,H:100,ER:40,PA:500,AB:450,BB2:0,HR:20,RBI:70,SB:5,DEF:3,'2B':20,'3B':2,HBP:3,SF:2}}));S.stats={...S.stats,NPB:Object.assign({},S.stats.NPB||{},${JSON.stringify(stats(pos))})};S.intlCount=2;S.intlStat={G:5,IP:10,W:1,SV:0,SO:12,ER:3,AB:20,H:6,PA:22,HR:1,RBI:4};S.removed=['旧特性'];Object.assign(S.traits,{legend:true,genius:true,mrteam:true});S.mrTeamName='福岡シーホークス';}};`;
const server=createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost'),m=u.pathname.match(/^\/(old|new)-(P|IF)\//);if(!m)throw Error('route');
  const rel=decodeURIComponent(u.pathname.slice(m[0].length))||'index.html';if(rel.includes('..'))throw Error('path');
  if(rel==='favicon.ico'){res.writeHead(204);return res.end();}
  let body=m[1]==='old'?execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:30e6}):await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js')body=body.toString()+hook(m[2]);
  const type={js:'text/javascript',css:'text/css',html:'text/html',png:'image/png',webp:'image/webp',svg:'image/svg+xml',woff2:'font/woff2'}[rel.split('.').pop()]||'application/octet-stream';
  res.writeHead(200,{'content-type':type+'; charset=utf-8'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true});

const PROPS=['font-size','font-family','font-weight','letter-spacing','line-height','color','background-color','border-top-color','border-top-width','border-top-style','border-right-width','border-bottom-width','border-left-width','border-left-color','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left','row-gap','column-gap','display','flex-grow','flex-shrink','flex-basis','flex-wrap','text-align','white-space','vertical-align','text-decoration-line','box-shadow','opacity','width','height'];
// The rules added by -06 (DESIGN_SYSTEM_PLAN §14.3 D3); each must match a compared element on the new side.
const RULES=['#app-version','#btn-start','#seed-show','#seed-re','.home-credit','.home-credit a','#bd-tj','.card p.retire-league','table.fin .cell-nowrap','table.fin .cell-left','table.fin .ama-line','.card h4.intl-heading','.share-actions','#sh-img','#sh-url','#sh-save','#sh-dl','#sh-out','#sh-url-status .replay-url-input','.share-image-preview','.share-image-actions','.statline.share-image-hint'];
const snap=(page,roots)=>page.evaluate(([roots,PROPS])=>{const out=[];for(const r of roots){const rootEl=document.querySelector(r);if(!rootEl)throw Error('missing root '+r);const R=rootEl.getBoundingClientRect();for(const el of [rootEl,...rootEl.querySelectorAll('*')]){const cs=getComputedStyle(el),b=el.getBoundingClientRect();out.push({tag:el.tagName,id:el.id,rect:[b.x-R.x,b.y-R.y,b.width,b.height].map(v=>Math.round(v*100)/100),s:PROPS.map(k=>cs.getPropertyValue(k))});}}return out;},[roots,PROPS]);
const combos=[];for(const theme of ['standard','night','classic','scoreboard'])for(const fontSize of ['small','standard','large'])for(const density of ['standard','compact'])combos.push({theme,fontSize,density});
const errors=[],hits=Object.fromEntries(RULES.map(r=>[r,0]));let compared=0,diffs=[];

async function open(variant,pos,width){
  const context=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500});
  if(!allowWebFonts)await context.route(/fonts\.(googleapis|gstatic)\.com/,route=>route.abort());
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(`${variant} ${pos}/${width}: ${e.message}`));
  // The blocked font requests log a load error whose location is the font URL; every other console error fails.
  page.on('console',m=>{if(m.type()==='error'&&!/^https:\/\/fonts\.(googleapis|gstatic)\.com\//.test(m.location()?.url||''))errors.push(`${variant} ${pos}/${width}: ${m.text()}`);});
  await page.addInitScript(()=>document.addEventListener('DOMContentLoaded',()=>{const st=document.createElement('style');st.textContent='*,*::before,*::after{transition:none!important;animation:none!important}';document.head.append(st);}));
  await page.goto(`${local}/${variant}-${pos}/?seed=design-tokens-06`);await page.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
  return page;
}
async function compare(pages,label,roots){
  for(const c of combos){
    const s={};
    for(const v of ['old','new']){const p=pages[v];await p.mouse.move(0,0);await p.evaluate(c=>{document.activeElement?.blur?.();const r=document.documentElement;r.dataset.theme=c.theme;r.dataset.fontSize=c.fontSize;r.dataset.density=c.density;return document.fonts.ready.then(()=>0);},c);s[v]=await snap(p,roots);}
    assert.ok(s.old.length>5,label+' compared elements');assert.equal(s.new.length,s.old.length,label+' element count');
    for(let i=0;i<s.old.length;i++){const a=s.old[i],b=s.new[i],at=`${label} ${c.theme}/${c.fontSize}/${c.density} #${i} ${a.tag}${a.id?'#'+a.id:''}`;
      assert.equal(b.tag,a.tag,at+' tag');compared++;
      if(JSON.stringify(a.rect)!==JSON.stringify(b.rect))diffs.push(`${at} rect ${a.rect} -> ${b.rect}`);
      a.s.forEach((x,k)=>{if(x!==b.s[k])diffs.push(`${at} ${PROPS[k]} ${x} -> ${b.s[k]}`);});}
  }
  const counted=await pages.new.evaluate(([rules,roots])=>rules.map(r=>roots.reduce((n,q)=>{const el=document.querySelector(q);return n+(el.matches(r)?1:0)+el.querySelectorAll(r).length;},0)),[RULES,roots]);
  RULES.forEach((r,i)=>hits[r]+=counted[i]);
}
let failure=null;
try{
  for(const width of [1280,390])for(const pos of ['P','IF']){
    const pages={old:await open('old',pos,width),new:await open('new',pos,width)};
    await compare(pages,`home ${pos}/${width}`,['#start']);
    for(const v of ['old','new']){const p=pages[v];
      await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();
      await p.evaluate(()=>{window.__dt06.rich();window.__dt06.retire();document.getElementById('bd-tj').textContent='TJ 1回';});
      // Force the manual replay-URL fallback: no Web Share, clipboard and execCommand both fail.
      await p.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('copy');}}});document.execCommand=()=>false;});
      await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor();await p.locator('#sh-url').click();await p.locator('#sh-url-status input').waitFor();
    }
    await compare(pages,`career ${pos}/${width}`,['#board','#log']);
    for(const p of Object.values(pages))await p.context().close();
    console.log(`PASS-so-far ${pos}/${width}: ${compared} element x combo comparisons, ${diffs.length} differences`);
  }
  for(const d of diffs.slice(0,20))console.error(d);
  assert.equal(diffs.length,0,`computed style / layout differs from ${baseline} (${diffs.length})`);
  const missed=RULES.filter(r=>!hits[r]);assert.deepEqual(missed,[],'new -06 rules that matched no compared element');
  assert.deepEqual(errors,[],'Console or page errors');
  console.log(`PASS design-tokens-06: ${compared} element x combo comparisons vs ${baseline}, 0 differences; ${RULES.length} new rules all matched (${RULES.map(r=>r+' '+hits[r]).join(', ')})`);
}catch(error){failure=error;console.error(error);}
finally{
  server.closeAllConnections();server.close();
  await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
  process.exit(failure?1:0);
}
