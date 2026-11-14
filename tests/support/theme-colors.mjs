// Node resolver for docs/styles/themes.css (UI-DESIGN-TOKENS-05, DESIGN_SYSTEM_PLAN §13 T1).
// Models the cascade on <html>: the default block (`:root, :root[data-theme=…]`) applies to every theme,
// the plain `:root {}` rule block overrides it, and the active theme block overrides both.
// Supports hex (3/4/6/8 digits), white/black/transparent, var(--x) and
// color-mix(in srgb|oklab, A p%, B) per CSS Color 4/5 (premultiplied alpha). Anything else throws.
const lin=v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4,gam=v=>v<=.0031308?12.92*v:1.055*v**(1/2.4)-.055;
const toLab=([r,g,b])=>{const [l,m,s]=[[.4122214708,.5363325363,.0514459929],[.2119034982,.6806995451,.1073969566],[.0883024619,.2817188376,.6299787005]].map(k=>Math.cbrt(k[0]*r+k[1]*g+k[2]*b));
  return [.2104542553*l+.793617785*m-.0040720468*s,1.9779984951*l-2.428592205*m+.4505937099*s,.0259040371*l+.7827717662*m-.808675766*s];};
const fromLab=([L,a,b])=>{const [l,m,s]=[L+.3963377774*a+.2158037573*b,L-.1055613458*a-.0638541728*b,L-.0894841775*a-1.291485548*b].map(v=>v**3);
  return [4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s];};
const NAMED={white:'#ffffff',black:'#000000',transparent:'#00000000'};

