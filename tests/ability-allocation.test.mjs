import assert from 'node:assert/strict';
import fs from 'node:fs';
import { abilityPointCost, actualAbilitySpend, pointsRequiredToReach80 } from '../docs/src/engine/ability-allocation-policy.js';

assert.equal(actualAbilitySpend(1,10,100),1);
assert.equal(actualAbilitySpend(5,10,100),5);
assert.equal(actualAbilitySpend(5,3,100),3);
assert.equal(actualAbilitySpend(99,12,100),12);
assert.equal(actualAbilitySpend(99,12,4),4);
assert.equal(abilityPointCost(60,70,true),4);
assert.equal(abilityPointCost(70,70,true),28);
assert.equal(abilityPointCost(72,72,false),9);
assert.equal(pointsRequiredToReach80({current:79,potential:80,carry:0,isPitcher:true}),7);
assert.equal(pointsRequiredToReach80({current:79,potential:70,carry:3,isPitcher:true}),25);

const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const alloc=game.slice(game.indexOf('function allocUI'),game.indexOf('function nextStep'));
for(const text of ["'+1'","'+5'","'MAX'","'すべてリセット'",'beforeTouched','sessionStart'])assert.match(alloc,new RegExp(text.replace(/[+]/g,'\\+')));
assert.match(alloc,/restoreTouched\(entry\.beforeTouched\)/);
assert.match(alloc,/restoreTouched\(sessionStart\.touchedKeys\)/);
assert.match(alloc,/actualAbilitySpend\(requestedPoints,pool,pointsRequiredToReach80/);
assert.doesNotMatch(alloc,/\b(?:R|ri|pick|chance)\s*\(/);
assert.match(alloc,/if\(dice\)\{if\(!cap&&remaining\(\)>0\)r\.onclick/);
console.log('Ability allocation v1.6.0 checks passed.');
