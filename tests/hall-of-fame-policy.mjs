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

for (const event of ['ワールド・ベースボール・クラシック', 'WBSCプレミア12']) {
  assert.equal(honorScoreFor({ bucket: 'NPB', honors: [`2035 ${event}優勝`], position: 'B' }).sc, 200);
  assert.equal(honorScoreFor({ bucket: 'NPB', honors: [`2035 ${event}準優勝`], position: 'B' }).sc, 100);
  assert.equal(honorScoreFor({ bucket: 'NPB', honors: [`2035 ${event}ベスト4`], position: 'B' }).sc, 0);
  assert.equal(honorScoreFor({ bucket: 'NPB', honors: [`2035 ${event}ベスト8`], position: 'B' }).sc, 0);
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

const hashikawaHonors = [
  ...Array(4).fill('NPB首位打者'),
  ...Array(2).fill('NPB打点王'),
  ...Array(2).fill('NPB本塁打王'),
  ...Array(5).fill('NPBオールスターゲーム'),
  'WBSCプレミア12優勝',
  'WBSCプレミア12準優勝',
  'ワールド・ベースボール・クラシックベスト4',
  'ワールド・ベースボール・クラシックベスト4',
].map((honor, index) => `${2030 + index} ${honor}`);
const hashikawaHonorScore = honorScoreFor({ bucket: 'NPB', honors: hashikawaHonors, position: 'B', intlCount: 4 }).sc;
assert.equal(hashikawaHonorScore, 2100);
assert.equal(Math.round(3157.6 + hashikawaHonorScore), 5258);
assert.ok(5258 < 5800);

console.log('Hall of fame policy checks passed.');
