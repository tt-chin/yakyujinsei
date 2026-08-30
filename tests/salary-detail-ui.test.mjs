import assert from 'node:assert/strict';
import { createSalaryDetailController, salaryDetailMarkup } from '../docs/src/ui/salary-detail.js';

const fmtMoney=value=>`${Math.round(value/10000).toLocaleString()}万円`;
const decision={salaryYear:2028,previousSalary:38_000_000,finalSalary:46_000_000,changeAmount:8_000_000,changeRate:.211,sourceLevel:'NPB2',targetLevel:'NPB1',sourceMarketRating:5.2,convertedMarketRating:-.8,baseSalary:40_000_000,positionMultiplier:1.15,contractMultiplier:1,org:'MLB',contractStage:'ARBITRATION',serviceYears:4,marketInjury:'MAJOR',injuryMultiplier:.82,decreaseProtectionApplied:true,arbitration:{clubSalary:42_000_000,playerSalary:48_000_000,winChance:79,result:'WON'},marketComponents:[{year:2027,payD:5.25,weight:.6,contribution:3.15}],currentEvaluation:{baseD:3.2,performanceAdjustment:1.4,workloadAdjustment:.3,awardAdjustment:.35,payD:5.25},reasonCodes:['STRONG_PERFORMANCE']};
const contract={schemaVersion:3,contractType:'LONG',startYear:2028,endYear:2029,guaranteedTotal:92_000_000,paidTotal:46_000_000,remainingValue:46_000_000,incentive:{annualMax:3_220_000},offerBreakdown:{marketSalary:40_000_000,injuryMultiplier:.82,positionMultiplier:1.15,contractTypeMultiplier:.95,teamDemandMultiplier:1.05,competitionMultiplier:1.025,finalAnnualSalary:46_000_000},annualSchedule:[{year:2028,amount:46_000_000,paid:true},{year:2029,amount:46_000_000,paid:false}],segments:[{type:'LONG',startYear:2028,endYear:2029,annualSalary:46_000_000}]};
const html=salaryDetailMarkup(decision,{fmtMoney,currentSalary:46_000_000,isProfessional:true,contract});
assert.match(html,/4,600万円/);assert.match(html,/\+800万円/);assert.match(html,/\+21\.1%/);assert.match(html,/2027.*60% = 3\.15/s);assert.match(html,/今季の実績が市場評価を押し上げました/);
assert.match(html,/9,200万円/);assert.match(html,/支払済/);assert.match(html,/予定/);assert.match(html,/契約セグメント/);
assert.match(html,/出来高/);assert.match(html,/FAオファー内訳/);assert.match(html,/球団需要/);assert.match(html,/競合補正/);
assert.match(html,/MLB年俸調停対象（在籍4年）/);assert.match(html,/大きな故障/);assert.match(html,/×0\.82/);assert.match(html,/前年の75%/);assert.match(html,/年俸調停結果/);
assert.match(salaryDetailMarkup(null,{fmtMoney,currentSalary:0,isProfessional:false}),/プロ契約はまだありません/);

const element=()=>({listeners:{},hidden:true,innerHTML:'',focused:false,addEventListener(type,fn){this.listeners[type]=fn;},focus(){this.focused=true;}});
const trigger=element(),panel=element(),closeButton=element(),title=element(),body=element();
const doc={activeElement:trigger,listeners:{},body:{classes:new Set(),classList:{add(v){doc.body.classes.add(v);},remove(v){doc.body.classes.delete(v);}}},addEventListener(type,fn){this.listeners[type]=fn;}};
createSalaryDetailController({trigger,panel,closeButton,title,body,getDecision:()=>decision,getCurrentSalary:()=>46_000_000,getContract:()=>contract,isProfessional:()=>true,fmtMoney,documentRef:doc});
const before=JSON.stringify(decision);trigger.listeners.click();assert.equal(panel.hidden,false);assert.equal(closeButton.focused,true);doc.listeners.keydown({key:'Escape'});assert.equal(panel.hidden,true);assert.equal(trigger.focused,true);
trigger.listeners.keydown({key:'Enter',preventDefault(){}});assert.equal(panel.hidden,false);closeButton.listeners.click();trigger.listeners.keydown({key:' ',preventDefault(){}});assert.equal(panel.hidden,false);assert.equal(JSON.stringify(decision),before);
console.log('salary detail UI tests passed');
