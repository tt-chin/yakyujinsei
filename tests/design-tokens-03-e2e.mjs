// UI-DESIGN-TOKENS-03 (tasks/DESIGN_SYSTEM_PLAN.md §10 T4): the share image reads its colors from the CSS
// theme tokens. Against the pre-change tree (9956ca3) the PNG is byte-identical in standard and classic and
// changes in night and scoreboard; the probe-read colors equal the hex tokens written in themes.css.
// The VERSION footer text is skipped on both sides (the release bump changes it). --shots=<dir> writes the
// before/after PNGs of every theme and viewport.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const baseline=arg('baseline')||'9956ca3';

const special=['legend','taiwan','goldcloth','genius','mrteam','glass','scum','yips','distract','cancer','ambience','thief','latepractice'];
const hook=`\nwindow.__shareColorTest={rich:()=>{S.removed=['旧特性'];Object.assign(S.traits,{legend:true,taiwan:true,goldcloth:true,genius:true,glass:true,mrteam:true});S.mrTeamName='福岡シーホークス';const plain=Object.keys(traitNames()).find(k=>!${JSON.stringify(special)}.includes(k));S.traits[plain]=true;return plain;},image:()=>{const out=document.createElement('div');document.body.appendChild(out);shareImage([],out);return out.querySelector('img').src;}};`;
const server=createServer(async(req,res)=>{try{
  const u=new URL(req.url,'http://localhost'),old=u.pathname.startsWith('/baseline/'),rel=decodeURIComponent(u.pathname.replace(/^\/(baseline\/)?/,''))||'index.html';
  if(rel.includes('..'))throw Error('path');
  if(rel==='favicon.ico'){res.writeHead(204);return res.end();}
  let body=old?execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:20e6}):await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js')body=body.toString()+hook;
  const type={js:'text/javascript',css:'text/css',html:'text/html',png:'image/png',webp:'image/webp',svg:'image/svg+xml',woff2:'font/woff2'}[rel.split('.').pop()]||'application/octet-stream';
  res.writeHead(200,{'content-type':type+'; charset=utf-8'});res.end(body);
}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`;

const css=await readFile(path.join(root,'docs/styles/themes.css'),'utf8');
const blocks=Object.fromEntries([...css.matchAll(/:root\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g)].map(m=>[m[1],Object.fromEntries([...m[2].matchAll(/(--[\w-]+):(#[\da-f]+)/g)].map(x=>[x[1],x[2]]))]));
const tokenNames=['--bg','--share-edge','--chalk','--dim','--amber','--share-soft','--bad',...['--tag-legend','--tag-goldcloth','--tag-genius','--tag-negative','--share-tag','--share-tag-removed'].flatMap(n=>[n+'-bg',n+'-edge',n+'-text'])];
const changes={standard:false,classic:false,night:true,scoreboard:true};
// Independent oracle for derived tokens (P3 will use color-mix): mix #a71930 20% with white in sRGB and in OKLab.
const lin=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4,gam=v=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055;
const toLab=([r,g,b])=>{const [l,m,s]=[[.4122214708,.5363325363,.0514459929],[.2119034982,.6806995451,.1073969566],[.0883024619,.2817188376,.6299787005]].map(k=>Math.cbrt(k[0]*r+k[1]*g+k[2]*b));
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];};
const fromLab=([L,a,b])=>{const [l,m,s]=[L+.3963377774*a+.2158037573*b,L-.1055613458*a-.0638541728*b,L-.0894841775*a-1.291485548*b].map(v=>v**3);
  return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];};
const rgb=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255),toByte=v=>Math.round(Math.min(1,Math.max(0,v))*255);
const mixSrgb=rgb('#a71930').map((v,i)=>toByte(.2*v+.8*rgb('#ffffff')[i]));
const [la,lb]=[rgb('#a71930'),rgb('#ffffff')].map(c=>toLab(c.map(lin)));
const mixOklab=fromLab(la.map((v,i)=>.2*v+.8*lb[i])).map(v=>toByte(gam(v)));
const near=(hex,bytes,label)=>{const got=rgb(hex).map(v=>Math.round(v*255));assert.ok(got.every((v,i)=>Math.abs(v-bytes[i])<=1),`${label}: ${hex} vs ${bytes}`);};
let mixChecks=0;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true}),errors=[];
let checks=0,failure;
try{
  for(const width of [1280,390]){
    for(const [theme,changed] of Object.entries(changes)){
      const pngs=[];
      for(const old of [true,false]){
        const ctx=await browser.newContext({viewport:{width,height:900},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();
        p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
        p.on('response',r=>{if(r.status()>=400&&r.url().startsWith(local))errors.push(r.status()+' '+r.url());});
        await p.addInitScript(t=>{try{localStorage.setItem('yakyujinsei.display.v1',JSON.stringify({schemaVersion:1,theme:t,fontSize:'medium',density:'standard'}));}catch{}},theme);
        await p.goto(local+(old?'/baseline/':'/')+'?seed=design-tokens-03');
        await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
        await p.locator('#seg-pos [data-v="P"]').click();await p.locator('#btn-start').click();
        assert.equal(await p.evaluate(()=>document.documentElement.dataset.theme),theme);
        const plain=await p.evaluate(()=>window.__shareColorTest.rich());assert.ok(plain,'a plain trait exists');
        const png=await p.evaluate(()=>{const proto=CanvasRenderingContext2D.prototype,fill=proto.fillText;
          proto.fillText=function(t,...r){if(/^\d+\.\d+\.\d+$/.test(String(t)))return;return fill.call(this,t,...r);};
          try{return window.__shareColorTest.image();}finally{proto.fillText=fill;}});
        pngs.push(png);
        if(arg('shots')){await mkdir(arg('shots'),{recursive:true});await writeFile(path.join(arg('shots'),`design-tokens-03-${theme}-${width}-${old?'before':'after'}.png`),Buffer.from(png.split(',')[1],'base64'));}
        if(!old){
          const read=await p.evaluate(async names=>(await import('./src/ui/share-image.js')).readThemeColors(names),tokenNames);
          for(const name of tokenNames){assert.match(blocks[theme][name]||'',/^#[\da-f]{6}$/,`${theme} ${name} is a hex token`);assert.equal(read[name],blocks[theme][name],`${width} ${theme} ${name}`);}
          // Dark themes give every share tag (bg/edge/text) its own dark value; a PNG diff alone would not notice one light tag.
          if(changed)for(const name of tokenNames.filter(n=>/^--(tag|share-tag)-/.test(n)))assert.notEqual(blocks[theme][name],blocks.standard[name],`${theme} ${name} must differ from standard`);
          checks++;
          if(theme==='standard'&&width===1280){
            const mixed=await p.evaluate(async()=>{const r=document.documentElement.style;
              r.setProperty('--dt03-srgb','color-mix(in srgb, #a71930 20%, #ffffff)');r.setProperty('--dt03-oklab','color-mix(in oklab, #a71930 20%, #ffffff)');
              try{return (await import('./src/ui/share-image.js')).readThemeColors(['--dt03-srgb','--dt03-oklab']);}finally{r.removeProperty('--dt03-srgb');r.removeProperty('--dt03-oklab');}});
            near(mixed['--dt03-srgb'],mixSrgb,'color-mix in srgb');near(mixed['--dt03-oklab'],mixOklab,'color-mix in oklab');
            // A defined but invalid token must throw, not inherit the body text color through the probe.
            const invalid=await p.evaluate(async()=>{const r=document.documentElement.style;r.setProperty('--dt03-invalid','color-mix(in oklab, red, blue bad)');
              try{(await import('./src/ui/share-image.js')).readThemeColors(['--bg','--dt03-invalid']);return 'no error';}catch(e){return e.message;}finally{r.removeProperty('--dt03-invalid');}});
            assert.match(invalid,/^SHARE_COLOR_UNRESOLVED --dt03-invalid /);mixChecks++;
          }
        }
        await ctx.close();
      }
      assert.ok(pngs.every(s=>s.startsWith('data:image/png;base64,')&&s.length>10_000),'PNG drawn');
      if(changed)assert.notEqual(pngs[1],pngs[0],`${width} ${theme} share PNG must follow the theme tokens`);
      else assert.equal(pngs[1],pngs[0],`${width} ${theme} share PNG byte-identical to ${baseline}`);
      checks++;
    }
  }
  assert.deepEqual(errors,[]);
  assert.equal(checks,2*4*2);assert.equal(mixChecks,1);
  console.log(`design-tokens-03-e2e: ${checks} checks PASS (2 viewports x 4 themes: PNG vs ${baseline}, probe colors vs themes.css); color-mix srgb/oklab read-back and invalid-token rejection PASS.`);
}catch(e){failure=e;}
finally{await browser.close();server.close();}
if(failure)throw failure;
