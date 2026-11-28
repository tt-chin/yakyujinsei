// COPY-02 batch 0: read-only inventory of Japanese text in docs/index.html and docs/src/** (release-notes.js excluded).
// Manual tool, not a Runner entry. No dependency is installed: pass a local acorn ESM build with --acorn=<path to acorn.mjs>.
// Usage: node tools/copy-inventory/scan.mjs --acorn=<acorn.mjs> --output=<new dir> [--root=<clean checkout>] [--audit=<audit md>]
// Writes <output>/inventory.tsv and <output>/stats.json; never writes inside --root.
// TSV: no quoting; backslash, tab, CR and LF inside fields are written as \\ \t \r \n.
import {readFileSync,writeFileSync,mkdirSync,existsSync,realpathSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {pathToFileURL} from 'node:url';

const args=Object.fromEntries(process.argv.slice(2).map(a=>{const m=a.match(/^--([^=]+)=(.*)$/);if(!m)throw new Error('Bad argument: '+a);return[m[1],m[2]];}));
for(const k of ['acorn','output'])if(!args[k])throw new Error('Missing --'+k);
const root=realpathSync(path.resolve(args.root||'.'));
const output=path.resolve(args.output);
if(existsSync(output))throw new Error('--output must not exist: '+output);
function nearestReal(p){let q=p;while(!existsSync(q))q=path.dirname(q);return path.join(realpathSync(q),path.relative(q,p));}
{
  const fold=s=>process.platform==='darwin'||process.platform==='win32'?s.toLowerCase():s;
  const rel=path.relative(fold(root),fold(nearestReal(output)));
  if(rel===''||(rel!=='..'&&!rel.startsWith('..'+path.sep)&&!path.isAbsolute(rel)))throw new Error('--output must be outside --root');
}
const git=(...a)=>execFileSync('git',['-C',root,...a],{encoding:'utf8'});
if(git('status','--porcelain','--','docs/index.html','docs/src').trim())throw new Error('--root has uncommitted changes under docs/; the inventory would not match HEAD');
const head=git('rev-parse','HEAD').trim();
const auditArg=args.audit?path.resolve(args.audit):path.join(root,'docs/reviews/COPY_01_JAPANESE_TEXT_AUDIT.md');
if(!existsSync(auditArg))throw new Error('Audit file not found: '+auditArg);
const auditPath=realpathSync(auditArg);
const auditRel=path.relative(root,auditPath);
const auditLabel=auditRel&&!auditRel.startsWith('..')&&!path.isAbsolute(auditRel)?auditRel.replaceAll('\\','/'):path.basename(auditPath)+' (outside --root)';
const audit=readFileSync(auditPath,'utf8');
const {parse}=await import(pathToFileURL(path.resolve(args.acorn)).href);

const JP=/[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]/;
// Characters that are not used in modern Japanese text; a hit is a review hint, not a verdict (proper nouns may use them).
const NON_JP_CHARS=/[體們這說個嗎麼聯賽與輕盤節練點對夠讓團隊員勝場緒]/;
const files=git('ls-files','-z','docs/index.html','docs/src').split('\0')
  .filter(f=>f&&(f==='docs/index.html'||f.endsWith('.js'))&&!f.endsWith('/release-notes.js')).sort();

const rows=[];
// Seeds for the second pass: texts that code compares or uses as keys.
const exact=new Map();    // text -> where (whole-string comparison, keys, Set/Map members)
const substr=new Map();   // text -> where (substring checks such as .includes() on a string)
const regexes=[];         // {re, where}
const seed=(map,text,where)=>{if(JP.test(text)&&!map.has(text))map.set(text,where);};
// A regex seeds the second pass only when it contains a literal Japanese run (2+ chars) outside [...] classes;
// pure detectors such as /[ぁ-ん]/ would otherwise mark nearly every row.
const literalJapanese=p=>/[\u3040-\u30ff\u3400-\u9fff\uff66-\uff9f]{2,}/.test(p.replace(/\\./g,'').replace(/\[[^\]]*\]/g,''));
const seedRegex=(pattern,flags,where)=>{if(!literalJapanese(pattern))return;try{regexes.push({re:new RegExp(pattern,flags.replace(/[gy]/g,'')),where});}catch{}};

