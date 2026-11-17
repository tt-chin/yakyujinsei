// PLY-01 T8 (tasks/PLY_01_JERSEY_PLAN.md §11): jersey numbers in the real browser.
// Natural careers use fixed seeds; cases marked "fixture" set state through the injected hook and then call the real
// movement functions (contract-salary-e2e pattern). /baseline/ serves 5910421 (2.0.0, dev before PLY-01; plan §12 M2) and /legacy/ serves 75ab10b (1.16.13, production main)
// for the second D4 legacy save.
import assert from 'node:assert/strict';import {execFileSync} from 'node:child_process';import {createServer} from 'node:http';import {readFile,mkdir,writeFile} from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {createRequire} from 'node:module';
import {assertSameCareer} from './support/first-difference.mjs';import {withCareerSessionAccess} from './support/career-session-access.mjs';import {injectOverlayHook} from './support/overlay-hook.mjs';import {openBoardAction} from './support/board-menu.mjs';
const root=process.cwd(),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const baseline='59104210efa7704b4749f3da765544ea2e9b705b',legacyBaseline='75ab10b7d442db7aeccde0d649a852f224eed481';
const out=arg('output')||path.join(os.tmpdir(),'yakyujinsei-jersey-e2e-'+Date.now());await mkdir(out,{recursive:true});
const only=arg('only')?.split(',');
const JERSEY=/^背番号 \S+ (で入団する|にする)$/;
// In-page driver (serialized into the hook): balanced first-row strategy of contract-salary-e2e; the number prompt's main button is picked by /入団/ or the explicit check.
async function jerseyPlay(until={}){
  const jersey=/^背番号 \S+ (で入団する|にする)$/,prompts=[];
  const action=()=>{const rows=[...document.querySelectorAll('#act .abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped')),buttons=[...document.querySelectorAll('#act button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));rows.sort((a,b)=>{const p=x=>['vel','ctl','brk','con','pow','eye','spd'].includes(x.dataset.abilityKey)?0:1;return p(a)-p(b)||parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent);});const main=buttons.find(e=>jersey.test(e.innerText.trim()))||(until.stay?buttons.find(e=>e.innerText.trim()==='現在の球団に残留'):null);return main||buttons.find(e=>e.innerText.trim().startsWith('通常投球'))||rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];};
  let lastPrompt=null;
  for(let i=0;i<6000;i++){
    const S=window.__jersey.get().state,texts=[...document.querySelectorAll('#act button')].map(b=>b.innerText.trim()),prompt=texts.some(t=>jersey.test(t));
    if(prompt&&lastPrompt!==i-1)prompts.push({year:S.year,team:S.orgTeamId,stage:S.stage,lv:S.lv,heading:(document.querySelector('#act')?.innerText||'').split('\n')[0],texts});
    if(prompt)lastPrompt=i;
    if(S.done||(until.year!==undefined&&S.year>=until.year)||(until.prompt&&prompt)||(until.b1&&!prompt&&S.stage==='PRO'&&(S.log||[]).some(r=>r.y===S.year&&r.st)&&texts.length))return{prompts,state:S,texts,reason:S.done?'done':'until'};
    const b=action();if(!b)throw Error('NO_ACTION '+S.year+' '+S.stage);b.click();await null;
  }
  throw Error('PLAY_LIMIT');
}
const hook=`
const jerseyClone=x=>JSON.parse(JSON.stringify(x));
window.__draws=[];window.__captures=[];
careerRng.onDraw=v=>{window.__draws.push([v,S.rngState]);};
{const jerseyStartReady=yearFlow.startReadyYear.bind(yearFlow);yearFlow.startReadyYear=function(capture){return jerseyStartReady(state=>{window.__captures.push({year:state.year,draw:window.__draws.length});capture(state);});};}
window.__jersey={
 get:()=>({state:jerseyClone(S),draws:window.__draws.length,captures:jerseyClone(window.__captures)}),
 rng:()=>jerseyClone(window.__draws),
 set:patch=>{Object.assign(S,patch);board(2);},
 fixture:v=>{actClear();S={rngState:0};seedInit(SEED);S=newState('背番号検証',v.pos||'P');const level=v.level||'NPB1',org=LV[level].org,annual=salaryFor(level,0),ability=v.ability??(v.abilityOf?LV[v.abilityOf].min+2:LV[level].min+1);Object.assign(S,{stage:'PRO',org,lv:level,year:2032,age:25,stageYr:0,orgTeamId:listByOrg(org)[0].teamId,role:S.pos==='P'?'SP':null,dpos:S.pos==='P'?null:'SS',lastD:v.rating??0,lastSt:null,honors:[],pool:0,seasonFactor:1,skipMid:false,rehab:0,marketInjury:'HEALTHY',currentSalary:annual,careerBaseSalary:annual,careerEarnings:annual,npbYears:1,faElig:false,svc:0,serviceTime:{NPB:0,MLB:0,KBO:0,CPBL:0},serviceTimeAccruedYear:2032,npbRosterDays:0,npbFaSeasons:0,americanContractSigned:['MLB','MiLB'].includes(org),tradeHeat:v.tradeHeat??0});Object.keys(S.ab).forEach(k=>S.ab[k]=ability);S.ct=createContract({contractId:'JERSEY-'+v.id,org,teamId:S.orgTeamId,signedYear:2030,startYear:2031,years:v.years??(v.status==='EXPIRED'?2:3),annualSalary:annual,contractType:'NORMAL',contractMultiplier:1});S.ct=markSalaryPaid(S.ct,2031).contract;if(v.status==='EXPIRED'){S.ct=markSalaryPaid(S.ct,2032).contract;S.careerBaseSalary+=annual;S.careerEarnings+=annual;S.lastSalaryPaidYear=2032;}if(v.jersey)S.jerseyHistory=v.jersey.map(r=>({teamId:r.teamId??S.orgTeamId,year:r.year,number:r.number}));if(v.log)S.log=v.log;__cs.pendingOffseasonSalary=null;__cs.npbReturnOfferContext=null;__cs.seasonEndContext=null;board(2);return S.orgTeamId;},
 end:()=>phaseEnd(),move:()=>movement(),demote:()=>handleDemotion(ovr(),PATHS[S.org],PATHS[S.org].indexOf(S.lv)),next:()=>advance(),release:o=>outOfOrg(o),retire:reason=>endGame(reason),
 teams:()=>listByOrg(S.org).map(t=>({id:t.teamId,name:t.name})),teamName:id=>teamRec(id)?.name
};
window.__jerseyPlay=${jerseyPlay.toString()};
`;
const instrument=source=>injectOverlayHook(withCareerSessionAccess(source),hook);
const cache=new Map();
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname),prefix=pathname.match(/^\/(baseline|legacy)\//)?.[1],ref=prefix==='legacy'?legacyBaseline:prefix?baseline:null,rel=pathname.replace(/^\/(?:baseline\/|legacy\/)?/,'')||'index.html';if(rel.includes('..'))throw Error('path');let body;if(ref){const key=ref+':'+rel;if(!cache.has(key))cache.set(key,execFileSync('git',['show',key.replace(':',':docs/')],{cwd:root,maxBuffer:30e6}));body=cache.get(key);}else body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript':rel.endsWith('.css')?'text/css':rel.endsWith('.webp')?'image/webp':rel.endsWith('.json')?'application/json':'text/html');res.end(body);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
const browserName=arg('browser')||process.env.TEST_BROWSER||'chrome';
const {chromium}=createRequire(import.meta.url)(arg('playwright')||process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({channel:browserName==='chromium'?undefined:browserName,headless:true});
const records=[];
async function test(id,steps){if(only&&!only.some(x=>id.startsWith(x)))return;const entry={id,status:'PASS'},began=Date.now();try{await steps(entry);}catch(e){entry.status='FAIL';entry.error=e.stack;entry.act=await entry.page?.evaluate(()=>({act:document.querySelector('#act')?.innerHTML.slice(0,4000),log:[...document.querySelectorAll('#log .card')].slice(-4).map(c=>c.innerText.slice(0,400)),state:(({year,stage,lv,org,orgTeamId,jerseyHistory,done})=>({year,stage,lv,org,orgTeamId,jerseyHistory,done}))(window.__jersey.get().state)})).catch(err=>String(err));}delete entry.page;entry.seconds=(Date.now()-began)/1000;records.push(entry);await writeFile(path.join(out,id+'.json'),JSON.stringify(entry,null,2));console.log(entry.status+' '+id+' '+entry.seconds.toFixed(1)+'s'+(entry.error?' '+entry.error.split('\n')[0]:''));}
// One page per case; Console errors and page errors must stay 0.
async function open(entry,{width=1280,height=720,context}={}){
  const ctx=context||await browser.newContext({viewport:{width,height}}),page=await ctx.newPage();entry.page=page;ctx.setDefaultTimeout(30000);
  entry.errors=[];page.on('pageerror',e=>entry.errors.push('pageerror '+e.message));page.on('console',m=>{if(m.type()==='error')entry.errors.push('console '+m.text());});page.on('dialog',async d=>{entry.errors.push('native '+d.type());await d.dismiss();});
  await page.route('https://fonts.googleapis.com/**',r=>r.fulfill({body:'',contentType:'text/css'}));
  return {page,ctx,close:async()=>{assert.deepEqual(entry.errors,[],'Console/page errors');if(!context)await ctx.close();else await page.close();}};
}
const ready=p=>p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);
const saved=(p,year)=>p.waitForFunction(y=>document.querySelector('#save-live').textContent.includes((y?y+'年の':'')+'開始時点をセーブしました'),year);
async function start(page,{seed,pos,prefix='/'}){await page.goto(base+prefix+'?seed='+seed);await ready(page);await page.locator(`#seg-pos [data-v="${pos}"]`).click();await page.locator('#in-name').fill('背番号検証');await page.locator('#btn-start').click();await page.waitForFunction(()=>window.__jersey&&!window.__jersey.get().state.done&&document.querySelector('#act button,#act .abrow'));}
async function resume(page,year){await page.reload();await ready(page);await page.locator('#save-continue').click();await page.waitForFunction(y=>document.querySelector('#save-live').textContent.includes(y+'年の最初から再開しました'),year);}
const get=p=>p.evaluate(()=>window.__jersey.get());
const play=(p,until)=>p.evaluate(u=>window.__jerseyPlay(u),until);
const actTexts=p=>p.locator('#act button').evaluateAll(bs=>bs.map(b=>b.innerText.trim()));
const board=p=>p.evaluate(()=>({number:document.querySelector('#bd-number').hidden?null:document.querySelector('#bd-number').textContent,menuDisabled:document.querySelector('#board-number').disabled,name:document.querySelector('#bd-name').textContent,team:document.querySelector('#bd-team').textContent,year:document.querySelector('#bd-year').textContent}));
// Menu change through the real header menu and dialog.
async function menuDialog(page){await openBoardAction(page,'board-number');const d=page.locator('#jersey-dialog');await d.waitFor({state:'visible'});return d;}
async function dialogText(page){return page.evaluate(()=>({title:document.querySelector('#jersey-title').textContent,summary:document.querySelector('#jersey-summary').textContent,label:document.querySelector('label.jersey-field').textContent,note:document.querySelector('#jersey-note').textContent,selected:document.querySelector('#jersey-select').value,ok:document.querySelector('#jersey-ok').textContent}));}
async function pick(page,number){await page.locator('#jersey-select').selectOption(number);await page.locator('#jersey-ok').click();await page.locator('#jersey-dialog').waitFor({state:'hidden'});}
async function yearly(page){await page.locator('[data-main-view="career"]').click();await page.locator('[data-career-tab="yearly"]').click();const text=await page.locator('#career-content').innerText();await page.locator('[data-main-view="home"]').click();return text;}
const retirementRows=p=>p.locator('.jersey-table tr').evaluateAll(rows=>rows.map(r=>[...r.cells].map(c=>c.textContent)));
const normalized=s=>{const c=structuredClone(s);delete c.version;delete c.jerseyHistory;if(c.birthHighSchool)delete c.birthHighSchool.createdVersion;return c;};
const DEFAULTS={P:'18',C:'27',IF:'6',OF:'1'};

try{
// 1. First entry per position: once, current year, first button is the default (W3), no draw between the year-start save and the answer.
for(const [pos,width]of [['P',1280],['C',390],['IF',1280],['OF',390]])await test('entry-'+pos+'-'+width,async e=>{
  const {page,close}=await open(e,{width,height:844});await start(page,{seed:'probe33-1',pos});
  const at=await play(page,{prompt:true}),s=at.state,b=await board(page),number=DEFAULTS[pos];
  assert.equal(at.prompts.length,1);assert.equal(s.stage,'PRO');assert.deepEqual(at.texts,[`背番号 ${number} で入団する`,'背番号を選ぶ']);assert.match(at.prompts[0].heading,/と契約しました。背番号はどうする？$/);
  assert.equal(b.number,null,'J1: no number before the record');assert.equal(b.menuDisabled,true);assert.equal(b.year,String(s.year));
  const before=await get(page);assert.equal(before.captures.at(-1).year,s.year);assert.equal(before.draws,before.captures.at(-1).draw,'no RNG draw between the year-start save and the prompt');
  await page.locator('#act button').first().click();const after=await get(page);assert.deepEqual(after.state.jerseyHistory,[{teamId:s.orgTeamId,year:s.year,number}]);
  assert.deepEqual(await board(page).then(x=>[x.number,x.menuDisabled]),['#'+number,false]);
  const rest=await play(page,{year:s.year+1});assert.equal(rest.prompts.filter(p=>p.year===s.year).length,0,'the prompt appears once per entry');
  assert.ok(await page.locator('#log .tag',{hasText:' · #'+number}).count()>=1,'season card carries the number');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');await page.screenshot({path:path.join(out,`entry-${pos}-${width}.png`)});
  // Whole career: a prompt only when the professional team differs from the last record (J3), proposing the last number (D2).
  const career=await play(page,{});const done=career.state;assert.ok(done.done);
  for(const p of career.prompts){assert.equal(p.stage,'PRO');}
  const teams=done.jerseyHistory.map(r=>r.teamId);for(let i=1;i<teams.length;i++)assert.notEqual(teams[i],teams[i-1],'J3: same team never asks twice in a row');
  assert.ok(done.jerseyHistory.every(r=>r.number===number),'D2: transfers keep the number by default');
  const end=await board(page);assert.equal(end.number,null,'A1: no number after retirement');assert.equal(end.menuDisabled,true,'A1: no change after retirement');
  const rows=await retirementRows(page);assert.ok(rows.length>=1&&rows.every(r=>r[2]==='#'+number));
  const ylog=await yearly(page);assert.ok(ylog.includes(' #'+number));assert.ok(!ylog.includes('背番号不明'));
  e.history=done.jerseyHistory;e.retirement=rows;await page.locator('.jersey-table').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`retired-${pos}-${width}.png`),fullPage:false});await close();
});

// 2. "背番号を選ぶ": cancel returns to the two-button prompt (A4 focus), 0 and 00 stay distinct, the dialog answer goes through the main button (A3).
await test('entry-dialog',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'probe33-1',pos:'P'});const at=await play(page,{prompt:true}),year=at.state.year,draws=(await get(page)).draws;
  await page.locator('#act button',{hasText:'背番号を選ぶ'}).click();await page.locator('#jersey-dialog').waitFor({state:'visible'});
  const t=await dialogText(page);assert.equal(t.title,'背番号を選ぶ');assert.equal(t.label,'背番号');assert.equal(t.selected,'18');assert.equal(t.note,`${year}年シーズンから有効。過去の年度の背番号は変わりません。能力・成績・年俸には影響しません。`);assert.equal(t.ok,'この背番号にする');
  const values=await page.locator('#jersey-select option').evaluateAll(o=>o.map(x=>x.value));assert.equal(values.length,101);assert.deepEqual(values.slice(0,3),['0','00','1']);
  assert.ok(await page.evaluate(()=>{const r=document.querySelector('#jersey-dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth;}),'dialog fits');await page.screenshot({path:path.join(out,'entry-dialog-1280.png')});
  await page.locator('#jersey-cancel').click();await page.locator('#jersey-dialog').waitFor({state:'hidden'});
  assert.deepEqual(await actTexts(page),['背番号 18 で入団する','背番号を選ぶ']);assert.equal(await page.evaluate(()=>document.activeElement===document.querySelector('#act button')),true,'A4: focus on the first button');
  assert.equal((await get(page)).state.jerseyHistory?.length||0,0);
  await page.locator('#act button',{hasText:'背番号を選ぶ'}).click();await page.keyboard.press('Escape');await page.locator('#jersey-dialog').waitFor({state:'hidden'});assert.deepEqual(await actTexts(page),['背番号 18 で入団する','背番号を選ぶ']);
  await page.locator('#act button',{hasText:'背番号を選ぶ'}).click();await pick(page,'00');
  const after=await get(page);assert.deepEqual(after.state.jerseyHistory,[{teamId:at.state.orgTeamId,year,number:'00'}],'00 is not 0');assert.equal(after.draws,draws,'the dialog path draws no RNG');
  assert.ok(!(await actTexts(page)).some(x=>JERSEY.test(x)),'A3: the main button confirmed and the flow moved on');assert.equal((await board(page)).number,'#00');
  await close();
});

// 3. Menu change: same-year changes all kept, past rows untouched; B1 after this year's season row the change is for next year.
await test('menu-change',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'probe33-6',pos:'P'});const at=await play(page,{prompt:true}),year=at.state.year,team=at.state.orgTeamId;
  await page.locator('#act button').first().click();const draws=(await get(page)).draws;
  let d=await menuDialog(page),t=await dialogText(page);assert.equal(t.title,'背番号の変更');assert.equal(t.label,'新しい背番号');assert.ok(t.summary.endsWith('現在の背番号 #18'));assert.ok(t.note.startsWith(year+'年シーズンから有効。'));assert.equal(t.ok,'変更する');
  await page.screenshot({path:path.join(out,'menu-dialog-1280.png')});await pick(page,'7');
  // 2.0.0 menu dialog: the item click closes the menu first (focus to ☰), so the number dialog returns focus to ☰ on OK and on cancel.
  const focusId=()=>page.evaluate(()=>document.activeElement?.id);assert.equal(await focusId(),'board-menu-toggle','focus returns to the menu toggle after 変更する');
  await menuDialog(page);await page.keyboard.press('Escape');await page.locator('#jersey-dialog').waitFor({state:'hidden'});assert.equal(await focusId(),'board-menu-toggle','focus returns to the menu toggle after cancel');
  await menuDialog(page);await pick(page,'9');
  // Duplicate activation of #jersey-ok adds one row only.
  await menuDialog(page);await page.locator('#jersey-select').selectOption('0');await page.locator('#jersey-ok').evaluate(b=>{b.click();b.click();});await page.locator('#jersey-dialog').waitFor({state:'hidden'});
  let s=(await get(page));assert.deepEqual(s.state.jerseyHistory.map(r=>[r.teamId,r.year,r.number]),[[team,year,'18'],[team,year,'7'],[team,year,'9'],[team,year,'0']]);assert.equal(s.draws,draws,'menu changes draw no RNG');
  assert.equal((await board(page)).number,'#0');
  const b1=await play(page,{b1:true});assert.equal(b1.state.year,year,'B1 wait point is in the entry year');
  await menuDialog(page);t=await dialogText(page);assert.ok(t.note.startsWith((year+1)+'年シーズンから有効。'),'B1 note names next year');await pick(page,'11');
  s=await get(page);assert.deepEqual(s.state.jerseyHistory.at(-1),{teamId:team,year:year+1,number:'11'});
  const ylog=await yearly(page);assert.ok(ylog.split('\n').some(l=>l.includes(String(year))&&l.includes('#0')),'the entry year keeps its last same-year number');
  const next=await play(page,{prompt:true});assert.notEqual(next.state.orgTeamId,team,'probe33-6 transfers in the next year');assert.equal(next.state.year,year+1);assert.equal(next.texts[0],'背番号 11 で入団する','D2: a transfer proposes the last number');
  await close();
});

