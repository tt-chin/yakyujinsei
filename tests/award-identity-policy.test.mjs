import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {AWARD_REGISTRY, getAwardDefinition, parseAwardHonor, identifyAwardDecision,
  buildAwardIdentityView} from '../docs/src/engine/award-identity-policy.js';

let passed = 0;
const check = (name, fn) => { fn(); passed++; console.log('PASS ' + name); };
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze); Object.freeze(value);
  }
  return value;
};

check('registry 20 unique immutable IDs, names and arrays', () => {
  assert.equal(Object.keys(AWARD_REGISTRY).length, 20);
  assert.equal(getAwardDefinition('__proto__'), null);
  assert.equal(getAwardDefinition(null), null);
  assert(Object.isFrozen(AWARD_REGISTRY));
  assert.throws(() => { AWARD_REGISTRY.MVP.displayName = '改変'; }, TypeError);
  assert.throws(() => AWARD_REGISTRY.MVP.aliases.push('MVP'), TypeError);
});
for (const [label, league] of [['NPB','NPB'],['KBO','KBO'],['台湾プロ野球','CPBL'],['メジャーリーグ','MLB']]) {
  for (const entry of Object.values(AWARD_REGISTRY)) {
    for (const name of [entry.displayName, ...entry.aliases]) {
      check(`${league}/${name} exact identity (not an eligibility or grant assertion)`, () => {
        const raw = `2039 ${label}${name}`, got = parseAwardHonor(raw);
        assert.equal(got.status, 'RECOGNIZED');
        assert.equal(got.awardId, entry.awardId); assert.equal(got.league, league);
        assert.equal(got.year, 2039); assert.equal(got.originalText, raw);
        assert.equal(got.level, null); assert.equal(got.role, null);
        assert.equal(got.decisionVerified, false);
        assert.equal(got.historicalSettlement, 'HISTORICAL_UNKNOWN');
      });
    }
  }
}
for (const raw of [null, undefined, 42, {}, [], false]) {
  check('non-string retained safely: ' + String(raw), () => {
    const got = parseAwardHonor(raw); assert.equal(got.status, 'INVALID');
    assert.equal(got.originalText, raw);
  });
}
for (const raw of ['', 'NPB首位打者', '2039首位打者', '0000 NPB新人王', '2039 福岡新人王',
  '2039 MLB年間MVP', '2039 NPB年間MVP候補', '2039 NPB王', '2039 NPBオールスター',
  '2039 NPBオールスターゲーム(MVP)', '2039 NPB首位打者 ', '2039 NPB首位打者\n',
  '2039 NPB最優秀投手賞（沢村賞）', '2039 NPB最佳投手', '2039 NPB年度MVP',
  '2039 NPB打擊王', '2039 NPB全壘打王', '2039 NPB金手套', '2039 NPB澤村賞']) {
  check('unknown retained without fuzzy aliases: ' + JSON.stringify(raw), () => {
    const got = parseAwardHonor(raw, {trusted: true, org: 'NPB'});
    assert.equal(got.status, 'UNKNOWN'); assert.equal(got.originalText, raw);
    assert.equal(got.awardId, undefined);
  });
}
check('known context only; no current-team inference or mutation', () => {
  const context = freeze({level: 'NPB1', role: 'SP', org: 'MLB', orgTeamId: 'irrelevant'});
  const before = structuredClone(context);
  const got = parseAwardHonor('2039 NPB最優秀投手賞', context);
  assert.equal(got.league, 'NPB'); assert.equal(got.level, 'NPB1'); assert.equal(got.role, 'SP');
  assert.deepEqual(context, before);
  assert.equal(parseAwardHonor('2039 NPB新人王', {level: 'MLB'}).status, 'INVALID');
  assert.equal(parseAwardHonor('2039 NPB新人王', {role: 'unknown'}).status, 'INVALID');
  for (const context of [null, [], 3, {scope: 'unknown'}]) {
    assert.equal(parseAwardHonor('2039 NPB新人王', context).status, 'INVALID');
  }
});
check('other-module scope is explicit delegation, never guessed by name', () => {
  for (const scope of ['international','team','amateur']) {
    assert.equal(parseAwardHonor('2039 NPB年間MVP', {scope}).status, 'NOT_IN_SCOPE');
  }
  assert.equal(parseAwardHonor('2039 日本代表MVP').status, 'UNKNOWN');
});
check('legacy, P02, P08 separate; no historical conversions', () => {
  const source = freeze(['2039 NPB最優秀投手賞','2039 NPB最優秀防御率投手賞','2039 NPB沢村賞']);
  assert.deepEqual(buildAwardIdentityView(source).map(x => x.awardId),
    ['LEGACY_BEST_PITCHER','PITCH_ERA','PITCH_SAWAMURA']);
  assert.deepEqual(source, ['2039 NPB最優秀投手賞','2039 NPB最優秀防御率投手賞','2039 NPB沢村賞']);
});
check('semantic view alias merge; distinct year/league/ID retained; unknowns not deleted', () => {
  const honors = freeze(['2039 NPB最多奪三振','2039 NPB最多三振奪取投手賞',
    '2040 NPB最多奪三振','2039 KBO最多奪三振','2039 NPB年間MVP','謎','謎']);
  const before = structuredClone(honors), got = buildAwardIdentityView(honors);
  assert.equal(got.length, 6); assert.equal(got[0].originalTexts.length, 2);
  assert.deepEqual(got[0].originalTexts, honors.slice(0, 2));
  assert.notEqual(got[0].semanticKey, got[1].semanticKey);
  assert.notEqual(got[0].semanticKey, got[2].semanticKey);
  assert.deepEqual(honors, before); assert.deepEqual(buildAwardIdentityView(honors), got);
  assert(Object.isFrozen(got)); assert(Object.isFrozen(got[0].originalTexts));
  assert.throws(() => got[0].originalTexts.push('改変'), TypeError);
  assert.equal(buildAwardIdentityView(null).length, 0);
  assert.equal(buildAwardIdentityView(['2039 NPB年間MVP']).length, 1, 'separate player calls isolated');
});
check('incomplete/untrusted Decisions never accepted, including spoofed completion', () => {
  for (const decision of [null, [], undefined, {},
    {awardId:'MVP',year:2039,league:'NPB',awarded:true},
    {schemaVersion:1,awardId:'PITCH_SAWAMURA',year:2039,league:'NPB',ruleId:'p08-ip180-s3-b2-g95-v1',
      status:'COMMITTED',completed:true,awarded:true,trusted:true}]) {
    const before = structuredClone(decision);
    const got = identifyAwardDecision(freeze(decision));
    assert.equal(got.decisionVerified, false); assert.notEqual(got.status, 'RECOGNIZED');
    assert.deepEqual(decision, before);
  }
});
check('MVP, AVG, GoldGlove, exact All-Star annotation are distinct identities only', () => {
  const raw = ['年間MVP','首位打者','ゴールデングラブ賞','オールスターゲーム',
    'オールスターゲーム(ファン投票選出)'].map(n => '2039 NPB' + n);
  assert.deepEqual(buildAwardIdentityView(raw).map(x => x.awardId),
    ['MVP','BATTING_AVG','GOLD_GLOVE','ALL_STAR']);
  assert.equal(buildAwardIdentityView(raw)[3].originalTexts.length, 2);
});
check('pure queries leave frozen complete state/honors/RNG fields unchanged', () => {
  const state = freeze({seed:'identity-fixture',rngState:123,year:2039,org:'NPB',lv:'NPB1',
    honors:['2039 NPB首位打者'],traits:{glass:true,phoenix:false},pool:7,
    careerEarnings:50000000,ct:{annualSchedule:[{year:2039,paid:true,salary:50000000}]}});
  const before = structuredClone(state);
  for (let i = 0; i < 100; i++) buildAwardIdentityView(state.honors, {level: state.lv});
  assert.deepEqual(state, before);
});
check('frozen B1 product-isolation evidence retained; A does not wire identity consumers', () => {
  const base = '287dd1a00448add8563410659170aba0d8f2f012';
  const historical = JSON.parse(fs.readFileSync('docs/reviews/development-a/before-hashes.json', 'utf8'));
  const hash = value => createHash('sha256').update(value).digest('hex');
  assert.equal(hash(fs.readFileSync('docs/reviews/development-a/b1-snapshot/award-identity-policy.js')),
    '363c39186bbea9de4c9ce89ead3adfba8eeeb635292120d95c640b30e7cc02bf');
  assert.equal(hash(fs.readFileSync('docs/reviews/development-a/b1-snapshot/award-identity-policy.test.mjs')),
    '5b9c2a8a35808d92fa11a30e8fbed68e43420310826e28835b5bffe24175ffdd');
  const files = execFileSync('git', ['ls-tree','-r','--name-only',base,'docs/src'], {encoding:'utf8'}).trim().split('\n');
  for (const file of files) {
    const old = execFileSync('git',['show',`${base}:${file}`], {maxBuffer:20e6}).toString().replaceAll('\r\n','\n');
    const current = fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
    assert([hash(old), hash(old.replaceAll('\n', '\r\n'))].includes(historical[file]),
      file + ': historical B1 source unchanged (LF/CRLF only)');
    assert.equal(old.includes('award-identity-policy'), false, file + ' B1 not wired');
    // Current A may add Journal/checkpoints, not read-only consumer identity wiring.
    assert(!/\b(?:parseAwardHonor|buildAwardIdentityView|buildAwardIdentityEntries)\s*\(/.test(current),
      file + ': no premature B consumer identity wiring');
    if(!['docs/src/engine/game.js'].includes(file)) assert.equal(current, old, file + ': A scope unchanged');
  }
});

console.log(JSON.stringify({moduleCases:passed,FAIL:0}));

// Explicit opt-in actual browser careers; not hidden inside Quick or Full unit entry.
// Reuse the same existing native UI strategy, compare against accepted G1-A, not older
// pre-fix expectations. Every before/after source is independently replayed by the tool.
if (process.argv.includes('--careers')) {
  const outputArg = process.argv.find(a => a.startsWith('--output='));
  assert(outputArg, '--careers requires a fresh --output directory');
  const output = outputArg.slice(9); assert(!fs.existsSync(output), 'Do not overwrite prior evidence');
  const external = process.argv.filter(a => a.startsWith('--playwright=') || a.startsWith('--browser='));
  const baseline = '287dd1a00448add8563410659170aba0d8f2f012';
  const before = path.join(output,'before'), after = path.join(output,'after');
  const tool = 'docs/reviews/g1-a-validation/careers.mjs';
  execFileSync(process.execPath,[tool,'--mode=before',`--baseline=${baseline}`,`--output=${before}`,...external],
    {stdio:'inherit'});
  execFileSync(process.execPath,[tool,'--mode=after',`--baseline=${baseline}`,`--before-output=${before}`,
    `--before-if-output=${before}`,`--output=${after}`,...external], {stdio:'inherit'});
  for (const id of ['yakyo-test-001-P','jp3-pitcher-02-P','jp3-pitcher-03-P','jp3-infielder-01-IF']) {
    const old = JSON.parse(fs.readFileSync(path.join(before,id+'.career.json')));
    const current = JSON.parse(fs.readFileSync(path.join(after,id+'.career.json')));
    assert.deepEqual(current, old, id + ': complete S/honors/steps/RNG, no exclusions');
    // Also apply the new pure module to an actually generated frozen final state.
    const frozen = freeze(structuredClone(current.state));
    buildAwardIdentityView(frozen.honors); assert.deepEqual(frozen, current.state);
    console.log('PASS ZERO_RUNTIME_DIFFERENCE ' + id + ' actions=' + current.steps.length + ' RNG=' + current.rng.length);
  }
}
