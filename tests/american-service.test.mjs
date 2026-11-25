import assert from 'node:assert/strict';
import {MovementGate} from '../docs/src/engine/movement-gate.js';
import {CareerMovement} from '../docs/src/engine/career-movement.js';
import {leagueTables} from '../docs/src/engine/league-catalog.js';
import {getContractStage,reconcileAmericanCareer,reliableMlbServiceYears,migrateServiceTime} from '../docs/src/engine/control-period-policy.js';

// Regression first: a MiLB-origin player is already playing MLB, but the old
// movement entry neither accrues MLB service nor leaves CONTROL.
const state={stage:'PRO',org:'MiLB',lv:'MLB',year:2035,seasonFactor:1,serviceTime:{NPB:0,MLB:5,KBO:0,CPBL:0},serviceTimeAccruedYear:2034};
let stage;
const gate=new MovementGate({getState:()=>state,migrateSalaryV130State:()=>{},amateurCareer:{seasonEndMovement:()=>false},accrueForeignFirstTeamSeason:()=>{},contractStageFor:org=>getContractStage({org,serviceYears:state.serviceTime[org]}),careerMovement:{movement:()=>{stage=getContractStage({org:state.org,serviceYears:state.serviceTime[state.org]});}},restorePendingChoice:()=>true});
gate.movement();
assert.equal(state.serviceTime.MLB,6,'MLB level accrues qualified service after a MiLB start');
assert.equal(stage,'FA','six qualified seasons reach FA contract stage');
console.log('PASS MiLB-origin MLB six-year service regression');
assert.equal(getContractStage({org:'MiLB',level:'MLB',serviceYears:6}),'FA');
assert.equal(getContractStage({org:'MLB',level:'A3',serviceYears:6}),'CONTROL','minor level is never an unconditional FA exception');

for(const org of ['MiLB','MLB'])for(const lv of ['MLB','A3','A2','A1','R'])for(const factor of [0,.49,.5,1])for(const years of [2,5]){
 const s={stage:'PRO',org,lv,year:2030,seasonFactor:factor,serviceTime:{NPB:2,MLB:years,KBO:3,CPBL:4},serviceTimeAccruedYear:null};
 const deps={getState:()=>s,migrateSalaryV130State:()=>{},amateurCareer:{seasonEndMovement:()=>false},accrueForeignFirstTeamSeason:()=>{},contractStageFor:org=>getContractStage({org,serviceYears:s.serviceTime[org]}),careerMovement:{movement(){}},restorePendingChoice:()=>true};
 new MovementGate(deps).movement();
 const expected=years+(lv==='MLB'&&factor>=.5?1:0);
 assert.equal(s.org,lv==='MLB'?'MLB':'MiLB');assert.equal(s.serviceTime.MLB,expected);assert.equal(s.serviceTimeAccruedYear,2030);
 // A new controller simulates read/retry losing ephemeral WeakMap guards.
 new MovementGate(deps).movement();assert.equal(s.serviceTime.MLB,expected,'persisted year marker prevents repeat accrual');
 assert.deepEqual([s.serviceTime.NPB,s.serviceTime.KBO,s.serviceTime.CPBL],[2,3,4]);
 if(lv==='MLB')assert.equal(getContractStage({org:s.org,serviceYears:expected}),expected>=6?'FA':expected>=3?'ARBITRATION':'CONTROL');
}
const proof={stage:'PRO',org:'MiLB',lv:'MLB',year:2035,serviceTime:{NPB:7,MLB:1,KBO:2,CPBL:3},stats:{MLB:{yr:99}},log:[
 {y:2030,level:'MLB',seasonFactor:1},{y:2030,level:'MLB',seasonFactor:1},
 {y:2031,level:'MLB',seasonFactor:.5},{y:2032,level:'MLB',seasonFactor:.49},
 {y:2033,level:'A3',seasonFactor:1},{y:2034,level:'MLB'},{y:2035,level:'MLB',seasonFactor:1},
 {y:2036,level:'MLB',seasonFactor:1}]};