// 4. J2(1): the entry is not saved before the next year-start save; resume asks again. A2: the board is drawn before the prompt.
await test('resume-entry-unsaved',async e=>{
  const {page,close}=await open(e,{width:390,height:844});await start(page,{seed:'probe33-1',pos:'P'});const at=await play(page,{prompt:true}),year=at.state.year;
  await saved(page,year);await resume(page,year);const back=await play(page,{prompt:true});assert.equal(back.state.year,year);assert.equal(back.prompts.length,1);assert.equal(back.state.jerseyHistory?.length||0,0);
  const b=await board(page);assert.equal(b.year,String(year),'A2 board year');assert.ok(b.name.trim()&&b.team.trim(),'A2 board drawn');assert.equal(b.number,null);
  // J2(2): a mid-year change before the next save is not kept; after the next year-start save it is.
  await page.locator('#act button').first().click();await menuDialog(page);await pick(page,'7');await resume(page,year);
  const again=await play(page,{prompt:true});assert.equal(again.state.jerseyHistory?.length||0,0,'mid-year change not saved');await page.locator('#act button').first().click();
  await menuDialog(page);await pick(page,'7');await play(page,{year:year+1});await saved(page,year+1);await resume(page,year+1);
  const kept=await get(page);assert.deepEqual(kept.state.jerseyHistory.map(r=>r.number),['18','7']);assert.equal((await board(page)).number,'#7');
  await close();
});

