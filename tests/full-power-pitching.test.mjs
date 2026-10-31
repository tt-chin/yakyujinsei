import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {productionFunction} from './retirement-hof-test-support.mjs';
import {applyEventSeason,normalizeEventSeason} from '../docs/src/engine/event-season-policy.js';
const ref=process.argv.find(a=>a.startsWith('--source='))?.slice(9);
const source=ref?execFileSync('git',['show',ref+':docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}):fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const seasonStatsSource=source.includes('seasonStats.simSeason(')?(ref?execFileSync('git',['show',ref+':docs/src/engine/season-stats.js'],{encoding:'utf8'}):fs.readFileSync(new URL('../docs/src/engine/season-stats.js',import.meta.url),'utf8')):null;
const SeasonStats=seasonStatsSource?(await import('data:text/javascript,'+encodeURIComponent(seasonStatsSource))).SeasonStats:null;
// Phase 16 moved tjGamble's body into PlayerInjury; its game.js construction line rides in the tjGamble slice.
const playerInjurySource=source.includes('new PlayerInjury(')?(ref?execFileSync('git',['show',ref+':docs/src/engine/player-injury.js'],{encoding:'utf8'}):fs.readFileSync(new URL('../docs/src/engine/player-injury.js',import.meta.url),'utf8')):null;
const PlayerInjury=playerInjurySource?(await import('data:text/javascript,'+encodeURIComponent(playerInjurySource))).PlayerInjury:null;
const cases=[];
const activeLevels=vm.runInNewContext('('+source.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1]+')');
function test(id,fn){try{fn();cases.push({id,status:'PASS'});}catch(error){cases.push({id,status:'FAIL',error:error.stack});}console.log(cases.at(-1).status+' '+id);}
function fixture(v={}){
 const S={pos:'P',role:'SP',stage:'PRO',lv:'NPB1',year:2035,age:25,ab:{vel:57,ctl:57,brk:57,sta:60},traits:{},tj:0,tjCount:0,seasonFactor:1,rehab:0,skipMid:false,effort:'通常投球',pendStat:0,log:[],honors:[],ironStreak:0,stats:{},teamName:()=> '長い球団名称・投球テスト',...v};
 const cards=[],choices=[],raw={G:24,IP:120,W:8,L:8,SO:100,H:110,BB:30,ER:53,SV:0,HLD:0,d:0,era:4,WHIP:1.17,form:0,...v.raw};
 const ctx=vm.createContext({S,LV:activeLevels,POS_AB:{P:['sta','vel','ctl','brk'],IF:['sta','con']},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),R:()=>{throw Error('UNEXPECTED_RNG');},chance:()=>{throw Error('UNEXPECTED_CHANCE');},N0:()=>0,ri:()=>{throw Error('UNEXPECTED_RI');},isSP:()=>S.role==='SP',board:()=>{},card:(...a)=>cards.push(a),choose:(title,opts)=>choices.push({title,opts}),tjGamble:()=>{},addAb:(k,n)=>S.ab[k]+=n,declineForSeason:()=>0,bucketOf:()=> 'NPB',simSeason:()=>structuredClone(raw),applyEventSeason,normalizeEventSeason,consumeEventSeason:s=>s.pendStat=0,accStat:()=>{},accLevelStat:()=>{},statLine:s=>JSON.stringify(s),awards:()=>{},recordSalaryEvaluation:()=>{},captureSeasonChampionship:()=>{},classifyMarketInjury:()=> 'HEALTHY',toolGap:()=>({gap:0}),careerAllStars:()=>0,displayTrait:k=>k,PlayerInjury,ABL:{}});
 ctx.seasonContinuations=new WeakMap();ctx.resumeSeasonEnd=()=>false;ctx.restorePendingChoice=()=>false;
 for(const name of ['tjCap','tjAccrue','proSeason',...(source.includes('function resumeProfessionalSeason(')?['resumeProfessionalSeason']:[]),...(source.includes('function runSeasonPipeline(')?['runSeasonPipeline']:[]),'phasePre'])vm.runInContext(productionFunction(name,source),ctx);
 return{S,ctx,cards,choices,raw,run:code=>vm.runInContext(code,ctx)};
}
for(const effort of ['全力投球','通常投球','省エネ投球'])test('F01-F02-callback-'+effort,()=>{const h=fixture();h.run('phasePre()');assert.deepEqual(Array.from(h.choices[0].opts,o=>o.t),['全力投球','通常投球','省エネ投球']);let continued=0;h.ctx.R=()=>{continued++;assert.equal(h.S.effort,effort);throw Error('TRAINING_CONTINUATION_OBSERVED');};assert.throws(()=>h.choices[0].opts.find(o=>o.t===effort).f(),/TRAINING_CONTINUATION_OBSERVED/);assert.equal(continued,1);});
for(const role of ['SP','MR','CL'])for(const points of [0,2,-2])test('F03-F05-F06-season-'+role+'-'+points,()=>{const h=fixture({role,effort:'全力投球',pendStat:points});const options={pos:'P',role,maxGames:143};let expected=points?applyEventSeason(h.raw,{...options,points,seasonFactor:1}):structuredClone(h.raw);expected.d++;expected.era=Math.max(1.4,Math.min(9.9,expected.era-.25));expected.ER=Math.round(expected.era*expected.IP/9);expected.SO=Math.round(expected.SO*1.06);if(points)expected=normalizeEventSeason(expected,options);h.run('proSeason()');assert.deepEqual(JSON.parse(JSON.stringify(h.S.lastSt)),expected);assert.deepEqual(JSON.parse(JSON.stringify(h.S.log[0].st)),expected);assert.equal(h.S.lastD,0,'existing pre-correction lastD timing');assert.equal(h.S.tj,7.5);if(!points){assert.equal(h.S.lastSt.ER,50);assert.equal(h.S.lastSt.SO,106);}});
for(const lv of ['CPBL1','CPBL2','KBO1','KBO2','NPB2','NPB_DEV','MLB','R','A1','A2','A3'])test('F06-applicable-level-'+lv,()=>{const h=fixture({lv,effort:'全力投球'});h.run('proSeason()');assert.equal(h.S.lastSt.SO,106);assert.equal(h.S.lastSt.era,3.75);assert.equal(h.S.lastSt.ER,50);assert.equal(h.S.tj,7.5);});
for(const [era,so]of [[1.3,101],[1.4,99],[9.9,1],[4,107]])test('F04-boundary-'+era+'-'+so,()=>{const h=fixture({effort:'全力投球',raw:{era,SO:so}});h.run('proSeason()');assert.equal(h.S.lastSt.era,Math.max(1.4,Math.min(9.9,era-.25)));assert.equal(h.S.lastSt.SO,Math.round(so*1.06));});
for(const [effort,mult]of [['全力投球',1.25],['通常投球',1],['省エネ投球',.65],['全力投',1],['普通投',1],['ノーマル',1],['unknown',1],[undefined,1]])for(const surgeries of [0,1])test('F07-F10-tj-'+String(effort)+'-'+surgeries,()=>{const h=fixture({effort,tjCount:surgeries});h.run('tjAccrue()');assert.ok(Math.abs(h.S.tj-6*mult*(surgeries?1.15:1))<1e-12);});
for(const rubber of [false,true])for(const effort of ['全力投球','通常投球'])test('F08-threshold-'+rubber+'-'+effort,()=>{const h=fixture({effort,tj:rubber?93:43,traits:{rubber}});h.run(productionFunction('tjGamble',source));h.run('tjAccrue();tjGamble(()=>{})');assert.equal(h.choices.length,effort==='全力投球'?1:0);assert.equal(h.S.ab.vel,effort==='全力投球'?52:57);});
for(const v of [{pos:'IF'},{seasonFactor:0}])test('F09-tj-guard-'+JSON.stringify(v),()=>{const h=fixture({...v,effort:'全力投球',tj:17});h.run('tjAccrue()');assert.equal(h.S.tj,17);});
test('F09-pre-full-rest',()=>{const h=fixture({rehab:1});h.ctx.checkGoldclothSeason=()=>{};h.ctx.ri=()=>{throw Error('TRAINING_START');};assert.throws(()=>h.run('phasePre()'),/TRAINING_START/);assert.ok(!h.choices.some(c=>c.title.includes('投球プラン')));assert.equal(h.S.seasonFactor,0);});
for(const role of ['SP','MR','CL'])test('F11-original-simulation-'+role,()=>{const runs=[];for(const effort of ['全力投球','通常投球']){const h=fixture({role,effort});let n=0;const values=[];h.ctx.R=()=>{const r=((++n*16807)%2147483647)/2147483647;values.push(r);return r;};h.ctx.N0=sd=> (h.ctx.R()+h.ctx.R()+h.ctx.R()+h.ctx.R()-2)*sd;h.ctx.chance=p=>h.ctx.R()*100<p;h.ctx.ri=(a,b)=>a+Math.floor(h.ctx.R()*(b-a+1));if(SeasonStats){const seasonStats=new SeasonStats({getState:()=>h.S,levels:h.ctx.LV,rng:{R:()=>h.ctx.R(),N0:sd=>h.ctx.N0(sd),chance:p=>h.ctx.chance(p),ri:(a,b)=>h.ctx.ri(a,b)},clamp:h.ctx.clamp,isSP:()=>h.ctx.isSP(),pitcherRole:()=>h.ctx.pitcherRole(),checkGoldclothSeason:()=>h.ctx.checkGoldclothSeason()});runs.push({st:JSON.parse(JSON.stringify(seasonStats.simSeason("NPB1"))),values});}else{h.run(productionFunction('applySeasonForm',source));h.run(productionFunction('simSeason',source));runs.push({st:JSON.parse(h.run('JSON.stringify(simSeason("NPB1"))')),values});}}assert.deepEqual(runs[0],runs[1]);});
// Phase 11-A: the post-season dispatch keeps the original chain's call order, continuation count and entry.phase timing.
if(source.includes('function resumeProfessionalSeason(')){
 const pipelineBase=execFileSync('git',['show','ec903fd3cac9f62a457dbed18effe8065510679d:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6});
 const pipeline=['tjGamble','demotionAudit','tradeCheck','maybeIntl','nextStep'];
 function pipelineTrace(src,mode,at){
  const S={year:2035},entry={state:S,year:2035,phase:'PIPELINE_PREPARED'},calls=[],deferred=[];
  const ctx=vm.createContext({S,entry});
  for(const name of pipeline)ctx[name]=cont=>{calls.push([name,entry.phase]);if(name===at&&mode==='throw')throw Error('PIPELINE_FAULT_'+name);if(name===at&&mode==='defer'){deferred.push(cont);return;}if(cont)cont();};
  vm.runInContext("'use strict';\n"+['resumeProfessionalSeason',...(src.includes('function runSeasonPipeline(')?['runSeasonPipeline']:[])].map(n=>productionFunction(n,src)).join('\n'),ctx);
  let error=null;try{vm.runInContext('resumeProfessionalSeason(entry)',ctx);}catch(e){error=e.message;}
  calls.push(['RETURNED',entry.phase,error]);
  while(deferred.length)deferred.shift()(); // the player's choose() tap resumes the deferred layer
  calls.push(['END',entry.phase]);
  return JSON.stringify(calls);
 }
 const scenarios=[['direct'],...pipeline.slice(0,4).map(at=>['defer',at]),...pipeline.map(at=>['throw',at])];
 for(const [mode,at] of scenarios)test('P11A-pipeline-'+mode+(at?'-'+at:''),()=>{
  const current=pipelineTrace(source,mode,at),base=pipelineTrace(pipelineBase,mode,at);
  assert.equal(current,base);
  assert.ok(JSON.parse(current).length>=3);
 });
 test('P11A-pipeline-direct-order',()=>assert.equal(pipelineTrace(source,'direct'),JSON.stringify([...pipeline.map(n=>[n,'PIPELINE_STARTED']),['RETURNED','PIPELINE_WAIT',null],['END','PIPELINE_WAIT']])));
}
const summary={source:ref||'working-tree',pass:cases.filter(c=>c.status==='PASS').length,fail:cases.filter(c=>c.status==='FAIL').length,cases};
const output=process.argv.find(a=>a.startsWith('--output='))?.slice(9);if(output){fs.mkdirSync(new URL('../test-results/',import.meta.url),{recursive:true});fs.writeFileSync(output,JSON.stringify(summary,null,2));}console.log(JSON.stringify(summary));process.exitCode=summary.fail?1:0;
