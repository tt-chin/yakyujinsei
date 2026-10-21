import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {harness,arg,instrument as stage6Instrument} from './support/stage6-browser.mjs';
import {withCareerSessionAccess} from './support/career-session-access.mjs';

// Read-only HTTP-response instrumentation. Source files and production assets are unchanged.
const oldNames=['board','movement','endGame','phasePre','phaseMid','proSeason','newState','advance','startYear','amateurSeason','salaryFor','signTo','makeOffers','pickOfferUI','faMarket','crossOffers'];
const activeNames=['board','movement','endGame','phasePre','phaseMid','proSeason','advance','startYear','amateurSeason','salaryFor','signTo','fixedContract','faMarket','crossOffers'];
function instrument(source,trace){
  const marker='/* ================= 日本版仕様オーバーレイ 1.0.4 ================= */';
  assert.equal(source.split(marker).length,2);
  const observer=`window.__s10Trace=[];window.__s10Counts={};
    function s10wrap(label,fn){const f=function(...args){window.__s10Counts[label]=(window.__s10Counts[label]||0)+1;window.__s10Trace.push({label,year:S?.year,stage:S?.stage,level:S?.lv});return fn.apply(this,args);};Object.defineProperty(f,'name',{value:fn.name});return f;}`;
  source=source.replace(marker,observer+(trace?oldNames.map(n=>n+'=s10wrap("legacy.'+n+'",'+n+');').join('\n'):'')+'\n'+marker);
  const hook=`
    const s10copy=x=>JSON.parse(JSON.stringify(x));
    let s10initial=null,s10candidates=[],s10created=[],s10inject=false,s10button=null;
    const s10new=newState;newState=(...args)=>{const state=s10new(...args);s10initial=s10copy(state);return state;};
    const s10candidate=salaryCandidate;salaryCandidate=(input)=>{const before={year:S.year,level:S.lv,org:S.org,currentSalary:S.currentSalary,transferSalarySnapshot:S.transferSalarySnapshot??null};const result=s10candidate(input);s10candidates.push({input:s10copy(input||{}),before,result:s10copy(result)});return result;};
    `+(trace?activeNames.map(n=>n+'=s10wrap("active.'+n+'",'+n+');').join('\n'):'')+`
    const s10end=endGame;endGame=(...args)=>{if(s10inject){S.hsTier={S:1,A:2,B:3}[s10initial.schoolTier];S.potSum0=Object.values(s10initial.pot).reduce((a,b)=>a+b,0);}return s10end(...args);};
    window.__stage10={
      get:()=>({state:s10copy(S),initial:s10initial,rng:s10copy(s6rng),candidates:s10copy(s10candidates),created:s10copy(s10created),counts:s10copy(window.__s10Counts),trace:s10copy(window.__s10Trace),choices:$('act').innerText,queue:__cs.stepQ.map(f=>f.name),dom:window.__stage6.get().dom,listeners:window.__stage6.get().listeners,fields:{schoolTier:Object.hasOwn(S,'schoolTier'),hsTier:Object.hasOwn(S,'hsTier'),potSum0:Object.hasOwn(S,'potSum0')}}),
      search:()=>{for(let i=0;i<200;i++){SEED='s10-trait-'+i;S={rngState:0};seedInit(SEED);S=newState('検索','IF');const sum=Object.values(S.pot).reduce((a,b)=>a+b,0);if(S.schoolTier==='B'&&sum<=469)return{seed:SEED,sum,tier:S.schoolTier};}throw Error('NO_QUALIFYING_SEED');},
      injectLegacy:()=>{s10inject=true;},
      retireBoundary:v=>{window.__stage6.fixture({pos:v.pos,stage:'CORP'});if(v.sum===null)delete S.potSum0;else S.potSum0=v.sum;for(const key of POS_AB[S.pos])S.pot[key]=v.sum===null?20:80;S.traits.smallschool=false;S.traits.grinder=!!v.already;if(v.reached){S.stage='PRO';S.lv='NPB1';S.org='NPB';S.orgTeamId=listByOrg('NPB')[0].teamId;S.stats.NPB={...blankStat(),yr:1,G:1,PA:4,AB:3,H:1,BB:1};}endGame('境界fixture');return{grinder:S.traits.grinder,smallschool:S.traits.smallschool,potSum0:S.potSum0};},
      school:()=>{setSchool('U');return{initialSum:S.potSum0,tier:S.schoolTier,hsTier:Object.hasOwn(S,'hsTier'),potSum0:Object.hasOwn(S,'potSum0')};},
      fixture:v=>{window.__stage6.fixture({pos:'IF',stage:'CORP',ability:v.ability??68,potential:80,age:v.age??28});Object.assign(S,{stage:'PRO',org:v.org||'NPB',lv:v.level||'NPB1',year:2026+(v.age??28)-16,age:v.age??28,stageYr:6,dpos:'SS',lastD:6,pool:0,marketInjury:'HEALTHY'});S.orgTeamId=listByOrg(S.org)[0].teamId;S.team='';S.foreignFirstTeamYears={};for(let i=0;i<(v.service??6);i++)S.foreignFirstTeamYears[S.year-i-1]=S.lv;S.serviceTime={NPB:S.org==='NPB'?(v.service??6):0,MLB:0,KBO:0,CPBL:0};S.americanContractSigned=['MLB','MiLB'].includes(S.org);S.ct=createContract({contractId:S.org+':fixture:001',org:S.org,teamId:S.orgTeamId,signedYear:S.year-1,startYear:S.year,years:v.years??1,annualSalary:v.salary??20000000});S.ct=markSalaryPaid(S.ct,S.year).contract;S.currentSalary=v.salary??20000000;S.lastSalaryPaidYear=S.year;S.contractSequence=1;S.careerBaseSalary=S.currentSalary;S.careerEarnings=S.currentSalary;S.salaryEvaluationHistory=[2,1,0].map(i=>({year:S.year-i,payD:6,baseD:6,sampleStatus:'SUFFICIENT',marketInjury:'HEALTHY',level:S.lv,org:S.org}));saveSalaryDecision('RENEWAL',salaryCandidate(),S.currentSalary,S.currentSalary,{salaryYear:S.year});s10candidates=[];s10created=[];s6rng=[];window.__s10Trace=[];window.__s10Counts={};__cs.stepQ=[];__cs.seasonEndContext=null;__cs.pendingOffseasonSalary=null;actClear();board(2);},
      overseas:(org,lv)=>{const offer=overseasOffer(org,lv,'海外移籍',ovr(),2,()=>{});if(!offer)throw Error('NO_OVERSEAS_OFFER');choose('海外提示',[offer]);return{label:offer.t,sub:offer.s,candidate:s10candidates.at(-1)};},
      direct:lv=>{const org=LV[lv].org,team=listByOrg(org)[0].teamId,candidate=salaryCandidate({sourceLevel:S.lv,targetLevel:lv,contractMult:1,transferType:'RELEASE_RECONTRACT'});const sub=LV[candidate.targetLevel].n+'契約｜年俸'+fmtMoney(candidate.annualSalary);choose('原生ヘルパー検証',[{t:'契約を受諾',s:sub,f:()=>signTo(org,candidate.targetLevel,team,1,1,'RELEASE_RECONTRACT',{candidate,annualSalary:candidate.annualSalary})}]);return{label:'契約を受諾',sub,candidate:s10candidates.at(-1)};},
      returnOffer:()=>crossOffers(ovr()),
      remember:()=>{s10button=$('act').querySelector('button');},oldClick:()=>s10button.click(),
      fault:point=>{if(point==='before-sign'){const original=signTo;signTo=(...args)=>{signTo=original;throw Error('S10_FAULT_BEFORE_SIGN');};}else if(point==='after-create'){const original=fixedContract;fixedContract=(...args)=>{fixedContract=original;const contract=original(...args);s10created.push(s10copy(contract));throw Error('S10_FAULT_AFTER_CREATE');};}else{const original=card;card=(...args)=>{if(args[1]==='契約'){card=original;throw Error('S10_FAULT_AFTER_PAYMENT');}return original(...args);};}},
      step:()=>{if(S.done)return{terminal:true};const rows=[...$('act').querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true').sort((a,b)=>(S.ab[a.dataset.abilityKey]||0)-(S.ab[b.dataset.abilityKey]||0));const buttons=[...$('act').querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const preferred=buttons.find(e=>/確定|NPBドラフト|指名を受けて入団/.test(e.innerText));const el=rows[0]||preferred||buttons.find(e=>e.classList.contains('main'))||buttons[0];if(!el)throw Error('NO_ACTIVE_CHOICE');const before=JSON.stringify(S),rng=s6rng.length,action=el.dataset.abilityKey?'ability:'+el.dataset.abilityKey:el.innerText;el.click();return{action,before,after:JSON.stringify(S),rng:s6rng.length-rng};}
    };`;
  source=withCareerSessionAccess(source);
  const at=source.lastIndexOf('})();');assert.ok(at>0);
  return source.slice(0,at)+hook+source.slice(at);
}
const h=await harness('yakyujinsei-stage10'),start=Date.now();
const compare=arg('compare')&&execFileSync('git',['rev-parse',arg('compare')+'^{commit}'],{encoding:'utf8'}).trim();
const priorSource=compare&&execFileSync('git',['show',compare+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
const hash=x=>createHash('sha256').update(x).digest('hex');
async function page(width=1280,seed='stage10-fixture',trace=true,pos='IF',prior=false){
  const p=await h.page(width,pos,seed);
  await p.route('**/src/engine/game.js',async route=>{
    const response=await route.fetch(),body=prior?stage6Instrument(priorSource):await response.text();
    // Loopback already has the shared hook; a Preview fetch returns the raw asset.
    await route.fulfill({response,body:instrument(body.includes('let s6rng=[]')?body:stage6Instrument(body),trace)});
  });
  await p.reload();await p.waitForFunction(()=>window.__stage10&&!document.querySelector('#btn-start').disabled);
  await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();return p;
}
const get=p=>p.evaluate(()=>window.__stage10.get());
const comparable=s=>{const state=JSON.parse(JSON.stringify(s));delete state.version;delete state.potSum0;if(state.done)delete state.traits.grinder;return state;};
async function career(p,comparison=false){const digest=s=>hash(comparison?JSON.stringify(comparable(JSON.parse(s))):s);const actions=[];for(let i=0;i<1600;i++){const step=await p.evaluate(()=>window.__stage10.step());if(step.terminal)return{actions,...await get(p)};actions.push({action:step.action,before:digest(step.before),after:digest(step.after),rng:step.rng});}throw Error('CAREER_OPERATION_LIMIT');}
const money=s=>({earnings:s.careerEarnings,bonus:s.careerSigningBonus,base:s.careerBaseSalary,stipend:s.careerDevelopmentStipend,payments:s.signingPayments});
let selected,natural;
try{
  if(!process.argv.includes('--fixtures-only')){
    const search=await page();selected=await search.evaluate(()=>window.__stage10.search());await search.close();
    await h.test('A-initial-fields',{...selected,pos:'IF'},async e=>{const p=await page(1280,selected.seed);const before=await get(p),school=await p.evaluate(()=>window.__stage10.school());e.snapshots.push(before,school);assert.equal(before.initial.schoolTier,'B');assert.equal(before.fields.hsTier,false);assert.equal(before.fields.potSum0,true);assert.equal(school.hsTier,false);assert.equal(school.potSum0,true);assert.equal(before.initial.potSum0,Object.values(before.initial.pot).reduce((a,b)=>a+b,0));assert.equal(school.initialSum,before.initial.potSum0);await p.close();});
    await h.test('A-natural-retirement',{...selected,pos:'IF',strategy:'lowest-ability/draft/main'},async e=>{const p=await page(1280,selected.seed);natural=await career(p);await h.save('A-natural-career',natural);e.snapshots.push(natural);await p.close();if(!(natural.state.stats.NPB||natural.state.stats.MLB)){e.status='BLOCKED';e.classification='No qualifying top-league natural route';return;}e.classification='Natural qualified retirement';assert.equal(natural.state.traits.grinder,true,'Original potential qualifies but retirement should award grinder');});
    await h.test('A-injected-old-fields',{...selected,pos:'IF',faultInjection:'B->3 is an invalid test assumption; approved JP_SABC must ignore legacy fields'},async e=>{const p=await page(1280,selected.seed);await p.evaluate(()=>window.__stage10.injectLegacy());const result=await career(p);e.snapshots.push(result);await h.save('A-injected-career',result);await p.close();if(!(result.state.stats.NPB||result.state.stats.MLB)){e.status='BLOCKED';return;}assert.deepEqual(result.actions.slice(0,-1),natural.actions.slice(0,-1));assert.deepEqual(result.rng,natural.rng);assert.equal(result.state.traits.grinder,true);assert.equal(result.state.traits.smallschool,false,'Injected legacy hsTier 3 cannot override a valid JP_SABC B birth');});
    for(const [seed,pos] of [['yakyo-test-001','P'],[selected.seed,'IF']])await h.test('D-passive-trace-'+pos,{seed,pos},async e=>{const traced=await page(1280,seed,true,pos),control=await page(1280,seed,false,pos);const a=await career(traced),b=await career(control);await h.save('D-'+pos+'-traced',a);await h.save('D-'+pos+'-control',b);assert.deepEqual(a.actions,b.actions);assert.deepEqual(a.state,b.state);assert.deepEqual(a.rng,b.rng);assert.ok(a.counts['legacy.board']>0);assert.ok(a.counts['legacy.endGame']>0);e.snapshots.push({counts:a.counts,actions:a.actions.length,rng:a.rng.length,notObserved:oldNames.filter(n=>!a.counts['legacy.'+n])});e.classification='Route-limited reachability; not a global dead-code proof';await traced.close();await control.close();});
    if(compare)for(const [seed,pos]of [['yakyo-test-001','P'],[selected.seed,'IF']])await h.test('E-original-comparison-'+pos,{seed,pos,compare},async e=>{const current=await page(1280,seed,true,pos),prior=await page(1280,seed,true,pos,true),a=await career(current,true),b=await career(prior,true);assert.deepEqual(a.actions,b.actions);assert.deepEqual(comparable(a.state),comparable(b.state));assert.deepEqual(a.rng,b.rng);assert.equal(a.initial.potSum0,Object.values(b.initial.pot).reduce((s,v)=>s+v,0));if(pos==='IF'){assert.equal(b.state.traits.grinder,false);assert.equal(a.state.traits.grinder,true);assert.equal(a.state.traits.smallschool,false);}await h.save('E-'+pos+'-current',a);await h.save('E-'+pos+'-original',b);e.snapshots.push({actions:a.actions.length,rng:a.rng.length,initial:a.initial.potSum0,before:b.state.traits.grinder,after:a.state.traits.grinder});await current.close();await prior.close();});
    const boundary=await page();for(const [pos,sum,reached,already,expected]of [['P',237,true,false,true],['P',238,true,false,false],['IF',469,true,false,true],['IF',470,true,false,false],['IF',463,false,false,false],['IF',null,true,false,false],['P',238,true,true,true]])await h.test('F-grinder-'+pos+'-'+sum+'-'+reached+'-'+already,{pos,sum,reached,already,fixture:true},async e=>{const r=await boundary.evaluate(v=>window.__stage10.retireBoundary(v),{pos,sum,reached,already});e.snapshots.push(r);assert.equal(r.grinder,expected);assert.equal(r.smallschool,false);});await boundary.close();
  }
  const routes=[{id:'restricted-MLB',targetOrg:'MiLB',target:'MLB',age:22,service:0},{id:'exempt-MLB',targetOrg:'MiLB',target:'MLB',age:28,service:6},{id:'active-contract-MLB',targetOrg:'MiLB',target:'MLB',age:28,service:6,years:3},{id:'KBO',targetOrg:'KBO',target:'KBO1'},{id:'CPBL',targetOrg:'CPBL',target:'CPBL1'},...['R','A1','A2','A3'].map(target=>({id:'release-'+target,target,direct:true}))];
  for(const width of [1280,320,390]){
    const p=await page(width);
    for(const route of routes)await h.test('B-'+width+'-'+route.id,{width,...route,source:'NPB1',fixture:true},async e=>{
      await p.evaluate(v=>window.__stage10.fixture(v),{...route,org:'NPB',level:'NPB1'});
      const quote=await p.evaluate(v=>v.direct?window.__stage10.direct(v.target):window.__stage10.overseas(v.targetOrg,v.target),route),before=await get(p),visible=await p.locator('#act').innerText();
      e.snapshots.push({quote,before,visible,yearsShown:/[1-9]年契約/.test(visible),helperFixture:!!route.direct});
      assert.match(visible,/年俸/);await p.locator('#act button').first().click();const signed=await get(p);e.snapshots.push({signed});
      const expected=quote.candidate.result.annualSalary;assert.equal(signed.state.ct.annualSalary,expected);assert.equal(signed.state.currentSalary,expected);assert.equal(signed.state.lastSalaryDecision.finalSalary,expected);assert.equal(signed.state.ct.signingBonus,quote.candidate.result.signingTerms.signingBonus);assert.equal(signed.state.lv,quote.candidate.result.targetLevel);assert.ok(signed.state.ct.annualSchedule.every(x=>!x.paid));assert.equal(signed.state.careerBaseSalary,before.state.careerBaseSalary);
      const buyout=route.years===3?28000000:0,bonus=quote.candidate.result.signingTerms.signingBonus;
      assert.equal(signed.state.salaryDecisionHistory.at(-1).finalSalary,expected);
      assert.equal(signed.state.careerEarnings-before.state.careerEarnings,bonus+buyout);
      assert.equal(signed.state.careerSigningBonus-before.state.careerSigningBonus,bonus);
      assert.equal((signed.state.careerBuyout||0)-(before.state.careerBuyout||0),buyout);
      await p.evaluate(y=>window.__stage6.fixtureYear(y),signed.state.year+1);await p.evaluate(()=>window.__stage6.payNext());const paid=await get(p);assert.equal(paid.state.careerBaseSalary-signed.state.careerBaseSalary,expected);await p.evaluate(()=>window.__stage6.payNext());const repeat=await get(p);assert.deepEqual(money(repeat.state),money(paid.state));e.snapshots.push({paid,repeat});
    });
    let returnControl;
    for(const fault of ['none','before-sign','after-create','after-payment'])await h.test('C-'+width+'-'+fault,{width,source:'CPBL1',faultInjection:fault!=='none',fault},async e=>{
      await p.evaluate(()=>window.__stage10.fixture({org:'CPBL',level:'CPBL1',ability:54,salary:12000000}));await p.evaluate(()=>window.__stage10.returnOffer());await p.evaluate(()=>window.__stage10.remember());const before=await get(p);assert.match(before.choices,/NPB/);
      if(fault!=='none')await p.evaluate(v=>window.__stage10.fault(v),fault);await p.locator('#act button').first().click();const first=await get(p);
      if(fault!=='none'){assert.equal(first.state.year,before.state.year);await p.locator('#act button').first().click();}else await p.evaluate(()=>window.__stage10.oldClick());
      const retry=await get(p);e.snapshots.push({before,first,retry});e.classification=fault==='none'?'Normal native return':'Fault injection: effective return completion latch risk';
      if(fault==='none'){assert.deepEqual(retry.state,first.state);assert.deepEqual(retry.rng,first.rng);}
      if(fault==='after-payment'){assert.equal(retry.state.ct.contractId,first.state.ct.contractId);assert.deepEqual(money(retry.state),money(first.state));}
      assert.equal(retry.state.year,before.state.year+1,'Return must advance once after successful retry');assert.ok(retry.choices.trim(),'Next operation must remain available');assert.equal(retry.state.ct.org,'NPB');
      assert.equal(retry.state.contractSequence,before.state.contractSequence+1);
      if(fault==='none')returnControl=retry;
      else {assert.deepEqual(retry.state,returnControl.state,'Retry must commit exactly the normal transaction');assert.deepEqual(retry.rng,returnControl.rng,'Retry must reuse the first year draw');}
      if(fault==='after-create')assert.equal(retry.state.ct.contractId,first.created[0].contractId,'Reuse the validated contract, not a second ID');
      await p.evaluate(()=>window.__stage10.oldClick());assert.deepEqual((await get(p)).state,retry.state);
      await p.locator('#act button').first().click();
      if(!await p.locator('#act .abrow').count()){const review=await get(p);assert.match(review.choices,/守備位置会議/);e.snapshots.push({positionReview:review});await p.locator('#act button').first().click();}
      assert.ok(await p.locator('#act .abrow').count(),'Next training listener must work after the existing position review');assert.deepEqual((await get(p)).rng,retry.rng);
      await p.evaluate(()=>window.__stage6.payNext());const paid=await get(p);assert.equal(paid.state.careerBaseSalary-retry.state.careerBaseSalary,retry.state.ct.annualSchedule[0].amount);
      await p.evaluate(()=>window.__stage6.payNext());const repeated=await get(p);assert.deepEqual(money(repeated.state),money(paid.state));assert.deepEqual(repeated.rng,paid.rng);e.snapshots.push({paid,repeated});
    });
    await h.test('G-repeat-render-'+width,{width,faultInjection:true},async e=>{
      await p.evaluate(()=>window.__stage10.fixture({org:'CPBL',level:'CPBL1',ability:54,salary:12000000}));await p.evaluate(()=>window.__stage10.returnOffer());
      const attempts=[];for(let i=0;i<2;i++){await p.evaluate(()=>window.__stage10.fault('after-payment'));await p.locator('#act button').first().click();attempts.push(await get(p));}
      assert.deepEqual(attempts[0].state,attempts[1].state);assert.deepEqual(attempts[0].rng,attempts[1].rng);
      await p.locator('#act button').first().click();const result=await get(p);assert.equal(result.state.year,2039);assert.equal(result.state.contractSequence,2);assert.equal(result.state.ct.contractId,attempts[0].state.ct.contractId);assert.deepEqual(money(result.state),money(attempts[0].state));e.snapshots.push({attempts,result});
    });
    await h.test('G-stay-'+width,{width,fixture:true},async e=>{
      await p.evaluate(()=>window.__stage10.fixture({org:'CPBL',level:'CPBL1',ability:54,salary:12000000}));await p.evaluate(()=>window.__stage10.returnOffer());await p.locator('#act button').filter({hasText:'現在の球団に残留'}).click();const result=await get(p);assert.equal(result.state.year,2039);assert.equal(result.state.org,'CPBL');assert.ok(result.choices.trim());assert.equal(result.rng.length,6,'No contract-year draw on stay');e.snapshots.push(result);
    });await p.close();
  }
}catch(error){
  h.errors.push({type:'harness',message:error.stack});
}finally{
  const summary=await h.finish(),unexpected=summary.errors.filter(x=>!x.message.includes('S10_FAULT_')),blocked=summary.records.filter(x=>x.status==='BLOCKED').length;
  await h.save('investigation-summary',{...summary,blocked,seconds:(Date.now()-start)/1000,expectedFaultErrors:summary.errors.length-unexpected.length,unexpectedErrors:unexpected,selected});
  // Match the existing Stage 7 harness caller: its report/cleanup has completed.
  process.exit(summary.fail||blocked||unexpected.length?1:0);
}
