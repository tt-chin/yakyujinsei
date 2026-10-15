// AF04/05: same-page, same-state transactions. No RNG rollback or persistent storage.
import {pitcherAwardCandidate} from './pitcher-award-policy.js';
import {decideIndependentAward} from './award-rng-policy.js';
const states=new WeakMap(),settlements=new WeakMap(),owned=new WeakMap(),completed=new WeakMap();
const copy=v=>v===undefined?undefined:structuredClone(v);
const equal=(a,b)=>{
  if(Object.is(a,b))return true;
  if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
  const ak=Object.keys(a),bk=Object.keys(b);
  return ak.length===bk.length&&ak.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
};
const error=code=>Object.assign(new Error(code),{code});
// Evidence of an existing personal-award history is NOT evidence of an unrun draw.
// Exact current producer strings only; team/international honors are out of scope.
const historicalPersonal=/^(\d{4}) (?:NPB|KBO|台湾プロ野球|メジャーリーグ)(?:年間MVP|新人王|最優秀投手賞|最多セーブ|最優秀中継ぎ|最多奪三振|最多勝利投手賞|最優秀防御率投手賞|最多三振奪取投手賞|勝率第一位投手賞|最多セーブ投手賞|最優秀中継ぎ投手賞|投手三冠王|沢村賞|首位打者|本塁打王|盗塁王|打点王|最高出塁率|ゴールデングラブ賞|年間最優秀守備選手|打撃三冠王|オールスターゲーム(?:\(ファン投票選出\))?)$/;
const data=token=>{const d=owned.get(token);if(!d)throw error('INVALID_AWARD_TRANSACTION');return d;};
const currentData=token=>{const d=data(token);if(d.state.year!==d.year||d.state.seed!==d.seed)throw error('STALE_AWARD_TRANSACTION');return d;};
const parent=(state,path)=>{
  if(!Array.isArray(path)||!path.length||path.some(k=>typeof k!=='string'||['__proto__','constructor','prototype'].includes(k)))throw error('INVALID_EFFECT_PATH');
  let p=state;for(const k of path.slice(0,-1)){const desc=Object.getOwnPropertyDescriptor(p,k);if(!desc||!Object.hasOwn(desc,'value')||!desc.value||typeof desc.value!=='object')throw error('INVALID_EFFECT_PARENT');p=desc.value;}
  const k=path.at(-1),desc=Object.getOwnPropertyDescriptor(p,k);
  if(desc&&(!Object.hasOwn(desc,'value')||!desc.writable))throw error('INVALID_EFFECT_PROPERTY');
  if(!desc&&!Object.isExtensible(p))throw error('INVALID_EFFECT_PROPERTY');
  return {p,k,present:!!desc,value:desc?.value};
};
const fullKey=(seed,year,league,id,rule,domain='legacy-award-v1')=>{
  const bytes=[];for(const x of [domain,seed,String(year),league,id,rule]){const b=new TextEncoder().encode(x),n=b.length;bytes.push(n>>>24&255,n>>>16&255,n>>>8&255,n&255,...b);}
  return bytes.map(b=>b.toString(16).padStart(2,'0')).join('');
};
// Receipt-only annual state transaction. It has no authority to fabricate Decisions.
export function annualStateTransaction(state){
  if(!state||typeof state.seed!=='string'||!state.seed||!Number.isSafeInteger(state.year)||state.year<1||state.year>9999)throw error('INVALID_SETTLEMENT_CONTEXT');
  let years=settlements.get(state);if(!years){years=new Map();settlements.set(state,years);}
  let token=years.get(state.year);if(token){currentData(token);return token;}
  token=Object.freeze({schemaVersion:1,year:state.year,kind:'STATE_RECEIPT'});
  owned.set(token,{state,seed:state.seed,year:state.year,slots:new Map(),receipts:new Map(),phase:'STATE_PREPARED'});years.set(state.year,token);return token;
}
export function annualAwardTransaction(state,{league,level,role,metrics}){
  if(!state||typeof state!=='object'||typeof state.seed!=='string'||!state.seed||!Number.isSafeInteger(state.year)||state.year<1||state.year>9999||!['NPB','KBO','CPBL','MLB'].includes(league)||level!==(league==='MLB'?'MLB':league+'1')||!['SP','MR','CL',null].includes(role)||!metrics||typeof metrics!=='object'||Array.isArray(metrics))throw error('INVALID_AWARD_CONTEXT');
  let years=states.get(state);if(!years){years=new Map();states.set(state,years);}
  const key=JSON.stringify([state.year,league]);let token=years.get(key);
  if(token){const d=currentData(token);if(d.level!==level||d.role!==role||!equal(d.metrics,metrics))throw error('AWARD_CONTEXT_CONFLICT');return token;}
  if(state.lastSalaryPaidYear===state.year||state.ct?.annualSchedule?.some(r=>r.year===state.year&&r.paid))throw error('HISTORICAL_READ_ONLY');
  for(const field of ['awardDecisions','honors','removed','pool','traits','stats'])parent(state,[field]);
  if(Object.hasOwn(state,'awardDecisions')&&!Array.isArray(state.awardDecisions))throw error('INVALID_DECISION_HISTORY');
  if(state.awardDecisions?.some(d=>d.year===state.year&&d.leagueKey===league))throw error('UNKNOWN_HISTORY');
  if(state.honors?.some(h=>typeof h==='string'&&Number(h.match(historicalPersonal)?.[1])===state.year))throw error('UNKNOWN_HISTORY');
  token=Object.freeze({schemaVersion:1,year:state.year,leagueKey:league});
  owned.set(token,{state,seed:state.seed,year:state.year,league,level,role,pos:state.pos,metrics:copy(metrics),slots:new Map(),receipts:new Map(),plan:null,phase:'AWARD_PREPARED'});
  years.set(key,token);return token;
}
export function preallocateAwardSlots(token,ids){const d=currentData(token);for(const id of ids)if(!d.slots.has(id))d.slots.set(id,{slotId:id,status:'PREPARED',eligible:false,pPercent:null,rngBefore:null,u:null,rngAfter:null,awarded:false});}
export function captureAwardSlot(token,id,pPercent,random,rngState,afterRecord){
  const d=currentData(token),s=d.slots.get(id);if(!s)throw error('UNPREPARED_AWARD_SLOT');
  if(s.status==='AMBIGUOUS')throw error('AMBIGUOUS_RNG');
  if(s.status==='RECORDED'){if(s.pPercent!==pPercent)throw error('AWARD_CONTEXT_CONFLICT');return s.awarded;}
  if(!Number.isFinite(pPercent)||pPercent<0||pPercent>100)throw error('INVALID_AWARD_PROBABILITY');
  s.eligible=true;s.pPercent=pPercent;s.rngBefore=rngState();
  try{const u=random();if(!Number.isFinite(u)||u<0||u>=1)throw error('INVALID_NATIVE_DRAW');s.u=u;s.rngAfter=rngState();s.awarded=u*100<pPercent;s.status='RECORDED';}
  catch(e){s.status='AMBIGUOUS';throw error('AMBIGUOUS_RNG');}
  // Only the already-recorded boundary is supported. No handler in the R→record gap.
  if(afterRecord)afterRecord(copy(s));return s.awarded;
}
export function prepareAwardReceipt(token,id,writes){
  const d=currentData(token);if(d.receipts.has(id))return;
  const prepared=writes.map(spec=>{const {path,after}=spec,{p,k,present,value}=parent(d.state,path);if(Object.hasOwn(spec,'before')&&!equal(value,spec.before))throw error('AWARD_INPUT_CONFLICT');const savedAfter=copy(after);
    // Append preserves old record identities, not arbitrary JSON-equivalent replacements.
    // Existing untrusted history stays untrusted; only new owned records receive proof.
    if(id==='decision-history'&&d.decisions&&path.length===1&&path[0]==='awardDecisions'){
      for(let i=0;i<d.historyStart;i++){if(after[i]!==value[i])throw error('DECISION_HISTORY_CONFLICT');savedAfter[i]=value[i];}
    }
    return {path:path.slice(),parent:p,key:k,beforePresent:present,beforeRef:value,before:copy(value),after:savedAfter,status:'PLANNED'};});
  d.receipts.set(id,{schemaVersion:1,effectId:id,decisionKeys:(d.decisions||[]).map(x=>x.decisionKey),commitContext:{year:d.year,seed:d.seed,league:d.league??null},status:'PLANNED',writes:prepared});
}
export function commitAwardReceipt(token,id,afterWrite){
  const d=currentData(token),r=d.receipts.get(id);if(!r)throw error('MISSING_EFFECT_RECEIPT');
  if(r.status==='CONFLICT')throw error('EFFECT_CONFLICT');
  if(r.status==='COMMITTED')return false;
  // Validate all fields first, avoiding a new partial commit on a pre-existing conflict.
  for(const w of r.writes){const current=parent(d.state,w.path);
    const before=current.p===w.parent&&current.present===w.beforePresent&&Object.is(current.value,w.beforeRef)&&equal(current.value,w.before);
    const after=current.p===w.parent&&current.present&&Object.is(current.value,w.after)&&equal(current.value,w.after);
    if(!before&&!after){r.status='CONFLICT';throw error('EFFECT_CONFLICT');}
  }
  for(const w of r.writes){if(!Object.is(w.parent[w.key],w.after))w.parent[w.key]=w.after;w.status='WRITTEN';if(afterWrite)afterWrite(w.path.slice());}
  r.status='COMMITTED';return true;
}
export function awardPlan(token,create){const d=currentData(token);if(!d.plan)d.plan=create();return d.plan;}
export function awardInputs(token,create){const d=currentData(token);if(!d.inputs)d.inputs=copy(create());return copy(d.inputs);}
// Product numeric producers run only after the original slots. Callers cannot
// submit an arbitrary awarded:true payload or historical honor as a P07 source.
export function prepareD2AwardDecisions(token,initializedSeed,afterRecorded){
  const d=currentData(token);
  if(initializedSeed!==d.seed)throw error('INITIALIZED_SEED_CONFLICT');
  if(d.d2)return copy(d.d2);
  if(d.decisions)throw error('AWARD_PLAN_ALREADY_RECORDED');
  if([...d.slots.values()].some(s=>s.status==='AMBIGUOUS'))throw error('AMBIGUOUS_RNG');
  const decisions=[];
  if(d.pos==='P')for(const awardId of ['PITCH_WINS','PITCH_WIN_PCT','PITCH_SAWAMURA']){
    const candidate=pitcherAwardCandidate(awardId,{league:d.league,level:d.level,role:d.role,pos:d.pos,stats:d.metrics});
    const draw=decideIndependentAward({seed:d.seed,year:d.year,league:d.league,awardId,ruleId:candidate.ruleId},candidate.pPercent,initializedSeed);
    decisions.push(Object.freeze({schemaVersion:1,keySchemaVersion:1,year:d.year,leagueKey:d.league,level:d.level,role:d.role,
      ...copy(candidate),...draw,decisionKey:draw.drawKey,metrics:copy(d.metrics),decisionStatus:'DECIDED',sources:[draw.drawSource]}));
  }
  const won=id=>d.slots.get(id)?.status==='RECORDED'&&d.slots.get(id).awarded;
  const triple=d.pos==='P'&&decisions.some(x=>x.awardId==='PITCH_WINS'&&x.awarded)&&won('LEGACY_BEST_PITCHER')&&won('PITCH_STRIKEOUTS');
  if(triple){
    decisions.push(Object.freeze({schemaVersion:1,keySchemaVersion:1,year:d.year,leagueKey:d.league,level:d.level,role:d.role,
      awardId:'PITCH_TRIPLE_CROWN',ruleId:'p07-derived-v1',decisionKey:fullKey(d.seed,d.year,d.league,'PITCH_TRIPLE_CROWN','p07-derived-v1','derived-award-v1'),
      eligibility:true,metrics:copy(d.metrics),pPercent:100,u:null,hash32:null,drawSource:'DERIVED',awarded:true,
      reasonCodes:['SAME_YEAR_LEAGUE_ACTUAL_THREE_AWARDS'],decisionStatus:'DECIDED',sources:['PITCH_WINS','PITCH_ERA','PITCH_STRIKEOUTS'],
      sourceDecisionKeys:[decisions.find(x=>x.awardId==='PITCH_WINS').decisionKey,
        fullKey(d.seed,d.year,d.league,'LEGACY_BEST_PITCHER','legacy-v1'),fullKey(d.seed,d.year,d.league,'PITCH_STRIKEOUTS','legacy-v1')]}));
  }
  const hitterTriple=d.pos!=='P'&&['BATTING_AVG','BATTING_HR','BATTING_RBI'].every(won);
  d.d2={decisions,triple,hitterTriple};
  if(afterRecorded)afterRecorded(copy(d.d2));
  return copy(d.d2);
}
export function recordAwardDecisions(token){
  const d=currentData(token);if(!d.league)throw error('NOT_AN_AWARD_TRANSACTION');
  if(d.decisions)return copy(d.decisions);
  for(const slot of d.slots.values())if(slot.status==='PREPARED')slot.status='SKIPPED';
  if([...d.slots.values()].some(s=>s.status==='AMBIGUOUS'))throw error('AMBIGUOUS_RNG');
  d.decisions=[...d.slots.values()].filter(s=>s.status==='RECORDED').map(s=>Object.freeze({schemaVersion:1,keySchemaVersion:1,
    year:d.year,leagueKey:d.league,level:d.level,role:d.role,awardId:d.d2&&s.slotId==='LEGACY_BEST_PITCHER'?'PITCH_ERA':s.slotId,ruleId:'legacy-v1',
    decisionKey:fullKey(d.seed,d.year,d.league,s.slotId,'legacy-v1'),legacySlotId:s.slotId,
    eligibility:true,metrics:copy(d.metrics),pPercent:s.pPercent,u:s.u,rngBefore:s.rngBefore,rngAfter:s.rngAfter,
    awarded:s.awarded,reasonCodes:['LEGACY_ELIGIBLE'],drawSource:'LEGACY_MAIN_RNG',decisionStatus:'DECIDED',sources:['LEGACY_MAIN_RNG']}));
  if(d.d2){
    const mvp=d.decisions.find(x=>x.awardId==='MVP');
    if(mvp){
      const index=d.decisions.indexOf(mvp),sources=[];
      if(mvp.awarded)sources.push('LEGACY_DRAW');
      if(d.d2.triple)sources.push('TRIPLE_CROWN_GUARANTEE');
      if(d.d2.hitterTriple)sources.push('HITTER_TRIPLE_CROWN_GUARANTEE');
      d.decisions[index]=Object.freeze({...mvp,legacyDrawAwarded:mvp.awarded,awarded:mvp.awarded||d.d2.triple||d.d2.hitterTriple,sources});
    }
    d.decisions.push(...d.d2.decisions);
    if((d.d2.triple||d.d2.hitterTriple)&&!mvp){
      const ruleId=d.d2.triple?'p07-mvp-guarantee-v1':'hitter-mvp-guarantee-v1';
      const source=d.d2.triple?'TRIPLE_CROWN_GUARANTEE':'HITTER_TRIPLE_CROWN_GUARANTEE';
      d.decisions.push(Object.freeze({schemaVersion:1,keySchemaVersion:1,
      year:d.year,leagueKey:d.league,level:d.level,role:d.role,awardId:'MVP',ruleId,
      decisionKey:fullKey(d.seed,d.year,d.league,'MVP',ruleId,'derived-award-v1'),eligibility:true,
      metrics:copy(d.metrics),pPercent:100,u:null,hash32:null,drawSource:'DERIVED',awarded:true,
      reasonCodes:[source],decisionStatus:'DECIDED',sources:[source]}));
    }
  }
  d.phase='DRAW_RECORDED';return copy(d.decisions);
}
export function completeAwardDecisions(token,afterHistoryWrite){
  const d=currentData(token);if(!d.league)throw error('NOT_AN_AWARD_TRANSACTION');if(d.phase==='AWARD_EFFECTS_COMMITTED'){
    if(!d.history.refs.every((ref,i)=>d.state.awardDecisions?.[d.history.start+i]===ref&&equal(ref,d.history.values[i])))throw error('DECISION_HISTORY_CONFLICT');
    return;
  }
  if([...d.receipts.values()].some(r=>r.effectId!=='decision-history'&&r.status!=='COMMITTED'))throw error('UNCOMMITTED_AWARD_EFFECT');
  const decisions=recordAwardDecisions(token);
  const start=d.historyStart??(d.historyStart=(d.state.awardDecisions||[]).length);
  prepareAwardReceipt(token,'decision-history',[{path:['awardDecisions'],after:[...(d.state.awardDecisions||[]),...decisions]}]);
  commitAwardReceipt(token,'decision-history',afterHistoryWrite);
  const refs=d.state.awardDecisions.slice(start);
  d.history={start,refs,values:copy(refs)};
  for(const [index,decision] of refs.entries())completed.set(decision,{state:d.state,token,index:start+index,value:copy(decision)});
  d.phase='AWARD_EFFECTS_COMMITTED';
}
export function isCompletedAwardDecision(decision,state){const proof=completed.get(decision);return !!proof&&(!state||proof.state===state)&&data(proof.token).phase==='AWARD_EFFECTS_COMMITTED'&&proof.state.awardDecisions?.[proof.index]===decision&&equal(decision,proof.value);}
export function inspectAwardTransaction(token){const d=data(token);return copy({phase:d.phase,year:d.year,league:d.league,decisions:d.decisions||[],slots:[...d.slots.values()],receipts:[...d.receipts.values()].map(r=>({effectId:r.effectId,status:r.status,writes:r.writes.map(w=>({path:w.path,beforePresent:w.beforePresent,before:w.before,after:w.after,status:w.status}))}))});}
