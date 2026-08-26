import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
  crossOfferTitle,
  crossOfferTypeForOrg,
  demotionChoiceText,
  findDemotionTarget,
  isBelowActiveMinimum,
} from '../docs/src/engine/career-policy.js';

const levels = {
  NPB_DEV: { n: 'NPB育成', min: 30 },
  NPB2: { n: 'NPB二軍', min: 47 },
  NPB1: { n: 'NPB一軍', min: 53 },
};
const npbPath = ['NPB_DEV', 'NPB2', 'NPB1'];

// 40歳・NPB育成・総合26：年齢にかかわらず強制引退し、進路選択へ進ませない。
assert.equal(isBelowActiveMinimum(26), true);
assert.equal(findDemotionTarget(npbPath, 0, 26, levels), null);
assert.doesNotMatch(demotionChoiceText(null, levels), /二軍降格/);

// 25歳・NPB育成・総合29：若手でも強制引退。
assert.equal(isBelowActiveMinimum(29), true);

// NPB育成・総合30：強制引退の境界外。下位階層がないため戦力外後の再起判定へ進む。
assert.equal(isBelowActiveMinimum(30), false);
assert.equal(findDemotionTarget(npbPath, 0, 30, levels), null);
assert.equal(demotionChoiceText(null, levels), '戦力外通告を受け、再起を目指す');

// NPB二軍：実際の遷移先である育成契約と表示を一致させる。
const fromNpb2 = findDemotionTarget(npbPath, 1, 35, levels);
assert.equal(fromNpb2, 'NPB_DEV');
assert.equal(demotionChoiceText(fromNpb2, levels), '育成契約への移行を受け入れ、再起を目指す');

// NPB一軍：二軍の最低基準を満たす場合だけ「二軍降格」と表示する。
const fromNpb1 = findDemotionTarget(npbPath, 2, 50, levels);
assert.equal(fromNpb1, 'NPB2');
assert.equal(demotionChoiceText(fromNpb1, levels), '二軍降格を受け入れ、再起を目指す');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const game = await readFile(path.join(root, 'docs/src/engine/game.js'), 'utf8');
const forcedCheck = game.indexOf('if(isBelowActiveMinimum(o)){');
const injuryYearCheck = game.indexOf("if(S.skipMid){ advance(); return; }");
const demotionCheck = game.indexOf('handleDemotion(o,path,idx)');
assert.ok(forcedCheck >= 0 && forcedCheck < injuryYearCheck && forcedCheck < demotionCheck);
assert.match(game, /retireBelowActiveMinimum\(\)/);
assert.match(game, /card\('bad','現役続行を断念','総合力が現役続行の最低基準を下回ったため、ユニフォームを脱ぐことを決断した。'\)/);
assert.doesNotMatch(game, /権限移譲を受け入れる/);
assert.match(game, /LV\[targetLevel\]\.n\+'への降格を受け入れる'/);

// NPBから海外、海外からNPBへの復帰を明示的な種別で区別する。
assert.equal(crossOfferTypeForOrg('NPB'), 'overseas_transfer');
assert.equal(crossOfferTitle(crossOfferTypeForOrg('NPB')), 'シーズン後の海外移籍オファー');
for (const org of ['KBO', 'CPBL', 'MiLB', 'MLB']) {
  assert.equal(crossOfferTypeForOrg(org), 'npb_return');
  assert.equal(crossOfferTitle(crossOfferTypeForOrg(org)), 'NPB復帰オファー');
}
assert.equal(crossOfferTypeForOrg('OTHER'), 'transfer');
assert.equal(crossOfferTitle('transfer'), '移籍オファー');
assert.match(game, /t:`NPBへ復帰：\$\{rec\.name\}`/);
assert.match(game, /signTo\('NPB',lv,rec\.teamId,ri\(1,3\),1\);finish\(\)/);
assert.match(game, /t:'現在の球団に残留',main:true,f:finish/);

console.log('Career movement policy checks passed.');
