export function promotionSalaryUpdate(currentSalary, candidateSalary, contract) {
  return contractSalaryUpdate(currentSalary, candidateSalary, contract, true);
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
  };
  if (state.ct) {
    const annual = Number(state.ct.annualSalary) || Number(state.currentSalary) || 0;
    migrated.ct = synchronizeContractSalary(state.ct, annual);
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

export function salaryAwardBonus(honors, year) {
  const currentYear = String(year);
  let bonus = 0;
  for (const honor of honors || []) {
    if (!String(honor).startsWith(currentYear + ' ')) continue;
    if (/年間MVP|最優秀投手賞|沢村賞/.test(honor)) bonus += 2;
    else if (/最多勝|最優秀防御率|最多奪三振|最多セーブ|最優秀中継ぎ|首位打者|本塁打王|打点王|最高出塁率|盗塁王|ゴールデングラブ賞|年間最優秀守備選手/.test(honor)) bonus += 1;
  }
  return Math.min(3, bonus);
}

export function salaryEvaluationD(lastD, honors, year) {
  return (Number(lastD) || 0) + salaryAwardBonus(honors, year);
}
