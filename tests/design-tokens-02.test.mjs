// UI-DESIGN-TOKENS-02 (tasks/DESIGN_SYSTEM_PLAN.md §8): retirement trait tag classes, per-theme
// --tag-* tokens and the theme-independent team label tokens.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {THEME_IDS} from '../docs/src/ui/theme-catalog.js';
import {themeColors,contrastRatio} from './support/theme-colors.mjs';

const read=rel=>readFileSync(new URL('../'+rel,import.meta.url),'utf8').replace(/\r\n/g,'\n');
let pass=0;const test=(name,fn)=>{fn();pass++;console.log('PASS '+name);};

// 1. Production markup: slice the trait tag block of the retirement card and run it on fixtures.
const retirement=read('docs/src/engine/career-retirement.js');
const start=retirement.indexOf('    const posT={pos:['),end=retirement.indexOf('    const lv=S.love;');
assert.ok(start>0&&end>start,'trait tag block not found');
assert.equal(retirement.indexOf('    const posT={pos:[',start+1),-1);
const block=retirement.slice(start,end);
const posKeys=JSON.parse(block.match(/pos:(\[[^\]]+\])/)[1].replaceAll("'",'"'));
const negKeys=JSON.parse(block.match(/neg:(\[[^\]]+\])/)[1].replaceAll("'",'"'));
const special={legend:'tag tag-legend',taiwan:'tag tag-legend',goldcloth:'tag tag-goldcloth',genius:'tag tag-genius',mrteam:'tag tag-mrteam'};
const render=S=>{
  const ctx=vm.createContext({S,TN:new Proxy({},{get:(_,k)=>'名'+String(k)}),TEAM_COLOR:{'赤球団':'#AA0000'},removedTraitLabel:lbl=>'外'+lbl,teamNick:null,tr:[]});
  vm.runInContext(block,ctx);
  return ctx.tr;
};
test('every trait category emits its class and no inline color',()=>{
  const traits=Object.fromEntries([...posKeys,...negKeys].map(k=>[k,true]));
  const html=render({traits,mrTeamName:'赤球団',removed:['x','y']});
  assert.equal(html.length,posKeys.length+negKeys.length+2);
  posKeys.forEach((k,i)=>{
    const attrs=k==='mrteam'?' style="--team-color:#AA0000"':'';
    assert.equal(html[i],`<span class="${special[k]||'tag'}"${attrs}>名${k}</span>`,k);
  });
  negKeys.forEach((k,i)=>assert.equal(html[posKeys.length+i],`<span class="tag tag-negative">名${k}</span>`,k));
  assert.deepEqual(html.slice(-2),['<span class="tag tag-removed">外x</span>','<span class="tag tag-removed">外y</span>']);
});
test('mrteam without a team color keeps the #a71930 fallback',()=>{
  assert.deepEqual(render({traits:{mrteam:true},mrTeamName:'不明',removed:[]}),['<span class="tag tag-mrteam" style="--team-color:#a71930">名mrteam</span>']);
});
test('no trait tag keeps an inline color',()=>assert.doesNotMatch(block,/(?<![\w-])(?:background|color|border-color|opacity|text-decoration):/));

// 2. Theme tokens: every theme resolves every tag token (UI-DESIGN-TOKENS-05 derives them with color-mix()).
// standard/classic equal the approved -05 values (tasks/design-tokens-05/unify-v4.json, DESIGN_SYSTEM_PLAN §13.3).
const themes=read('docs/styles/themes.css'),colors=themeColors(themes);
const approved=JSON.parse(read('tasks/design-tokens-05/unify-v4.json'));
const tagKinds=['legend','goldcloth','genius','negative'];
const tokenNames=[...tagKinds.flatMap(k=>['bg','edge','text'].map(p=>`tag-${k}-${p}`)),'tag-removed-text','tag-removed-edge'];
const bytes=hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));
test('all four themes resolve all tag tokens to opaque colors',()=>{for(const t of THEME_IDS)for(const name of tokenNames){const c=colors.color(t,'--'+name);assert.equal(c.alpha,1,t+' --'+name);assert.match(colors.hex(t,'--'+name),/^#[\da-f]{6}$/,t+' --'+name);}});
test('standard and classic equal the approved -05 colors',()=>{
  let n=0;
  for(const t of ['standard','classic'])for(const name of tokenNames){
    const want=approved.tokens.find(x=>x.name===name)?.unified[t];assert.ok(want,'approved value '+name);
    const got=colors.hex(t,'--'+name);assert.ok(bytes(got).every((v,i)=>Math.abs(v-bytes(want)[i])<=1),`${t} --${name}: ${got} vs ${want}`);n++;
  }
  assert.equal(n,2*tokenNames.length);
});
test('night and scoreboard change every tag color',()=>{for(const t of ['night','scoreboard'])for(const name of tokenNames)assert.notEqual(colors.hex(t,'--'+name),colors.hex('standard','--'+name),t+' --'+name);});
test('tag text meets 4.5:1 on its tag background in every theme',()=>{
  for(const t of THEME_IDS)for(const k of tagKinds){
    const r=contrastRatio(colors.color(t,`--tag-${k}-text`),colors.color(t,`--tag-${k}-bg`));assert.ok(r>=4.5,`${t} ${k} ${r.toFixed(2)}`);
  }
});

// 3. Team label tokens are theme-independent and equal the old inline literals (D5/D6).
const base=read('docs/styles/base.css');
test('team label tokens equal the pre-change inline values',()=>{
  const rootBlock=base.match(/^:root\{([^}]+)\}/m)[1];
  for(const [name,value] of Object.entries({'team-label-bg':'#ffffff','team-label-white-text':'#000000','team-dot-white':'#cccccc','team-label-shadow':'rgba(0,0,0,0.4)','team-dot-shadow':'rgba(0,0,0,0.2)'}))
    assert.ok(rootBlock.includes(`--${name}:${value};`),name);
  assert.doesNotMatch(themes,/--team-(label|dot)-/,'team label tokens must not vary by theme');
});
console.log(`design-tokens-02: ${pass} cases PASS.`);
