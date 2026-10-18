// Legacy no-league history: run the actual A/B awards functions, not copied regex.
import assert from 'node:assert/strict';
import {harness,oldSource,source,state,stat} from './award-runtime-support.mjs';
import vm from 'node:vm';
import {productionFunction} from '../../tests/retirement-hof-test-support.mjs';
import {hasCurrentAwardEffect} from '../../docs/src/engine/award-consumer-policy.js';
import {goldclothEligible,TRAIT_TEXT} from '../../docs/src/engine/trait-policy.js';
import {isBelowActiveMinimum,findDemotionTarget,demotionChoiceText} from '../../docs/src/engine/career-policy.js';
import {createContract,contractNeedsRenewal} from '../../docs/src/engine/contract-policy.js';
import {Rng} from '../../docs/src/engine/rng.js';
let pass=0;
for(const title of ['最優秀投手賞','首位打者','本塁打王','ゴールデングラブ賞','年間MVP','年度MVP','新人王','守備王','出塁王','最多勝',
 '年度最佳投手','救援王','中繼王','三振王','盜壘王','打點王','ホールド王','盗み王','賽揚獎']){
 const initial=state();initial.age=30;initial.honors=['2039 '+title];
 const metrics={...stat,d:-10,W:0,L:1,IP:10,era:6,SO:0,SV:0,HLD:0};
 const a=harness(oldSource,initial,metrics),b=harness(source,initial,metrics);a.run();b.run();
 const actual=b.snapshot(),expected=a.snapshot();delete actual.awardDecisions;delete expected.awardDecisions;
 assert.deepEqual(actual,expected,'consumer-local history must not expand phoenix for missing league: '+title);
 assert.deepEqual(b.rng,a.rng);assert.deepEqual(b.cards,a.cards);pass++;
 console.log(JSON.stringify({status:'PASS',originalName:initial.honors[0],consumer:'phoenix',A:a.snapshot(),B:b.snapshot(),rngA:a.rng,rngB:b.rng}));
}
function movement(src,honor,good){
 const cards=[],choices=[],observed=[],rng=[];
 const s={...state(),age:30,stage:'PRO',honors:[honor],npbYears:0,npbDevYears:0,teamYears:0,samePick:0,
  serviceTime:{NPB:0,MLB:0,KBO:0,CPBL:0},npbRosterDays:0,npbFaSeasons:0,lastD:-8,skipMid:false,teamTally:{},
  ct:createContract({contractId:'legacy-effect',org:'NPB',teamId:'fixture',signedYear:2039,startYear:2039,years:3,annualSalary:10000000}),
  lastSt:{G:20,IP:100,ER:good?30:65,H:150,BB:50,SV:0,HLD:0}};
 const c=vm.createContext({S:s,TextEncoder,Rng,hasCurrentAwardEffect,goldclothEligible,TRAIT_TEXT,isBelowActiveMinimum,findDemotionTarget,demotionChoiceText,contractNeedsRenewal,
  traitPresentation:new WeakMap(),displayTrait:k=>k,card:(...a)=>cards.push(a),board:()=>{},choose:(title,opts)=>choices.push({title,options:opts.map(x=>({t:x.t,s:x.s}))}),
  ovr:()=>52,migrateSalaryV130State:()=>{},accrueForeignFirstTeamSeason:()=>{},contractStageFor:()=> 'CONTROL',crossOffers:()=>{},
  markClubInitiatedRenewal:()=>{},applyPromotionSalary:()=>{},retireBelowActiveMinimum:()=>assert.fail('invalid below-active fixture'),
  advance:()=>{},outOfOrg:()=>assert.fail('unexpected release'),teamNick:x=>x,observe:x=>observed.push(x),recordR:x=>rng.push(x)});
 const levels=src.match(/Object.assign\(LV,(\{[\s\S]*?\})\);/)[1],paths=src.match(/Object.assign\(PATHS,(\{[^\n]+\})\);/)[1];
 const functions=['movement','handleDemotion','traitCard','removeTrait','fnv1a32'].map(n=>{
  const f=productionFunction(n,src);return n==='movement'?f.replace('  if(wonAward||goodReal)',"  observe({wonAward,goodReal});\n  if(wonAward||goodReal)"):f;
 }).join('\n');
 vm.runInContext(`const LV=${levels},PATHS=${paths};const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));let _s=0,seedInit,R;const careerRng=new Rng(()=>S,fnv1a32);
 ${src.match(/seedInit = function\(seed\)\{[^\n]+/)[0]}
 ${src.match(/R = function\(\)\{[^\n]+/)[0]}
 const nativeR=R;R=()=>{const v=nativeR();recordR(v);return v;};const chance=p=>R()*100<p;
 ${functions};const LEGACY={movement};${src.match(/^  movement = function\(\)\{[^\n]+/m)[0]};seedInit(S.seed);movement();`,c);
 return JSON.parse(JSON.stringify({state:s,cards,choices,observed,rng}));
}
for(const prefix of ['','NPB','KBO','台湾プロ野球','メジャーリーグ','CPBL','MLB','中職','日職','韓職','美職'])for(const title of ['年間MVP','年度MVP','新人王','最優秀投手賞','首位打者','本塁打王','ゴールデングラブ賞','オールスターゲーム','守備王','出塁王','最多勝','沢村賞','最多奪三振','年間最優秀守備選手',
 '年度最佳投手','救援王','中繼王','三振王','盜壘王','打點王','ホールド王','盗み王','賽揚獎'])for(const mode of ['bad','good','past']){
 const text=(mode==='past'?2038:2039)+' '+prefix+title;
 const a=movement(oldSource,text,mode==='good'),b=movement(source,text,mode==='good');
 assert.deepEqual(b,a,'native movement exact compatibility: '+text+'/'+mode);pass++;
 console.log(JSON.stringify({status:'PASS',originalName:text,consumer:'movement',mode,A:a,B:b}));
}
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_A_B_AWARDS_AND_ACTIVE_MOVEMENT; no trusted-ID inference for missing league'}));
