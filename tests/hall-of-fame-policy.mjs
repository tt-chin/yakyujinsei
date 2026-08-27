import assert from 'node:assert/strict';

import { honorScoreFor } from '../docs/src/engine/hall-of-fame-policy.js';

const leagueNames = {
  CPBL: '台湾プロ野球',
  KBO: 'KBO',
  NPB: 'NPB',
  MLB: 'メジャーリーグ',
};
const departmentTitles = [
  '首位打者', '最高出塁率', '本塁打王', '盗塁王', '打点王',
  '最多セーブ', '最優秀中継ぎ', '最多奪三振', '最多勝', '最優秀防御率',
];

for (const [bucket, league] of Object.entries(leagueNames)) {
  for (const title of departmentTitles) {
    const score = honorScoreFor({ bucket, honors: [`2035 ${league}${title}`], position: 'B' });
    assert.equal(score.sc, 160, `${league}${title}`);
    assert.equal(score.king, 1, `${league}${title}の部門タイトル数`);
  }

  const ace = honorScoreFor({ bucket, honors: [`2035 ${league}最優秀投手賞`], position: 'P' });
  assert.deepEqual(ace, { sc: 460, mvp: 0, aceN: 1, king: 0 });
  for (const otherBucket of Object.keys(leagueNames).filter(value => value !== bucket)) {
    assert.equal(
      honorScoreFor({ bucket: otherBucket, honors: [`2035 ${league}最優秀投手賞`], position: 'P' }).sc,
      0,
      `${league}最優秀投手賞を${leagueNames[otherBucket]}へ混入させない`,
    );
  }

  const existing = honorScoreFor({
    bucket,
    honors: [
      `2035 ${league}年間MVP`,
      `2035 ${league}新人王`,
      `2035 ${league}ゴールデングラブ賞`,
      `2035 ${league}年間最優秀守備選手`,
      `2035 ${league}オールスターゲーム`,
    ],
    position: 'B',
  });
  assert.deepEqual(existing, { sc: 1120, mvp: 1, aceN: 0, king: 2 });
  assert.equal(honorScoreFor({ bucket, honors: [`2035 ${league}オールスターゲーム`], position: 'P' }).sc, 70);
}

const kboHonors = ['2035 KBO首位打者', '2035 KBO最優秀投手賞'];
assert.equal(honorScoreFor({ bucket: 'KBO', honors: kboHonors, position: 'P' }).sc, 620);
for (const bucket of ['CPBL', 'NPB', 'MLB']) {
  assert.equal(honorScoreFor({ bucket, honors: kboHonors, position: 'P' }).sc, 0, `${bucket}へKBO受賞を混入させない`);
}
for (const bucket of Object.keys(leagueNames)) {
  assert.equal(honorScoreFor({ bucket, honors: ['2035 最優秀投手賞'], position: 'P' }).sc, 0, 'リーグ不明賞を加点しない');
}

const intlHonors = ['2035 ワールド・ベースボール・クラシック優勝'];
assert.equal(honorScoreFor({ bucket: 'NPB', honors: intlHonors, position: 'B', intlCount: 2 }).sc, 360);
for (const bucket of ['CPBL', 'KBO', 'MLB']) {
  assert.equal(honorScoreFor({ bucket, honors: intlHonors, position: 'B', intlCount: 2 }).sc, 0, `${bucket}へ国際大会を加点しない`);
}

const moritaHonors = [
  'KBO新人王',
  ...Array(6).fill('KBOゴールデングラブ賞'),
  ...Array(4).fill('KBO首位打者'),
  ...Array(3).fill('KBO打点王'),
  ...Array(2).fill('KBO本塁打王'),
  ...Array(2).fill('KBO最高出塁率'),
  ...Array(6).fill('KBOオールスターゲーム'),
].map((honor, index) => `${2028 + index} ${honor}`);
const moritaHonorScore = honorScoreFor({ bucket: 'KBO', honors: moritaHonors, position: 'B' }).sc;
assert.equal(moritaHonorScore, 3940);
assert.equal(3691 + moritaHonorScore, 7631);
assert.ok(3691 + moritaHonorScore < 8200);

console.log('Hall of fame policy checks passed.');
