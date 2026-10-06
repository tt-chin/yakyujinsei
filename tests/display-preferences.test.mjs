import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_PREFERENCES,normalizeDisplayPreferences,readDisplayPreferences,saveDisplayPreferences,PREFERENCES_STORAGE_KEY} from '../docs/src/ui/preferences.js';

const store=new Map(),storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
assert.deepEqual(readDisplayPreferences(storage),DEFAULT_PREFERENCES);
for(const theme of ['standard','night','classic','scoreboard'])for(const fontSize of ['small','medium','large'])for(const density of ['standard','compact']){
  const value={schemaVersion:1,theme,fontSize,density};
  assert.equal(saveDisplayPreferences(storage,value),true);
  assert.deepEqual(readDisplayPreferences(storage),value);
}
storage.setItem(PREFERENCES_STORAGE_KEY,'{broken');assert.deepEqual(readDisplayPreferences(storage),DEFAULT_PREFERENCES);
assert.deepEqual(normalizeDisplayPreferences({schemaVersion:2,theme:'night'}),DEFAULT_PREFERENCES);
assert.deepEqual(normalizeDisplayPreferences({schemaVersion:1,theme:'unknown',fontSize:'large',density:'compact'}),{...DEFAULT_PREFERENCES,fontSize:'large',density:'compact'});
assert.deepEqual(readDisplayPreferences({getItem(){throw new Error('blocked');}}),DEFAULT_PREFERENCES);
assert.equal(saveDisplayPreferences({setItem(){throw new Error('quota');}},DEFAULT_PREFERENCES),false);
assert.equal(saveDisplayPreferences(undefined,DEFAULT_PREFERENCES),false);
const source=readFileSync(new URL('../docs/src/ui/preferences.js',import.meta.url),'utf8');
assert.doesNotMatch(source,/\b(?:R|ri|pick|chance|board)\s*\(|engine\/game|Math\.random|location|URLSearchParams|\bS\./);
const css=readFileSync(new URL('../docs/styles/themes.css',import.meta.url),'utf8');
const luminance=hex=>{let h=hex.slice(1);if(h.length===3)h=[...h].map(c=>c+c).join('');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
for(const block of css.matchAll(/:root\[data-theme="([^"]+)"\]\s*\{([^}]+)\}/g)){
  const tokens=Object.fromEntries([...block[2].matchAll(/--([\w-]+):(#[\da-f]+)/g)].map(m=>[m[1],m[2]]));
  for(const bg of ['bg','panel','panel2','metric-bg'])for(const fg of ['chalk','dim','amber','good','bad','blue','button-detail'])assert.ok(ratio(tokens[fg],tokens[bg])>=4.5,`${block[1]} ${fg}/${bg}: ${ratio(tokens[fg],tokens[bg])}`);
  for(const bg of ['panel','panel2'])for(const fg of ['control-edge','focus-ring'])assert.ok(ratio(tokens[fg],tokens[bg])>=3,`${block[1]} UI ${fg}/${bg}`);
  for(const bg of ['primary-button-start','primary-button-end'])assert.ok(ratio(tokens['primary-button-text'],tokens[bg])>=4.5,`${block[1]} primary button`);
}
console.log('Display preferences: 24 combinations, validation, storage failures, isolation and contrast passed.');
