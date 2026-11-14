import assert from 'node:assert/strict';
import {shareReplayURL,replayURL} from '../docs/src/ui/seed-share.js';
import {shareTagPalette} from '../docs/src/ui/share-theme.js';
import {readThemeColors,parseComputedColor} from '../docs/src/ui/share-image.js';
import {THEME_IDS} from '../docs/src/ui/theme-catalog.js';
let cases=0;
for(const href of ['https://dev.yakyujinsei.pages.dev/sub/?rv=old&rules=old#x','https://yakyujinsei.com/?x=1'])for(const seed of ['', 'abc','日本語 +?&%/#"']){
 const url=replayURL(seed,href);assert.equal(new URL(url).origin,new URL(href).origin);assert.deepEqual([...new URL(url).searchParams.keys()],['seed']);assert.equal(new URL(url).searchParams.get('seed'),seed);assert.equal(new URL(url).hash,'');cases++;
}
for(const kind of ['success','cancel','denied','missing','copy-fail','sync-error']){
 let shares=0,copies=0;
 const windowRef={isSecureContext:true,navigator:{clipboard:{writeText:async()=>{copies++;if(kind==='copy-fail')throw Error('denied');}}}};
 if(!['missing','copy-fail'].includes(kind))windowRef.navigator.share=()=>{shares++;if(kind==='sync-error')throw Error('sync');return kind==='success'?Promise.resolve():Promise.reject(Object.assign(Error(kind),{name:kind==='cancel'?'AbortError':'NotAllowedError'}));};
 const documentRef={body:{appendChild(){}},createElement:()=>({style:{},select(){},remove(){}}),execCommand:()=>false};
 const pending=shareReplayURL('https://example.com/?seed=x',{windowRef,documentRef});
 assert.equal(shares,['missing','copy-fail'].includes(kind)?0:1,'native share must be synchronous');
 const result=await pending;assert.equal(result.kind,kind==='success'?'shared':kind==='cancel'?'cancelled':kind==='missing'?'copied':'failed');assert.equal(copies,['missing','copy-fail'].includes(kind)?1:0);if(kind==='cancel')assert.equal(result.message,'');cases++;
}
// UI-DESIGN-TOKENS-03 (DESIGN_SYSTEM_PLAN §10 T1): share colors are read from CSS tokens through a hidden probe in a
// transparent host. rgb()/rgba(), color(srgb …), oklab() and oklch() are converted without a canvas (UI-DESIGN-TOKENS-05,
// §13 T6); only unrecognised formats (here lab()) are painted on a 1x1 canvas. The fake canvas ignores unparsable
// fillStyle and composites source-over, like a real one.
const fakeDocument=(tokens,computed,pixels)=>{const hosts=[],canvases=[];const doc={documentElement:{},body:{appendChild:el=>hosts.push(el)},hosts,canvases,
 createElement:tag=>{if(tag==='canvas'){const ctx={fill:'#000000',get fillStyle(){return ctx.fill;},set fillStyle(v){if(v in pixels)ctx.fill=v;},painted:[0,0,0,0],
    clearRect(){ctx.painted=[0,0,0,0];},fillRect(){const src=pixels[ctx.fill]??[0,0,0,0];if(src[3]>0)ctx.painted=src;},getImageData:()=>({data:ctx.painted})};
   const cv={getContext:(type,opts)=>{assert.equal(type,'2d');assert.equal(opts?.willReadFrequently,true);return ctx;}};canvases.push(cv);return cv;}
  const el={style:{},children:[],appendChild(c){el.children.push(c);},remove(){el.removed=true;}};return el;}};
 const styleOf=el=>el===doc.documentElement?{getPropertyValue:n=>tokens[n]??''}:{color:computed[el.style.color.slice(4,-1)]};return {doc,styleOf};};
{const tokens={'--bg':' #0d1117','--a':'x','--b':'y','--c':'z','--d':'w','--e':'v','--invalid':'color-mix(bad)'};
 // '--invalid' is defined but not a color: the probe inherits the host's transparent color.
 const computed={'--bg':'rgb(13, 17, 23)','--a':'lab(50% 40 0)','--b':'rgba(1, 2, 3, 0.5)','--c':'bogus','--d':'oklab(1 0 0)','--e':'oklab(0.5 0.1 0 / 0.5)','--invalid':'rgba(0, 0, 0, 0)'};
 // Real canvases would accept oklab(); the fake one does too, with a deliberately wrong pixel, so reaching the canvas fails.
 const pixels={'rgba(0, 0, 0, 0)':[0,0,0,0],'rgb(13, 17, 23)':[13,17,23,255],'lab(50% 40 0)':[0,10,255,255],'rgba(1, 2, 3, 0.5)':[1,2,3,128],'oklab(1 0 0)':[9,9,9,255],'oklab(0.5 0.1 0 / 0.5)':[9,9,9,128]};
 const read=names=>{const {doc,styleOf}=fakeDocument(tokens,computed,pixels);try{return {value:readThemeColors(names,{documentRef:doc,styleOf}),doc};}catch(error){return {error,doc};}};
 let r=read(['--bg']);assert.deepEqual(r.value,{'--bg':'#0d1117'});assert.equal(r.doc.canvases.length,0,'opaque rgb() is parsed without a canvas (farbling-proof)');cases++;
 r=read(['--bg','--a']);assert.deepEqual(r.value,{'--bg':'#0d1117','--a':'#000aff'});assert.equal(r.doc.canvases.length,1);cases++;
 r=read(['--bg','--d']);assert.deepEqual(r.value,{'--bg':'#0d1117','--d':'#ffffff'});assert.equal(r.doc.canvases.length,0,'oklab() is converted without a canvas');cases++;
 r=read(['--e']);assert.match(r.error?.message||'',/^SHARE_COLOR_UNRESOLVED --e oklab/);assert.equal(r.doc.canvases.length,0,'translucent oklab() is rejected without a canvas');cases++;
 assert.match(read(['--a','--b']).error?.message||'',/SHARE_COLOR_UNRESOLVED --b/,'translucent after opaque');cases++;
 assert.match(read(['--a','--c']).error?.message||'',/SHARE_COLOR_UNRESOLVED --c bogus/,'rejected fillStyle must not reuse the previous color');cases++;
 assert.match(read(['--bg','--invalid']).error?.message||'',/SHARE_COLOR_UNRESOLVED --invalid/,'invalid token must not fall back to an inherited color');cases++;
 assert.match(read(['--bg','--missing']).error?.message||'',/SHARE_COLOR_TOKEN_MISSING --missing/);cases++;
 const {doc}=read(['--a','--c']);assert.equal(doc.hosts.length,1);const [host]=doc.hosts;
 assert.ok(host.removed&&host.hidden&&host.style.color==='transparent'&&host.children.length===1,'probe sits in a hidden transparent host that is always removed');cases++;}
