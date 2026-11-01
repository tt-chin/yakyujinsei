import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createContract } from '../docs/src/engine/contract-policy.js';
import { acceptDraftSelection, declineDraftSelection, draftSigningTerms, isDraftFallbackResult } from '../docs/src/engine/draft-signing-policy.js';
import { runChoiceAction, safeErrorCode } from '../docs/src/ui/choice-action.js';
import { productionFunction } from './retirement-hof-test-support.mjs';
import { AmateurCareer } from '../docs/src/engine/amateur-career.js';

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
const amateurSource = fs.readFileSync(new URL('../docs/src/engine/amateur-career.js', import.meta.url), 'utf8');
const contractSource = fs.readFileSync(new URL('../docs/src/engine/career-contract.js', import.meta.url), 'utf8');
assert.match(amateurSource, /if\(result==='signed'\)\{reportFlowOutcome\(\{kind:'AMATEUR_DRAFTED'\}\);return;\}/);
assert.match(amateurSource, /cb\(result\)/); assert.match(amateurSource, /cb\(declineDraftSelection\(getState\(\)\)\)/);
assert.match(contractSource, /S\.stage='PRO';S\.stageYr=0/);
assert.doesNotMatch(game + '\n' + contractSource + '\n' + amateurSource + '\n' + fs.readFileSync(new URL('../docs/src/engine/career-movement.js', import.meta.url), 'utf8'), /buildSalaryDecision\([^;]+;\s*decision\.org=/s);

// Case F: アマチュア進路の結果回報は、基準 SHA と同じ呼び出し列を保つ（第 11-B 期第 1 批）。
{
  const baseSource = execFileSync('git', ['show', '026c5cd89e3b189cf2a93e9425f344f57fafc208:docs/src/engine/game.js'], { encoding: 'utf8', maxBuffer: 20e6 });
  const amateurNames = ['enterDraftPath', 'draftFallback', 'pathChoiceHS', 'pathChoiceU4'];
  function amateurRun(source, { state, overall, draft }, picks) {
    const log = [], choices = [], reported = [];
    const S = { entryRoute: 'HS', corpYears: 0, indYears: 0, ...state };
    const context = vm.createContext({
      S, LV: { A1: { n: 'A+' }, R: { n: 'ルーキー' } }, isDraftFallbackResult, reported, AmateurCareer, DATA: {},
      ovr: () => overall, ri: low => low, R: () => 0, fmtMoney: String, salaryFor: () => 0,
      createSigningBonusTerms: () => ({ signingBonus: 0 }),
      listByOrg: () => [{ name: 'MiLB-A', teamId: 'MILB-A' }, { name: 'MiLB-B', teamId: 'MILB-B' }, { name: 'MiLB-C', teamId: 'MILB-C' }],
      migrateSalaryV130State: () => log.push(['migrate']),
      advance: () => { log.push(['advance', S.stage, S.stageYr]); },
      endGame: reason => { log.push(['endGame', reason]); },
      setAmateur: stage => { log.push(['setAmateur', stage]); S.stage = stage; S.stageYr = 0; },
      setSchool: kind => log.push(['setSchool', kind, S.stage, S.stageYr]),
      signTo: (...args) => log.push(['signTo', ...args]),
      runDraft: (fromSchool, cb) => { log.push(['runDraft', fromSchool]); cb(draft); },
      choose: (title, opts) => { log.push(['choose', title, opts.map(o => o.t)]); choices.push(opts); },
    });
    const reporter = source.includes('function reportFlowOutcome(') ? [productionFunction('reportFlowOutcome', source)] : [];
    vm.runInContext("'use strict';\nlet movement;\n" + [...reporter, ...amateurNames.map(name => productionFunction(name, source))].join('\n') + '\n' + source.match(/^  movement = function\(\)\{[^\n]+/m)[0], context);
    if (reporter.length) vm.runInContext("'use strict';const reportOriginal=reportFlowOutcome;reportFlowOutcome=outcome=>{reported.push(outcome.kind);return reportOriginal(outcome);};", context);
    vm.runInContext('movement()', context);
    for (let k = 0; k < picks.length; k++) choices[k][picks[k]].f();
    return { log, reported, open: choices.length > picks.length ? choices[picks.length].length : 0 };
  }
  function amateurLeaves(source, scenario) {
    const leaves = [];
    const walk = picks => {
      const { log, reported, open } = amateurRun(source, scenario, picks);
      if (!open) { leaves.push({ log, reported }); return; }
      for (let i = 0; i < open; i++) walk([...picks, i]);
    };
    walk([]);
    return leaves;
  }
  const scenarios = [];
  for (const draft of ['signed', 'fail']) scenarios.push(
    { state: { stage: 'HS', stageYr: 1 }, overall: 40, draft },
    { state: { stage: 'HS', stageYr: 3 }, overall: 45, draft },
    { state: { stage: 'HS', stageYr: 3 }, overall: 52, draft },
    { state: { stage: 'HS', stageYr: 3 }, overall: 56, draft },
    { state: { stage: 'U', stageYr: 2 }, overall: 40, draft },
    { state: { stage: 'U', stageYr: 4 }, overall: 45, draft },
    { state: { stage: 'CORP', entryRoute: 'HS', corpYears: 2 }, overall: 45, draft },
    { state: { stage: 'CORP', entryRoute: 'U', corpYears: 0 }, overall: 45, draft },
    { state: { stage: 'CORP', entryRoute: 'HS', corpYears: 0 }, overall: 45, draft },
    { state: { stage: 'IND' }, overall: 45, draft },
  );
  const kinds = [];
  let leafCount = 0;
  /* 末尾の advance／endGame 直前の呼び出しから、回報されるべき結果名を導く（同じ advance へ分派される結果名の取り違えを検出する）。 */
  const expectedKind = log => {
    const [last, previous] = [log.at(-1), log.at(-2)];
    if (last[0] === 'endGame') return 'AMATEUR_RETIRED';
    return { setAmateur: 'AMATEUR_JOIN_' + previous[1], setSchool: 'AMATEUR_ENTER_UNIVERSITY', signTo: 'AMATEUR_SIGNED_MILB', runDraft: 'AMATEUR_DRAFTED' }[previous[0]] || 'AMATEUR_STAY';
  };
  for (const scenario of scenarios) {
    const current = amateurLeaves(game, scenario), base = amateurLeaves(baseSource, scenario);
    assert.equal(JSON.stringify(current.map(leaf => leaf.log)), JSON.stringify(base.map(leaf => leaf.log)), JSON.stringify(scenario));
    for (const { log, reported } of current) { assert.deepEqual(reported, [expectedKind(log)], JSON.stringify(log)); kinds.push(...reported); }
    leafCount += current.length;
  }
  assert.equal(leafCount, 87);
  assert.deepEqual([...new Set(kinds)].sort(), ['AMATEUR_DRAFTED', 'AMATEUR_ENTER_UNIVERSITY', 'AMATEUR_JOIN_CORP', 'AMATEUR_JOIN_IND', 'AMATEUR_RETIRED', 'AMATEUR_SIGNED_MILB', 'AMATEUR_STAY']);
  assert.throws(() => vm.runInContext("'use strict';\n" + productionFunction('reportFlowOutcome', game) + "\nreportFlowOutcome({kind:'AMATEUR_UNKNOWN'})", vm.createContext({ advance() {}, endGame() {} })), /UNKNOWN_FLOW_OUTCOME:AMATEUR_UNKNOWN/);
}

console.log('draft signing policy tests: ok');
