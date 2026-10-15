import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {productionFunction} from './retirement-hof-test-support.mjs';
import {appendSalaryEvaluation} from '../docs/src/engine/salary-evaluation-policy.js';
import * as receipts from '../docs/src/engine/award-transaction-policy.js';
const source=fs.readFileSync('docs/src/engine/game.js','utf8');let pass=0;
for(const failAfter of [null,0,1]){
 const state={seed:'evaluation-native',year:2039,marketInjury:'HEALTHY',salaryEvaluationHistory:[],lastSalaryEvaluation:null},entry={schemaVersion:1,year:2039,payD:4,source:'fixture'};
 let injected=false,index=0;
 const c=vm.createContext({S:state,appendSalaryEvaluation,...receipts,commitAwardReceipt:(token,id)=>receipts.commitAwardReceipt(token,id,()=>{if(!injected&&index++===failAfter){injected=true;throw Error('EVALUATION_AFTER_WRITE');}})});
  const native=source.slice(source.indexOf('  function saveSalaryEvaluation('),source.indexOf('  recordSalaryEvaluation=function('));
  assert(native.trim().endsWith('}'));vm.runInContext(native,c);c.entry=entry;
 if(failAfter!==null)assert.throws(()=>vm.runInContext('saveSalaryEvaluation(entry)',c),/EVALUATION_AFTER_WRITE/);
 vm.runInContext('saveSalaryEvaluation(entry)',c);const saved=structuredClone(state);vm.runInContext('saveSalaryEvaluation(entry)',c);assert.deepEqual(state,saved);
 assert.equal(state.salaryEvaluationHistory.length,1);assert.deepEqual(state.lastSalaryEvaluation,{...entry,marketInjury:'HEALTHY'});pass++;
}
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'NATIVE_GAME_FUNCTION plus actual Receipt; controlled write fault, not natural UI fault'}));