// parseComputedColor: CSS Color 4 conversions, checked against sRGB red/white and an OKLab/OKLCH round trip of red.
{const near=(got,rgb,alpha,label)=>{assert.ok(got,label+' parsed');assert.ok(got.rgb.every((v,i)=>Math.abs(v-rgb[i])<=1),`${label}: ${got.rgb} vs ${rgb}`);assert.equal(got.alpha,alpha,label+' alpha');};
 for(const [text,rgb,alpha] of [
  ['rgb(13, 17, 23)',[13,17,23],1],['rgba(1, 2, 3, 0.5)',[1,2,3],0.5],['rgba(0, 0, 0, 0)',[0,0,0],0],['rgba(1, 2, 3, 5e-01)',[1,2,3],0.5],['rgba(1, 2, 3, 50%)',[1,2,3],0.5],
  ['color(srgb 1 0 0)',[255,0,0],1],['color(srgb 100% 0% 50%)',[255,0,128],1],['color(srgb 1 1e-05 0 / 50%)',[255,0,0],0.5],['color(srgb 0 0 1 / 0.25)',[0,0,255],0.25],['color(srgb 1E+00 0 0)',[255,0,0],1],
  ['oklab(0.627955 0.224863 0.125846)',[255,0,0],1],['oklab(62.7955% 56.2158% 31.4615%)',[255,0,0],1],['oklab(1 0 0)',[255,255,255],1],['oklab(0 0 0 / 0.5)',[0,0,0],0.5],['oklab(0.5 -1.2e-05 3e-06)',[99,99,99],1],['oklab(5e-01 0 0 / 1e+00)',[99,99,99],1],
  ['oklch(0.627955 0.257683 29.2339)',[255,0,0],1],['oklch(62.7955% 64.4208% 29.2339)',[255,0,0],1],['oklch(1 0 0 / 40%)',[255,255,255],0.4],
 ]){near(parseComputedColor(text),rgb,alpha,text);cases++;}
 for(const text of ['lab(50% 40 0)','hsl(0 100% 50%)','bogus','','oklab(0.5 0.1)','color(display-p3 1 0 0)']){assert.equal(parseComputedColor(text),null,text);cases++;}}
console.log(`${cases} replay sharing/activation/error/seed/theme-color/computed-color cases PASS`);
for(const theme of ['standard','toString',undefined]){const tag={bg:'#ffffff',bd:'#ffffff',fg:'#ffffff'};assert.equal(shareTagPalette(tag,theme),tag,String(theme));}
for(const theme of THEME_IDS.filter(t=>t!=='standard'))for(const color of ['#ffffff','#FFC52F','#00A3E0','#81757a']){
 const tag=shareTagPalette({bg:'#ffffff',bd:color,fg:color},theme);assert.equal(tag.bd,color);assert.notEqual(tag.fg,'#ffffff');cases++;
}
console.log(`Standard/unknown themes keep tag colors and ${THEME_IDS.filter(t=>t!=='standard').length*4} semantic tag contrast cases PASS`);
