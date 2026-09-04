import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFile(path.join(root, relative), 'utf8');

const [html, config, data, game, main, baseCss, themeCss] = await Promise.all([
  read('docs/index.html'),
  read('docs/src/config.js'),
  read('docs/src/data/jp-data.js'),
  read('docs/src/engine/game.js'),
  read('docs/src/main.js'),
  read('docs/styles/base.css'),
  read('docs/styles/jp-theme.css'),
]);

assert.match(html, /<link rel="stylesheet" href="\.\/styles\/base\.css">/);
assert.match(html, /<link rel="stylesheet" href="\.\/styles\/jp-theme\.css">/);
assert.match(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
assert.match(html, /<link rel="icon" type="image\/png" href="\.\/assets\/baseball-icon\.png">/);
assert.match(baseCss, /url\('\.\.\/assets\/baseball-icon\.png'\)/);
assert.doesNotMatch(html, /<style>/);
assert.equal((html.match(/<script/g) || []).length, 1);
assert.match(html, /href="https:\/\/x\.com\/dog_cat_150"[^>]*>犬猫（@dog_cat_150）<\/a>/);

assert.match(main, /import '\.\/engine\/game\.js';/);
assert.match(game, /import \{ VERSION \} from '\.\.\/config\.js';/);
assert.match(game, /import \{ JP_DATA \} from '\.\.\/data\/jp-data\.js';/);
assert.match(config, /VERSION = '1\.5\.2'/);
assert.doesNotMatch(config, /RNG_VERSION|RULES_VERSION/);
assert.match(game, /version:VERSION/);
assert.match(game, /fillText\(VERSION,W-PAD,H-40\)/);
assert.doesNotMatch(game, /rngVersion|rulesVersion/);
assert.doesNotMatch(html, /id="ver-badge"/);
assert.match(html, /<h1 id="logo-tap"><em>野球人生シミュレーター<\/em><span id="app-version"[^>]*><\/span><\/h1>/);
assert.doesNotMatch(html, /v1\.0\.0/);
assert.match(game, /appVersion\.textContent='v'\+VERSION/);

const forbidden = `${html}\n${config}\n${data}\n${game}\n${main}`;
assert.doesNotMatch(forbidden, /UNSUPPORTED_REPLAY_VERSION/);
assert.doesNotMatch(forbidden, /[?&]rv=/);
assert.doesNotMatch(forbidden, /[?&]rules=/);
assert.match(game, /base\+'\?seed='\+encodeURIComponent\(SEED\)/);
assert.match(game, /history\.replaceState\(null,'',`\?seed=\$\{encodeURIComponent\(SEED\)\}`\)/);

assert.equal((data.match(/"teamId"/g) || []).length, 90);
assert.equal((data.match(/"schoolId"/g) || []).length, 75);
assert.equal((data.match(/"eventKey"/g) || []).length, 2);
assert.match(themeCss, /日本版ライトレッドテーマ/);
assert.match(themeCss, /\.btn small\{color:#6f303d\}/);
assert.match(themeCss, /\.btn\.main small\{color:#fff4f5\}/);
assert.match(baseCss, /--bg:#fff8f8/);
assert.match(game, /const imageColor=\{bg:'#fff8f8'/);
assert.ok(baseCss.length > 8_000);

assert.equal((game.match(/cur>=66\?7:cur>=60\?4:cur>=55\?2:1/g) || []).length, 4);
assert.doesNotMatch(game, /cur>=66\?7:cur>=58\?4:cur>=55\?2:1/);

function fnv1a32(value) {
  let hash = 0x811C9DC5;
  for (const byte of new TextEncoder().encode(value)) {
    hash ^= byte;
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

let rngState = fnv1a32('v1:yakyo-test-001') || 0x6D2B79F5;
const random = () => {
  rngState = (rngState + 0x6D2B79F5) >>> 0;
  let value = rngState;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
};

assert.equal(rngState, 1527536498);
const actual = Array.from({ length: 5 }, random).map(value => value.toFixed(10));
assert.deepEqual(actual, [
  '0.9388780487',
  '0.6808669898',
  '0.9465476144',
  '0.2226050724',
  '0.3018500586',
]);
assert.equal(rngState, 2095430971);

console.log('Version 1.5.2 modularization static and RNG checks passed.');
