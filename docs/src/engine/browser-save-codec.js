import {captureCompletedAwardProofs} from './award-transaction-policy.js';
import {VERSION} from '../config.js';
import {SAVE_STATE_CONTRACT} from './browser-save-state-contract.js';
// Annual-start data contract. Captured proof ownership is checked before sealing.
export const SAVE_LIMITS=Object.freeze({bytes:2*1024*1024,depth:32,arrayLength:1024,nodes:131072});
export const SAVE_COMPATIBILITY='year-start-v2-auth';
const captures=new WeakMap();
const blocked=new Set(['__proto__','prototype','constructor']);
const fail=code=>{throw Object.assign(new Error(code),{code});};
// Preserve shared references, but reject cycles and executable/host objects.
export function copySaveData(value,{stateRoot=false}={}){
 const copies=new WeakMap(),active=new WeakSet();let estimated=0,nodes=0;
 const visit=(v,depth,root=false)=>{
  if(++nodes>SAVE_LIMITS.nodes)fail('SAVE_NODES');
  if(depth>SAVE_LIMITS.depth)fail('SAVE_DEPTH');
  if(v===null||typeof v==='boolean')return v;
  if(typeof v==='number'){if(!Number.isFinite(v))fail('SAVE_NONFINITE');return v;}
  if(typeof v==='string'){estimated+=v.length*2;if(estimated>SAVE_LIMITS.bytes*2)fail('SAVE_SIZE');return v;}
  if(typeof v!=='object')fail('SAVE_TYPE');
  if(active.has(v))fail('SAVE_CYCLE');
  if(copies.has(v))return copies.get(v);
  const array=Array.isArray(v),proto=Object.getPrototypeOf(v);
  if(!array&&proto!==Object.prototype&&proto!==null)fail('SAVE_PROTOTYPE');
  if(array&&v.length>SAVE_LIMITS.arrayLength)fail('SAVE_ARRAY_SIZE');
  const result=array?[]:{};copies.set(v,result);active.add(v);
  const ds=Object.getOwnPropertyDescriptors(v);
  for(const key of Reflect.ownKeys(ds)){
   if(typeof key!=='string'||blocked.has(key))fail('SAVE_KEY');
   if(array&&key==='length')continue;
   const d=ds[key];
   if(root&&stateRoot&&['salary','orgTeam','teamName'].includes(key)){
    if(key==='teamName'&&typeof d.value!=='function')fail('SAVE_RUNTIME_METHOD');
    if(key!=='teamName'&&(d.enumerable||!d.get||!d.set))fail('SAVE_RUNTIME_ACCESSOR');
    continue;
   }
   if(!d.enumerable||!Object.hasOwn(d,'value'))fail('SAVE_DESCRIPTOR');
   if(array&&(!/^(0|[1-9][0-9]*)$/.test(key)||Number(key)>=v.length))fail('SAVE_ARRAY_PROPERTY');
   result[key]=visit(d.value,depth+1);
  }
  if(array)for(let i=0;i<v.length;i++)if(!Object.hasOwn(v,i))fail('SAVE_ARRAY_HOLE');
  active.delete(v);return result;
 };
 const result=visit(value,0,true);
 let serializedNodes=0;
 const json=JSON.stringify(result,(_key,v)=>{if(++serializedNodes>SAVE_LIMITS.nodes)fail('SAVE_NODES');return v;});
 if(new TextEncoder().encode(json).length>SAVE_LIMITS.bytes)fail('SAVE_SIZE');
 return result;
}
export function validateSaveEnvelope(input){
 const e=copySaveData(input);
 if(e.format!=='yakyujinsei-career-save'||e.schemaVersion!==2||e.compatibilityId!==SAVE_COMPATIBILITY)fail('SAVE_INCOMPATIBLE');
 if(typeof e.gameVersion!=='string'||!/^\d+\.\d+\.\d+$/.test(e.gameVersion))fail('SAVE_VERSION');
 if(typeof e.savedAt!=='string'||!Number.isFinite(Date.parse(e.savedAt))||new Date(e.savedAt).toISOString()!==e.savedAt)fail('SAVE_TIME');
 if(typeof e.careerId!=='string'||!e.careerId||e.careerId.length>128)fail('SAVE_ID');
 if(!Number.isSafeInteger(e.revision)||e.revision<0)fail('SAVE_REVISION');
 if(!Array.isArray(e.awardProofs))fail('SAVE_AWARD_PROOFS');
 const s=e.state,c=e.checkpoint;
 if(!s||Array.isArray(s)||!c||c.kind!=='YEAR_START_READY'||c.eventYearInitialized!==true)fail('SAVE_CHECKPOINT');
 for(const k of SAVE_STATE_CONTRACT.required)if(!Object.hasOwn(s,k))fail('SAVE_MISSING_FIELD');
 for(const [k,allowed]of Object.entries(SAVE_STATE_CONTRACT.types)){if(!Object.hasOwn(s,k))continue;const v=s[k],type=v===null?'null':Array.isArray(v)?'array':typeof v;if(!allowed.includes(type))fail('SAVE_FIELD_TYPE');}
 for(const k of ['year','age','stageYr'])if(!Number.isSafeInteger(s[k])||s[k]<0||c[k]!==s[k])fail('SAVE_YEAR');
 if(s.championmakerAcquiredYear!==null&&(!Number.isSafeInteger(s.championmakerAcquiredYear)||s.championmakerAcquiredYear<1||s.championmakerAcquiredYear>s.year))fail('SAVE_CHAMPION_YEAR');
 if(s.year<1||s.year>9999||s.done!==false)fail('SAVE_STATE');
 if(!Number.isInteger(s.rngState)||s.rngState<0||s.rngState>0xffffffff)fail('SAVE_RNG');
 if(!['P','C','IF','OF'].includes(s.pos)||!['HS','U','CORP','IND','PRO'].includes(s.stage)||!['HS','U','CORP','IND','NPB1','NPB2','NPB_DEV','KBO1','KBO2','CPBL1','CPBL2','MLB','R','A1','A2','A3'].includes(s.lv))fail('SAVE_ROUTE');
 const amateur={HS:'AMATEUR',U:'AMATEUR',CORP:'CORP',IND:'IND'};const org=s.lv.startsWith('NPB')?'NPB':s.lv.startsWith('KBO')?'KBO':s.lv.startsWith('CPBL')?'CPBL':['R','A1','A2','A3'].includes(s.lv)?'MiLB':null;
 if(Object.hasOwn(amateur,s.lv)){if(s.stage!==s.lv||s.org!==amateur[s.lv])fail('SAVE_ROUTE_IDENTITY');}else if(s.stage!=='PRO'||(s.lv==='MLB'?!['MLB','MiLB'].includes(s.org):s.org!==org))fail('SAVE_ROUTE_IDENTITY');
 if(typeof s.name!=='string'||typeof s.seed!=='string'||!s.seed||!s.ab||!s.pot||!s.traits||!Array.isArray(s.log))fail('SAVE_REQUIRED');
 const keys=s.pos==='P'?['sta','vel','ctl','brk']:['sta','con','pow','spd','eye','rng','fld','arm',...(s.pos==='C'?['cat']:[])];
 for(const field of ['ab','pot']){if(keys.some(k=>typeof s[field][k]!=='number')||Object.values(s[field]).some(v=>typeof v!=='number'||!Number.isFinite(v)))fail('SAVE_ABILITY');}
 if(s.carry&&Object.values(s.carry).some(v=>typeof v!=='number'||!Number.isFinite(v)))fail('SAVE_CARRY');
 if(Object.values(s.traits).some(v=>typeof v!=='boolean'))fail('SAVE_TRAITS');
 if(s.lastSalaryPaidYear!==null&&(!Number.isSafeInteger(s.lastSalaryPaidYear)||s.lastSalaryPaidYear>=s.year))fail('SAVE_PAYMENT_BOUNDARY');
 if(s.pendingEvent!==null||s.eventSeasonContext!==null||s.eventDrawYear!==s.year)fail('SAVE_EVENT_BOUNDARY');
 if(s.ct!==null){const ct=s.ct;if(!ct||ct.schemaVersion!==3||typeof ct.contractId!=='string'||!Array.isArray(ct.annualSchedule))fail('SAVE_CONTRACT');const seen=new Set();for(const row of ct.annualSchedule){if(!Number.isSafeInteger(row.year)||seen.has(row.year)||!Number.isFinite(row.amount)||row.amount<0||typeof row.paid!=='boolean'||(row.year===s.year&&row.paid))fail('SAVE_CONTRACT');seen.add(row.year);}}
 return e;
}
export function createSaveEnvelope(state,{careerId,revision,savedAt=new Date().toISOString(),checkpointReady=false}={}){
 if(!checkpointReady)fail('SAVE_NOT_READY');
 const data=copySaveData(state,{stateRoot:true});
 const envelope=validateSaveEnvelope({format:'yakyujinsei-career-save',schemaVersion:2,compatibilityId:SAVE_COMPATIBILITY,gameVersion:VERSION,savedAt,careerId,revision,checkpoint:{kind:'YEAR_START_READY',year:data.year,age:data.age,stageYr:data.stageYr,eventYearInitialized:true},state:data,awardProofs:captureCompletedAwardProofs(state)});
 captures.set(envelope,JSON.stringify(envelope));return envelope;
}

export function cloneCapturedSaveEnvelope(envelope){
 if(!captures.has(envelope))fail('SAVE_UNTRUSTED_CAPTURE');
 const snapshot=validateSaveEnvelope(envelope);
 if(captures.get(envelope)!==JSON.stringify(snapshot))fail('SAVE_CAPTURE_CHANGED');
 captures.set(snapshot,JSON.stringify(snapshot));return snapshot;
}
