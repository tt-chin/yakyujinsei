// Prepare the existing signed-schedule payment, not a new salary policy.
import {normalizeContract, salaryDueForYear, markSalaryPaid} from './contract-policy.js';
import {applyIncentivePayment} from './incentive-policy.js';
export function prepareSeasonPayment(state){
  if(!state.ct)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');
  const contract=state.ct.schemaVersion===3?state.ct:normalizeContract(state.ct,{currentYear:state.year,currentSalary:state.currentSalary,org:state.org,teamId:state.orgTeamId});
  if(salaryDueForYear(contract,state.year).scheduleIndex<0)throw new Error('PRO_PLAYER_WITHOUT_CONTRACT');
  if(state.lastSalaryPaidYear===state.year||contract.annualSchedule.some(row=>row.year===state.year&&row.paid))throw new Error('HISTORICAL_READ_ONLY');
  const payment=markSalaryPaid(contract,state.year),paid=payment.amount;
  const projection={careerEarnings:state.careerEarnings+paid,careerIncentive:state.careerIncentive,yearlyIncentivePaid:state.yearlyIncentivePaid};
  const incentivePayment=applyIncentivePayment(projection,{contract:payment.contract,evaluation:state.lastSalaryEvaluation,honors:state.honors,year:state.year,awardState:state});
  const values={ct:payment.contract,currentSalary:payment.contract.annualSalary||paid,
    careerBaseSalary:state.careerBaseSalary+paid,careerEarnings:incentivePayment.state.careerEarnings,lastSalaryPaidYear:state.year};
  if(incentivePayment.paid){values.careerIncentive=incentivePayment.state.careerIncentive;values.yearlyIncentivePaid=incentivePayment.state.yearlyIncentivePaid;}
  return {contractId:contract.contractId,year:state.year,paid,incentive:incentivePayment.result,
    writes:Object.entries(values).map(([key,after])=>({path:[key],before:structuredClone(state[key]),after}))};
}