// Risk 4 (2.0.0 replaceCareer): starting a new career over a save that holds jerseyHistory confirms the overwrite, and the new
// career carries no number history (board number hidden, menu item disabled).
await test('new-career-over-save',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'probe33-1',pos:'P'});const at=await play(page,{prompt:true}),year=at.state.year;
  await page.locator('#act button').first().click();await play(page,{year:year+1});await saved(page,year+1);
  assert.deepEqual((await get(page)).state.jerseyHistory.map(r=>r.number),['18'],'the save holds the number history');
  await page.goto(base+'/?seed=probe33-1');await ready(page);
  if(await page.locator('#save-new').isVisible())await page.locator('#save-new').click();
  await page.locator('#seg-pos [data-v="P"]').click();await page.locator('#in-name').fill('背番号検証');await page.locator('#btn-start').click();
  await page.locator('#confirmation-dialog').waitFor({state:'visible'});assert.match(await page.locator('#confirmation-message').innerText(),/上書きされます/);await page.locator('#confirmation-ok').click();
  await page.waitForFunction(()=>{const st=window.__jersey?.get().state;return !!st&&!st.done&&st.year===2026&&!!document.querySelector('#act button,#act .abrow');}); /* S is null while the career is replaced */
  const fresh=await get(page),b=await board(page);assert.equal(fresh.state.jerseyHistory,undefined,'no number history in the new career');assert.equal(b.number,null);assert.equal(b.menuDisabled,true);
  await close();
});

