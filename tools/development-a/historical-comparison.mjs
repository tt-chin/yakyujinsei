// Explicit historical comparisons ONLY. Never use this for current/current replay.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const order=['ALL_STAR','ROOKIE','LEGACY_BEST_PITCHER','PITCH_SAVES','PITCH_RELIEF','PITCH_STRIKEOUTS','BATTING_AVG','BATTING_HR','BATTING_SB','BATTING_RBI','BATTING_OBP','GOLD_GLOVE','DEFENSE_BEST','MVP'];
export function validateAwardHistory(state){
  if(!Object.hasOwn(state,'awardDecisions'))return;
  assert(Array.isArray(state.awardDecisions));const seen=new Set(),positions=new Map();let previousYear=0;
  for(const d of state.awardDecisions){
    assert.equal(d.schemaVersion,1);assert.equal(d.keySchemaVersion,1);assert.equal(d.ruleId,'legacy-v1');
    assert.equal(d.decisionStatus,'DECIDED');assert.equal(d.eligibility,true);assert.equal(d.drawSource,'LEGACY_MAIN_RNG');
    assert.deepEqual(d.sources,['LEGACY_MAIN_RNG']);assert.deepEqual(d.reasonCodes,['LEGACY_ELIGIBLE']);assert.equal(d.legacySlotId,d.awardId);
    assert(Number.isSafeInteger(d.year)&&d.year>=previousYear&&d.year<=state.year);previousYear=d.year;
    assert(['NPB','KBO','CPBL','MLB'].includes(d.leagueKey));assert.equal(d.level,d.leagueKey==='MLB'?'MLB':d.leagueKey+'1');
    assert(Number.isFinite(d.pPercent)&&d.pPercent>=0&&d.pPercent<=100);assert(Number.isFinite(d.u)&&d.u>=0&&d.u<1);
    assert.equal(d.awarded,d.u*100<d.pPercent);assert(Number.isInteger(d.rngBefore)&&d.rngBefore>=0&&d.rngBefore<=0xffffffff);
    assert.equal(d.rngAfter,(d.rngBefore+0x6D2B79F5)>>>0);
    assert.equal(typeof d.metrics,'object');assert(d.metrics!==null);assert(!seen.has(d.decisionKey));seen.add(d.decisionKey);
    const season=(state.log||[]).find(row=>row.y===d.year&&row.st&&JSON.stringify(row.st)===JSON.stringify(d.metrics));
    assert(season,'Decision metrics must match an actually preserved native season log');
    const group=JSON.stringify([d.year,d.leagueKey]),index=order.indexOf(d.awardId);assert(index>=0&&index>(positions.get(group)??-1),'original slot order');positions.set(group,index);
    const bytes=['legacy-award-v1',state.seed,String(d.year),d.leagueKey,d.awardId,'legacy-v1'].map(v=>{const b=Buffer.from(v),n=Buffer.alloc(4);n.writeUInt32BE(b.length);return Buffer.concat([n,b]);});
    assert.equal(d.decisionKey,Buffer.concat(bytes).toString('hex'));
  }
}
export function historicalState(state){validateAwardHistory(state);const result=structuredClone(state);delete result.awardDecisions;return result;}
export function historicalCareer(value){
  if(Array.isArray(value))return value.map(historicalCareer);
  if(value&&typeof value==='object'){
    if(typeof value.seed==='string'&&Number.isInteger(value.year)&&value.traits&&Array.isArray(value.honors))return historicalState(value);
    const result=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,historicalCareer(v)]));
    if(typeof value.digest==='string'&&value.state)result.digest=createHash('sha256').update(JSON.stringify({state:result.state,calls:result.calls})).digest('hex');
    for(const side of ['before','after'])if(typeof value[side]==='string'&&value[side+'State'])result[side]=createHash('sha256').update(JSON.stringify(result[side+'State'])).digest('hex');
    return result;
  }
  // These test suites retain complete S as a JSON string, not a lossy hash.
  if(typeof value==='string'&&value.startsWith('{')){let parsed;try{parsed=JSON.parse(value);}catch{}if(parsed&&typeof parsed.seed==='string'&&Number.isInteger(parsed.year)&&parsed.traits&&Array.isArray(parsed.honors))return JSON.stringify(historicalState(parsed));}
  return value;
}
