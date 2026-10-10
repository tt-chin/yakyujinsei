const POINTS=Object.freeze({優勝:7,準優勝:5,ベスト4:3,ベスト8:1});
const count=v=>Number.isFinite(v)?Math.max(0,Math.floor(v)):0;
const dictionary=v=>v&&typeof v==='object'&&!Array.isArray(v)?v:{};
export const INTLACE_UNLOCK_TEXT='日本代表として3大会以上に出場し、2度の決勝進出を達成。次回の代表出場から、大会による故障リスクの加算がなくなり、獲得する能力ポイントが最低2点になる。';
export const isInternationalFinal=rank=>rank==='優勝'||rank==='準優勝';

export function normalizeInternationalState(s){
  s.intlTraitResults=dictionary(s.intlTraitResults);
  s.intlCompletedKeys=dictionary(s.intlCompletedKeys);
  s.traits ||= {};
  if(s.internationalTraitMigrationVersion===1)return;
  const played=new Map();
  for(const text of Array.isArray(s.honors)?s.honors:[]){
    const m=/^(\d{4}) (ワールド・ベースボール・クラシック|WBSCプレミア12)(優勝|準優勝|ベスト4|ベスト8)$/.exec(text);
    if(m){const key=(m[2]==='WBSCプレミア12'?'P12:':'WBC:')+m[1];played.set(key,Boolean(played.get(key))||isInternationalFinal(m[3]));}
  }
  for(const [key,r] of Object.entries(s.intlTraitResults))if(r?.eventKey===key&&Object.hasOwn(POINTS,r.rank))played.set(key,isInternationalFinal(r.rank));
  const restoredFinals=[...played.values()].filter(Boolean).length;
  s.intlCount=Math.max(count(s.intlCount),played.size);
  s.intlFinalCount=Number.isInteger(s.intlFinalCount)&&s.intlFinalCount>=0?s.intlFinalCount:Math.max(count(s.intlTop4),restoredFinals);
  s.intlCount=Math.max(s.intlCount,s.intlFinalCount);
  if(s.intlCount>=3&&s.intlFinalCount>=2)s.traits.intlace=true;
  s.internationalTraitMigrationVersion=1;
}

// Validate before consuming RNG; the caller computes stats on a copy, never on S.
export function validateInternationalEntry(s){
  if(!Number.isFinite(s.pool)||!Number.isFinite(s.injNext)||!Array.isArray(s.honors)||!s.intlStat||Object.values(s.intlStat).some(v=>!Number.isFinite(v)))throw new Error('INVALID_INTERNATIONAL_STATE');
}
export function prepareInternationalResult(s,e,{rank,stats,hadIntlace}){
  if(!Object.hasOwn(POINTS,rank)||!stats||Object.values(stats).some(v=>!Number.isFinite(v)))throw new Error('INVALID_INTERNATIONAL_RESULT');
  const basePoints=POINTS[rank],finalReached=isInternationalFinal(rank),intlCount=s.intlCount+1,intlFinalCount=s.intlFinalCount+(finalReached?1:0);
  const result={eventKey:e.eventKey,year:s.year,rank,hadIntlace,basePoints,awardedPoints:hadIntlace?Math.max(basePoints,2):basePoints,injuryAdded:hadIntlace?0:10,finalReached,unlockedIntlace:!hadIntlace&&intlCount>=3&&intlFinalCount>=2};
  return {result,stats:{...stats},intlCount,intlFinalCount,honorText:`${s.year} ${e.name}${rank}`};
}
export function commitInternationalResult(s,prepared){
  const {result}=prepared,key=result.eventKey;
  if(s.intlCompletedKeys[key])return {result:s.intlTraitResults[key]||null,created:false};
  Object.assign(s,{intlStat:prepared.stats,pool:s.pool+result.awardedPoints,injNext:s.injNext+result.injuryAdded,intlCount:prepared.intlCount,intlFinalCount:prepared.intlFinalCount,intlLastEventKey:key,intlDispatchStatus:null});
  if(!s.honors.includes(prepared.honorText))s.honors.push(prepared.honorText);
  if(result.unlockedIntlace)s.traits.intlace=true;
  s.intlTraitResults[key]=result;
  s.intlCompletedKeys[key]=true;
  return {result,created:true};
}
