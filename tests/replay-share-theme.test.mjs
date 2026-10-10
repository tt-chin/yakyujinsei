import assert from 'node:assert/strict';
import {shareReplayURL,replayURL} from '../docs/src/ui/seed-share.js';
import {getSharePalette,shareTagPalette} from '../docs/src/ui/share-theme.js';
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
for(const [theme,bg] of [['standard','#fff8f8'],['night','#0d1117'],['classic','#f4ecd8'],['scoreboard','#0d2318'],['unknown','#fff8f8'],[undefined,'#fff8f8']]){const p=getSharePalette(theme);assert.equal(p.bg,bg);assert.equal(Object.keys(p).length,8);p.bg='changed';assert.equal(getSharePalette(theme).bg,bg);cases++;}
console.log(`${cases} replay sharing/activation/error/seed/palette cases PASS`);
assert.deepEqual(getSharePalette('toString'),getSharePalette('standard'));
for(const theme of ['night','classic','scoreboard'])for(const color of ['#ffffff','#FFC52F','#00A3E0','#81757a']){
 const tag=shareTagPalette({bg:'#ffffff',bd:color,fg:color},theme);assert.equal(tag.bd,color);assert.notEqual(tag.fg,'#ffffff');cases++;
}
console.log('Unknown inherited palette keys and 12 semantic tag contrast cases PASS');
