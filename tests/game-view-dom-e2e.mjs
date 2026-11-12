import {sourceText} from './support/source-text.mjs';
// No project dependency: pass --playwright=<installed package directory> when needed.
// GameView refactor guard (tasks/GAME_JS_OOP_REFACTOR_PLAN.md §2d.4): same seed/choices must give the same
// #log/#act/#board DOM, S and RNG count at every step as the fixed baseline. Allowed difference: none.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {findFirstDifference} from './support/first-difference.mjs';
import {instrumentRng} from './support/rng-instrument.mjs';
import {GAME_VIEW_HOOK,captureGameView,projectHofLog,projectMenu1163} from './support/dom-snapshot.mjs';
import {verifyFranchiseGrant,projectFranchiseField} from '../tools/development-b/historical-comparison.mjs';
import {JP_DATA} from '../docs/src/data/jp-data.js';
import {baselineNeedsChampionmakerProjection,projectChampionmakerState} from '../tools/development-b/championmaker-state-oracle.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const arg=k=>process.argv.find(a=>a.startsWith('--'+k+'='))?.slice(k.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const baselineRef=arg('baseline')||'4f39a73e23758b891bc24951225231792ab022b4';
const championmaker=baselineNeedsChampionmakerProjection(baselineRef,root);
// 1.14.1 added the credits menu button; older baselines lack it (see dom-snapshot.mjs).
const credits1141=!execFileSync('git',['show',`${baselineRef}:docs/index.html`],{cwd:root,maxBuffer:20*1024*1024}).toString().includes('id="board-credits"');
const menu1163=!execFileSync('git',['show',`${baselineRef}:docs/index.html`],{cwd:root,maxBuffer:20*1024*1024}).toString().includes('id="board-bug-report"');
// UI-DESIGN-TOKENS-02 (1.16.1) moved the team badge and retirement trait tag colors to classes; older baselines use inline styles.
const designTokens02=!execFileSync('git',['show',`${baselineRef}:docs/styles/base.css`],{cwd:root,maxBuffer:20*1024*1024}).toString().includes('.team-badge{');
// Harness self-check only: a DOM-only change on the candidate side (year header text) must FAIL.
const negativeControl=process.argv.includes('--negative-control');
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,'http://localhost'),baseline=url.pathname.startsWith('/baseline/');
    const relative=decodeURIComponent(url.pathname).replace(/^\/(?:baseline\/)?/,'')||'index.html';
    if(relative.includes('..'))throw new Error('Unsafe path');
    let content=relative==='hof-oracle/hall-of-fame-policy.js'?'':baseline?execFileSync('git',['show',`${baselineRef}:docs/${relative}`],{cwd:root,maxBuffer:20*1024*1024}):await readFile(path.join(root,'docs',relative));
    // Frozen old formula, sharing the byte-identical trusted award module
    // instance with the candidate. A second module instance loses WeakMap trust.
    if(relative==='hof-oracle/hall-of-fame-policy.js'){
      const original=execFileSync('git',['show',`${baselineRef}:docs/src/engine/hall-of-fame-policy.js`],{cwd:root,maxBuffer:20*1024*1024}).toString();
      const dependency="'./award-consumer-policy.js'";assert(original.split(dependency).length<=2);
      if(original.includes(dependency))for(const file of ['award-consumer-policy.js','award-identity-policy.js'])assert.equal(sourceText(execFileSync('git',['show',`${baselineRef}:docs/src/engine/${file}`],{cwd:root,maxBuffer:20*1024*1024}).toString()),sourceText(await readFile(path.join(root,'docs/src/engine',file),'utf8')),'historical oracle requires unchanged trusted award dependency '+file);
      content=original.replace(dependency,"'/src/engine/award-consumer-policy.js'");
    }
    if(relative==='src/engine/game.js'){
      content=instrumentRng(content.toString(),'__rngCalls')+GAME_VIEW_HOOK;
      if(!baseline)content+=`\nimport {honorScoreFor as __oldHonor} from '/hof-oracle/hall-of-fame-policy.js';\nwindow.__verifyFranchise=${verifyFranchiseGrant.toString()};window.__projectFranchise=${projectFranchiseField.toString()};\nwindow.__projectHofLog=${projectHofLog.toString()};window.__hofDisplay=()=>Object.fromEntries(['MLB','NPB','KBO','CPBL'].filter(b=>S.stats[b]).map(b=>[b,{current:tierOf(b),old:hallOfFameTier({baseScore:careerScore(S.stats[b]),honor:__oldHonor({bucket:b,honors:S.honors,position:S.pos,intlCount:S.intlCount||0,franchise:S.traits.franchise,awardState:S}),thresholds:TIER_TH[b],leagueName:LG_N[b]}),label:LG_N[b]}]));`;
      if(!baseline)content+='\nwindow.__projectMenu1163='+projectMenu1163.toString()+';window.__expectMenu1163='+menu1163+';window.__expectBrowserSave=true;window.__expectIncomeDisplay=true;window.__expect1140='+championmaker+';window.__expect1141='+credits1141+';window.__expectDesignTokens02='+designTokens02+';window.__projectChampionmaker='+projectChampionmakerState.toString()+';window.__champTeams='+JSON.stringify(JP_DATA.teams.map(({teamId,org})=>({teamId,org})))+';';
      if(negativeControl&&!baseline)content+='\nconst __negativeDivider=divider;divider=function(t){__negativeDivider(t+\' \');};';
    }
    res.setHeader('Content-Type',relative.endsWith('.js')?'text/javascript; charset=utf-8':relative.endsWith('.css')?'text/css; charset=utf-8':relative.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(content);
  }catch(error){res.statusCode=404;res.end(String(error));}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const local=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const errors=[];
