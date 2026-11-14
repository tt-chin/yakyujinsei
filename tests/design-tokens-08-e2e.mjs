// UI-DESIGN-TOKENS-08 (tasks/DESIGN_SYSTEM_PLAN.md §16.6 T3): the 19 --fs-<px> tokens of -06 became 13 scale steps and the
// component radii 7/9/12px merged into --radius-md/-lg/-xl. The fixed pre-change tree (9d9e781) is served with its old
// tokens overridden to the approved new values (§16.3); with that, every element under the compared roots must have
// equal computed style (41 properties) and an equal box relative to its root, for 4 themes x 3 font sizes x 2
// densities, at 1280 and 390 px, for a pitcher and a fielder. So the only appearance change is the approved mapping
// (layout shifts included). Compared: home (#start); early career with the dice allocation and the board menu open
// (#board, #act, #main-nav); retirement (#board, #log) with an injected rich retirement and a salary-detail link.
// Google Fonts requests are blocked and transitions disabled (web-font timing moves widths, §14.8). After each combo switch
// the snapshot waits two frames: #act's max-height reads --display-sticky-height, which preferences.js sets from a ResizeObserver. Every selector whose
// value changed must match at least one compared element. Harness taken over from design-tokens-06-e2e (§16.6 T4).
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
const baseline=arg('baseline')||'9d9e781',allowWebFonts=process.argv.includes('--allow-web-fonts');

const stats=pos=>pos==='P'?{yr:6,G:150,IP:900,W:60,L:40,SV:3,HLD:10,SO:800,BB:250,H:820,ER:330,AS:3}:{yr:6,G:700,PA:2800,AB:2500,H:720,BB:260,HR:110,RBI:420,SB:40,DEF:5,'2B':130,'3B':10,AS:3};
const hook=pos=>`\nwindow.__dt08={retire:()=>endGame('検証'),rich:()=>{S.honors=Array.from({length:5},(_,i)=>'2030年 日本シリーズ優勝 '+i);S.log=Array.from({length:8},(_,i)=>({y:2026+i,age:16+i,tm:'長い球団名の福岡シーホークス',line:'検証成績',inj:i===1||i===5,st:i<3?null:{G:120,IP:180,W:15,L:5,SV:0,HLD:0,SO:190,BB:40,H:100,ER:40,PA:500,AB:450,BB2:0,HR:20,RBI:70,SB:5,DEF:3,'2B':20,'3B':2,HBP:3,SF:2}}));S.stats={...S.stats,NPB:Object.assign({},S.stats.NPB||{},${JSON.stringify(stats(pos))})};S.intlCount=2;S.intlStat={G:5,IP:10,W:1,SV:0,SO:12,ER:3,AB:20,H:6,PA:22,HR:1,RBI:4};S.removed=['旧特性'];Object.assign(S.traits,{legend:true,genius:true,mrteam:true});S.mrTeamName='福岡シーホークス';}};`;
// §16.3: the old tokens whose value changed, set to the new value on the old side only.
const MAPPED={'--fs-10-5':'calc(11px * var(--font-scale,1))','--fs-12-5':'calc(12px * var(--font-scale,1))','--fs-13-5':'calc(14px * var(--font-scale,1))','--fs-14-5':'calc(14px * var(--font-scale,1))','--fs-17':'calc(16px * var(--font-scale,1))','--fs-22':'calc(20px * var(--font-scale,1))','--radius-link':'8px','--radius-die':'10px','--radius-menu':'14px'};
const OLD_AS_NEW='\n:root{'+Object.entries(MAPPED).map(([k,v])=>k+':'+v+';').join('')+'}\n';
const server=createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost'),m=u.pathname.match(/^\/(old|new)-(P|IF)\//);if(!m)throw Error('route');
  const rel=decodeURIComponent(u.pathname.slice(m[0].length))||'index.html';if(rel.includes('..'))throw Error('path');
  if(rel==='favicon.ico'){res.writeHead(204);return res.end();}
  let body=m[1]==='old'?execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:30e6}):await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js')body=body.toString()+hook(m[2]);
  if(m[1]==='old'&&rel==='styles/base.css')body=body.toString()+OLD_AS_NEW;
  const type={js:'text/javascript',css:'text/css',html:'text/html',png:'image/png',webp:'image/webp',svg:'image/svg+xml',woff2:'font/woff2'}[rel.split('.').pop()]||'application/octet-stream';
  res.writeHead(200,{'content-type':type+'; charset=utf-8'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true});

