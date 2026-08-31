import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createChoiceActionToken, runChoiceAction } from '../docs/src/ui/choice-action.js';

function harness() {
  let generation = 1;
  let markup = '<button>A</button>';
  let disabled = 0;
  let cleared = 0;
  const debugEvents = [];
  const token = createChoiceActionToken(generation);
  const run = action => runChoiceAction({
    action, token,
    currentGeneration: () => generation,
    currentMarkup: () => markup,
    disableAll: () => { disabled += 1; },
    clear: () => { cleared += 1; markup = ''; },
    restore: () => { generation += 1; markup = '<button>A</button>'; },
    reportError: () => {},
    debug: (name, details) => debugEvents.push([name, details]),
  });
  return { run, token, get generation() { return generation; }, set generation(value) { generation = value; }, get markup() { return markup; }, set markup(value) { markup = value; }, get disabled() { return disabled; }, get cleared() { return cleared; }, debugEvents };
}

function nestedHarness() {
  let generation = 0; let activeToken = null; let markup = ''; let pointerEvents = ''; let enabled = true;
  const debugEvents = []; const invariantEvents = [];
  const makeChoice = (label, action) => {
    generation += 1; const token = createChoiceActionToken(generation); activeToken = token;
    markup = `<button>${label}</button>`; pointerEvents = ''; enabled = true;
    return () => runChoiceAction({
      action, token, currentGeneration: () => generation, currentToken: () => activeToken,
      activateToken: value => { activeToken = value; },
      isCurrentChoice: () => markup === `<button>${label}</button>`, buttonLabel: label,
      currentMarkup: () => markup, disableAll: () => { enabled = false; pointerEvents = 'none'; },
      clear: () => { markup = ''; pointerEvents = ''; }, restore: () => makeChoice(label, action),
      reportError: () => {}, debug: (name, details) => debugEvents.push([name, details]),
      reportInvariant: (name, details) => invariantEvents.push([name, details]),
    });
  };
  return { makeChoice, debugEvents, invariantEvents, get generation() { return generation; }, set generation(v) { generation = v; }, get markup() { return markup; }, get pointerEvents() { return pointerEvents; }, get enabled() { return enabled; } };
}

// トレード噂を含む全choice共通: rapid tapでもaction本体は一度だけ。
{
  const h = harness(); let actions = 0; let trades = 0; const cards = [];
  const action = () => { actions += 1; if (true) { trades += 1; cards.push('噂が現実に'); } else cards.push('騒いだだけで何もなし'); };
  assert.equal(h.run(action), undefined);
  assert.equal(h.run(action), 'duplicate');
  assert.equal(actions, 1); assert.equal(trades, 1); assert.deepEqual(cards, ['噂が現実に']);
  assert.equal(h.disabled, 1); assert.equal(h.cleared, 1);
  assert.equal(h.debugEvents[0][0], 'DUPLICATE_CHOICE_ACTION_BLOCKED');
}

// 健康診断Aから成績表示Bを生成しても、Bの初回tapはproSeasonを一度実行する。
{
  const h = nestedHarness(); let proSeasons = 0; let clickB;
  const clickA = h.makeChoice('シーズン半ばの健康診断', () => { clickB = h.makeChoice('今季の成績を見る', () => { proSeasons += 1; }); });
  clickA(); assert.equal(h.pointerEvents, ''); assert.equal(h.enabled, true);
  clickB(); clickB(); assert.equal(proSeasons, 1); assert.equal(h.debugEvents.at(-1)[0], 'DUPLICATE_CHOICE_ACTION_BLOCKED');
}

// nested A→B→Cでは各新世代の初回だけが実行され、Aのqueued clickはB/Cを消さない。
{
  const h = nestedHarness(); const calls = []; let clickB; let clickC;
  const clickA = h.makeChoice('A', () => { calls.push('A'); clickB = h.makeChoice('B', () => { calls.push('B'); clickC = h.makeChoice('C', () => calls.push('C')); }); });
  clickA(); clickA(); assert.match(h.markup, />B</); clickB(); clickB(); assert.match(h.markup, />C</); clickC();
  assert.deepEqual(calls, ['A','B','C']);
}

// 数値generationがずれても、現在表示中のbuttonはinvariantを記録して初回実行を救済する。
{
  const h = nestedHarness(); let calls = 0; const click = h.makeChoice('現在の選択', () => { calls += 1; });
  h.generation += 1; click(); assert.equal(calls, 1); assert.equal(h.invariantEvents[0][0], 'CURRENT_CHOICE_MARKED_STALE');
  assert.deepEqual(h.invariantEvents[0][1], { generation: 1, currentGeneration: 2, buttonLabel: '現在の選択' });
}

// action Aがchoose Bを生成した後、Aのqueued clickはBを消去できない。
{
  const h = harness(); let actions = 0;
  const actionA = () => { actions += 1; h.generation = 2; h.markup = '<button>B</button>'; };
  h.run(actionA);
  assert.equal(h.cleared, 0); assert.match(h.markup, />B</);
  assert.equal(h.run(actionA), 'stale');
  assert.equal(actions, 1); assert.match(h.markup, />B</); assert.equal(h.cleared, 0);
  assert.equal(h.debugEvents[0][0], 'STALE_CHOICE_ACTION_IGNORED');
}

// 例外時は報告後に新世代の操作可能な選択肢へ復元する。
{
  const h = harness(); const original = console.error; console.error = () => {};
  try { assert.throws(() => h.run(() => { throw new Error('INTENTIONAL_FAILURE'); }), /INTENTIONAL_FAILURE/); }
  finally { console.error = original; }
  assert.match(h.markup, />A</); assert.equal(h.generation, 2); assert.equal(h.token.running, false);
}

const game = fs.readFileSync(new URL('../docs/src/engine/game.js', import.meta.url), 'utf8');
assert.match(game, /function allocUI\(mode,label,done\)\{\s*actClear\(\); \+\+choiceGeneration;/);

console.log('choice action tests: ok');
