import {restoreCompletedAwardProofs} from './award-transaction-policy.js';
import {validateSaveEnvelope} from './browser-save-codec.js';
// Restore data/methods only. No initialization, defaults, migration or RNG draw.
export function hydrateSavedState(envelope,{DATA,teamRec,teamDisplay,traitPresentation,authorization}){
 const validated=validateSaveEnvelope(envelope),state=validated.state;
 if(authorization)restoreCompletedAwardProofs(state,authorization,validated);else if(envelope.awardProofs.length)throw Error('SAVE_AUTH_REQUIRED');
 Object.defineProperty(state,'salary',{get(){return this.careerEarnings;},set(v){this.careerEarnings=v;},enumerable:false});
 Object.defineProperty(state,'orgTeam',{get(){return this.orgTeamId;},set(v){this.orgTeamId=teamRec(v)?v:(DATA.teams.find(t=>t.name===v)?.teamId||v);},enumerable:false});
 state.teamName=function(){return teamDisplay(this.orgTeamId,this.lv);};
 const birth=state.birthHighSchool;
 if(!birth||birth.schemaVersion!==1||birth.classificationSystem!=='JP_SABC'||!['S','A','B','C'].includes(birth.tier)||typeof birth.schoolId!=='string'||typeof birth.createdVersion!=='string')throw Error('SAVE_BIRTH_SCHOOL');
 const school=DATA.highSchools.find(row=>row.schoolId===birth.schoolId);if(!school||school.tier!==birth.tier)throw Error('SAVE_BIRTH_SCHOOL');
 Object.defineProperty(state,'birthHighSchool',{value:Object.freeze(birth),enumerable:true,writable:false,configurable:false});
 traitPresentation.set(state,new Set(Object.keys(state.traits).filter(k=>state.traits[k])));
 return state;
}
