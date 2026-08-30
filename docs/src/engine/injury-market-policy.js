export const INJURY_WEIGHTS={HEALTHY:[.1,.3,.6],MINOR:[.15,.35,.5],MAJOR:[.25,.4,.35],REHAB:[.3,.5,.2]};

export function classifyMarketInjury({seasonFactor=1,rehab=0,skipMid=false,majorInjuryOccurred=false}={}){
  const factor=Number(seasonFactor)||0;
  if(Number(rehab)>0||(skipMid&&factor===0))return'REHAB';
  if(majorInjuryOccurred||(factor>0&&factor<.5))return'MAJOR';
  if(factor>=.5&&factor<.95)return'MINOR';
  if(factor>=.95)return'HEALTHY';
  return'MAJOR';
}

export function isRecentStar(history=[]){
  const eligible=[...history].sort((a,b)=>b.year-a.year).filter(x=>x.marketInjury==='HEALTHY'||x.marketInjury==='MINOR').slice(0,2);
  return eligible.length===2&&eligible.reduce((sum,x)=>sum+(Number(x.payD)||0),0)/2>=7;
}

export function injurySalaryMultiplier(status,isStar=false){
  return({HEALTHY:1,MINOR:.93,MAJOR:isStar ? .82 : .70,REHAB:isStar ? .72 : .55})[status]??1;
}

export function injuryMarketLimits(status,normalMaxYears=4){
  if(status==='MAJOR')return{offerAdjustment:-1,maxYears:Math.min(3,normalMaxYears),preferProof:true};
  if(status==='REHAB')return{offerAdjustment:-2,maxYears:Math.min(2,normalMaxYears),preferProof:true};
  return{offerAdjustment:0,maxYears:normalMaxYears,preferProof:false};
}
