// UI-DESIGN-TOKENS-07 (tasks/DESIGN_SYSTEM_PLAN.md §15 T5): the share image takes its font families from the --sans/--mono
// tokens. The original 20 canvas font assignments retain their sizes; one approved subtitle-fit assignment uses --sans. readThemeFonts
// trims the computed values and throws when a token is missing. Font loading and drawing are proven by design-tokens-07-e2e.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readThemeFonts} from '../docs/src/ui/share-image.js';

const src=readFileSync(new URL('../docs/src/ui/share-image.js',import.meta.url),'utf8');
let pass=0;const test=(name,fn)=>{fn();pass++;console.log('PASS '+name);};

test('no generic font family literal is left in share-image.js',()=>{
  assert.doesNotMatch(src,/sans-serif|monospace/);
});
test('the original 20 canvas fonts stay exact and the only extra site fits the subtitle with sans',()=>{
  const all=[...src.matchAll(/c\.font=([^;]*);/g)].map(m=>m[1]);
  const fit="(Math.floor(15*(W-PAD*2)/subtitleWidth*10)/10)+'px '+sans";
  assert.equal(all.filter(v=>v===fit).length,1,'one exact approved subtitle fit site');
  const sites=all.filter(v=>v!==fit);assert.equal(sites.length,20);
  assert.equal(sites.filter(v=>/\+sans$/.test(v)).length,13,'sans sites');
  assert.equal(sites.filter(v=>/\+mono$/.test(v)).length,7,'mono sites');
  assert.deepEqual(sites.filter(v=>!/px '\+(sans|mono)$/.test(v)),[],'every site ends in "<n>px "+token');
  assert.deepEqual(sites.map(v=>v.match(/(\d+)px/)?.[1]??'size').sort(),
    ['11','11','12','12','12','12','12','13','13','13','13','13','13','13','15','16','16','36','size','size'].sort());
});
test('native subtitle block keeps short copy at 15px and fits long copy without truncation',()=>{
  const start=src.indexOf('  const careerSubtitle='),end=src.indexOf('  // 特性列',start);assert.ok(start>0&&end>start);
  const draw=new Function('c','W','PAD','sans','primaryPos','playerType','hist','S',src.slice(start,end));
  for(const position of ['先発投手','ユーティリティープレーヤー('+Array(8).fill('遊撃手').join('、')+')']){
    const writes=[],paint=[],token='__PROBE_SANS__';let font='15px '+token;
    const c={get font(){return font;},set font(v){writes.push(v);font=v;},measureText:t=>({width:parseFloat(font)*t.length}),fillText:(...args)=>paint.push(args)};
    const state={year:2040,age:30,pos:'IF'},expected=position+'｜発展途上型｜2026–2040｜引退時30歳';
    draw(c,920,34,token,()=>position,()=> '発展途上型',[{y:2026}],state);
    assert.deepEqual(paint,[[expected,34,98]],'full copy and position preserved');assert.ok(c.measureText(expected).width<=852);
    if(position==='先発投手'){assert.equal(font,'15px '+token);assert.deepEqual(writes,[]);}else{assert.equal(writes.length,1);assert.ok(font.endsWith('px '+token));assert.ok(parseFloat(font)<15);}
  }
});
const fake=values=>({documentRef:{documentElement:{}},styleOf:()=>({getPropertyValue:name=>values[name]??''})});
test('readThemeFonts returns the trimmed token values',()=>{
  assert.deepEqual(readThemeFonts(fake({'--sans':"  'Noto Sans JP',sans-serif ",'--mono':" 'IBM Plex Mono',monospace"})),
    {sans:"'Noto Sans JP',sans-serif",mono:"'IBM Plex Mono',monospace"});
});
test('readThemeFonts throws on a missing or blank token',()=>{
  assert.throws(()=>readThemeFonts(fake({'--sans':'serif'})),/SHARE_FONT_TOKEN_MISSING: --mono/);
  assert.throws(()=>readThemeFonts(fake({'--sans':'  ','--mono':'monospace'})),/SHARE_FONT_TOKEN_MISSING: --sans/);
});
console.log(`design-tokens-07.test: ${pass} PASS`);
