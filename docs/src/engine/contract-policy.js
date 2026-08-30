const roundYen = value => Math.max(0, Math.round((Number(value) || 0) / 10000) * 10000);
const cloneSchedule = schedule => schedule.map(item => {if(Number(item.amount)<0)throw new Error('NEGATIVE_CONTRACT_AMOUNT');return {...item,year:Number(item.year),amount:roundYen(item.amount),paid:Boolean(item.paid)};});

export function deriveContractTotals(contract) {
  const annualSchedule=cloneSchedule(contract?.annualSchedule||[]).sort((a,b)=>a.year-b.year);
  const years=new Set();for(const item of annualSchedule){if(years.has(item.year))throw new Error('DUPLICATE_CONTRACT_YEAR');years.add(item.year);if(item.amount<0)throw new Error('NEGATIVE_CONTRACT_AMOUNT');}
  const unpaid=annualSchedule.filter(item=>!item.paid),guaranteedTotal=annualSchedule.reduce((sum,item)=>sum+item.amount,0),paidTotal=annualSchedule.filter(item=>item.paid).reduce((sum,item)=>sum+item.amount,0);
  const segments=(contract?.segments||[]).map(segment=>{const rows=annualSchedule.filter(item=>item.segmentId===segment.segmentId);return{...segment,years:rows.length,annualSalary:rows[0]?.amount||0,guaranteedValue:rows.reduce((sum,item)=>sum+item.amount,0)};});
  return {...contract,annualSchedule,segments,years:annualSchedule.length,startYear:annualSchedule[0]?.year??Number(contract?.startYear),endYear:annualSchedule.at(-1)?.year??Number(contract?.endYear),guaranteedTotal,paidTotal,remainingValue:unpaid.reduce((sum,item)=>sum+item.amount,0),remainingYears:unpaid.length,annualSalary:unpaid[0]?.amount||0};
}

export function createContract({contractId,org,teamId,signedYear,startYear,years,annualSalary,contractType='NORMAL',signedMarketRating=0,positionMultiplierAtSigning=1,contractMultiplier=1,injuryProtection='FULL',incentive=null,offerBreakdown=null}) {
  const count=Math.max(1,Math.round(Number(years)||1)),annual=roundYen(annualSalary),segmentId=`${contractId}:seg-1`;
  const annualSchedule=Array.from({length:count},(_,i)=>({year:Number(startYear)+i,amount:annual,segmentId,paid:false}));
  const segments=[{segmentId,type:contractType,signedYear:Number(signedYear),startYear:Number(startYear),endYear:Number(startYear)+count-1,annualSalary:annual,years:count,guaranteedValue:annual*count}];
  return deriveContractTotals({schemaVersion:3,contractId,org,teamId,signedYear:Number(signedYear),startYear:Number(startYear),endYear:Number(startYear)+count-1,years:count,remainingYears:count,contractType,annualSalary:annual,annualSchedule,segments,guaranteedTotal:annual*count,paidTotal:0,signedMarketRating:Number(signedMarketRating)||0,positionMultiplierAtSigning:Number(positionMultiplierAtSigning)||1,contractMultiplier:Number(contractMultiplier)||1,injuryProtection,incentive:incentive?structuredClone(incentive):null,offerBreakdown:offerBreakdown?structuredClone(offerBreakdown):null,extOffered:false});
}

export function normalizeContract(contract,fallback={}) {
  if(!contract)return null;
  if(contract.schemaVersion===3)return deriveContractTotals({...contract,incentive:contract.incentive??null,offerBreakdown:contract.offerBreakdown??null,segments:(contract.segments||[]).map(x=>({...x}))});
  if(contract.schemaVersion===2)return deriveContractTotals({...contract,schemaVersion:3,incentive:null,offerBreakdown:null,segments:(contract.segments||[]).map(x=>({...x}))});
  const remaining=Math.max(1,Math.round(Number(contract.remainingYears??contract.yrs??1)||1));
  const annual=Number(contract.annualSalary)||Number(fallback.currentSalary)||0,startYear=Number.isFinite(Number(fallback.currentYear))?Number(fallback.currentYear):0;
  return createContract({contractId:contract.contractId||`LEGACY:${contract.org||fallback.org||'UNKNOWN'}:${contract.teamId||fallback.teamId||'UNKNOWN'}:${startYear}:000`,org:contract.org||fallback.org,teamId:contract.teamId||fallback.teamId,signedYear:startYear,startYear,years:remaining,annualSalary:annual,contractType:contract.contractType||'NORMAL',signedMarketRating:contract.signedMarketRating||0,positionMultiplierAtSigning:contract.positionMultiplierAtSigning||1,contractMultiplier:contract.contractMultiplier||contract.mult||1,injuryProtection:contract.injuryProtection||'FULL'});
}