// 5. No RNG: current vs /baseline/ (same seed, full draw list + state), and default vs dialog/menu variant.
await test('rng-identity',async e=>{
  const run=async(seed,pos,prefix,variant)=>{const {page,close}=await open(e);await start(page,{seed,pos,prefix});let b1=null;
    if(variant){const at=await play(page,{prompt:true});await page.locator('#act button',{hasText:'背番号を選ぶ'}).click();await pick(page,'00');await menuDialog(page);await pick(page,'7');b1=(await play(page,{b1:true,year:2031})).state;assert.equal(b1.year,at.state.year,'B1 point in the entry year');await menuDialog(page);await pick(page,'9');}
    const end=await play(page,{year:2031}),rng=await page.evaluate(()=>window.__jersey.rng()),captures=(await get(page)).captures;await close();return {state:end.state,rng,texts:end.texts,captures};};
  // Same-seed draw values are always a prefix of one stream, so the list above only pins the total count at the stop point;
  // the draw count at every year-start save pins where an extra or missing draw happens.
  const sameCaptures=(x,y,message)=>{assert.ok(x.captures.length>=3&&y.captures.length>=3,message+' (captures recorded)');assert.deepEqual(x.captures,y.captures,message);};
  for(const [seed,pos]of [['probe33-1','P'],['probe33-8','C']]){const old=await run(seed,pos,'/baseline/'),now=await run(seed,pos,'/');
    assert.equal(old.state.year,2031);assert.equal(now.state.jerseyHistory.length,1);assert.ok(old.rng.length>100);
    assert.deepEqual(now.rng,old.rng,seed+': current R values/rngState equal the 2.0.0 baseline');sameCaptures(now,old,seed+': draw count at every year-start save equals the 1.16.13 baseline');assertSameCareer(normalized(now.state),normalized(old.state),seed+': state equal to baseline except version/jerseyHistory');assert.deepEqual(now.texts,old.texts);}
  const now=await run('probe33-8','C','/'),variant=await run('probe33-8','C','/',true);assert.equal(variant.state.jerseyHistory.length,3);assert.equal(variant.state.jerseyHistory.at(-1).year,2030,'B1 change is for next year');
  const firstDiff=(x,y)=>{for(let i=0;i<Math.max(x.length,y.length);i++)if(JSON.stringify(x[i])!==JSON.stringify(y[i]))return i;return -1;};e.compare={now:now.rng.length,variant:variant.rng.length,variantFirstDiff:firstDiff(variant.rng,now.rng),variantYear:variant.state.year,nowYear:now.state.year,variantTexts:variant.texts,nowTexts:now.texts,variantJersey:variant.state.jerseyHistory,variantLog:variant.state.log.map(r=>[r.y,r.tm]),nowLog:now.state.log.map(r=>[r.y,r.tm])};assert.deepEqual(variant.rng,now.rng,'dialog and menu changes draw no RNG');sameCaptures(variant,now,'dialog and menu changes: same draw count at every year-start save');assertSameCareer(normalized(variant.state),normalized(now.state),'jersey changes touch no other state');
  e.draws=now.rng.length;
});

