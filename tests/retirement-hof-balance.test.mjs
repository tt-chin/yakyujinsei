import assert from 'node:assert/strict';
import {buildFixedCases,buildSpecialCases,measure,createProductionHarness,productionFunction,leagues,labels,GAME_SOURCE} from './retirement-hof-test-support.mjs';
import {honorScoreFor} from '../docs/src/engine/hall-of-fame-policy.js';
import {execFileSync} from 'node:child_process';
import vm from 'node:vm';
import {careerScoreFor,defenseShareFor,hallOfFameTier} from '../docs/src/engine/hall-of-fame-tier-policy.js';
const aHonorSource=execFileSync('git',['show','efd4710c4c5c366ff3aba69c59180031c82ff18a:docs/src/engine/hall-of-fame-policy.js'],{encoding:'utf8'});
const {honorScoreFor:aHonorScoreFor}=await import('data:text/javascript;base64,'+Buffer.from(aHonorSource).toString('base64'));
const cases=buildFixedCases();assert.equal(cases.length,160);let assertions=0;
for(const c of cases){const r=measure(c),s=c.stats;assert.ok(s.W+s.L+s.SV+s.HLD<=s.G);if(c.pos!=='P')assert.ok(s.HR<=s.H&&s.H<=s.AB&&s.AB+s.BB===s.PA);assert.equal(r.base,Object.values(r.components).reduce((a,b)=>a+b,0));assert.equal(r.score,Math.round(r.raw));assert.equal(r.tier,r.pureTier);assert.equal(r.inducted,r.hofInfo.length>0);if(r.inducted)assert.ok(Number(r.hofInfo[0].pct)>=75);assert.deepEqual(measure(c),r,'fixed seed narrative replay');assertions++;}
const special=buildSpecialCases();assert.equal(special.length,20);
for(const c of special){const s=c.stats,r=measure(c);assert.ok(s.W+s.L+s.SV+s.HLD<=s.G);if(c.pos!=='P')assert.ok(s.HR<=s.H&&s.H<=s.AB&&s.PA===s.AB+s.BB);assert.equal(r.base,Object.values(r.components).reduce((a,b)=>a+b,0));assert.deepEqual(measure(c),r);}
const blank=()=>({yr:1,G:1,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,DEF:0,AS:0});
for(const league of leagues){const base={id:'boundary-'+league,seed:'boundary',league,pos:'IF',stats:blank()};const th=measure(base);const h=createProductionHarness({pos:'IF',traits:{},honors:[],stats:{[league]:blank()}});const thresholds=h.snapshot().thresholds[league];
 for(let i=0;i<4;i++)for(const delta of [-1,0,1]){const result=measure({...base,stats:{...blank(),H:thresholds[i]+delta}});assert.equal(result.pureTier,delta<0?i+1:i);assertions++;}
 for(const [award,expected] of [['年間MVP',1],['最優秀投手賞',1],['首位打者',2],['ゴールデングラブ賞',2]]){const r=measure({...base,honors:['2035 '+labels[league]+award]});assert.equal(r.pureTier,4);assert.equal(r.tier,expected);assert.equal(r.candidate,expected===1);assert.equal(r.inducted,false);assertions++;}
 const franchise=measure({...base,franchise:true});assert.equal(franchise.honor.sc,200);assert.equal(measure({...base,intlCount:2,honors:['2035 ワールド・ベースボール・クラシック優勝']}).honor.sc,league==='NPB'?360:0);
 const duplicate='2035 '+labels[league]+'年間MVP',duplicateInput={bucket:league,honors:[duplicate,duplicate],position:'IF'};
 assert.equal(aHonorScoreFor(duplicateInput).sc,840,'preserve A duplicate-input characterization');
 assert.equal(honorScoreFor(duplicateInput).sc,420,'D2 AF07/AF08: same-year/league/ID counted once in derived view');
 assert.deepEqual(duplicateInput.honors,[duplicate,duplicate],'raw historical honors never rewritten');
 const rounded=measure({...base,stats:{...blank(),H:thresholds[0]-1,SB:1}});assert.equal(rounded.score,thresholds[0]);assert.equal(rounded.tier,1,'threshold evaluated before rounding');assertions+=4;
}
const noHold={id:'hold',league:'NPB',pos:'P',stats:{...blank(),G:500,IP:500,SO:500,W:20,HLD:0}};assert.equal(measure(noHold).base,measure({...noHold,stats:{...noHold.stats,HLD:300,ER:1,L:150}}).base,'HLD/ERA/L not in current score');assertions++;
assert.equal(measure({id:'negative',league:'NPB',pos:'IF',stats:{...blank(),DEF:-100}}).base,0);
assert.ok(Number.isNaN(measure({id:'missing',league:'NPB',pos:'P',stats:{IP:10}}).base),'missing raw stats are not normalized by score');
const both=measure({id:'multiple',league:'CPBL',pos:'IF',stats:{...blank(),H:8600,yr:4},state:{stats:{CPBL:{...blank(),H:8600,yr:4},MLB:{...blank(),H:11000,yr:10}}}});
const multi=createProductionHarness({pos:'IF',lv:'MLB',stage:'PRO',year:2050,traits:{},honors:[],stats:{CPBL:{...blank(),H:8600,yr:4},MLB:{...blank(),H:11000,yr:10}},teamTally:{}},'multi');multi.run("retireScene({CPBL:tierOf('CPBL'),MLB:tierOf('MLB')})");assert.equal(multi.snapshot().state.hofInfo.length,2);assert.equal(multi.snapshot().state.legendLeague,'メジャーリーグ','first-ballot league must exclude later-ballot inductees');assertions+=3;
assert.match(GAME_SOURCE,/NPB2:[^\n]+statBucket:'NPB'/);assert.match(GAME_SOURCE,/KBO2:[^\n]+statBucket:'KBO'/);assert.match(GAME_SOURCE,/CPBL2:[^\n]+statBucket:'CPBL'/);assertions+=3;
// OOP §2j phase 8: 52e4cdb careerScore/defShare/tierOf vs current wrappers + hall-of-fame-tier-policy, with final TIER_TH/LG_N and a stub honorScore.
const tierBaseline=execFileSync('git',['show','52e4cdb36d6b770a2c73ca89e947c94bcc616562:docs/src/engine/game.js'],{encoding:'utf8'});
const tables=createProductionHarness({pos:'IF',traits:{},honors:[],stats:{}}),finalTH=tables.snapshot().thresholds,finalLG=JSON.parse(tables.run('JSON.stringify(LG_N)'));
const tierCell=(source,state,bucket,honor)=>{const c=vm.createContext({S:structuredClone(state),TIER_TH:finalTH,LG_N:finalLG,careerScoreFor,defenseShareFor,hallOfFameTier,bucket,log:[],honorScore:b=>{c.log.push('honor:'+b);return honor;}});
 vm.runInContext(['careerScore','defShare','tierOf'].map(name=>productionFunction(name,source)).join('\n')+'\nconst scoreOf=careerScore;careerScore=st=>{log.push("career");return scoreOf(st);};',c);
 return vm.runInContext('const before=JSON.stringify(S),tier=tierOf(bucket),calls=log.slice(),share=defShare(bucket);JSON.stringify({tier,calls,share,base:S.stats[bucket]?scoreOf(S.stats[bucket]):null,unchanged:before===JSON.stringify(S)})',c);};
