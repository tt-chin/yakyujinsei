import {effectiveMarketOrg} from './cross-league-market-policy.js';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));

// Aggregated MLB seasons include injury/full-rest years and are not service proof.
export function reliableMlbServiceYears(state={}){
  const existing=Number.isSafeInteger(state.serviceTime?.MLB)&&state.serviceTime.MLB>=0?state.serviceTime.MLB:0;
  if(!Number.isSafeInteger(state.year)||state.year<1)return existing;
  const through=state.serviceTimeAccruedYear===state.year?state.year:state.year-1,years=new Map();
  for(const row of Array.isArray(state.log)?state.log:[]){
    const year=row?.y??row?.year;
    if(!Number.isSafeInteger(year)||year<1||year>through)continue;
    if(!years.has(year))years.set(year,[]);years.get(year).push(row);
  }
  // A conflicting same-year record is ambiguous, not another service season.
  const proven=[...years.values()].filter(rows=>rows.every(row=>row.level==='MLB'&&typeof row.seasonFactor==='number'&&Number.isFinite(row.seasonFactor)&&row.seasonFactor>=.5&&row.seasonFactor<=1)).length;
  return Math.max(existing,proven);
}
export function reconcileAmericanCareer(state){
  if(state?.stage!=='PRO'||!['MLB','MiLB'].includes(state.org))return state;
  state.org=effectiveMarketOrg(state.lv,state.org);
  if(state.serviceTime)state.serviceTime.MLB=reliableMlbServiceYears(state);
  return state;
}

export function getContractStage({org,level,serviceYears=0,faEligible=false}){
  if(['MLB','MiLB'].includes(org))org=effectiveMarketOrg(level,org);
  const years=Math.max(0,Number(serviceYears)||0);
  if(org==='MLB')return years>=6?'FA':years>=3?'ARBITRATION':'CONTROL';
  if(org==='NPB')return faEligible||years>=8?'FA':'CONTROL';
  if(org==='KBO'||org==='CPBL')return faEligible?'FA':'CONTROL';
  return 'CONTROL';
}

export function getNpbFaRights(serviceYears=0){const years=Math.max(0,Number(serviceYears)||0);return{domestic:years>=8,overseas:years>=9};}

export function applyForcedCutProtection(candidate,previousSalary,floorRate=.75){
  return Math.max(Number(candidate)||0,(Number(previousSalary)||0)*clamp(floorRate,0,1));
}

export function calculateControlOffer({marketSalary,previousSalary,marketRating,serviceYears,org,levelMinimum=0}){
  const years=Math.max(0,Number(serviceYears)||0),rating=Number(marketRating)||0;
  const clubMult=org==='MLB'
    ? [0.20,0.35,0.60][Math.min(2,Math.floor(years))]
    : clamp(0.91+rating*.045+Math.min(years,6)*.045,.80,1.45);
  const candidate=(Number(marketSalary)||0)*clubMult;
  const floorRate=org==='NPB'&&previousSalary>100_000_000?.60:.75,protectedBeforeMinimum=applyForcedCutProtection(candidate,previousSalary,floorRate),minimum=Number(levelMinimum)||0;
  const protectedSalary=Math.max(protectedBeforeMinimum,minimum),floorApplied=minimum>protectedBeforeMinimum;
  return{org,serviceYears:years,marketRating:rating,marketSalary:Number(marketSalary)||0,clubMult,candidate,previousSalary:Number(previousSalary)||0,floorRate,levelMinimum:minimum,protectedBeforeMinimum,protectedSalary,floorApplied};
}

export function migrateServiceTime(state={}){
  const existing=state.serviceTime||{},stats=state.stats||{};
  return{
    NPB:Math.max(Number(existing.NPB)||0,Number(state.npbFaSeasons)||0),
    MLB:reliableMlbServiceYears(state),
    KBO:Math.max(Number(existing.KBO)||0,Number(stats.KBO?.yr)||0),
    CPBL:Math.max(Number(existing.CPBL)||0,Number(stats.CPBL?.yr)||0),
  };
}
