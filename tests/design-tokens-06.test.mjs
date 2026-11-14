// UI-DESIGN-TOKENS-06 (tasks/DESIGN_SYSTEM_PLAN.md §14 T3): font-size, radius and shadow tokens keep the pre-change
// values, no stylesheet multiplies a px font size by --font-scale outside the tokens, and the fixed inline layout values
// of index.html / career-retirement.js / share-image.js live in base.css rules. Computed-style equality is proven by
// design-tokens-06-e2e at the time; this test pins the source shape. UI-DESIGN-TOKENS-08 (§16.6 T1) replaced the 19
// --fs-<px> tokens with 13 scale steps and merged the 7/9/12px component radii into --radius-md/-lg/-xl; the font-size and
// radius cases below pin that shape. UI-DESIGN-TOKENS-09 (§17.8 T1) added the 12 --space-* steps for px margin/padding/gap;
// the spacing cases pin that every such literal goes through them except the 7 whole declarations W12 = A leaves untouched
// (computed style: design-tokens-09-e2e).
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';

const read=rel=>readFileSync(new URL('../'+rel,import.meta.url),'utf8').replace(/\r\n/g,'\n');
let pass=0;const test=(name,fn)=>{fn();pass++;console.log('PASS '+name);};
const styles=Object.fromEntries(readdirSync(new URL('../docs/styles/',import.meta.url)).filter(f=>f.endsWith('.css')).sort().map(f=>[f,read('docs/styles/'+f)]));
const base=styles['base.css'],rootBlock=base.match(/^:root\{([^}]*)\}/)?.[1];
assert.ok(rootBlock,'base.css starts with its :root block');
const rootTokens=Object.fromEntries([...rootBlock.matchAll(/(--[\w-]+):([^;]*);/g)].map(m=>[m[1],m[2]]));
const allCss=Object.values(styles).join('\n'),outsideRoot=allCss.replace(rootBlock,'');

