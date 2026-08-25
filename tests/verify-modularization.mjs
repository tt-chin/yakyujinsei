import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relative => readFile(path.join(root, relative), 'utf8');

const [html, config, data, game, main, baseCss, themeCss] = await Promise.all([
  read('index.html'),
  read('src/config.js'),
  read('src/data/jp-data.js'),
  read('src/engine/game.js'),
  read('src/main.js'),
  read('styles/base.css'),
  read('styles/jp-theme.css'),
]);

assert.match(html, /<link rel="stylesheet" href="\.\/styles\/base\.css">/);
assert.match(html, /<link rel="stylesheet" href="\.\/styles\/jp-theme\.css">/);
assert.match(html, /<script type="module" src="\.\/src\/main\.js"><\/script>/);
assert.doesNotMatch(html, /<style>/);
assert.equal((html.match(/<script/g) || []).length, 1);

assert.match(main, /import '\.\/engine\/game\.js';/);
assert.match(game, /import \{ RNG_VERSION, RULES_VERSION \} from '\.\.\/config\.js';/);
assert.match(game, /import \{ JP_DATA \} from '\.\.\/data\/jp-data\.js';/);
assert.match(config, /RNG_VERSION = 1/);
assert.match(config, /RULES_VERSION = 'JP3'/);

const forbidden = `${html}\n${config}\n${data}\n${game}\n${main}`;
assert.doesNotMatch(forbidden, /UNSUPPORTED_REPLAY_VERSION/);
assert.doesNotMatch(forbidden, /[?&]rv=/);
assert.doesNotMatch(forbidden, /[?&]rules=/);
assert.match(game, /base\+'\?seed='\+encodeURIComponent\(SEED\)/);
assert.match(game, /history\.replaceState\(null,'',`\?seed=\$\{encodeURIComponent\(SEED\)\}`\)/);

assert.equal((data.match(/"teamId"/g) || []).length, 90);
assert.equal((data.match(/"schoolId"/g) || []).length, 75);
assert.equal((data.match(/"eventKey"/g) || []).length, 2);
assert.match(themeCss, /日本版ダークレッドテーマ/);
assert.ok(baseCss.length > 8_000);

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

console.log('JP3 modularization static and RNG checks passed.');
