// UI-DESIGN-TOKENS-09 (tasks/DESIGN_SYSTEM_PLAN.md §17.8 T2): px margin/padding/gap became the 12 --space-* steps (§17.3
// W8: nearest step, ties go down; W12 = A: a declaration with calc()/var()/env(), auto or a negative value stays whole).
// The fixed pre-change tree (f8afd8e) is served with every such px literal in its stylesheets rewritten to the mapped px
// value (an independent rewrite from the approved table, not the tokens); with that, every element under the compared
// roots must have equal computed style (41 properties) and an equal box relative to its root, for 4 themes x 3 font sizes
// x 2 densities. Widths 1280 and 390 (pitcher, fielder) and 360 (pitcher; the max-width:360px nav rule). States: home;
// early career (#board, #act, #act-toggle, #main-nav); player 2 tabs and career 4 tabs; the desktop overview (1280);
// the help dialog; display preferences; salary detail; retirement (#board, #log). Rows a fresh career lacks are injected
// identically on both sides. Every changed rule must match at least one compared element; on failure the rules whose
// elements showed a spacing difference are listed. Google Fonts are blocked, transitions disabled, and each combo switch
// waits two frames (ResizeObserver-written --display-sticky-height). Harness taken over from design-tokens-08-e2e (§17.8 T3).
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
const baseline=arg('baseline')||'f8afd8e',allowWebFonts=process.argv.includes('--allow-web-fonts');

const stats=pos=>pos==='P'?{yr:6,G:150,IP:900,W:60,L:40,SV:3,HLD:10,SO:800,BB:250,H:820,ER:330,AS:3}:{yr:6,G:700,PA:2800,AB:2500,H:720,BB:260,HR:110,RBI:420,SB:40,DEF:5,'2B':130,'3B':10,AS:3};
const hook=pos=>`\nwindow.__dt09={retire:()=>endGame('検証'),rich:()=>{S.honors=Array.from({length:5},(_,i)=>'2030年 日本シリーズ優勝 '+i);S.log=Array.from({length:8},(_,i)=>({y:2026+i,age:16+i,tm:'長い球団名の福岡シーホークス',line:'検証成績',inj:i===1||i===5,st:i<3?null:{G:120,IP:180,W:15,L:5,SV:0,HLD:0,SO:190,BB:40,H:100,ER:40,PA:500,AB:450,BB2:0,HR:20,RBI:70,SB:5,DEF:3,'2B':20,'3B':2,HBP:3,SF:2}}));S.stats={...S.stats,NPB:Object.assign({},S.stats.NPB||{},${JSON.stringify(stats(pos))})};S.intlCount=2;S.intlStat={G:5,IP:10,W:1,SV:0,SO:12,ER:3,AB:20,H:6,PA:22,HR:1,RBI:4};S.removed=['旧特性'];Object.assign(S.traits,{legend:true,genius:true,mrteam:true});S.mrTeamName='福岡シーホークス';}};`;
const MAP09={3:2,5:4,7:6,9:8,11:10,14:12,18:16,22:20,26:24,28:24,30:32,36:32};
const SP=/^(margin|padding|gap|row-gap|column-gap)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$/;
// §17.3/§17.4: rewrite each px literal of a pure px/0 spacing declaration to its mapped value; whole declarations with
// '(' (calc/var/env), auto or a negative value are left as they are.
function rewrite(css){return css.replace(/([{;]\s*)([a-z-]+)(\s*:\s*)([^;{}]+)/g,(all,pre,prop,colon,val)=>{
  if(!SP.test(prop)||/\(|(^|\s)-\d|\bauto\b/.test(val))return all;
  return pre+prop+colon+val.replace(/(^|\s)(\d+)px(?=\s|$|!)/g,(t,sp,px)=>sp+(MAP09[px]??px)+'px');});}
const server=createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost'),m=u.pathname.match(/^\/(old|new)-(P|IF)\//);if(!m)throw Error('route');
  const rel=decodeURIComponent(u.pathname.slice(m[0].length))||'index.html';if(rel.includes('..'))throw Error('path');
  if(rel==='favicon.ico'){res.writeHead(204);return res.end();}
  let body=m[1]==='old'?execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:30e6}):await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js')body=body.toString()+hook(m[2]);
  if(m[1]==='old'&&rel.startsWith('styles/')&&rel.endsWith('.css'))body=rewrite(body.toString());
  const type={js:'text/javascript',css:'text/css',html:'text/html',png:'image/png',webp:'image/webp',svg:'image/svg+xml',woff2:'font/woff2'}[rel.split('.').pop()]||'application/octet-stream';
  res.writeHead(200,{'content-type':type+'; charset=utf-8'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true});

