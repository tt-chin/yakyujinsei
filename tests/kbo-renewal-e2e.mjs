import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.slice(name.length+3);
const baseline=arg('baseline')||'f3efb0ad80984422b5a42d9f86c04127f9404952';
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const hook=`
function applyKboForeignPackageCap(input){
 const record={input:{signingBonus:0,postingFee:0,incentiveRate:.07,...input},candidate:window.__kboCandidate,year:S.year,level:S.lv,currentSalary:S.currentSalary,contract:JSON.parse(JSON.stringify(S.ct)),calls:window.__rngCalls||0,rngState:S.rngState};
 record.packageCap=input.isRenewal?Math.min(300000000,Math.max(150000000,input.previousPackage*1.2)):150000000;
 try{const result=originalApplyKboForeignPackageCap(input);window.__kboCaps.push({...record,result});return result;}catch(error){window.__kboFailure??={...record,code:error.message};throw error;}
}
window.__kboCaps=[];
window.__kboTest={get:()=>({state:JSON.parse(JSON.stringify(S)),calls:window.__rngCalls||0,failure:window.__kboFailure||null,caps:window.__kboCaps}),
 fixture:()=>{actClear();S=newState('契約検証','IF');Object.assign(S,{year:2049,age:39,stage:'PRO',org:'KBO',lv:'KBO1',orgTeamId:'KBO_GWANGJU_TIGERS',currentSalary:168210000,contractSequence:9,marketInjury:'HEALTHY',lastD:-5.75,serviceTime:{KBO:8},ab:{sta:45,con:45,pow:45,spd:45,eye:45,rng:45,fld:45,arm:45},dpos:'DH',seasonFactor:1});S.ct=createContract({contractId:'KBO-FIXTURE',org:'KBO',teamId:S.orgTeamId,signedYear:2048,startYear:2049,years:1,annualSalary:S.currentSalary,incentive:createIncentiveTerms({org:'KBO',annualSalary:S.currentSalary})});S.ct=markSalaryPaid(S.ct,2049).contract;pendingOffseasonSalary=null;window.__fixtureAdv=0;const normalAdvance=advance;advance=()=>{finalizePendingOffseasonSalary();window.__fixtureAdv++;};choose('満了年度の降格',[{t:'KBO二軍へ降格',f:()=>{const from=S.lv;S.lv='KBO2';applyDemotionSalary(from,S.lv);advance();}}]);},
 pay:()=>{S.year=2050;S.pool=0;movement=()=>{window.__fixtureMoves=(window.__fixtureMoves||0)+1;};phaseEnd();},adv:()=>window.__fixtureAdv};`;
