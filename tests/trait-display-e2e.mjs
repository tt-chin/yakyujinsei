import assert from 'node:assert/strict';
import {historicalCareer} from '../tools/development-b/historical-comparison.mjs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {harness,arg,instrument} from './support/stage6-browser.mjs';
import {TRAIT_LABELS,TRAIT_TEXT} from '../docs/src/engine/trait-policy.js';
import {EVENT_TRAIT_TEXT} from '../docs/src/engine/event-policy.js';
import {withApprovedSchoolChanges} from './support/approved-school-oracle.mjs';
import {injectOverlayHook} from './support/overlay-hook.mjs';

const baseline=execFileSync('git',['rev-parse',(arg('baseline')||'a0b880bb7e7fe74e743daa0cb8144455c9fdded2')+'^{commit}'],{encoding:'utf8'}).trim();
const source=withApprovedSchoolChanges(execFileSync('git',['show',baseline+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}));
const h=await harness('trait-display'),labels=Object.keys(TRAIT_LABELS);
const runTest=h.test;h.test=(id,input,action)=>!arg('cases')||id.startsWith(arg('cases'))?runTest(id,input,action):Promise.resolve();
const hook=`window.__traitDisplay={
 get:()=>window.__stage6.get(),
 clear:()=>{$('log').replaceChildren();_curYearBody=null;},
 model:()=>buildTraitsViewModel(),
 acquire:(key,description)=>traitCard(key,displayTrait(key),description),
 lose:()=>{removeTrait('rubber','ゴムゴムの腕');card('bad','ゴムゴムの腕、ついに限界','手術により効果が終了。');},
 archive:()=>{if(typeof archiveTraitResults==='function')archiveTraitResults();},
 retire:()=>endGame('特性表示fixture'),
 grinder:()=>{S.stage='PRO';S.lv='NPB1';S.org='NPB';S.orgTeamId='NPB_CL_HAN';S.potSum0=469;S.stats.NPB={...blankStat(),yr:1,G:1,PA:4,AB:3,H:1};endGame('引退時の新規取得fixture');},
 oldLegend:()=>{S.traits.legend=true;S.legendLeague='NPB';endGame('既取得の相容fixture');},
 choose:()=>choose('次の操作',[{t:'次へ',f:()=>card('info','次へ','進行しました。')}]),
 saveChoice:()=>{window.__traitStale=$('act').querySelector('button').onclick;},
 stale:()=>window.__traitStale(),
 share:()=>{const out=document.createElement('div'),texts=[],original=CanvasRenderingContext2D.prototype.fillText;document.body.appendChild(out);CanvasRenderingContext2D.prototype.fillText=function(text,...args){texts.push(text);return original.call(this,text,...args);};try{shareImage([],out);const png=out.querySelector('img').src;out.remove();return {texts,png};}finally{CanvasRenderingContext2D.prototype.fillText=original;}},
 step:()=>{if(S.done)return{done:true};const rows=[...$('act').querySelectorAll('.abrow')].filter(n=>n.getAttribute('aria-disabled')!=='true'&&!n.classList.contains('capped')),buttons=[...$('act').querySelectorAll('button')].filter(n=>!n.disabled&&!/元に戻す|すべてリセット/.test(n.textContent));let b=buttons.find(n=>n.textContent.trim().startsWith('通常投球'))||rows.sort((a,b)=>S.ab[a.dataset.abilityKey]-S.ab[b.dataset.abilityKey])[0]||buttons.find(n=>/配分を確定|次へ|完了/.test(n.textContent))||buttons.find(n=>/NPBドラフト|プロ志望|指名を受け|オファーを受け|契約を結|入団/.test(n.textContent))||buttons[0];if(!b)throw Error('NO_ACTION');const before=JSON.parse(JSON.stringify(S));delete before.version;const action=b.textContent;b.click();const after=JSON.parse(JSON.stringify(S));delete after.version;return{before,after,action};}
};`;
async function page(width,pos='IF',seed='trait-display',old=false){
 const p=await h.page(width,pos,seed);
 await p.route('**/src/engine/game.js',async route=>{const response=await route.fetch();let body=old?instrument(source):await response.text();if(!body.includes('let s6rng=[]'))body=instrument(body);await route.fulfill({response,body:injectOverlayHook(body,hook)});});
 await p.reload();await p.waitForFunction(()=>window.__traitDisplay&&!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();return p;
}
const descriptions={...TRAIT_TEXT,...EVENT_TRAIT_TEXT};
try{
 for(const width of [1280,320,360,390]){
  await h.test('all-labels-history-share-'+width,{width,fixture:true,ids:labels},async()=>{
   const p=await page(width,'IF','trait-display',arg('source')==='baseline');
   await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();});
   // Renderer fixtures are not proof that reserved traits can be acquired.
   await p.evaluate(v=>{for(const key of v.keys)window.__traitDisplay.acquire(key,v.desc[key]||'取得原因の表示fixture。');}, {keys:labels,desc:descriptions});
   let model=await p.evaluate(()=>window.__traitDisplay.model());
   assert.deepEqual(model.active,Object.values(TRAIT_LABELS));
   const before=await h.get(p);await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();
   assert.deepEqual(await h.get(p),before);
   const list=await p.locator('#player-content .ui-list').first().locator('li').allTextContents();assert.deepEqual(list,Object.values(TRAIT_LABELS));
   const history=await p.locator('#log').innerText();for(const desc of Object.values(descriptions))assert.ok(!history.includes(desc));
   await p.locator('[data-main-view="home"]').click();
   await p.evaluate(()=>window.__traitDisplay.retire());
   const profile=await p.locator('#log .card').filter({hasText:'キャリアプロフィール'}).innerText();for(const desc of Object.values(descriptions))assert.ok(!profile.includes(desc));for(const label of Object.values(TRAIT_LABELS))assert.ok(profile.includes(label),label+' retirement profile missing');
   const snapshot=await h.get(p),image=await p.evaluate(()=>window.__traitDisplay.share());assert.deepEqual(await h.get(p),snapshot);assert.match(image.png,/^data:image\/png;base64,/);
   for(const key of labels)assert.ok(image.texts.join('\n').includes(TRAIT_LABELS[key]),key+' PNG label missing');
   for(const desc of Object.values(descriptions))assert.ok(!image.texts.join('').includes(desc));
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:h.output+'/traits-'+width+'.png',fullPage:true});await p.close();
  });
  if(arg('source')==='baseline')continue;
  await h.test('acquisition-lifetime-'+width,{width,fixture:true},async()=>{
   const p=await page(width);await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();window.__traitDisplay.choose();window.__traitDisplay.saveChoice();window.__traitDisplay.choose();window.__traitDisplay.acquire('intlace','日本代表の出場条件を達成。');});
   const card=p.locator('[data-trait-result="intlace"]');assert.match(await card.innerText(),/日本代表.*次回出場から有効/s);
   const valid=await h.get(p);await p.evaluate(()=>window.__traitDisplay.stale());assert.equal(await p.locator('[data-trait-result="intlace"]').count(),1,'stale callback must not archive a newly acquired explanation');assert.deepEqual(await h.get(p),valid);
   const before=await h.get(p);await p.evaluate(()=>window.__traitDisplay.choose());assert.match(await card.innerText(),/最低2点/);await p.locator('#act button').filter({hasText:'次へ'}).click();assert.equal(await p.locator('[data-trait-result]').count(),0);assert.doesNotMatch(await p.locator('#log').innerText(),/最低2点/);
   const after=await h.get(p);assert.deepEqual(after.state,before.state);assert.deepEqual(after.rng,before.rng);
   await p.evaluate(()=>window.__traitDisplay.acquire('intlace','二度目の説明を表示しない'));assert.doesNotMatch(await p.locator('#log').innerText(),/二度目の説明/);
   await p.evaluate(()=>{window.__stage6.fixture({pos:'IF',traits:{intlace:true}});window.__traitDisplay.clear();});
   // Explicitly seed a read-only imported-state renderer rather than reacquire it.
   const m=await p.evaluate(()=>window.__traitDisplay.model());assert.deepEqual(m.active,['国際大会の鬼']);
   await p.evaluate(()=>{window.__traitDisplay.acquire('rubber','二度の注射に成功。');window.__traitDisplay.lose();});assert.match(await p.locator('[data-trait-result="removed:rubber"]').innerText(),/効果が終了/);const lostState=await h.get(p);await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();assert.deepEqual(await h.get(p),lostState);assert.deepEqual((await p.evaluate(()=>window.__traitDisplay.model())).removed,['ゴムゴムの腕']);assert.doesNotMatch(await p.locator('#log').innerText(),/効果が終了/);
   await p.close();
  });
  await h.test('retirement-new-grinder-'+width,{width,fixture:true},async()=>{
   const p=await page(width);await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();window.__traitDisplay.grinder();});
   assert.match(await p.locator('[data-trait-result="grinder"]').innerText(),/記念称号/);const profile=await p.locator('#log .card').filter({hasText:'キャリアプロフィール'}).innerText();assert.doesNotMatch(profile,/記念称号/);await p.locator('[data-main-view="career"]').click();assert.equal(await p.locator('[data-trait-result]').count(),0);await p.close();
  });
  await h.test('old-owned-legend-'+width,{width,fixture:true},async()=>{const p=await page(width);await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();window.__traitDisplay.oldLegend();});assert.equal(await p.locator('[data-trait-result="legend"]').count(),0,'already owned legend must not be presented as newly acquired');assert.equal((await h.get(p)).state.legendLeague,'NPB');await p.close();});
 }
 if(arg('source')!=='baseline')for(const [pos,seed]of [['P','yakyo-test-001'],['IF','s10-trait-38']])await h.test('exact-full-career-'+pos,{pos,seed,baseline},async e=>{
  const runs=[];for(const old of [true,false]){const p=await page(1280,pos,seed,old),actions=[];for(let n=0;n<1800;n++){const step=await p.evaluate(()=>window.__traitDisplay.step());if(step.done)break;actions.push({action:step.action,before:createHash('sha256').update(JSON.stringify(step.before)).digest('hex'),after:createHash('sha256').update(JSON.stringify(step.after)).digest('hex'),beforeState:step.before,afterState:step.after});if(n===1799)throw Error('CAREER_LIMIT');}const result=await h.get(p);delete result.state.version;runs.push({actions,state:result.state,rng:result.rng});await h.save('career-'+pos+'-'+(old?'baseline':'current'),runs.at(-1));await p.close();}assert.deepEqual(historicalCareer(runs[1]),historicalCareer(runs[0]));e.snapshots.push({actions:runs[1].actions.length,rng:runs[1].rng.length});
 });
}finally{const result=await h.finish();process.exit(result.fail||h.errors.length?1:0);}
