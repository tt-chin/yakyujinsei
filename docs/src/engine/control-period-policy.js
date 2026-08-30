const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||0));

export function getContractStage({org,serviceYears=0,faEligible=false}){
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
  const protectedBeforeMinimum=applyForcedCutProtection(candidate,previousSalary),minimum=Number(levelMinimum)||0;
  const protectedSalary=Math.max(protectedBeforeMinimum,minimum),floorApplied=minimum>protectedBeforeMinimum;
  return{org,serviceYears:years,marketRating:rating,marketSalary:Number(marketSalary)||0,clubMult,candidate,previousSalary:Number(previousSalary)||0,floorRate:.75,levelMinimum:minimum,protectedBeforeMinimum,protectedSalary,floorApplied};
}

export function migrateServiceTime(state={}){
  const existing=state.serviceTime||{},stats=state.stats||{};
  return{
    NPB:Math.max(Number(existing.NPB)||0,Number(state.npbFaSeasons)||0),
    MLB:Math.max(Number(existing.MLB)||0,Number(stats.MLB?.yr)||0),
    KBO:Math.max(Number(existing.KBO)||0,Number(stats.KBO?.yr)||0),
    CPBL:Math.max(Number(existing.CPBL)||0,Number(stats.CPBL?.yr)||0),
  };
}
