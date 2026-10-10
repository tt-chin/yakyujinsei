import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {draftSigningTerms} from '../docs/src/engine/draft-signing-policy.js';
import {createSigningBonusTerms,applySigningPayment} from '../docs/src/engine/signing-bonus-policy.js';
import {createContract,normalizeContract} from '../docs/src/engine/contract-policy.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const preview=arg('preview'),baseline=arg('baseline')||'35c40a26aef244908725d2d083f6a622640da0cb';
const head=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const observer='window.__draftIncomeTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__draftRngCalls||0}),fixture:development=>Object.assign(S,{stage:"HS",stageYr:3,year:2028,age:35,traits:{},ab:{sta:development?39:60,vel:development?39:60,ctl:development?39:60,brk:development?39:60},ct:null,draftRights:null,currentSalary:0,careerEarnings:0,careerSigningBonus:0,careerDevelopmentStipend:0,careerBaseSalary:0,careerIncentive:0,careerBuyout:0,careerOutsideIncome:0,yearOutsideIncome:0,corpIncome:0,signingPayments:{},contractSequence:0}),draft:()=>runDraft(false,()=>{}),repay:()=>applySigningPayment(S,S.ct),normalizeAndRepay:()=>{S.ct=normalizeContract(S.ct,{currentYear:S.year,currentSalary:S.currentSalary,org:S.org,teamId:S.orgTeamId});return applySigningPayment(S,S.ct);},retire:()=>endGame("E2E retirement stop fixture")};';
const instrument=(source,readOnly=false)=>source.replace('function R(){','function R(){window.__draftRngCalls=(window.__draftRngCalls||0)+1;').replace('R = function(){','R = function(){window.__draftRngCalls=(window.__draftRngCalls||0)+1;')+'\n'+(readOnly?'window.__draftIncomeTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__draftRngCalls||0})};':observer);
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost'),old=u.pathname.startsWith('/baseline/'),rel=decodeURIComponent(u.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';if(rel.split('/').includes('..'))throw Error('Invalid path');let content=old?execFileSync('git',['show',baseline+':docs/'+rel],{cwd:root,maxBuffer:20*1024*1024}):await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')content=instrument(content.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local='http://127.0.0.1:'+server.address().port,target=preview||local;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const artifacts=path.join(os.tmpdir(),'yakyujinsei-draft-income',preview?'preview':'local',process.argv.includes('--retirement-only')?'retirement':process.argv.includes('--careers-only')?'careers':process.argv.includes('--quick')?'quick':'full');await mkdir(artifacts,{recursive:true});
const errors=[],results=[],started=Date.now();
const save=(name,data)=>writeFile(path.join(artifacts,name+'.json'),JSON.stringify(data,null,2));
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const get=p=>p.evaluate(()=>window.__draftIncomeTest.get());
const start=async(p,url,pos='P')=>{await p.goto(url);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#in-name').fill('イベント検証');await p.locator('#btn-start').click();assert.equal((await get(p)).state.pos,pos,'position listener must be ready');};
const context=width=>browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500});
const pass=name=>{results.push({name,status:'PASS'});console.log('PASS '+name);};
// Ordinary UI operations. Balance current values, preserving DOM order on ties.
const step=balanced=>{const h=window.__draftIncomeTest.get(),act=document.querySelector('#act');if(document.querySelector('#log').innerText.includes('新人年俸'))return{outcome:'signed',h};if(h.state.done||document.querySelector('#sh-img'))return{outcome:'retired',h};let rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));if(balanced)rows.sort((a,b)=>Number(a.querySelector('.val')?.firstChild.textContent)-Number(b.querySelector('.val')?.firstChild.textContent));const buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)throw Error('No draft choice');const record={outcome:'advanced',h,choices:act.innerText,action:b.innerText,key:b.dataset.abilityKey||null};b.click();return record;};
const advance=async(p,balanced,name)=>{const history=[];for(let i=0;i<1000;i++){const r=await p.evaluate(step,balanced);history.push(r);if(r.outcome!=='advanced'){await save(name,history);return{outcome:r.outcome,history,h:r.h};}}throw Error('No draft outcome within 1000 steps');};
const terminalCheck=async p=>{const before=await p.evaluate(()=>({h:window.__draftIncomeTest.get(),html:document.querySelector('#act').innerHTML,url:location.href}));assert.equal(before.h.state.done,true);assert.equal((await p.evaluate(step,false)).outcome,'retired');assert.deepEqual(await p.evaluate(()=>({h:window.__draftIncomeTest.get(),html:document.querySelector('#act').innerHTML,url:location.href})),before);};
const incomeKeys=['careerEarnings','careerSigningBonus','careerDevelopmentStipend','careerBaseSalary','careerIncentive','careerBuyout','careerOutsideIncome','yearOutsideIncome','corpIncome'];
const income=s=>Object.fromEntries(incomeKeys.map(k=>[k,s[k]||0]));
const approvedRoutes=JSON.parse(await readFile(new URL('./fixtures/draft-income-routes.json',import.meta.url),'utf8')).routes;
const checkRoute=(result,seed,balanced)=>{
 const expected=approvedRoutes.find(r=>r.seed===seed&&(r.strategy==='first-row')===!balanced);
 assert.ok(expected,'recorded route exists');
 const actions=result.history.filter(r=>r.outcome==='advanced').map(r=>r.key?'ability:'+r.key:'choice:'+r.action.split('\n')[0]);
 assert.deepEqual(actions,expected.history.flatMap(r=>Array(r.count).fill(r.action)),'complete recorded choice history');
 assert.equal(actions.length,expected.actions);assert.equal(result.outcome,expected.outcome);assert.equal(result.h.state.year,expected.year);assert.equal(result.h.state.lv,expected.level);assert.equal(result.h.rng,expected.rng);assert.equal(result.h.calls,expected.calls);
 for(const[k,value]of Object.entries(expected.income))assert.equal(result.h.state[k],value,k);
 const s=result.h.state;assert.equal(s.careerEarnings,(s.careerSigningBonus||0)+(s.careerDevelopmentStipend||0)+(s.careerBaseSalary||0)+(s.careerIncentive||0)+(s.careerBuyout||0)+(s.careerOutsideIncome||0)+(s.corpIncome||0),'yearOutsideIncome is not counted twice');
};
const detail=async(p,name)=>{const before=await get(p);for(let i=0;i<2;i++){await p.locator('#salary-detail-trigger').click();const rows=await p.locator('#salary-detail-body').evaluate(el=>Object.fromEntries([...el.querySelectorAll('dt')].map(dt=>[dt.textContent,dt.nextElementSibling?.textContent])));const fmt=n=>n===0?'0円':(n/10000).toLocaleString('ja-JP')+'万円';const s=before.state,ct=s.ct;for(const[label,value]of[['契約金累計',s.careerSigningBonus||0],['育成支度金累計',s.careerDevelopmentStipend||0],['固定年俸累計',s.careerBaseSalary||0],['出来高累計',s.careerIncentive||0],['買い取り累計',s.careerBuyout||0],['スポンサー収入累計',s.careerOutsideIncome||0],['今季スポンサー収入',s.yearOutsideIncome||0],['社会人給与累計',s.corpIncome||0],['生涯総収入',s.careerEarnings||0],['保証年俸総額',ct.guaranteedTotal],['未払い年俸',ct.remainingValue],['支払済み',ct.paidTotal]])assert.equal(rows[label],fmt(value),label);if(ct.signingBonus>0)assert.equal(rows['契約金'],fmt(ct.signingBonus));if(ct.developmentStipend>0)assert.equal(rows['育成支度金'],fmt(ct.developmentStipend));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'horizontal overflow');if(i===0)await p.screenshot({path:path.join(artifacts,name+'.png')});await p.locator('#salary-detail-close').click();}assert.deepEqual(await get(p),before,'detail redraw state/RNG');};
let failure;
try{
 for(const type of ['ROSTER','DEVELOPMENT']){
  const terms=createSigningBonusTerms({route:'NPB_DRAFT',draftType:type,bonus:60_000_000}),state=Object.fromEntries(incomeKeys.map(k=>[k,0]));state.signingPayments={};
  const ct=createContract({contractId:'minimum-'+type,org:'NPB',teamId:'TEAM',signedYear:2028,startYear:2029,years:1,annualSalary:draftSigningTerms(type,2).rookieSalary,signingBonus:terms.signingBonus,developmentStipend:terms.developmentStipend});
  assert.equal(terms.developmentStipend,type==='DEVELOPMENT'?2_900_000:0,'CURRENT_SPEC approved development stipend');
  assert.equal(applySigningPayment(state,ct).amount,terms.playerIncome);assert.equal(state.careerEarnings,state.careerSigningBonus+state.careerDevelopmentStipend);assert.equal(state.careerSigningBonus,terms.signingBonus);assert.equal(state.careerDevelopmentStipend,terms.developmentStipend);assert.equal(state.careerBaseSalary,0);
  const saved=JSON.stringify(state);assert.equal(applySigningPayment(state,ct).paid,false);assert.equal(applySigningPayment(state,normalizeContract(ct)).paid,false);assert.equal(JSON.stringify(state),saved);
  await save('minimum-'+type,{terms,contract:ct,income:state});pass('minimal payment '+type);
 }
 if(preview){const files=execFileSync('git',['ls-files','docs'],{cwd:root,encoding:'utf8'}).trim().split(/\r?\n/).filter(f=>/\.(html|js|css)$/.test(f));for(const f of files){const response=await fetch(preview.replace(/\/$/,'')+'/'+f.slice(5),{cache:'no-store'});assert.equal(response.status,200,f);assert.equal((await response.text()).replaceAll('\r\n','\n'),(await readFile(path.join(root,f),'utf8')).replaceAll('\r\n','\n'),f);}pass('latest Preview assets '+files.length+' match '+head);}
 for(const width of process.argv.includes('--careers-only')?[]:[1280,320,390]){
  const ctx=await context(width);
  if(preview)await ctx.route('**/src/engine/game.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:instrument(await response.text(),true)});});
  if(process.argv.includes('--retirement-only')){assert.ok(!preview,'retirement fixture local only');const p=await ctx.newPage();wire(p);await start(p,local+'/?seed=bonus-ui');await p.evaluate(()=>window.__draftIncomeTest.retire());await terminalCheck(p);pass(width+' retirement fixture unchanged state/RNG/DOM/URL');await ctx.close();continue;}
  if(!preview)for(const development of [false,true]){
   const p=await ctx.newPage();wire(p);await start(p,local+'/?seed=bonus-ui');await p.evaluate(dev=>{window.__draftIncomeTest.fixture(dev);window.__draftIncomeTest.draft();},development);
   const offer=await get(p);assert.equal(offer.state.draftRights.type,development?'DEVELOPMENT':'ROSTER');
   const button=await p.locator('#act button').filter({hasText:'指名を受けて入団'}).elementHandle();await button.click();const accepted=await get(p),s=accepted.state,ct=s.ct;
   const terms=createSigningBonusTerms({route:'NPB_DRAFT',draftType:offer.state.draftRights.type,bonus:ct.signingBonus});
   assert.equal(s.careerSigningBonus,terms.signingBonus);assert.equal(s.careerDevelopmentStipend,terms.developmentStipend);assert.equal(s.careerEarnings,terms.playerIncome);
   for(const k of incomeKeys.filter(k=>!['careerEarnings','careerSigningBonus','careerDevelopmentStipend'].includes(k)))assert.equal(s[k],0,k);
   assert.equal(ct.contractType,development?'DEVELOPMENT':'CONTROL');assert.equal(ct.annualSalary,draftSigningTerms(offer.state.draftRights.type,offer.state.draftRights.round).rookieSalary);assert.equal(ct.paidTotal,0);assert.ok(ct.annualSchedule.every(x=>!x.paid&&x.year>s.year));
   await button.evaluate(b=>b.click());assert.deepEqual(await get(p),accepted,'stale accept cannot execute twice');assert.equal((await p.evaluate(()=>window.__draftIncomeTest.repay())).paid,false);assert.equal((await p.evaluate(()=>window.__draftIncomeTest.normalizeAndRepay())).paid,false);assert.deepEqual(income((await get(p)).state),income(s));assert.equal((await get(p)).calls,accepted.calls);
   assert.equal(accepted.calls,offer.calls,'draft acceptance must not add RNG');
   await detail(p,'fixture-'+width+'-'+development);assert.deepEqual(await get(p),accepted,'repayment/normalization/redraw full state/RNG unchanged');await save('fixture-'+width+'-'+development,{offer,accepted,after:await get(p)});pass(width+' native '+ct.contractType+' draft/payment/detail');await p.close();
  }
  for(const[seed,type]of[['bonus-ui','DEVELOPMENT'],['jp3-infielder-01','CONTROL']]){
   const runs=[];for(let repeat=0;repeat<2;repeat++){const p=await ctx.newPage();wire(p);await start(p,target+'/?seed='+seed,'P');const result=await advance(p,true,'natural-'+width+'-'+seed+'-'+repeat);checkRoute(result,seed,true);assert.equal(result.outcome,'signed','retirement without signing is not positive PASS');assert.equal(result.h.state.ct.contractType,type);assert.equal(result.h.state.pos,'P');assert.equal(result.h.state.careerBaseSalary,0);assert.equal(result.h.state.ct.paidTotal,0);assert.ok(result.h.state.ct.annualSchedule.every(x=>!x.paid),'future salary not received');await detail(p,'natural-'+width+'-'+seed);runs.push(result);await p.close();}assert.deepEqual(runs[0],runs[1],'natural choices/full state/RNG repeat');pass(width+' natural '+type+' signing repeat/detail/RNG');
  }
  const p=await ctx.newPage();wire(p);await start(p,target+'/?seed=bonus-ui');const negative=await advance(p,false,'negative-'+width);checkRoute(negative,'bonus-ui',false);assert.equal(negative.outcome,'retired');assert.equal(negative.h.state.ct,null);assert.equal(negative.h.state.careerSigningBonus,0);assert.equal(negative.h.state.careerDevelopmentStipend,0);await terminalCheck(p);pass(width+' negative non-signing retirement no restart');await ctx.close();
 }
 // v1.8.0 predates approved policy changes; compare this test-only task's dev baseline.
 if(!preview&&!process.argv.includes('--quick')&&!process.argv.includes('--retirement-only'))for(const[seed,pos]of[['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-catcher-01','C'],['jp3-infielder-01','IF'],['jp3-outfielder-01','OF']]){
  const runs=[];for(const old of[true,false]){const p=await browser.newPage();wire(p);await start(p,local+(old?'/baseline/':'/')+'?seed='+seed,pos);const history=[];for(let i=0;i<2000;i++){const r=await p.evaluate(()=>{const h=window.__draftIncomeTest.get();delete h.state.version;const act=document.querySelector('#act');if(h.state.done)return{h,done:true};const rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)throw Error('No choice');const action=b.innerText;b.click();return{h,action,done:false};});history.push(r);if(r.done)break;if(i===1999)throw Error('Career incomplete');}assert.equal(history.at(-1).h.state.done,true);const retired=await get(p);await p.locator('#sh-img').click();await p.locator('#sh-out img').waitFor();assert.deepEqual(await get(p),retired,'retirement image must not change state/RNG');assert.match(await p.locator('#log').innerText(),/スポンサー収入累計/);await save('career-'+seed+'-'+(old?'baseline':'current'),history);runs.push(history);await p.close();}assert.deepEqual(runs[0],runs[1],'baseline full state/actions/RNG '+seed);pass(seed+'/'+pos+' baseline career identical');
 }
 assert.deepEqual(errors,[]);pass('Console Error / JS-CSS404 zero');
}catch(e){failure=e;results.push({name:e.message,status:'FAIL'});console.error(e);}
finally{await save('summary',{head,baseline,target,browser:browser.version(),seconds:(Date.now()-started)/1000,results,errors});console.log(JSON.stringify({pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,blocked:0,seconds:(Date.now()-started)/1000,artifacts}));server.closeAllConnections();server.close();server.unref();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}

