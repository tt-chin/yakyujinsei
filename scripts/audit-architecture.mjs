// Read-only inventory, not a test or reachability proof. No game module is executed.
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const req=createRequire(import.meta.url),pw=arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright';
const {babelParse}=req(path.join(path.dirname(req.resolve(pw)),'lib/transform/babelBundle.js'));
const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8'}).trim();
const files=git('ls-files','docs/src').split(/\r?\n/).filter(f=>f.endsWith('.js'));
const evidence={schema:1,head:git('rev-parse','HEAD'),parser:'Playwright bundled babelParse (external, version-specific)',limitations:['Static syntax inventory; no runtime reachability proof','S/state member access only; parameter/alias effects require manual review','Nested callback labels preserve lexical owner, not execution ordering','Call target strings are not scope-resolved graph edges'],modules:[],functions:[],calls:[],state:[],initializers:[],captures:[],rng:[]};
const fnTypes=new Set(['FunctionDeclaration','FunctionExpression','ArrowFunctionExpression','ObjectMethod']);
const mutators=new Set(['push','pop','shift','unshift','splice','sort','reverse','set','add','delete','clear']);
function member(n){if(n?.type==='Identifier')return n.name;if(['MemberExpression','OptionalMemberExpression'].includes(n?.type)){const base=member(n.object);return base?base+'.'+(n.computed?(n.property.type==='StringLiteral'||n.property.type==='NumericLiteral'?String(n.property.value):'['+member(n.property)+']'):n.property.name):null;}return null;}
for(const file of files){
 const source=fs.readFileSync(path.join(root,file),'utf8'),ast=babelParse(source,path.join(root,file),true);
 const imports=ast.program.body.filter(n=>n.type==='ImportDeclaration').map(n=>({line:n.loc.start.line,source:n.source.value,symbols:n.specifiers.map(s=>s.local.name)}));
 evidence.modules.push({file,lines:source.split('\n').length,sha256:createHash('sha256').update(source.replace(/\r\n/g,'\n')).digest('hex'),imports});
 function walk(n,parent=null,owner='<module>',ancestors=[]){
  if(!n?.type)return;
  let scope=owner;
  if(fnTypes.has(n.type)){
   const name=n.id?.name||(parent?.type==='VariableDeclarator'?parent.id.name:parent?.type==='AssignmentExpression'?member(parent.left):null)||n.key?.name||'<callback@'+n.loc.start.line+'>';
   scope=name+'@'+n.loc.start.line;
   evidence.functions.push({file,name,line:n.loc.start.line,end:n.loc.end.line,owner,type:n.type,params:n.params.map(p=>p.name||p.type),binding:n.type==='FunctionDeclaration'?'declaration':parent?.type==='AssignmentExpression'?'assignment':parent?.type==='VariableDeclarator'?'variable':'callback'});
   if(name==='newState'){
    const ret=n.body.body?.find(x=>x.type==='ReturnStatement');
    const object=ret?.argument?.type==='ObjectExpression'?ret.argument:n.body.body?.flatMap(x=>x.declarations||[]).find(x=>x.id?.name===ret?.argument?.name)?.init;
    if(object?.type==='ObjectExpression')evidence.initializers.push({file,line:object.loc.start.line,fields:object.properties.map(p=>({key:p.key?.name||p.key?.value,line:p.loc.start.line}))});
   }
  }
  const loc={file,line:n.loc.start.line,owner:scope};
  if(n.type==='CallExpression'||n.type==='OptionalCallExpression'){
   const target=member(n.callee)||n.callee.type;
   evidence.calls.push({...loc,target});
   if(['R','ri','rf','pick','chance','seedInit','random','rng','Math.random','crypto.getRandomValues'].includes(target))evidence.rng.push({...loc,target});
   if(target==='Object.assign'&&['S','state'].includes(member(n.arguments[0])))for(const obj of n.arguments.slice(1))if(obj.type==='ObjectExpression')for(const p of obj.properties)evidence.state.push({...loc,path:member(n.arguments[0])+'.'+(p.key?.name||p.key?.value||'[spread]'),mode:'write:Object.assign'});
  }
  if(n.type==='VariableDeclarator'&&n.init&&(member(n.init)?.startsWith('LEGACY.')||n.id.name==='LEGACY'))evidence.captures.push({...loc,name:n.id.name,value:source.slice(n.init.start,n.init.end)});
  if(['MemberExpression','OptionalMemberExpression'].includes(n.type)&&!(parent?.object===n)){
   const field=member(n);
   if(field?.startsWith('S.')||field?.startsWith('state.')){
    let mode='read';
    if(parent?.type==='AssignmentExpression'&&parent.left===n)mode=parent.operator==='='?'write':'read/write';
    else if(parent?.type==='UpdateExpression'||parent?.type==='UnaryExpression'&&parent.operator==='delete')mode='read/write';
    else if(parent?.type==='CallExpression'&&parent.callee===n&&mutators.has(field.split('.').at(-1)))mode='read/mutate';
    evidence.state.push({...loc,path:field,mode});
   }
  }
  for(const [key,value]of Object.entries(n)){
   if(['loc','extra','tokens','comments'].includes(key))continue;
   if(Array.isArray(value)){for(const child of value)if(child?.type)walk(child,n,scope,[...ancestors,n]);}
   else if(value?.type)walk(value,n,scope,[...ancestors,n]);
  }
 }
 walk(ast.program);
}
evidence.counts={modules:evidence.modules.length,functions:evidence.functions.length,calls:evidence.calls.length,stateAccesses:evidence.state.length,rngSites:evidence.rng.length};
const output=path.resolve(root,arg('output')||'test-results/stage5/architecture.json');
if(!output.startsWith(path.join(root,'test-results')+path.sep))throw Error('Output must stay in ignored test-results/');
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(evidence,null,2));
console.log(JSON.stringify({status:'INVENTORY_GENERATED_NOT_TEST_PASS',...evidence.counts,head:evidence.head,output}));
