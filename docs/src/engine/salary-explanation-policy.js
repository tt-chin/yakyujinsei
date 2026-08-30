const finiteOrNull = value => Number.isFinite(Number(value)) ? Number(value) : null;

export function deriveSalaryReasonCodes(input = {}) {
  const codes = [];
  const current = input.currentEvaluation || {};
  if (Number(current.performanceAdjustment) >= 1) codes.push('STRONG_PERFORMANCE');
  if (Number(current.performanceAdjustment) <= -0.75) codes.push('POOR_PERFORMANCE');
  if (Number(current.workloadAdjustment) >= 0.25) codes.push('FULL_WORKLOAD');
  if (Number(current.workloadAdjustment) <= -0.5) codes.push('LIMITED_WORKLOAD');
  if (Number(current.awardAdjustment) > 0) codes.push('AWARD_BONUS');
  if (input.sourceLevel !== input.targetLevel && Number(input.convertedMarketRating) < Number(input.sourceMarketRating)) codes.push('LEVEL_PAR_DOWNWARD_CONVERSION');
  if (input.sourceLevel !== input.targetLevel && Number(input.convertedMarketRating) > Number(input.sourceMarketRating)) codes.push('LEVEL_PAR_UPWARD_CONVERSION');
  if (Number(input.positionMultiplier) > 1) codes.push('PREMIUM_POSITION');
  if (Number(input.positionMultiplier) < 1) codes.push('DH_DISCOUNT');
  if (Number(input.contractMultiplier) > 1) codes.push('CONTRACT_PREMIUM');
  if (Number(input.contractMultiplier) < 1) codes.push('CONTRACT_DISCOUNT');
  if (input.decreaseProtectionApplied) codes.push('NO_DECREASE_PROTECTION');
  if ((input.marketComponents || []).length === 1) codes.push('ONE_YEAR_MARKET_SAMPLE');
  if (current.source && current.source !== 'ACTUAL_PERFORMANCE') codes.push('LEGACY_RATING_FALLBACK');
  if (!codes.length) codes.push('MARKET_VALUE_MAINTAINED');
  return [...new Set(codes)];
}

export function buildSalaryDecision(input = {}) {
  const previousSalary = Math.max(0, Number(input.previousSalary) || 0);
  const finalSalary = Math.max(0, Number(input.finalSalary) || 0);
  const marketComponents = (input.marketComponents || []).slice(-3).map(item => ({
    year: Number(item.year), payD: Number(item.payD) || 0,
    weight: Number(item.weight ?? item.normalizedWeight) || 0,
    contribution: Number(item.contribution) || 0,
    source: item.source || null,
  }));
  const normalized = {
    schemaVersion: 1,
    decisionYear: Number(input.decisionYear), salaryYear: Number(input.salaryYear),
    decisionType: input.decisionType || 'NEW_CONTRACT',
    sourceLevel: input.sourceLevel || null, targetLevel: input.targetLevel || null,
    previousSalary, finalSalary, changeAmount: finalSalary - previousSalary,
    changeRate: previousSalary > 0 ? (finalSalary - previousSalary) / previousSalary : null,
    sourceMarketRating: finiteOrNull(input.sourceMarketRating),
    convertedMarketRating: finiteOrNull(input.convertedMarketRating),
    baseSalary: Math.max(0, Number(input.baseSalary) || 0),
    contractMultiplier: Number(input.contractMultiplier) || 1,
    positionMultiplier: Number(input.positionMultiplier) || 1,
    floorApplied: Boolean(input.floorApplied), capApplied: Boolean(input.capApplied),
    decreaseProtectionApplied: Boolean(input.decreaseProtectionApplied),
    marketComponents,
    currentEvaluation: input.currentEvaluation ? { ...input.currentEvaluation } : null,
  };
  normalized.marketComponents.forEach(Object.freeze);
  Object.freeze(normalized.marketComponents);
  if (normalized.currentEvaluation) Object.freeze(normalized.currentEvaluation);
  const reasonCodes = Object.freeze(deriveSalaryReasonCodes(normalized));
  return Object.freeze({ ...normalized, reasonCodes });
}

export function appendSalaryDecision(history = [], decision) {
  return [...history.filter(item => !(item.salaryYear === decision.salaryYear && item.decisionType === decision.decisionType)), decision]
    .sort((a, b) => a.salaryYear - b.salaryYear)
    .slice(-10);
}

const LABELS = {
  STRONG_PERFORMANCE:'今季の実績が市場評価を押し上げました', POOR_PERFORMANCE:'今季の実績が市場評価を押し下げました',
  FULL_WORKLOAD:'十分な出場量が評価されました', LIMITED_WORKLOAD:'出場量が限られたため評価が下がりました',
  AWARD_BONUS:'受賞実績が評価に加算されました', LEVEL_PAR_DOWNWARD_CONVERSION:'上位カテゴリー基準へ換算しました',
  LEVEL_PAR_UPWARD_CONVERSION:'下位カテゴリー基準へ換算しました', PREMIUM_POSITION:'守備位置の加算係数が適用されました',
  DH_DISCOUNT:'指名打者の調整係数が適用されました', CONTRACT_PREMIUM:'契約条件の加算係数が適用されました',
  CONTRACT_DISCOUNT:'契約条件の調整係数が適用されました', NO_DECREASE_PROTECTION:'昇格・受賞などの減俸保護が適用されました',
  ONE_YEAR_MARKET_SAMPLE:'評価履歴は1年分です', LEGACY_RATING_FALLBACK:'過去年の詳細評価がないため旧方式の値を使用しました',
  MARKET_VALUE_MAINTAINED:'市場評価と契約条件に基づいて決定しました',
};

export function salaryReasonLabel(reasonCode) {
  return LABELS[reasonCode] || 'その他の契約条件';
}
