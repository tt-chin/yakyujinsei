// Real complete careers through the production browser engine. No forced state/outcomes.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {VERSION} from '../docs/src/config.js';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
const hook=`
window.__hofSeasons=[];window.__hofActions=[];
const observeLevelStat=accLevelStat;accLevelStat=function(lv,st){window.__hofSeasons.push({year:S.year,age:S.age,lv,role:S.role,pos:S.pos,seasonFactor:S.seasonFactor,rehab:S.rehab,st:JSON.parse(JSON.stringify(st))});return observeLevelStat(lv,st);};
const observeEnd=endGame;endGame=function(reason){window.__hofBefore=JSON.parse(JSON.stringify(S));const result=observeEnd(reason);window.__hofReason=reason;return result;};
window.__hofAudit={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0,seasons:window.__hofSeasons,before:window.__hofBefore,reason:window.__hofReason,actions:window.__hofActions,voteCards:[...document.querySelectorAll('#log .card')].filter(c=>c.querySelector('h4')?.textContent==='殿堂入り投票').map(c=>c.textContent),tiers:Object.fromEntries(['CPBL','KBO','NPB','MLB','IND','CORP'].filter(b=>S.stats[b]).map(b=>[b,tierOf(b)])),thresholds:TIER_TH}),action:strategy=>{
 if(S.done)return 'done';
 const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));
 if(strategy==='balanced-stay')rows.sort((a,b)=>parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent));
 const buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
 let button=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText));
 if(!button&&strategy==='balanced-stay')button=buttons.find(e=>/現在の球団に残留|権利を行使せず残留|宣言残留/.test(e.innerText));
 if(!button&&strategy==='ordered-overseas')button=buttons.find(e=>/海外|台湾|韓国|KBO|米国|メジャー|3A/.test(e.innerText)&&!/辞退|断る|帰国/.test(e.innerText));
 button=button||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons.find(e=>!/現役引退|引退を選択|現役を退く/.test(e.innerText))||buttons[0];
 if(!button)return 'waiting';
 window.__hofActions.push({year:S.year,level:S.lv,choice:button.dataset.abilityKey||button.innerText});button.click();return S.done?'done':'action';
}};`;
const instrument=s=>s.replace('function R(){','function R(){window.__rngCalls=(window.__rngCalls||0)+1;').replace('R = function(){','R = function(){window.__rngCalls=(window.__rngCalls||0)+1;')+hook;
const server=createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(rel.includes('..'))throw Error('path');let body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({channel:'chrome',headless:true});
const cases=Array.from({length:25},(_,i)=>({seed:`hof111-pilot-${String(i+1).padStart(2,'0')}`,pos:['P','P','C','IF','OF'][i%5]})).flatMap(c=>['ordered-overseas','balanced-stay'].map(strategy=>({...c,strategy}))).filter(c=>(!arg('seeds')||arg('seeds').split(',').includes(c.seed))&&(!arg('strategy')||c.strategy===arg('strategy'))).slice(0,Number(arg('limit')||50));
const started=Date.now(),results=[];let next=0;
async function run(input){
 const begin=Date.now(),p=await browser.newPage(),errors=[],resources=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))resources.push(r.status()+' '+r.url());});
 let failure=null,steps=0;
 try{
  await p.goto(base+'/?seed='+input.seed);await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+input.pos+'"]').click();await p.locator('#btn-start').click();
  let waiting=0;
  for(;steps<2500;steps++){
   const status=await p.evaluate(strategy=>{let value;for(let i=0;i<8;i++){value=window.__hofAudit.action(strategy);if(value!=='action')break;}return value;},input.strategy);
   if(status==='done')break;
   if(errors.length){failure='game-error';break;}
   if(status==='waiting'){if(++waiting>10){failure='no-action';break;}await p.waitForTimeout(100);}else waiting=0;
   if(Date.now()-begin>180000){failure='timeout';break;}
  }
  if(steps>=2500)failure='action-limit';
 }catch(e){failure=e.message;}
 let observed;try{observed=await p.evaluate(()=>window.__hofAudit.get());}catch(e){failure=failure||e.message;}
 const state=observed?.state;
 const snapshot=state?{pos:state.pos,role:state.role,roleYears:state.roleYears,age:state.age,year:state.year,stage:state.stage,lv:state.lv,stats:state.stats,statsByLevel:state.statsByLevel,honors:state.honors,intlCount:state.intlCount,traits:state.traits,legendLeague:state.legendLeague,hofInfo:state.hofInfo||[],bigInj:state.bigInj,tjCount:state.tjCount,careerEarnings:state.careerEarnings,done:state.done}:null;
 const result={...input,completed:!!state?.done&&!failure,failure,seconds:(Date.now()-begin)/1000,actions:observed?.actions?.length||0,actionDigest:createHash('sha256').update(JSON.stringify(observed?.actions||[])).digest('hex'),finalStateDigest:createHash('sha256').update(JSON.stringify(state||{})).digest('hex'),rng:observed?.rng,calls:observed?.calls,retirementRngState:observed?.before?.rngState,voteCards:observed?.voteCards,retirementReason:observed?.reason,tiers:observed?.tiers,thresholds:observed?.thresholds,snapshot,seasons:observed?.seasons||[],errors,resources,lastLog:failure?await p.locator('#log').innerText().then(s=>s.slice(-1200)).catch(()=>null):undefined};
 await p.close();return result;
}
try{
 await Promise.all(Array.from({length:2},async()=>{for(;;){const i=next++;if(i>=cases.length)return;const r=await run(cases[i]);results[i]=r;console.error(`${i+1}/${cases.length} ${r.seed}/${r.pos}/${r.strategy}: ${r.completed?'complete':r.failure} ${r.actions} actions RNG ${r.calls} ${r.seconds.toFixed(1)}s`);}}));
 const replay=[];for(const input of cases.slice(0,2)){const r=await run(input),old=results.find(x=>x.seed===input.seed&&x.strategy===input.strategy);assert.equal(r.finalStateDigest,old.finalStateDigest,'full game replay state');assert.equal(r.actionDigest,old.actionDigest,'strategy replay actions');assert.equal(r.calls,old.calls,'strategy replay RNG');replay.push({seed:r.seed,strategy:r.strategy,completed:r.completed,state:r.finalStateDigest,actions:r.actionDigest,calls:r.calls});}
 const data={source:'真實 production browser engine；未強制聯盟／能力／RNG／退休',version:VERSION,commit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),environment:{node:process.version,browser:browser.version(),platform:process.platform},seconds:(Date.now()-started)/1000,attempts:results.length,completed:results.filter(r=>r.completed).length,failures:results.filter(r=>!r.completed).length,replay,results};
 if(data.failures||results.some(r=>r.errors.length||r.resources.length))process.exitCode=1;
 const output=arg('output')||path.join(os.tmpdir(),'yakyujinsei-hof-pilot.json');await writeFile(output,JSON.stringify(data));console.log(JSON.stringify({output,attempts:data.attempts,completed:data.completed,failures:data.failures,seconds:data.seconds,replay}));
}catch(error){console.error(error);process.exitCode=1;}finally{server.closeAllConnections();server.close();await Promise.race([browser.close(),new Promise(r=>setTimeout(r,5000))]);process.exit(process.exitCode||0);}
