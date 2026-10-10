import assert from 'node:assert/strict';
import {buildFixedCases,buildSpecialCases,measure,createProductionHarness,leagues,labels,GAME_SOURCE} from './retirement-hof-test-support.mjs';
import {honorScoreFor} from '../docs/src/engine/hall-of-fame-policy.js';
const cases=buildFixedCases();assert.equal(cases.length,160);let assertions=0;
for(const c of cases){const r=measure(c),s=c.stats;assert.ok(s.W+s.L+s.SV+s.HLD<=s.G);if(c.pos!=='P')assert.ok(s.HR<=s.H&&s.H<=s.AB&&s.AB+s.BB===s.PA);assert.equal(r.base,Object.values(r.components).reduce((a,b)=>a+b,0));assert.equal(r.score,Math.round(r.raw));assert.equal(r.tier,r.pureTier);assert.equal(r.inducted,r.hofInfo.length>0);if(r.inducted)assert.ok(Number(r.hofInfo[0].pct)>=75);assert.deepEqual(measure(c),r,'fixed seed narrative replay');assertions++;}
const special=buildSpecialCases();assert.equal(special.length,20);
for(const c of special){const s=c.stats,r=measure(c);assert.ok(s.W+s.L+s.SV+s.HLD<=s.G);if(c.pos!=='P')assert.ok(s.HR<=s.H&&s.H<=s.AB&&s.PA===s.AB+s.BB);assert.equal(r.base,Object.values(r.components).reduce((a,b)=>a+b,0));assert.deepEqual(measure(c),r);}
const blank=()=>({yr:1,G:1,PA:0,AB:0,H:0,HR:0,RBI:0,SB:0,BB:0,W:0,L:0,SV:0,HLD:0,IP:0,SO:0,ER:0,DEF:0,AS:0});
for(const league of leagues){const base={id:'boundary-'+league,seed:'boundary',league,pos:'IF',stats:blank()};const th=measure(base);const h=createProductionHarness({pos:'IF',traits:{},honors:[],stats:{[league]:blank()}});const thresholds=h.snapshot().thresholds[league];
 for(let i=0;i<4;i++)for(const delta of [-1,0,1]){const result=measure({...base,stats:{...blank(),H:thresholds[i]+delta}});assert.equal(result.pureTier,delta<0?i+1:i);assertions++;}
 for(const [award,expected] of [['年間MVP',1],['最優秀投手賞',1],['首位打者',2],['ゴールデングラブ賞',2]]){const r=measure({...base,honors:['2035 '+labels[league]+award]});assert.equal(r.pureTier,4);assert.equal(r.tier,expected);assert.equal(r.candidate,expected===1);assert.equal(r.inducted,false);assertions++;}
 const franchise=measure({...base,franchise:true});assert.equal(franchise.honor.sc,200);assert.equal(measure({...base,intlCount:2,honors:['2035 ワールド・ベースボール・クラシック優勝']}).honor.sc,league==='NPB'?360:0);
 const duplicate='2035 '+labels[league]+'年間MVP';assert.equal(honorScoreFor({bucket:league,honors:[duplicate,duplicate],position:'IF'}).sc,840,'characterize duplicate input, do not silently deduplicate');
 const rounded=measure({...base,stats:{...blank(),H:thresholds[0]-1,SB:1}});assert.equal(rounded.score,thresholds[0]);assert.equal(rounded.tier,1,'threshold evaluated before rounding');assertions+=4;
}
const noHold={id:'hold',league:'NPB',pos:'P',stats:{...blank(),G:500,IP:500,SO:500,W:20,HLD:0}};assert.equal(measure(noHold).base,measure({...noHold,stats:{...noHold.stats,HLD:300,ER:1,L:150}}).base,'HLD/ERA/L not in current score');assertions++;
assert.equal(measure({id:'negative',league:'NPB',pos:'IF',stats:{...blank(),DEF:-100}}).base,0);
assert.ok(Number.isNaN(measure({id:'missing',league:'NPB',pos:'P',stats:{IP:10}}).base),'missing raw stats are not normalized by score');
const both=measure({id:'multiple',league:'CPBL',pos:'IF',stats:{...blank(),H:8600,yr:4},state:{stats:{CPBL:{...blank(),H:8600,yr:4},MLB:{...blank(),H:11000,yr:10}}}});
const multi=createProductionHarness({pos:'IF',lv:'MLB',stage:'PRO',year:2050,traits:{},honors:[],stats:{CPBL:{...blank(),H:8600,yr:4},MLB:{...blank(),H:11000,yr:10}},teamTally:{}},'multi');multi.run("retireScene({CPBL:tierOf('CPBL'),MLB:tierOf('MLB')})");assert.equal(multi.snapshot().state.hofInfo.length,2);assert.equal(multi.snapshot().state.legendLeague,'メジャーリーグ','first-ballot league must exclude later-ballot inductees');assertions+=3;
assert.match(GAME_SOURCE,/NPB2:[^\n]+statBucket:'NPB'/);assert.match(GAME_SOURCE,/KBO2:[^\n]+statBucket:'KBO'/);assert.match(GAME_SOURCE,/CPBL2:[^\n]+statBucket:'CPBL'/);assertions+=3;
console.log(`${cases.length} synthetic grid + ${special.length} special + ${assertions-cases.length} boundary/characterization cases PASS; production functions verbatim, no game changes`);
export {cases};
