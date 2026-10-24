import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {AWARD_REGISTRY, getAwardDefinition, parseAwardHonor, identifyAwardDecision,
  buildAwardIdentityView} from '../docs/src/engine/award-identity-policy.js';

// Exact approved 1.13.4 display edits only; original B1/A snapshots stay unchanged.
const approvedIncomeEdits={"docs/src/ui/player-detail.js":[["    const section=panel('契約・収入'); const dl=document.createElement('dl'); dl.className='ui-data-list';","    const section=panel('契約・収入'); const dl=document.createElement('dl'); dl.className='ui-data-list income-summary';"],["    [['現契約',model.contract.description],['契約残年数',model.contract.remainingYears],['保証年俸総額',model.contract.guaranteedTotal],['年度別年俸',model.contract.schedule],['契約金累計',model.contract.signingBonus],['育成支度金累計',model.contract.developmentStipend],['ポスティング譲渡金',model.contract.postingFee],['今季スポンサー収入',model.contract.yearOutsideIncome],['スポンサー収入累計',model.contract.outsideIncome],['社会人給与累計',model.contract.corpIncome],['生涯総収入',model.contract.careerEarnings]].filter(([,val])=>val!==undefined).forEach(([label,val])=>{const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');if(Array.isArray(val)){const lines=document.createElement('div');lines.className='contract-yearly-salaries';val.forEach(text=>{const line=document.createElement('span');line.textContent=text;lines.appendChild(line);});dd.appendChild(lines);}else dd.textContent=val;dl.append(dt,dd);});","    [['現契約',model.contract.description],['契約残年数',model.contract.remainingYears],['保証年俸総額',model.contract.guaranteedTotal],['年度別年俸',model.contract.schedule],['ポスティング譲渡金',model.contract.postingFee],['今季スポンサー収入',model.contract.yearOutsideIncome],...(model.contract.incomeRows||[]).map(row=>[row.label,row.value])].filter(([,val])=>val!==undefined).forEach(([label,val])=>{const dt=document.createElement('dt');dt.textContent=label;const dd=document.createElement('dd');if(Array.isArray(val)){const lines=document.createElement('div');lines.className='contract-yearly-salaries';val.forEach(text=>{const line=document.createElement('span');line.textContent=text;lines.appendChild(line);});dd.appendChild(lines);}else dd.textContent=val;dl.append(dt,dd);});"]],"docs/src/ui/salary-detail.js":[["import { salaryReasonLabel } from '../engine/salary-explanation-policy.js';","import {incomeSummary} from './income-summary.js';\nimport { salaryReasonLabel } from '../engine/salary-explanation-policy.js';"],["  const open = () => { opener = documentRef.activeElement; const income=getIncome();body.innerHTML = salaryDetailMarkup(getDecision(), { fmtMoney, currentSalary:getCurrentSalary(), contract:getContract(), isProfessional:isProfessional() })+(income?`<h3>所得内訳</h3><dl><dt>契約金累計</dt><dd>${escapeHtml(fmtMoney(income.signing||0))}</dd><dt>育成支度金累計</dt><dd>${escapeHtml(fmtMoney(income.stipend||0))}</dd><dt>固定年俸累計</dt><dd>${escapeHtml(fmtMoney(income.base||0))}</dd><dt>出来高累計</dt><dd>${escapeHtml(fmtMoney(income.incentive||0))}</dd><dt>買い取り累計</dt><dd>${escapeHtml(fmtMoney(income.buyout||0))}</dd><dt>今季スポンサー収入</dt><dd>${escapeHtml(fmtMoney(income.yearOutside))}</dd><dt>スポンサー収入累計</dt><dd>${escapeHtml(fmtMoney(income.outside))}</dd><dt>社会人給与累計</dt><dd>${escapeHtml(fmtMoney(income.corp))}</dd><dt>生涯総収入</dt><dd>${escapeHtml(fmtMoney(income.total))}</dd></dl>`:''); panel.hidden = false; documentRef.body.classList.add('salary-detail-open'); (closeButton || title).focus(); };","  const open = () => {\n    opener = documentRef.activeElement;\n    const income=getIncome(),rows=income?incomeSummary({careerBaseSalary:income.base,corpIncome:income.corp,careerIncentive:income.incentive,careerSigningBonus:income.signing,careerDevelopmentStipend:income.stipend,careerBuyout:income.buyout,careerOutsideIncome:income.outside,careerEarnings:income.total}):[];\n    body.innerHTML = salaryDetailMarkup(getDecision(), { fmtMoney, currentSalary:getCurrentSalary(), contract:getContract(), isProfessional:isProfessional() })+(income?`<h3>所得内訳</h3><dl class=\"income-summary\"><dt>今季スポンサー収入</dt><dd>${escapeHtml(fmtMoney(income.yearOutside||0))}</dd>${rows.map(row=>`<dt>${row.label}</dt><dd>${escapeHtml(fmtMoney(row.amount))}</dd>`).join('')}</dl>`:'');\n    panel.hidden = false; documentRef.body.classList.add('salary-detail-open'); (closeButton || title).focus();\n  };"]]};
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
const snapshotHash=value=>createHash('sha256').update(value).digest('hex');
function snapshotText(buffer){
  const text=buffer.toString('utf8');
  assert.deepEqual(Buffer.from(text,'utf8'),buffer,'snapshot must be valid UTF-8');
  return text.replaceAll('\r\n','\n');
}
function assertFrozenSnapshot(working,frozen,expected){
  assert.equal(snapshotHash(frozen),expected,'original Git bytes must retain frozen hash');
  assert.equal(snapshotText(working),snapshotText(frozen),'working snapshot differs beyond LF/CRLF');
}
function exactReplacement(source,from,to){
  assert.equal(source.split(from).length,2,'approved overlay must match exactly once');
  return source.replace(from,to);
}
check('snapshot verifier accepts EOL only and rejects tampering',()=>{
  const original=Buffer.from('alpha\nbeta\n'),expected=snapshotHash(original);
  for(const text of ['alpha\nbeta\n','alpha\r\nbeta\r\n'])assertFrozenSnapshot(Buffer.from(text),original,expected);
  for(const text of ['Alpha\nbeta\n','alpha \nbeta\n','alpha\nbeta','alpha\rbeta\n'])
    assert.throws(()=>assertFrozenSnapshot(Buffer.from(text),original,expected));
  assert.throws(()=>assertFrozenSnapshot(original,Buffer.from('tampered'),expected));
  assert.throws(()=>assertFrozenSnapshot(Buffer.from([0xff]),original,expected));
});
check('frozen B1/A product-isolation evidence retained; B consumer contracts are separately tested', () => {
  const base = '287dd1a00448add8563410659170aba0d8f2f012';
  const historical = JSON.parse(fs.readFileSync('docs/reviews/development-a/before-hashes.json', 'utf8'));
  const hash = value => createHash('sha256').update(value).digest('hex');
  for(const [name,expected] of [
    ['award-identity-policy.js','363c39186bbea9de4c9ce89ead3adfba8eeeb635292120d95c640b30e7cc02bf'],
    ['award-identity-policy.test.mjs','5b9c2a8a35808d92fa11a30e8fbed68e43420310826e28835b5bffe24175ffdd']]){
    const file='docs/reviews/development-a/b1-snapshot/'+name;
    const frozen=execFileSync('git',['show','2a11a6444c643002d1c3143fd7827b94ce4ce2eb:'+file],{maxBuffer:20e6});
    assertFrozenSnapshot(fs.readFileSync(file),frozen,expected);
  }
  const files = execFileSync('git', ['ls-tree','-r','--name-only',base,'docs/src'], {encoding:'utf8'}).trim().split('\n');
  for (const file of files) {
    const old = execFileSync('git',['show',`${base}:${file}`], {maxBuffer:20e6}).toString().replaceAll('\r\n','\n');
    const acceptedA=execFileSync('git',['show','efd4710c4c5c366ff3aba69c59180031c82ff18a:'+file],{maxBuffer:20e6}).toString().replaceAll('\r\n','\n');
    assert([hash(old), hash(old.replaceAll('\n', '\r\n'))].includes(historical[file]),
      file + ': historical B1 source unchanged (LF/CRLF only)');
    assert.equal(old.includes('award-identity-policy'), false, file + ' B1 not wired');
    assert(!/\b(?:parseAwardHonor|buildAwardIdentityView|buildAwardIdentityEntries)\s*\(/.test(acceptedA),
      file + ': accepted A retained no premature B consumer identity wiring');
    if(file!=='docs/src/engine/game.js')assert.equal(acceptedA,old,file+': accepted A scope unchanged');
    const allowedB=new Set(['game.js','salary-evaluation-policy.js','salary-promotion-policy.js',
      'incentive-policy.js','hall-of-fame-policy.js','trait-policy.js','award-transaction-policy.js','season-payment-policy.js']);
    const current=fs.readFileSync(file,'utf8').replaceAll('\r\n','\n');
    if(file==='docs/src/config.js'){
      // G9 approved only the release literal; frozen B1/A snapshots remain untouched.
      assert.match(acceptedA,/^export const VERSION = '1\.12\.0';/);
      assert.equal(current,exactReplacement(acceptedA,"'1.12.0'","'1.13.5'"),file+': approved dev version literal only');
    }else if(file==='docs/src/main.js'){
      let expected=exactReplacement(acceptedA,"import { initializeDisplayPreferences } from './ui/preferences.js';",
        "import { initializeDisplayPreferences } from './ui/preferences.js';\nimport { initializeBoardMenu } from './ui/board-menu.js';\nimport { initializeInformationDialogs } from './ui/information-dialog.js';");
      expected=exactReplacement(expected,"document.getElementById('btn-start').disabled=false;",
        "document.getElementById('btn-start').disabled=false;\ninitializeBoardMenu();\ninitializeInformationDialogs();");
      assert.equal(current,expected,'main: exact approved UI wiring, no other edits');
      assert.throws(()=>assert.equal(current+'\n// unexpected',expected));
    }else if(file==='docs/src/ui/navigation.js'){
      let expected=exactReplacement(acceptedA,"import { renderRecord } from './record-view.js';",
        "import { renderRecord } from './record-view.js';\nimport { initializeDesktopOverview } from './desktop-overview.js';");
      expected=exactReplacement(expected,"export function initNavigation({documentRef=document,onOpenPlayer,onOpenCareer,onNavigate=()=>{}}){",
        "export function initNavigation({documentRef=document,onOpenPlayer,onOpenCareer,onNavigate=()=>{}}){\n  initializeDesktopOverview({documentRef,onOpenPlayer,onOpenCareer});");
      assert.equal(current,expected,'navigation: exact read-only overview wiring, no other edits');
    }else if(approvedIncomeEdits[file]){
      let expected=acceptedA;for(const [before,after] of approvedIncomeEdits[file])expected=exactReplacement(expected,before,after);
      assert.equal(current,expected,file+': exact approved income display, no other changes');
    }else if(!allowedB.has(path.basename(file)))assert.equal(current,acceptedA,file+': no unrelated B wiring');
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