// 6. Duplicate activation of the entry main button: one record, one step.
await test('entry-double-click',async e=>{
  const once=async double=>{const {page,close}=await open(e);await start(page,{seed:'probe33-1',pos:'C'});await play(page,{prompt:true});await page.locator('#act button').first().evaluate((b,d)=>{b.click();if(d)b.click();},double);await page.waitForTimeout(50);const s=await get(page),texts=await actTexts(page);await close();return {s,texts};};
  const single=await once(false),double=await once(true);assert.equal(double.s.state.jerseyHistory.length,1);assertSameCareer(double.s.state,single.s.state,'double click equals single click');assert.equal(double.s.draws,single.s.draws);assert.deepEqual(double.texts,single.texts);
});

// 7. B6: a tampered save is rejected with SAVE_JERSEY, one field at a time; the untampered row reads.
await test('save-tamper',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'probe33-1',pos:'P'});const at=await play(page,{prompt:true});await page.locator('#act button').first().click();await play(page,{year:at.state.year+1});await saved(page,at.state.year+1);
  const results=await page.evaluate(async()=>{
    const {BrowserSaveStore}=await import('/src/engine/browser-save-store.js'),{JP_DATA}=await import('/src/data/jp-data.js');
    const db=await new Promise((ok,ng)=>{const r=indexedDB.open('yakyujinsei-career',1);r.onsuccess=()=>ok(r.result);r.onerror=()=>ng(r.error);});
    const io=(mode,fn)=>new Promise((ok,ng)=>{const tx=db.transaction('career',mode),st=tx.objectStore('career'),req=fn(st);let v;req.onsuccess=()=>{v=req.result;};tx.oncomplete=()=>ok(v);tx.onabort=tx.onerror=()=>ng(tx.error);});
    const raw=await io('readonly',s=>s.get('autosave')),list=raw.save.state.jerseyHistory,year=raw.save.state.year,ind=JP_DATA.teams.find(t=>t.org==='IND').teamId;
    const read=async()=>{try{await new BrowserSaveStore().read();return 'OK';}catch(err){return err.code||err.message;}};
    const out={control:await read(),records:list.length};
    const cases={unknownTeam:r=>({...r,teamId:'NO_SUCH_TEAM'}),indTeam:r=>({...r,teamId:ind}),badNumber:r=>({...r,number:'100'}),numericNumber:r=>({...r,number:Number(r.number)}),futureYear:r=>({...r,year:year+1}),extraField:r=>({...r,note:'x'})};
    for(const [k,f]of Object.entries(cases)){const row=structuredClone(raw);row.save.state.jerseyHistory=[...list.slice(0,-1),f(list.at(-1))];await io('readwrite',s=>s.put(row,'autosave'));out[k]=await read();}
    await io('readwrite',s=>s.put(raw,'autosave'));out.restored=await read();db.close();return out;});
  assert.equal(results.control,'OK');assert.equal(results.restored,'OK');assert.ok(results.records>=1);
  for(const k of ['unknownTeam','indTeam','badNumber','numericNumber','futureYear','extraField'])assert.equal(results[k],'SAVE_JERSEY',k);
  e.results=results;await close();
});

