// Explicit cross-version comparisons only. Same-B replay must compare raw full S.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {validateAwardHistory as validateA} from '../development-a/historical-comparison.mjs';
import {pitcherAwardCandidate} from '../../docs/src/engine/pitcher-award-policy.js';
import {decideIndependentAward} from '../../docs/src/engine/award-rng-policy.js';
const nativeOrder=['ALL_STAR','ROOKIE','LEGACY_BEST_PITCHER','PITCH_SAVES','PITCH_RELIEF','PITCH_STRIKEOUTS','BATTING_AVG','BATTING_HR','BATTING_SB','BATTING_RBI','BATTING_OBP','GOLD_GLOVE','DEFENSE_BEST','MVP'];
const newIds=['PITCH_WINS','PITCH_WIN_PCT','PITCH_SAWAMURA'];
function key(state,d,id,rule,domain){return Buffer.concat([domain,state.seed,String(d.year),d.leagueKey,id,rule].map(s=>{
  const b=Buffer.from(s),n=Buffer.alloc(4);n.writeUInt32BE(b.length);return Buffer.concat([n,b]);
})).toString('hex');}
function nativeValue(after){let t=after;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
export function validateAwardHistory(state){
  if(!Object.hasOwn(state,'awardDecisions'))return;
  assert(Array.isArray(state.awardDecisions));
  const seen=new Set(),groups=new Map();let previousYear=0;
  for(const d of state.awardDecisions){
    assert(d&&typeof d==='object');assert.equal(d.schemaVersion,1);assert.equal(d.keySchemaVersion,1);
    assert.equal(d.decisionStatus,'DECIDED');assert(Number.isSafeInteger(d.year)&&d.year>=previousYear&&d.year<=state.year);previousYear=d.year;
    assert(['NPB','KBO','CPBL','MLB'].includes(d.leagueKey));assert.equal(d.level,d.leagueKey==='MLB'?'MLB':d.leagueKey+'1');
    assert(['SP','MR','CL',null].includes(d.role));assert(!seen.has(d.decisionKey));seen.add(d.decisionKey);
    assert((state.log||[]).some(r=>r.y===d.year&&r.st&&JSON.stringify(r.st)===JSON.stringify(d.metrics)),'preserved actual season metrics');
    const groupKey=JSON.stringify([d.year,d.leagueKey]);if(!groups.has(groupKey))groups.set(groupKey,[]);groups.get(groupKey).push(d);
  }
  for(const rows of groups.values()){
    const isB=rows.some(d=>newIds.includes(d.awardId)||Object.hasOwn(d,'legacyDrawAwarded')||d.drawSource==='DERIVED');
    if(!isB){validateA({...state,awardDecisions:rows});continue;}
    const won=id=>rows.some(d=>d.awardId===id&&d.awarded);
    const triple=won('PITCH_WINS')&&won('PITCH_ERA')&&won('PITCH_STRIKEOUTS');
    const hitter=['BATTING_AVG','BATTING_HR','BATTING_RBI'].every(won);
    const common=d=>({schemaVersion:1,keySchemaVersion:1,year:d.year,leagueKey:d.leagueKey,level:d.level,role:d.role});
    let order=-1,nativeEnded=false,lastRng;
    const native=rows.filter(d=>d.drawSource==='LEGACY_MAIN_RNG');
    for(const d of rows){
      assert.deepEqual([d.level,d.role,d.metrics],[rows[0].level,rows[0].role,rows[0].metrics],'one frozen annual context');
      if(d.drawSource==='LEGACY_MAIN_RNG'){
        assert(!nativeEnded);const index=nativeOrder.indexOf(d.legacySlotId);assert(index>order);order=index;
        assert.equal(d.awardId,d.legacySlotId==='LEGACY_BEST_PITCHER'?'PITCH_ERA':d.legacySlotId);
        assert(Number.isFinite(d.pPercent)&&d.pPercent>=0&&d.pPercent<=100);
        assert(Number.isInteger(d.rngBefore)&&d.rngBefore>=0&&d.rngBefore<=0xffffffff);
        if(lastRng!==undefined)assert.equal(d.rngBefore,lastRng,'contiguous native slots');
        assert.equal(d.rngAfter,(d.rngBefore+0x6D2B79F5)>>>0);lastRng=d.rngAfter;
        assert.equal(d.u,nativeValue(d.rngAfter));const raw=d.u*100<d.pPercent;
        const extra=d.awardId==='MVP'?{legacyDrawAwarded:raw}:{};
        const sources=d.awardId==='MVP'?[...(raw?['LEGACY_DRAW']:[]),...(triple?['TRIPLE_CROWN_GUARANTEE']:[]),...(hitter?['HITTER_TRIPLE_CROWN_GUARANTEE']:[])]:['LEGACY_MAIN_RNG'];
        assert.deepEqual(d,{...common(d),awardId:d.awardId,ruleId:'legacy-v1',decisionKey:key(state,d,d.legacySlotId,'legacy-v1','legacy-award-v1'),
          legacySlotId:d.legacySlotId,eligibility:true,metrics:d.metrics,pPercent:d.pPercent,u:d.u,rngBefore:d.rngBefore,rngAfter:d.rngAfter,
          awarded:d.awardId==='MVP'?(raw||triple||hitter):raw,reasonCodes:['LEGACY_ELIGIBLE'],drawSource:'LEGACY_MAIN_RNG',decisionStatus:'DECIDED',sources,...extra});
      }else if(newIds.includes(d.awardId)){
        nativeEnded=true;const preceding=rows.filter(x=>newIds.includes(x.awardId)).map(x=>x.awardId);assert.deepEqual(preceding,newIds,'all three independent results, including ineligible');
        const candidate=pitcherAwardCandidate(d.awardId,{league:d.leagueKey,level:d.level,role:d.role,pos:'P',stats:d.metrics});
        const draw=decideIndependentAward({seed:state.seed,year:d.year,league:d.leagueKey,awardId:d.awardId,ruleId:candidate.ruleId},candidate.pPercent,state.seed);
        assert.deepEqual(d,{...common(d),...structuredClone(candidate),...draw,decisionKey:draw.drawKey,metrics:d.metrics,decisionStatus:'DECIDED',sources:[draw.drawSource]});
      }else{
        nativeEnded=true;assert.equal(d.drawSource,'DERIVED');
        if(d.awardId==='PITCH_TRIPLE_CROWN'){
          assert(triple);const sourceIds=['PITCH_WINS','PITCH_ERA','PITCH_STRIKEOUTS'];
          assert.deepEqual(d,{...common(d),awardId:d.awardId,ruleId:'p07-derived-v1',decisionKey:key(state,d,d.awardId,'p07-derived-v1','derived-award-v1'),
            eligibility:true,metrics:d.metrics,pPercent:100,u:null,hash32:null,drawSource:'DERIVED',awarded:true,
            reasonCodes:['SAME_YEAR_LEAGUE_ACTUAL_THREE_AWARDS'],decisionStatus:'DECIDED',sources:sourceIds,
            sourceDecisionKeys:sourceIds.map(id=>rows.find(x=>x.awardId===id&&x.awarded).decisionKey)});
        }else{
          assert.equal(d.awardId,'MVP');assert(!native.some(x=>x.awardId==='MVP'));assert(triple||hitter);
          const rule=triple?'p07-mvp-guarantee-v1':'hitter-mvp-guarantee-v1',source=triple?'TRIPLE_CROWN_GUARANTEE':'HITTER_TRIPLE_CROWN_GUARANTEE';
          assert.deepEqual(d,{...common(d),awardId:'MVP',ruleId:rule,decisionKey:key(state,d,'MVP',rule,'derived-award-v1'),eligibility:true,
            metrics:d.metrics,pPercent:100,u:null,hash32:null,drawSource:'DERIVED',awarded:true,reasonCodes:[source],decisionStatus:'DECIDED',sources:[source]});
        }
      }
    }
    assert.equal(rows.filter(d=>d.awardId==='MVP').length,rows.some(d=>d.awardId==='MVP')?1:0);
    assert.equal(rows.some(d=>d.awardId==='PITCH_TRIPLE_CROWN'),triple);
  }
}
export function historicalState(state){validateAwardHistory(state);const copy=structuredClone(state);delete copy.awardDecisions;return copy;}
export function historicalCareer(value){
  if(Array.isArray(value))return value.map(historicalCareer);
  if(value&&typeof value==='object'){
    if(typeof value.seed==='string'&&Number.isInteger(value.year)&&value.traits&&Array.isArray(value.honors))return historicalState(value);
    const result=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,historicalCareer(v)]));
    if(typeof value.digest==='string'&&value.state)result.digest=createHash('sha256').update(JSON.stringify({state:result.state,calls:result.calls})).digest('hex');
    for(const side of ['before','after'])if(typeof value[side]==='string'&&value[side+'State'])result[side]=createHash('sha256').update(JSON.stringify(result[side+'State'])).digest('hex');
    return result;
  }
  if(typeof value==='string'&&value.startsWith('{')){let parsed;try{parsed=JSON.parse(value);}catch{}if(parsed&&typeof parsed.seed==='string'&&Number.isInteger(parsed.year)&&parsed.traits&&Array.isArray(parsed.honors))return JSON.stringify(historicalState(parsed));}
  return value;
}

