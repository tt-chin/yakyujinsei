import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const navigation=fs.readFileSync(new URL('../docs/src/ui/navigation.js',import.meta.url),'utf8');
const record=fs.readFileSync(new URL('../docs/src/ui/record-view.js',import.meta.url),'utf8');
const player=fs.readFileSync(new URL('../docs/src/ui/player-detail.js',import.meta.url),'utf8');

for(const id of ['board','log','act-toggle','act'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} must be unique`);
for(const view of ['home','action','record','player'])assert.match(html,new RegExp(`data-main-panel="${view}"`));
for(const tab of ['achievements','contract','traits','yearly'])assert.match(html,new RegExp(`data-detail-tab="${tab}"`));
assert.match(html,/styles\/ui-navigation\.css/);
assert.match(game,/navigationController\(\)\?\.showAction\(\)/);
assert.match(game,/const navigation=initNavigation/);
for(const source of [navigation,record,player]){
  assert.doesNotMatch(source,/from ['"]\.\.\/engine\/game\.js['"]/);
  assert.doesNotMatch(source,/\b(?:R|ri|pick|chance)\s*\(/);
}
assert.doesNotMatch(navigation,/\b(?:localStorage|sessionStorage|indexedDB)\b/);
assert.doesNotMatch(game,/uiState\s*:/);
console.log('UI foundation static checks passed');
