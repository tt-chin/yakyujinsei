import assert from 'node:assert/strict';
import fs from 'node:fs';
import { contractTypeLabel } from '../docs/src/ui/contract-labels.js';
import { appendExtension, createContract, deriveContractTotals, markSalaryPaid, normalizeContract } from '../docs/src/engine/contract-policy.js';

const labels={CONTROL:'球団保有期間',DEVELOPMENT:'育成契約',ROOKIE:'ルーキー契約',NORMAL:'通常契約',EXTENSION:'契約延長',ARBITRATION:'年俸調停',LONG:'長期契約',SHORT:'短期契約',PROOF:'再起契約',RETURN:'残留契約',FA_RETURN:'FA後再契約',OVERSEAS_FA:'海外FA契約'};
for(const [code,label] of Object.entries(labels))assert.equal(contractTypeLabel(code),label);

const verify=contract=>{const c=deriveContractTotals(contract);assert.equal(c.annualSchedule.length,c.years);assert.equal(c.startYear,c.annualSchedule[0].year);assert.equal(c.endYear,c.annualSchedule.at(-1).year);assert.equal(c.guaranteedTotal,c.annualSchedule.reduce((n,x)=>n+x.amount,0));assert.equal(c.remainingYears,c.annualSchedule.filter(x=>!x.paid).length);assert.equal(c.remainingValue,c.annualSchedule.filter(x=>!x.paid).reduce((n,x)=>n+x.amount,0));return c;};
let contract=verify(createContract({contractId:'T',org:'NPB',teamId:'NPB_1',signedYear:2031,startYear:2032,years:2,annualSalary:5_060_000,contractType:'CONTROL'}));
contract=verify(markSalaryPaid(contract,2032).contract);
assert.equal(contract.remainingYears,1);
for(const [type,years] of [['NORMAL',1],['FA_RETURN',3],['OVERSEAS_FA',4],['ARBITRATION',1]])verify(createContract({contractId:`T:${type}`,org:type==='OVERSEAS_FA'?'MLB':'NPB',teamId:'TEAM',signedYear:2032,startYear:2033,years,annualSalary:12_340_000,contractType:type}));
const extended=verify(appendExtension(createContract({contractId:'T:EXT',org:'NPB',teamId:'NPB_1',signedYear:2031,startYear:2032,years:2,annualSalary:5_000_000,contractType:'CONTROL'}),{signedYear:2032,startYear:2034,years:3,annualSalary:8_000_000,contractType:'EXTENSION'}));
assert.equal(extended.annualSchedule.length,5);
assert.equal(extended.segments.length,2);
const legacy=verify(normalizeContract({org:'NPB',teamId:'NPB_1',remainingYears:2,annualSalary:6_000_000,contractType:'CONTROL'},{currentYear:2032,currentSalary:6_000_000}));
assert.equal(legacy.schemaVersion,3);

const sources=['../docs/index.html','../docs/src/ui/ability-view.js','../docs/src/ui/player-detail.js','../docs/src/ui/salary-detail.js','../docs/src/engine/game.js'].map(read=>fs.readFileSync(new URL(read,import.meta.url),'utf8')).join('\n');
for(const stale of ['年度schedule','alt="結算圖"','ペレットの評価','ペレットの冷間処理','健忘症が治った','隠し属性解放','巨大な最低点','アップグレードの通知'])assert.doesNotMatch(sources,new RegExp(stale));
assert.match(sources,/年度別年俸/);
assert.match(sources,/失った特性/);
console.log('Japanese copy and contract UI checks passed.');
