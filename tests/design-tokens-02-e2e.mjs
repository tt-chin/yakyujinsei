// UI-DESIGN-TOKENS-02 (tasks/DESIGN_SYSTEM_PLAN.md §8 T4): computed styles of the class-based team
// badge and retirement trait tags against the pre-change inline styles, in all four themes.
// UI-DESIGN-TOKENS-05 (§13 T4): the trait tag colors are derived color-mix() tokens in every theme, so their
// color properties must equal the tests/support/theme-colors.mjs values (±1/255); every other property, and the
// badges and the plain/mrteam tags, still equal the old inline styles.
// The new markup equals the production output (career-presenter.test, design-tokens-02.test).
// --shots=<dir> also writes one sample screenshot per theme and viewport for visual review.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {themeColors,toByte} from './support/theme-colors.mjs';
import {parseComputedColor} from '../docs/src/ui/share-image.js';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');

const index=(await readFile(path.join(root,'docs/index.html'),'utf8'));
const links=[...index.matchAll(/<link rel="stylesheet" href="(\.\/styles\/[^"]+)">/g)].map(m=>m[0]);
assert.ok(links.length>=10&&links.some(l=>l.includes('base.css'))&&links.some(l=>l.includes('themes.css')));
const oldDot=bg=>`<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${bg};margin-right:6px;vertical-align:middle;box-shadow:0 0 2px rgba(0,0,0,0.2);"></span>`;
const oldLabel=(color,badge)=>`<span style="color:${color}; ${badge?'background:#ffffff; padding:2px 8px; border-radius:6px; box-shadow:0 2px 4px rgba(0,0,0,0.4);':''} font-weight:900;">球団</span>`;
const badges={
  colored:[oldDot('#AA0000')+oldLabel('#AA0000',true),'<span class="team-badge-dot" style="--team-color:#AA0000"></span><span class="team-name team-badge" style="--team-color:#AA0000">球団</span>'],
  white:[oldDot('#cccccc')+oldLabel('#000000',true),'<span class="team-badge-dot is-white"></span><span class="team-name team-badge is-white">球団</span>'],
  plain:[oldLabel('var(--amber)',false),'<span class="team-name">球団</span>'],
};
const tags={
  standard:['','tag'],
  legend:['background:#fff7dc;border-color:#c79520;color:#795b00','tag tag-legend'],
  goldcloth:['background:#fffbe0;border-color:#c5a800;color:#6f6000','tag tag-goldcloth'],
  genius:['background:#f3f5f8;border-color:#9aa5b5;color:#4c5868','tag tag-genius'],
  mrteam:['background:#ffffff;border-color:#AA0000;color:#AA0000','tag tag-mrteam" style="--team-color:#AA0000'],
  negative:['background:#fff0f0;border-color:#c0392b;color:#a71930','tag tag-negative'],
  removed:['text-decoration:line-through;opacity:.4;color:#8a8a8a;border-color:#4a4a4a','tag tag-removed'],
};
const themeList=['standard','classic','night','scoreboard'];
const tagTokens={legend:'tag-legend',goldcloth:'tag-goldcloth',genius:'tag-genius',negative:'tag-negative',removed:'tag-removed'};
const colors=themeColors(await readFile(path.join(root,'docs/styles/themes.css'),'utf8'));
const near=(computed,want,label)=>{const got=parseComputedColor(computed);assert.ok(got,`${label}: unparsed ${computed}`);
  assert.ok(got.rgb.every((v,i)=>Math.abs(v-toByte(want.rgb[i]))<=1)&&Math.abs(got.alpha-want.alpha)<=1/255,`${label}: ${computed} vs ${want.rgb.map(toByte)}/${want.alpha}`);};
const page=`<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${links.join('')}</head><body><div id="app">
<div id="board"><div id="bd-top"><div id="bd-name">選手</div><div id="bd-team"></div></div></div>
<div id="log"><div class="card"><h4>キャリアプロフィール</h4>特性：<span id="tags"></span></div>
<div class="card"><h4>球団徽章</h4>${Object.values(badges).map(([,n])=>`<div class="sample-team" style="margin:6px 0">${n}</div>`).join('')}</div></div></div></body></html>`;