// 8. D4: a 2.0.0 and a 1.16.13 save with one finished pro season asks once with the legacy copy (A2 board), the next save keeps it; B7 unknown period names.
for(const [id,prefix,label] of [['legacy-save','/baseline/','2.0.0'],['legacy-save-11613','/legacy/','1.16.13']])await test(id,async e=>{
  const ctx=await browser.newContext({viewport:{width:1280,height:720}});
  const old=await open(e,{context:ctx});await start(old.page,{seed:'probe33-1',pos:'P',prefix});const first=await play(old.page,{year:2030});await saved(old.page,2030);
  assert.ok(first.state.log.some(r=>r.st&&/ NPB/.test(r.tm)),label+' baseline log has a level-suffixed pro row');assert.equal(first.state.jerseyHistory,undefined);await old.close();
  const {page,close}=await open(e,{context:ctx});await page.goto(base+'/');await ready(page);await page.locator('#save-continue').click();await page.waitForFunction(()=>document.querySelector('#save-live').textContent.includes('2030年の最初から再開しました'));
  const at=await play(page,{prompt:true}),team=at.state.orgTeamId;assert.equal(at.state.year,2030);assert.deepEqual(at.texts,['背番号 18 にする','背番号を選ぶ']);assert.match(at.prompts[0].heading,/での背番号が記録されていません。背番号はどうする？$/);
  const b=await board(page);assert.equal(b.year,'2030','A2 board year');assert.ok(b.name.trim()&&b.team.trim());assert.equal(b.number,null);await page.screenshot({path:path.join(out,id+'-prompt-1280.png')});
  await page.locator('#act button').first().click();const rest=await play(page,{year:2031});assert.equal(rest.prompts.length,0);await saved(page,2031);await resume(page,2031);
  const kept=await play(page,{year:2031});assert.equal(kept.prompts.length,0,'no second legacy prompt after the next save');assert.deepEqual(kept.state.jerseyHistory,[{teamId:team,year:2030,number:'18'}]);
  const ylog=await yearly(page);assert.ok(ylog.split('\n').some(l=>l.includes('2029')&&l.includes('（背番号不明）')));
  const done=await play(page,{});const rows=await retirementRows(page);assert.ok(done.state.done);
  assert.deepEqual(rows[0].slice(1),['2029','不明']);assert.ok(!/NPB|→/.test(rows[0][0]),'B7: unknown period named without level suffix');assert.equal(rows[1][2],'#18');assert.ok(rows[1][1].startsWith('2030'));
  e.retirement=rows;await page.locator('.jersey-table').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,id+'-retired-1280.png')});await close();await ctx.close();
});

