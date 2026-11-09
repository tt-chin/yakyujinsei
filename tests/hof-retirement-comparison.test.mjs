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

const {findFirstDifference}=await import('./support/first-difference.mjs');
const prefix=Object.fromEntries(Array.from({length:15000},(_,i)=>['key'+i,{a:i,b:[i,i+1]}]));
assert.equal(findFirstDifference({prefix,tail:{value:1}},{prefix:structuredClone(prefix),tail:{value:2}}).path,'$.tail.value','large equal subtrees cannot exhaust diagnostic budget before the real difference');
console.log('PASS diagnostic finds actual mismatch after 15,000 equal subtrees without changing strict comparison');

const {franchiseComparisonProof,historicalCareer}=await import('../tools/development-b/historical-comparison.mjs');
const nativeBefore={seed:'proof',year:2039,stage:'PRO',lv:'CPBL1',teamYears:6,orgTeamId:'CPBL_TEAM',champThisTeam:true,champTeam:'CPBL_TEAM',traits:{franchise:false},honors:[]};
const nativeAfter={...structuredClone(nativeBefore),year:2040,teamYears:7,traits:{franchise:true},franchiseAchievement:{year:2039,league:'CPBL',teamId:'CPBL_TEAM'}};
const trajectory={steps:[{beforeState:nativeBefore,afterState:nativeAfter}],state:structuredClone(nativeAfter)};
const proof=franchiseComparisonProof(trajectory);
assert.equal(Object.hasOwn(historicalCareer(trajectory,{franchiseProof:proof}).state,'franchiseAchievement'),false);
for(const [label,mutate] of [
 ['wrong year',c=>c.steps[0].afterState.franchiseAchievement.year++],
 ['wrong league',c=>c.steps[0].afterState.franchiseAchievement.league='MLB'],
 ['wrong team',c=>c.steps[0].afterState.franchiseAchievement.teamId='OTHER'],
 ['minor level',c=>c.steps[0].beforeState.lv='CPBL2'],
 ['early tenure',c=>c.steps[0].beforeState.teamYears=5],
 ['no title',c=>c.steps[0].beforeState.champThisTeam=false],
 ['other champion team',c=>c.steps[0].beforeState.champTeam='OTHER'],
 ['later mutation',c=>c.state.franchiseAchievement.year++],
 ['later missing',c=>delete c.state.franchiseAchievement],
 ['missing transition',c=>c.steps=[]],
 ['before insertion',c=>c.steps[0].beforeState.franchiseAchievement=structuredClone(nativeAfter.franchiseAchievement)]
]){const c=structuredClone(trajectory);mutate(c);assert.throws(()=>historicalCareer(c,{franchiseProof:franchiseComparisonProof(c)}),label);}
assert.deepEqual(trajectory.state,nativeAfter,'projection cannot mutate raw replay evidence');
console.log('PASS franchise provenance projection and 11 negative controls; raw full replay remains unchanged');