const server=createServer(async(req,res)=>{try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'');
  if(rel==='favicon.ico'){res.writeHead(204);return res.end();}
  if(rel==='__design-tokens-02.html'){res.writeHead(200,{'content-type':'text/html; charset=utf-8'});return res.end(page);}
  if(rel.includes('..'))throw Error('path');
  const type={css:'text/css; charset=utf-8',webp:'image/webp',png:'image/png',svg:'image/svg+xml',woff2:'font/woff2'}[rel.split('.').pop()]||'application/octet-stream';
  const body=await readFile(path.join(root,'docs',rel));res.writeHead(200,{'content-type':type});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true}),errors=[];
const props=['color','background-color','border-top-color','border-left-color','border-top-style','padding-top','padding-left','border-top-left-radius','box-shadow','font-weight','font-size','font-family','display','width','height','margin-right','vertical-align','opacity','text-decoration-line'];
let checks=0,failure;
try{
  for(const width of [1280,390]){
    const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();
    p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
    await p.goto(local+'/__design-tokens-02.html');
    for(const theme of themeList){
      await p.evaluate(t=>{document.documentElement.dataset.theme=t;},theme);
      for(const [name,[oldHtml,newHtml]] of Object.entries(badges)){
        const [before,after]=await p.evaluate(({oldHtml,newHtml,props})=>{
          const team=document.getElementById('bd-team'),read=()=>[...team.children].map(el=>{const cs=getComputedStyle(el);return Object.fromEntries(props.map(k=>[k,cs.getPropertyValue(k)]));});
          team.innerHTML=oldHtml;const b=read();team.innerHTML=newHtml;return [b,read()];
        },{oldHtml,newHtml,props});
        assert.ok(before.length>=1);assert.deepEqual(after,before,`${width} ${theme} badge ${name}`);checks++;
      }
      for(const [name,[oldStyle,newClass]] of Object.entries(tags)){
        const [before,after]=await p.evaluate(({oldStyle,newClass,props})=>{
          const box=document.getElementById('tags'),read=()=>{const cs=getComputedStyle(box.firstElementChild);return Object.fromEntries(props.map(k=>[k,cs.getPropertyValue(k)]));};
          box.innerHTML=`<span class="tag" style="${oldStyle}">特性</span>`;const b=read();box.innerHTML=`<span class="${newClass}">特性</span>`;return [b,read()];
        },{oldStyle,newClass,props});
        const token=tagTokens[name];
        if(token){
          if(theme==='night'||theme==='scoreboard')assert.notDeepEqual(after.color,before.color,`${width} ${theme} tag ${name} text must follow the theme`);
          const {color,'background-color':_b,'border-top-color':_t,'border-left-color':_l,...rest}=after,{color:c0,'background-color':_b0,'border-top-color':_t0,'border-left-color':_l0,...rest0}=before;
          assert.deepEqual(rest,rest0,`${width} ${theme} tag ${name} non-color properties`);
          const parts={color:'text','border-top-color':'edge','border-left-color':'edge',...(name==='removed'?{}:{'background-color':'bg'})};
          for(const [prop,part] of Object.entries(parts))near(after[prop],colors.color(theme,`--${token}-${part}`),`${width} ${theme} tag ${name} ${prop}`);
          if(name==='removed')assert.equal(after['background-color'],before['background-color'],`${width} ${theme} tag removed background`);
        }else assert.deepEqual(after,before,`${width} ${theme} tag ${name}`);
        checks++;
      }
      if(arg('shots')){
        await mkdir(arg('shots'),{recursive:true});
        await p.evaluate(({tags})=>{
          document.getElementById('bd-team').innerHTML='<span class="team-badge-dot" style="--team-color:#AA0000"></span><span class="team-name team-badge" style="--team-color:#AA0000">球団</span>';
          document.getElementById('tags').innerHTML=Object.entries(tags).map(([n,[,c]])=>`<span class="${c}">${n}</span>`).join(' ');
        },{tags});
        await p.evaluate(()=>Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))));
        await p.screenshot({path:path.join(arg('shots'),`design-tokens-02-${theme}-${width}.png`),fullPage:true});
      }
    }
    await ctx.close();
  }
  assert.deepEqual(errors,[]);
  assert.equal(checks,2*themeList.length*(Object.keys(badges).length+Object.keys(tags).length));
  console.log(`design-tokens-02-e2e: ${checks} computed-style checks PASS (2 viewports x 4 themes).`);
}catch(e){failure=e;}
finally{await browser.close();server.close();}
if(failure)throw failure;
