// AF07/AF08 read-only identity view. Not connected to any consumer or award producer.
// Identity recognition is not evidence that an effect was committed or paid.
const definitions = [
  ['LEGACY_BEST_PITCHER', '最優秀投手賞'],
  ['PITCH_WINS', '最多勝利投手賞'],
  ['PITCH_ERA', '最優秀防御率投手賞'],
  ['PITCH_STRIKEOUTS', '最多三振奪取投手賞', ['最多奪三振']],
  ['PITCH_WIN_PCT', '勝率第一位投手賞'],
  ['PITCH_SAVES', '最多セーブ投手賞', ['最多セーブ']],
  ['PITCH_RELIEF', '最優秀中継ぎ投手賞', ['最優秀中継ぎ']],
  ['PITCH_TRIPLE_CROWN', '投手三冠王'],
  ['PITCH_SAWAMURA', '沢村賞'],
  ['MVP', '年間MVP'],
  ['ROOKIE', '新人王'],
  ['BATTING_AVG', '首位打者'],
  ['BATTING_HR', '本塁打王', ['ホームラン王']],
  ['BATTING_RBI', '打点王'],
  ['BATTING_SB', '盗塁王'],
  ['BATTING_OBP', '最高出塁率'],
  ['GOLD_GLOVE', 'ゴールデングラブ賞'],
  ['DEFENSE_BEST', '年間最優秀守備選手'],
  ['ALL_STAR', 'オールスターゲーム', ['オールスターゲーム(ファン投票選出)']],
  ['HITTER_TC', '打撃三冠王'],
];

export const AWARD_REGISTRY = Object.freeze(Object.fromEntries(definitions.map(
  ([awardId, displayName, aliases = []]) => [awardId, Object.freeze({
    awardId, displayName, aliases: Object.freeze(aliases),
  })],
)));

const leagueLabels = Object.freeze([
  ['メジャーリーグ', 'MLB'], ['台湾プロ野球', 'CPBL'], ['NPB', 'NPB'], ['KBO', 'KBO'],
]);
const levels = Object.freeze({
  NPB: ['NPB1', 'NPB2', 'NPB_DEV'], KBO: ['KBO1', 'KBO2'],
  CPBL: ['CPBL1', 'CPBL2'], MLB: ['MLB'],
});
const names = new Map();
for (const entry of Object.values(AWARD_REGISTRY)) {
  for (const name of [entry.displayName, ...entry.aliases]) names.set(name, entry.awardId);
}

// Candidate Chinese aliases in D2 require historical provenance not established in B1.
// Do not accept them via a caller-supplied `trusted:true` or guessed version/team.
export function getAwardDefinition(awardId) {
  return typeof awardId === 'string' && Object.hasOwn(AWARD_REGISTRY, awardId)
    ? AWARD_REGISTRY[awardId] : null;
}

/** Resolve only exact four-digit-year + known league label + name/verified alias.
 * context.level/role are optional supplied historical facts, never inferred from S.
 * context.scope can explicitly delegate another module's honor; it does not grant trust.
 * Unknown/invalid input retains originalText unchanged, without award/effect inference.
 */
export function parseAwardHonor(originalText, context = {}) {
  const unknown = (status, reason) => Object.freeze({status, reason, originalText});
  if (typeof originalText !== 'string') return unknown('INVALID', 'NON_STRING');
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    return unknown('INVALID', 'INVALID_CONTEXT');
  }
  if (['international', 'team', 'amateur'].includes(context.scope)) {
    return unknown('NOT_IN_SCOPE', 'EXPLICIT_OTHER_MODULE_CONTEXT');
  }
  if (context.scope !== undefined && context.scope !== 'personal') {
    return unknown('INVALID', 'INVALID_SCOPE');
  }
  const yearMatch = /^([0-9]{4}) (.+)$/.exec(originalText);
  if (!yearMatch || Number(yearMatch[1]) < 1) return unknown('UNKNOWN', 'UNRECOGNIZED_YEAR');
  const year = Number(yearMatch[1]);
  const rest = yearMatch[2];
  const leagueEntry = leagueLabels.find(([label]) => rest.startsWith(label));
  if (!leagueEntry) return unknown('UNKNOWN', 'UNRECOGNIZED_LEAGUE');
  const [leagueLabel, league] = leagueEntry;
  const name = rest.slice(leagueLabel.length);
  const awardId = names.get(name);
  if (!awardId) return unknown('UNKNOWN', 'UNRECOGNIZED_NAME_OR_UNVERIFIED_ALIAS');
  if (context.level !== undefined && !levels[league].includes(context.level)) {
    return unknown('INVALID', 'LEVEL_LEAGUE_CONFLICT');
  }
  if (context.role !== undefined && !['SP', 'MR', 'CL'].includes(context.role)) {
    return unknown('INVALID', 'INVALID_ROLE');
  }
  return Object.freeze({
    status: 'RECOGNIZED', awardId, year, league,
    level: context.level ?? null, role: context.role ?? null,
    displayName: AWARD_REGISTRY[awardId].displayName,
    originalText, historicalSettlement: 'HISTORICAL_UNKNOWN', decisionVerified: false,
    // Player identity is deliberately scoped by the caller's single-player input list.
    semanticKey: JSON.stringify([year, league, awardId]),
  });
}

/** No product Journal authority exists in B1. Fail closed even for plausible completed
 * schemas, known IDs or caller-supplied trust flags. This is not a Decision adapter gate.
 */
export function identifyAwardDecision(decision) {
  return Object.freeze({
    status: decision && typeof decision === 'object' && !Array.isArray(decision)
      ? 'UNVERIFIED_DECISION' : 'INVALID',
    reason: 'JOURNAL_AUTHORITY_NOT_IMPLEMENTED', decisionVerified: false,
  });
}

/** Per-player, per-call view only. Preserve order, all source texts and unknown entries;
 * merge known same year/league/ID aliases without rewriting or deleting raw honors.
 * Do not pass honors from different players as a single list.
 */
export function buildAwardIdentityView(honors, context = {}) {
  if (!Array.isArray(honors)) return Object.freeze([]);
  const rows = [], seen = new Map();
  for (const originalText of honors) {
    const identity = parseAwardHonor(originalText, context);
    if (identity.status === 'RECOGNIZED' && seen.has(identity.semanticKey)) {
      rows[seen.get(identity.semanticKey)].originalTexts.push(originalText);
      continue;
    }
    if (identity.status === 'RECOGNIZED') seen.set(identity.semanticKey, rows.length);
    rows.push({...identity, originalTexts: [originalText]});
  }
  return Object.freeze(rows.map(row => Object.freeze({
    ...row, originalTexts: Object.freeze(row.originalTexts),
  })));
}
