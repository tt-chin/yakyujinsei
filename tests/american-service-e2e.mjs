import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(v=>v.startsWith('--'+n+'='))?.slice(n.length+3);
const baseline='8964d627a1f2dff5f38da31bd3a092eeaa903a6e',output=path.resolve(arg('output')||'test-results/american-service-native');await mkdir(output,{recursive:true});
const hook=`
window.__usDraws=[];careerRng.onDraw=value=>window.__usDraws.push({value,state:S.rngState});
flowHooks.advance=()=>{};
window.__us={
 get:()=>({state:JSON.parse(JSON.stringify(S)),draws:window.__usDraws.slice(),stage:contractStageFor(S.org),title:document.querySelector('#act > .title')?.textContent||'',buttons:[...document.querySelectorAll('#act > button')].map(n=>n.textContent)}),
 fixture:v=>{actClear();S={rngState:0};seedInit(SEED);S=newState('米国年資検証',v.pos);const org=LV[v.level].org;Object.assign(S,{stage:'PRO',lv:v.level,org:v.org||org,orgTeamId:listByOrg(org)[0].teamId,year:2032,age:28,stageYr:3,role:v.pos==='P'?'SP':null,dpos:v.pos==='P'?null:'SS',lastD:0,lastSt:null,seasonFactor:v.factor??1,skipMid:false,pool:0,currentSalary:salaryFor(v.level,0),americanContractSigned:true,serviceTime:{NPB:4,MLB:v.years||0,KBO:2,CPBL:3},serviceTimeAccruedYear:2031,svc:20,svcOrg:v.org||org});for(const k of Object.keys(S.ab))S.ab[k]=65;S.ct=createContract({contractId:'US-CHECK',org:S.org,teamId:S.orgTeamId,signedYear:2030,startYear:2031,years:v.active?4:2,annualSalary:S.currentSalary});S.ct=markSalaryPaid(S.ct,2031).contract;S.ct=markSalaryPaid(S.ct,2032).contract;careerSession.pendingOffseasonSalary=null;careerSession.seasonEndContext=null;document.getElementById('log').replaceChildren();divider('2032年');window.__usDraws=[];},
 accrue:()=>{const saved=careerMovement.movement;careerMovement.movement=()=>{};try{movement();}finally{careerMovement.movement=saved;}},
 decide:()=>careerMovement.movement(),
 sign:(org,level)=>signTo(org,level,listByOrg(org)[0].teamId,2,1,'NEW_CONTRACT',{annualSalary:120000000}),
 level:to=>{const from=S.lv;S.lv=to;if(to==='MLB')applyPromotionSalary(from,to);else applyDemotionSalary(from,to);},
 trade:()=>doTradeExec(),renew:()=>renewAndAdvance(1,false,'CONTROL'),
 settle:()=>browserSave.settled()
};`;
const cache=new Map(),server=createServer(async(req,res)=>{try{let rel=new URL(req.url,'http://local').pathname.slice(1)||'index.html',old=rel.startsWith('baseline/');if(old)rel=rel.slice(9)||'index.html';if(rel==='favicon.ico'){res.statusCode=204;return res.end();}if(rel.split('/').includes('..'))throw Error('path');let body;if(old){if(!cache.has(rel))cache.set(rel,execFileSync('git',['show',baseline+':docs/'+rel],{cwd:root,maxBuffer:30e6}));body=cache.get(rel);}else body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=body.toString()+hook;res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':'text/html');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});await new Promise(r=>server.listen(0,'127.0.0.1',r));
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright'),browser=await chromium.launch({headless:true,channel:arg('browser')||'chromium'}),errors=[],cases=[];
async function open(pos,old=false){const p=await browser.newPage({viewport:{width:390,height:844}});await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.fulfill({body:'',contentType:'text/css'}));p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto('http://127.0.0.1:'+server.address().port+(old?'/baseline/':'/')+'?seed=american-service-'+pos);await p.waitForFunction(()=>!document.getElementById('btn-start').disabled);await p.locator('#in-name').fill('米国年資検証');await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();await p.evaluate(()=>window.__us.settle());return p;}
const get=p=>p.evaluate(()=>window.__us.get());
let failure;
try{
 for(const pos of ['P','IF']){
  const p=await open(pos),old=await open(pos,true);
  for(const org of ['MiLB','MLB'])for(const years of [2,5])for(const active of [false,true]){
   const input={pos,org,level:'MLB',years,active};for(const q of [p,old])await q.evaluate(v=>window.__us.fixture(v),input);
   const before=await get(p),previous=await get(old);assert.deepEqual(before.state,previous.state,'exact same fixture before the changed accrual');assert.deepEqual(before.draws,previous.draws);
   for(const q of [p,old])await q.evaluate(()=>window.__us.accrue());
   const after=await get(p),legacy=await get(old);assert.equal(after.state.serviceTime.MLB,years+1);assert.equal(after.state.org,'MLB');assert.equal(after.draws.length,0,'repair/accrual adds no RNG draw');
   if(org==='MiLB'){
    assert.equal(legacy.state.serviceTime.MLB,years);assert.equal(legacy.stage,'CONTROL');
    const permitted=structuredClone(legacy.state);permitted.org='MLB';permitted.serviceTime.MLB=years+1;permitted.faElig=true;
    assert.deepEqual(after.state,permitted,'only declared org/service/derived eligibility differs before FA');
   }else assert.deepEqual(after,legacy,'consistent direct MLB entry remains exact');
   const contract=structuredClone(after.state.ct);for(const q of [p,old])await q.evaluate(()=>window.__us.decide());
   const decision=await get(p);assert.equal(decision.stage,years===2?'ARBITRATION':'FA');
   if(active){assert.equal(decision.state.lastFaMarket,null);assert.deepEqual(decision.state.ct,contract,'unexpired multi-year schedule remains intact');}
   else if(years===2){assert.match(decision.title,/MLB年俸調停/);assert.equal(decision.state.lastFaMarket,null);}
   else{assert.ok(decision.state.lastFaMarket,'expired six-year MLB player enters the actual FA market');assert.equal(decision.state.lastFaMarket.generatedYear,2032);if(decision.state.lastFaMarket.stayOffer)assert.equal(decision.state.lastFaMarket.stayOffer.org,'MLB');assert.ok(decision.draws.length>after.draws.length,'real FA offers consume the existing RNG after the explained branch');}
   if(org==='MLB')assert.deepEqual(decision,await get(old),'direct MLB decision and every RNG value stay exact');
   if(years===5&&!active){const repeat=await open(pos);await repeat.evaluate(v=>window.__us.fixture(v),input);await repeat.evaluate(()=>{window.__us.accrue();window.__us.decide();});assert.deepEqual(await get(repeat),decision,'fixed seed FA result is repeatable');await repeat.close();}
   cases.push({pos,org,years,active,status:'PASS'});
  }
  for(const level of ['NPB1','KBO1','CPBL1']){
   for(const q of [p,old])await q.evaluate(v=>window.__us.fixture(v),{pos,level,years:0,active:false});
   for(const q of [p,old])await q.evaluate(()=>{window.__us.accrue();window.__us.decide();});
   assert.deepEqual(await get(p),await get(old),level+' complete state, choice labels and every RNG value unchanged');cases.push({pos,level,status:'PASS'});
  }
  await p.evaluate(v=>window.__us.fixture(v),{pos,level:'A3',active:true,years:2});
  await p.evaluate(()=>window.__us.level('MLB'));assert.equal((await get(p)).state.org,'MLB');
  await p.evaluate(()=>window.__us.level('A3'));assert.equal((await get(p)).state.org,'MiLB');
  await p.evaluate(()=>window.__us.level('MLB'));const promoted=await get(p);assert.equal(promoted.state.serviceTime.MLB,2);
  await p.evaluate(()=>window.__us.trade());const traded=await get(p);assert.equal(traded.state.org,'MLB');assert.equal(traded.state.ct.org,'MLB');assert.deepEqual(traded.state.ct.annualSchedule,promoted.state.ct.annualSchedule,'trade retains scheduled guarantees');
  await p.evaluate(v=>window.__us.fixture(v),{pos,level:'MLB',org:'MiLB',active:false,years:2});await p.evaluate(()=>window.__us.renew());assert.equal((await get(p)).state.ct.org,'MLB');
  for(const [org,level,expected] of [['MiLB','MLB','MLB'],['MLB','A3','MiLB']]){await p.evaluate(v=>window.__us.fixture(v),{pos,level:'A3',active:true});await p.evaluate(v=>window.__us.sign(v.org,v.level),{org,level});const signed=await get(p);assert.equal(signed.state.org,expected);assert.equal(signed.state.ct.org,expected);assert.equal(signed.state.lv,level);}
  cases.push({pos,route:'sign/promote/demote/re-promote/trade/renew',status:'PASS'});await p.close();await old.close();
 }
 assert.deepEqual(errors,[]);console.log('PASS US native: '+cases.length+' cases; complete state/RNG against '+baseline+' with exact declared US deltas');
}catch(e){failure=e;console.error(e.stack);}finally{await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));await writeFile(path.join(output,'summary.json'),JSON.stringify({status:failure?'FAIL':'PASS',baseline,cases,errors,failure:failure?.stack},null,2));}
if(failure)throw failure;