const COMPARE_OPS=new Set(['===','!==','==','!=']);
const EXACT_METHODS=new Set(['has','get','set','add','delete','hasOwnProperty']);
const SUBSTRING_METHODS=new Set(['includes','indexOf','lastIndexOf','startsWith','endsWith','split','replace','replaceAll','search','match','matchAll','test']);
const ARRAY_LOOKUP=new Set(['includes','indexOf','lastIndexOf']);
const name=n=>n&&(n.type==='Identifier'?n.name:n.type==='Literal'?String(n.value):null);
const isCall=(n,callee)=>n&&n.type==='CallExpression'&&n.callee===callee;

// Returns [mode, reason] when the node is used as a comparison operand or a lookup key, else null.
function judgment(node,a){
  const p=a.at(-1),g=a.at(-2),gg=a.at(-3);
  if(!p)return null;
  if(p.type==='BinaryExpression'&&COMPARE_OPS.has(p.operator))return['exact','compared with '+p.operator];
  if(p.type==='BinaryExpression'&&p.operator==='in'&&p.left===node)return['exact','used with in'];
  if(p.type==='SwitchCase'&&p.test===node)return['exact','switch case'];
  if((p.type==='Property'||p.type==='PropertyDefinition'||p.type==='MethodDefinition')&&p.key===node)return['exact','object key'];
  if(p.type==='MemberExpression'&&p.property===node&&p.computed)return['exact','computed member key'];
  if(p.type==='CallExpression'&&p.callee.type==='MemberExpression'){
    const m=name(p.callee.property),obj=name(p.callee.object);
    if(p.arguments[0]===node&&EXACT_METHODS.has(m))return['exact','.'+m+'() argument'];
    if(p.arguments[0]===node&&SUBSTRING_METHODS.has(m))return['substring','.'+m+'() argument'];
    if(p.arguments[1]===node&&(obj==='Object'&&m==='hasOwn'||obj==='Reflect'&&m==='has'))return['exact',obj+'.'+m+'() key'];
  }
  if(p.type==='ArrayExpression'&&g&&g.type==='MemberExpression'&&g.object===p&&ARRAY_LOOKUP.has(name(g.property))&&isCall(gg,g))return['exact','member of array passed to .'+name(g.property)+'()'];
  if(p.type==='ArrayExpression'&&g&&g.type==='NewExpression'&&g.callee.name==='Set')return['exact','new Set member'];
  // new Map([[key,value]]) and Object.fromEntries([[key,value]])
  if(p.type==='ArrayExpression'&&p.elements[0]===node&&g&&g.type==='ArrayExpression'&&gg){
    if(gg.type==='NewExpression'&&gg.callee.name==='Map')return['exact','new Map key'];
    if(gg.type==='CallExpression'&&gg.callee.type==='MemberExpression'&&name(gg.callee.object)==='Object'&&name(gg.callee.property)==='fromEntries')return['exact','Object.fromEntries key'];
  }
  if(p.type==='NewExpression'&&p.callee.name==='RegExp'&&p.arguments[0]===node)return['regex','new RegExp pattern'];
  return null;
}
function context(node,a){
  for(let i=a.length-1;i>=0;i--){
    const x=a[i],child=a[i+1]??node;
    if(x.type==='Property'&&!x.computed&&child===x.value)return 'prop:'+name(x.key);
    if(x.type==='CallExpression'){const c=x.callee;return 'call:'+(c.type==='Identifier'?c.name:c.type==='MemberExpression'?name(c.property):'?');}
    if(x.type==='NewExpression')return 'new:'+(x.callee.name||'?');
    if(x.type==='VariableDeclarator'&&x.id.type==='Identifier')return 'var:'+x.id.name;
    if(x.type==='ReturnStatement')return 'return';
    if(x.type==='AssignmentExpression'){const l=x.left;return 'assign:'+(l.type==='MemberExpression'?name(l.property):l.name);}
  }
  return 'other';
}
function walk(node,a,visit){
  if(!node||typeof node.type!=='string')return;
  visit(node,a);
  a.push(node);
  for(const k of Object.keys(node)){
    if(k==='loc'||k==='range'||k==='start'||k==='end')continue;
    const v=node[k];
    if(Array.isArray(v))for(const c of v)walk(c,a,visit);
    else if(v&&typeof v.type==='string')walk(v,a,visit);
  }
  a.pop();
}
function flags(text){
  const f=[];
  if(NON_JP_CHARS.test(text))f.push('non-Japanese character');
  if(/[\u3040-\u30ff\u3400-\u9fff]\(|\)[\u3040-\u30ff\u3400-\u9fff]|\([^)）]*）|（[^）)]*\)/.test(text))f.push('half-width or mismatched parentheses');
  if(/あなた/.test(text))f.push('あなた');
  if(/(ました|ます|でした|です)[。！？]/.test(text))f.push('敬体');
  return f.join('; ');
}
function fileUsage(file){
  if(/award-identity-policy|legacy|migration|save-(compat|migrat)/.test(file))return['COMPAT','file holds legacy names or save compatibility'];
  if(/-policy\.js$|honors/.test(file))return['UNKNOWN','string in a rule/policy module; confirm consumers'];
  return['DISPLAY',''];
}
const where=(file,node)=>file+':'+node.loc.start.line;

