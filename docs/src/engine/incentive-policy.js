const roundYen=value=>Math.max(0,Math.round((Number(value)||0)/10000)*10000);
const FULL_AWARD_CODES=['MVP','BEST_PITCHER','SAWAMURA','TITLE','GOLD_GLOVE'];

export function createIncentiveTerms({org,annualSalary}){
  const rate=(org==='MLB'||org==='MiLB') ? .10 : ['NPB','KBO','CPBL'].includes(org) ? .07 : 0;
  if(!rate)return null;
  return{annualMax:roundYen((Number(annualSalary)||0)*rate),rate,fullAwardCodes:[...FULL_AWARD_CODES],halfPayDThreshold:3};
}

const awardCode=honor=>{
  const text=String(honor||'');
  if(/年間MVP|年度MVP/.test(text))return'MVP';
  if(/最優秀投手賞/.test(text))return'BEST_PITCHER';
  if(/沢村賞/.test(text))return'SAWAMURA';
  if(/ゴールデングラブ|最優秀守備選手|守備王/.test(text))return'GOLD_GLOVE';
  if(/最多セーブ|最優秀中継ぎ|最多奪三振|最多勝|最優秀防御率|首位打者|本塁打王|ホームラン王|盗塁王|打点王|最高出塁率|出塁王/.test(text))return'TITLE';
  return null;
};

export function evaluateIncentive({terms,evaluation,honors=[],year}){
  if(!terms)return{level:'NONE',amount:0,reasonCodes:['NO_INCENTIVE_TERMS']};
  const codes=honors.filter(h=>String(h).startsWith(String(year)+' ')).map(awardCode).filter(Boolean);
  if(codes.some(code=>(terms.fullAwardCodes||FULL_AWARD_CODES).includes(code)))return{level:'FULL',amount:roundYen(terms.annualMax),reasonCodes:['FULL_AWARD',...new Set(codes)]};
  if(!evaluation||evaluation.sampleStatus==='INSUFFICIENT')return{level:'NONE',amount:0,reasonCodes:['INSUFFICIENT_SAMPLE']};
  if(Number(evaluation.payD)>=Number(terms.halfPayDThreshold??3))return{level:'HALF',amount:roundYen(Number(terms.annualMax)/2),reasonCodes:['PAY_D_THRESHOLD']};
  return{level:'NONE',amount:0,reasonCodes:['BELOW_THRESHOLD']};
}

export function applyIncentivePayment(state,{contract,evaluation,honors,year}){
  const key=String(year),existing=state.yearlyIncentivePaid?.[key];if(existing)return{state,result:existing,paid:false};
  const result=evaluateIncentive({terms:contract?.incentive,evaluation,honors,year}),record={contractId:contract?.contractId||null,amount:result.amount,level:result.level};
  return{state:{...state,careerIncentive:(Number(state.careerIncentive)||0)+result.amount,careerEarnings:(Number(state.careerEarnings)||0)+result.amount,yearlyIncentivePaid:{...(state.yearlyIncentivePaid||{}),[key]:record}},result:{...result,contractId:record.contractId},paid:true};
}
