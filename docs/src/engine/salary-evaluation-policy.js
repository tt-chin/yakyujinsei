export const PAY_D_MIN = 0;
export const PAY_D_MAX = 26;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const round2 = value => Math.round((finite(value) + Number.EPSILON) * 100) / 100;

export function calculateRateStats(playerType, stats = {}) {
  if (playerType === 'P') {
    const ip = finite(stats.IP);
    return {
      ERA: ip > 0 ? finite(stats.ER) * 9 / ip : 0,
      WHIP: ip > 0 ? (finite(stats.H) + finite(stats.BB)) / ip : 0,
    };
  }
  const ab = finite(stats.AB), pa = finite(stats.PA);
  const avg = ab > 0 ? finite(stats.H) / ab : 0;
  const obp = pa > 0 ? (finite(stats.H) + finite(stats.BB)) / pa : 0;
  const slg = finite(stats.SLG ?? stats.slg);
  return { AVG: avg, OBP: obp, SLG: slg, OPS: obp + slg };
}

export function calculateSampleStatus({ playerType, role, stats = {}, gamesInLevel }) {
  const games = Math.max(0, finite(gamesInLevel));
  const target = playerType === 'P'
    ? (role === 'SP' ? games * 0.90 : games * 0.35)
    : games * 3.10;
  const actual = playerType === 'P'
    ? (role === 'SP' ? finite(stats.IP) : finite(stats.G))
    : finite(stats.PA);
  const sampleRatio = target > 0 ? actual / target : 0;
  const sampleStatus = sampleRatio >= 0.75 ? 'FULL' : sampleRatio >= 0.35 ? 'PARTIAL' : 'INSUFFICIENT';
  return { sampleStatus, sampleRatio, actual, target };
}

export function calculateWorkloadAdjustment(sampleRatio) {
  return clamp((finite(sampleRatio) - 1) * 1.5, -1.0, 0.75);
}

export function calculatePitcherPerformanceAdjustment({ era, whip, baseline, sampleStatus }) {
  if (sampleStatus === 'INSUFFICIENT') return 0;
  const eraComponent = (finite(baseline?.pitcherERA) - finite(era)) / 0.80 * 0.90;
  const whipComponent = (finite(baseline?.pitcherWHIP) - finite(whip)) / 0.18 * 0.60;
  const adjustment = clamp(eraComponent + whipComponent, -1.5, 2.5);
  return sampleStatus === 'PARTIAL' ? adjustment * 0.65 : adjustment;
}

export function calculateHitterPerformanceAdjustment({ avg, ops, baseline, sampleStatus }) {
  if (sampleStatus === 'INSUFFICIENT') return 0;
  const opsComponent = (finite(ops) - finite(baseline?.hitterOPS)) / 0.080 * 0.90;
  const avgComponent = (finite(avg) - finite(baseline?.hitterAVG)) / 0.030 * 0.40;
  const adjustment = clamp(opsComponent + avgComponent, -1.5, 2.5);
  return sampleStatus === 'PARTIAL' ? adjustment * 0.65 : adjustment;
}

export function calculateMarketAwardAdjustment(honors = [], year) {
  const prefix = String(year) + ' ';
  let bonus = 0;
  for (const honor of new Set(honors.map(String))) {
    if (!honor.startsWith(prefix)) continue;
    if (/年間MVP|最優秀投手賞|沢村賞/.test(honor)) bonus += 0.75;
    else if (/最多勝|最優秀防御率|最多奪三振|最多セーブ|最優秀中継ぎ|首位打者|本塁打王|打点王|最高出塁率|盗塁王/.test(honor)) bonus += 0.35;
    else if (/ゴールデングラブ賞|年間最優秀守備選手|新人王/.test(honor)) bonus += 0.25;
  }
  return round2(Math.min(1.5, bonus));
}

export function calculatePayD({ baseD, performanceAdjustment, workloadAdjustment, awardAdjustment }) {
  return round2(finite(baseD) + finite(performanceAdjustment) + finite(workloadAdjustment) + finite(awardAdjustment));
}

export function appendSalaryEvaluation(history = [], entry) {
  return [...history.filter(item => item.year !== entry.year), entry]
    .sort((a, b) => a.year - b.year)
    .slice(-3);
}

export function calculateMarketRating(history = [], options = {}) {
  const recent = [...history].sort((a, b) => a.year - b.year).slice(-3);
  const table={HEALTHY:[0.1,0.3,0.6],MINOR:[0.15,0.35,0.5],MAJOR:[0.25,0.4,0.35],REHAB:[0.3,0.5,0.2]};
  const fullWeights=table[options.marketInjury]||table.HEALTHY;
  const rawWeights=fullWeights.slice(3-recent.length);
  const weightTotal = rawWeights.reduce((sum, value) => sum + value, 0);
  const components = recent.map((entry, index) => {
    const normalizedWeight = weightTotal ? rawWeights[index] / weightTotal : 0;
    return {
      year: entry.year,
      payD: finite(entry.payD),
      rawWeight: rawWeights[index],
      normalizedWeight,
      contribution: finite(entry.payD) * normalizedWeight,
    };
  });
  return { marketRating: round2(components.reduce((sum, item) => sum + item.contribution, 0)), components };
}