// Explicit D2 producer-renaming oracle, NOT a general history normalizer.
// Construct the expected old run using only actual completed B native Decisions.
// Ordinary state, raw history order, choices and RNG remain strictly compared.
const producerRenames=[
  ['最優秀投手賞','最優秀防御率投手賞','PITCH_ERA','LEGACY_BEST_PITCHER'],
  ['最多奪三振','最多三振奪取投手賞','PITCH_STRIKEOUTS','PITCH_STRIKEOUTS'],
  ['最多セーブ','最多セーブ投手賞','PITCH_SAVES','PITCH_SAVES'],
  ['最優秀中継ぎ','最優秀中継ぎ投手賞','PITCH_RELIEF','PITCH_RELIEF'],
];
const producerLeagueLabels={NPB:'NPB',KBO:'KBO',CPBL:'台湾プロ野球',MLB:'メジャーリーグ'};
function firstMismatch(a,b,path='$'){
  if(Object.is(a,b))return null;
  if(a&&b&&typeof a==='object'&&typeof b==='object'){
    if(Array.isArray(a)!==Array.isArray(b))return {path,reason:'container type'};
    for(const k of new Set([...Object.keys(a),...Object.keys(b)])){
      if(!Object.hasOwn(a,k)||!Object.hasOwn(b,k))return {path:path+'.'+k,reason:'missing/extra field'};
      const d=firstMismatch(a[k],b[k],path+'.'+k);if(d)return d;
    }
    return null;
  }
  const short=v=>typeof v==='string'?v.slice(0,180):v;
  return {path,before:short(a),after:short(b)};
}
export function assertApprovedProducerRenameCareer(old,current){
  const evidence=new Map();
  function expected(value,actual,path='$'){
    if(Array.isArray(value))return value.map((v,i)=>expected(v,actual?.[i],path+'.'+i));
    if(value&&typeof value==='object'){
      if(typeof value.seed==='string'&&Number.isInteger(value.year)&&value.traits&&Array.isArray(value.honors)){
        assert(actual&&actual.seed===value.seed,'same seed required for producer rename');
        validateAwardHistory(actual);
        const result=historicalState(value);
        result.honors=result.honors.map((honor,index)=>{
          if(honor===actual.honors?.[index])return honor;
          for(const [from,to,id,slot] of producerRenames){
            const d=(actual.awardDecisions||[]).find(d=>d.awarded===true&&d.awardId===id&&d.legacySlotId===slot&&d.drawSource==='LEGACY_MAIN_RNG'&&d.decisionStatus==='DECIDED'&&honor===`${d.year} ${producerLeagueLabels[d.leagueKey]}${from}`&&actual.honors?.[index]===`${d.year} ${producerLeagueLabels[d.leagueKey]}${to}`);
            if(!d)continue;
            const key=d.decisionKey;
            if(!evidence.has(key))evidence.set(key,{rule:'D2 §4 official producer name',year:d.year,league:d.leagueKey,level:d.level,awardId:id,legacySlotId:slot,decisionKey:key,before:honor,after:actual.honors[index],firstPath:path+'.honors.'+index,snapshotOccurrences:0});
            evidence.get(key).snapshotOccurrences++;
            return actual.honors[index];
          }
          // Unknown name, wrong context, missing/losing/untrusted Decision:
          // leave the expected value unchanged so the strict comparison fails.
          return honor;
        });
        return result;
      }
      const result=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,expected(v,actual?.[k],path+'.'+k)]));
      if(typeof value.digest==='string'&&value.state)result.digest=createHash('sha256').update(JSON.stringify({state:result.state,calls:result.calls})).digest('hex');
      for(const side of ['before','after'])if(typeof value[side]==='string'&&value[side+'State'])result[side]=createHash('sha256').update(JSON.stringify(result[side+'State'])).digest('hex');
      return result;
    }
    return value;
  }
  const approved=expected(old,current),observed=historicalCareer(current);
  // A compact first-difference diagnostic prevents assert's formatting of a
  // 100+ MB career from obscuring an actual failure with ArrayBuffer errors.
  assert.deepEqual(firstMismatch(approved,observed),null,'Only Decision-proven official producer renames allowed; every other field remains strict');
  return {classification:'EXPECTED_D2_PRODUCER_NAME_ONLY',strictOtherFields:true,renames:[...evidence.values()]};
}
