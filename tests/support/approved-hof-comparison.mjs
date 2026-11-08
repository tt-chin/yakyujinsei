import assert from 'node:assert/strict';
import {assertSameCareer,findFirstDifference} from './first-difference.mjs';
const allowed=new Set(['rngState','hofInfo','legendLeague']);
export function assertApprovedHofRetirement({beforeOld,beforeNew,afterOld,afterNew,expectedNew,traceOld,traceNew,expectedTrace,evidence}){
 const old=structuredClone(beforeOld),now=structuredClone(beforeNew);
 // New technical provenance must be validated at its actual grant, never globally ignored.
 if(Object.hasOwn(now,'franchiseAchievement')&&!Object.hasOwn(old,'franchiseAchievement')){
  assert.equal(evidence.franchiseGrantVerified,true,'franchise provenance needs grant evidence');
  assertSameCareer(now.franchiseAchievement,evidence.franchiseGrant,'exact franchise provenance');delete now.franchiseAchievement;
 }
 assertSameCareer(now,old,'complete pre-retirement S');
 assertSameCareer(afterNew,expectedNew,'complete post-retirement S must equal approved-rule replay');
 assertSameCareer(traceNew,expectedTrace,'every retirement RNG draw/state must equal approved replay');
 const differing=[];
 for(const key of new Set([...Object.keys(afterOld),...Object.keys(afterNew)])){
  if(key==='franchiseAchievement'&&evidence.franchiseGrantVerified)continue;
  if(key==='traits'){
   for(const trait of new Set([...Object.keys(afterOld.traits),...Object.keys(afterNew.traits)])){
    if(afterOld.traits[trait]===afterNew.traits[trait])continue;
    assert.ok(['legend','smallschool','grinder'].includes(trait),'unapproved retirement trait '+trait);
    assert.ok(evidence.changedLeagues.length,'trait delta requires an approved scoring change');differing.push('traits.'+trait);
   }
  }else if(findFirstDifference(afterOld[key],afterNew[key])){
   assert.ok(allowed.has(key),'unapproved post-retirement state '+key);assert.ok(evidence.changedLeagues.length,'state delta requires scoring evidence');differing.push(key);
  }
 }
 let firstRngDifference=null;
 for(let index=0;index<Math.max(traceOld.length,traceNew.length);index++){
  const d=findFirstDifference(traceOld[index],traceNew[index]);
  if(d){firstRngDifference={index,path:d.path,before:traceOld[index]??null,after:traceNew[index]??null};break;}
 }
 if(firstRngDifference)assert.ok(evidence.changedLeagues.length,'RNG divergence without approved tier evidence');
 return {classification:differing.length||firstRngDifference?'EXPECTED_HOF_CHANGE':'STRICT_MATCH',differing,firstRngDifference,evidence,traceOld,traceNew};
}
