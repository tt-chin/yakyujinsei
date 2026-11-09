import assert from 'node:assert/strict';
import {evaluateLeagueHof,hofHonorBreakdown} from '../docs/src/engine/hof-evaluation-policy.js';
const levels={NPB:'NPB1',MLB:'MLB',KBO:'KBO1',CPBL:'CPBL1'},names={NPB:'NPB',MLB:'メジャーリーグ',KBO:'KBO',CPBL:'台湾プロ野球'},th=[8000,5000,2000,500];
const blank=()=>({yr:1,G:1,PA:1,AB:1,H:0,HR:0,RBI:0,SB:0,BB:0,DEF:0,W:0,SV:0,SO:0,IP:0});
let count=0;
for(const [lg,level]of Object.entries(levels)){
 const state={pos:'IF',stats:{[lg]:{...blank(),H:20000}},statsByLevel:{[level]:{...blank(),H:100}},honors:[],traits:{},intlCount:99};const before=structuredClone(state);
 assert.equal(evaluateLeagueHof(state,lg,th,names[lg]).rawSc,100);assert.equal(evaluateLeagueHof({...state,statsByLevel:{}},lg,th,names[lg]).rawSc,0,'unknown historical levels cannot become first-team');assert.deepEqual(state,before);
 for(const [h,rank,reason]of [['年間MVP',1,'MVP受賞による評価'],['最優秀投手賞',1,'最優秀投手賞受賞による評価'],['首位打者',2,'部門賞受賞による評価']]){
  const text='2035 '+names[lg]+h,s={...state,honors:[text,text]};const r=evaluateLeagueHof(s,lg,th,names[lg]);assert.equal(r.i,rank);assert.equal(r.reason,reason);assert.equal(r.details.personal.length,1);assert.equal(r.details.personal[0].year,2035);assert.deepEqual(s.honors,[text,text]);count++;
 }
 for(const other of Object.keys(levels).filter(x=>x!==lg))assert.equal(hofHonorBreakdown({...state,honors:['2035 '+names[lg]+'年間MVP']},other).honor.sc,0,'no award copied to another league');
 assert.equal(hofHonorBreakdown({...state,honors:['2035 年間MVP']},lg).honor.sc,0);
 const intl={...state,honors:['2035 ワールド・ベースボール・クラシック優勝','2036 WBSCプレミア12MVP']};assert.equal(hofHonorBreakdown(intl,lg).honor.sc,0);assert.equal(hofHonorBreakdown(intl,lg).international.length,2);assert.equal(evaluateLeagueHof(intl,lg,th,names[lg]).i,4);
 const title={NPB:'日本一',MLB:'ワールドシリーズチャンピオン',KBO:'韓国シリーズ優勝',CPBL:'台湾シリーズ優勝'}[lg];const won={year:2035,league:lg,level,won:true,eligible:true};
 const champs=hofHonorBreakdown({...state,championshipResults:{2035:won},honors:['2035 '+title,'2035 '+title]},lg);assert.equal(champs.team.length,1);assert.equal(champs.honor.sc,90);count+=6;
 for(const delta of [-.01,0,.01]){const s={...state,statsByLevel:{[level]:{...blank(),H:8000+delta}}},r=evaluateLeagueHof(s,lg,th,names[lg]);assert.equal(r.i,delta<0?1:0);assert.equal(r.rawSc,8000+delta);count++;}
 const near=evaluateLeagueHof({...state,statsByLevel:{[level]:{...blank(),H:7999.999}}},lg,th,names[lg]);assert.equal(near.i,1);assert.equal(near.belowThreshold,true);count++;
}
const mixed={pos:'P',stats:{NPB:{...blank(),W:999}},statsByLevel:{NPB1:{...blank(),W:10},NPB2:{...blank(),W:989},A3:{...blank(),W:999}},honors:[]};assert.equal(evaluateLeagueHof(mixed,'NPB',th,'NPB').base,130);assert.equal(evaluateLeagueHof(mixed,'MLB',th,'MLB').base,0);count+=2;
console.log('PASS '+count+' approved HOF policy checks; full input immutable');

for(const league of Object.keys(levels)){
 const s={pos:'IF',traits:{franchise:true},honors:[]};assert.equal(hofHonorBreakdown(s,league).honor.sc,0,'old boolean has no inferred league');
 s.franchiseAchievement={year:2035,league:'NPB',teamId:'npb-01'};assert.equal(hofHonorBreakdown(s,league).honor.sc,league==='NPB'?200:0);
}
console.log('PASS franchise: old unknown withheld, one proven league only; traits unchanged');

assert.equal(evaluateLeagueHof({pos:'P',statsByLevel:{NPB1:{W:NaN}},honors:[]},'NPB',th,'NPB').hasFirstTeam,false);
console.log('PASS malformed first-team data is unknown, never inferred or rewritten');
