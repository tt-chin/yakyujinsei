import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {execFileSync} from 'node:child_process';
import * as defensePolicy from '../docs/src/engine/defense-position-policy.js';
import * as abilityPolicy from '../docs/src/engine/ability-evaluation-policy.js';

const game=fs.readFileSync(new URL('../docs/src/engine/game.js',import.meta.url),'utf8');
const alloc=game.slice(game.indexOf('function allocUI'),game.indexOf('function nextStep'));
for(const text of ["'すべてリセット'",'beforeTouched','sessionStart','beforeDiceIndex'])assert.match(alloc,new RegExp(text));
assert.doesNotMatch(alloc,/abrow-actions|data-alloc-action|\['\+1'|'\+5'|'MAX'/);
assert.doesNotMatch(game,/actualAbilitySpend|pointsRequiredToReach80|ability-allocation-policy/);
assert.match(alloc,/const spend=dice\?dice\[idx\]:1/);
assert.match(alloc,/r\.onclick=allocate/);
assert.match(alloc,/event\.key==='Enter'\|\|event\.key===' '/);
assert.match(alloc,/aria-disabled/);
assert.match(alloc,/restoreTouched\(entry\.beforeTouched\)/);
assert.match(alloc,/restoreTouched\(sessionStart\.touchedKeys\)/);
assert.match(alloc,/idx=sessionStart\.diceIndex/);
assert.match(alloc,/hist=\[\];render\(\);board\(0\)/);
assert.match(alloc,/reset\.disabled=!hist\.length/);
assert.doesNotMatch(alloc,/\b(?:R|ri|pick|chance)\s*\(/);
assert.match(game,/cur>=66\?7:cur>=60\?4:cur>=55\?2:1/);
assert.match(game,/if\(cur>=pk\)cost\*=isP\?4:3/);
// OOP §2l phase 10: f4a2894 toolGap/ovr/playerType/abCost vs current wrappers + ability-evaluation-policy.
const abBaseline=execFileSync('git',['show','f4a289422e76591b17106ec07cf87c61170fa246:docs/src/engine/game.js'],{encoding:'utf8'});
const abBlock=source=>[/^function dpScore\(.*$/m.exec(source)[0],source.slice(source.indexOf('function toolGap('),source.indexOf('function tjAccrue(')),source.slice(source.indexOf('function ovr('),source.indexOf('function addAb('))].join('\n');
const abContext=source=>{const c=vm.createContext({...defensePolicy,...abilityPolicy,S:null});vm.runInContext(abBlock(source)+'\nconst run=f=>{try{return f();}catch(e){return "E:"+e.constructor.name+":"+e.message;}};function cell(keys){const before=JSON.stringify(S),r={ovr:run(ovr),type:run(playerType),gap:run(toolGap),cost:keys.map(k=>run(()=>abCost(k)))};return JSON.stringify({r,unchanged:before===JSON.stringify(S)});}',c);return c;};
const abOld=abContext(abBaseline),abNew=abContext(game);
assert.match(abBlock(abBaseline),/const a=S\.ab;/);assert.match(abBlock(game),/return overallRatingFor\(/);
const abKeys=['sta','vel','ctl','brk','con','pow','spd','eye','rng','fld','arm','cat'],abUniform=v=>Object.fromEntries(abKeys.map(k=>[k,v]));
const abCell=(c,state)=>{c.S=structuredClone(state);return c.cell(abKeys);};
let abSeed=20261024;const abNext=()=>(abSeed=(Math.imul(abSeed,1664525)+1013904223)>>>0)%46+30;
const abAbilities=[51,52,53,57,58,59,60,61,62,63].map(abUniform)
  .concat([57,58,59].flatMap(cat=>[8,7].map(d=>({...abUniform(cat-d),cat}))))
  .concat([60,62].flatMap(m=>[61,62,63].map(sta=>({...abUniform(40),vel:m,ctl:m-5,brk:m-10,sta}))))
  .concat([{...abUniform(40),vel:50,ctl:55,brk:60},{...abUniform(40),vel:50,ctl:60,brk:55},{...abUniform(40),pow:63,con:60},{...abUniform(40),pow:64,con:60}])
  .concat([{...abUniform(40),eye:65},{...abUniform(40),spd:65},{...abUniform(40),rng:65,fld:65,arm:65,cat:65}])
  .concat(Array.from({length:24},()=>Object.fromEntries(abKeys.map(k=>[k,abNext()]))));
const abDpos=[undefined,null,'SS','2B','3B','CF','RF','LF','C','1B','DH','XX'];
const abTraits=[undefined,{},{yips:true},{onetool:true},{yips:true,onetool:true}].flatMap(traits=>[undefined,'代打'].map(toolRole=>({traits,toolRole})));
let abCells=0;const abTypes=new Set(),abRoles=new Set();
for(const pos of ['P','C','IF','OF'])for(const dpos of abDpos)for(const {traits,toolRole} of abTraits)for(const ab of abAbilities){
  const state={pos,dpos,traits,toolRole,ab},A=abCell(abOld,state);
  assert.equal(abCell(abNew,state),A,`ability evaluation equivalence ${JSON.stringify(state)}`);const a=JSON.parse(A);assert.ok(a.unchanged);abTypes.add(a.r.type);abRoles.add(a.r.gap.role);abCells++;}
for(const pos of ['P','C','IF','OF'])for(const key of abKeys)for(const cur of [54,55,56,59,60,61,63,64,65,66,67,71,72,73])for(const pot of [undefined,{},{[key]:0},{[key]:cur-1},{[key]:cur},{[key]:cur+1}]){
  const state={pos,dpos:null,traits:{},ab:{...abUniform(50),[key]:cur},pot},A=abCell(abOld,state);
  assert.equal(abCell(abNew,state),A,`ability step cost equivalence ${JSON.stringify(state)}`);assert.ok(JSON.parse(A).unchanged);abCells++;}
assert.equal(abCells,4*abDpos.length*abTraits.length*abAbilities.length+4*abKeys.length*14*6,'ability evaluation equivalence cell count');
for(const label of ['期待の若手','鉄腕','剛腕','変化球の魔術師','精密機械','リードの達人','大砲タイプ','安打製造機','選球眼の鬼','韋駄天','守備職人','オールラウンダー','代打ユーティリティー'])assert.ok(abTypes.has(label),label);
assert.deepEqual([...abRoles].sort(),['代打','代走','守備固め'].sort());
const abPitcher=JSON.parse(abCell(abNew,{pos:'P',dpos:undefined,traits:undefined,ab:abUniform(60)})).r;assert.equal(typeof abPitcher.ovr,'number');assert.match(abPitcher.type,/^E:TypeError:/);
console.log('Ability allocation v1.6.1 checks passed.');
