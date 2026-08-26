export function promotionSalaryUpdate(currentSalary, candidateSalary, contract) {
  return contractSalaryUpdate(currentSalary, candidateSalary, contract, true);
}

export function contractSalaryUpdate(currentSalary, candidateSalary, contract, preventDecrease) {
  const annualSalary = Math.max(
    0,
    Math.round(Number(candidateSalary) || 0),
    preventDecrease ? Math.round(Number(currentSalary) || 0) : 0,
  );
  if (!contract) return { currentSalary: annualSalary, contract: null };
  const years = Math.max(1, Math.round(Number(contract.yrs || contract.remainingYears) || 1));
  return {
    currentSalary: annualSalary,
    contract: {
      ...contract,
      annualSalary,
      totalValue: annualSalary * years,
    },
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
