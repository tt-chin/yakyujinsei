import assert from 'node:assert/strict';
import {assertApprovedProducerRenameCareer} from '../tools/development-b/historical-comparison.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {harness,arg,instrument} from './support/stage6-browser.mjs';
import {withApprovedSchoolChanges} from './support/approved-school-oracle.mjs';
import {withApprovedPhoenixControl,phoenixAwardProbe,assertApprovedPhoenixCareer} from './support/first-difference.mjs';
import {openBoardAction} from './support/board-menu.mjs';
const baseline=execFileSync('git',['rev-parse',(arg('baseline')||'e602174a22d7472e1021d780388ad61adc6b11b6')+'^{commit}'],{encoding:'utf8'}).trim();
const prior=withApprovedSchoolChanges(execFileSync('git',['show',baseline+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const approvedPhoenixPrior=withApprovedPhoenixControl(prior);
const h=await harness('international-personal-stats');
const hook=`window.__intlDisplay={
 fixture:v=>{window.__stage6.fixture({pos:v.pos||'P',ability:64,potential:80});Object.assign(S,{stage:'PRO',org:'NPB',lv:'NPB1',year:2035,role:'SP',rehab:0,seasonFactor:1,skipMid:false,...v});$('log').replaceChildren();_curYearBody=null;window.__intlContinued=0;},
 begin:phase=>processIntlPhase(phase,()=>window.__intlContinued++),
 change:v=>Object.assign(S,v),continued:()=>window.__intlContinued,
 save:()=>{window.__intlSavedClick=$('act').querySelector('button').onclick;},repeat:()=>window.__intlSavedClick(),
 render:key=>typeof renderInternationalPersonalStats==='function'?renderInternationalPersonalStats(S.intlTraitResults[key]?.personalStats,fmtIP):'',
 redraw:key=>card('info','保存結果の再描画',window.__intlDisplay.render(key)),
 step:()=>{if(S.done)return {done:true};const rows=[...$('act').querySelectorAll('.abrow')].filter(n=>n.getAttribute('aria-disabled')!=='true'&&!n.classList.contains('capped')),buttons=[...$('act').querySelectorAll('button')].filter(n=>!n.disabled&&!/元に戻す|すべてリセット/.test(n.textContent));const priority=n=>['vel','ctl','brk','con','pow','eye','spd'].includes(n.dataset.abilityKey)?0:1;rows.sort((a,b)=>priority(a)-priority(b)||S.ab[a.dataset.abilityKey]-S.ab[b.dataset.abilityKey]);const b=buttons.find(n=>n.textContent.trim().startsWith('通常投球'))||rows[0]||buttons.find(n=>/現在の球団に残留|宣言残留/.test(n.textContent))||buttons.find(n=>/配分を確定|次へ|完了/.test(n.textContent))||buttons.find(n=>/NPBドラフト|プロ志望|指名を受け|オファーを受け|契約を結|入団/.test(n.textContent))||buttons[0];if(!b)throw Error('NO_ACTION');const before=JSON.parse(JSON.stringify(S)),action=b.textContent;b.click();return {before,after:JSON.parse(JSON.stringify(S)),action};}
};`;
async function page(width,pos='P',seed='intl-stats',old=false,approved=false){
 const p=await h.page(width,pos,seed);
 await p.route('**/src/engine/game.js',async route=>{const response=await route.fetch();let body=old?instrument(approved?approvedPhoenixPrior:prior):await response.text();if(!body.includes('let s6rng=[]'))body=instrument(body);const at=body.lastIndexOf('})();');await route.fulfill({response,body:body.slice(0,at)+hook+phoenixAwardProbe+body.slice(at)});});
 await p.reload();await p.waitForFunction(()=>window.__intlDisplay&&!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();return p;
}
const clean=s=>{const copy=structuredClone(s);delete copy.version;for(const r of Object.values(copy.intlTraitResults||{}))delete r.personalStats;return copy;};
const digest=s=>createHash('sha256').update(JSON.stringify(clean(s))).digest('hex');
const accept=async p=>p.locator('#act button').filter({hasText:'日本代表として出場'}).click();
async function fixture(p,v={}){await p.evaluate(v=>{window.__intlDisplay.fixture(v);window.__intlDisplay.begin('POST');},v);}
try{
 for(const pos of ['P','C','IF','OF'])for(const role of pos==='P'?['SP','MR','CL']:[null])await h.test('T01-T06-native-'+pos+'-'+role,{pos,role,baseline,fixture:true},async e=>{
  const runs=[];
  for(const old of [true,false]){
   const p=await page(1280,pos,'intl-native-'+pos+'-'+role,old);await fixture(p,{pos,role});await p.evaluate(()=>window.__intlDisplay.save());
   const before=await h.get(p);await accept(p);const first=await h.get(p);await p.evaluate(()=>window.__intlDisplay.repeat());assert.deepEqual(await h.get(p),first);assert.equal(await p.evaluate(()=>window.__intlDisplay.continued()),1);
   if(!old){const r=first.state.intlTraitResults['P12:2035'];assert.ok(r.personalStats);for(const [k,value]of Object.entries(r.personalStats.stats))assert.equal(value,k==='IP'?Number((first.state.intlStat[k]-before.state.intlStat[k]).toFixed(1)):first.state.intlStat[k]-before.state.intlStat[k]);assert.equal(await p.locator('.intl-personal-stats').count(),1);}
   await p.evaluate(()=>{window.__intlDisplay.change({year:2038});window.__intlDisplay.begin('PRE');});await accept(p);const second=await h.get(p);
   if(!old){assert.deepEqual(second.state.intlTraitResults['P12:2035'],first.state.intlTraitResults['P12:2035']);assert.ok(second.state.intlTraitResults['WBC:2038'].personalStats);for(const [k,v]of Object.entries(second.state.intlTraitResults['WBC:2038'].personalStats.stats))assert.equal(v,k==='IP'?Number((second.state.intlStat[k]-first.state.intlStat[k]).toFixed(1)):second.state.intlStat[k]-first.state.intlStat[k]);}
   runs.push({first:clean(first.state),second:clean(second.state),rng:second.rng});e.snapshots.push({old,first,second});await p.close();
  }
  assert.deepEqual(runs[1],runs[0]);
 });
 for(const status of ['decline','injured'])await h.test('T07-'+status,{fixture:true,status},async()=>{const p=await page(320);await fixture(p,{rehab:status==='injured'?1:0});if(status==='decline')await p.locator('#act button').filter({hasText:'辞退'}).click();const s=await h.get(p);assert.equal(s.rng.length,0);assert.deepEqual(s.state.intlTraitResults,{});assert.equal(s.state.intlCount,0);assert.equal(await p.locator('.intl-personal-stats').count(),0);await p.close();});
 for(const hadIntlace of [false,true])await h.test('T08-intlace-'+hadIntlace,{fixture:true,hadIntlace},async()=>{const runs=[];for(const old of [true,false]){const p=await page(390,'P','intl-unlock',old);await fixture(p,{intlCount:2,intlFinalCount:2,traits:{intlace:hadIntlace}});await accept(p);const state=await h.get(p);runs.push({state:clean(state.state),rng:state.rng});await p.close();}assert.deepEqual(runs[1],runs[0]);});
 await h.test('T10-T12-old-copy-redraw',{fixture:true},async()=>{const p=await page(320);await fixture(p);await accept(p);const saved=await h.get(p),personal=saved.state.intlTraitResults['P12:2035'].personalStats;
  await p.evaluate(()=>window.__intlDisplay.change({pos:'IF',intlStat:{G:999}}));const before=await h.get(p);for(let n=0;n<3;n++)await p.evaluate(()=>window.__intlDisplay.redraw('P12:2035'));assert.deepEqual(await h.get(p),before);assert.deepEqual(before.state.intlTraitResults['P12:2035'].personalStats,personal);assert.match(await p.locator('#log').innerText(),/登板/);assert.equal(await p.evaluate(()=>window.__intlDisplay.render('absent')),'<p>本大会の個人成績：記録なし</p>');await p.close();});
 for(const width of [1280,320,360,390])for(const theme of ['standard','night','classic','scoreboard'])for(const pos of ['P','IF'])await h.test('T14-'+width+'-'+theme+'-'+pos,{width,theme,pos,font:'large',fixture:true},async()=>{
  const p=await page(width,pos),beforeSettings=await h.get(p);await openBoardAction(p,'board-preferences');await p.locator('[name="theme"][value="'+theme+'"]').check();await p.locator('[name="fontSize"][value="large"]').check();await p.locator('#preferences-close').click();assert.deepEqual(await h.get(p),beforeSettings);await fixture(p,{pos});await accept(p);const before=await h.get(p);const card=p.locator('.intl-personal-stats');assert.equal(await card.count(),1);assert.match(await card.innerText(),pos==='P'?/登板.*投球回.*勝利.*セーブ[\s\S]*奪三振.*防御率/:/出場.*打席.*打数.*安打[\s\S]*打率.*本塁打.*打点/);
  assert.ok(await card.evaluate(n=>n.scrollWidth<=n.clientWidth));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.waitForFunction(()=>[...document.querySelectorAll('#log .card')].every(n=>Number(getComputedStyle(n).opacity)===1));await p.screenshot({path:h.output+'/T14-'+width+'-'+theme+'-'+pos+'.png',fullPage:true});assert.deepEqual(await h.get(p),before);await p.close();
 });
 if(!process.argv.includes('--fixtures-only')){
  let wbc=0,p12=0;
  for(const [seed,pos]of [['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-catcher-01','C'],['jp3-infielder-01','IF'],['jp3-outfielder-01','OF']])await h.test('fixed-career-'+seed,{seed,pos,baseline,strategy:'balanced attacking abilities, stay with current team'},async e=>{
   const phoenixCase=seed==='jp3-infielder-01'&&pos==='IF',runs=[];
   for(const mode of [true,false,...(phoenixCase?['approved','repeat']:[])]){
    const old=mode===true||mode==='approved',p=await page(1280,pos,seed,old,mode==='approved'),actions=[];
    for(let n=0;n<2000;n++){const step=await p.evaluate(()=>window.__intlDisplay.step());if(step.done)break;actions.push({action:step.action,before:digest(step.before),after:digest(step.after),beforeState:clean(step.before),afterState:clean(step.after)});if(n===1999)throw Error('CAREER_LIMIT');}
    const result=await h.get(p),awards=(await p.evaluate(()=>window.__phoenixAwardEvents)).map(event=>({...event,before:clean(event.before),after:clean(event.after)}));
    assert.equal(result.state.done,true);runs.push({actions,state:clean(result.state),rng:result.rng,awards});
    await h.save('career-'+seed+'-'+(mode==='approved'?'approved-phoenix-control':mode==='repeat'?'repeat':old?'baseline':'current'),{actions,state:result.state,rng:result.rng,awards});
    if(!old){const keys=Object.keys(result.state.intlTraitResults);if(mode===false){wbc+=keys.filter(k=>k.startsWith('WBC:')).length;p12+=keys.filter(k=>k.startsWith('P12:')).length;}for(const r of Object.values(result.state.intlTraitResults))assert.ok(r.personalStats);e.snapshots.push({actions:actions.length,rng:result.rng.length,international:keys});}
    await p.close();
   }
   if(phoenixCase)e.phoenixComparison=assertApprovedPhoenixCareer(runs[0],runs[1],runs[2],runs[3],'actions');
   else e.d2ProducerRenameComparison=assertApprovedProducerRenameCareer(runs[0],runs[1]);
  });
  await h.test('fixed-career-international-coverage',{natural:true},async()=>{assert.ok(wbc>0,'natural WBC appearance required');assert.ok(p12>0,'natural Premier12 appearance required');});
 }
}finally{const result=await h.finish();process.exit(result.fail||h.errors.length?1:0);}