for(const file of files){
  const src=readFileSync(path.join(root,file),'utf8');
  if(file==='docs/index.html'){
    // Blank script/style/comments but keep a tag boundary so text on either side is not merged; newlines keep line numbers.
    const body=src.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g,m=>'<'+m.slice(1,-1).replace(/[^\n]/g,' ')+'>');
    const lineAt=i=>body.slice(0,i).split('\n').length;
    const decode=s=>s.replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCodePoint(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCodePoint(Number(d))).replace(/&hellip;/g,'…').replace(/&times;/g,'×').replace(/&nbsp;/g,'\u00a0').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&amp;/g,'&');
    const VISIBLE=new Set(['title','alt','placeholder','aria-label','aria-description','aria-placeholder','content','label']);
    for(const m of body.matchAll(/>([^<>]+)</g)){
      const t=decode(m[1]).replace(/\s+/g,' ').trim();
      if(!JP.test(t))continue;
      const start=m.index+1+m[1].search(/\S/);
      rows.push({file,line:lineAt(start),category:'html:text',text:t,fragments:[t],usage:'DISPLAY',usageReason:''});
    }
    for(const tag of body.matchAll(/<[a-zA-Z][^<>]*>/g)){
      for(const at of tag[0].matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g)){
        const v=decode(at[2]??at[3]??at[4]??'');
        if(!JP.test(v))continue;
        const attr=at[1].toLowerCase(),visible=VISIBLE.has(attr);
        rows.push({file,line:lineAt(tag.index+at.index),category:'html:attr:'+attr,text:v,fragments:[v],
          usage:visible?'DISPLAY':'UNKNOWN',usageReason:visible?'':(attr.startsWith('on')?'inline handler code':'non-visible attribute; may be read by code')});
      }
    }
    continue;
  }
  const ast=parse(src,{ecmaVersion:'latest',sourceType:'module',locations:true});
  walk(ast,[],(node,a)=>{
    const p=a.at(-1);
    // Japanese identifiers used as keys ({優勝:7}, obj.優勝) are code, not rows, but their names are lookup keys.
    if(node.type==='Identifier'&&JP.test(node.name)&&p&&(
      (p.type==='Property'||p.type==='PropertyDefinition'||p.type==='MethodDefinition')&&p.key===node&&!p.computed||
      p.type==='MemberExpression'&&p.property===node&&!p.computed))seed(exact,node.name,where(file,node)+' (identifier key)');
    if(node.type==='Literal'&&node.regex&&JP.test(node.regex.pattern)){
      rows.push({file,line:node.loc.start.line,category:context(node,a),text:'/'+node.regex.pattern+'/'+node.regex.flags,fragments:[],usage:'JUDGMENT',usageReason:'regex literal'});
      seedRegex(node.regex.pattern,node.regex.flags,where(file,node));
      return;
    }
    let text,fragments;
    if(node.type==='Literal'&&typeof node.value==='string'){text=node.value;fragments=[text];}
    else if(node.type==='TemplateLiteral'){text=src.slice(node.start+1,node.end-1);fragments=node.quasis.map(q=>q.value.cooked??q.value.raw);}
    else return;
    if(!JP.test(text))return;
    const j=judgment(node,a);
    const plain=node.type==='Literal'||node.expressions.length===0;
    if(j&&plain){
      const value=node.type==='Literal'?text:fragments[0];
      if(j[0]==='regex')seedRegex(value,'',where(file,node));
      else seed(j[0]==='exact'?exact:substr,value,where(file,node));
    }
    const [u,r]=j?['JUDGMENT',j[1]]:fileUsage(file);
    const hidden=/event-cards/.test(file)&&context(node,a)==='prop:sourceName';
    rows.push({file,line:node.loc.start.line,category:context(node,a),text,fragments,usage:u,usageReason:r,hidden});
  });
}
// Second pass: copy whose text is compared, used as a key, or matched elsewhere would change that judgment if reworded.
// Plain values (literal, template without ${}) are compared whole; templates with ${} only per static fragment.
for(const r of rows){
  if(r.usage==='JUDGMENT')continue;
  const whole=r.fragments.length===1?r.fragments[0]:null,parts=r.fragments.filter(f=>JP.test(f));
  let why=whole!==null&&exact.has(whole)?'same text compared or used as a key at '+exact.get(whole):null;
  if(!why)for(const [t,w] of substr)if(whole===t||t.length>=2&&parts.some(f=>f.includes(t))){why='contains「'+t+'」checked as a substring at '+w;break;}
  if(!why)for(const {re,where:w} of regexes)if(parts.some(f=>re.test(f))){why='matched by '+re+' at '+w;break;}
  if(why){r.usage='JUDGMENT';r.usageReason=why;}
}
const coveredBy=r=>r.fragments.map(s=>s.trim()).find(s=>s.length>=4&&JP.test(s)&&audit.includes(s))||'';
for(const r of rows){
  r.covered=r.hidden?'':coveredBy(r);
  r.status=r.hidden?'HIDDEN':r.covered?'COVERED':'NOT_COVERED';
  r.flags=flags(r.text);
}
rows.sort((a,b)=>a.file<b.file?-1:a.file>b.file?1:a.line-b.line);
const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\t/g,'\\t').replace(/\r/g,'\\r').replace(/\n/g,'\\n');
const tsv=['file\tline\tcategory\tstatus\tusage\tusage_reason\tflags\tcovered_by_fragment\ttext',
  ...rows.map(r=>[r.file,r.line,r.category,r.status,r.usage,r.usageReason,r.flags,r.covered,r.text].map(esc).join('\t'))].join('\n')+'\n';
const count=f=>Object.fromEntries(Object.entries(rows.reduce((m,r)=>{const k=f(r);m[k]=(m[k]||0)+1;return m;},{})).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)));
const stats={head,files:files.length,rows:rows.length,audit:{path:auditLabel,sha256:createHash('sha256').update(audit).digest('hex')},
  status:count(r=>r.status),usage:count(r=>r.usage),
  judgmentReasons:count(r=>r.usage==='JUDGMENT'?r.usageReason.replace(/ at .*$/,'').replace(/「.*」/,'「…」').replace(/matched by .*/,'matched by regex'):'-'),
  seeds:{exact:exact.size,substring:substr.size,regex:regexes.length}};
mkdirSync(path.dirname(output),{recursive:true});
mkdirSync(output);
writeFileSync(path.join(output,'inventory.tsv'),tsv);
writeFileSync(path.join(output,'stats.json'),JSON.stringify(stats,null,1)+'\n');
console.log(JSON.stringify({head,files:stats.files,rows:stats.rows,status:stats.status,usage:stats.usage,seeds:stats.seeds}));
