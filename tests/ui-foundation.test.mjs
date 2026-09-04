import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../docs/index.html',import.meta.url),'utf8');
const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const navigation=fs.readFileSync(new URL('../docs/src/ui/navigation.js',import.meta.url),'utf8');
const ability=fs.readFileSync(new URL('../docs/src/ui/ability-view.js',import.meta.url),'utf8');
const record=fs.readFileSync(new URL('../docs/src/ui/record-view.js',import.meta.url),'utf8');
const player=fs.readFileSync(new URL('../docs/src/ui/player-detail.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../docs/styles/ui-navigation.css',import.meta.url),'utf8');

for(const id of ['board','log','act-toggle','act'])assert.equal((html.match(new RegExp(`id="${id}"`,'g'))||[]).length,1,`${id} must be unique`);
for(const view of ['home','ability','record','player'])assert.match(html,new RegExp(`data-main-panel="${view}"`));
assert.doesNotMatch(html,/data-main-(?:view|panel)="action"|view-action|育成・行動/);
assert.ok(html.indexOf('id="act-toggle"')<html.indexOf('id="act"')&&html.indexOf('id="act"')<html.indexOf('id="log"'),'home DOM order must be act-toggle, act, log');
for(const tab of ['achievements','contract','traits','yearly'])assert.match(html,new RegExp(`data-detail-tab="${tab}"`));
assert.match(html,/styles\/ui-navigation\.css/);
assert.match(game,/const navigation=initNavigation/);
for(const source of [navigation,ability,record,player]){
  assert.doesNotMatch(source,/from ['"]\.\.\/engine\/game\.js['"]/);
  assert.doesNotMatch(source,/\b(?:R|ri|pick|chance)\s*\(/);
}
assert.doesNotMatch(navigation,/\b(?:localStorage|sessionStorage|indexedDB)\b/);
assert.doesNotMatch(game,/uiState\s*:/);
assert.match(css,/#main-nav\{position:sticky;top:var\(--board-height,0px\);z-index:19/);
assert.match(navigation,/ResizeObserver\(syncBoardHeight\)/);
assert.match(game,/createIncentiveTerms\(\{org:S\.org,annualSalary:annual\}\)/);
assert.match(game,/candidate=\{\.\.\.base,contractMult:\.9\*injury,annualSalary:annual\}/);
assert.match(navigation,/const uiState=\{activeMainView:'home',activeDetailTab:'achievements'\}/);
assert.doesNotMatch(navigation,/['"]action['"]|actionPending|actionExecuting|showAction|beginAction|completeAction/);
assert.match(navigation,/if\(view==='ability'\)renderAbility/);
assert.match(game,/b\.onclick=\(\)=>runWithResultView\(\(\)=>runChoiceAction/);
assert.match(game,/c\.onclick=\(\)=>runWithResultView\(\(\)=>\{ actClear\(\); allocDone/);
assert.match(game,/before=\$\('log'\)\.querySelectorAll\('\.card'\)\.length/);
assert.match(game,/onOpenAbility:buildAbilityViewModel/);
assert.match(game,/abilities:POS_AB\[S\.pos\]\.map/);
assert.doesNotMatch(ability,/\b(?:R|ri|pick|chance)\s*\(/);
assert.doesNotMatch(ability,/\.onclick|addEventListener|<button/);
console.log('UI foundation static checks passed');
