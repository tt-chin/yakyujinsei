// SYNTHETIC_SCENARIO in a real browser: native producers, receipts, financial
// consumers and renderer. Response-only observer; no product debug entry point.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {harness,instrument,arg} from '../../tests/support/stage6-browser.mjs';
import {validateAwardHistory} from './historical-comparison.mjs';
const source=fs.readFileSync('docs/src/engine/game.js','utf8');
const extra=String.raw`
let bLeague,bStat,bBeforeContract;
window.__devB={
 setup:(league,role,legacy=false)=>{
  window.__stage6.fixture({stage:'CORP',pos:'P',ability:65});$('log').replaceChildren();_curYearBody=null;
  S.role=role;S.age=36;bLeague=league;
  const level=league==='MLB'?'MLB':league+'1';
  // Valid existing first-team professional fixture. Starting from CORP instead
  // would correctly route an American newcomer to MiLB, not MLB.
  S.stage='PRO';S.org=league;S.lv=level;S.stats[league]??=blankStat();
  signTo(league,level,listByOrg(league)[0].teamId,2,1,'NEW_CONTRACT',{startYear:S.year,annualSalary:10000000,signingBonus:0,
    signingTerms:{signingBonus:0,developmentStipend:0},incentive:createIncentiveTerms({org:league,annualSalary:10000000})});
  S.stats[league]??=blankStat();S.stats[league].yr=2;S.pool=7;S.traits.glass=true;S.traits.phoenix=false;S.traits.yips=true;
  if(legacy)S.honors=['2031 NPB最優秀投手賞','2031 未確認の歴史賞'];
  bStat={d:15,G:60,W:20,L:0,IP:200,SO:300,era:1,SV:40,HLD:35,ER:22,H:100,BB:20};
  S.lastD=bStat.d;S.lastSt={...bStat};S.log.push({y:S.year,age:S.age,tm:S.team,st:{...bStat}});bBeforeContract=JSON.parse(JSON.stringify(S.ct));
 },
 run:()=>awards(bLeague,bStat),
 fault:()=>{const original=card;let once=true;card=(...a)=>{if(once&&a[1]==='年間賞'){once=false;throw Error('DEV_B_RENDER_FAULT');}return original(...a);};try{awards(bLeague,bStat);return null;}catch(e){return e.message;}finally{card=original;}},
 get:()=>({state:JSON.parse(JSON.stringify(S)),rng:JSON.parse(JSON.stringify(s6rng)),beforeContract:bBeforeContract,
   transaction:__bTx.inspectAwardTransaction(annualAwardTransaction(S,{league:bLeague,level:S.lv,role:S.role,metrics:bStat})),
   identities:(S.awardDecisions||[]).map(d=>__bId.identifyAwardDecision(d,S)),
   fallback:salaryAwardBonus(S.honors,S.year,S),hof:honorScore(bLeague),protection:hasCurrentAwardEffect(S,'demotion',bLeague)}),
 evaluate:()=>recordSalaryEvaluation(bStat),
 retire:()=>endGame('開発B・表示検証用の引退（受控fixture）'),
 pay:()=>{captureSeasonChampionship(S);const original=movement;movement=()=>{};try{phaseEnd();}finally{movement=original;}},
 history:async()=>{const {renderCareer}=await import('../ui/player-detail.js');let node=document.getElementById('b-history');
   if(!node){node=document.createElement('div');node.id='b-history';document.body.appendChild(node);}renderCareer(node,buildCareerViewModel(),'achievements');},
};`;
const observed=instrument(source),at=observed.lastIndexOf('})();');
const body="import * as __bTx from './award-transaction-policy.js';\nimport * as __bId from './award-identity-policy.js';\n"+observed.slice(0,at)+extra+observed.slice(at);
const h=await harness('development-b-runtime');
for(const width of [1280,320,390]){
 const p=await h.page(width,'P','development-b-runtime-'+width);
 await p.route('**/src/engine/game.js',r=>r.fulfill({status:200,contentType:'text/javascript',body}));await p.reload();await p.waitForFunction(()=>!!window.__devB);await p.locator('#btn-start').click();
 for(const league of ['NPB','KBO','CPBL','MLB'])for(const role of (arg('retirement-only')?['SP']:['SP','MR','CL']))await h.test('B-'+(arg('retirement-only')?'retirement':'runtime')+'-'+width+'-'+league+'-'+role,{width,league,role,evidence:'SYNTHETIC_SCENARIO / NATIVE_BROWSER_RUNTIME'},async e=>{
  if(arg('retirement-only')){
   await p.evaluate(({league,role})=>{window.__devB.setup(league,role,true);window.__devB.run();},{league,role});
   const before=await p.evaluate(()=>window.__devB.get());e.snapshots.push(before);
   await p.evaluate(()=>window.__devB.retire());await p.waitForFunction(()=>window.__stage6.get().state.done===true);
   const after=await p.evaluate(()=>window.__devB.get());e.snapshots.push(after);
   assert.deepEqual(after.state.honors,before.state.honors,'retirement never rewrites award history');
   const text=await p.locator('body').innerText();
   for(const honor of before.state.honors)assert(text.includes(honor.slice(5)),'new titles and unknown historical originals remain visible: '+honor);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await p.screenshot({path:h.output+'/'+width+'-'+league+'-retirement.png',fullPage:true,animations:'disabled'});
   return;
  }
  await p.evaluate(({league,role})=>window.__devB.setup(league,role),{league,role});
  const before=await p.evaluate(()=>window.__devB.get());e.snapshots.push(before);
  assert.equal(await p.evaluate(()=>window.__devB.fault()),'DEV_B_RENDER_FAULT');
  const failed=await p.evaluate(()=>window.__devB.get());e.snapshots.push(failed);validateAwardHistory(failed.state);
  assert.equal(failed.transaction.phase,'AWARD_EFFECTS_COMMITTED');assert(failed.transaction.receipts.every(r=>r.status==='COMMITTED'));
  assert(failed.identities.every(d=>d.decisionVerified));assert.deepEqual(failed.state.ct,before.state.ct,'awards do not rewrite guaranteed contract');
  assert(failed.state.honors.some(t=>t.endsWith('最多勝利投手賞')));
  assert.equal(failed.state.honors.some(t=>t.endsWith('投手三冠王')),role==='SP');
  assert.equal(failed.state.honors.some(t=>t.endsWith('沢村賞')),league==='NPB'&&role==='SP');
  assert.equal(failed.state.pool,15);assert.equal(failed.state.traits.glass,false);assert.equal(failed.state.traits.phoenix,true);
  const native=failed.state.awardDecisions.filter(d=>d.drawSource==='LEGACY_MAIN_RNG');
  assert.equal(failed.rng.length-before.rng.length,native.length,'new/derived awards draw no main RNG');
  await p.evaluate(()=>window.__devB.run());const recovered=await p.evaluate(()=>window.__devB.get());assert.deepEqual(recovered,failed);
  assert.equal(await p.locator('.card h4').filter({hasText:/^年間賞$/}).count(),1);
  const annual=await p.locator('.card').filter({has:p.locator('h4').filter({hasText:/^年間賞$/})}).innerText();
  for(const name of recovered.state.honors)assert(annual.includes(name.slice(5)),'actual result DOM contains full producer title');
  await p.evaluate(()=>window.__devB.history());assert.deepEqual(await p.locator('#b-history li').allTextContents(),recovered.state.honors);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'normal page has no horizontal clipping');
  await p.evaluate(()=>window.__devB.evaluate());const evaluated=await p.evaluate(()=>window.__devB.get());e.snapshots.push(evaluated);
  assert(evaluated.state.lastSalaryEvaluation.awardAdjustment>0);assert.equal(evaluated.fallback,3);assert(evaluated.hof.sc>0);
  await p.evaluate(()=>window.__devB.pay());const paid=await p.evaluate(()=>window.__devB.get());e.snapshots.push(paid);
  const scheduled=before.state.ct.annualSchedule.find(r=>r.year===before.state.year).amount;
  const incentive=before.state.ct.incentive.annualMax;
  assert.equal(paid.state.careerBaseSalary-before.state.careerBaseSalary,scheduled,'pay immutable accepted schedule, including native KBO floor');
  assert.equal(paid.state.careerIncentive-before.state.careerIncentive,incentive);
  assert.equal(paid.state.careerEarnings-before.state.careerEarnings,scheduled+incentive);
  assert.equal(paid.state.ct.annualSchedule.filter(r=>r.paid).length,1);assert.equal(paid.state.ct.annualSchedule[1].paid,false);
  await p.evaluate(()=>window.__devB.pay());assert.deepEqual(await p.evaluate(()=>window.__devB.get()),paid,'same payment/receipt never repeats');
  assert(await p.locator('#act button,#act .abrow').count(),'next real action exists');
  e.engineSha256=createHash('sha256').update(source).digest('hex');
  await p.screenshot({path:h.output+'/'+width+'-'+league+'-'+role+'.png',fullPage:true,animations:'disabled'});
 });
 await p.close();
}
const result=await h.finish();process.exit(result.fail||result.errors.length?1:0);