export function salaryDueForYear(contract,year){const c=normalizeContract(contract,{currentYear:year}),index=c.annualSchedule.findIndex(item=>item.year===Number(year));if(index>=0)return{amount:c.annualSchedule[index].amount,scheduleIndex:index,alreadyPaid:c.annualSchedule[index].paid,contractEnded:false};return{amount:0,scheduleIndex:-1,alreadyPaid:false,contractEnded:Number(year)>c.endYear};}

export function contractContinuationForNextYear(contract,currentYear){const c=normalizeContract(contract,{currentYear});if(c.remainingYears<=0)return null;const nextYear=Number(currentYear)+1,due=salaryDueForYear(c,nextYear);if(due.scheduleIndex<0||due.alreadyPaid)throw new Error('CONTRACT_NEXT_YEAR_SCHEDULE_MISSING');return{nextYear,nextSalary:due.amount,remainingYears:c.remainingYears};}

export function markSalaryPaid(contract,year){const c=normalizeContract(contract,{currentYear:year}),due=salaryDueForYear(c,year);if(due.scheduleIndex<0)return{contract:c,amount:0,contractEnded:due.contractEnded};if(due.alreadyPaid)throw new Error('CONTRACT_SALARY_ALREADY_PAID');const schedule=cloneSchedule(c.annualSchedule);schedule[due.scheduleIndex].paid=true;return{contract:deriveContractTotals({...c,annualSchedule:schedule}),amount:due.amount,contractEnded:false};}

export function applyLevelMinimumToUnpaidSchedule(contract,minimumAnnualSalary,effectiveYear){const minimum=roundYen(minimumAnnualSalary),schedule=cloneSchedule(contract.annualSchedule).map(item=>!item.paid&&item.year>=Number(effectiveYear)?{...item,amount:Math.max(item.amount,minimum)}:item);return deriveContractTotals({...contract,annualSchedule:schedule});}

export function appendExtension(contract,input){const c=normalizeContract(contract,{currentYear:input.startYear}),startYear=Math.max(c.endYear+1,Number(input.startYear)),years=Math.max(1,Math.round(Number(input.years)||1)),annual=roundYen(input.annualSalary),segmentId=input.segmentId||`${c.contractId}:seg-${c.segments.length+1}`;const schedule=Array.from({length:years},(_,i)=>({year:startYear+i,amount:annual,segmentId,paid:false}));const segment={segmentId,type:input.contractType||'EXTENSION',signedYear:Number(input.signedYear),startYear,endYear:startYear+years-1,annualSalary:annual,years,guaranteedValue:annual*years};return deriveContractTotals({...c,incentive:input.incentive??c.incentive??null,offerBreakdown:input.offerBreakdown??c.offerBreakdown??null,extOffered:true,annualSchedule:[...c.annualSchedule,...schedule],segments:[...c.segments,segment]});}

export function transferContract(contract,{org,teamId}){return deriveContractTotals({...normalizeContract(contract,{}),org,teamId});}

export function calculateScheduledBuyout(contract,rate){const c=normalizeContract(contract,{}),unpaidSchedule=c.annualSchedule.filter(item=>!item.paid).map(item=>({...item})),remainingValue=unpaidSchedule.reduce((sum,item)=>sum+item.amount,0),buyoutRate=Math.max(0,Math.min(1,Number(rate)||0));return{unpaidSchedule,remainingValue,buyoutRate,buyoutAmount:roundYen(remainingValue*buyoutRate)};}
