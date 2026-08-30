import assert from 'node:assert/strict';
import { createSalaryDetailController, salaryDetailMarkup } from '../docs/src/ui/salary-detail.js';

const fmtMoney=value=>`${Math.round(value/10000).toLocaleString()}万円`;
const decision={salaryYear:2028,previousSalary:38_000_000,finalSalary:46_000_000,changeAmount:8_000_000,changeRate:.211,sourceLevel:'NPB2',targetLevel:'NPB1',sourceMarketRating:5.2,convertedMarketRating:-.8,baseSalary:40_000_000,positionMultiplier:1.15,contractMultiplier:1,marketComponents:[{year:2027,payD:5.25,weight:.6,contribution:3.15}],currentEvaluation:{baseD:3.2,performanceAdjustment:1.4,workloadAdjustment:.3,awardAdjustment:.35,payD:5.25},reasonCodes:['STRONG_PERFORMANCE']};
const html=salaryDetailMarkup(decision,{fmtMoney,currentSalary:46_000_000,isProfessional:true});
assert.match(html,/4,600万円/);assert.match(html,/\+800万円/);assert.match(html,/\+21\.1%/);assert.match(html,/2027.*60% = 3\.15/s);assert.match(html,/今季の実績が市場評価を押し上げました/);
assert.match(salaryDetailMarkup(null,{fmtMoney,currentSalary:0,isProfessional:false}),/プロ契約はまだありません/);

const element=()=>({listeners:{},hidden:true,innerHTML:'',focused:false,addEventListener(type,fn){this.listeners[type]=fn;},focus(){this.focused=true;}});
const trigger=element(),panel=element(),closeButton=element(),title=element(),body=element();
const doc={activeElement:trigger,listeners:{},body:{classes:new Set(),classList:{add(v){doc.body.classes.add(v);},remove(v){doc.body.classes.delete(v);}}},addEventListener(type,fn){this.listeners[type]=fn;}};
createSalaryDetailController({trigger,panel,closeButton,title,body,getDecision:()=>decision,getCurrentSalary:()=>46_000_000,isProfessional:()=>true,fmtMoney,documentRef:doc});
const before=JSON.stringify(decision);trigger.listeners.click();assert.equal(panel.hidden,false);assert.equal(closeButton.focused,true);doc.listeners.keydown({key:'Escape'});assert.equal(panel.hidden,true);assert.equal(trigger.focused,true);
trigger.listeners.keydown({key:'Enter',preventDefault(){}});assert.equal(panel.hidden,false);closeButton.listeners.click();trigger.listeners.keydown({key:' ',preventDefault(){}});assert.equal(panel.hidden,false);assert.equal(JSON.stringify(decision),before);
console.log('salary detail UI tests passed');
