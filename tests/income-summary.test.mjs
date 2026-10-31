import assert from 'node:assert/strict';
import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
import {incomeSummary} from '../docs/src/ui/income-summary.js';
import {productionFunction} from './retirement-hof-test-support.mjs';
const cases=[
  ['pro',{careerBaseSalary:120000000,careerIncentive:5000000,careerSigningBonus:10000000,careerEarnings:135000000},120000000],
  ['corporate',{corpIncome:12600000,careerEarnings:12600000},12600000],
  ['mixed',{careerBaseSalary:503000000,corpIncome:12600000,careerIncentive:4000000,careerSigningBonus:30000000,careerDevelopmentStipend:3000000,careerBuyout:10000000,careerOutsideIncome:2000000,careerEarnings:564600000},515600000],
  ['buyout',{careerBaseSalary:10000000,careerBuyout:7000000,careerEarnings:17000000},10000000],
  ['missing',{},0],['legacy numeric strings',{careerBaseSalary:'12000000',corpIncome:'4200000',careerEarnings:'16200000'},16200000],
  ['invalid',{careerBaseSalary:NaN,corpIncome:Infinity,careerEarnings:undefined},0]
];
for(const [id,state,pay] of cases){
  Object.freeze(state);const before=JSON.stringify(state),rows=incomeSummary(state);
  assert.equal(rows[0].amount,pay,id);assert.equal(rows.at(-1).key,'total');
  assert.equal(rows.at(-1).amount,Number(state.careerEarnings)||0,'total comes directly from stored total');
  assert.deepEqual(rows.map(r=>r.label),['年俸・報酬','出来高','契約金・支度金','契約解除補償金','スポンサー収入','生涯総収入']);
  assert.ok(rows.every(r=>Number.isFinite(r.amount)&&Object.isFrozen(r)));assert.ok(Object.isFrozen(rows));
  assert.equal(JSON.stringify(state),before);assert.deepEqual(incomeSummary(state),rows);
}
assert.equal(incomeSummary(null).at(-1).amount,0);
// This is a display change, not permission to change any acquisition formula.
const old=execFileSync('git',['show','2e69096:docs/src/engine/game.js'],{encoding:'utf8',maxBuffer:20e6}),now=fs.readFileSync('docs/src/engine/game.js','utf8');
for(const name of ['phaseEnd','runDraft'])assert.equal(productionFunction(name,now),productionFunction(name,old),name+' payment rules unchanged');
const contractSource=fs.readFileSync('docs/src/engine/career-contract.js','utf8'),moved=productionFunction('finalizePendingOffseasonSalary',contractSource),read='\n    const S=getState();';
assert.equal(moved.split(read).length,2,'one state read inserted');assert.equal(moved.replace(read,''),productionFunction('finalizePendingOffseasonSalary',old).replace(/\r\n/g,'\n'),'finalizePendingOffseasonSalary payment rules unchanged');
{const source=fs.readFileSync('docs/src/engine/career-movement.js','utf8'),moved=productionFunction('buyoutRemaining',source),read='\n    const S=getState();';
 assert.equal(moved.split(read).length,2,'one state read inserted');assert.equal(moved.replace(read,'').replace(/^  /gm,''),productionFunction('buyoutRemaining',old).replace(/\r\n/g,'\n'),'buyoutRemaining payment rules unchanged');}
console.log('7 income display fixtures, legacy/missing/frozen/repeat, exact stored total, four native payment functions unchanged: PASS');
