export function promotionSalaryUpdate(currentSalary, candidateSalary, contract) {
  const annualSalary = Math.max(
    0,
    Math.round(Number(currentSalary) || 0),
    Math.round(Number(candidateSalary) || 0),
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
