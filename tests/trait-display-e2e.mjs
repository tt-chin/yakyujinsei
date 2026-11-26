import {currentUiBaselineVersion} from './support/ui-version-comparison.mjs';
import {openReaderDetails} from './support/reader-disclosure.mjs';
import {assertSameCareer} from './support/first-difference.mjs';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {harness,arg,instrument,instrumentAbility} from './support/stage6-browser.mjs';
import {TRAIT_LABELS,TRAIT_TEXT} from '../docs/src/engine/trait-policy.js';
import {EVENT_TRAIT_TEXT} from '../docs/src/engine/event-policy.js';
import {injectOverlayHook} from './support/overlay-hook.mjs';

// TEST-BASELINE-REBASE-01: post-modularization baseline (dev after OOP phase 45). The whole docs tree is served from it, so one hook and raw S serve both sides.
const baseline=execFileSync('git',['rev-parse',(arg('baseline')||'ee0ae9ec863e4be0d1abc345d24080744bb6858c')+'^{commit}'],{encoding:'utf8'}).trim();
const baselineFiles=new Map(),baselineFile=rel=>{if(!baselineFiles.has(rel))baselineFiles.set(rel,execFileSync('git',['show',baseline+':docs/'+rel],{maxBuffer:20e6,stdio:['ignore','pipe','ignore']}));return baselineFiles.get(rel);};
if(/(?:^|\n)[ \t]*function (?:blankStat|buildTraitsViewModel)\(/.test(baselineFile('src/engine/game.js').toString()))throw Error('TRAIT_DISPLAY_BASELINE_PRE_MODULE '+baseline);
const h=await harness('trait-display'),labels=Object.keys(TRAIT_LABELS);
const runTest=h.test;h.test=(id,input,action)=>!arg('cases')||id.startsWith(arg('cases'))?runTest(id,input,action):Promise.resolve();
const hook=`window.__traitDisplay={
 get:()=>window.__stage6.get(),
 patch:v=>Object.assign(S,v),
 labels:()=>({position:primaryPos(),type:playerType(),traits:traitNames()}),
 tier:bucket=>tierOf(bucket),
 emptyLeague:()=>{const st={...seasonStats.blankStat(),yr:1};S.stats.NPB={...st};S.statsByLevel??={};S.statsByLevel.NPB1={...st};},
 clear:()=>{$('log').replaceChildren();_curYearBody=null;},
 model:()=>careerPresenter.traits(),
 acquire:(key,description)=>traitCard(key,displayTrait(key),description),
 lose:()=>{removeTrait('rubber','ゴムゴムの腕');card('bad','ゴムゴムの腕、ついに限界','手術により効果が終了。');},
 archive:()=>{if(typeof archiveTraitResults==='function')archiveTraitResults();},
 retire:()=>endGame('特性表示fixture'),
 grinder:()=>{S.stage='PRO';S.lv='NPB1';S.org='NPB';S.orgTeamId='NPB_CL_HAN';S.potSum0=469;S.stats.NPB={...seasonStats.blankStat(),yr:1,G:1,PA:4,AB:3,H:1};endGame('引退時の新規取得fixture');},
 oldLegend:()=>{S.traits.legend=true;S.legendLeague='NPB';endGame('既取得の相容fixture');},
 choose:()=>choose('次の操作',[{t:'次へ',f:()=>card('info','次へ','進行しました。')}]),
 saveChoice:()=>{window.__traitStale=$('act').querySelector('button').onclick;},
 stale:()=>window.__traitStale(),
 share:async(evals=[])=>{const out=document.createElement('div'),texts=[],boxes=[],original=CanvasRenderingContext2D.prototype.fillText;document.body.appendChild(out);CanvasRenderingContext2D.prototype.fillText=function(text,...args){texts.push(text);boxes.push({text:String(text),x:args[0],y:args[1],width:this.measureText(String(text)).width});return original.call(this,text,...args);};try{await shareImage(evals,out);const png=out.querySelector('img').src;out.remove();return {texts,png,boxes};}finally{CanvasRenderingContext2D.prototype.fillText=original;}},
 step:()=>{if(S.done)return{done:true};const rows=[...$('act').querySelectorAll('.abrow')].filter(n=>n.getAttribute('aria-disabled')!=='true'&&!n.classList.contains('capped')),buttons=[...$('act').querySelectorAll('button:not([data-fa-sort])')].filter(n=>!n.disabled&&!/元に戻す|すべてリセット/.test(n.textContent));const jb=buttons.find(n=>/^背番号 \\S+ (で入団する|にする)$/.test(n.textContent.trim()));if(jb){jb.click();return{skip:true};}let b=buttons.find(n=>n.textContent.trim().startsWith('通常投球'))||rows.sort((a,b)=>S.ab[a.dataset.abilityKey]-S.ab[b.dataset.abilityKey])[0]||buttons.find(n=>/配分を確定|次へ|完了/.test(n.textContent))||buttons.find(n=>/NPBドラフト|プロ志望|指名を受け|オファーを受け|契約を結|入団/.test(n.textContent))||buttons[0];if(!b)throw Error('NO_ACTION');const before=JSON.parse(JSON.stringify(S));delete before.version;delete before.jerseyHistory;const action=window.__allocationComparison.action(b);b.click();const jb2=[...$('act').querySelectorAll('button:not([data-fa-sort])')].find(n=>/^背番号 \\S+ (で入団する|にする)$/.test(n.textContent.trim()));if(jb2)jb2.click();const after=JSON.parse(JSON.stringify(S));delete after.version;delete after.jerseyHistory;return{before,after,action,jersey:!!jb2};}
};`;
async function page(width,pos='IF',seed='trait-display',old=false){
 const p=await h.page(width,pos,seed,{beforeLoad:async p=>{if(old)await p.route(url=>url.hostname==='127.0.0.1'||(!!arg('preview')&&url.origin===new URL(arg('preview')).origin),async route=>{const rel=decodeURIComponent(new URL(route.request().url()).pathname).slice(1)||'index.html';let body;try{body=baselineFile(rel);}catch{return route.fulfill({status:404,body:'baseline missing '+rel});}if(rel==='src/config.js')body=currentUiBaselineVersion(body);if(rel==='src/engine/player-ability.js')body=instrumentAbility(body.toString());await route.fulfill({body,contentType:rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':rel.endsWith('.json')?'application/json':'text/html'});});
 await p.route('**/src/engine/game.js',async route=>{const response=await route.fetch();let body=old?instrument(baselineFile('src/engine/game.js').toString()):await response.text();if(!body.includes('let s6rng=[]'))body=instrument(body);await route.fulfill({response,body:injectOverlayHook(body,hook)});});}});await p.waitForFunction(()=>window.__traitDisplay&&!document.querySelector('#btn-start').disabled);return p;
}
const descriptions={...TRAIT_TEXT,...EVENT_TRAIT_TEXT};
try{
 for(const width of [1280,320,390])for(const pos of ['P','IF'])await h.test('display-name-'+width+'-'+pos,{width,pos,fixture:true},async()=>{
  const p=await page(width,pos);
  for(const theme of ['standard','night','classic','scoreboard']){
   await p.evaluate(({pos,theme})=>{
    window.__stage6.fixture({pos,ability:40,age:42});window.__traitDisplay.clear();
    window.__traitDisplay.patch({mrTeamName:'NPB_CL_HAN',orgTeamId:'NPB_CL_YOM',roleYears:{SP:2,MR:2,CL:2},dposYears:{SS:1,'2B':1,'3B':1,CF:1,RF:1,LF:1,'1B':1,C:1},franchiseAchievement:{year:2030,league:'NPB',teamId:'NPB_CL_HAN'}});
    window.__traitDisplay.emptyLeague();
    document.documentElement.dataset.theme=theme;document.documentElement.dataset.fontSize='large';
    window.__traitDisplay.acquire('franchise','この球団での実績により取得。');window.__traitDisplay.acquire('mrteam','同じ球団での実績により取得。');
   },{pos,theme});
   const names=await p.evaluate(()=>window.__traitDisplay.labels());
   assert.equal(names.type,'発展途上型');assert.match(names.position,pos==='P'?/^スイングマン\(/:/^ユーティリティープレーヤー\(/);
   assert.equal(names.traits.mrteam,'ミスターストライプス');assert.equal(names.traits.franchise,'フランチャイズプレーヤー');
   for(const key of ['franchise','mrteam'])assert.equal(await p.locator('[data-trait-result="'+key+'"]').getAttribute('data-trait-name'),names.traits[key]);
   const before=await h.get(p),model=await p.evaluate(()=>window.__traitDisplay.model());
   assert.ok(model.active.includes(names.traits.mrteam));assert.ok(model.active.includes(names.traits.franchise));
   await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();
   assertSameCareer((await h.get(p)).state,before.state);assertSameCareer((await h.get(p)).rng,before.rng);
   assert.doesNotMatch(await p.locator('#log').innerText(),/神カード/);assert.equal(await p.locator('[data-trait-result]').count(),0,'archive keeps labels and drops acquisition decoration');
   await p.locator('[data-main-view="home"]').click();
   const unchanged=await h.get(p),image=await p.evaluate(()=>window.__traitDisplay.share([window.__traitDisplay.tier('NPB').name]));
   assertSameCareer(await h.get(p),unchanged,'all render-only labels and PNG keep complete state/RNG/control');
   assert.ok(image.texts.includes('★ NPB 実績を残せず'),'PNG uses shared league/tier name');
   assert.ok(image.texts.includes(names.traits.mrteam));assert.ok(image.texts.includes(names.traits.franchise));assert.ok(image.texts.some(t=>String(t).startsWith(names.position+'｜発展途上型｜')));
   for(const box of image.boxes.filter(b=>b.y===98||b.text===names.traits.mrteam||b.text===names.traits.franchise))assert.ok(box.x>=0&&box.x+box.width<=886,'PNG name clipping: '+box.text);
   await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'traits viewport overflow');
   await p.screenshot({path:h.output+'/names-'+width+'-'+pos+'-'+theme+'.png',fullPage:true});
   if(theme==='classic'&&width===390){const {writeFile}=await import('node:fs/promises');await writeFile(h.output+'/career-names-'+pos+'.png',Buffer.from(image.png.split(',')[1],'base64'));}
   // Long labels and the two same-name cities use the acquired team, not the current team.
   for(const [id,label] of [['MLB_NL_ARI','ミスターダイヤモンドバックス'],['KBO_CHANGWON_DINOS','ミスター昌原ダイナソーズ'],['CPBL_TAIPEI_DINOS','ミスター台北ダイナソーズ'],['UNKNOWN','ミスター'],[null,'ミスター']]){
    await p.evaluate(id=>window.__traitDisplay.patch({mrTeamName:id}),id);const beforeLabel=await h.get(p);
    await p.locator('[data-main-view="home"]').click();await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();
    const model=await p.evaluate(()=>window.__traitDisplay.model());assert.ok(model.active.includes(label));assert.ok((await p.locator('#view-player').innerText()).includes(label));
    const image=await p.evaluate(()=>window.__traitDisplay.share());assert.ok(image.texts.includes(label));
    for(const box of image.boxes.filter(b=>b.text===label))assert.ok(box.x>=0&&box.x+box.width<=886,'nickname PNG clipping: '+label);
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'nickname viewport overflow');
    assertSameCareer((await h.get(p)).state,beforeLabel.state);assertSameCareer((await h.get(p)).rng,beforeLabel.rng);
   }
  }
  await p.evaluate(()=>{window.__traitDisplay.patch({mrTeamName:'NPB_CL_HAN'});window.__traitDisplay.retire();});
  const profile=await p.locator('#log .card').filter({has:p.locator('h4',{hasText:'キャリアプロフィール'})}).innerText();
  assert.match(profile,/ミスター/);assert.match(profile,/フランチャイズプレーヤー/);assert.doesNotMatch(profile,/スインガー|ツールマン|期待の若手/);
  await p.close();
 });
 await h.test('display-name-return-title',{width:390,fixture:true},async()=>{
  const p=await page(390);await p.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('開始時点をセーブしました'));
  const read=()=>p.evaluate(async()=>JSON.parse(JSON.stringify(await new (await import('/src/engine/browser-save-store.js')).BrowserSaveStore().read())));
  await p.locator('#board-menu-toggle').click();await p.locator('#board-preferences').click();await p.locator('[name="theme"][value="night"]').check();await p.locator('[name="fontSize"][value="large"]').check();await p.locator('#preferences-close').click();
  const saved=await read(),preferences=await p.evaluate(()=>localStorage.getItem('yakyujinsei.display.v1')),before=await h.get(p);assert.ok(preferences,'non-empty saved display preferences are exercised');
  await p.locator('#board-menu-toggle').click();const button=p.locator('#btn-restart');assert.equal(await p.getByRole('button',{name:'タイトルに戻る',exact:true}).count(),1);assert.equal(await button.getAttribute('title'),'タイトルに戻る');
  await button.click();await p.locator('#confirmation-dialog').waitFor({state:'visible'});await p.locator('#confirmation-cancel').click();assertSameCareer(await read(),saved);assertSameCareer((await h.get(p)).state,before.state);assertSameCareer((await h.get(p)).rng,before.rng);
  await p.locator('#board-menu-toggle').click();await button.click();await p.locator('#confirmation-dialog').waitFor({state:'visible'});const nav=p.waitForURL(url=>!url.search);await p.locator('#confirmation-ok').click();await nav;await p.locator('#save-continue').waitFor({state:'visible'});
  assertSameCareer(await read(),saved,'title return keeps entire stored career');assert.equal(await p.evaluate(()=>localStorage.getItem('yakyujinsei.display.v1')),preferences);
  await p.close();
 });
 for(const width of [1280,320,360,390]){
  await h.test('all-labels-history-share-'+width,{width,fixture:true,ids:labels},async()=>{
   const p=await page(width,'IF','trait-display',arg('source')==='baseline');
   await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();});
   // Renderer fixtures are not proof that reserved traits can be acquired.
   await p.evaluate(v=>{for(const key of v.keys)window.__traitDisplay.acquire(key,v.desc[key]||'取得原因の表示fixture。');}, {keys:labels,desc:descriptions});
   let model=await p.evaluate(()=>window.__traitDisplay.model());
   assertSameCareer(model.active,Object.values(TRAIT_LABELS));
   const before=await h.get(p);await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();
   assertSameCareer(await h.get(p),before);
   const list=await p.locator('#player-content .ui-list').first().locator('li').allTextContents();assertSameCareer(list,Object.values(TRAIT_LABELS));
   const history=await p.locator('#log').innerText();for(const desc of Object.values(descriptions))assert.ok(!history.includes(desc));
   await p.locator('[data-main-view="home"]').click();
   await p.evaluate(()=>window.__traitDisplay.retire());
   await openReaderDetails(p.locator('#log .card').filter({has:p.locator('h4',{hasText:'キャリアプロフィール'})}),{snapshot:()=>h.get(p)});
   const profile=await p.locator('#log .card').filter({hasText:'キャリアプロフィール'}).innerText();for(const desc of Object.values(descriptions))assert.ok(!profile.includes(desc));for(const label of Object.values(TRAIT_LABELS))assert.ok(profile.includes(label),label+' retirement profile missing');
   const snapshot=await h.get(p),image=await p.evaluate(()=>window.__traitDisplay.share());assertSameCareer(await h.get(p),snapshot);assert.match(image.png,/^data:image\/png;base64,/);
   for(const key of labels)assert.ok(image.texts.join('\n').includes(TRAIT_LABELS[key]),key+' PNG label missing');
   for(const desc of Object.values(descriptions))assert.ok(!image.texts.join('').includes(desc));
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.screenshot({path:h.output+'/traits-'+width+'.png',fullPage:true});await p.close();
  });
  if(arg('source')==='baseline')continue;
  await h.test('acquisition-lifetime-'+width,{width,fixture:true},async()=>{
   const p=await page(width);await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();window.__traitDisplay.choose();window.__traitDisplay.saveChoice();window.__traitDisplay.choose();window.__traitDisplay.acquire('intlace','日本代表の出場条件を達成。');});
   const card=p.locator('[data-trait-result="intlace"]');assert.match(await card.innerText(),/日本代表.*次回出場から有効/s);
   const valid=await h.get(p);await p.evaluate(()=>window.__traitDisplay.stale());assert.equal(await p.locator('[data-trait-result="intlace"]').count(),1,'stale callback must not archive a newly acquired explanation');assertSameCareer(await h.get(p),valid);
   const before=await h.get(p);await p.evaluate(()=>window.__traitDisplay.choose());assert.match(await card.innerText(),/最低2点/);await p.locator('#act button:not([data-fa-sort])').filter({hasText:'次へ'}).click();assert.equal(await p.locator('[data-trait-result]').count(),0);assert.doesNotMatch(await p.locator('#log').innerText(),/最低2点/);
   const after=await h.get(p);assertSameCareer(after.state,before.state);assertSameCareer(after.rng,before.rng);
   await p.evaluate(()=>window.__traitDisplay.acquire('intlace','二度目の説明を表示しない'));assert.doesNotMatch(await p.locator('#log').innerText(),/二度目の説明/);
   await p.evaluate(()=>{window.__stage6.fixture({pos:'IF',traits:{intlace:true}});window.__traitDisplay.clear();});
   // Explicitly seed a read-only imported-state renderer rather than reacquire it.
   const m=await p.evaluate(()=>window.__traitDisplay.model());assertSameCareer(m.active,['国際大会の鬼']);
   await p.evaluate(()=>{window.__traitDisplay.acquire('rubber','二度の注射に成功。');window.__traitDisplay.lose();});assert.match(await p.locator('[data-trait-result="removed:rubber"]').innerText(),/効果が終了/);const lostState=await h.get(p);await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();assertSameCareer(await h.get(p),lostState);assertSameCareer((await p.evaluate(()=>window.__traitDisplay.model())).removed,['ゴムゴムの腕']);assert.doesNotMatch(await p.locator('#log').innerText(),/効果が終了/);
   await p.close();
  });
  await h.test('retirement-new-grinder-'+width,{width,fixture:true},async()=>{
   const p=await page(width);await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();window.__traitDisplay.grinder();});
   await openReaderDetails(p.locator('[data-trait-result="grinder"]'),{snapshot:()=>h.get(p)});assert.match(await p.locator('[data-trait-result="grinder"]').innerText(),/記念称号/);await openReaderDetails(p.locator('#log .card').filter({has:p.locator('h4',{hasText:'キャリアプロフィール'})}),{snapshot:()=>h.get(p)});const profile=await p.locator('#log .card').filter({hasText:'キャリアプロフィール'}).innerText();assert.doesNotMatch(profile,/記念称号/);await p.locator('[data-main-view="career"]').click();assert.equal(await p.locator('[data-trait-result]').count(),0);await p.close();
  });
  await h.test('old-owned-legend-'+width,{width,fixture:true},async()=>{const p=await page(width);await p.evaluate(()=>{window.__stage6.fixture({pos:'IF'});window.__traitDisplay.clear();window.__traitDisplay.oldLegend();});assert.equal(await p.locator('[data-trait-result="legend"]').count(),0,'already owned legend must not be presented as newly acquired');assert.equal((await h.get(p)).state.legendLeague,'NPB');await p.close();});
 }
 if(arg('source')!=='baseline')for(const [pos,seed]of [['P','yakyo-test-001'],['IF','s10-trait-38']])await h.test('exact-full-career-'+pos,{pos,seed,baseline},async e=>{
  const runs=[];for(const old of [true,false]){const p=await page(1280,pos,seed,old),actions=[];let skips=0;for(let n=0;n<1800;n++){const step=await p.evaluate(()=>window.__traitDisplay.step());if(step.done)break;if(step.skip){skips++;continue;}if(step.jersey)skips++;actions.push({action:step.action,before:createHash('sha256').update(JSON.stringify(step.before)).digest('hex'),after:createHash('sha256').update(JSON.stringify(step.after)).digest('hex'),beforeState:step.before,afterState:step.after});if(n===1799)throw Error('CAREER_LIMIT');}const result=await h.get(p);delete result.state.version;{const proPlayed=Object.values(result.state.statsByLevel||{}).some(v=>v&&(v.G>0||v.PA>0||v.IP>0));/* PLY-01 number step on both sides (the baseline is 2.0.0+): skipped unrecorded and counted; jerseyHistory is shape-checked and kept in the exact compare. */{const j=result.state.jerseyHistory;assert.equal(skips>0,proPlayed,seed+' number step appears exactly when the career reaches a professional team');if(skips>0)assert.ok(Array.isArray(j)&&j.length>0&&j.every(x=>typeof x.teamId==='string'&&Number.isInteger(x.year)&&typeof x.number==='string'),seed+' jerseyHistory shape');}}runs.push({actions,skips,state:result.state,rng:result.rng});await h.save('career-'+pos+'-'+(old?'baseline':'current'),runs.at(-1));await p.close();}assertSameCareer(runs[1],runs[0],pos+' exact full career vs baseline: raw S, actions, number steps, RNG');e.snapshots.push({actions:runs[1].actions.length,rng:runs[1].rng.length});
 });
}finally{const result=await h.finish();process.exit(result.fail||h.errors.length?1:0);}