// 9. Fixture: the real trade (doTradeExec) runs after this year's season row, so that row is team A with A's number and the year
// belongs to the A period; next year asks at B with A's number.
// DEAD PATH (user decision 2026-11-16, option B): no code sets S.tradeFrom (trades are post-season by design since the first
// commit), so the A→B row and the split season card never occur. The deadpath-* cases call no movement function: they set
// tradeFrom/orgTeamId directly to pin D3/J1 and B7 for the label in case a mid-season trade is introduced later.
await test('fixture-trade',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});
  const from=await page.evaluate(()=>window.__jersey.fixture({id:'trade',years:5,level:'NPB1',ability:80,tradeHeat:1000,jersey:[{year:2031,number:'18'}]})),fromName=await page.evaluate(id=>window.__jersey.teamName(id),from);
  await page.evaluate(()=>window.__jersey.next());const run=await play(page,{prompt:true,stay:true,year:2035});const s=run.state;
  assert.deepEqual(s.lastTrade&&[s.lastTrade.year,s.lastTrade.fromTeamId],[2033,from],'fixture trade happened');assert.equal(s.year,2034);assert.equal(s.orgTeamId,s.lastTrade.toTeamId,'the prompt is for the trade destination');assert.deepEqual(run.texts,['背番号 18 で入団する','背番号を選ぶ']);
  const row=s.log.find(r=>r.y===2033);assert.equal(row.tm.split(' ')[0],fromName,'the trade-year row is team A');
  await page.evaluate(()=>window.__jersey.set({tradeHeat:0}));await page.locator('#act button').first().click();
  const ylog=await yearly(page);assert.ok(ylog.split('\n').some(l=>l.includes('2033')&&l.includes('#18')),'trade-year row shows A number');
  await page.evaluate(()=>window.__jersey.retire('検証'));const rows=await retirementRows(page);assert.deepEqual(rows,[[fromName,'2033','#18']],'trade year belongs to the A period');
  e.rows=rows;await close();
});
async function tradeLabel(page,jersey){
  const from=await page.evaluate(j=>window.__jersey.fixture({id:'trade-label',years:5,level:'NPB1',ability:60,jersey:j}),jersey),teams=await page.evaluate(()=>window.__jersey.teams()),to=teams.find(t=>t.id!==from),fromName=teams.find(t=>t.id===from).name;
  await page.evaluate(([a,b])=>window.__jersey.set({tradeFrom:a,orgTeamId:b}),[fromName,to.id]);await page.evaluate(()=>window.__jersey.next());return {from,fromName,to};
}
await test('deadpath-trade-label',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});const t=await tradeLabel(page,[{year:2031,number:'18'}]);
  const first=await play(page,{year:2033});assert.equal(first.prompts.length,1,'B has no record: asks at the year start');await page.locator('#act button',{hasText:'背番号を選ぶ'}).click();await pick(page,'7');
  // Undo the B record so the A→B row is judged by A's record only (D3: the row year's last record).
  await page.evaluate(()=>{const S=window.__jersey.get().state;window.__jersey.set({jerseyHistory:S.jerseyHistory.slice(0,1)});});
  const after=await play(page,{b1:true,stay:true});const row=after.state.log.find(r=>r.y===2033);assert.ok(row.tm.startsWith(t.fromName+'→'),'fixture A→B row');
  const ylog=await yearly(page);assert.ok(ylog.split('\n').some(l=>l.includes('2033')&&l.includes('→')&&l.includes('#18')),'A→B row shows A number');
  await page.evaluate(()=>window.__jersey.retire('検証'));const rows=await retirementRows(page);assert.deepEqual(rows,[[t.fromName,'2033','#18']],'A→B year belongs to the A period');e.rows=rows;await close();
});
await test('deadpath-trade-unknown',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});const t=await tradeLabel(page,undefined);
  await play(page,{year:2033});await page.locator('#act button').first().click();const after=await play(page,{b1:true,stay:true});assert.ok(after.state.log.find(r=>r.y===2033).tm.includes('→'));
  await page.evaluate(()=>{window.__jersey.set({jerseyHistory:[]});window.__jersey.retire('検証');});const rows=await retirementRows(page);
  assert.deepEqual(rows,[[t.to.name,'2033','不明']],'B7: unknown period named by the team after the trade prefix, without level suffix');e.rows=rows;await close();
});

