// UI-DESIGN-TOKENS-07 (tasks/DESIGN_SYSTEM_PLAN.md §15 T5): the share image takes its font families from the --sans/--mono
// tokens. The 20 canvas font assignments keep their px sizes and no generic family literal is left; readThemeFonts
// trims the computed values and throws when a token is missing. Font loading and drawing are proven by design-tokens-07-e2e.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readThemeFonts} from '../docs/src/ui/share-image.js';

const src=readFileSync(new URL('../docs/src/ui/share-image.js',import.meta.url),'utf8');
let pass=0;const test=(name,fn)=>{fn();pass++;console.log('PASS '+name);};

test('no generic font family literal is left in share-image.js',()=>{
  assert.doesNotMatch(src,/sans-serif|monospace/);
});
test('the 20 canvas font assignments use the tokens with their former px sizes',()=>{
  const sites=[...src.matchAll(/c\.font=([^;]*);/g)].map(m=>m[1]);
  assert.equal(sites.length,20);
  assert.equal(sites.filter(v=>/\+sans$/.test(v)).length,13,'sans sites');
  assert.equal(sites.filter(v=>/\+mono$/.test(v)).length,7,'mono sites');
  assert.deepEqual(sites.filter(v=>!/px '\+(sans|mono)$/.test(v)),[],'every site ends in "<n>px "+token');
  assert.deepEqual(sites.map(v=>v.match(/(\d+)px/)?.[1]??'size').sort(),
    ['11','11','12','12','12','12','12','13','13','13','13','13','13','13','15','16','16','36','size','size'].sort());
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
