// Controlled fixtures with real browser DOM, listeners and production policies.
// Fault hooks are response-only; no product debug API or source baseline is changed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {harness,instrument} from '../../tests/support/stage6-browser.mjs';
const source=fs.readFileSync('docs/src/engine/game.js','utf8');
const extra=String.raw`
window.__devA={
 fixture:()=>{window.__stage6.fixture({stage:'CORP',pos:'P',ability:65});$('log').replaceChildren();_curYearBody=null;S.role='SP';signTo('NPB','NPB1',listByOrg('NPB')[0].teamId,2,1,'NEW_CONTRACT',{startYear:S.year,annualSalary:10000000,signingBonus:0,signingTerms:{signingBonus:0,developmentStipend:0},incentive:createIncentiveTerms({org:'NPB',annualSalary:10000000})});S.pool=7;S.lastD=4;S.lastSalaryEvaluation={sampleStatus:'VALID',payD:4};stepQ=[phaseEnd];},
 get:()=>({state:JSON.parse(JSON.stringify(S)),rng:s6rng.slice(),end:professionalEnds.get(S)?.phase,movement:professionalMoves.get(S)?.phase,season:seasonContinuations.get(S)?.phase,choice:choiceViews.get(S)?.kind}),
 faultEnd:after=>{const original=card;let once=true;card=(...a)=>{if(once&&a[1]==='シーズン終了'){once=false;if(after)original(...a);throw Error('DEV_A_PAYMENT_RENDER_FAULT');}return original(...a);};try{phaseEnd();return null;}catch(e){return e.message;}finally{card=original;}},
 end:()=>phaseEnd(),season:()=>proSeason(),
 paymentContext:()=>captureSeasonChampionship(S),
 loseChoice:()=>{$('act').replaceChildren();},
 step:()=>{const buttons=[...$('act').querySelectorAll('button')].filter(b=>!b.disabled&&!/元に戻す|すべてリセット/.test(b.textContent));const b=buttons.find(b=>b.textContent.trim()==='現在の球団に残留')||buttons[0];if(!b)throw Error('NO_NATIVE_ACTION');const label=b.textContent;b.click();return {label,state:JSON.parse(JSON.stringify(S))};},
 faultSeason:after=>{const original=card;let once=true;card=(...a)=>{if(once&&a[1]==='年間賞'){once=false;if(after)original(...a);throw Error('DEV_A_AWARD_RENDER_FAULT');}return original(...a);};try{proSeason();return null;}catch(e){return e.message;}finally{card=original;}},
 highSeason:()=>{for(const key of POS_AB[S.pos])S.ab[key]=80;S.traits.glass=true;S.traits.phoenix=false;S.pool=7;},
 remember:()=>{window.__devAOldCallback=$('act').querySelector('button').onclick;},
 stale:()=>window.__devAOldCallback(),
 handoff:()=>{const view=choiceViews.get(S);currentChoiceContext={state:S,year:S.year,view};try{advance();const snapshot=JSON.stringify(S),count=s6rng.length;advance();return {same:snapshot===JSON.stringify(S),sameR:count===s6rng.length};}finally{currentChoiceContext=null;}},
 handoffFault:()=>{const original=startYear,view=choiceViews.get(S);currentChoiceContext={state:S,year:S.year,view};startYear=()=>{R();throw Error('DEV_A_START_YEAR_FAULT');};try{try{advance();}catch(e){}startYear=original;try{advance();return null;}catch(e){return e.message;}}finally{startYear=original;currentChoiceContext=null;}}
 ,handoffBlocked:()=>{try{advance();return null;}catch(error){return error.message;}}
};`;
const observed=instrument(source),at=observed.lastIndexOf('})();'),body=observed.slice(0,at)+extra+observed.slice(at);
const h=await harness('development-a-runtime');
const hash=value=>createHash('sha256').update(value).digest('hex');
const productFiles=['docs/index.html','docs/.nojekyll',...['docs/src','docs/styles','docs/assets'].flatMap(dir=>fs.readdirSync(dir,{recursive:true}).map(name=>dir+'/'+name.replaceAll('\\','/')).filter(name=>fs.statSync(name).isFile()))];
const productSources=Object.fromEntries(productFiles.map(name=>[name,hash(fs.readFileSync(name))]));
const nativeTest=h.test.bind(h);
h.test=(id,input,run)=>nativeTest(id,input,entry=>{entry.engineSha256=hash(source);entry.servedObserverSha256=hash(body);entry.productSources=productSources;return run(entry);});
async function page(width){const p=await h.page(width,'P','dev-a-runtime-'+width);await p.route('**/src/engine/game.js',r=>r.fulfill({status:200,contentType:'text/javascript',body}));await p.reload();await p.waitForFunction(()=>!!window.__devA);await p.locator('#btn-start').click();return p;}
for(const width of [1280,320,390]){
 const p=await page(width);
 for(const afterAppend of [false,true])await h.test('F-A04-A06-proSeason-render-'+width+'-'+afterAppend,{width,fixture:'cap80 legal NPB SP; generated native season',faultInjection:true,afterAppend},async e=>{
  await p.evaluate(()=>{window.__devA.fixture();window.__devA.highSeason();});assert.equal(await p.evaluate(after=>window.__devA.faultSeason(after),afterAppend),'DEV_A_AWARD_RENDER_FAULT');
  const failed=await p.evaluate(()=>window.__devA.get());e.snapshots.push(failed);assert.equal(failed.state.traits.glass,false);assert.equal(failed.state.traits.phoenix,true);assert.equal(failed.state.pool,15);assert.equal(failed.state.log.length,1);assert.equal(failed.state.honors.filter(h=>h==='2032 NPB年間MVP').length,1);assert.equal(failed.state.awardDecisions.find(d=>d.awardId==='MVP').awarded,true);
  const awardR=failed.rng.length,stats=failed.state.stats,last=failed.state.lastSt;await p.evaluate(()=>window.__devA.season());const resumed=await p.evaluate(()=>window.__devA.get());e.snapshots.push(resumed);
  assert.deepEqual(resumed.state.stats,stats);assert.deepEqual(resumed.state.lastSt,last);assert.equal(resumed.state.log.length,1);assert.deepEqual(resumed.state.awardDecisions,failed.state.awardDecisions);assert(resumed.rng.length>=awardR);assert.equal(await p.locator('.card h4').filter({hasText:/^年間賞$/}).count(),1);
  const complete=await p.evaluate(()=>window.__devA.get());await p.evaluate(()=>window.__devA.season());assert.deepEqual(await p.evaluate(()=>window.__devA.get()),complete,'reentry keeps whole S/R, no resimulation/evaluation/payment');assert(await p.locator('#act button,#act .abrow').count());
 });
 for(const afterAppend of [false,true])await h.test('F-A07-payment-render-'+width+'-'+afterAppend,{width,fixture:'signed NPB 10m + existing HALF 350k',faultInjection:true,afterAppend},async e=>{
  await p.evaluate(()=>{window.__devA.fixture();window.__devA.paymentContext();});const initial=await p.evaluate(()=>window.__devA.get());e.snapshots.push(initial);
  assert.equal(await p.evaluate(after=>window.__devA.faultEnd(after),afterAppend),'DEV_A_PAYMENT_RENDER_FAULT');const failed=await p.evaluate(()=>window.__devA.get());e.snapshots.push(failed);
  assert.equal(failed.state.careerBaseSalary,10000000);assert.equal(failed.state.careerEarnings,10350000);assert.equal(failed.end,'PAYMENT_COMMITTED');assert.equal(failed.rng.length-initial.rng.length,1,'exactly the original championship native draw');
  await p.evaluate(()=>window.__devA.end());const resumed=await p.evaluate(()=>window.__devA.get());e.snapshots.push(resumed);
  assert.equal(resumed.state.careerEarnings,10350000);assert.deepEqual(resumed.rng,failed.rng);assert.equal(resumed.state.pool,0);assert.equal(resumed.end,'WAIT_ALLOCATION');assert.equal(await p.locator('.card h4').filter({hasText:/^シーズン終了$/}).count(),1);
  await p.evaluate(()=>{window.__devA.remember();window.__devA.loseChoice();window.__devA.end();});const restored=await p.evaluate(()=>window.__devA.get());assert.deepEqual(restored,resumed,'restore the same pending payload, not a new payment');await p.evaluate(()=>window.__devA.stale());assert.deepEqual(await p.evaluate(()=>window.__devA.get()),restored);
  const option=p.locator('#act button').filter({hasText:'能力点を分配'});assert.equal(await option.count(),1);assert(await option.isVisible());await option.click();
  const before=await h.get(p);await p.evaluate(()=>window.__devA.end());const after=await h.get(p);assert.deepEqual(after.allocation,before.allocation);assert.deepEqual(after.rng,before.rng);assert.deepEqual(after.state,before.state);
  for(let i=0;i<7;i++)await p.locator('#act .abrow[aria-disabled="false"]').first().click();await p.locator('#al-btm button').filter({hasText:/確定/}).click();assert(await p.locator('#act button,#act .abrow').count());assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  e.route=[];for(let i=0;i<20&&(await p.evaluate(()=>window.__devA.get())).state.year===2032;i++)e.route.push(await p.evaluate(()=>window.__devA.step()));const next=await p.evaluate(()=>window.__devA.get());e.snapshots.push(next);assert.equal(next.state.year,2033,'actual recovered UI actions must complete next-year handoff');assert.equal(next.state.careerEarnings,10350000);assert.equal(next.state.careerBaseSalary,10000000);assert.equal(next.state.ct.annualSchedule.find(r=>r.year===2033).paid,false);
 });
 await h.test('F-YEAR-handoff-stale-'+width,{width,faultInjection:false},async e=>{
  await p.evaluate(()=>window.__devA.fixture());await p.evaluate(()=>window.__devA.end());await p.evaluate(()=>window.__devA.remember());
  assert.deepEqual(await p.evaluate(()=>window.__devA.handoff()),{same:true,sameR:true});const before=await p.evaluate(()=>window.__devA.get());await p.evaluate(()=>window.__devA.stale());assert.deepEqual(await p.evaluate(()=>window.__devA.get()),before);assert.equal(before.state.year,2033);e.snapshots.push(before);
 });
 await h.test('F-YEAR-ambiguous-start-'+width,{width,faultInjection:true},async e=>{
  await p.evaluate(()=>window.__devA.fixture());await p.evaluate(()=>window.__devA.end());assert.equal(await p.evaluate(()=>window.__devA.handoffFault()),'NEXT_YEAR_AMBIGUOUS');const after=await p.evaluate(()=>window.__devA.get());assert.equal(after.state.year,2033);assert.equal(await p.evaluate(()=>window.__devA.handoffBlocked()),'NEXT_YEAR_AMBIGUOUS');assert.deepEqual(await p.evaluate(()=>window.__devA.get()),after);e.snapshots.push(after);
 });
 await p.close();
}
const result=await h.finish();process.exit(result.fail||result.errors.length?1:0);