export function hasActualPerformanceData(playerType, stats) {
  if (!stats || typeof stats !== 'object') return false;
  const required = playerType === 'P' ? ['G', 'IP', 'ER', 'H', 'BB'] : ['G', 'PA', 'AB', 'H', 'BB'];
  return required.every(key => Object.hasOwn(stats, key) && Number.isFinite(Number(stats[key])));
}

export function buildSalaryEvaluationEntry({ year, age, level, org, role, position, playerType, baseD, stats, gamesInLevel, baseline, honors }) {
  const rateStats = calculateRateStats(playerType, stats);
  const sample = calculateSampleStatus({ playerType, role, stats, gamesInLevel });
  const workloadAdjustment = calculateWorkloadAdjustment(sample.sampleRatio);
  const performanceAdjustment = playerType === 'P'
    ? calculatePitcherPerformanceAdjustment({ era: rateStats.ERA, whip: rateStats.WHIP, baseline, sampleStatus: sample.sampleStatus })
    : calculateHitterPerformanceAdjustment({ avg: rateStats.AVG, ops: rateStats.OPS, baseline, sampleStatus: sample.sampleStatus });
  const awardAdjustment = calculateMarketAwardAdjustment(honors, year);
  const reasons = [sample.sampleStatus + '_SAMPLE'];
  if (performanceAdjustment > 0) reasons.push(playerType === 'P' ? 'PITCHING_ABOVE_BASELINE' : 'OFFENSE_ABOVE_BASELINE');
  if (performanceAdjustment < 0) reasons.push(playerType === 'P' ? 'PITCHING_BELOW_BASELINE' : 'OFFENSE_BELOW_BASELINE');
  if (awardAdjustment > 0) reasons.push('TITLE_AWARD');
  return {
    schemaVersion: 1, year, age, level, org, role: role || null, position: position || null,
    baseD: finite(baseD), performanceAdjustment: round2(performanceAdjustment),
    workloadAdjustment: round2(workloadAdjustment), awardAdjustment: round2(awardAdjustment),
    payD: calculatePayD({ baseD, performanceAdjustment, workloadAdjustment, awardAdjustment }),
    sampleStatus: sample.sampleStatus,
    statSummary: playerType === 'P'
      ? { G: finite(stats.G), PA: 0, AVG: 0, OPS: 0, IP: finite(stats.IP), ERA: round2(rateStats.ERA), WHIP: round2(rateStats.WHIP) }
      : { G: finite(stats.G), PA: finite(stats.PA), AVG: round2(rateStats.AVG), OPS: round2(rateStats.OPS), IP: 0, ERA: 0, WHIP: 0 },
    reasons,
    source: 'ACTUAL_PERFORMANCE', actualPerformanceAvailable: true, workloadAvailable: true,
  };
}

export function calculateIndependentLeagueAwardBonus(results) {
  if (!Array.isArray(results)) return 0;
  let bonus = 0;
  for (const item of results) {
    if (!item || typeof item !== 'object') continue;
    if (item.key === 'IND_REGULAR' && item.isChampion === true) bonus += 0.20;
    else if (item.key === 'IND_CHAMP' && item.isChampion === true) bonus += 0.35;
    else if (item.key === 'IND_CHAMP' && item.resultIndex === 1) bonus += 0.15;
  }
  return Math.min(0.50, bonus);
}

export function buildIndependentLeagueFallbackEntry({ year, age, level = 'IND', baseD, legacyRating, tournamentResults }) {
  const legacyBaseD = Number.isFinite(Number(baseD)) ? Number(baseD) : finite(legacyRating);
  const awardAdjustment = calculateIndependentLeagueAwardBonus(tournamentResults);
  const seasonPayD = round2(clamp(legacyBaseD + awardAdjustment, PAY_D_MIN, PAY_D_MAX));
  return {
    schemaVersion: 1, year, age, level, org: 'IND', role: null, position: null,
    baseD: legacyBaseD, performanceAdjustment: 0, workloadAdjustment: 0,
    awardAdjustment: round2(awardAdjustment),
    payD: seasonPayD, seasonPayD,
    sampleStatus: 'INSUFFICIENT', reasons: ['INDIVIDUAL_STATS_NOT_IMPLEMENTED'],
    source: 'LEGACY_NO_INDIVIDUAL_STATS', actualPerformanceAvailable: false,
    workloadAvailable: false, fallbackReason: 'INDIVIDUAL_STATS_NOT_IMPLEMENTED',
  };
}
