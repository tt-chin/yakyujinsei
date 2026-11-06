// Explicit 1.14.0 cross-version oracle only. Never use for same-version replay.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {JP_DATA} from '../../docs/src/data/jp-data.js';
import {historicalCareer} from './historical-comparison.mjs';
import {assertSameCareer} from '../../tests/support/first-difference.mjs';

const rules={NPB1:['NPB','日本一'],MLB:['MLB','ワールドシリーズチャンピオン'],CPBL1:['CPBL','台湾シリーズ優勝'],KBO1:['KBO','韓国シリーズ優勝']};
function expectedWins(state){
  return Object.entries(state.championshipResults||{}).filter(([key,r])=>{
    const rule=rules[r?.level];
    return rule&&r.won===true&&r.eligible===true&&Number.isInteger(r.year)&&r.year>0&&r.year<=state.year&&String(r.year)===key&&r.league===rule[0]&&r.title===rule[1]&&JP_DATA.teams.some(t=>t.teamId===r.teamId&&t.org===r.league);
  }).map(([,r])=>({year:r.year,league:r.league,level:r.level,teamId:r.teamId,title:r.title})).sort((a,b)=>a.year-b.year);
}
function approvedExpected(old,now){
  if(Array.isArray(old))return old.map((v,i)=>approvedExpected(v,now?.[i]));
  if(old&&typeof old==='object'){
    if(typeof old.seed==='string'&&Number.isInteger(old.year)&&old.traits&&Array.isArray(old.honors)){
      // Derive from the historical records, not candidate counters or product code.
      const wins=expectedWins(old),acquired=wins.length>=5;
      assert.equal(Boolean(old.traits.championmaker),false,'historical reserved trait must be inactive');
      assert(now&&typeof now==='object','candidate state required');
      assertSameCareer(now.championmakerWins,wins,'independent championmaker championship identities/order');
      assert.equal(now.championmakerCount,wins.length,'independent championmaker count');
      assert.equal(now.championmakerAcquiredYear,acquired?wins[4].year:null,'independent fifth championship year');
      assert.equal(now.traits.championmaker,acquired,'independent honor-only acquisition');
      // Match the explicitly approved initial-state insertion point as well as
      // values: the existing digest includes JSON property order.
      assert(Object.hasOwn(old,'tripleCrownHistory'),'known historical initialization required');
      const result={};
      for(const [key,value] of Object.entries(structuredClone(old))){
        result[key]=value;
        if(key==='tripleCrownHistory')Object.assign(result,{championmakerWins:wins,championmakerCount:wins.length,championmakerAcquiredYear:acquired?wins[4].year:null});
      }
      result.traits.championmaker=acquired;
      return result;
    }
    return Object.fromEntries(Object.entries(old).map(([k,v])=>[k,approvedExpected(v,now?.[k])]));
  }
  return old;
}
export function assertChampionmakerCareer(actual,old,message='approved championmaker cross-version comparison'){
  if(Array.isArray(old)){
    assert(Array.isArray(actual),message+': array type');assert.equal(actual.length,old.length,message+': length');
    for(let i=0;i<old.length;i++)assertChampionmakerCareer(actual[i],old[i],message+' step '+i);
    return;
  }
  if(old&&typeof old==='object'&&Array.isArray(old.records)){
    assertSameCareer(Object.keys(actual).sort(),Object.keys(old).sort(),message+': record container keys');
    for(const key of Object.keys(old))assertChampionmakerCareer(actual[key],old[key],message+'.'+key);
    return;
  }
  // Bounded one-step comparison. Existing Decision validation and digest recomputation
  // remain in historicalCareer; every other S/action/RNG field remains exact.
  for(const record of [actual,old])if(record&&typeof record.digest==='string'&&record.state){
    const expectedDigest=createHash('sha256').update(JSON.stringify({state:record.state,calls:record.calls})).digest('hex');
    assert.equal(record.digest,expectedDigest,message+': raw state/calls digest integrity');
  }
  const expected=historicalCareer(approvedExpected(old,actual));
  assertSameCareer(historicalCareer(actual),expected,message);
}
