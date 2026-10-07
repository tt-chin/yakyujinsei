import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createContract,normalizeContract,markSalaryPaid,appendExtension,transferContract,calculateScheduledBuyout} from '../docs/src/engine/contract-policy.js';
import {acceptDraftSelection} from '../docs/src/engine/draft-signing-policy.js';
import {salaryDetailMarkup,createSalaryDetailController} from '../docs/src/ui/salary-detail.js';
import {applyIncentivePayment,createIncentiveTerms} from '../docs/src/engine/incentive-policy.js';
const fmtMoney=n=>n===0?'0円':`${(n/10000).toLocaleString('ja-JP')}万円`;
const base={contractId:'D',org:'NPB',teamId:'TEAM',signedYear:2028,startYear:2029,years:1,annualSalary:12_000_000,contractType:'CONTROL',signingBonus:32_160_000,incentive:{annualMax:840_000}};
for(const type of ['ROSTER','DEVELOPMENT']){
  const s={draftRights:{status:'NEGOTIATING'},careerSigningBonus:0,careerEarnings:0,careerBaseSalary:0};
  acceptDraftSelection({state:s,type,round:5,teamId:'TEAM',bonus:base.signingBonus,sign:t=>Object.assign(s,{stage:'PRO',org:'NPB',lv:t.level,orgTeamId:'TEAM',currentSalary:t.rookieSalary,ct:createContract({...base,annualSalary:t.rookieSalary,contractType:t.contractType})})});
  assert.equal(s.ct.signingBonus,32_160_000);assert.equal(s.careerEarnings,32_160_000);assert.equal(s.careerSigningBonus,32_160_000);assert.equal(s.careerBaseSalary,0);
}
const ct=createContract(base),snapshot=JSON.stringify(ct);
let html=salaryDetailMarkup(null,{fmtMoney,contract:ct,isProfessional:true,currentSalary:ct.annualSalary});
for(const row of ['契約金</dt><dd>3,216万円','年俸</dt><dd>1,200万円','保証年俸総額</dt><dd>1,200万円','未払い年俸</dt><dd>1,200万円','支払済み</dt><dd>0円'])assert.ok(html.includes(row),row);
assert.equal(JSON.stringify(ct),snapshot);
const payment=markSalaryPaid(ct,2029);assert.equal(payment.amount,12_000_000);assert.equal(payment.contract.signingBonus,32_160_000);assert.equal(payment.contract.annualSalary,0);
html=salaryDetailMarkup(null,{fmtMoney,contract:payment.contract});assert.ok(html.includes('年俸</dt><dd>1,200万円'));assert.ok(html.includes('未払い年俸</dt><dd>0円'));
const paidState={careerSigningBonus:32_160_000,careerBaseSalary:payment.amount,careerEarnings:32_160_000+payment.amount,careerIncentive:0,yearlyIncentivePaid:{}};
assert.equal(paidState.careerEarnings,44_160_000);
const incentiveContract={...payment.contract,incentive:createIncentiveTerms({org:'NPB',annualSalary:12_000_000})},options={contract:incentiveContract,evaluation:{payD:5,sampleStatus:'FULL'},honors:['2029 NPB年間MVP'],year:2029};
const once=applyIncentivePayment(paidState,options),twice=applyIncentivePayment(once.state,options);assert.equal(once.state.careerEarnings,45_000_000);assert.equal(once.state.careerIncentive,840_000);assert.equal(twice.paid,false);assert.equal(twice.state.careerEarnings,45_000_000);assert.equal(incentiveContract.signingBonus,32_160_000);
const extension=appendExtension(ct,{signedYear:2029,startYear:2030,years:2,annualSalary:20_000_000});assert.equal(extension.signingBonus,32_160_000);assert.equal(extension.guaranteedTotal,52_000_000);
assert.equal(transferContract(extension,{org:'NPB',teamId:'OTHER'}).signingBonus,32_160_000);assert.equal(calculateScheduledBuyout(extension,1).buyoutAmount,52_000_000);
for(const version of [2,3]){const old={...ct,schemaVersion:version};delete old.signingBonus;assert.equal(normalizeContract(old).signingBonus,0);}
assert.equal(normalizeContract({yrs:1,annualSalary:12_000_000},{currentYear:2029}).signingBonus,0);
for(const org of ['NPB','MLB','KBO','CPBL']){const normal=createContract({...base,org,signingBonus:0});assert.doesNotMatch(salaryDetailMarkup(null,{fmtMoney,contract:normal}),/<dt>契約金<\/dt>/);assert.equal(normal.guaranteedTotal,12_000_000);}
const element=()=>({hidden:true,innerHTML:'',addEventListener(){},focus(){}}),body=element(),income={signing:32_160_000,base:12_000_000,incentive:840_000,buyout:2_000_000,outside:3_000_000,yearOutside:100_000,corp:4_000_000,total:54_000_000},saved=JSON.stringify(income);
const controller=createSalaryDetailController({trigger:element(),panel:element(),closeButton:element(),title:element(),body,getDecision:()=>null,getCurrentSalary:()=>12_000_000,getContract:()=>ct,getIncome:()=>income,isProfessional:()=>true,fmtMoney,documentRef:{activeElement:null,body:{classList:{add(){},remove(){}}},addEventListener(){}}});
controller.open();controller.open();assert.equal(JSON.stringify(income),saved);assert.match(body.innerHTML,/<h3>所得内訳<\/h3>/);for(const label of ['契約金累計','固定年俸累計','出来高累計','買い取り累計','スポンサー収入累計','社会人給与累計'])assert.ok(body.innerHTML.includes(label));assert.ok(body.innerHTML.includes('生涯総収入</dt><dd>5,400万円'));
const game=readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');assert.match(game,/signingBonus:bonus,startYear:S.year\+1/);assert.match(game,/signingBonus:options.signingBonus\?\?0/);assert.doesNotMatch(game,/careerEarnings[^;\n]*ct.signingBonus/);
console.log('Draft bonus display: income once, paid/schedule, legacy, extension/transfer/buyout and read-only UI passed.');
