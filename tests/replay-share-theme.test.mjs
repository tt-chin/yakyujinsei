import assert from 'node:assert/strict';
import {shareReplayURL,replayURL} from '../docs/src/ui/seed-share.js';
import {shareTagPalette} from '../docs/src/ui/share-theme.js';
import {readThemeColors} from '../docs/src/ui/share-image.js';
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
// transparent host. Opaque rgb() is parsed without a canvas; other formats (oklab, color(srgb …)) are painted on a
// 1x1 canvas. The fake canvas ignores unparsable fillStyle and composites source-over, like a real one.
const fakeDocument=(tokens,computed,pixels)=>{const hosts=[],canvases=[];const doc={documentElement:{},body:{appendChild:el=>hosts.push(el)},hosts,canvases,
 createElement:tag=>{if(tag==='canvas'){const ctx={fill:'#000000',get fillStyle(){return ctx.fill;},set fillStyle(v){if(v in pixels)ctx.fill=v;},painted:[0,0,0,0],
    clearRect(){ctx.painted=[0,0,0,0];},fillRect(){const src=pixels[ctx.fill]??[0,0,0,0];if(src[3]>0)ctx.painted=src;},getImageData:()=>({data:ctx.painted})};
   const cv={getContext:(type,opts)=>{assert.equal(type,'2d');assert.equal(opts?.willReadFrequently,true);return ctx;}};canvases.push(cv);return cv;}
  const el={style:{},children:[],appendChild(c){el.children.push(c);},remove(){el.removed=true;}};return el;}};
 const styleOf=el=>el===doc.documentElement?{getPropertyValue:n=>tokens[n]??''}:{color:computed[el.style.color.slice(4,-1)]};return {doc,styleOf};};
{const tokens={'--bg':' #0d1117','--a':'x','--b':'y','--c':'z','--invalid':'color-mix(bad)'};
 // '--invalid' is defined but not a color: the probe inherits the host's transparent color.
 const computed={'--bg':'rgb(13, 17, 23)','--a':'oklab(0.5 0.1 0)','--b':'rgba(1, 2, 3, 0.5)','--c':'bogus','--invalid':'rgba(0, 0, 0, 0)'};
 const pixels={'rgba(0, 0, 0, 0)':[0,0,0,0],'rgb(13, 17, 23)':[13,17,23,255],'oklab(0.5 0.1 0)':[0,10,255,255],'rgba(1, 2, 3, 0.5)':[1,2,3,128]};
 const read=names=>{const {doc,styleOf}=fakeDocument(tokens,computed,pixels);try{return {value:readThemeColors(names,{documentRef:doc,styleOf}),doc};}catch(error){return {error,doc};}};
 let r=read(['--bg']);assert.deepEqual(r.value,{'--bg':'#0d1117'});assert.equal(r.doc.canvases.length,0,'opaque rgb() is parsed without a canvas (farbling-proof)');cases++;
 r=read(['--bg','--a']);assert.deepEqual(r.value,{'--bg':'#0d1117','--a':'#000aff'});assert.equal(r.doc.canvases.length,1);cases++;
 assert.match(read(['--a','--b']).error?.message||'',/SHARE_COLOR_UNRESOLVED --b/,'translucent after opaque');cases++;
 assert.match(read(['--a','--c']).error?.message||'',/SHARE_COLOR_UNRESOLVED --c bogus/,'rejected fillStyle must not reuse the previous color');cases++;
 assert.match(read(['--bg','--invalid']).error?.message||'',/SHARE_COLOR_UNRESOLVED --invalid/,'invalid token must not fall back to an inherited color');cases++;
 assert.match(read(['--bg','--missing']).error?.message||'',/SHARE_COLOR_TOKEN_MISSING --missing/);cases++;
 const {doc}=read(['--a','--c']);assert.equal(doc.hosts.length,1);const [host]=doc.hosts;
 assert.ok(host.removed&&host.hidden&&host.style.color==='transparent'&&host.children.length===1,'probe sits in a hidden transparent host that is always removed');cases++;}
console.log(`${cases} replay sharing/activation/error/seed/theme-color cases PASS`);
for(const theme of ['standard','toString',undefined]){const tag={bg:'#ffffff',bd:'#ffffff',fg:'#ffffff'};assert.equal(shareTagPalette(tag,theme),tag,String(theme));}
for(const theme of THEME_IDS.filter(t=>t!=='standard'))for(const color of ['#ffffff','#FFC52F','#00A3E0','#81757a']){
 const tag=shareTagPalette({bg:'#ffffff',bd:color,fg:color},theme);assert.equal(tag.bd,color);assert.notEqual(tag.fg,'#ffffff');cases++;
}
console.log(`Standard/unknown themes keep tag colors and ${THEME_IDS.filter(t=>t!=='standard').length*4} semantic tag contrast cases PASS`);
