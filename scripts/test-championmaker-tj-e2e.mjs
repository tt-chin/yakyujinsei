import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {injectOverlayHook} from '../tests/support/overlay-hook.mjs';
import {JP_DATA} from '../docs/src/data/jp-data.js';
import {VERSION} from '../docs/src/config.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const baseline=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const output=path.resolve(root,arg('output')||'test-results/championmaker-tj-natural');await mkdir(output,{recursive:true});
const hook=`window.__review={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:JSON.parse(JSON.stringify(window.__draws||[]))}),set:v=>Object.assign(S,v)};careerRng.onDraw=v=>(window.__draws??=[]).push({value:v,state:S.rngState});`;
const cache=new Map();
const server=createServer(async(req,res)=>{try{
 const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname),old=pathname.startsWith('/baseline/');
 const rel=pathname.replace(/^\/(?:baseline\/)?/,'')||'index.html';assert(!rel.split('/').includes('..'));
 if(old&&!cache.has(rel))cache.set(rel,execFileSync('git',['show',`${baseline}:docs/${rel}`],{cwd:root,maxBuffer:20e6}));
 let data=old?cache.get(rel):await readFile(path.join(root,'docs',rel));
 if(rel==='src/engine/game.js')data=injectOverlayHook(data.toString(),hook);
 res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css':rel.endsWith('.html')?'text/html; charset=utf-8':'image/png');res.end(data);
 }catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const local=`http://127.0.0.1:${server.address().port}`;
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const browser=await chromium.launch({channel:arg('browser')||'chrome',headless:true});
const results=[],errors=[];
const action=()=>{
 const area=document.querySelector('#act'),rows=[...area.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));
 const buttons=[...area.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
 const b=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText))||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons[0];
 if(!b)throw Error('No career action');return b;
};
async function start(p,url,pos){await p.goto(url);await p.waitForFunction(()=>document.querySelector('#btn-start')?.disabled===false);await p.locator(`#seg-pos [data-v="${pos}"]`).click();await p.locator('#btn-start').click();}
// Independent expected-state oracle: never omit a whole object or unvalidated field.
function compare(old,now){
 const s=now.state,a=old.state;
 assert.equal(s.version,VERSION);s.version=a.version;
 assert.equal(s.birthHighSchool.createdVersion,VERSION);s.birthHighSchool.createdVersion=a.birthHighSchool.createdVersion;
 const rule={NPB1:['NPB','日本一'],MLB:['MLB','ワールドシリーズチャンピオン'],CPBL1:['CPBL','台湾シリーズ優勝'],KBO1:['KBO','韓国シリーズ優勝']};
 const wins=Object.entries(s.championshipResults||{}).filter(([key,r])=>{
  const t=rule[r.level];return t&&r.won===true&&r.eligible===true&&String(r.year)===key&&Number.isInteger(r.year)&&r.year>0&&r.year<=s.year&&r.league===t[0]&&r.title===t[1]&&JP_DATA.teams.some(team=>team.teamId===r.teamId&&team.org===t[0]);
 }).map(([,r])=>({year:r.year,league:r.league,level:r.level,teamId:r.teamId,title:r.title})).sort((x,y)=>x.year-y.year);
 assert.deepEqual(s.championmakerWins,wins);assert.equal(s.championmakerCount,wins.length);
 assert.equal(s.championmakerAcquiredYear,wins.length>=5?wins[4].year:null);
 assert.equal(s.traits.championmaker,wins.length>=5);
 a.championmakerWins=wins;a.championmakerCount=wins.length;a.championmakerAcquiredYear=s.championmakerAcquiredYear;a.traits.championmaker=s.traits.championmaker;
 assert.deepEqual(now,old);
}
try{
 for(const [seed,pos] of [['yakyo-test-001','P'],['jp3-infielder-01','IF']]){
  const runs=[];
  for(const mode of ['baseline','current','replay']){
   const p=await browser.newPage();p.on('pageerror',e=>errors.push(e.message));await start(p,local+(mode==='baseline'?'/baseline/':'/')+'?seed='+seed,pos);
   const records=[];
   for(let step=0;step<2500;step++){
    const record=await p.evaluate(`(()=>{const r=window.__review.get();if(r.state.done)return {...r,done:true};const b=(${action.toString()})();r.action=b.innerText;b.click();return r;})()`);
    records.push(record);if(record.done)break;if(step===2499)throw Error('Career did not finish');
   }
   await writeFile(path.join(output,`${pos}-${mode}.json`),JSON.stringify({baseline,version:mode==='baseline'?records[0].state.version:VERSION,seed,pos,records}));
   runs.push(records);await p.close();
  }
  assert.deepEqual(runs[1],runs[2],pos+' same-version complete replay');assert.equal(runs[0].length,runs[1].length);
  for(let i=0;i<runs[0].length;i++)try{compare(structuredClone(runs[0][i]),structuredClone(runs[1][i]));}catch(e){e.message=`${pos} step ${i}: ${e.message}`;throw e;}
  results.push({seed,pos,steps:runs[0].length,status:'PASS',completeState:true,choices:true,allRngValues:true,replay:true});console.log('PASS natural career '+pos);
 }
 const p=await browser.newPage();await start(p,local+'/?seed=tj-screen','P');
 for(const width of [1280,320,390]){
  await p.setViewportSize({width,height:900});
  await p.evaluate(()=>window.__review.set({tj:12.599999999999998}));await p.locator('[data-main-view="player"]').click();
  await p.locator('[data-player-tab="ability"]').click();
  assert.match(await p.locator('#player-content').innerText(),/12\.6 \/ 50/);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.screenshot({path:path.join(output,`tj-${width}.png`),fullPage:true});results.push({width,status:'PASS',tj:'12.6 / 50'});
 }
 await p.close();assert.deepEqual(errors,[]);
 await writeFile(path.join(output,'summary.json'),JSON.stringify({status:'PASS',baseline,version:VERSION,results,errors},null,2));
}catch(e){process.exitCode=1;await writeFile(path.join(output,'failure.json'),JSON.stringify({status:'FAIL',baseline,message:e.stack,results,errors},null,2));console.error(e);}
finally{server.closeAllConnections();server.close();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(process.exitCode||0);}
