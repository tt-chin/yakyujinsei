// PLY-01 jersey policy (tasks/PLY_01_JERSEY_PLAN.md D1-D4, W3-W6, J1-J7): pure rules, no RNG, append-only history.
import assert from 'node:assert/strict';
import test from 'node:test';
import {JERSEY_NUMBERS,JERSEY_DEFAULT_ORDER,isJerseyNumber,defaultJerseyNumber,lastJerseyRecord,isJerseyEligible,jerseyEntryPending,currentJerseyNumber,canChangeJersey,proposedJerseyNumber,isLegacyJerseyEntry,appendJerseyRecord,jerseyRecordForYear,yearlyJerseyLabel,jerseyPeriods} from '../docs/src/engine/jersey-policy.js';

const pro=(over={})=>({stage:'PRO',org:'NPB',lv:'NPB1',orgTeamId:'NPB-YB',year:2030,pos:'IF',log:[],...over});

test('numbers: 0, 00 and 1-99 as distinct strings',()=>{
  assert.equal(JERSEY_NUMBERS.length,101);
  assert.deepEqual(JERSEY_NUMBERS.slice(0,3),['0','00','1']);
  assert.equal(JERSEY_NUMBERS.at(-1),'99');
  assert.ok(isJerseyNumber('0')&&isJerseyNumber('00')&&isJerseyNumber('99'));
  for(const bad of [0,6,'100','06','-1','',null,undefined,' 6'])assert.equal(isJerseyNumber(bad),false,String(bad));
});
test('W3 default order per position; D2 empty ban list gives the first candidate',()=>{
  assert.deepEqual(Object.fromEntries(Object.keys(JERSEY_DEFAULT_ORDER).map(k=>[k,defaultJerseyNumber(k)])),{P:'18',C:'27',IF:'6',OF:'1'});
  assert.equal(defaultJerseyNumber('IF',['6','5']),'7');
  assert.equal(defaultJerseyNumber('OF',[...JERSEY_DEFAULT_ORDER.OF]),'0','falls through to the full list');
  assert.equal(defaultJerseyNumber('P',JERSEY_NUMBERS),null);
  for(const order of Object.values(JERSEY_DEFAULT_ORDER))for(const n of order)assert.ok(isJerseyNumber(n),n);
});
test('W6 eligibility: professional stage with a team only',()=>{
  assert.equal(isJerseyEligible(pro()),true);
  for(const stage of ['HS','U','CORP','IND'])assert.equal(isJerseyEligible(pro({stage})),false,stage);
  assert.equal(isJerseyEligible(pro({orgTeamId:null})),false);
  assert.equal(isJerseyEligible(pro({org:'MiLB',lv:'A2'})),true);
});
test('W8/J3 entry pending: no record, or a different team; same team return does not ask',()=>{
  assert.equal(jerseyEntryPending(pro()),true);
  assert.equal(jerseyEntryPending(pro({jerseyHistory:[{teamId:'NPB-YB',year:2029,number:'6'}]})),false);
  assert.equal(jerseyEntryPending(pro({jerseyHistory:[{teamId:'NPB-T',year:2029,number:'6'}]})),true);
  assert.equal(jerseyEntryPending(pro({stage:'IND',jerseyHistory:[]})),false);
});
test('D1/D2 proposal: carry the last number, else the position default',()=>{
  assert.equal(proposedJerseyNumber(pro({pos:'P'})),'18');
  assert.equal(proposedJerseyNumber(pro({jerseyHistory:[{teamId:'NPB-T',year:2029,number:'00'}]})),'00');
});
test('J1 current number and change availability only with the current team record',()=>{
  const h=[{teamId:'NPB-YB',year:2029,number:'6'}];
  assert.equal(currentJerseyNumber(pro({jerseyHistory:h})),'6');
  assert.equal(canChangeJersey(pro({jerseyHistory:h})),true);
  assert.equal(currentJerseyNumber(pro({orgTeamId:'NPB-T',jerseyHistory:h})),null,'after a trade/transfer before the year-start step');
  assert.equal(canChangeJersey(pro({orgTeamId:'NPB-T',jerseyHistory:h})),false);
  assert.equal(canChangeJersey(pro({jerseyHistory:h,done:true})),false);
  assert.equal(currentJerseyNumber(pro({stage:'IND',jerseyHistory:h})),null);
});
test('D4 legacy entry: professional log rows without any record',()=>{
  assert.equal(isLegacyJerseyEntry(pro({log:[{y:2029,st:{}}]})),true);
  assert.equal(isLegacyJerseyEntry(pro({log:[{y:2029,tm:'高校'}]})),false);
  assert.equal(isLegacyJerseyEntry(pro({log:[{y:2029,st:{}}],jerseyHistory:[{teamId:'NPB-YB',year:2029,number:'6'}]})),false);
});
test('D3 append only, effective year = current year, same-year records all kept',()=>{
  const s=pro();
  appendJerseyRecord(s,'6');appendJerseyRecord(s,'7');s.year=2031;appendJerseyRecord(s,'0');
  assert.deepEqual(s.jerseyHistory,[{teamId:'NPB-YB',year:2030,number:'6'},{teamId:'NPB-YB',year:2030,number:'7'},{teamId:'NPB-YB',year:2031,number:'0'}]);
  const before=JSON.stringify(s.jerseyHistory.slice(0,2));appendJerseyRecord(s,'00');
  assert.equal(JSON.stringify(s.jerseyHistory.slice(0,2)),before,'past records unchanged');
  assert.throws(()=>appendJerseyRecord(s,'100'),/JERSEY_RECORD_INVALID/);
  assert.throws(()=>appendJerseyRecord(pro({stage:'CORP'}),'6'),/JERSEY_RECORD_INVALID/);
  assert.equal(s.jerseyHistory.length,4,'failed appends leave no record');
});
test('D3 year lookup: last record in or before the year',()=>{
  const h=[{teamId:'A',year:2030,number:'6'},{teamId:'A',year:2030,number:'7'},{teamId:'B',year:2033,number:'7'}];
  assert.equal(jerseyRecordForYear(h,2029),null);
  assert.equal(jerseyRecordForYear(h,2030).number,'7');
  assert.equal(jerseyRecordForYear(h,2032).teamId,'A');
  assert.equal(jerseyRecordForYear(h,2033).teamId,'B');
});
test('J7 yearly label: professional rows only, unknown before the first record',()=>{
  const h=[{teamId:'A',year:2031,number:'6'}];
  assert.equal(yearlyJerseyLabel({y:2031,st:{}},h),' #6');
  assert.equal(yearlyJerseyLabel({y:2030,st:{}},h),'（背番号不明）');
  assert.equal(yearlyJerseyLabel({y:2031,tm:'独立'},h),'');
});
test('W2c/J3 periods: change within a team, transfers, and a non-professional gap split periods',()=>{
  const log=[{y:2028,tm:'高校'},{y:2029,st:{},tm:'A'},{y:2030,st:{},tm:'A'},{y:2031,st:{},tm:'A'},{y:2032,st:{},tm:'B'},{y:2033,tm:'独立'},{y:2034,st:{},tm:'B'}];
  const h=[{teamId:'A',year:2029,number:'6'},{teamId:'A',year:2031,number:'7'},{teamId:'B',year:2032,number:'7'}];
  assert.deepEqual(jerseyPeriods(log,h,id=>id+'球団'),[
    {team:'A球団',from:2029,to:2030,number:'6'},{team:'A球団',from:2031,to:2031,number:'7'},
    {team:'B球団',from:2032,to:2032,number:'7'},{team:'B球団',from:2034,to:2034,number:'7'}]);
  assert.deepEqual(jerseyPeriods([{y:2029,st:{},tm:'旧'},{y:2030,st:{},tm:'旧'},{y:2031,st:{},tm:'A'}],[{teamId:'A',year:2031,number:'6'}],id=>id),
    [{team:'旧',from:2029,to:2030,number:null},{team:'A',from:2031,to:2031,number:'6'}],'D4 unknown years');
  assert.deepEqual(jerseyPeriods([],h,id=>id),[]);
});
