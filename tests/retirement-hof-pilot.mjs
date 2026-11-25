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
import {instrumentRng} from './support/rng-instrument.mjs';
const root=fileURLToPath(new URL('../',import.meta.url)),arg=n=>process.argv.find(a=>a.startsWith('--'+n+'='))?.slice(n.length+3);
const {chromium}=createRequire(import.meta.url)(arg('playwright')||'playwright');
// --strategies=<league>:<dev>,... (plan §8). Without it, the original 50 cases are unchanged.
const S2_LEAGUES=['stay','overseas','target-kbo','target-mlb'],S2_DEVS=['balanced','primary','pitcher-sp','pitcher-rp'],s2=arg('strategies')?.split(',');
for(const s of s2||[]){const [league,dev,extra]=s.split(':');if(extra!==undefined||!S2_LEAGUES.includes(league)||!S2_DEVS.includes(dev))throw Error('unknown strategy: '+s);}
const fits=(pos,strategy)=>{const dev=strategy.split(':')[1];return dev?.startsWith('pitcher-')?pos==='P':dev==='primary'?pos!=='P':true;};
const allCases=Array.from({length:25},(_,i)=>({seed:`hof111-pilot-${String(i+1).padStart(2,'0')}`,pos:['P','P','C','IF','OF'][i%5]})).flatMap(c=>(s2||['ordered-overseas','balanced-stay']).filter(strategy=>fits(c.pos,strategy)).map(strategy=>({...c,strategy}))).filter(c=>(!arg('seeds')||arg('seeds').split(',').includes(c.seed))&&(!arg('strategy')||c.strategy===arg('strategy')));
if(s2&&allCases.length>Number(arg('limit')||50))throw Error(`--strategies produced ${allCases.length} cases, over --limit=${arg('limit')||50}`);
const cases=allCases.slice(0,Number(arg('limit')||50));
if(s2&&!cases.length)throw Error('--strategies produced no cases (check --seeds and --limit)');
const hook=`
window.__hofSeasons=[];window.__hofActions=[];
const observeLevelStat=accLevelStat;accLevelStat=function(lv,st){window.__hofSeasons.push({year:S.year,age:S.age,lv,role:S.role,pos:S.pos,seasonFactor:S.seasonFactor,rehab:S.rehab,st:JSON.parse(JSON.stringify(st))});return observeLevelStat(lv,st);};
// S2 (plan §8): <league>:<dev>; only clicks options shown on screen. Returns null to fall through to the shared default chain.
window.__hofS2=function(strategy,rows,buttons){
 const [league,dev]=strategy.split(':'),key=e=>e.dataset.abilityKey,val=e=>parseInt(e.querySelector('.val').textContent),low=list=>list.slice().sort((a,b)=>val(a)-val(b))[0],find=re=>buttons.find(e=>re.test(e.innerText));
 if(rows.length){
  const pitch=rows.filter(e=>['vel','ctl','brk'].includes(key(e))),sta=rows.find(e=>key(e)==='sta');
  if(dev==='primary'){const order=S.pos==='C'?['con','pow','eye','spd','fld','cat','arm','rng','sta']:['con','pow','eye','spd','rng','fld','arm','sta'],rank=e=>{const i=order.indexOf(key(e));return i<0?99:i;},sorted=rows.slice().sort((a,b)=>rank(a)-rank(b));return sorted.find(e=>val(e)<((S.pot&&S.pot[key(e)])||62))||sorted[0];}
  if(dev==='pitcher-sp')return (sta&&val(sta)<52?sta:null)||low(pitch)||sta||rows[0];
  if(dev==='pitcher-rp')return low(pitch)||sta||rows[0];
  return low(rows);
 }
 const confirm=find(/配分を確定|配分完了|次へ|完了/);if(confirm)return confirm;
 const normal=find(/^通常投球/);if(normal&&find(/^全力投球/))return normal;
 const surgery=find(/^トミー・ジョン手術を受ける/);if(surgery)return surgery;
 const role=dev==='pitcher-sp'?find(/^先発へ転向し/):dev==='pitcher-rp'?find(/^ブルペンに残り/):null;if(role)return role;
 const stay=/現在の球団に残留|権利を行使せず残留|宣言残留/;
 if(league==='overseas')return buttons.find(e=>/海外|台湾|韓国|KBO|米国|メジャー|3A/.test(e.innerText)&&!/辞退|断る|帰国/.test(e.innerText))||null;
 const demotion=find(/への降格を受け入れる/);if(demotion)return demotion;
 if(league==='stay')return find(stay)||null;
 const kbo=league==='target-kbo',faMarket=/FA市場/.test(document.querySelector('#act .title')?.textContent||''),target=kbo?/^韓国プロ野球への海外移籍|（KBO一軍）/:faMarket?/（メジャーリーグ）|（ルーキーリーグ）/:/^MLBへの海外移籍|^米国プロ野球への海外移籍|^米国プロ組織と契約する|（メジャーリーグ）/,arrived=kbo?S.org==='KBO':['MiLB','MLB'].includes(S.org);
 return (arrived?find(stay)||find(target):find(target)||find(/^海外FAを宣言/)||find(stay))||null;
};
flowHooks.endGame=function(outcome){window.__hofBefore=JSON.parse(JSON.stringify(S));const result=endGame(outcome.reason);window.__hofReason=outcome.reason;return result;};
window.__hofAudit={get:()=>({state:JSON.parse(JSON.stringify(S)),rng:_s,calls:window.__rngCalls||0,seasons:window.__hofSeasons,before:window.__hofBefore,reason:window.__hofReason,actions:window.__hofActions,voteCards:[...document.querySelectorAll('#log .card')].filter(c=>c.querySelector('h4')?.textContent==='殿堂入り投票').map(c=>c.textContent),tiers:Object.fromEntries(['CPBL','KBO','NPB','MLB','IND','CORP'].filter(b=>S.stats[b]).map(b=>[b,tierOf(b)])),thresholds:TIER_TH}),action:strategy=>{
 if(S.done)return 'done';
 const act=document.querySelector('#act'),rows=[...act.querySelectorAll('.abrow')].filter(e=>e.getAttribute('aria-disabled')!=='true'&&!e.classList.contains('capped'));
 if(strategy==='balanced-stay')rows.sort((a,b)=>parseInt(a.querySelector('.val').textContent)-parseInt(b.querySelector('.val').textContent));
 const buttons=[...act.querySelectorAll('button')].filter(e=>!e.disabled&&!/元に戻す|すべてリセット/.test(e.innerText));
 let button;
 if(strategy.includes(':'))button=window.__hofS2(strategy,rows,buttons);else{
 button=rows[0]||buttons.find(e=>/配分を確定|配分完了|次へ|完了/.test(e.innerText));
 if(!button&&strategy==='balanced-stay')button=buttons.find(e=>/現在の球団に残留|権利を行使せず残留|宣言残留/.test(e.innerText));
 if(!button&&strategy==='ordered-overseas')button=buttons.find(e=>/海外|台湾|韓国|KBO|米国|メジャー|3A/.test(e.innerText)&&!/辞退|断る|帰国/.test(e.innerText));
 }
 button=button||buttons.find(e=>/NPBドラフト|プロ志望|オファーを受ける|契約を結|指名を受け|入団/.test(e.innerText))||buttons.find(e=>!/現役引退|引退を選択|現役を退く/.test(e.innerText))||buttons[0];
 if(!button)return 'waiting';
 window.__hofActions.push({year:S.year,level:S.lv,choice:button.dataset.abilityKey||button.innerText});button.click();return S.done?'done':'action';
}};`;
const instrument=s=>instrumentRng(s,'__rngCalls')+hook;
const server=createServer(async(req,res)=>{try{const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\//,'')||'index.html';if(rel.includes('..'))throw Error('path');let body=await readFile(path.join(root,'docs',rel));if(rel==='src/engine/game.js')body=instrument(body.toString());res.setHeader('Content-Type',rel.endsWith('.js')?'text/javascript; charset=utf-8':rel.endsWith('.css')?'text/css':rel.endsWith('.png')?'image/png':'text/html; charset=utf-8');res.end(body);}catch(e){res.statusCode=404;res.end(String(e));}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({channel:process.argv.find(a=>a.startsWith('--browser='))?.slice(10)||'chrome',headless:true});
const started=Date.now(),results=[];let next=0;
async function run(input){
 const begin=Date.now(),p=await browser.newPage(),errors=[],resources=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});p.on('response',r=>{if(r.status()>=400&&/\.(js|css)(\?|$)/.test(r.url()))resources.push(r.status()+' '+r.url());});
 let failure=null,steps=0;
 try{
  await p.goto(base+'/?seed='+input.seed);await p.waitForFunction(()=>!document.querySelector('#btn-start').disabled);await p.locator('#seg-pos [data-v="'+input.pos+'"]').click();
  // Identical explicit input preserves full-state/RNG replay; blank product names intentionally vary.
  await p.locator('#in-name').fill({P:'投山翔太',C:'強肩剛',IF:'守田巧',OF:'走川隼人'}[input.pos]);await p.locator('#btn-start').click();
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
