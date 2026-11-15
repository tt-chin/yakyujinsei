import assert from 'node:assert/strict';
import { buildEventHistory } from '../docs/src/ui/career-event-history.js';
import { EVENT_CATALOG } from '../docs/src/data/event-cards-jp.js';

// EVT-01 E3: year-by-year event history view model. Display only: the builder must not write state and must keep
// every occurrence with the values saved at resolution time.
let passed = 0;
const check = (name, fn) => { fn(); passed++; };
const events = EVENT_CATALOG.events;
const card = id => events.find(e => e.id === id);
const training = events.find(e => e.category === 'training'), encounter = events.find(e => e.category === 'encounter');
const ABL = { pow: 'パワー', con: 'ミート' };
const fmtMoney = yen => `${yen / 10000}万円`;
const yearly = [{ year: 2031 }, { year: 2032 }, { year: 2033 }, { year: 2033 }];
const result = (year, seq, cardID, extra = {}) => [`${year}:${seq}:${cardID}`, { cardID, mode: 'norm', success: true, category: card(cardID)?.category ?? 'training', year, abilityDelta: 0, statDelta: 0, injuryAdded: 0, incomeYen: 0, ...extra }];
const build = processed => buildEventHistory({ processedEventIDs: processed }, yearly, { events, abilityLabels: ABL, fmtMoney });

check('same card twice in one year keeps both occurrences in sequence order', () => {
  const h = build(Object.fromEntries([result(2031, 2, training.id), result(2031, 1, training.id)]));
  assert.equal(h.status, 'ok');
  assert.deepEqual(h.afterRow[0].map(i => i.occurrenceID), [`2031:1:${training.id}`, `2031:2:${training.id}`]);
  assert.equal(h.afterRow[0][0].title, training.n);
});

check('years without events get no row; duplicate log years attach after the last row of that year', () => {
  const h = build(Object.fromEntries([result(2031, 1, training.id), result(2033, 3, training.id)]));
  assert.deepEqual(Object.keys(h.afterRow), ['0', '3']);
  assert.equal(h.current.length, 0);
});

check('events with no matching log year or unreadable year go to the current-season group', () => {
  const h = build(Object.fromEntries([result(2034, 1, training.id), result('x', 2, training.id), result(2031, 1, training.id)]));
  assert.equal(h.current.length, 2);
  assert.equal(h.afterRow[0].length, 1);
});

check('non-object processedEventIDs is reported as missing, not as no events', () => {
  for (const bad of [undefined, null, [], 'x', 3]) {
    const h = buildEventHistory({ processedEventIDs: bad }, yearly, { events });
    assert.equal(h.status, 'missing');
    assert.deepEqual(h.current, []);
  }
});

check('unknown cardID keeps the record with a safe placeholder', () => {
  const h = build(Object.fromEntries([result(2031, 1, 999999)]));
  assert.equal(h.afterRow[0][0].title, '不明なイベント（ID 999999）');
});

check('incomplete records show 詳細記録なし and no effects', () => {
  const h = build(Object.fromEntries([result(2031, 1, training.id, { mode: undefined, statDelta: 5 })]));
  assert.equal(h.afterRow[0][0].outcome, '詳細記録なし');
  assert.deepEqual(h.afterRow[0][0].effects, []);
});

check('saved category is shown as saved, not recomputed from the card', () => {
  const h = build(Object.fromEntries([result(2031, 1, encounter.id, { category: 'training' })]));
  assert.equal(h.afterRow[0][0].category, 'training');
  assert.equal(encounter.category, 'encounter');
  const bad = build(Object.fromEntries([result(2031, 1, encounter.id, { category: 'nope' })]));
  assert.equal(bad.afterRow[0][0].category, null);
});

check('outcome and effects use the saved values; injury risk is not written as an injury', () => {
  const h = build(Object.fromEntries([result(2031, 1, training.id, { mode: 'bold', success: false, abilityDelta: -1, target: 'pow', statDelta: -2, injuryAdded: 3, incomeYen: 1200000 })]));
  const item = h.afterRow[0][0];
  assert.equal(item.outcome, '勝負失敗');
  assert.deepEqual(item.effects, ['能力低下：パワー：-1', '成績点-2', '故障リスク加算+3ポイント（故障確定ではありません）', 'スポンサー収入：120万円']);
  assert(!item.effects.some(t => /故障しました|負傷/.test(t)));
});

check('builder does not mutate state', () => {
  const processed = Object.fromEntries([result(2031, 1, training.id)]);
  const state = { processedEventIDs: processed };
  const before = JSON.stringify(state);
  build(processed); buildEventHistory(state, yearly, { events });
  assert.equal(JSON.stringify(state), before);
});

console.log(JSON.stringify({ careerEventHistoryCases: passed, FAIL: 0 }));