assert.equal(reliableMlbServiceYears(proof),2,'only explicit completed qualified years count, once');
assert.equal(reliableMlbServiceYears({...proof,serviceTimeAccruedYear:2035}),3);
assert.equal(reliableMlbServiceYears({...proof,year:undefined}),1,'without an exact current year, no historical seasons are invented');
assert.equal(reliableMlbServiceYears({...proof,log:[{y:2030,level:'MLB',seasonFactor:1},{y:2030,level:'A3',seasonFactor:1}]}),1,'ambiguous same-year levels do not fabricate service');
reconcileAmericanCareer(proof);const repaired=structuredClone(proof);reconcileAmericanCareer(proof);assert.deepEqual(proof,repaired,'compatibility is idempotent');
assert.deepEqual(migrateServiceTime({stats:{MLB:{yr:20},KBO:{yr:2},CPBL:{yr:3}},npbFaSeasons:4}),{NPB:4,MLB:0,KBO:2,CPBL:3});
for(const org of ['NPB','KBO','CPBL']){const s={stage:'PRO',org,lv:org+'1',serviceTime:{NPB:7,MLB:2,KBO:3,CPBL:4},log:proof.log},before=structuredClone(s);reconcileAmericanCareer(s);assert.deepEqual(s,before);}
console.log('PASS 80 US level/workload/boundary/retry cases; explicit legacy proof, no aggregate inference, non-US invariance');

const {levels:LV,paths:PATHS}=leagueTables();
function nativeMovement(s,{overall=65,offerExtension=false}={}){
 const calls=[],deps={getState:()=>s,LV,PATHS,careerSession:{},ovr:()=>overall,slgOf:()=>.5,teamNick:String,displayTrait:String,
  contractStageFor:org=>getContractStage({org,serviceYears:s.serviceTime?.[org]||0,faEligible:s.faElig}),serviceYearsFor:org=>s.serviceTime?.[org]||0,
  migrateSalaryV130State:()=>reconcileAmericanCareer(s),accrueForeignFirstTeamSeason:()=>{},
  card:(...args)=>calls.push(['card',...args]),board:()=>{},traitCard:()=>{},applyPromotionSalary:()=>{},applyDemotionSalary:()=>{},removeTrait:()=>{},
  crossOffers:()=>calls.push(['cross']),markClubInitiatedRenewal:()=>calls.push(['control']),renewAndAdvance:(_m,_a,kind)=>calls.push(['renew',kind]),
  arbitrationFlow:()=>calls.push(['arbitration']),faMarket:()=>calls.push(['FA']),extensionOffer:()=>calls.push(['extension']),reportFlowOutcome:v=>calls.push(['outcome',v.kind]),
  rng:{chance:()=>offerExtension,R:()=>.5,ri:a=>a}};
 const movement=new CareerMovement(deps);movement.movement();return calls;
}
const player=(patch={})=>({stage:'PRO',org:'MiLB',lv:'MLB',year:2030,pos:'P',age:27,traits:{},serviceTime:{MLB:0},svc:50,svcOrg:'MiLB',ct:{remainingYears:0},seasonFactor:1,lastD:2,lastSt:{IP:100,H:80,BB:20,ER:30},teamYears:0,...patch});
for(const years of [2,3,5,6])for(const remaining of [0,1,3]){
 const s=player({serviceTime:{MLB:years},ct:{remainingYears:remaining}}),contract=structuredClone(s.ct),calls=nativeMovement(s);
 if(remaining===0)assert.ok(calls.some(c=>c[0]===(years<3?'control':years<6?'arbitration':'FA')),JSON.stringify({years,remaining,calls}));
 else{assert.ok(!calls.some(c=>['FA','arbitration','renew','control'].includes(c[0])));assert.deepEqual(s.ct,contract,'active multi-year contract is not terminated');}
 assert.equal(s.org,'MLB');assert.equal(s.faElig,years>=3,'legacy five-season flag cannot replace MLB service stage');
}
{const s=player({serviceTime:{MLB:6},ct:{remainingYears:1}});assert.ok(nativeMovement(s,{offerExtension:true}).some(c=>c[0]==='extension'));assert.equal(s.ct.remainingYears,1,'normal extension offer retains the existing contract');}
{const s=player({lv:'A3',org:'MiLB',ct:{remainingYears:2}});nativeMovement(s);assert.equal(s.lv,'MLB');assert.equal(s.org,'MLB');assert.equal(s.serviceTime.MLB,0,'promotion does not retroactively count a minor season');}
{const s=player({org:'MLB',ct:{remainingYears:1},lastD:-7,lastSt:null,serviceTime:{MLB:2}});nativeMovement(s,{overall:55});assert.equal(s.lv,'A3');assert.equal(s.org,'MiLB');s.lastD=2;nativeMovement(s);assert.equal(s.lv,'MLB');assert.equal(s.org,'MLB');assert.equal(s.serviceTime.MLB,2);}
console.log('PASS native CareerMovement: 2/3/5/6 service stages, expired vs active contracts, extension, promotion/demotion/re-promotion');
