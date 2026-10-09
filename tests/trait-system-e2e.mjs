import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import os from 'node:os';
import {TRAIT_LABELS,TRAIT_TEXT,removedTraitLabel} from '../docs/src/engine/trait-policy.js';
const root=fileURLToPath(new URL('../',import.meta.url)),baseline='2375d46';
const arg=name=>process.argv.find(a=>a.startsWith('--'+name+'='))?.split('=').slice(1).join('=');
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const hook=`window.__traitTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0}),set:v=>Object.assign(S,v),gold:()=>checkGoldclothSeason(),award:v=>{Object.assign(S,v);awards(v.bucket||'NPB',v.st);},retire:()=>endGame('特性表示の検証'),share:()=>{const out=document.createElement('div');document.body.appendChild(out);const texts=[],bounds=[],original=CanvasRenderingContext2D.prototype.fillText;CanvasRenderingContext2D.prototype.fillText=function(text,...args){texts.push(text);bounds.push({text,x:args[0],y:args[1],width:this.measureText(text).width,height:this.canvas.height/2});return original.call(this,text,...args);};try{shareImage([],out);return {png:out.querySelector('img').src,texts,bounds};}finally{CanvasRenderingContext2D.prototype.fillText=original;}},pre:()=>{allocUI=()=>{};phasePre();},amateur:()=>{nextStep=()=>{};maybeIntl=next=>next();amateurSeason();}};`;
const oldHook=`window.__traitTest={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0})};`;
const reviewHook=`window.__traitTest.rubber=()=>afterGamble('inject',()=>{});`;
const cache=new Map(),errors=[];
const server=createServer(async(req,res)=>{try{
  const url=new URL(req.url,'http://localhost'),old=url.pathname.startsWith('/baseline/'),rel=decodeURIComponent(url.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('Invalid path');
  if(old&&!cache.has(rel))cache.set(rel,execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:20*1024*1024}));
  let content=old?cache.get(rel):await readFile(path.join(root,'docs',rel));
  if(rel==='src/engine/game.js'){content=content.toString().replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;');const at=content.lastIndexOf('})();');content=content.slice(0,at)+(old?oldHook:hook+reviewHook)+content.slice(at);}
  res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css; charset=utf-8':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true}),shots=path.join(os.tmpdir(),'yakyujinsei-traits');await mkdir(shots,{recursive:true});
const wire=p=>{p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))errors.push(r.status()+' '+r.url());});};
const start=async(p,url,pos='P')=>{await p.goto(url);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator('#seg-pos [data-v="'+pos+'"]').click();await p.locator('#btn-start').click();};
const action=()=>{const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];if(!b)throw Error('No career action');return b;};
const extra=new Set(['version']);
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!extra.has(key)).map(([key,v])=>[key,key==='removed'?v.map(x=>removedTraitLabel(x)):canonical(v)])):value;
const beforeDrawMetadata=value=>Array.isArray(value)?value.map(beforeDrawMetadata):value&&typeof value==='object'?Object.fromEntries(Object.entries(value).filter(([key])=>!['eventDrawYear','eventDrawnCardIDs','abilityPoints'].includes(key)).map(([key,v])=>[key,beforeDrawMetadata(v)])):value;
let failure;
try{
  if(!arg('preview')&&!process.argv.includes('--ui-only'))for(const [seed,pos] of [['yakyo-test-001','P'],['jp3-pitcher-02','P'],['jp3-pitcher-03','P'],['jp3-catcher-01','C'],['jp3-infielder-01','IF'],['jp3-outfielder-01','OF']]){
    const runs=[];
    for(const old of [true,false,false]){
      const p=await browser.newPage();wire(p);await start(p,local+(old?'/baseline/':'/')+'?seed='+seed,pos);const records=[];
      for(let i=0;i<2500;i++){
        const r=await p.evaluate(`(()=>{const h=window.__traitTest.get();if(h.state.done)return{record:h,done:true};const b=(${action.toString()})();h.action=b.innerText;b.click();return{record:h,done:false};})()`);records.push(r.record);if(r.done)break;if(i===2499)throw Error('Career did not complete');
      }
      runs.push(records);await p.close();
    }
    assert.deepEqual(runs[2],runs[1],seed+' new annual draw rule is not reproducible');
    let firstDifference=null;
    for(let i=0;i<Math.min(runs[0].length,runs[1].length);i++){
      const old=beforeDrawMetadata(canonical(runs[0][i])),now=beforeDrawMetadata(canonical(runs[1][i]));
      if(JSON.stringify(old)!==JSON.stringify(now)){
        assert.ok(old.state.pendingEvent&&now.state.pendingEvent,'first difference must be an event draw');assert.equal(old.state.year,now.state.year);assert.notEqual(old.state.pendingEvent.cardID,now.state.pendingEvent.cardID,'unrelated first difference');assert.ok(runs[1][i].state.eventDrawnCardIDs.length>=2);firstDifference={step:i,year:now.state.year,oldCard:old.state.pendingEvent.cardID,newCard:now.state.pendingEvent.cardID};break;
      }
    }
    for(const record of runs[1])assert.equal(new Set(record.state.eventDrawnCardIDs).size,record.state.eventDrawnCardIDs.length,'duplicate annual draw');
    const last=runs[1].at(-1),oldLast=runs[0].at(-1);assert.ok(last.state.done);assert.ok(oldLast.state.done);console.log(`${seed}/${pos}: old ${runs[0].length} actions/RNG ${oldLast.calls} -> new ${runs[1].length} actions/RNG ${last.calls}; two exact new runs, first approved draw difference ${JSON.stringify(firstDifference)}`);
  }
  for(const width of [1280,320,390]){
    const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width<500,hasTouch:width<500}),p=await ctx.newPage();wire(p);await start(p,(arg('preview')||local)+'/?seed=trait-ui');
    if(arg('preview')){
      for(const rel of ['src/config.js','src/engine/game.js','src/engine/trait-policy.js']){
        const deployed=await p.evaluate(async rel=>{const r=await fetch('./'+rel,{cache:'no-store'});if(!r.ok)throw Error(rel+' HTTP '+r.status);return r.text();},rel);
        assert.equal(deployed.replace(/\r\n/g,'\n'),(await readFile(path.join(root,'docs',rel),'utf8')).replace(/\r\n/g,'\n'),rel+' Preview differs from tested source');
      }
      const declines=await p.evaluate(async()=>{const {declineForSeason}=await import('./src/engine/trait-policy.js');return [0,1,3,5].map(base=>declineForSeason({oldGhostPending:true},base));});assert.deepEqual(declines,[0,1,2,3]);
      await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();
      // Synthetic renderer fixture only; reserved traits are not acquired in the game.
      await p.evaluate(async()=>{const {TRAIT_LABELS,traitLabel}=await import('./src/engine/trait-policy.js'),{renderTraits}=await import('./src/ui/ability-view.js');renderTraits(document.querySelector('#player-content'),{active:Object.keys(TRAIT_LABELS).map(k=>traitLabel(k,{mrTeamName:'阪神ストライプス',legendLeague:'NPB',rainbowLg:'メジャーリーグ'})),removed:[]});});
    }else{
      await p.evaluate(()=>{window.__traitTest.set({tjSuccess:1,traits:{}});window.__traitTest.rubber();});
      const rubber=p.locator('#log .card').filter({hasText:'隠し特性解放：ゴムゴムの腕'});assert.match(await rubber.innerText(),/上限が50から100に、注射成功率が55%から85%に上昇/);assert.doesNotMatch(await rubber.innerText(),/2倍/);await rubber.scrollIntoViewIfNeeded();assert.ok(await rubber.isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await p.screenshot({path:path.join(shots,'rubber-'+width+'.png')});
      await p.evaluate(labels=>window.__traitTest.set({traits:Object.fromEntries(Object.keys(labels).map(k=>[k,true])),mrTeamName:'阪神ストライプス',legendLeague:'NPB',rainbowLg:'メジャーリーグ',removed:['ムードメーカー','ラバーアーム'],tripleCrownHistory:{hitterTC:[{year:2030,bucket:'NPB',league:'NPB'}]}}),TRAIT_LABELS);
      const before=await p.evaluate(()=>window.__traitTest.get());await p.locator('[data-main-view="player"]').click();await p.locator('[data-player-tab="traits"]').click();assert.deepEqual(await p.evaluate(()=>window.__traitTest.get()),before,'trait viewing is read-only/RNG=0');
      assert.equal(await p.locator('#player-content .ui-list').first().locator('li').count(),38);
      assert.match(await p.locator('#player-content').innerText(),/問題児/);assert.doesNotMatch(await p.locator('#player-content').innerText(),/ムードメーカー|ラバーアーム|undefined/);
    }
    const text=await p.locator('#player-content').innerText();for(const label of Object.values(TRAIT_LABELS))assert.ok(text.includes(label),label+' missing');
    assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await p.locator('#player-content li').last().scrollIntoViewIfNeeded();assert.ok(await p.locator('#player-content li').last().isVisible());await p.screenshot({path:path.join(shots,(arg('preview')?'preview-':'local-')+width+'.png')});
    if(!arg('preview')){
      await p.locator('[data-main-view="home"]').click();await p.evaluate(()=>window.__traitTest.retire());
      const retirement=await p.locator('#log').innerText();for(const label of Object.values(TRAIT_LABELS))assert.ok(retirement.includes(label),label+' missing at retirement');
      const before=await p.evaluate(()=>window.__traitTest.get()),{png,texts,bounds}=await p.evaluate(()=>window.__traitTest.share());assert.match(png,/^data:image\/png;base64,/);assert.deepEqual(await p.evaluate(()=>window.__traitTest.get()),before,'image generation RNG/state=0');
      for(const label of Object.values(TRAIT_LABELS))assert.ok(texts.join('\n').includes(label),label+' missing from image drawing');
      for(const b of bounds)assert.ok(b.y+20<=b.height,b.text+' vertically clipped');
      const sponsor=bounds.find(b=>b.text.startsWith('スポンサー収入 ')),footer=bounds.find(b=>b.text.startsWith('seed: '));assert.ok(sponsor.y+20<footer.y,'income overlaps footer');
      await writeFile(path.join(shots,'share-'+width+'.png'),Buffer.from(png.split(',')[1],'base64'));
    }
    console.log(`${arg('preview')?'Preview':'Local'} ${width}: 38 labels, normal scrolling/no overflow, ${arg('preview')?'deployed renderer':'retirement/share/read-only RNG=0'} passed`);await ctx.close();
  }
  if(!arg('preview')){
    const p=await browser.newPage();wire(p);await start(p,local+'/?seed=trait-flow');
    await p.evaluate(()=>window.__traitTest.set({stage:'PRO',lv:'NPB1',org:'NPB',orgTeamId:'NPB_CL_HAN',year:2039,age:29,firstTeamYearsByTeam:{NPB_CL_HAN:9},firstTeamSeasons:{},traits:{}}));
    const before=await p.evaluate(()=>window.__traitTest.get());await p.evaluate(()=>{window.__traitTest.gold();window.__traitTest.gold();});const after=await p.evaluate(()=>window.__traitTest.get());assert.equal(after.state.firstTeamYearsByTeam.NPB_CL_HAN,10);assert.equal(after.state.traits.goldcloth,true);assert.equal(after.calls,before.calls);assert.equal(await p.locator('#log .card').filter({hasText:'隠し特性解放：黄金のユニフォーム'}).count(),1);
    await p.evaluate(()=>window.__traitTest.set({stage:'HS',lv:'HS',stageYr:1,schoolTier:'S',traits:{},ab:{sta:80,vel:80,ctl:80,brk:80},domesticTournamentLog:[{year:2025,key:'HS_SUMMER_LOCAL',result:'優勝'},{year:2025,key:'HS_FALL',result:'優勝'},{year:2025,key:'HS_KOSHIEN',result:'優勝'}],domesticCompletedKeys:{},eventSeasonContext:null,pendStat:0,seasonFactor:1}));await p.evaluate(()=>window.__traitTest.amateur());assert.equal((await p.evaluate(()=>window.__traitTest.get())).state.traits.miraclegen,true);assert.equal(await p.locator('#log .card').filter({hasText:'隠し特性解放：奇跡の世代'}).count(),1);
    const ab=Object.fromEntries(['sta','vel','ctl','brk','con','pow','eye','spd','rng','fld','arm','cat'].map(k=>[k,50]));
    await p.evaluate(ab=>window.__traitTest.award({year:2045,age:23,stage:'PRO',org:'NPB',lv:'NPB1',pos:'P',role:'SP',traits:{},ab,seasonFactor:1,honors:[],stats:{NPB:{yr:2,AS:0}},st:{d:15,era:2,IP:180,SO:220}}),ab);
    assert.equal((await p.evaluate(()=>window.__traitTest.get())).state.traits.strongpitch,true);
    await p.evaluate(ab=>window.__traitTest.award({year:2045,age:35,stage:'PRO',org:'NPB',lv:'NPB1',pos:'IF',traits:{},ab,seasonFactor:1,honors:[],stats:{NPB:{yr:2,AS:0}},dpos:'DH',st:{d:15,PA:600,avg:.38,HR:45,RBI:140,SB:0,H:200,BB:20,DEF:0}}),ab);
    let state=(await p.evaluate(()=>window.__traitTest.get())).state;assert.equal(state.traits.hitterTC,true);assert.equal(state.traits.oldghost,true);assert.equal(state.oldGhostPending,true);
    await p.evaluate(()=>{window.__traitTest.set({year:2046,age:36,rehab:1});window.__traitTest.pre();});state=(await p.evaluate(()=>window.__traitTest.get())).state;for(const k of ['sta','con','pow','eye','spd','rng','fld','arm'])assert.equal(state.ab[k],47);assert.equal(state.oldGhostUsed,true);assert.equal(state.oldGhostPending,false);
    await p.evaluate(()=>{window.__traitTest.set({year:2047,age:37,rehab:1});window.__traitTest.pre();});state=(await p.evaluate(()=>window.__traitTest.get())).state;for(const k of ['sta','con','pow','eye','spd','rng','fld','arm'])assert.equal(state.ab[k],40);
    await p.close();console.log('Actual first-team/HS acquisition, awards/young pitcher/triple crown/MVP and one-use next-season decline during rehab DOM passed');
  }
  assert.deepEqual(errors,[]);console.log('Console errors / JavaScript-CSS404: 0; screenshots '+shots);
}catch(e){failure=e;console.error(e.stack);}finally{server.closeAllConnections();server.close();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(failure?1:0);}
