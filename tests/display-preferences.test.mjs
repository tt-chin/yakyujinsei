import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_PREFERENCES,normalizeDisplayPreferences,readDisplayPreferences,saveDisplayPreferences,PREFERENCES_STORAGE_KEY} from '../docs/src/ui/preferences.js';
import {THEMES,THEME_IDS} from '../docs/src/ui/theme-catalog.js';
import {themeColors,composite,contrastRatio} from './support/theme-colors.mjs';

// The only place the theme list is written out; every other test iterates THEME_IDS (UI-DESIGN-TOKENS-04).
assert.deepEqual(THEMES.map(({id,label})=>[id,label]),[['standard','スタンダード'],['night','ナイター'],['classic','クラシック'],['scoreboard','スコアボード']]);
assert.deepEqual(THEME_IDS,THEMES.map(theme=>theme.id));
assert.ok(Object.isFrozen(THEMES)&&Object.isFrozen(THEME_IDS)&&THEMES.every(Object.isFrozen));
assert.equal(DEFAULT_PREFERENCES.theme,THEME_IDS[0]);

const store=new Map(),storage={getItem:key=>store.get(key)??null,setItem:(key,value)=>store.set(key,value)};
assert.deepEqual(readDisplayPreferences(storage),DEFAULT_PREFERENCES);
for(const theme of THEME_IDS)for(const fontSize of ['small','medium','large'])for(const density of ['standard','compact']){
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
const main=readFileSync(new URL('../docs/src/main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
assert.match(html,/id="btn-start" disabled/);
assert.match(main,/const game=await import\('\.\/engine\/game\.js'\);\s*await game\.initializeBrowserSave\(\);/);
assert.doesNotMatch(source,/\b(?:R|ri|pick|chance|board)\s*\(|engine\/game|Math\.random|location|URLSearchParams|\bS\./);
const css=readFileSync(new URL('../docs/styles/themes.css',import.meta.url),'utf8');
assert.deepEqual([...css.matchAll(/:root\[data-theme="([^"]+)"\]/g)].map(m=>m[1]).sort(),[...THEME_IDS].sort(),'themes.css blocks match THEME_IDS');
assert.match(css,new RegExp(`:root,\\s*:root\\[data-theme="${THEME_IDS[0]}"\\]\\s*\\{`),'default theme block is the first THEME_IDS entry');
assert.match(html,new RegExp(`<html [^>]*data-theme="${THEME_IDS[0]}"`),'index.html default theme');
// UI-DESIGN-TOKENS-05 (DESIGN_SYSTEM_PLAN §13): each theme block holds only the 17 base colors; the plain :root
// block derives every component color from them. Contrast uses the resolved values (translucent ones over --bg).
const BASE=['--bg','--panel','--panel2','--edge','--chalk','--dim','--amber','--clay','--good','--bad','--blue','--control-edge','--gold','--primary','--shadow-base','--focus-ring','--potential-marker'];
const themes=themeColors(css),rules=Object.keys(themes.rules);
assert.deepEqual([...themes.order].sort(),[...THEME_IDS].sort(),'theme blocks parsed');
assert.equal(rules.length,48,'rule block defines the 48 component colors');
assert.ok(rules.every(n=>!BASE.includes(n)),'rule block must not redefine a base color');
// UI-DESIGN-TOKENS-06 (§14.3 D2): a theme block may also override a non-color token of the base.css / preferences.css
// :root blocks (radius, shadow, font, spacing); any other extra token fails.
const rootTokens=rel=>[...readFileSync(new URL('../docs/styles/'+rel,import.meta.url),'utf8').matchAll(/(?:^|\})\s*:root\s*\{([^}]*)\}/g)].flatMap(m=>[...m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]*)/g)]).filter(m=>!/^(?:#|rgba?\()/.test(m[2].trim())).map(m=>m[1]);
const NON_COLOR=new Set([...rootTokens('base.css'),...rootTokens('preferences.css')]);
assert.ok(['--radius-md','--fs-sm','--shadow-die','--font-scale','--sans'].every(n=>NON_COLOR.has(n))&&!NON_COLOR.has('--team-label-bg'),'non-color token whitelist');
const checkThemeBlocks=parsed=>{for(const theme of THEME_IDS){
  const own=Object.keys(parsed.themes[theme]).filter(n=>!(theme===parsed.defaultTheme&&n==='--disabled-opacity')&&!NON_COLOR.has(n));
  assert.deepEqual([...own].sort(),[...BASE].sort(),`${theme} block defines exactly the 17 base colors plus whitelisted non-color tokens`);
}};
checkThemeBlocks(themes);
for(const theme of THEME_IDS)for(const name of rules)themes.color(theme,name);
{const withToken=extra=>themeColors(css.replace(':root[data-theme="night"] {',':root[data-theme="night"] {'+extra));
  checkThemeBlocks(withToken('--radius-md:0;--shadow-die:none;'));
  assert.throws(()=>checkThemeBlocks(withToken('--unknown-token:0;')),/night block defines exactly/);
  assert.throws(()=>checkThemeBlocks(withToken('--team-label-bg:#000;')),/night block defines exactly/);
  assert.throws(()=>checkThemeBlocks(withToken('--metric-bg:#000;')),/night block defines exactly/);}
const solid=(theme,name)=>{const c=themes.color(theme,name);return c.alpha<1?composite(c,themes.color(theme,'--bg')):c;};
// composite() is source-over in 8-bit sRGB; translucent colors must be composited before a contrast ratio.
assert.deepEqual(composite({rgb:[1,1,1],alpha:.5},{rgb:[0,0,0],alpha:1}).rgb.map(v=>Math.round(v*255)),[128,128,128]);
assert.deepEqual(composite({rgb:[1,0,0],alpha:.25},{rgb:[0,0,1],alpha:1}).rgb.map(v=>Math.round(v*255)),[64,0,191]);
assert.throws(()=>contrastRatio({rgb:[0,0,0],alpha:.5},{rgb:[1,1,1],alpha:1}),/THEME_COLOR_TRANSLUCENT_CONTRAST/);
assert.throws(()=>composite({rgb:[0,0,0],alpha:.5},{rgb:[1,1,1],alpha:.5}),/THEME_COLOR_TRANSLUCENT_BACKDROP/);
{const shadow=themes.color('standard','--overlay-bg'),bg=themes.color('standard','--bg');assert.ok(shadow.alpha<1);
  assert.deepEqual(solid('standard','--overlay-bg').rgb.map(v=>Math.round(v*255)),shadow.rgb.map((v,i)=>Math.round((v*shadow.alpha+bg.rgb[i]*(1-shadow.alpha))*255)),'translucent token composited over --bg');}
const ratio=(theme,fg,bg)=>contrastRatio(solid(theme,'--'+fg),solid(theme,'--'+bg));
let contrastPairs=0;
for(const theme of THEME_IDS){
  const check=(fg,bg,min,label)=>{const r=ratio(theme,fg,bg);assert.ok(r>=min,`${theme} ${label||''}${fg}/${bg}: ${r}`);contrastPairs++;};
  for(const bg of ['bg','panel','panel2','metric-bg'])for(const fg of ['chalk','dim','amber','good','bad','blue','button-detail'])check(fg,bg,4.5);
  for(const bg of ['panel','panel2'])for(const fg of ['control-edge','focus-ring'])check(fg,bg,3,'UI ');
  for(const bg of ['primary-button-start','primary-button-end'])check('primary-button-text',bg,4.5,'primary button ');
  check('primary-button-detail','primary-button-end',4.5,'primary button ');
  check('share-tag-text','share-tag-bg',4.5,'share ');
  check('share-soft','bg',4.5,'share ');
}
assert.equal(contrastPairs,THEME_IDS.length*37);
// Approved golden (tasks/design-tokens-05/unify-v4.json): every rule string, and every resolved value within 1/255.
const approved=JSON.parse(readFileSync(new URL('../tasks/design-tokens-05/unify-v4.json',import.meta.url),'utf8'));
assert.deepEqual(Object.fromEntries(rules.map(n=>[n,themes.rules[n]])),Object.fromEntries(approved.tokens.map(t=>['--'+t.name,t.rule])),'rule strings equal the approved -05 rules');
const hexBytes=h=>[1,3,5,7].map(i=>h.length>i?parseInt(h.slice(i,i+2),16):255);
for(const theme of THEME_IDS)for(const t of approved.tokens){const got=hexBytes(themes.hex(theme,'--'+t.name)),want=hexBytes(t.unified[theme]);
  assert.ok(got.every((v,i)=>Math.abs(v-want[i])<=1),`${theme} --${t.name}: ${themes.hex(theme,'--'+t.name)} vs approved ${t.unified[theme]}`);}
// Each font stack must start with a family that index.html actually loads from Google Fonts.
const base=readFileSync(new URL('../docs/styles/base.css',import.meta.url),'utf8');
const loaded=[...html.matchAll(/fonts\.googleapis\.com\/css2\?([^"]+)"/g)].flatMap(m=>[...m[1].matchAll(/family=([^:&]+)/g)].map(f=>decodeURIComponent(f[1].replace(/\+/g,' '))));
for(const name of ['sans','mono']){const first=base.match(new RegExp(`--${name}:'([^']+)'`))?.[1];assert.ok(loaded.includes(first),`--${name} first family ${first} is not loaded (${loaded.join(', ')})`);}
console.log(`Display preferences: theme list, ${THEME_IDS.length*6} combinations, validation, storage failures, isolation, contrast (${contrastPairs} pairs), 17 base colors + 48 derived rules and font loading passed.`);
