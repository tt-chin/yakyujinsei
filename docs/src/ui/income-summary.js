// Display-only classification. The original income counters and total remain untouched.
const amount=value=>{const n=Number(value);return Number.isFinite(n)?n:0;};
export function incomeSummary(state={}){
  state=state||{};
  return Object.freeze([
    ['pay','年俸・報酬',amount(state.careerBaseSalary)+amount(state.corpIncome)],
    ['incentive','出来高',amount(state.careerIncentive)],
    ['signing','契約金・支度金',amount(state.careerSigningBonus)+amount(state.careerDevelopmentStipend)],
    ['buyout','契約解除補償金',amount(state.careerBuyout)],
    ['outside','スポンサー収入',amount(state.careerOutsideIncome)],
    ['total','生涯総収入',amount(state.careerEarnings)]
  ].map(([key,label,amount])=>Object.freeze({key,label,amount})));
}
