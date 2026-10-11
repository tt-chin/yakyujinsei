import assert from 'node:assert/strict';
import {harness} from './support/stage6-browser.mjs';
const h=await harness('yakyujinsei-stage7-safety');
const snap=async(p,e,operation)=>{const s=await h.get(p);e.snapshots.push({operation,...s});return s;};
try{
 for(const width of [1280,320,390])for(const pos of ['P','IF'])for(const mode of [{pool:3},{dice:[2,4,6]}]){
  const p=await h.page(width,pos,'stage7-'+pos),key=pos==='P'?'vel':'con';
  await h.test(`session-${width}-${pos}-${mode.dice?'dice':'pool'}`,{width,pos,mode,seed:'stage7-'+pos},async e=>{
   await p.evaluate(({pos,mode})=>{window.__stage6.fixture({pos});window.__stage6.alloc(mode);},{pos,mode});
   const row=()=>p.locator(`[data-ability-key="${key}"]`),undo=()=>p.locator('#al-btm button').filter({hasText:'元に戻す'}),reset=()=>p.locator('#al-btm button').filter({hasText:'すべてリセット'});
   const old=await row().elementHandle();await row().press('Enter');const once=await snap(p,e,'Enter');
   await old.evaluate(b=>{b.onclick();b.onkeydown({key:' ',preventDefault(){}});});assert.deepEqual(await h.get(p),once,'detached row must be inert even with budget left');
   const staleUndo=await undo().elementHandle(),staleReset=await reset().elementHandle();await row().press('Space');const twice=await snap(p,e,'Space');
   await staleUndo.evaluate(b=>b.onclick());await staleReset.evaluate(b=>b.onclick());assert.deepEqual(await h.get(p),twice,'old render Undo/reset must be inert');
   await reset().click();const initial=await snap(p,e,'live reset');assert.equal(initial.allocation.remaining,3);assert.deepEqual(initial.allocation.touchedKeys,{});
   const replaced=await row().elementHandle();await p.evaluate(mode=>window.__stage6.alloc(mode),mode);const fresh=await snap(p,e,'replacement session');await replaced.evaluate(b=>b.onclick());assert.deepEqual(await h.get(p),fresh,'prior session must be inert');
   for(let i=0;i<3;i++){if(width<500)await row().tap();else await row().click();}
   const confirm=await p.locator('#al-btm .main').elementHandle();await p.locator('#al-btm .main').click();const done=await snap(p,e,'confirmed');await confirm.evaluate(b=>{b.onclick();b.onclick();});assert.deepEqual(await h.get(p),done);assert.equal(done.done,1);assert.deepEqual(done.rng,[]);assert.ok(await p.locator('#act button').isVisible());assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  });await p.close();
 }
 const p=await h.page(1280,'IF','stage7-transactions');
 for(const fault of ['none','before-payment','after-payment'])await h.test('corp-'+fault,{fault,faultInjection:fault!=='none',nativeSeason:true},async e=>{
  await p.evaluate(()=>{window.__stage6.fixture({stage:'CORP',pos:'IF'});window.__stage6.corpSeason();window.__stage6.corpEvent();});const before=await snap(p,e,'native season and event');assert.ok(before.state.yearOutsideIncome>0);
  if(fault!=='none'){assert.equal(await p.evaluate(f=>window.__stage6.corpFault(f),fault),'STAGE7_CORP_FAULT');const failed=await snap(p,e,'injected '+fault);assert.equal(failed.state.corpIncome-before.state.corpIncome,fault==='before-payment'?0:4200000);assert.deepEqual(failed.rng,before.rng);}
  await p.evaluate(()=>window.__stage6.end());const paid=await snap(p,e,'successful retry');assert.equal(paid.state.corpIncome-before.state.corpIncome,4200000);assert.equal(paid.state.careerEarnings-before.state.careerEarnings,4200000);assert.equal(paid.state.yearOutsideIncome,before.state.yearOutsideIncome);assert.deepEqual(paid.state.log,before.state.log);assert.deepEqual(paid.rng,before.rng);
  await p.evaluate(()=>window.__stage6.end());assert.deepEqual(await h.get(p),paid,'same-year complete settlement no-op');
  await p.evaluate(()=>{window.__stage6.fixtureYear(2033);window.__stage6.corpSeason();window.__stage6.end();});const next=await snap(p,e,'next year');assert.equal(next.state.corpIncome-paid.state.corpIncome,4200000);assert.equal(next.state.log.length,2);const nextR=next.rng;await p.evaluate(()=>window.__stage6.end());assert.deepEqual((await h.get(p)).rng,nextR);assert.equal((await h.get(p)).state.corpIncome,next.state.corpIncome);
 });
 await h.test('sign-validation-before-commit',{faultInjection:true,point:'createContract structuredClone validation'},async e=>{
  await p.evaluate(()=>{window.__stage6.fixture({stage:'CORP'});window.__stage6.offer('validation');});const before=await snap(p,e,'offered'),errorAt=h.errors.length;await p.locator('#act button').click();await p.waitForFunction(()=>document.querySelector('#log').textContent.includes('STAGE6_FAULT_INJECTION'));e.expectedErrors=h.errors.splice(errorAt);const failed=await snap(p,e,'validation failed');assert.deepEqual(failed.state,before.state,'createContract failure must not commit sequence, affiliation or income');assert.deepEqual(failed.rng,before.rng);await p.locator('#act button').click();const retry=await snap(p,e,'retry');assert.equal(retry.state.contractSequence,1);assert.equal(retry.state.careerSigningBonus-before.state.careerSigningBonus,50000000);
 });
 await h.test('signed-retry-next-year-payment',{faultInjection:true,bonus:50000000,annual:6000000},async e=>{
  await p.evaluate(()=>{window.__stage6.fixture({stage:'CORP'});window.__stage6.offer('post-payment');});const before=await snap(p,e,'offered'),errorAt=h.errors.length;await p.locator('#act button').click();await p.waitForFunction(()=>document.querySelector('#log').textContent.includes('STAGE6_FAULT_INJECTION'));e.expectedErrors=h.errors.splice(errorAt);const failed=await snap(p,e,'paid render failed');await p.locator('#act button').click();const retry=await snap(p,e,'render retried');assert.deepEqual(retry.state,failed.state);assert.deepEqual(retry.rng,failed.rng);assert.equal(retry.state.ct.contractId,failed.state.ct.contractId);assert.equal(retry.state.careerSigningBonus-before.state.careerSigningBonus,50000000);
  await p.locator('#act button').click();const next=await snap(p,e,'2033');assert.equal(next.state.year,2033);await p.evaluate(()=>window.__stage6.payNext());const paid=await snap(p,e,'salary paid');assert.equal(paid.state.careerBaseSalary-next.state.careerBaseSalary,6000000);assert.equal(paid.state.ct.annualSchedule[0].paid,true);await p.evaluate(()=>window.__stage6.payNext());assert.deepEqual(await h.get(p),paid);
 });await p.close();
}catch(error){h.errors.push({type:'harness',message:error.stack});}finally{const s=await h.finish();process.exit(s.fail||s.errors.length?1:0);}