let tierCells=0;const tiersSeen=new Set();
for(const bucket of Object.keys(finalTH))for(const pos of ['P','IF']){const th=finalTH[bucket],cells=[];
 for(let k=0;k<4;k++)for(const delta of [-1,-0.5,-0.4,0,0.4]){const W=Math.floor(th[k]/13);cells.push(pos==='P'?[{...blank(),W},{sc:th[k]-W*13+delta}]:[{...blank(),H:th[k]},{sc:delta}]);}
 for(const flags of [{},{mvp:1},{aceN:1},{king:1},{mvp:1,king:1},{king:2}])for(const H of [0,th[0]])cells.push([{...blank(),H,W:Math.floor(H/13)},{sc:0,mvp:0,aceN:0,king:0,...flags}]);
 for(const DEF of [-5,undefined,0,7])cells.push([{...blank(),H:120,HR:10,SB:5,RBI:40,BB:20,W:9,SV:3,SO:80,IP:150.1,DEF},{sc:30}]);
 cells.push([undefined,{sc:0}]);
 for(const [st,honor] of cells){const state={pos,stats:st?{[bucket]:st}:{}},A=tierCell(tierBaseline,state,bucket,honor),B=tierCell(GAME_SOURCE,state,bucket,honor),a=JSON.parse(A);
  assert.equal(B,A,`hall-of-fame tier equivalence ${bucket} ${pos} ${JSON.stringify(st)} ${JSON.stringify(honor)}`);assert.ok(a.unchanged);assert.deepEqual(a.calls,st?['honor:'+bucket,'career']:[]);if(a.tier)tiersSeen.add(a.tier.i);tierCells++;}
}
assert.ok(Object.keys(finalTH).length>=4);assert.equal(tierCells,Object.keys(finalTH).length*2*37,'tier equivalence cell count');assert.deepEqual([...tiersSeen].sort(),[0,1,2,3,4]);assertions+=tierCells;
console.log(`${cases.length} synthetic grid + ${special.length} special + ${assertions-cases.length} boundary/characterization cases PASS; production functions verbatim, no game changes`);
export {cases};
