import {consumerTreatmentView} from './award-consumer-policy.js';
const roundYen=value=>Math.max(0,Math.round((Number(value)||0)/10000)*10000);
const FULL_AWARD_CODES=['MVP','BEST_PITCHER','SAWAMURA','TITLE','GOLD_GLOVE'];

export function createIncentiveTerms({org,annualSalary}){
  const rate=(org==='MLB'||org==='MiLB') ? .10 : ['NPB','KBO','CPBL'].includes(org) ? .07 : 0;
  if(!rate)return null;
  return{annualMax:roundYen((Number(annualSalary)||0)*rate),rate,fullAwardCodes:[...FULL_AWARD_CODES],halfPayDThreshold:3};
}

export function evaluateIncentive({terms,evaluation,honors=[],year,awardState}){
  if(!terms)return{level:'NONE',amount:0,reasonCodes:['NO_INCENTIVE_TERMS']};
  const codes=consumerTreatmentView(honors,'incentive',{year,state:awardState}).map(row=>row.value);
  if(codes.some(code=>(terms.fullAwardCodes||FULL_AWARD_CODES).includes(code)))return{level:'FULL',amount:roundYen(terms.annualMax),reasonCodes:['FULL_AWARD',...new Set(codes)]};
  if(!evaluation||evaluation.sampleStatus==='INSUFFICIENT')return{level:'NONE',amount:0,reasonCodes:['INSUFFICIENT_SAMPLE']};
  if(Number(evaluation.payD)>=Number(terms.halfPayDThreshold??3))return{level:'HALF',amount:roundYen(Number(terms.annualMax)/2),reasonCodes:['PAY_D_THRESHOLD']};
  return{level:'NONE',amount:0,reasonCodes:['BELOW_THRESHOLD']};
}

export function applyIncentivePayment(state,{contract,evaluation,honors,year,awardState=state}){
  const key=String(year),existing=state.yearlyIncentivePaid?.[key];if(existing)return{state,result:existing,paid:false};
  const result=evaluateIncentive({terms:contract?.incentive,evaluation,honors,year,awardState}),record={contractId:contract?.contractId||null,amount:result.amount,level:result.level};
  return{state:{...state,careerIncentive:(Number(state.careerIncentive)||0)+result.amount,careerEarnings:(Number(state.careerEarnings)||0)+result.amount,yearlyIncentivePaid:{...(state.yearlyIncentivePaid||{}),[key]:record}},result:{...result,contractId:record.contractId},paid:true};
}