function parseHex(value){
  let h=value.slice(1);
  if(!/^(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(h))throw Error('THEME_COLOR_SYNTAX '+value);
  if(h.length<=4)h=[...h].map(c=>c+c).join('');
  const bytes=[0,2,4,6].map(i=>h.length>i?parseInt(h.slice(i,i+2),16):255);
  return {rgb:bytes.slice(0,3).map(v=>v/255),alpha:bytes[3]/255};
}
function splitTopLevel(text){
  const parts=[];let depth=0,start=0;
  for(let i=0;i<text.length;i++){const c=text[i];if(c==='(')depth++;else if(c===')')depth--;else if(c===','&&depth===0){parts.push(text.slice(start,i).trim());start=i+1;}}
  parts.push(text.slice(start).trim());return parts;
}
function mix(space,a,b,p){
  const [ca,cb]=[a,b].map(c=>space==='oklab'?toLab(c.rgb.map(lin)):c.rgb);
  const alpha=a.alpha*p+b.alpha*(1-p);
  if(alpha===0)return {rgb:[0,0,0],alpha:0};
  const pre=ca.map((v,i)=>(v*a.alpha*p+cb[i]*b.alpha*(1-p))/alpha);
  return {rgb:space==='oklab'?fromLab(pre).map(gam):pre,alpha};
}

export function parseThemeCss(css){
  const themes={},order=[];let defaultTheme=null,rules=null;
  for(const m of css.replace(/\r\n/g,'\n').matchAll(/^(:root[^{]*)\{([^}]*)\}/gm)){
    const selectors=m[1].split(',').map(s=>s.trim()),decls={};
    for(const d of m[2].split(';').map(s=>s.trim()).filter(Boolean)){
      const i=d.indexOf(':');if(i<0)throw Error('THEME_CSS_DECLARATION '+d);
      const name=d.slice(0,i).trim();if(name.startsWith('--'))decls[name]=d.slice(i+1).trim();
    }
    const ids=selectors.map(s=>{if(s===':root')return null;const t=s.match(/^:root\[data-theme="([^"]+)"\]$/);if(!t)throw Error('THEME_CSS_SELECTOR '+s);return t[1];});
    if(ids.length===1&&ids[0]===null){if(rules)throw Error('THEME_CSS_DUPLICATE_RULE_BLOCK');rules=decls;continue;}
    const theme=ids.filter(Boolean);
    if(theme.length!==1)throw Error('THEME_CSS_SELECTOR '+m[1]);
    if(ids.includes(null)){if(defaultTheme)throw Error('THEME_CSS_DUPLICATE_DEFAULT');defaultTheme=theme[0];}
    if(themes[theme[0]])throw Error('THEME_CSS_DUPLICATE_THEME '+theme[0]);
    themes[theme[0]]=decls;order.push(theme[0]);
  }
  if(!defaultTheme)throw Error('THEME_CSS_NO_DEFAULT');
  return {themes,rules:rules||{},defaultTheme,order};
}

// Returns {color(theme,name)->{rgb:[0..1],alpha}, hex(theme,name), declared(theme)->{name:value}}.
export function themeColors(css){
  const parsed=parseThemeCss(css);
  const declared=theme=>{
    if(!parsed.themes[theme])throw Error('THEME_UNKNOWN '+theme);
    return {...parsed.themes[parsed.defaultTheme],...parsed.rules,...parsed.themes[theme]};
  };
  const color=(theme,name)=>{
    const decls=declared(theme);
    const resolve=(value,stack)=>{
      value=value.trim();
      if(NAMED[value])return parseHex(NAMED[value]);
      if(value.startsWith('#'))return parseHex(value);
      let m=value.match(/^var\((--[\w-]+)\)$/);
      if(m){if(stack.includes(m[1]))throw Error('THEME_COLOR_CYCLE '+[...stack,m[1]].join(' > '));if(!(m[1] in decls))throw Error('THEME_COLOR_UNDEFINED '+m[1]+' in '+theme);return resolve(decls[m[1]],[...stack,m[1]]);}
      m=value.match(/^color-mix\(in (srgb|oklab),(.*)\)$/s);
      if(m){
        const args=splitTopLevel(m[2]);if(args.length!==2)throw Error('THEME_COLOR_SYNTAX '+value);
        const first=args[0].match(/^(.*\S)\s+(\d+(?:\.\d+)?)%$/);
        if(!first||/\s\d+(?:\.\d+)?%$/.test(args[1]))throw Error('THEME_COLOR_SYNTAX '+value);
        return mix(m[1],resolve(first[1],stack),resolve(args[1],stack),Number(first[2])/100);
      }
      throw Error('THEME_COLOR_SYNTAX '+value);
    };
    if(!(name in decls))throw Error('THEME_COLOR_UNDEFINED '+name+' in '+theme);
    return resolve(decls[name],[name]);
  };
  const hex=(theme,name)=>toHex(color(theme,name));
  return {...parsed,declared,color,hex};
}

export const toByte=v=>Math.round(Math.min(1,Math.max(0,v))*255);
export function toHex({rgb,alpha}){
  const h=v=>toByte(v).toString(16).padStart(2,'0');
  return '#'+rgb.map(h).join('')+(alpha<1?h(alpha):'');
}
// Source-over composite of a (possibly translucent) color on an opaque backdrop, in 8-bit sRGB.
export function composite(top,backdrop){
  if(backdrop.alpha<1)throw Error('THEME_COLOR_TRANSLUCENT_BACKDROP');
  return {rgb:top.rgb.map((v,i)=>toByte(v*top.alpha+backdrop.rgb[i]*(1-top.alpha))/255),alpha:1};
}
export function contrastRatio(fg,bg){
  if(fg.alpha<1||bg.alpha<1)throw Error('THEME_COLOR_TRANSLUCENT_CONTRAST');
  const lum=c=>c.rgb.map(v=>toByte(v)/255).map(lin).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
  const [x,y]=[lum(fg),lum(bg)].sort((p,q)=>q-p);return (x+.05)/(y+.05);
}

// The 25 tokens shareImage reads (docs/src/ui/share-image.js SHARE_COLOR_TOKENS + SHARE_TAG_TOKENS × bg/edge/text).
export const SHARE_TOKEN_NAMES=Object.freeze(['--bg','--share-edge','--chalk','--dim','--amber','--share-soft','--bad',...['--tag-legend','--tag-goldcloth','--tag-genius','--tag-negative','--share-tag','--share-tag-removed'].flatMap(n=>[n+'-bg',n+'-edge',n+'-text'])]);
// Share colors of an older themes.css (e.g. `git show 629addc:docs/styles/themes.css`), written into
// documentElement.style so the current drawing path can be compared byte-for-byte with an older tree.
export const legacyShareColors=(css,theme)=>{const t=themeColors(css);return Object.fromEntries(SHARE_TOKEN_NAMES.map(n=>[n,t.hex(theme,n)]));};
