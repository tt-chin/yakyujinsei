import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {harness,instrument} from './support/stage6-browser.mjs';
import {assertSameCareer,findFirstDifference} from './support/first-difference.mjs';
import {assertApprovedHofRetirement} from './support/approved-hof-comparison.mjs';
const baseline='25b815e07f426604f453fdb538266a4630143dbe';
const levels={NPB:'NPB1',MLB:'MLB',KBO:'KBO1',CPBL:'CPBL1'};
function tagRetirement(source){
 for(const [needle,label]of [['ri(2,6)','HOF_BALLOT_YEAR'],['R()*6','HOF_VOTE_PERCENT'],['R()*17','CANDIDATE_PERCENT'],['ri(3,9)','CANDIDATE_YEARS'],['R()*second.length','SECOND_CAREER'],['R()*pool.length','FAN_REACTION']]){
  assert.equal(source.split(needle).length,2,'one native draw '+label);
  const call=needle.startsWith('ri')?needle:'R()',suffix=needle.startsWith('ri')?'':needle.slice(3);
  source=source.replace(needle,"window.__hofDraw('"+label+"',()=>"+call+")"+suffix);
 }return source;
}
const old=file=>execFileSync('git',['show',baseline+':docs/src/engine/'+file],{encoding:'utf8',maxBuffer:20e6});
const hooks=`
let hofPending=null,hofExecuting=false,hofPurpose='OTHER';const hofTrace=[],hofObservedR=R;
R=()=>{const before=S.rngState,value=hofObservedR();if(hofExecuting)hofTrace.push({purpose:hofPurpose,before,after:S.rngState,value});return value;};
window.__hofDraw=(label,draw)=>{const old=hofPurpose;hofPurpose=label;try{return draw();}finally{hofPurpose=old;}};
const hofNativeEnd=endGame;
endGame=reason=>{if(!hofPending)hofPending={reason,state:JSON.parse(JSON.stringify(S)),rng:JSON.parse(JSON.stringify(window.__stage6.get().rng)),thresholds:TIER_TH,names:LG_N,tiers:Object.fromEntries(['NPB','MLB','KBO','CPBL'].filter(b=>S.stats[b]).map(b=>[b,tierOf(b)]))};};
window.__hofTest={pending:()=>hofPending,finish:tiers=>{if(tiers)tierOf=b=>tiers[b];hofExecuting=true;try{hofNativeEnd(hofPending.reason);}finally{hofExecuting=false;}},get:()=>({state:JSON.parse(JSON.stringify(S)),rng:window.__stage6.get().rng,retirementTrace:JSON.parse(JSON.stringify(hofTrace))}),
 fixture:()=>{const blank={yr:10,G:1000,PA:5000,AB:4500,H:0,HR:0,RBI:0,SB:0,BB:0,DEF:0,W:0,SV:0,SO:0,IP:0,L:0,ER:0};S.stage='PRO';S.lv='NPB1';S.age=40;S.year=2050;S.stats={NPB:{...blank,H:S.pos==='P'?0:8500,W:S.pos==='P'?700:0}};S.statsByLevel={NPB1:{...blank,H:S.pos==='P'?0:100,W:S.pos==='P'?10:0},NPB2:{...blank,H:8400}};S.honors=['2035 NPB年間MVP','2035 NPB年間MVP','2037 ワールド・ベースボール・クラシック優勝'];S.intlCount=4;S.traits={};endGame('CONTROLLED_RETIREMENT');},
 advance:async()=>{const choices=[];for(let i=0;i<2200&&!hofPending;i++){const before=JSON.parse(JSON.stringify(S)),rows=[...document.querySelectorAll('#act .abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),bs=[...document.querySelectorAll('#act button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.textContent));const b=bs.find(e=>/通常投球/.test(e.textContent))||rows[0]||bs.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.textContent))||bs[0];if(!b)throw Error('NO_ACTION');const action=b.textContent;b.click();if(!before.traits.franchise&&S.traits.franchise&&S.franchiseAchievement){const f=S.franchiseAchievement;if(f.year!==before.year||f.teamId!==before.orgTeamId||f.league!==LV[before.lv].statBucket)throw Error('BAD_FRANCHISE_PROVENANCE');}const stable=JSON.parse(JSON.stringify(S));delete stable.franchiseAchievement;const bytes=new TextEncoder().encode(JSON.stringify(stable)),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');choices.push({action,hash});}if(!hofPending)throw Error('CAREER_LIMIT');return choices;}};
`;
// Independent reference for this controlled fixture, with literal approved award weights.
// Natural careers are required to match completely before retirement and same-version replay.
function controlledTiers(s,thresholds,names){const st=s.statsByLevel.NPB1,base=s.pos==='P'?st.W*13+st.SV*6+st.SO*.9+st.IP*.35:st.H+3*st.HR+.8*st.SB+.5*st.RBI+.3*st.BB+6*Math.max(0,st.DEF);const raw=base+420,rank=raw>=thresholds.NPB[0]?0:1;return {NPB:{i:rank,sc:raw,rawSc:raw,name:names.NPB+['殿堂','スター選手'][rank]}};}
const h=await harness('hof-retirement-policy');
try{for(const pos of ['P','IF'])for(const controlled of [true,false]){
 const seed=(controlled?'hof-controlled-':'yakyo-hof-')+pos,runs=[];
 for(const mode of ['old','new','repeat','oracle']){
  if(mode==='oracle'&&!controlled)continue;
  const page=await h.page(390,pos,seed,{beforeLoad:async p=>{
   for(const file of ['hall-of-fame-policy.js','career-movement.js'])if(mode==='old'||mode==='oracle')await p.route('**/src/engine/'+file,r=>r.fulfill({body:old(file),contentType:'text/javascript'}));
   await p.route('**/src/engine/career-retirement.js',async r=>{const response=await r.fetch(),body=mode==='old'||mode==='oracle'?old('career-retirement.js'):await response.text();await r.fulfill({response,body:tagRetirement(body)});});
   await p.route('**/src/engine/game.js',async route=>{const response=await route.fetch();const body=mode==='old'?instrument(old('game.js')):await response.text();await route.fulfill({response,body:body+hooks});});
  }});
  const choices=controlled?(await page.evaluate(()=>window.__hofTest.fixture()),[]):await page.evaluate(()=>window.__hofTest.advance());
  const pending=await page.evaluate(()=>window.__hofTest.pending());assert.ok(pending);
  const tiers=mode==='oracle'?controlledTiers(pending.state,pending.thresholds,pending.names):null;
  await page.evaluate(t=>window.__hofTest.finish(t),tiers);const after=await page.evaluate(()=>window.__hofTest.get());
  runs.push({mode,choices,pending,after});
  if(mode==='new'&&controlled){
   assert.ok(await page.locator('#log').innerText().then(t=>t.includes('国際大会・代表の栄誉：殿堂評価への加点なし')));
   for(const width of [1280,320,390]){await page.setViewportSize({width,height:844});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'retirement layout '+width);await page.screenshot({path:h.output+'/retirement-'+pos+'-'+width+'.png',fullPage:true});}
   await page.locator('#sh-img').click();await page.locator('#sh-out img').waitFor();assertSameCareer(await page.evaluate(()=>window.__hofTest.get()),after,'viewports and share image keep complete S/RNG unchanged');
  }
  await page.close();
 }
 const [a,b,replay,oracle]=runs;
 if(!controlled)assertSameCareer(b.after,a.after,'natural complete post-retirement state and every RNG remain strict');assertSameCareer(b.choices,a.choices,'all pre-retirement choices and state hashes');
 const before=structuredClone(b.pending.state),grant=before.franchiseAchievement;if(grant)delete before.franchiseAchievement;
 assertSameCareer(before,a.pending.state,'full natural/controlled pre-retirement S');assertSameCareer(b.pending.rng,a.pending.rng,'every pre-retirement RNG value and state');
 assertSameCareer({choices:replay.choices,pending:replay.pending,after:replay.after},{choices:b.choices,pending:b.pending,after:b.after},'same-version complete replay including choices/full S/all RNG');
 if(controlled){
  const oldComponents={base:pos==='P'?9100:8500,personal:420,international:520};assert.equal(a.pending.tiers.NPB.sc,Object.values(oldComponents).reduce((x,y)=>x+y,0));
  const evidence={oldComponents,newComponents:{base:b.pending.tiers.NPB.base,personal:420,international:0},changedLeagues:[{league:'NPB',rules:['FIRST_TEAM_ONLY','PERSONAL_AWARD_DEDUP','INTERNATIONAL_ZERO'],oldTier:a.pending.tiers.NPB,newTier:b.pending.tiers.NPB}]};
  const report=assertApprovedHofRetirement({beforeOld:a.pending.state,beforeNew:b.pending.state,afterOld:a.after.state,afterNew:b.after.state,expectedNew:oracle.after.state,traceOld:a.after.retirementTrace,traceNew:b.after.retirementTrace,expectedTrace:oracle.after.retirementTrace,evidence});await h.save(seed+'-causality',report);
 }
 await h.save(seed,{baseline,controlled,runs,firstPreDifference:findFirstDifference(a.pending,b.pending),franchiseGrant:grant});console.log('PASS '+seed+' pre-retirement complete S/choices/RNG; same-version complete replay'+(controlled?'; approved frozen-rule retirement oracle':''));
 }
 assert.deepEqual(h.errors,[]);await h.save('approved-summary',{PASS:4,FAIL:0,baseline,checks:'P/IF controlled and natural pre-retirement S/choices/RNG, complete same-version replay, controlled frozen-rule oracle'});
}finally{await h.finish();}
