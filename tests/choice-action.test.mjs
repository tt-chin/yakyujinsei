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
