import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const html=read('../docs/index.html');
const game=read('../docs/src/engine/game.js');
const ability=read('../docs/src/ui/ability-view.js');
const record=read('../docs/src/ui/record-view.js');
const career=read('../docs/src/ui/player-detail.js');

assert.equal((html.match(/data-main-view=/g)||[]).length,3);
for(const label of ['ホーム','選手','キャリア'])assert.match(html,new RegExp(`>${label}<`));
assert.match(game,/statsByLevel:\{NPB1:null,NPB2:null,NPB_DEV:null,KBO1:null,KBO2:null,CPBL1:null,CPBL2:null,MLB:null,A3:null,A2:null,A1:null,R:null,IND:null,CORP:null\}/);
assert.match(game,/const levelKey=S\.lv,bucket=bucketOf\(levelKey\); accStat\(bucket,st\); accLevelStat\(levelKey,st\);/);
assert.match(game,/function addStatTotal\(t,st\)/);
const levelAccumulator=game.slice(game.indexOf('function accLevelStat'),game.indexOf('function statLine'));
assert.doesNotMatch(levelAccumulator,/\b(?:R|ri|pick|chance)\s*\(/);
assert.match(record,/階級別通算成績/);
for(const label of ['NPB一軍','NPB二軍','NPB育成','KBO一軍','KBOフューチャース','台湾プロ野球一軍','台湾プロ野球二軍','3A','2A','1A','ルーキーリーグ'])assert.match(game,new RegExp(label));
assert.doesNotMatch(ability,/能力[\s\S]*総合/);
assert.doesNotMatch(game,/\{label:'スタミナ',value:/);
assert.match(ability,/現在表示できる特性はありません。/);
assert.doesNotMatch(career,/現在年俸|年俸の内訳を見る|salary-detail-link/);
assert.doesNotMatch(record,/所属|表彰・主要実績|生涯総収入/);
assert.match(career,/生涯総収入/);
assert.match(game,/formatRehabStatus\(S\)/);
assert.match(game,/NPB_DEV:\{[^}]+statBucket:'NPB'/);
console.log('Information architecture v1.5.2 checks passed.');
