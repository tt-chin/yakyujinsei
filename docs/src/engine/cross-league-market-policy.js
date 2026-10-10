const round=value=>Math.max(0,Math.round((Number(value)||0)/10000)*10000);
const floor=value=>Math.max(0,Math.floor(value/10000)*10000);
const FIRST_TEAM=new Set(['NPB1','KBO1','CPBL1']);
const recordedFirstTeamYears=state=>Object.fromEntries((state.log||[]).filter(e=>FIRST_TEAM.has(e.level)&&Number(e.seasonFactor)>=.5&&Number.isFinite(Number(e.y??e.year))).map(e=>[String(e.y??e.year),e.level]));
export function effectiveMarketOrg(level,org) {if(level==='MLB')return'MLB';if(['R','A1','A2','A3'].includes(level))return'MiLB';return org;}
export function marketTier({overall=0,marketRating=0,history=[]}={}) {
  const valid=history.slice(-3).filter(e=>FIRST_TEAM.has(e.level)&&e.sampleStatus!=='INSUFFICIENT'&&Number.isFinite(Number(e.payD)));
  if(overall>=65&&marketRating>=6&&valid.filter(e=>e.payD>=6).length>=2)return'ELITE';
  return overall>=60&&marketRating>=3&&valid.filter(e=>e.payD>=3).length>=2?'STAR':'NORMAL';
}
export function accrueForeignFirstTeamSeason(state) {
  state.foreignFirstTeamYears=state.foreignFirstTeamYears||recordedFirstTeamYears(state);
  if(FIRST_TEAM.has(state.lv)&&Number(state.seasonFactor)>=.5)state.foreignFirstTeamYears[String(state.year)]=state.lv;
  return Object.keys(state.foreignFirstTeamYears).length;
}
export function foreignProSeasons(state={}) {
  if(state.foreignFirstTeamYears)return Object.keys(state.foreignFirstTeamYears).length;
  // Only explicit historical level and workload evidence; never infer from league aggregates.
  return Object.keys(recordedFirstTeamYears(state)).length;
}
export function getCrossLeaguePolicy({sourceOrg,targetOrg,sourceLevel,targetLevel,age=0,serviceYears=0,hasAmericanExperience=false,tier='NORMAL',transferType='TRANSFER',mlbServiceYears=0}={}) {
  sourceOrg=effectiveMarketOrg(sourceLevel,sourceOrg);targetOrg=effectiveMarketOrg(targetLevel,targetOrg);
  const star=tier!=='NORMAL',elite=tier==='ELITE',american=sourceOrg==='MLB'||sourceOrg==='MiLB';
  const restricted=['MLB','MiLB'].includes(targetOrg)&&!american&&!hasAmericanExperience&&!(age>=25&&serviceYears>=6);
  const eligibilityType=restricted?'MLB_INTL_RESTRICTED':['MLB','MiLB'].includes(targetOrg)&&!american?'FOREIGN_PRO_EXEMPT':'NORMAL';
  const same=sourceOrg===targetOrg||american&&['MLB','MiLB'].includes(targetOrg);
  const table={CPBL:{NPB:[1,.60,2.5,4],KBO:[.95,.60,2,3],MLB:[1,.70,1.5,2],MiLB:[1,.70,2.5,4]},KBO:{NPB:[1,.65,3,4],CPBL:[1,.65,3,4],MLB:[1,.70,1.5,2],MiLB:[1,.70,3,4]},NPB:{KBO:[1,.70,2,4],CPBL:[1,.65,3,5],MLB:[1,.70,Infinity,Infinity],MiLB:[1,.70,2.5,4]}};
  let params=table[targetOrg]?.[sourceOrg];
  if(!params&&['MLB','MiLB'].includes(targetOrg)&&['NPB','KBO','CPBL'].includes(sourceOrg))params=targetOrg==='MLB'?[1,.95,6,elite?Infinity:6]:[1,.80,Infinity,Infinity];
  if(!same&&!params&&!['AMATEUR','IND','CORP'].includes(sourceOrg))throw Error('UNKNOWN_CROSS_LEAGUE_ROUTE:'+sourceOrg+':'+targetOrg);
  const [marketMultiplier,routeWeight,normalCap,starCap]=params||[1,1,Infinity,Infinity];
  const released=transferType==='RELEASE_RECONTRACT',trueFa=sourceOrg==='MLB'&&targetOrg==='MLB'&&mlbServiceYears>=6&&!released;
  const hardAnnualCap={NPB_DEV:5_000_000,NPB2:16_000_000,NPB1:600_000_000,KBO2:30_000_000,CPBL2:12_000_000,CPBL1:star?100_000_000:80_000_000,R:3_000_000,A1:4_000_000,A2:6_000_000,A3:30_000_000}[targetLevel]??null;
  return {sourceOrg,targetOrg,marketMultiplier,routeWeight:trueFa?1:routeWeight,minRaiseRate:0,maxRaiseRate:released?(star?2:1.5):trueFa?Infinity:star?starCap:normalCap,maxCutRate:1,hardAnnualCap,eligibilityType,applyAnchor:!same&&!trueFa,anchorMarketCap:sourceOrg==='MLB'&&targetOrg==='NPB'?1.5:null,restrictedTargetLevel:restricted&&targetLevel==='MLB'?'R':targetLevel};
}
export function applyCrossLeagueSalary({marketSalary,previousSalary=0,levelMinimum=0,policy}) {
  const t=Math.max(0,Number(marketSalary)||0)*policy.marketMultiplier,p=Math.max(0,Number(previousSalary)||0),codes=['CROSS_LEAGUE_MARKET_ADJUSTMENT'];
  const anchor=policy.anchorMarketCap?Math.min(p,t*policy.anchorMarketCap):p;
  let raw=t;
  if(p>0&&policy.applyAnchor){raw=anchor*(1-policy.routeWeight)+t*policy.routeWeight;codes.push('PREVIOUS_SALARY_ANCHOR');}
  else if(policy.applyAnchor)codes.push('PREVIOUS_SALARY_UNAVAILABLE');
  const raiseCap=p>0&&policy.applyAnchor&&Number.isFinite(policy.maxRaiseRate)?p*policy.maxRaiseRate:null;
  if(raiseCap!==null&&raw>raiseCap){raw=raiseCap;codes.push('CROSS_LEAGUE_RAISE_CAP');}
  if(raw<levelMinimum){raw=levelMinimum;codes.push('LEAGUE_MINIMUM_APPLIED');}
  if(policy.hardAnnualCap!==null&&policy.hardAnnualCap<levelMinimum)throw Error('SALARY_POLICY_FLOOR_CAP_CONFLICT');
  if(policy.hardAnnualCap!==null&&raw>policy.hardAnnualCap){raw=policy.hardAnnualCap;codes.push('LEAGUE_REGULATORY_CAP');}
  if(policy.eligibilityType!=='NORMAL')codes.push(policy.eligibilityType);
  const annualSalary=policy.hardAnnualCap===null?round(raw):Math.min(round(raw),floor(policy.hardAnnualCap));
  return {annualSalary,marketSalary,previousSalary:p,anchorSalary:anchor,routeAdjustedMarket:t,routeMultiplier:policy.marketMultiplier,routeWeight:policy.routeWeight,raiseCap,hardAnnualCap:policy.hardAnnualCap,reasonCodes:codes,eligibilityType:policy.eligibilityType};
}
export function applyKboForeignPackageCap({annualSalary,signingBonus=0,incentiveRate=.07,postingFee=0,isRenewal=false,previousPackage=0,levelMinimum=0}) {
  const packageCap=isRenewal?Math.min(300_000_000,Math.max(150_000_000,previousPackage*1.2)):150_000_000;
  const fixed=signingBonus+postingFee,available=packageCap-fixed;
  if(available<0)throw Error('KBO_PACKAGE_FIXED_COST_EXCEEDS_CAP');
  // Apply the existing level floor after salary multipliers, before the package cap.
  // A candidate below the floor is not itself a floor/cap policy conflict.
  let salary=Math.min(round(Math.max(Number(annualSalary)||0,levelMinimum)),floor(available/(1+incentiveRate)));
  if(salary<levelMinimum)throw Error('KBO_PACKAGE_FLOOR_CAP_CONFLICT');
  while(salary+round(salary*incentiveRate)+fixed>packageCap)salary-=10000;
  if(salary<levelMinimum)throw Error('KBO_PACKAGE_FLOOR_CAP_CONFLICT');
  return {annualSalary:salary,incentiveMax:round(salary*incentiveRate),packageCap,capApplied:salary<round(annualSalary),foreignCategory:'FOREIGN_STANDARD'};
}