function instrument(source){
 source=source.replace('applyKboForeignPackageCap }','applyKboForeignPackageCap as originalApplyKboForeignPackageCap }')
  .replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;')
  .replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;')
  .replace("if(targetOrg==='KBO'){const cap=","if(targetOrg==='KBO'){window.__kboCandidate={sourceLevel,targetLevel,rating,convertedRating,baseSalary,raw,contractMult,positionMult,transferType,previousSalary,cross,injury};const cap=");
 const at=source.lastIndexOf('})();');assert.ok(at>0);return source.slice(0,at)+hook+source.slice(at);
}
const cache=new Map(),server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),old=u.pathname.startsWith('/baseline/'),rel=decodeURIComponent(u.pathname).replace(/^\/(baseline\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('path');if(old&&!cache.has(rel))cache.set(rel,execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:20e6}));let body=old?cache.get(rel):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(body);}catch(error){res.statusCode=404;res.end(String(error));}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local=`http://127.0.0.1:${server.address().port}`,target=arg('preview')||local,output=path.join(os.tmpdir(),'yakyujinsei-kbo-renewal');await mkdir(output,{recursive:true});
const channel=arg('channel')||'chrome';
const browser=await chromium.launch({channel,headless:true}),started=Date.now(),errors=[];
console.log('Browser '+channel+' '+browser.version());
const wire=(p,list=errors)=>{p.on('pageerror',e=>list.push(e.message));p.on('console',m=>{if(m.type()==='error')list.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))list.push(r.status()+' '+r.url());});};
async function start(p,url,pos){await p.goto(url);await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();}
// Exactly the championship-intl-e2e --balanced strategy; no state/RNG forcing.
function action(balanced){const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));if(balanced)rows.sort((a,b)=>{const priority=x=>['vel','ctl','brk','con','pow','eye','spd'].includes(x.dataset.abilityKey)?0:1;return priority(a)-priority(b)||parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent);});return rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];}
async function career(old,seed,pos,balanced){
 const p=await browser.newPage(),runErrors=[];wire(p,runErrors);
 if(!old&&arg('preview'))await p.route('**/src/engine/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:instrument(await response.text())});});
 await start(p,(old?local+'/baseline/':target+'/')+'?seed='+seed,pos);
 const result=await p.evaluate(async({source,balanced})=>{const choose=eval('('+source+')'),records=[];for(let i=0;i<2500;i++){const before=window.__kboTest.get();delete before.state.version;const bytes=new TextEncoder().encode(JSON.stringify({state:before.state,calls:before.calls}));const digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');if(before.state.done)return{records,final:before};const b=choose(balanced);if(!b)throw Error('NO_ACTION '+before.state.year+' '+before.state.lv);records.push({year:before.state.year,level:before.state.lv,action:b.innerText,calls:before.calls,rng:before.state.rngState,digest});b.click();if(window.__kboFailure)return{records,final:window.__kboTest.get()};}throw Error('Career did not complete');},{source:action.toString(),balanced});
 result.errors=runErrors;assert.equal(new URL(p.url()).search,'?seed='+seed);await p.close();return result;
}
let failure;
try{
 if(arg('preview')){const p=await browser.newPage();await p.goto(target);const files=execFileSync('git',['ls-files','docs'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(html|js|css)$/.test(f));for(const file of files){const text=await p.evaluate(async rel=>{const r=await fetch('./'+rel,{cache:'no-store'});if(!r.ok)throw Error(rel+' '+r.status);return r.text();},file.slice(5));assert.equal(text.replace(/\r\n/g,'\n'),(await readFile(path.join(root,file),'utf8')).replace(/\r\n/g,'\n'),file+' not latest');}console.log('Preview '+files.length+' assets match '+execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim());await p.close();}
 const old=await career(true,'jp3-infielder-01','IF',true);assert.equal(old.final.failure.code,'KBO_PACKAGE_FLOOR_CAP_CONFLICT');assert.equal(old.final.failure.year,2049);assert.equal(old.final.failure.input.annualSalary,7_360_000);assert.equal(old.final.failure.input.levelMinimum,8_000_000);assert.equal(old.final.failure.packageCap,215_976_000);await writeFile(path.join(output,'first-failure.json'),JSON.stringify(old,null,2));console.log('Baseline first failure: '+JSON.stringify(old.final.failure));
 const current=await career(false,'jp3-infielder-01','IF',true),repeat=await career(false,'jp3-infielder-01','IF',true);assert.equal(current.final.failure,null);assert.equal(current.final.state.done,true);assert.deepEqual(current,repeat,'same seed/strategy replay');assert.deepEqual(current.records.slice(0,old.records.length),old.records,'all pre-failure state/actions/RNG must match');const renewed=current.final.caps.find(c=>c.year===2049&&c.level==='KBO2'&&c.input.annualSalary===7_360_000);assert.equal(renewed.result.annualSalary,8_000_000);assert.equal(renewed.calls,old.final.failure.calls);assert.equal(renewed.rngState,old.final.failure.rngState);assert.deepEqual(renewed.contract,old.final.failure.contract,'existing guarantee/schedule unchanged');assert.deepEqual(current.errors,[]);await writeFile(path.join(output,'fixed-career.json'),JSON.stringify(current,null,2));console.log('Balanced IF: '+current.records.length+' actions, RNG '+current.final.calls+', retirement '+current.final.state.year+', all '+old.records.length+' prefix states/actions/RNG exact; repeat exact');
 if(!process.argv.includes('--quick'))for(const [seed,pos]of [['yakyo-test-001','P'],['jp3-infielder-01','IF']]){const a=await career(true,seed,pos,false),b=await career(false,seed,pos,false);delete a.final.state.version;delete b.final.state.version;assert.equal(a.final.failure,null);assert.deepEqual(b,a,seed+' unrelated state/actions/RNG');assert.equal(b.final.state.done,true);assert.deepEqual(b.errors,[]);console.log(seed+'/'+pos+': full state/actions/RNG exact '+b.final.calls);}
 for(const width of [1280,320,390]){
  const p=await browser.newPage({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});wire(p);
  if(arg('preview'))await p.route('**/src/engine/game.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:instrument(await r.text())});});
  await start(p,target+'/?seed=kbo-renewal-fixture','IF');await p.evaluate(()=>window.__kboTest.fixture());
  const before=await p.evaluate(()=>window.__kboTest.get());
  await p.locator('#act button').evaluate(b=>{b.click();b.click();});
  const after=await p.evaluate(()=>window.__kboTest.get());
  assert.equal(after.state.currentSalary,126_160_000);assert.equal(after.state.ct.startYear,2050);
  assert.equal(after.state.contractSequence,10);assert.equal(after.state.salaryDecisionHistory.length,1);
  assert.equal(await p.evaluate(()=>window.__kboTest.adv()),1);assert.equal(after.calls,before.calls);
  assert.equal(after.state.careerEarnings,before.state.careerEarnings);
  await p.evaluate(()=>window.__kboTest.pay());const paid=await p.evaluate(()=>window.__kboTest.get());
  assert.equal(paid.state.careerBaseSalary-after.state.careerBaseSalary,126_160_000);
  assert.equal(paid.state.careerEarnings-after.state.careerEarnings,126_160_000);
  assert.equal(paid.state.ct.annualSchedule.find(row=>row.year===2050).paid,true);
  await p.evaluate(()=>window.__kboTest.pay());
  assert.deepEqual(await p.evaluate(()=>window.__kboTest.get()),paid,'native season payment/progression/RNG once');
  assert.equal(await p.evaluate(()=>window.__fixtureMoves),1);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.screenshot({path:path.join(output,(arg('preview')?'preview-':'local-')+width+'.png'),animations:'disabled'});
  await p.close();console.log(width+'px expiry/demotion/renewal/double-click/native-payment-once/RNG PASS');
 }
 assert.deepEqual(errors,[]);console.log('Console/JS-CSS404 0; seconds '+(Date.now()-started)/1000+'; evidence '+output);
}catch(error){failure=error;console.error(error.message);}finally{
 server.closeAllConnections();server.close();
 let timer;
 try{await Promise.race([browser.close(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('BROWSER_CLOSE_TIMEOUT')),15_000);})]);}
 catch(error){
  // Browser.close also awaits profile cleanup. A disconnected browser is already
  // closed; report slow Windows temporary-file cleanup separately from game checks.
  if(error.message==='BROWSER_CLOSE_TIMEOUT'&&!browser.isConnected())console.warn('BROWSER_CLEANUP_WARNING: browser disconnected; temporary-profile cleanup timed out');
  else{failure??=error;console.error(error.message);}
 }
 finally{clearTimeout(timer);}
 process.exit(failure?1:0);
}
