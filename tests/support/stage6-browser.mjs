import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';

export const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
export const root=fileURLToPath(new URL('../../',import.meta.url));
export const clone=x=>JSON.parse(JSON.stringify(x));
// Test-only response instrumentation. No served game file is edited on disk.
const hook=`
const s6clone=x=>JSON.parse(JSON.stringify(x));
let s6rng=[],s6steps=[],s6done=0,s6moves=0;
const s6R=R;R=()=>{const before=S.rngState,value=s6R();s6rng.push({before,after:S.rngState,value});return value;};
const s6allocDone=allocDone;allocDone=(t,d)=>{s6steps.push({kind:'confirm',touched:s6clone(t),isDice:d,state:s6clone(S)});return s6allocDone(t,d);};
window.__stage6={
 get:()=>({state:s6clone(S),rng:s6clone(s6rng),allocation:window.__s6allocation?.(),steps:s6clone(s6steps),done:s6done,moves:s6moves,generation:choiceGeneration,token:activeChoiceToken&&{generation:activeChoiceToken.generation,running:activeChoiceToken.running},queue:stepQ.map(f=>f.name),dom:$('act').outerHTML,listeners:[...$('act').querySelectorAll('.abrow,button')].map(e=>({key:e.dataset.abilityKey,label:e.textContent,onclick:typeof e.onclick==='function',onkeydown:typeof e.onkeydown==='function',connected:e.isConnected,disabled:e.disabled??e.getAttribute('aria-disabled'),tabIndex:e.tabIndex}))}),
 fixture:v=>{actClear();S={rngState:0};seedInit(SEED);S=newState('第六階段検証',v.pos||'P');if(v.stage==='HS'){S.stage='HS';setSchool('HS');}else setAmateur(v.stage||'CORP');Object.assign(S,{age:v.age??25,year:2032,stageYr:1,lastD:0,rehab:0,pool:0,seasonFactor:1,skipMid:false,lastOverflow:0,dpos:v.pos==='IF'?'SS':null});for(const k of POS_AB[S.pos]){S.ab[k]=v.ability??40;S.pot[k]=v.potential??80;}S.carry=v.carry??{sta:0};if(v.key&&v.value!==undefined)S.ab[v.key]=v.value;S.traits={...(v.traits||{})};S.samePick=0;S.samePickKey=null;S.comboKey=null;S.samePickBonus=false;stepQ=[];seasonEndContext=null;pendingOffseasonSalary=null;window.__s6allocation=null;s6rng=[];s6steps=[];s6done=0;s6moves=0;board(0);},
 alloc:mode=>allocUI(mode,'第六階段・能力配分',()=>{s6done++;choose('次の操作',[{t:'次へ',f:()=>{s6steps.push({kind:'next'});}}]);}),
 cost:k=>abCost(k),pre:()=>phasePre(),end:()=>phaseEnd(),corpSeason:()=>amateurSeason(),fixtureYear:y=>{S.year=y;},
 corpChoice:()=>choose('年度決算検証',[{t:'年度決算',f:()=>phaseEnd()}]),
 quietEnd:()=>{const move=movement;movement=()=>s6moves++;try{phaseEnd();}finally{movement=move;}},
 offer:(fault)=>{const candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:'NPB2',rating:0,contractMult:1});const team=listByOrg('NPB')[0].teamId;const fixed=fixedContract,originalCard=card;let injected=false;choose('契約検証',[{t:'契約を受諾',f:()=>{if(fault&&!injected){if(fault==='post-payment')card=(...args)=>{if(args[1]==='契約'){injected=true;throw Error('STAGE6_FAULT_INJECTION');}return originalCard(...args);};else fixedContract=()=>{injected=true;throw Error('STAGE6_FAULT_INJECTION');};}try{signTo('NPB','NPB2',team,1,1,'NEW_CONTRACT',{candidate,annualSalary:6000000,contractType:'ROOKIE',signingBonus:50000000,signingTerms:{signingBonus:50000000,signingBonusType:'NPB_DRAFT',developmentStipend:0}});choose('契約後',[{t:'次年度へ',f:()=>advance()}]);}finally{fixedContract=fixed;card=originalCard;}}}]);},
 normalizedCarry:()=>{const normalized={};for(const k of POS_AB[S.pos])normalized[k]=S.carry?.[k]||0;return normalized;},
 serialize:()=>JSON.stringify(S)
};`;
export function instrument(source){
  const marker='  const touchedKeys={};';assert.equal(source.split(marker).length,2);
  source=source.replace(marker,marker+`\n  window.__s6allocation=()=>({pool,idx,dice:dice&&dice.slice(),hist:JSON.parse(JSON.stringify(hist)),touchedKeys:{...touchedKeys},remaining:remaining(),start:JSON.parse(JSON.stringify(sessionStart))});`);
  const at=source.lastIndexOf('})();');assert.ok(at>0);
  return source.slice(0,at)+hook+source.slice(at);
}
export async function harness(name){
  const output=path.resolve(arg('output')||path.join(os.tmpdir(),name));await mkdir(output,{recursive:true});
  const server=createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1)||'index.html';assert.ok(!rel.split('/').includes('..'));let body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':'text/html');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  let browser;
  try{const {chromium}=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright');browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});}catch(e){server.close();throw e;}
  const records=[],errors=[];
  const get=p=>p.evaluate(()=>window.__stage6.get());
  const save=async(id,data)=>writeFile(path.join(output,id+'.json'),JSON.stringify(data,null,2));
  async function page(width=1280,pos='P',seed='stage6-'+pos){const p=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});p.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}));p.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push({type:'asset',message:r.status()+' '+r.url()});});await p.goto('http://127.0.0.1:'+server.address().port+'/?seed='+seed);await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();return p;}
  async function test(id,input,action){const entry={id,input,status:'PASS',snapshots:[]};const start=Date.now();try{await action(entry);}catch(e){entry.status='FAIL';entry.error=e.stack;}entry.seconds=(Date.now()-start)/1000;records.push(entry);await save(id,entry);console.log(entry.status+' '+id+(entry.error?' '+entry.error.split('\n')[0]:''));}
  async function finish(){const summary={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),version:(await readFile(path.join(root,'docs/src/config.js'),'utf8')).match(/VERSION\s*=\s*['"]([^'"]+)/)[1],browser:browser.version(),node:process.version,platform:process.platform,pass:records.filter(r=>r.status==='PASS').length,fail:records.filter(r=>r.status==='FAIL').length,errors,records:records.map(({id,input,status,error,classification,seconds})=>({id,input,status,error,classification,seconds}))};await save('summary',summary);console.log(JSON.stringify({...summary,records:undefined,output}));server.closeAllConnections();server.close();let timer;try{await Promise.race([browser.close(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('BROWSER_CLOSE_TIMEOUT')),15000))]);}catch(e){if(e.message==='BROWSER_CLOSE_TIMEOUT'&&!browser.isConnected()){summary.cleanupWarning='Disconnected browser profile cleanup timed out';console.warn(summary.cleanupWarning);}else throw e;}finally{clearTimeout(timer);}await save('summary',summary);return summary;}
  return{page,get,test,save,finish,errors,output};
}