const PROPS=['font-size','font-family','font-weight','letter-spacing','line-height','color','background-color','border-top-color','border-top-width','border-top-style','border-right-width','border-bottom-width','border-left-width','border-left-color','border-top-left-radius','border-top-right-radius','border-bottom-left-radius','border-bottom-right-radius','margin-top','margin-right','margin-bottom','margin-left','padding-top','padding-right','padding-bottom','padding-left','row-gap','column-gap','display','flex-grow','flex-shrink','flex-basis','flex-wrap','text-align','white-space','vertical-align','text-decoration-line','box-shadow','opacity','width','height'];
// The rules whose value changed (§17.4, 36 declarations); each must match a compared element on the new side.
// '@360 ' counts only at 360 px (the max-width:360px copy of the tab-button rule).
const RULES=['.bd-cell','#lamps','.lamp','.btn','.abrow','.contract-yearly-salaries','#start .wrap','#start h1','#start .sub','.field','.field input','.seg button','.seedline','#act-toggle','.salary-detail-dialog h2','.salary-detail-dialog h3','.salary-detail-dialog dl','.salary-detail-dialog ul','.salary-market-components strong','.contract-schedule>div','.salary-detail-link','#btn-start','.home-credit','.browser-save-panel','.information-content','.information-dialog section','.information-dialog button','#desktop-career .ui-data-list','.desktop-overview .ui-panel','#display-preferences fieldset','#main-nav button,#player-tabs button,#career-tabs button','.ui-stat-level','.ui-yearly-table th,.ui-yearly-table td','@360 #main-nav button,#player-tabs button,#career-tabs button'];
const snap=(page,roots)=>page.evaluate(([roots,PROPS,SEL])=>{const out=[];for(const r of roots){const rootEl=document.querySelector(r);if(!rootEl)throw Error('missing root '+r);const R=rootEl.getBoundingClientRect();for(const el of [rootEl,...rootEl.querySelectorAll('*')]){const cs=getComputedStyle(el),b=el.getBoundingClientRect();out.push({tag:el.tagName,id:el.id,rect:[b.x-R.x,b.y-R.y,b.width,b.height].map(v=>Math.round(v*100)/100),s:PROPS.map(k=>cs.getPropertyValue(k)),m:SEL.map((q,i)=>el.matches(q)?i:-1).filter(i=>i>=0)});}}return out;},[roots,PROPS,RULES.map(r=>r.replace(/^@360 /,''))]);
const combos=[];for(const theme of ['standard','night','classic','scoreboard'])for(const fontSize of ['small','standard','large'])for(const density of ['standard','compact'])combos.push({theme,fontSize,density});
const errors=[],hits=Object.fromEntries(RULES.map(r=>[r,0])),observed={};let compared=0,diffs=[];

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
      a.s.forEach((x,k)=>{if(x!==b.s[k]){diffs.push(`${at} ${PROPS[k]} ${x} -> ${b.s[k]}`);if(/^(margin|padding|row-gap|column-gap)/.test(PROPS[k]))for(const ri of a.m){if(RULES[ri].startsWith('@360 ')&&pages.new.viewportSize().width>360)continue;observed[RULES[ri]]=(observed[RULES[ri]]||0)+1;}}});}
  }
  const W=pages.new.viewportSize().width;const counted=await pages.new.evaluate(([rules,roots,W])=>rules.map(r=>{if(r.startsWith('@360 ')){if(W>360)return 0;r=r.slice(5);}return roots.reduce((n,q)=>{const el=document.querySelector(q);if(!el)return n;return n+(el.matches(r)?1:0)+el.querySelectorAll(r).length;},0)}),[RULES,roots,W]);
  RULES.forEach((r,i)=>hits[r]+=counted[i]);
}
let failure=null;
try{
  const dlgFix=()=>{const b=document.getElementById('salary-detail-body');const add=h=>{const d=document.createElement('div');d.dataset.dt09='1';d.innerHTML=h;b.append(d);};
    if(!b.querySelector('h3'))add('<h3>検証</h3>');if(!b.querySelector('dl:not(.income-summary)'))add('<dl><dt>年俸</dt><dd>1000万</dd><dt>出来高</dt><dd>0万</dd></dl>');if(!b.querySelector('ul'))add('<ul><li>検証</li></ul>');
    if(!b.querySelector('.salary-market-components strong'))add('<div class="salary-market-components"><strong>市場評価</strong></div>');if(!b.querySelector('.contract-schedule>div'))add('<div class="contract-schedule"><div>2027年 1000万</div><div>2028年 1100万</div></div>');};
  const viewFix=()=>{for(const [id,html] of [['player-content','<div class="ui-stat-level">検証</div><table class="ui-yearly-table"><tr><th>年</th><td>2026</td></tr></table>'],['career-content','<div class="contract-yearly-salaries"><span>2026</span><span>0万</span></div>']]){const el=document.getElementById(id);if(!el.querySelector('[data-dt09]')){const d=document.createElement('div');d.dataset.dt09='1';d.innerHTML=html;el.append(d);}}};
  for(const width of [1280,390,360])for(const pos of (width===360?['P']:['P','IF'])){
    const pages={old:await open('old',pos,width),new:await open('new',pos,width)};
    if(width!==360)await compare(pages,`home ${pos}/${width}`,['#start']);
    const clicks={};
    for(const v of ['old','new']){const p=pages[v];
      await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();
      clicks[v]=await p.evaluate(async()=>{for(let i=0;i<40;i++){if(document.querySelector('#dice .die')&&document.querySelector('#act .abrow .nm'))return i;const b=[...document.querySelectorAll('#act button:not([disabled])')].find(x=>x.offsetParent);if(!b)break;b.click();await new Promise(r=>setTimeout(r,60));}throw Error('dice allocation not reached');});
    }
    assert.equal(clicks.new,clicks.old,`early career ${pos}/${width} click count`);
    await compare(pages,`early ${pos}/${width}`,['#board','#act','#act-toggle','#main-nav']);
    // Views and tabs (player: ability/traits; career: 4 tabs); fixtures for rows a fresh high-school career lacks.
    for(const [view,tabAttr,tabs] of [['player','data-player-tab',['ability','traits']],['career','data-career-tab',['stats','achievements','contract','yearly']]])for(const tab of tabs){
      for(const p of Object.values(pages)){await p.locator(`#main-nav [data-main-view="${view}"]`).click();await p.locator(`[${tabAttr}="${tab}"]`).click();await p.evaluate(viewFix);}
      await compare(pages,`${view}/${tab} ${pos}/${width}`,['#main-nav',`#view-${view}`]);
    }
    for(const p of Object.values(pages))await p.locator('#main-nav [data-main-view="home"]').click();
    if(width===1280)await compare(pages,`desktop ${pos}/${width}`,['#desktop-player','#desktop-career']);
    if(width!==360){
      // Information dialog (help) and display preferences, opened from the board menu.
      for(const p of Object.values(pages)){await p.locator('#board-menu-toggle').click();await p.locator('#board-help').click();await p.locator('dialog.information-dialog[open]').waitFor();}
      await compare(pages,`information ${pos}/${width}`,['dialog.information-dialog[open]']);
      for(const p of Object.values(pages)){await p.keyboard.press('Escape');await p.locator('dialog.information-dialog[open]').waitFor({state:'detached'}).catch(()=>{});
        await p.locator('#board-menu-toggle').click();await p.locator('#board-preferences').click();await p.locator('#display-preferences').waitFor();}
      await compare(pages,`preferences ${pos}/${width}`,['#display-preferences']);
      for(const p of Object.values(pages)){await p.keyboard.press('Escape');await p.locator('#display-preferences').waitFor({state:'hidden'}).catch(()=>{});
        await p.locator('#salary-detail-trigger').click();await p.locator('#salary-detail-panel').waitFor();await p.evaluate(dlgFix);}
      await compare(pages,`salary ${pos}/${width}`,['#salary-detail-panel']);
      for(const p of Object.values(pages)){await p.locator('#salary-detail-close').click();await p.locator('#salary-detail-panel').waitFor({state:'hidden'});}
      for(const v of ['old','new']){const p=pages[v];
        await p.evaluate(()=>{window.__dt09.rich();window.__dt09.retire();document.getElementById('bd-tj').textContent='TJ 1回';});
        await p.evaluate(()=>{Object.defineProperty(navigator,'share',{configurable:true,value:undefined});Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('copy');}}});document.execCommand=()=>false;});
        await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor();await p.locator('#sh-url').click();await p.locator('#sh-url-status input').waitFor();
      }
      for(const p of Object.values(pages))await p.evaluate(()=>{const b=document.createElement('button');b.type='button';b.className='salary-detail-link';b.textContent='内訳を見る';document.getElementById('log').append(b);});
      await compare(pages,`career ${pos}/${width}`,['#board','#log']);
    }
    for(const p of Object.values(pages))await p.context().close();
    console.log(`PASS-so-far ${pos}/${width}: ${compared} element x combo comparisons, ${diffs.length} differences`);
  }
  for(const d of diffs.slice(0,20))console.error(d);
  if(diffs.length)console.error(`rules whose elements show a spacing difference (${Object.keys(observed).length}/${RULES.length}): `+JSON.stringify(observed));
  assert.equal(diffs.length,0,`computed style / layout differs from ${baseline} (${diffs.length})`);
  const missed=RULES.filter(r=>!hits[r]);assert.deepEqual(missed,[],'changed selectors that matched no compared element');
  assert.deepEqual(errors,[],'Console or page errors');
  console.log(`PASS design-tokens-09: ${compared} element x combo comparisons vs ${baseline} with the approved mapping, 0 differences; ${RULES.length} changed selectors all matched (${RULES.map(r=>r+' '+hits[r]).join(', ')})`);
}catch(error){failure=error;console.error(error);}
finally{
  server.closeAllConnections();server.close();
  await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
  process.exit(failure?1:0);
}