function careerAction(balanced){const rows=[...document.querySelectorAll('#act .abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...document.querySelectorAll('#act button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));if(balanced)rows.sort((a,b)=>{const priority=x=>['vel','ctl','brk','con','pow','eye','spd'].includes(x.dataset.abilityKey)?0:1;return priority(a)-priority(b)||parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent);});return buttons.find(e=>e.innerText.trim().startsWith('通常投球'))||rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];}
// Plays one career; returns per-step digests, or the full snapshot at step stopAt.
async function career(variant,{seed,pos,balanced},viewport,stopAt=-1){
  const context=await browser.newContext({viewport}),page=await context.newPage();
  page.on('pageerror',error=>errors.push(`${variant} ${seed}: ${error.message}`));
  page.on('console',message=>{if(message.type()==='error')errors.push(`${variant} ${seed}: ${message.text()}`);});
  try{
    await page.goto(`${local}/${variant==='baseline'?'baseline/':''}?seed=${seed}`);await page.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
    await page.locator(`#seg-pos [data-v="${pos}"]`).click();await page.locator('#in-name').fill('画面回帰');await page.locator('#btn-start').click();
    return await page.evaluate(async({capture,action,balanced,stopAt})=>{
      const snap=new Function('return '+capture)(),choose=new Function('return '+action)(),steps=[];
      for(let step=0;step<2500;step++){
        const s=await snap(step===stopAt);
        if(step===stopAt)return {full:s};
        steps.push(s);if(s.done)return {steps};
        const b=choose(balanced);if(!b)throw Error('No actionable choice at step '+step);b.click();
      }
      throw Error('CAREER_LIMIT');
    },{capture:captureGameView.toString(),action:careerAction.toString(),balanced,stopAt});
  }finally{await context.close();}
}
const cases=[
  {seed:'yakyo-test-001',pos:'P',balanced:false},{seed:'jp3-pitcher-02',pos:'P',balanced:true},
  {seed:'jp3-infielder-01',pos:'IF',balanced:false},{seed:'jp3-outfielder-01',pos:'OF',balanced:true},
];
const viewports=[{width:1280,height:800},{width:390,height:844}];
let failure=null;
try{
  const contractPage=await browser.newPage();
  await contractPage.evaluate(fn=>{
    const project=new Function('return '+fn)();
    const model={NPB:{current:{i:1,name:'NPBスター選手',sc:420,base:0,reason:'MVP受賞による評価',details:{personal:[{text:'2035 NPB年間MVP',sc:420}],team:[],other:[],international:[]}},old:{i:1,name:'NPBスター選手',sc:500},label:'NPB'}};
    const markup='<div class="card info"><h4>NPB 評価の内訳</h4>一軍成績：0点<br>個人賞：420点<br>球団優勝：0点<br>特性の功績：0点<br>国際大会・代表の栄誉：殿堂評価への加点なし<br>2035 NPB年間MVP：420点</div><div class="card gold"><h4>通算評価</h4><span class="tag">NPBスター選手（MVP受賞による評価）</span>（評価点420）</div><p>unchanged</p>';
    const log=document.createElement('div');log.innerHTML=markup;project(log,model);
    if(log.innerHTML!=='<div class="card gold"><h4>通算評価</h4><span class="tag">NPBスター選手</span>（評価点500）</div><p>unchanged</p>')throw Error('HOF_DISPLAY_POSITIVE');
    const mutations=[s=>s.replace('一軍成績：0点','一軍成績：1点'),s=>s.replace('評価点420','評価点421'),s=>s.replace('2035 NPB年間MVP','2036 NPB年間MVP'),s=>s.replace('card info','card gold'),s=>s.replace('<div class="card info">','<div class="card info" data-unknown="x">'),s=>s.replace(/<div class="card info">.*?<\/div>/,''),s=>s+s.match(/<div class="card info">.*?<\/div>/)[0]];
    for(const mutate of mutations){log.innerHTML=mutate(markup);let refused=false;try{project(log,model);}catch{refused=true;}if(!refused)throw Error('HOF_DISPLAY_CORRUPTION_ACCEPTED');}
    log.innerHTML=markup;const bad=structuredClone(model);bad.NPB.current.i=0;let refused=false;try{project(log,bad);}catch{refused=true;}if(!refused)throw Error('HOF_GRADE_CHANGE_NOT_STRICT');
  },projectHofLog.toString());
  await contractPage.close();console.log('PASS HOF display contract and 8 negative controls');
  for(const viewport of viewports)for(const c of cases){
    const label=`${c.seed}/${c.pos}/${c.balanced?'balanced':'first-row'}/${viewport.width}`;
    const [base,head]=[await career('baseline',c,viewport),await career('candidate',c,viewport)];
    const step=base.steps.findIndex((s,i)=>s.digest!==head.steps[i]?.digest);
    if(step>=0||base.steps.length!==head.steps.length){
      const at=step>=0?step:Math.min(base.steps.length,head.steps.length);
      const [b,h]=[await career('baseline',c,viewport,at),await career('candidate',c,viewport,at)];
      const d=findFirstDifference(h.full,b.full);
      // outerHTML strings are long; show the region around the first differing character.
      const near=(x,y)=>{if(typeof x!=='string'||typeof y!=='string')return [x,y].map(v=>JSON.stringify(v)?.slice(0,300));let i=0;while(x[i]===y[i])i++;return [x,y].map(v=>JSON.stringify(v.slice(Math.max(0,i-80),i+160)));};
      assert.fail(`${label} differs from ${baselineRef} at step ${at} (year ${base.steps[at]?.year}) ${d?d.path+': '+near(d.before,d.after).join(' -> '):'(length only)'}`);
    }
    const last=base.steps.at(-1);assert.ok(last.calls>0,'Actual game RNG must be instrumented');
    console.log(`PASS ${label}: ${base.steps.length} steps, RNG ${last.calls}, retirement ${last.year}, verified approved HOF/provenance display; remaining DOM/S/RNG strict`);
  }
  assert.deepEqual(errors,[],'Console or page errors');
  console.log(`GameView DOM E2E passed: ${cases.length*viewports.length} careers vs ${baselineRef}`);
}catch(error){failure=error;console.error(error);}
finally{
  server.closeAllConnections();server.close();server.unref();
  await Promise.race([browser.close(),new Promise(resolve=>setTimeout(resolve,5000))]);
  process.exit(failure?1:0);
}
