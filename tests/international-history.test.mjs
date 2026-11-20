import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildInternationalHistory, internationalHistoryHTML, appendInternationalHistory } from '../docs/src/ui/international-history.js';

// INT-01: played-tournament history (INT_01_INTL_HISTORY_PLAN §3.1). Display only: reads S.intlTraitResults,
// never S.intlCompletedKeys, never writes state, never draws RNG.
let passed = 0;
const check = (name, fn) => { fn(); passed++; };
const result = (eventKey, year, rank, personalStats) => ({ eventKey, year, rank, hadIntlace: false, basePoints: 1, awardedPoints: 1, injuryAdded: 10, finalReached: false, unlockedIntlace: false, ...(personalStats ? { personalStats } : {}) });
const pitcher = { position: 'P', role: 'SP', stats: { G: 2, IP: 9, W: 1, SV: 0, SO: 11, ER: 2 } };
const keys = rows => rows.map(r => r.eventKey);

check('no tournaments: empty frozen list, no markup, no DOM', () => {
  const never = { appendChild() { throw Error('must not append'); } };
  for (const state of [{}, { intlTraitResults: {} }, { intlTraitResults: null }, { intlTraitResults: [] }, null]) {
    const rows = buildInternationalHistory(state);
    assert.deepEqual(rows, []); assert.ok(Object.isFrozen(rows));
    assert.equal(internationalHistoryHTML(rows), '');
    appendInternationalHistory(never, rows);
  }
});

check('only played results, sorted by year; missed tournaments are not listed', () => {
  const state = { intlTraitResults: { 'P12:2031': result('P12:2031', 2031, 'ベスト4'), 'WBC:2030': result('WBC:2030', 2030, '準優勝'), 'WBC:2026': result('WBC:2026', 2026, '優勝', pitcher) }, intlCompletedKeys: { 'WBC:2026': true, 'P12:2027': true, 'WBC:2030': true, 'P12:2031': true } };
  const before = structuredClone(state), rows = buildInternationalHistory(state);
  assert.deepEqual(keys(rows), ['WBC:2026', 'WBC:2030', 'P12:2031']);
  assert.deepEqual(rows.map(r => r.name), ['ワールド・ベースボール・クラシック', 'ワールド・ベースボール・クラシック', 'WBSCプレミア12']);
  assert.deepEqual(rows.map(r => r.rank), ['優勝', '準優勝', 'ベスト4']);
  assert.ok(Object.isFrozen(rows) && rows.every(Object.isFrozen));
  assert.deepEqual(state, before);
});

check('same year: actual schedule order (PRE WBC before POST Premier12), not insertion order', () => {
  const official = [{ eventKey: 'P12:2040', name: 'WBSCプレミア12', startDate: '2040-11-10', priority: 2 }, { eventKey: 'WBC:2040', name: 'ワールド・ベースボール・クラシック', startDate: '2040-03-05', priority: 1 }];
  const state = { intlTraitResults: { 'P12:2040': result('P12:2040', 2040, '優勝'), 'WBC:2040': result('WBC:2040', 2040, 'ベスト8') } };
  assert.deepEqual(keys(buildInternationalHistory(state, official)), ['WBC:2040', 'P12:2040']);
  const html = internationalHistoryHTML(buildInternationalHistory(state, official));
  assert.ok(html.indexOf('2040 ワールド・ベースボール・クラシック　ベスト8') < html.indexOf('2040 WBSCプレミア12　優勝'));
});

check('unknown eventKey: safe name, after known tournaments of the same year; malformed entries skipped', () => {
  const state = { intlTraitResults: { 'XYZ:2030': result('XYZ:2030', 2030, '優勝'), 'WBC:2030': result('WBC:2030', 2030, 'ベスト4'), bad1: null, bad2: 'x', bad3: result(42, 2030, '優勝'), bad4: result('WBC:2034', '2034', '優勝') } };
  const rows = buildInternationalHistory(state);
  assert.deepEqual(keys(rows), ['WBC:2030', 'XYZ:2030']);
  assert.equal(rows[1].name, '国際大会');
});

check('a result counts only under its own eventKey (normalizeInternationalState rule); no duplicate rows', () => {
  const state = { intlTraitResults: { 'WBC:2030': result('WBC:2030', 2030, '優勝'), copy: result('WBC:2030', 2030, '優勝'), 'P12:2031': result('WBC:2026', 2026, '優勝') } };
  assert.deepEqual(keys(buildInternationalHistory(state)), ['WBC:2030']);
});

check('rows hand out frozen copies of the saved personal stats, never the saved objects', () => {
  const state = { intlTraitResults: { 'WBC:2026': result('WBC:2026', 2026, '優勝', structuredClone(pitcher)) } };
  const [row] = buildInternationalHistory(state), saved = state.intlTraitResults['WBC:2026'].personalStats;
  assert.notEqual(row.personalStats, saved); assert.notEqual(row.personalStats.stats, saved.stats);
  assert.deepEqual(row.personalStats, saved);
  assert.ok(Object.isFrozen(row.personalStats) && Object.isFrozen(row.personalStats.stats));
  assert.ok(!Object.isFrozen(saved) && !Object.isFrozen(saved.stats), 'saved state is not frozen by the view');
});

check('markup: collapsed rows, saved personal stats or 記録なし (never zero-filled), escaped text', () => {
  const state = { intlTraitResults: { 'WBC:2026': result('WBC:2026', 2026, '優勝', pitcher), 'P12:2027': result('P12:2027', 2027, '<b>準優勝</b>') } };
  const html = internationalHistoryHTML(buildInternationalHistory(state));
  assert.equal(html.split('data-intl-history').length, 2);
  assert.match(html, /^<section class="intl-history" data-intl-history><h4 class="intl-heading">国際大会出場履歴<\/h4>/);
  assert.equal(html.split('<details class="intl-history-item">').length, 3);
  assert.doesNotMatch(html, /\bopen\b/);
  assert.match(html, /<summary>2026 ワールド・ベースボール・クラシック　優勝<\/summary><div class="intl-personal-stats"><h4>本大会の個人成績<\/h4><p>登板 2｜投球回 9\.0｜勝利 1｜セーブ 0<\/p>/);
  assert.match(html, /<summary>2027 WBSCプレミア12　&lt;b&gt;準優勝&lt;\/b&gt;<\/summary><p>本大会の個人成績：記録なし<\/p><\/details>/);
});

check('module source draws no RNG and does not import the engine hub', () => {
  const source = readFileSync(new URL('../docs/src/ui/international-history.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /\b(?:R|ri|pick|chance|pickRecord)\s*\(/);
  assert.doesNotMatch(source, /engine\/game\.js/);
});

console.log(JSON.stringify({ internationalHistoryCases: passed, FAIL: 0 }));
