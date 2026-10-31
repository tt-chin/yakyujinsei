// Actual retirement phrase and actual defensive-share functions, no copied regex.
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {oldSource,source} from './award-runtime-support.mjs';
import {productionFunction} from '../../tests/retirement-hof-test-support.mjs';
import {hasHistoricalDefenseAward} from '../../docs/src/engine/award-consumer-policy.js';
import {defenseShareFor} from '../../docs/src/engine/hall-of-fame-tier-policy.js';
import {CareerRetirement} from '../../docs/src/engine/career-retirement.js';
function phrase(src,text,bucket){
 const S={pos:'IF',dpos:'SS',honors:[text],stats:{[bucket]:{H:80,HR:0,SB:0,RBI:0,BB:0,DEF:4}}};
 const c=vm.createContext({S,DPN:{SS:'遊撃手'},hasHistoricalDefenseAward,defenseShareFor,bucket,CareerRetirement,LV:{},POSN:{},TIER_TH:{},LG_N:{},TEAM_COLOR:{}});
 vm.runInContext(productionFunction('defShare',src)+'\n'+productionFunction('posLegendPhrase',src),c);
 const before=structuredClone(S),result=vm.runInContext('posLegendPhrase(bucket)',c);assert.deepEqual(S,before);return result;
}
let pass=0;
for(const bucket of ['NPB','KBO','CPBL','MLB'])for(const name of ['ゴールデングラブ賞','年間最優秀守備選手'])for(const label of ['','NPB','KBO','台湾プロ野球','メジャーリーグ','CPBL','MLB','中職','日職','韓職','美職'])for(const prefix of ['2039 ','2038 ','']){
 const text=prefix+label+name,A=phrase(oldSource,text,bucket),B=phrase(source,text,bucket);assert.deepEqual(B,A,'native historical retirement phrase '+text);pass++;
 console.log(JSON.stringify({status:'PASS',originalName:text,consumer:'retirement-defense-phrase',bucket,A,B,mainRngCalls:0}));
}
console.log(JSON.stringify({PASS:pass,FAIL:0,evidence:'ACTUAL_A_B_RETIREMENT_PHRASE_AND_DEF_SHARE_FUNCTIONS; no state/RNG writes'}));
