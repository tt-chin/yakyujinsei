// UI-DESIGN-TOKENS-02 (tasks/DESIGN_SYSTEM_PLAN.md §8): retirement trait tag classes, per-theme
// --tag-* tokens and the theme-independent team label tokens.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

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

// 2. Theme tokens: every theme defines every tag token; light themes keep the pre-change colors (D4).
const themes=read('docs/styles/themes.css');
const blocks=Object.fromEntries([['standard',/:root,\n:root\[data-theme="standard"\] \{([^}]+)\}/],...['night','classic','scoreboard'].map(t=>[t,new RegExp(`:root\\[data-theme="${t}"\\] \\{([^}]+)\\}`)])].map(([t,re])=>{
  const m=themes.match(re);assert.ok(m,'theme block '+t);
  return [t,Object.fromEntries([...m[1].matchAll(/--([\w-]+):(#[\da-f]{6})\b/g)].map(x=>[x[1],x[2]]))];
}));
const oldColors={legend:['#fff7dc','#c79520','#795b00'],goldcloth:['#fffbe0','#c5a800','#6f6000'],genius:['#f3f5f8','#9aa5b5','#4c5868'],negative:['#fff0f0','#c0392b','#a71930']};
const tokenNames=[...Object.keys(oldColors).flatMap(k=>['bg','edge','text'].map(p=>`tag-${k}-${p}`)),'tag-removed-text','tag-removed-edge'];
test('all four themes define all tag tokens as hex',()=>{for(const [t,tokens] of Object.entries(blocks))for(const name of tokenNames)assert.match(tokens[name]||'',/^#[\da-f]{6}$/,t+' --'+name);});
test('standard and classic keep the pre-change colors',()=>{
  for(const t of ['standard','classic']){
    for(const [k,[bg,edge,text]] of Object.entries(oldColors))assert.deepEqual([blocks[t][`tag-${k}-bg`],blocks[t][`tag-${k}-edge`],blocks[t][`tag-${k}-text`]],[bg,edge,text],t+' '+k);
    assert.deepEqual([blocks[t]['tag-removed-text'],blocks[t]['tag-removed-edge']],['#8a8a8a','#4a4a4a'],t+' removed');
  }
});
test('night and scoreboard change every tag color',()=>{for(const t of ['night','scoreboard'])for(const name of tokenNames)assert.notEqual(blocks[t][name],blocks.standard[name],t+' --'+name);});
const lum=hex=>{const c=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4);return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2];};
const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((p,q)=>q-p);return (x+0.05)/(y+0.05);};
test('tag text meets 4.5:1 on its tag background in every theme',()=>{
  for(const [t,tokens] of Object.entries(blocks))for(const k of Object.keys(oldColors)){
    const r=ratio(tokens[`tag-${k}-text`],tokens[`tag-${k}-bg`]);assert.ok(r>=4.5,`${t} ${k} ${r.toFixed(2)}`);
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
