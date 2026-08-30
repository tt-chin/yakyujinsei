import assert from 'node:assert/strict';
import {hashToUnit,playerMarketCategory,rankTeamsByDemand,teamDemandMultiplier,teamDemandScore} from '../docs/src/engine/team-demand-policy.js';
assert.equal(playerMarketCategory({pos:'P',role:'SP'}),'SP');assert.equal(playerMarketCategory({pos:'P',role:'CL'}),'RP');assert.equal(playerMarketCategory({pos:'C'}),'C');assert.equal(playerMarketCategory({pos:'IF',dpos:'DH'}),'IF');assert.equal(playerMarketCategory({pos:'OF',dpos:'DH'}),'OF');
for(const pos of ['P','C','IF','OF'])assert.ok(['SP','RP','C','IF','OF'].includes(playerMarketCategory({pos,role:'MR'})));
const input={seed:'abc',year:2030,teamId:'NPB_A',category:'IF'};assert.equal(teamDemandScore(input),teamDemandScore(input));assert.ok(teamDemandScore(input)>=-2&&teamDemandScore(input)<=2);
assert.deepEqual([-2,-1,0,1,2].map(teamDemandMultiplier),[.95,.975,1,1.025,1.05]);assert.ok(hashToUnit('a',1,'T','OF')>=0&&hashToUnit('a',1,'T','OF')<1);
const ranked=rankTeamsByDemand({teams:[{teamId:'B',strength:'A'},{teamId:'A',strength:'S'},{teamId:'A',strength:'S'}],seed:'x',year:1,category:'SP'});assert.equal(ranked.length,2);assert.equal(new Set(ranked.map(x=>x.team.teamId)).size,2);
console.log('team demand policy tests passed');