const FS={'--fs-3xs':8,'--fs-2xs':10,'--fs-xs':11,'--fs-sm':12,'--fs-md':13,'--fs-lg':14,'--fs-xl':15,'--fs-2xl':16,'--fs-3xl':18,'--fs-4xl':20,'--fs-5xl':24,'--fs-6xl':28,'--fs-7xl':34};
test('base.css defines the 13 --fs-* scale tokens as calc(<px>px * var(--font-scale,1))',()=>{
  assert.deepEqual(Object.keys(rootTokens).filter(n=>n.startsWith('--fs-')),Object.keys(FS));
  for(const [name,px] of Object.entries(FS))assert.equal(rootTokens[name],`calc(${px}px * var(--font-scale,1))`,name);
  assert.doesNotMatch(allCss,/--fs-\d+(?:-5)?(?![a-z\d])/,'old --fs-<px> name left');
});
// 59 former calc() sites plus 5 moved inline 11/12px sizes (scaled before by the preferences.css [style*=] rules).
test('every var(--fs-*) is defined and every token is used (64 sites)',()=>{
  const used=[...outsideRoot.matchAll(/var\((--fs-[\w-]+)\)/g)].map(m=>m[1]);
  assert.equal(used.length,64);
  assert.deepEqual(used.filter(n=>!(n in rootTokens)),[],'undefined --fs token');
  assert.deepEqual(Object.keys(FS).filter(n=>!used.includes(n)),[],'unused --fs token');
});
test('--font-scale is multiplied only by the tokens and the two .abrow widths',()=>{
  const sites=Object.entries(styles).flatMap(([f,css])=>[...css.replace(f==='base.css'?rootBlock:'\0','').matchAll(/[^;{}]*var\(--font-scale[^;}]*/g)].map(m=>f+' '+m[0].trim()));
  assert.deepEqual(sites,['preferences.css width:calc(74px * var(--font-scale))','preferences.css width:calc(58px * var(--font-scale))']);
});
const SHADOW={'--shadow-glow':'0 0 8px var(--amber)','--shadow-team-badge':'0 2px 4px var(--team-label-shadow)','--shadow-team-dot':'0 0 2px var(--team-dot-shadow)','--shadow-die':'inset 0 -3px 0 var(--dice-shadow)','--shadow-current':'inset 0 -2px 0 var(--amber)'};
test('shadow tokens keep the pre-change values and replace every literal; component radii merged (-08)',()=>{
  for(const [name,value] of Object.entries(SHADOW)){
    assert.equal(rootTokens[name],value,name);
    assert.ok(outsideRoot.includes(`var(${name})`),name+' used');
  }
  for(const value of Object.values(SHADOW))assert.ok(!outsideRoot.includes(value),'literal shadow left: '+value);
  assert.deepEqual([...outsideRoot.matchAll(/border-radius:(7|9|12)px/g)].map(m=>m[0]),[],'literal 7/9/12px radius left');
  assert.doesNotMatch(allCss,/--radius-(?:link|die|menu)\b/,'component radius token left');
  for(const [sel,token] of [['.salary-detail-link','--radius-md'],['.die','--radius-lg'],['#board-menu-panel','--radius-xl']])
    assert.match(allCss,new RegExp('(?:^|\\n)'+sel.replace(/[.#]/g,'\\$&')+'\\{[^}]*border-radius:var\\('+token+'\\)'),sel);
});
const SPACE={'--space-4xs':2,'--space-3xs':4,'--space-2xs':6,'--space-xs':8,'--space-sm':10,'--space-md':12,'--space-lg':16,'--space-xl':20,'--space-2xl':24,'--space-3xl':32,'--space-4xl':40,'--space-5xl':60};
const isSpace=n=>n.startsWith('--space-')&&n!=='--space-scale';
test('base.css defines the 12 --space-* steps as plain px (-09)',()=>{
  assert.deepEqual(Object.keys(rootTokens).filter(isSpace),Object.keys(SPACE));
  for(const [name,px] of Object.entries(SPACE))assert.equal(rootTokens[name],px+'px',name);
});
// §17.3 W12 = A: a declaration containing calc()/var()/env(), auto or a negative value is left whole; these 7 keep a
// top-level px literal. Every other margin/padding/gap px value is a var(--space-*) (W11: 0 stays a literal).
const KEEP_PX=['base.css|#board|padding','base.css|#log|padding','base.css|.salary-detail-dialog|padding','stadium-background.css|#start .wrap|margin',
  'ui-navigation.css|#main-nav|padding','ui-navigation.css|#view-player,#view-career|padding','ui-navigation.css|.ui-ability-guide|margin'];
test('px margin/padding/gap go through var(--space-*) outside the 7 untouched declarations (-09)',()=>{
  const SP=/^(?:margin|padding|gap|row-gap|column-gap)(?:-(?:top|right|bottom|left|inline|block)(?:-(?:start|end))?)?$/,kept=[];
  for(const [f,raw] of Object.entries(styles)){
    const css=raw.replace(/\/\*[\s\S]*?\*\//g,'');
    for(const m of css.matchAll(/([{;]\s*)([a-z-]+)\s*:\s*([^;{}]+)/g)){
      if(!SP.test(m[2]))continue;
      const open=css.lastIndexOf('{',m.index+m[1].length-1),start=Math.max(css.lastIndexOf('}',open-1),css.lastIndexOf('{',open-1));
      const sel=css.slice(start+1,open).trim().replace(/\s+/g,' '),val=m[3].replace(/var\(--space-[\w-]+\)/g,'');
      let depth=0,tok='';const top=[];for(const ch of val+' '){if(ch==='(')depth++;if(ch===')')depth--;if(!depth&&/\s/.test(ch)){if(tok)top.push(tok);tok='';}else tok+=ch;}
      if(top.some(t=>/^\d*\.?\d+px$/.test(t)))kept.push(f+'|'+sel+'|'+m[2]);
    }
  }
  assert.deepEqual(kept.sort(),[...KEEP_PX].sort());
});
test('every var(--space-*) is defined and every step is used (172 sites, -09)',()=>{
  const used=[...outsideRoot.matchAll(/var\((--space-[\w-]+)\)/g)].map(m=>m[1]).filter(isSpace);
  assert.equal(used.length,172);
  assert.deepEqual(used.filter(n=>!(n in rootTokens)),[],'undefined --space token');
  assert.deepEqual(Object.keys(SPACE).filter(n=>!used.includes(n)),[],'unused --space token');
});
// §14.3 D3: the rules that took over the inline values (also the hit list of design-tokens-06-e2e).
const RULES=['#app-version','#btn-start','#seed-show','#seed-re','.home-credit','.home-credit a','#bd-tj','.card p.retire-league','table.fin .cell-nowrap','table.fin .cell-left','table.fin .ama-line','.card h4.intl-heading','.share-actions','#sh-img,#sh-url,#sh-save,#sh-dl','#sh-out','#sh-url-status .replay-url-input','.share-image-preview','.share-image-actions','.statline.share-image-hint'];
test('base.css carries one rule per moved inline value',()=>{for(const r of RULES)assert.equal(base.split('\n'+r+'{').length-1,1,r);});
test('index.html keeps only display:none toggles inline',()=>{
  const html=read('docs/index.html');
  assert.deepEqual([...html.matchAll(/\sstyle="([^"]*)"/g)].map(m=>m[1]),Array(4).fill('display:none'));
  assert.match(html,/<footer class="home-credit">/);
});
test('career-retirement.js keeps only runtime inline styles',()=>{
  const src=read('docs/src/engine/career-retirement.js');
  assert.deepEqual([...src.matchAll(/style="([^"]*)"/g)].map(m=>m[1]),['color:var(--bad);font-weight:700;','${cS}','${cS}',"--team-color:'+(TEAM_COLOR[S.mrTeamName]||'#a71930')+'"]);
  assert.doesNotMatch(src,/\.style\.|cssText|style=\\/);
  assert.match(src,/input\.className='replay-url-input'/);
});
test('share-image.js keeps only the theme-color probe styles',()=>{
  const src=read('docs/src/ui/share-image.js');
  assert.doesNotMatch(src,/style=|cssText/);
  assert.deepEqual([...src.matchAll(/(\w+)\.style\.(\w+)=/g)].map(m=>m[1]+'.'+m[2]),['host.color','probe.color']);
});
console.log(`design-tokens-06: ${pass} cases PASS.`);
