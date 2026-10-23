import assert from 'node:assert/strict';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import {CareerPresenter} from '../docs/src/ui/career-presenter.js';
import {formatRehabStatus} from '../docs/src/ui/condition-view-model.js';
import {contractTypeLabel} from '../docs/src/ui/contract-labels.js';
import {removedTraitLabel} from '../docs/src/engine/trait-policy.js';

// OOP plan §2g: CareerPresenter must return exactly what the game.js builders of 097e212 returned (values and freezing).
const old=execFileSync('git',['show','097e2121f9d97649333b638856bc8f667966a555:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}).replace(/\r\n/g,'\n');
const start=old.indexOf('\nfunction statSummary('),end=old.indexOf('\n',old.indexOf('\nfunction buildCareerViewModel(')+1);
assert.ok(start>0&&end>start);const builders=old.slice(start,end);
const labels=vm.runInNewContext(['ABL','POS_AB','POSN'].map(n=>old.match(new RegExp('^const '+n+'=.*$','m'))[0]).join('\n')+';({ABL,POS_AB,POSN})');
// Argument-revealing stand-ins, identical for both sides, so a miswired dependency changes the output.
const helpers={fmtMoney:y=>'¥'+y,fmtIP:ip=>'IP'+ip,displayTrait:key=>'T:'+key,teamNick:team=>'N:'+team};
function oldModels(S){
  const ctx=vm.createContext({S,...labels,...helpers,formatRehabStatus,removedTraitLabel,contractTypeLabel});
  return vm.runInContext(builders+'\n({player:buildPlayerViewModel(),career:buildCareerViewModel(),ability:buildAbilityViewModel(),traits:buildTraitsViewModel(),record:buildRecordViewModel()})',ctx);
}
// Cross-realm safe: JSON values plus the frozen flag of every object/array node.
const shape=v=>v&&typeof v==='object'?{frozen:Object.isFrozen(v),value:Array.isArray(v)?Array.from(v,shape):Object.fromEntries(Object.entries(v).map(([k,x])=>[k,shape(x)]))}:v===undefined?'<undefined>':v;
let pass=0;const test=(id,fn)=>{fn();pass++;console.log('PASS '+id);};

const stats={G:30,IP:120.1,W:9,L:7,SO:110,PA:410,AB:360,H:101,HR:12,RBI:55};
const fixtures={
  'P minimal':{pos:'P',ab:{sta:40,vel:41,ctl:42,brk:43},year:2030,log:[]},
  'P full':{pos:'P',ab:{sta:61,vel:1,ctl:1,brk:1},pot:{sta:80,vel:54},seasonFactor:.5,injNext:3,tmpInj:2,bigInj:5,rehab:1,skipMid:true,tj:13.47,tjCount:1,traits:{rubber:true,glass:false,mrteam:true},removed:['ジャーニーマン','yips',{name:'clutch'}],
    statsByLevel:{NPB1:stats,NPB_DEV:{G:55,IP:301.1,W:18,L:25,SO:167},A3:stats},log:[{y:2030,age:22,tm:'東京',line:'x'},{y:2031,age:23,tm:'大阪'}],intlCount:2,year:2032,honors:['2031 新人王'],
    ct:{startYear:2031,endYear:2033,contractType:'ROOKIE',remainingYears:2,guaranteedTotal:120000000,postingFee:5000000,annualSchedule:[{year:2031,amount:40000000,paid:true},{year:2032,amount:40000000}]},
    salaryDecisionHistory:[{salaryYear:2031,finalSalary:40000000},{decisionYear:2032,finalSalary:0},{}],currentSalary:40000000,careerSigningBonus:1e8,careerDevelopmentStipend:0,careerOutsideIncome:5,yearOutsideIncome:1,corpIncome:2,incomeLedger:[{year:2031,amountYen:3}],careerEarnings:9},
  'IF contract without schedule':{pos:'IF',ab:{sta:50,con:60,pow:55,spd:45,eye:52,rng:48,fld:50,arm:47},statsByLevel:{KBO2:{PA:0,AB:0},CORP:stats,IND:null},ct:{contractType:'NORMAL',annualSchedule:[]},year:2040,traits:{},removed:[]},
  'OF rehab season':{pos:'OF',ab:{},pot:{con:70},rehab:2,skipMid:true,seasonFactor:0,ct:null,log:null},
};
for(const [name,state] of Object.entries(fixtures))test(name+': presenter equals 097e212 builders',()=>{
  const presenter=new CareerPresenter({getState:()=>state,labels,...helpers});
  const expected=oldModels(structuredClone(state));
  for(const method of ['player','career','ability','traits','record'])assert.deepEqual(shape(presenter[method]()),shape(expected[method]),method);
});
test('state is read on every call (new career after S is reassigned)',()=>{
  let S=fixtures['P minimal'];const presenter=new CareerPresenter({getState:()=>S,labels,...helpers});
  assert.equal(presenter.ability().positionLabel,labels.POSN.P);S=fixtures['IF contract without schedule'];assert.equal(presenter.ability().positionLabel,labels.POSN.IF);
});
console.log(`career-presenter: ${pass} cases PASS.`);