const PROPS=['font-size','font-family','font-weight','letter-spacing','line-height','color','background-color','border-top-color','border-top-width','border-top-style','border-right-width','border-bottom-width','border-left-width','border-left-color','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left','row-gap','column-gap','display','flex-grow','flex-shrink','flex-basis','flex-wrap','text-align','white-space','vertical-align','text-decoration-line','box-shadow','opacity','width','height'];
// The selectors whose value changed (§16.3); each must match a compared element on the new side.
const RULES=['#start .sub','.seg button','#bd-name','.bd-cell b','#bd-team','.statline','.lamp','#main-nav button','.abrow .nm','.abrow .progress','.die','#board-menu-panel','.salary-detail-link'];
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
    for(const v of ['old','new']){const p=pages[v];await p.mouse.move(0,0);await p.evaluate(c=>{document.activeElement?.blur?.();const r=document.documentElement;r.dataset.theme=c.theme;r.dataset.fontSize=c.fontSize;r.dataset.density=c.density;return document.fonts.ready.then(()=>new Promise(res=>requestAnimationFrame(()=>requestAnimationFrame(()=>res(0)))));},c);s[v]=await snap(p,roots);}
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
    // Early career: click the first enabled choice until the dice allocation shows, then open the board menu.
    const clicks={};
    for(const v of ['old','new']){const p=pages[v];
      await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();
      clicks[v]=await p.evaluate(async()=>{for(let i=0;i<40;i++){if(document.querySelector('#dice .die')&&document.querySelector('#act .abrow .nm'))return i;const b=[...document.querySelectorAll('#act button:not([disabled])')].find(x=>x.offsetParent);if(!b)break;b.click();await new Promise(r=>setTimeout(r,60));}throw Error('dice allocation not reached');});
      await p.locator('#board-menu-toggle').click();await p.locator('#board-menu-panel').waitFor();
    }
    assert.equal(clicks.new,clicks.old,`early career ${pos}/${width} click count`);
    await compare(pages,`early ${pos}/${width}`,['#board','#act','#main-nav']);
    for(const v of ['old','new']){const p=pages[v];
      await p.locator('#board-menu-toggle').click();await p.locator('#board-menu-panel').waitFor({state:'hidden'});
      await p.evaluate(()=>{window.__dt08.rich();window.__dt08.retire();document.getElementById('bd-tj').textContent='TJ 1回';});
      // Force the manual replay-URL fallback: no Web Share, clipboard and execCommand both fail.
      await p.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('copy');}}});document.execCommand=()=>false;});
      await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor();await p.locator('#sh-url').click();await p.locator('#sh-url-status input').waitFor();
    }
    // career-contract.js renders the salary-detail link only in pro contract cards; inject one at the end of #log.
    for(const p of Object.values(pages))await p.evaluate(()=>{const b=document.createElement('button');b.type='button';b.className='salary-detail-link';b.textContent='内訳を見る';document.getElementById('log').append(b);});
    await compare(pages,`career ${pos}/${width}`,['#board','#log']);
    for(const p of Object.values(pages))await p.context().close();
    console.log(`PASS-so-far ${pos}/${width}: ${compared} element x combo comparisons, ${diffs.length} differences`);
  }
  for(const d of diffs.slice(0,20))console.error(d);
  assert.equal(diffs.length,0,`computed style / layout differs from ${baseline} (${diffs.length})`);
  const missed=RULES.filter(r=>!hits[r]);assert.deepEqual(missed,[],'changed selectors that matched no compared element');
  assert.deepEqual(errors,[],'Console or page errors');
  console.log(`PASS design-tokens-08: ${compared} element x combo comparisons vs ${baseline} with the approved mapping, 0 differences; ${RULES.length} changed selectors all matched (${RULES.map(r=>r+' '+hits[r]).join(', ')})`);
}catch(error){failure=error;console.error(error);}
finally{
  server.closeAllConnections();server.close();
  await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
  process.exit(failure?1:0);
}
