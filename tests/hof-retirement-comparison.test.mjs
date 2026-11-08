import assert from 'node:assert/strict';
import {assertApprovedHofRetirement} from './support/approved-hof-comparison.mjs';
const before={rngState:1,ab:{vel:60},careerEarnings:100,stats:{NPB:{W:10}},traits:{legend:false},honors:[]};
const A={...structuredClone(before),done:true,rngState:3},B={...structuredClone(before),done:true,rngState:2,traits:{legend:true},hofInfo:[{lg:'NPB'}]};
const good={beforeOld:before,beforeNew:structuredClone(before),afterOld:A,afterNew:B,expectedNew:structuredClone(B),traceOld:[1,2],traceNew:[1],expectedTrace:[1],evidence:{changedLeagues:[{league:'NPB',rule:'FIRST_TEAM_ONLY',before:0,after:1}]}};
assert.equal(assertApprovedHofRetirement(good).classification,'EXPECTED_HOF_CHANGE');
for(const key of ['careerEarnings','stats','ab','honors']){const bad=structuredClone(good);bad.afterNew[key]=key==='careerEarnings'?999:{};bad.expectedNew=structuredClone(bad.afterNew);assert.throws(()=>assertApprovedHofRetirement(bad),'unrelated '+key+' cannot be hidden even by an expected snapshot');}
const corrupt=structuredClone(good);corrupt.traceNew=[999];assert.throws(()=>assertApprovedHofRetirement(corrupt),'unknown RNG mutation');
const pre=structuredClone(good);pre.beforeNew.rngState++;assert.throws(()=>assertApprovedHofRetirement(pre),'pre-retirement strict');
const unexplained=structuredClone(good);unexplained.evidence.changedLeagues=[];assert.throws(()=>assertApprovedHofRetirement(unexplained));
const whole=structuredClone(good);whole.afterNew.traits.phoenix=true;whole.expectedNew=structuredClone(whole.afterNew);assert.throws(()=>assertApprovedHofRetirement(whole));
console.log('PASS HOF comparison policy: complete pre/post state, every RNG draw and negative controls');

// Execute the unchanged native grant block, rather than manufacturing provenance in a fixture.
const {readFileSync}=await import('node:fs'),{execFileSync}=await import('node:child_process'),vm=await import('node:vm');
const current=readFileSync(new URL('../docs/src/engine/career-movement.js',import.meta.url),'utf8'),baseline=execFileSync('git',['show','25b815e07f426604f453fdb538266a4630143dbe:docs/src/engine/career-movement.js'],{encoding:'utf8'});
const block=s=>s.slice(s.indexOf("if(S.stage==='PRO'&&LV[S.lv].top){"),s.indexOf('    const path=PATHS[S.org]'));
for(const league of ['NPB','MLB','KBO','CPBL'])for(const years of [5,6,7])for(const won of [false,true]){
 const st={stage:'PRO',lv:'TOP',year:2035,orgTeamId:'team-'+league,teamYears:years,champThisTeam:won,champTeam:'team-'+league,traits:{},teamTally:{}};
 const execute=src=>{const S=structuredClone(st),log=[];vm.runInNewContext(block(src),{S,LV:{TOP:{top:true,statBucket:league}},goldclothEligible:()=>false,card:(...args)=>log.push(args),board:()=>{},teamNick:()=>'',displayTrait:()=>'',TRAIT_TEXT:{}});return{S,log};};
 const A=execute(baseline),B=execute(current);
 if(won&&years>=6){assert.deepEqual(Object.keys(B.S.franchiseAchievement).sort(),['league','teamId','year']);assert.equal(B.S.franchiseAchievement.year,2035);assert.equal(B.S.franchiseAchievement.league,league);assert.equal(B.S.franchiseAchievement.teamId,'team-'+league);delete B.S.franchiseAchievement;}else assert.equal(Object.hasOwn(B.S,'franchiseAchievement'),false);
 assert.deepEqual(B,A,'native acquisition conditions and all other effects unchanged');
}
console.log('PASS 24 native franchise grant/negative scenarios with exact provenance and state/action equality');