// 10. Fixture: MiLB→MLB promotion within the organization does not ask again.
await test('fixture-milb-promotion',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});
  const team=await page.evaluate(()=>window.__jersey.fixture({id:'milb',level:'A3',ability:95,rating:6,jersey:[{year:2031,number:'18'}]}));
  await page.evaluate(()=>window.__jersey.end());const at=await play(page,{year:2033}),s=at.state;
  assert.equal(s.lv,'MLB','fixture promotion happened');assert.equal(s.orgTeamId,team);assert.equal(at.prompts.length,0,'no prompt after MiLB→MLB');
  const later=await play(page,{b1:true});assert.equal(later.state.year,2033);assert.equal(later.prompts.length,0);assert.deepEqual(later.state.jerseyHistory.map(r=>r.number),['18']);assert.equal((await board(page)).number,'#18');await close();
});

await test('fixture-mlb-demotion',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});
  const team=await page.evaluate(()=>window.__jersey.fixture({id:'mlb-demotion',level:'MLB',abilityOf:'A3',jersey:[{year:2031,number:'18'}]}));await page.evaluate(()=>window.__jersey.demote());
  const accept=page.locator('#act button',{hasText:'への降格を受け入れ'});assert.equal(await accept.count(),1,'in-organization demotion offered');await accept.click();
  const at=await play(page,{year:2033});assert.notEqual(at.state.lv,'MLB','fixture demotion happened');assert.equal(at.state.orgTeamId,team);assert.equal(at.prompts.length,0,'no prompt after MLB→MiLB');assert.equal((await board(page)).number,'#18');await close();
});

// 11. Fixture: release to IND — no prompt, no number, menu disabled (J1/W6); stay with the same club (J3) does not ask.
for(const [stage,label]of [['IND','独立リーグ・'],['CORP','社会人野球・']])await test('fixture-'+stage.toLowerCase(),async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});
  await page.evaluate(()=>window.__jersey.fixture({id:'amateur',level:'NPB1',ability:33,jersey:[{year:2031,number:'18'}]}));await page.evaluate(()=>window.__jersey.release(33));
  await page.locator('#act button',{hasText:label}).first().click();const s=await play(page,{year:2033});
  assert.equal(s.state.stage,stage);assert.equal(s.state.year,2033);assert.equal(s.prompts.length,0);assert.equal((await get(page)).captures.at(-1)?.year,2033,'a year start happened');
  const b=await board(page);assert.equal(b.number,null);assert.equal(b.menuDisabled,true);await close();
});
await test('fixture-stay',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});
  await page.evaluate(()=>window.__jersey.fixture({id:'stay',level:'NPB1',ability:60,status:'EXPIRED',rating:3,jersey:[{year:2031,number:'18'}]}));await page.evaluate(()=>window.__jersey.move());
  const stay=page.locator('#act button',{hasText:'現在の球団に残留'});assert.equal(await stay.count(),1,'renewal offers a stay');await stay.click();const s=await play(page,{year:2033});
  assert.equal(s.state.year,2033);assert.equal(s.prompts.length,0,'J3 stay');assert.deepEqual(s.state.jerseyHistory.length,1);await close();
});
// 12. Fixture B2: no record after IND is an ordinary entry; no record after a pro season is the D4 copy; a record for the same team after IND does not ask (J3).
await test('fixture-b2',async e=>{
  const {page,close}=await open(e);await start(page,{seed:'jersey-fixture',pos:'P'});
  const prompt=async v=>{await page.evaluate(v=>window.__jersey.fixture(v),v);await page.evaluate(()=>window.__jersey.next());return play(page,{year:2033});};
  const ind=await prompt({id:'b2-ind',years:5,level:'NPB1',ability:60,log:[{y:2032,age:24,tm:'独立リーグ',line:''}]});assert.match(ind.prompts[0]?.heading||'',/と契約しました。/,'after IND: ordinary entry');
  const legacy=await prompt({id:'b2-pro',years:5,level:'NPB1',ability:60,log:[{y:2032,age:24,tm:'X',line:'',st:{G:1}}]});assert.match(legacy.prompts[0]?.heading||'',/での背番号が記録されていません。/,'after pro: D4 copy');
  const back=await prompt({id:'b2-back',years:5,level:'NPB1',ability:60,jersey:[{year:2030,number:'18'}],log:[{y:2032,age:24,tm:'独立リーグ',line:''}]});assert.equal(back.prompts.length,0,'J3 back to the same team');
  await close();
});
}catch(error){records.push({id:'harness',status:'FAIL',error:error.stack});console.error(error.stack);}
finally{
  const fail=records.filter(r=>r.status!=='PASS').length;await writeFile(path.join(out,'summary.json'),JSON.stringify({baseline,records:records.map(({id,status,seconds,error})=>({id,status,seconds,error})),fail},null,2));
  console.log(`jersey-e2e: ${records.length-fail}/${records.length} PASS (output ${out})`);
  await browser.close().catch(()=>{});server.closeAllConnections();server.close();process.exit(fail||!records.length?1:0);
}
