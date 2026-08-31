import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createContract } from '../docs/src/engine/contract-policy.js';
import { acceptDraftSelection, declineDraftSelection, draftSigningTerms } from '../docs/src/engine/draft-signing-policy.js';
import { runChoiceAction, safeErrorCode } from '../docs/src/ui/choice-action.js';

function initialState({ stage = 'HS', stageYr = 3, age = 18, year = 2028 } = {}) {
  return {
    stage, stageYr, age, year, org: stage, lv: stage, orgTeamId: 'SCHOOL',
    currentSalary: 0, ct: null, salaryEvaluationHistory: [],
    careerSigningBonus: 0, careerEarnings: 0,
    draftRights: { teamId: 'NPB-HOKKAIDO', round: 2, type: 'ROSTER', status: 'NEGOTIATING' },
  };
}

function signDraft(state, terms, teamId = 'NPB-HOKKAIDO') {
  state.stage = 'PRO'; state.stageYr = 0; state.org = 'NPB'; state.lv = terms.level; state.orgTeamId = teamId;
  state.ct = createContract({
    contractId: `draft:${state.year}`, org: 'NPB', teamId, signedYear: state.year,
    startYear: state.year + 1, years: 1, annualSalary: terms.rookieSalary, contractType: terms.contractType,
  });
  state.currentSalary = state.ct.annualSalary;
}

function accept(state, type, round) {
  state.draftRights.type = type; state.draftRights.round = round;
  return acceptDraftSelection({
    state, type, round, teamId: state.draftRights.teamId, bonus: 60_000_000,
    sign: terms => signDraft(state, terms),
  });
}

// Case A: 高校3年・通常2巡。
{
  const state = initialState();
  assert.equal(accept(state, 'ROSTER', 2), 'signed');
  assert.equal(state.stage, 'PRO'); assert.equal(state.stageYr, 0); assert.equal(state.org, 'NPB');
  assert.equal(state.lv, 'NPB2'); assert.equal(state.orgTeamId, 'NPB-HOKKAIDO');
  assert.equal(state.draftRights.status, 'SIGNED'); assert.equal(state.ct.contractType, 'CONTROL');
  assert.equal(state.currentSalary, 16_000_000);
  state.age += 1; state.year += 1; state.stageYr += 1;
  const phasePreChoices = state.stage === 'PRO' ? ['自主トレを始める'] : [];
  assert.deepEqual([state.age, state.year], [19, 2029]); assert.ok(phasePreChoices.length > 0);
}

// Case B: 高校3年・育成指名。
{
  const state = initialState(); accept(state, 'DEVELOPMENT', 1);
  assert.equal(state.lv, 'NPB_DEV'); assert.equal(state.ct.contractType, 'DEVELOPMENT');
  assert.equal(state.currentSalary, 3_000_000); assert.equal(state.draftRights.status, 'SIGNED');
}

// Case C: 大学4年からの指名受諾でも学年を持ち越さない。
{
  const state = initialState({ stage: 'U', stageYr: 4, age: 22, year: 2032 }); accept(state, 'ROSTER', 2);
  assert.equal(state.stage, 'PRO'); assert.equal(state.stageYr, 0); assert.equal(state.lv, 'NPB2');
  assert.equal(state.currentSalary, 16_000_000);
}

// Case D: 指名拒否は交渉権を破棄し、明示結果を返す。
{
  const state = initialState(); assert.equal(declineDraftSelection(state), 'declined'); assert.equal(state.draftRights, null);
}

// Case E: 契約処理の例外を再送出し、元の選択肢を操作可能なまま残す。
{
  const state = initialState(); let markup = '<button>指名を受けて入団</button>'; let reported = false;
  const originalConsoleError = console.error; console.error = () => {};
  try {
    assert.throws(() => runChoiceAction({
      action: () => acceptDraftSelection({
        state, type: 'ROSTER', round: 2, teamId: 'NPB-HOKKAIDO', bonus: 60_000_000,
        sign: () => { throw new Error('INTENTIONAL_SIGN_FAILURE'); },
      }),
      currentMarkup: () => markup, clear: () => { markup = ''; },
      restore: () => { markup = '<button>指名を受けて入団</button>'; }, reportError: () => { reported = true; },
    }), /INTENTIONAL_SIGN_FAILURE/);
  } finally { console.error = originalConsoleError; }
  assert.match(markup, /指名を受けて入団/); assert.equal(reported, true);
  assert.equal(state.draftRights.status, 'NEGOTIATING'); assert.equal(state.careerSigningBonus, 0);
}

assert.deepEqual(draftSigningTerms('ROSTER', 2), { level: 'NPB2', contractType: 'CONTROL', rookieSalary: 16_000_000 });
assert.equal(safeErrorCode(new Error('PRO_PLAYER_WITHOUT_CONTRACT')), 'PRO_PLAYER_WITHOUT_CONTRACT');
assert.equal(safeErrorCode(new TypeError('Cannot read private data')), 'UNEXPECTED_ERROR');
const game = fs.readFileSync(new URL('../docs/src/engine/game.js', import.meta.url), 'utf8');
assert.match(game, /if\(result==='signed'\)\{advance\(\);return;\}/);
assert.match(game, /cb\(result\)/); assert.match(game, /cb\(declineDraftSelection\(S\)\)/);
assert.match(game, /S\.stage='PRO';S\.stageYr=0/);
assert.doesNotMatch(game, /buildSalaryDecision\([^;]+;\s*decision\.org=/s);

console.log('draft signing policy tests: ok');
