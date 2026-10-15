import {consumerTreatmentView} from './award-consumer-policy.js';
export function promotionSalaryUpdate(currentSalary, candidateSalary, contract) {
  return contractSalaryUpdate(currentSalary, candidateSalary, contract, true);
}

export function calculateSalaryCurve(rating, curve) {
  const value = Math.max(0, Math.min(26, Number(rating) || 0));
  const star = Math.max(0, value - 7);
  return Math.max(curve.min, Math.min(curve.max,
    curve.base + value * curve.linear + star * star * curve.quadratic));
}

export function roundToTenThousandYen(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return 0;
  return Math.max(0, Math.round(amount / 10_000) * 10_000);
}

export function convertRatingBetweenLevels(rating, fromLevel, toLevel, levelTable) {
  if (fromLevel === toLevel) return Number(rating) || 0;
  const fromPar = Number(levelTable?.[fromLevel]?.par);
  const toPar = Number(levelTable?.[toLevel]?.par);
  if (!Number.isFinite(fromPar) || !Number.isFinite(toPar)) {
    throw new Error('UNKNOWN_LEVEL_FOR_RATING_CONVERSION');
  }
  return (Number(rating) || 0) + fromPar - toPar;
}

export function synchronizeContractSalary(contract, annualSalary) {
  if (!contract) return null;
  const years = Math.max(1, Math.round(Number(contract.remainingYears ?? contract.yrs ?? 1) || 1));
  const annual = roundToTenThousandYen(annualSalary);
  return {
    ...contract,
    yrs: years,
    remainingYears: years,
    annualSalary: annual,
    totalValue: annual * years,
  };
}

export function calculateLegacyContractBuyout({
  contract,
  currentSalary,
  currentYear,
  lastSalaryPaidYear,
  rate,
}) {
  const contractAnnual = Number(contract?.annualSalary);
  const annualSalary = roundToTenThousandYen(
    contractAnnual > 0 ? contractAnnual : currentSalary,
  );
  const contractYears = Math.max(
    0,
    Math.round(Number(contract?.remainingYears ?? contract?.yrs ?? 0) || 0),
  );
  const currentSeasonPaid = lastSalaryPaidYear === currentYear;
  const unpaidYears = Math.max(0, contractYears - (currentSeasonPaid ? 1 : 0));
  const fullRemainingValue = annualSalary * unpaidYears;
  const normalizedRate = Math.max(0, Math.min(1, Number(rate) || 0));
  return {
    annualSalary,
    unpaidYears,
    fullRemainingValue,
    buyoutAmount: roundToTenThousandYen(fullRemainingValue * normalizedRate),
    currentSeasonPaid,
  };
}

export function recordAnnualSalaryPayment(state, year, annualSalary) {
  if (state.lastSalaryPaidYear === year) throw new Error('SALARY_ALREADY_PAID_FOR_YEAR');
  const paid = roundToTenThousandYen(annualSalary);
  return {
    ...state,
    careerEarnings: (Number(state.careerEarnings) || 0) + paid,
    lastSalaryPaidYear: year,
  };
}

export function migrateLegacySalaryState(state) {
  const migrated = {
    ...state,
    lastSalaryPaidYear: Object.hasOwn(state, 'lastSalaryPaidYear') ? state.lastSalaryPaidYear : null,
    careerBuyout: Object.hasOwn(state, 'careerBuyout') ? Number(state.careerBuyout) || 0 : 0,
    salaryEvaluationHistory: Array.isArray(state.salaryEvaluationHistory) ? state.salaryEvaluationHistory.slice(-3) : [],
    lastSalaryEvaluation: Object.hasOwn(state, 'lastSalaryEvaluation') ? state.lastSalaryEvaluation : null,
    lastSalaryDecision: Object.hasOwn(state, 'lastSalaryDecision') ? state.lastSalaryDecision : null,
    salaryDecisionHistory: Array.isArray(state.salaryDecisionHistory) ? state.salaryDecisionHistory.slice() : [],
    contractSequence: Math.max(0, Math.round(Number(state.contractSequence) || 0)),
  };
  if (state.ct) {
    migrated.ct = normalizeContract(state.ct, { currentYear: state.year, currentSalary: state.currentSalary, org: state.org, teamId: state.orgTeamId });
    const due = migrated.ct.annualSchedule.find(item => item.year === Number(state.year) && !item.paid);
    migrated.currentSalary = due?.amount || migrated.ct.annualSalary;
  }
  return migrated;
}

export function contractSalaryUpdate(currentSalary, candidateSalary, contract, preventDecrease) {
  const annualSalary = roundToTenThousandYen(Math.max(
    Number(candidateSalary) || 0,
    preventDecrease ? Number(currentSalary) || 0 : 0,
  ));
  if (!contract) return { currentSalary: annualSalary, contract: null };
  return {
    currentSalary: annualSalary,
    contract: synchronizeContractSalary(contract, annualSalary),
  };
}

export function salaryAwardBonus(honors, year, awardState) {
  let bonus = 0;
  for(const row of consumerTreatmentView(honors,'fallback',{year,state:awardState}))bonus+=row.value;
  return Math.min(3, bonus);
}

export function salaryEvaluationD(lastD, honors, year, awardState) {
  return (Number(lastD) || 0) + salaryAwardBonus(honors, year, awardState);
}
import { normalizeContract } from './contract-policy.js';
